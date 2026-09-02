import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../utils/apiResponse.js";
import ApiError from "../../../utils/apiError.js";
import Team from "../../teams/models/team.model.js";
import Project from "../../projects/models/project.model.js";
import Submission from "../models/submission.model.js";
import User from "../../auth/models/user.model.js";
import Event from "../../events/models/event.model.js";
import {
  finalSubmitProject,
  getSubmissionForUser,
  reviewProjectSubmission,
} from "../services/submission.service.js";

export const getMySubmission = asyncHandler(async (req, res) => {
  const submission = await getSubmissionForUser(req.user.id);

  return sendSuccess(res, 200, "Submission fetched successfully", { submission });
});

export const reviewSubmission = asyncHandler(async (req, res) => {
  const review = await reviewProjectSubmission(req.params.projectId, req.user.id);

  return sendSuccess(res, 200, "Submission review data fetched successfully", review);
});

export const finalSubmit = asyncHandler(async (req, res) => {
  const submission = await finalSubmitProject(req.params.projectId, req.user.id);

  return sendSuccess(res, 200, "Project submitted successfully", { submission });
});

export const submitFullRegistration = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const activeEvent = await Event.findOne({ activeEvent: true });
  const minAbstractWords = activeEvent?.minAbstractWords || 50;
  const maxAbstractWords = activeEvent?.maxAbstractWords || 500;
  const minTeamSize = activeEvent?.minTeamSize || 1;
  const maxTeamSize = activeEvent?.maxTeamSize || 4;

  const bodyData = req.body.payload ? JSON.parse(req.body.payload) : req.body;
  const { personal, team: teamData, project: projectData } = bodyData;

  if (!personal || !teamData || !projectData) {
    throw new ApiError(400, "Missing required registration payload sections");
  }

  // GitHub repository link validation
  if (!projectData.githubRepository || !String(projectData.githubRepository).trim()) {
    throw new ApiError(400, "GitHub repository link is required");
  }
  const githubRepoPattern = /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/?$/i;
  if (!githubRepoPattern.test(String(projectData.githubRepository).trim())) {
    throw new ApiError(400, "Enter a valid GitHub repository URL (e.g. https://github.com/username/repository)");
  }

  // Abstract word count validation
  const wordCount = projectData.abstract
    ? projectData.abstract.trim().split(/\s+/).filter(Boolean).length
    : 0;
  if (wordCount < minAbstractWords || wordCount > maxAbstractWords) {
    throw new ApiError(
      400,
      `Abstract must be between ${minAbstractWords} and ${maxAbstractWords} words. Current count: ${wordCount}`
    );
  }

  // Check if authenticated user already belongs to a registered team
  const existingUserTeam = await Team.findOne({
    $or: [{ leader: userId }, { members: userId }],
  });
  if (existingUserTeam) {
    throw new ApiError(409, "You are already registered with a team.");
  }

  // Member count check: Must be strictly 3 or 4
  const memberList = Array.isArray(teamData.members) ? teamData.members : [];
  const totalMembers = 1 + memberList.length; // Leader + additional members
  if (totalMembers !== 3 && totalMembers !== 4) {
    throw new ApiError(
      400,
      `Team size must be exactly 3 or 4 members (1 Team Leader + 2 or 3 Members). Current count: ${totalMembers}`
    );
  }

  // Duplicate team name validation
  const existingTeamWithName = await Team.findOne({
    teamName: new RegExp(`^${teamData.teamName.trim()}$`, "i"),
  });
  if (existingTeamWithName) {
    throw new ApiError(409, `Team name "${teamData.teamName}" is already registered by another team.`);
  }

  // Update profile & social fields of leader user
  const leaderUser = await User.findByIdAndUpdate(
    userId,
    {
      name: personal.fullName || personal.name || req.user.name,
      phone: personal.phone,
      college: personal.collegeName || personal.college,
      collegeName: personal.collegeName || personal.college,
      registeredNumber: personal.registeredNumber || personal.regNo || "",
      department: personal.department,
      year: personal.year === "Final Year" ? "4th Year" : (personal.year || ""),
      gender: personal.gender || "",
      resumeUrl: personal.resumeUrl || personal.resume || "",
      githubUrl: personal.githubUrl || personal.github || "",
      linkedinUrl: personal.linkedinUrl || personal.linkedin || "",
      portfolioUrl: personal.portfolioUrl || personal.portfolio || "",
    },
    { new: true }
  );

  const leaderCollege = (leaderUser?.collegeName || leaderUser?.college || personal.collegeName || personal.college || "").trim().toLowerCase();
  const leaderEmail = (leaderUser?.email || req.user.email || personal.email || "").toLowerCase().trim();

  // Validate member uniqueness & check for existing team memberships
  const seenEmails = new Set([leaderEmail]);
  const memberUserIds = [userId];

  for (const m of memberList) {
    if (!m) continue;
    const memberEmail = (m.email || "").toLowerCase().trim();
    if (!memberEmail) {
      throw new ApiError(400, "All team members must have a valid email address.");
    }

    if (seenEmails.has(memberEmail)) {
      throw new ApiError(400, `Duplicate member email "${memberEmail}". Each team member must have a unique email.`);
    }
    seenEmails.add(memberEmail);

    // Check if member email belongs to an existing user
    let memberUser = await User.findOne({ email: memberEmail });
    if (memberUser) {
      // Check if this existing user is already registered with a team
      const memberExistingTeam = await Team.findOne({
        $or: [{ leader: memberUser._id }, { members: memberUser._id }],
      });
      if (memberExistingTeam || memberUser.team) {
        throw new ApiError(
          409,
          `Member email "${memberEmail}" is already registered with a team and cannot be added to another team.`
        );
      }

      // Cross-college validation for existing account
      const memberCollege = (memberUser.collegeName || memberUser.college || m.college || "").trim().toLowerCase();
      if (memberCollege && leaderCollege && memberCollege !== leaderCollege) {
        throw new ApiError(
          400,
          "All team members must belong to the same college. Cross-college teams are not allowed."
        );
      }

      memberUser.name = m.fullName || m.name || memberUser.name;
      if (m.phone) memberUser.phone = m.phone;
      memberUser.college = leaderUser?.college || personal.collegeName || personal.college || memberUser.college;
      memberUser.collegeName = leaderUser?.collegeName || personal.collegeName || personal.college || memberUser.collegeName;
      if (m.registeredNumber || m.regNo) memberUser.registeredNumber = m.registeredNumber || m.regNo;
      if (m.department) memberUser.department = m.department;
      if (m.year) memberUser.year = m.year === "Final Year" ? "4th Year" : m.year;
      if (m.gender) memberUser.gender = m.gender;
      if (m.github || m.githubUrl) memberUser.githubUrl = m.githubUrl || m.github;
      if (m.linkedin || m.linkedinUrl) memberUser.linkedinUrl = m.linkedinUrl || m.linkedin;
      if (m.portfolio || m.portfolioUrl) memberUser.portfolioUrl = m.portfolioUrl || m.portfolio;
      await memberUser.save();
    } else {
      // Create new user for the team member
      memberUser = await User.create({
        name: m.fullName || m.name || "Team Member",
        email: memberEmail,
        phone: m.phone || "9999999999",
        college: leaderUser?.college || personal.collegeName || personal.college || "",
        collegeName: leaderUser?.collegeName || personal.collegeName || personal.college || "",
        registeredNumber: m.registeredNumber || m.regNo || "",
        department: m.department || "",
        year: m.year === "Final Year" ? "4th Year" : (m.year || ""),
        gender: m.gender || "",
        githubUrl: m.githubUrl || m.github || "",
        linkedinUrl: m.linkedinUrl || m.linkedin || "",
        portfolioUrl: m.portfolioUrl || m.portfolio || "",
        role: "participant",
        status: "pending",
      });
    }

    if (!memberUserIds.some((id) => id.toString() === memberUser._id.toString())) {
      memberUserIds.push(memberUser._id);
    }
  }

  // Create Team
  const team = await Team.create({
    teamName: teamData.teamName.trim(),
    leader: userId,
    members: memberUserIds,
    currentStatus: "under_review",
  });

  // Update team reference on all users in team
  await User.updateMany({ _id: { $in: memberUserIds } }, { team: team._id });


  // Process uploaded files if any
  let pptFileMeta = projectData.pptFile || {};
  let docFileMeta = projectData.supportingDocFile || {};

  if (req.files?.pptFile?.[0]) {
    const file = req.files.pptFile[0];
    pptFileMeta = {
      url: `/uploads/ppt/${file.filename}`,
      path: file.path,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  if (req.files?.supportingDocFile?.[0]) {
    const file = req.files.supportingDocFile[0];
    docFileMeta = {
      url: `/uploads/docs/${file.filename}`,
      path: file.path,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  // Create or Update Project
  let project = await Project.findOne({ team: team._id });
  const projectFields = {
    team: team._id,
    title: projectData.title,
    theme: projectData.theme,
    problemStatement: projectData.problemStatement,
    problemStatementId: projectData.problemStatementId || null,
    problemCode: projectData.problemCode || "",
    problemType: projectData.problemType || "official",
    abstract: projectData.abstract,
    technologyStack: projectData.technologyStack || "",
    githubRepository: projectData.githubRepository || "",
    demoVideoUrl: projectData.demoVideoUrl || "",
    pptFile: pptFileMeta,
    supportingDocFile: docFileMeta,
    submittedAt: new Date(),
  };

  if (!project) {
    project = await Project.create(projectFields);
  } else {
    Object.assign(project, projectFields);
    await project.save();
  }

  // Create or Update Submission
  const submission = await Submission.findOneAndUpdate(
    { team: team._id },
    {
      team: team._id,
      project: project._id,
      submittedBy: userId,
      status: "under_review",
      finalSubmittedAt: project.submittedAt,
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  )
    .populate("team")
    .populate("project");

  const yearSuffix = activeEvent?.eventYear || "2026";
  const regId = `HWV-${yearSuffix}-${submission._id.toString().slice(-6).toUpperCase()}`;

  return sendSuccess(res, 201, "Registration and project submitted successfully", {
    registrationId: regId,
    status: "under_review",
    submissionDate: (project?.submittedAt || new Date()).toISOString(),
    submission,
  });
});
