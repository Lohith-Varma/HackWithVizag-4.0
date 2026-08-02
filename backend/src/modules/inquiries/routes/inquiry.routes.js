import { Router } from "express";
import { validateRequest } from "../../../middleware/validateRequest.middleware.js";
import { submitInquiry } from "../controllers/inquiry.controller.js";
import { inquiryValidation } from "../validators/inquiry.validator.js";

const router = Router();

router.post("/", inquiryValidation, validateRequest, submitInquiry);

export default router;
