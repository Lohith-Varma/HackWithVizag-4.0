import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware.js";
import { uploadPpt } from "../../../middleware/upload.middleware.js";
import { validateRequest } from "../../../middleware/validateRequest.middleware.js";
import { sendSuccess } from "../../../utils/apiResponse.js";
import {
  createProject,
  getMyProjectDetails,
  getProject,
  updateProject,
  uploadProjectPpt,
} from "../controllers/project.controller.js";
import { createProjectValidation, projectIdValidation, updateProjectValidation } from "../validators/project.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", (_req, res) => sendSuccess(res, 200, "Project routes ready"));
router.post("/", createProjectValidation, validateRequest, createProject);
router.get("/my-project", getMyProjectDetails);
router.get("/:projectId", projectIdValidation, validateRequest, getProject);
router.patch("/:projectId", updateProjectValidation, validateRequest, updateProject);
router.post("/:projectId/ppt", projectIdValidation, validateRequest, uploadPpt.single("ppt"), uploadProjectPpt);

export default router;
