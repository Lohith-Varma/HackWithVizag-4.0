import mongoose from "mongoose";
import User from "../../auth/models/user.model.js";
import Team from "../models/team.model.js";
import Project from "../../projects/models/project.model.js";
import Submission from "../../submissions/models/submission.model.js";
import ApiError from "../../../utils/apiError.js";

const userFields = "name email phone role status college collegeName department year gender resumeUrl githubUrl linkedinUrl portfolioUrl profilePhoto createdAt";

export const getUserTeam = async (userId) => {
  const team = await Team.findOne({
    $or: [{ leader: userId }, { members: userId }],
  })
    .populate("leader", userFields)
    .populate("members", userFields)
    .populate("reviewedBy", "name email");

  if (!team) {
    return { team: null, project: null, submission: null, registrationId: null };
  }

  const [project, submission] = await Promise.all([
    Project.findOne({ team: team._id }).populate("problemStatementId"),
    Submission.findOne({ team: team._id }),
  ]);

  const registrationId = submission
    ? `HWV-2026-${submission._id.toString().slice(-6).toUpperCase()}`
    : `HWV-2026-${team._id.toString().slice(-6).toUpperCase()}`;

  return {
    team,
    project,
    submission,
    registrationId,
  };
};

export const createTeamForUser = async (userId, { teamName }) => {
  const existingTeam = await Team.findOne({
    $or: [{ leader: userId }, { members: userId }],
  });

  if (existingTeam) {
    throw new ApiError(409, "You are already part of a team");
  }

  const team = await Team.create({
    teamName,
    leader: userId,
    members: [userId],
  });

  return team.populate("leader members", userFields);
};

export const addMemberToTeam = async (teamId, leaderId, { email }) => {
  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    throw new ApiError(400, "Invalid team id");
  }

  const team = await Team.findById(teamId);

  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  if (team.leader.toString() !== leaderId) {
    throw new ApiError(403, "Only the team leader can add members");
  }

  if (team.currentStatus !== "pending") {
    throw new ApiError(409, "Team members cannot be changed after review has started");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role !== "participant") {
    throw new ApiError(400, "Only participants can be added to teams");
  }

  const userTeam = await Team.findOne({
    _id: { $ne: team._id },
    members: user._id,
  });

  if (userTeam) {
    throw new ApiError(409, "User is already part of another team");
  }

  if (!team.members.some((member) => member.toString() === user._id.toString())) {
    team.members.push(user._id);
    await team.save();
  }

  return team.populate("leader members", userFields);
};

export const getTeamById = async (teamId, requestingUser = null) => {
  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    throw new ApiError(400, "Invalid team id");
  }

  const team = await Team.findById(teamId)
    .populate("leader", userFields)
    .populate("members", userFields)
    .populate("reviewedBy", "name email");

  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  // Security Access Control: Verify ownership if participant
  if (requestingUser && requestingUser.role !== "admin") {
    const isLeader = team.leader?._id?.toString() === requestingUser.id || team.leader?.toString() === requestingUser.id;
    const isMember = Array.isArray(team.members) && team.members.some((m) => (m._id || m).toString() === requestingUser.id);
    if (!isLeader && !isMember) {
      throw new ApiError(403, "You do not have permission to view this team's details");
    }
  }

  const [project, submission] = await Promise.all([
    Project.findOne({ team: team._id }).populate("problemStatementId"),
    Submission.findOne({ team: team._id }),
  ]);

  const registrationId = submission
    ? `HWV-2026-${submission._id.toString().slice(-6).toUpperCase()}`
    : `HWV-2026-${team._id.toString().slice(-6).toUpperCase()}`;

  return {
    team,
    project,
    submission,
    registrationId,
  };
};

