import { uploadRoot } from "../../../middleware/upload.middleware.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import ApiError from "../../../utils/apiError.js";
import { sendSuccess } from "../../../utils/apiResponse.js";
import {
  attachProjectPpt,
  createProjectForTeam,
  getMyProject,
  getProjectById,
  updateProjectDetails,
} from "../services/project.service.js";

const buildPptFileData = (file) => {
  const relativePath = file.path.replace(uploadRoot, "").replace(/\\/g, "/");

  return {
    url: `/uploads${relativePath}`,
    path: file.path,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
  };
};

export const createProject = asyncHandler(async (req, res) => {
  const project = await createProjectForTeam(req.user.id, req.body);

  return sendSuccess(res, 201, "Project details saved successfully", { project });
});

export const getMyProjectDetails = asyncHandler(async (req, res) => {
  const project = await getMyProject(req.user.id);

  return sendSuccess(res, 200, "Project fetched successfully", { project });
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await getProjectById(req.params.projectId);

  return sendSuccess(res, 200, "Project fetched successfully", { project });
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await updateProjectDetails(req.user.id, req.params.projectId, req.body);

  return sendSuccess(res, 200, "Project updated successfully", { project });
});

export const uploadProjectPpt = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "PPT file is required");
  }

  const project = await attachProjectPpt(req.user.id, req.params.projectId, buildPptFileData(req.file));

  return sendSuccess(res, 200, "PPT uploaded successfully", { project });
});
