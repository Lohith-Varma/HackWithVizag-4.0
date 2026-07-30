import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware.js";
import { validateRequest } from "../../../middleware/validateRequest.middleware.js";
import { sendSuccess } from "../../../utils/apiResponse.js";
import {
  completeOfflineRegistration,
  getOfflineRegistration,
  getOfflineRegistrationEligibility,
  saveOfflineRegistration,
} from "../controllers/offlineRegistration.controller.js";
import { requireSelectedTeam } from "../middleware/selectedTeam.middleware.js";
import { offlineRegistrationValidation, teamIdValidation } from "../validators/offlineRegistration.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", (_req, res) => sendSuccess(res, 200, "Offline registration routes ready"));
router.get(
  "/team/:teamId/eligibility",
  teamIdValidation,
  validateRequest,
  requireSelectedTeam,
  getOfflineRegistrationEligibility
);
router.get("/team/:teamId", teamIdValidation, validateRequest, requireSelectedTeam, getOfflineRegistration);
router.post(
  "/team/:teamId",
  offlineRegistrationValidation,
  validateRequest,
  requireSelectedTeam,
  saveOfflineRegistration
);
router.post(
  "/team/:teamId/complete",
  teamIdValidation,
  validateRequest,
  requireSelectedTeam,
  completeOfflineRegistration
);

export default router;
