import mongoose from "mongoose";
import User from "../../auth/models/user.model.js";
import Team from "../models/team.model.js";
import ApiError from "../../../utils/apiError.js";

export const getUserTeam = async (userId) => {
  return Team.findOne({
    $or: [{ leader: userId }, { members: userId }],
  })
    .populate("leader", "name email phone role status")
    .populate("members", "name email phone role status");
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

  return team.populate("leader members", "name email phone role status");
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

  return team.populate("leader members", "name email phone role status");
};

export const getTeamById = async (teamId) => {
  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    throw new ApiError(400, "Invalid team id");
  }

  const team = await Team.findById(teamId)
    .populate("leader", "name email phone role status")
    .populate("members", "name email phone role status");

  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  return team;
};
