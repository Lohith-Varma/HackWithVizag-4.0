import express from "express";
import {
  finalSubmit,
  getMySubmission,
  reviewSubmission,
  submitFullRegistration,
} from "../controllers/submission.controller.js";
import { authenticate } from "../../../middleware/auth.middleware.js";
import { uploadProjectFiles } from "../../../middleware/upload.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/me", getMySubmission);
router.get("/review/:projectId", reviewSubmission);
router.post("/final/:projectId", finalSubmit);
router.post("/full", uploadProjectFiles, submitFullRegistration);

export default router;
