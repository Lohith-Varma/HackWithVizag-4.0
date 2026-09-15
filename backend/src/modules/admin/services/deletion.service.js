import mongoose from "mongoose";
import { deleteStoredFile } from "../../../services/storage.service.js";
import User from "../../auth/models/user.model.js";
import OfflineRegistration from "../../offlineRegistration/models/offlineRegistration.model.js";
import Project from "../../projects/models/project.model.js";
import Submission from "../../submissions/models/submission.model.js";
import Team from "../../teams/models/team.model.js";
import AuditLog from "../models/auditLog.model.js";
import ApiError from "../../../utils/apiError.js";

const sessionOptions = (session) => (session ? { session } : {});

const requestMetadata = (req) => ({
  ip: String(req.ip || req.socket?.remoteAddress || "").slice(0, 100),
  userAgent: String(req.get?.("user-agent") || "").slice(0, 500),
  requestId: String(req.get?.("x-request-id") || "").slice(0, 200),
});

const actorSnapshot = async (req) => {
  const actor = req.user?.id ? await User.findById(req.user.id).select("email").lean() : null;
  return {
    actorAdminId: req.user?.id || null,
    actorAdminEmail: actor?.email || "",
    requestMetadata: requestMetadata(req),
  };
};

const supportsTransactions = async () => {
  const db = mongoose.connection.db;
  if (!db) return false;
  try {
    const hello = await db.admin().command({ hello: 1 });
    return Boolean(hello.logicalSessionTimeoutMinutes && (hello.setName || hello.msg === "isdbgrid"));
  } catch {
    return false;
  }
};

const runDatabaseWork = async (work) => {
  if (!(await supportsTransactions())) {
    return work(null);
  }

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
};

const writeFailureAudit = async ({ req, action, targetType, targetId, targetLabel = "", error }) => {
  try {
    await AuditLog.create({
      action,
      ...(await actorSnapshot(req)),
      targetType,
      targetId: String(targetId),
      targetLabel,
      result: "FAILED",
      reason: String(error?.message || "Deletion failed").slice(0, 1000),
    });
  } catch (auditError) {
    console.error(`[audit] writeFailed action=${action} target=${targetId} message=${auditError.message}`);
  }
};

const cleanupFiles = async (files) => {
  const failures = [];
  for (const entry of files) {
    if (!entry.file?.storagePath && !entry.file?.url && !entry.file?.path && !entry.file?.filename) continue;
    try {
      await deleteStoredFile(entry.file, {
        legacyFolder: entry.legacyFolder,
        allowLegacyDelete: true,
      });
    } catch (error) {
      failures.push({
        kind: entry.kind,
        storageProvider: entry.file?.storageProvider || "legacy",
        bucket: entry.file?.bucket || "",
        storagePath: entry.file?.storagePath || entry.file?.path || entry.file?.filename || "",
        error: error.message,
      });
    }
  }
  return failures;
};

export const deleteTeamSafely = async ({ teamId, confirmation, req }) => {
  let teamSnapshot;
  let auditLogId;
  try {
    const team = await Team.findById(teamId).lean();
    if (!team) throw new ApiError(404, "Team not found");
    teamSnapshot = team;
    if (String(confirmation || "").trim() !== team.teamName) {
      throw new ApiError(400, "Type the exact team name to confirm deletion");
    }

    const [project, offlineRegistration] = await Promise.all([
      Project.findOne({ team: team._id }).lean(),
      OfflineRegistration.findOne({ team: team._id }).lean(),
    ]);
    const ownedFiles = [
      { kind: "PPT", file: project?.pptFile, legacyFolder: "ppt" },
      { kind: "SUPPORTING_DOCUMENT", file: project?.supportingDocFile, legacyFolder: "docs" },
      { kind: "PAYMENT_SCREENSHOT", file: offlineRegistration?.paymentScreenshot, legacyFolder: "payment-proofs" },
    ];
    const actor = await actorSnapshot(req);
    const pendingAudit = await AuditLog.create({
      action: "TEAM_DELETED",
      ...actor,
      targetType: "TEAM",
      targetId: team._id.toString(),
      targetLabel: team.teamName,
      result: "PENDING_STORAGE",
      details: { ownedFileCount: ownedFiles.filter((entry) => entry.file).length },
    });
    auditLogId = pendingAudit._id;

    const databaseResult = await runDatabaseWork(async (session) => {
      const options = sessionOptions(session);
      // Ordered execution is deliberate for standalone MongoDB deployments; a
      // failure stops the remaining cascade and is recorded instead of hidden.
      const submissionDelete = await Submission.deleteMany({ team: team._id }, options);
      const projectDelete = await Project.deleteMany({ team: team._id }, options);
      const offlineDelete = await OfflineRegistration.deleteMany({ team: team._id }, options);
      const userUpdate = await User.updateMany(
        { team: team._id },
        { $set: { team: null } },
        options
      );
      const deletedTeam = await Team.findOneAndDelete({ _id: team._id }, options);
      if (!deletedTeam) throw new ApiError(404, "Team not found");

      const counts = {
        teams: 1,
        projects: projectDelete.deletedCount || 0,
        submissions: submissionDelete.deletedCount || 0,
        offlineRegistrations: offlineDelete.deletedCount || 0,
        usersPreserved: userUpdate.matchedCount || 0,
      };
      await AuditLog.findByIdAndUpdate(auditLogId, { $set: { "details.counts": counts } }, options);
      return { counts, auditLogId };
    });

    const cleanupFailures = await cleanupFiles(ownedFiles);
    await AuditLog.findByIdAndUpdate(databaseResult.auditLogId, {
      $set: {
        result: cleanupFailures.length ? "PARTIAL_FAILURE" : "SUCCESS",
        reason: cleanupFailures.length ? "Database cascade completed, but one or more owned files could not be removed" : "",
        "details.storageCleanupFailures": cleanupFailures,
      },
    });

    if (cleanupFailures.length) {
      throw new ApiError(502, "Team data was deleted, but storage cleanup was incomplete. The failure was recorded in the audit log.");
    }
    return databaseResult;
  } catch (error) {
    if (auditLogId && error.statusCode !== 502) {
      await AuditLog.findByIdAndUpdate(auditLogId, {
        $set: {
          action: "TEAM_DELETE_FAILED",
          result: "FAILED",
          reason: String(error?.message || "Deletion failed").slice(0, 1000),
        },
      }).catch((auditError) => console.error(`[audit] failureUpdateFailed message=${auditError.message}`));
    } else if (error.statusCode !== 502) {
      await writeFailureAudit({
        req,
        action: "TEAM_DELETE_FAILED",
        targetType: "TEAM",
        targetId: teamId,
        targetLabel: teamSnapshot?.teamName || "",
        error,
      });
    }
    throw error;
  }
};

export const deleteUserSafely = async ({ userId, confirmation, req }) => {
  let userSnapshot;
  let auditLogId;
  try {
    const user = await User.findById(userId).lean();
    if (!user) throw new ApiError(404, "User not found");
    userSnapshot = user;
    if (String(confirmation || "").trim().toLowerCase() !== user.email.toLowerCase()) {
      throw new ApiError(400, "Type the exact user email to confirm deletion");
    }
    if (user.role === "admin") {
      throw new ApiError(409, "Admin accounts cannot be deleted from this interface");
    }

    const [membership, submittedRecord] = await Promise.all([
      Team.findOne({ $or: [{ _id: user.team }, { leader: user._id }, { members: user._id }] })
        .select("teamName leader members")
        .lean(),
      Submission.findOne({ submittedBy: user._id }).select("team").lean(),
    ]);
    if (membership || submittedRecord) {
      const role = membership?.leader?.toString() === user._id.toString() ? "Team Leader" : "Team Member";
      const error = new ApiError(409, membership
        ? `This user belongs to team \"${membership.teamName}\" as ${role}. Delete the team first.`
        : "This user is referenced by a project submission and cannot be deleted safely.");
      error.errors = [{
        field: "team",
        message: error.message,
        teamId: membership?._id?.toString() || submittedRecord?.team?.toString() || "",
        teamName: membership?.teamName || "",
        role,
      }];
      throw error;
    }

    const actor = await actorSnapshot(req);
    const pendingAudit = await AuditLog.create({
      action: "USER_DELETED",
      ...actor,
      targetType: "USER",
      targetId: user._id.toString(),
      targetLabel: user.email,
      result: "PENDING_STORAGE",
    });
    auditLogId = pendingAudit._id;
    const databaseResult = await runDatabaseWork(async (session) => {
      const options = sessionOptions(session);
      await Team.updateMany({ reviewedBy: user._id }, { $set: { reviewedBy: null } }, options);
      const deletedUser = await User.findOneAndDelete({ _id: user._id, role: { $ne: "admin" } }, options);
      if (!deletedUser) throw new ApiError(404, "User not found or protected");
      return { auditLogId };
    });

    const profilePhotoFile = user.profilePhotoFile?.storagePath
      ? user.profilePhotoFile
      : (user.profilePhoto ? { url: user.profilePhoto } : null);
    const cleanupFailures = await cleanupFiles([
      { kind: "PROFILE_PHOTO", file: profilePhotoFile, legacyFolder: "profile" },
    ]);
    await AuditLog.findByIdAndUpdate(databaseResult.auditLogId, {
      $set: {
        result: cleanupFailures.length ? "PARTIAL_FAILURE" : "SUCCESS",
        reason: cleanupFailures.length ? "User was deleted, but the profile photo could not be removed" : "",
        "details.storageCleanupFailures": cleanupFailures,
      },
    });
    if (cleanupFailures.length) {
      throw new ApiError(502, "User was deleted, but profile-photo cleanup was incomplete. The failure was recorded in the audit log.");
    }
    return databaseResult;
  } catch (error) {
    if (auditLogId && error.statusCode !== 502) {
      await AuditLog.findByIdAndUpdate(auditLogId, {
        $set: {
          action: "USER_DELETE_FAILED",
          result: "FAILED",
          reason: String(error?.message || "Deletion failed").slice(0, 1000),
        },
      }).catch((auditError) => console.error(`[audit] failureUpdateFailed message=${auditError.message}`));
    } else if (error.statusCode !== 502) {
      await writeFailureAudit({
        req,
        action: "USER_DELETE_FAILED",
        targetType: "USER",
        targetId: userId,
        targetLabel: userSnapshot?.email || "",
        error,
      });
    }
    throw error;
  }
};

export { requestMetadata };
