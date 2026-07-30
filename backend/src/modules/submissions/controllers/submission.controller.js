import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../utils/apiResponse.js";
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
