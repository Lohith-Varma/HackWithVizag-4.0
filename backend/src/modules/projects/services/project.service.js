import mongoose from "mongoose";
import Team from "../../teams/models/team.model.js";
import Project from "../models/project.model.js";
import ApiError from "../../../utils/apiError.js";

const ensureTeamOwnership = async (teamId, userId, allowMembers = false) => {
  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    throw new ApiError(400, "Invalid team id");
  }

  const team = await Team.findById(teamId);

  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  const isLeader = team.leader.toString() === userId;
  const isMember = team.members.some((member) => member.toString() === userId);

  if (!isLeader && !(allowMembers && isMember)) {
    throw new ApiError(403, "You do not have access to this team");
  }

  return team;
};

export const createProjectForTeam = async (userId, payload) => {
  const team = await ensureTeamOwnership(payload.team, userId);

  if (team.currentStatus !== "pending") {
    throw new ApiError(409, "Project details cannot be changed after review has started");
  }

  const existingProject = await Project.findOne({ team: team._id });

  if (existingProject) {
    throw new ApiError(409, "Project already exists for this team");
  }

  return Project.create(payload);
};

export const updateProjectDetails = async (userId, projectId, payload) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, "Invalid project id");
  }

  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const team = await ensureTeamOwnership(project.team, userId);

  if (team.currentStatus !== "pending") {
    throw new ApiError(409, "Project details cannot be changed after review has started");
  }

  const allowedFields = ["title", "theme", "problemStatement", "abstract"];
  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) {
      project[field] = payload[field];
    }
  });

  await project.save();
  return project;
};

export const attachProjectPpt = async (userId, projectId, fileData) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, "Invalid project id");
  }

  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const team = await ensureTeamOwnership(project.team, userId);

  if (team.currentStatus !== "pending") {
    throw new ApiError(409, "PPT cannot be changed after review has started");
  }

  project.pptFile = fileData;
  await project.save();

  return project;
};

export const getMyProject = async (userId) => {
  const team = await Team.findOne({
    $or: [{ leader: userId }, { members: userId }],
  });

  if (!team) {
    return null;
  }

  return Project.findOne({ team: team._id }).populate("team");
};

export const getProjectById = async (projectId) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, "Invalid project id");
  }

  const project = await Project.findById(projectId).populate("team");

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  return project;
};
