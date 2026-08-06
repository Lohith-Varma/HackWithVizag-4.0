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

  // Member count check
  const memberList = Array.isArray(teamData.members) ? teamData.members : [];
  const totalMembers = 1 + memberList.length; // Leader + additional members
  if (totalMembers < minTeamSize || totalMembers > maxTeamSize) {
    throw new ApiError(
      400,
      `Team size must be between ${minTeamSize} and ${maxTeamSize} members. Current count: ${totalMembers}`
    );
  }

  // Duplicate team name validation
  let team = await Team.findOne({
    $or: [{ leader: userId }, { members: userId }],
  });

  const existingTeamWithName = await Team.findOne({
    teamName: new RegExp(`^${teamData.teamName.trim()}$`, "i"),
    _id: { $ne: team?._id },
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
      department: personal.department,
      year: personal.year,
      gender: personal.gender || "",
      resumeUrl: personal.resumeUrl || personal.resume || "",
      githubUrl: personal.githubUrl || personal.github || "",
      linkedinUrl: personal.linkedinUrl || personal.linkedin || "",
      portfolioUrl: personal.portfolioUrl || personal.portfolio || "",
    },
    { new: true }
  );

  // Process team members and check for email conflicts across existing teams
  const memberUserIds = [userId];
  for (const m of memberList) {
    if (!m || (!m.email && !m.fullName)) continue;
    const memberEmail = (m.email || "").toLowerCase().trim();
    if (!memberEmail) continue;

    // Check if member email belongs to another active team
    let memberUser = await User.findOne({ email: memberEmail });
    if (memberUser && memberUser.team && team && memberUser.team.toString() !== team._id.toString()) {
      throw new ApiError(
        409,
        `Member email "${memberEmail}" is already registered under another team.`
      );
    }

    if (!memberUser) {
      memberUser = await User.create({
        name: m.fullName || m.name || "Team Member",
        email: memberEmail,
        phone: m.phone || "9999999999",
        college: m.college || m.collegeName || leaderUser?.college || "",
        collegeName: m.collegeName || m.college || leaderUser?.collegeName || "",
        department: m.department || "",
        year: m.year || "",
        gender: m.gender || "",
        githubUrl: m.githubUrl || m.github || "",
        linkedinUrl: m.linkedinUrl || m.linkedin || "",
        portfolioUrl: m.portfolioUrl || m.portfolio || "",
        role: "participant",
        status: "pending",
      });
    } else {
      memberUser.name = m.fullName || m.name || memberUser.name;
      if (m.phone) memberUser.phone = m.phone;
      if (m.college || m.collegeName) {
        memberUser.college = m.college || m.collegeName;
        memberUser.collegeName = m.collegeName || m.college;
      }
      if (m.department) memberUser.department = m.department;
      if (m.year) memberUser.year = m.year;
      if (m.gender) memberUser.gender = m.gender;
      if (m.github || m.githubUrl) memberUser.githubUrl = m.githubUrl || m.github;
      if (m.linkedin || m.linkedinUrl) memberUser.linkedinUrl = m.linkedinUrl || m.linkedin;
      if (m.portfolio || m.portfolioUrl) memberUser.portfolioUrl = m.portfolioUrl || m.portfolio;
      await memberUser.save();
    }

    if (!memberUserIds.some((id) => id.toString() === memberUser._id.toString())) {
      memberUserIds.push(memberUser._id);
    }
  }

  // Create or update Team
  if (!team) {
    team = await Team.create({
      teamName: teamData.teamName.trim(),
      leader: userId,
      members: memberUserIds,
      currentStatus: "under_review",
    });
  } else {
    team.teamName = teamData.teamName.trim() || team.teamName;
    team.leader = userId;
    team.members = memberUserIds;
    team.currentStatus = "under_review";
    await team.save();
  }

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
