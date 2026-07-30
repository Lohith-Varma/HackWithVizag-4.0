import User from "../../auth/models/user.model.js";
import Project from "../../projects/models/project.model.js";
import Submission from "../../submissions/models/submission.model.js";
import Team from "../../teams/models/team.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import ApiError from "../../../utils/apiError.js";
import { sendSuccess } from "../../../utils/apiResponse.js";

export const getAdminOverview = asyncHandler(async (_req, res) => {
  const [users, teams, projects, submissions] = await Promise.all([
    User.countDocuments(),
    Team.countDocuments(),
    Project.countDocuments(),
    Submission.countDocuments(),
  ]);

  return sendSuccess(res, 200, "Admin overview fetched successfully", {
    counts: {
      users,
      teams,
      projects,
      submissions,
    },
  });
});

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 });

  return sendSuccess(res, 200, "Users fetched successfully", { users });
});

export const listTeams = asyncHandler(async (_req, res) => {
  const teams = await Team.find()
    .populate("leader", "name email phone role status")
    .populate("members", "name email phone role status")
    .sort({ createdAt: -1 });

  return sendSuccess(res, 200, "Teams fetched successfully", { teams });
});

export const listSubmissions = asyncHandler(async (_req, res) => {
  const submissions = await Submission.find()
    .populate("team")
    .populate("project")
    .populate("submittedBy", "name email phone role status")
    .sort({ finalSubmittedAt: -1, createdAt: -1 });

  return sendSuccess(res, 200, "Submissions fetched successfully", { submissions });
});

export const updateTeamStatus = asyncHandler(async (req, res) => {
  const team = await Team.findByIdAndUpdate(
    req.params.teamId,
    {
      currentStatus: req.body.currentStatus,
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .populate("leader", "name email phone role status")
    .populate("members", "name email phone role status");

  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  if (["under_review", "selected", "rejected"].includes(team.currentStatus)) {
    const memberIds = team.members.map((member) => member._id || member);

    await User.updateMany({ _id: { $in: memberIds } }, { status: team.currentStatus });
    await Submission.findOneAndUpdate({ team: team._id }, { status: team.currentStatus }, { runValidators: true });
  }

  return sendSuccess(res, 200, "Team status updated successfully", { team });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.userId,
    {
      status: req.body.status,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return sendSuccess(res, 200, "User status updated successfully", { user });
});
