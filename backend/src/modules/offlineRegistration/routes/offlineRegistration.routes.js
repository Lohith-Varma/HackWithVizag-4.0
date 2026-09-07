import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware.js";
import { validateRequest } from "../../../middleware/validateRequest.middleware.js";
import {
  getPaymentScreenshot,
  getOfflineRegistration,
  getOfflineRegistrationEligibility,
  submitOfflineRegistration,
} from "../controllers/offlineRegistration.controller.js";
import { requireSelectedTeam } from "../middleware/selectedTeam.middleware.js";
import { offlineRegistrationValidation, teamIdValidation } from "../validators/offlineRegistration.validator.js";
import { uploadPaymentScreenshot } from "../../../middleware/upload.middleware.js";

const router = Router();

router.use(authenticate);

router.get(
  "/team/:teamId/eligibility",
  teamIdValidation,
  validateRequest,
  requireSelectedTeam,
  getOfflineRegistrationEligibility
);
router.get("/team/:teamId", teamIdValidation, validateRequest, requireSelectedTeam, getOfflineRegistration);
router.get("/team/:teamId/payment-screenshot", teamIdValidation, validateRequest, requireSelectedTeam, getPaymentScreenshot);
router.post(
  "/team/:teamId",
  teamIdValidation,
  validateRequest,
  requireSelectedTeam,
  uploadPaymentScreenshot.single("paymentScreenshot"),
  offlineRegistrationValidation,
  validateRequest,
  submitOfflineRegistration
);

export default router;
