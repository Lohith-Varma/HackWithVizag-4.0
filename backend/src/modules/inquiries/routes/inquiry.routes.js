import { Router } from "express";
import { validateRequest } from "../../../middleware/validateRequest.middleware.js";
import { submitInquiry, submitNotificationLead } from "../controllers/inquiry.controller.js";
import { inquiryValidation } from "../validators/inquiry.validator.js";

const router = Router();

router.post("/", inquiryValidation, validateRequest, submitInquiry);
router.post("/notify", submitNotificationLead);

export default router;
