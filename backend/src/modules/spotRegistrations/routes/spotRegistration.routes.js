import { Router } from "express";
import { uploadPaymentScreenshot } from "../../../middleware/upload.middleware.js";
import { validateRequest } from "../../../middleware/validateRequest.middleware.js";
import { createRateLimit } from "../../../middleware/rateLimit.middleware.js";
import { createSpotRegistration, getSpotPaymentInstructions } from "../controllers/spotRegistration.controller.js";
import { paymentInstructionsValidation } from "../validators/spotRegistration.validator.js";

const router = Router();
const submissionRateLimit = createRateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

router.get("/payment-instructions", paymentInstructionsValidation, validateRequest, getSpotPaymentInstructions);
router.post("/", submissionRateLimit, uploadPaymentScreenshot.single("paymentScreenshot"), createSpotRegistration);

export default router;
