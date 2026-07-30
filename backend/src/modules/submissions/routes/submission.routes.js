import { Router } from "express";
import { param } from "express-validator";
import { authenticate } from "../../../middleware/auth.middleware.js";
import { validateRequest } from "../../../middleware/validateRequest.middleware.js";
import { sendSuccess } from "../../../utils/apiResponse.js";
import { finalSubmit, getMySubmission, reviewSubmission } from "../controllers/submission.controller.js";

const router = Router();
const projectIdValidation = [param("projectId").isMongoId().withMessage("Invalid project id")];

router.use(authenticate);

router.get("/", (_req, res) => sendSuccess(res, 200, "Submission routes ready"));
router.get("/mine", getMySubmission);
router.post("/:projectId/review", projectIdValidation, validateRequest, reviewSubmission);
router.post("/:projectId/final-submit", projectIdValidation, validateRequest, finalSubmit);

export default router;
