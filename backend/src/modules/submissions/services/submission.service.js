import mongoose from "mongoose";
import Project from "../../projects/models/project.model.js";
import Team from "../../teams/models/team.model.js";
import Submission from "../models/submission.model.js";
import ApiError from "../../../utils/apiError.js";

const getProjectForSubmitter = async (projectId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, "Invalid project id");
  }

  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const team = await Team.findById(project.team);

  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  const isLeader = team.leader.toString() === userId;

  if (!isLeader) {
    throw new ApiError(403, "Only the team leader can submit the project");
  }

  return { project, team };
};

const ensureProjectComplete = (project) => {
  const hasRequiredDetails =
    project.title && project.theme && project.problemStatement && project.abstract && project.pptFile?.url;

  if (!hasRequiredDetails) {
    throw new ApiError(409, "Project details and PPT are required before final submission");
  }
};

export const getSubmissionForUser = async (userId) => {
  const team = await Team.findOne({
    $or: [{ leader: userId }, { members: userId }],
  });

  if (!team) {
    return null;
  }

  return Submission.findOne({ team: team._id }).populate("team").populate("project");
};

export const reviewProjectSubmission = async (projectId, userId) => {
  const { project, team } = await getProjectForSubmitter(projectId, userId);

  return {
    team,
    project,
    readyForFinalSubmit: Boolean(
      project.title && project.theme && project.problemStatement && project.abstract && project.pptFile?.url
    ),
  };
};

export const finalSubmitProject = async (projectId, userId) => {
  const { project, team } = await getProjectForSubmitter(projectId, userId);

  if (team.currentStatus !== "pending") {
    throw new ApiError(409, "Project has already been submitted");
  }

  ensureProjectComplete(project);

  project.submittedAt = new Date();
  team.currentStatus = "under_review";

  await Promise.all([project.save(), team.save()]);

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

  return submission;
};
