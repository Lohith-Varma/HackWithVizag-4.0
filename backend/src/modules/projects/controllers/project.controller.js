import { validateUploadedFile } from "../../../middleware/upload.middleware.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import ApiError from "../../../utils/apiError.js";
import { sendSuccess } from "../../../utils/apiResponse.js";
import { deleteStoredFile, downloadStoredFile, uploadFile } from "../../../services/storage.service.js";
import { sendFileBuffer } from "../../../utils/fileResponse.js";
import {
  attachProjectPpt,
  createProjectForTeam,
  getMyProject,
  getProjectById,
  getProjectForPptUpload,
  getTeamProjectDocument,
  updateProjectDetails,
} from "../services/project.service.js";

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

  validateUploadedFile(req.file, {
    kind: "ppt",
    maxBytes: Number(process.env.MAX_PPT_UPLOAD_BYTES || 20 * 1024 * 1024),
  });

  const project = await getProjectForPptUpload(req.user.id, req.params.projectId);
  const oldFile = project.pptFile?.toObject?.() || project.pptFile;
  const uploadedFile = await uploadFile({ folder: "ppt", ownerId: project.team, file: req.file });
  const fileData = {
    ...uploadedFile,
    url: `/api/projects/team/${project.team}/documents/ppt`,
    path: uploadedFile.storagePath,
  };

  try {
    await attachProjectPpt(project, fileData);
  } catch (error) {
    await deleteStoredFile(uploadedFile).catch((cleanupError) => {
      console.error(`[storage-cleanup] context=project-ppt path=${uploadedFile.storagePath} success=false message=${cleanupError.message}`);
    });
    throw error;
  }

  if (oldFile?.storagePath && oldFile.storagePath !== uploadedFile.storagePath) {
    await deleteStoredFile(oldFile).catch((cleanupError) => {
      console.error(`[storage-cleanup] context=old-project-ppt path=${oldFile.storagePath} success=false message=${cleanupError.message}`);
    });
  }

  return sendSuccess(res, 200, "PPT uploaded successfully", { project });
});

export const getProjectDocument = asyncHandler(async (req, res) => {
  const file = await getTeamProjectDocument(req.user.id, req.params.teamId, req.params.type);
  const legacyFolder = req.params.type === "ppt" ? "ppt" : "docs";
  const buffer = await downloadStoredFile(file, { legacyFolder });
  return sendFileBuffer(res, {
    buffer,
    file,
    disposition: req.query.disposition === "attachment" ? "attachment" : "inline",
    fallbackName: req.params.type === "ppt" ? "presentation.pptx" : "supporting-document",
  });
});
