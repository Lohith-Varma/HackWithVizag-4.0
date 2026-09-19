import { Router } from "express";
import { authenticate, authorizeRoles } from "../../../middleware/auth.middleware.js";
import { validateRequest } from "../../../middleware/validateRequest.middleware.js";
import { sendSuccess } from "../../../utils/apiResponse.js";
import {
  deleteTeam,
  deleteUser,
  downloadTeamSubmission,
  serveAdminTeamDocument,
  exportAdminData,
  getAnalytics,
  getAdminOverview,
  getDashboard,
  getTeamDetails,
  getOfflineRegistrationDetails,
  listOfflineRegistrations,
  listSubmissions,
  listTeams,
  listUsers,
  listAuditLogs,
  sendTeamEmail,
  updateAdminTeamDetails,
  updateTeamRemarks,
  updateTeamStatus,
  updateUserStatus,
  listNotificationLeads,
  exportNotificationLeads,
  deleteNotificationLead,
} from "../controllers/admin.controller.js";
import {
  exportValidation,
  legacyTeamIdValidation,
  deleteTeamValidation,
  deleteUserValidation,
  listAuditLogsValidation,
  listSubmissionsValidation,
  listTeamsValidation,
  listOfflineRegistrationsValidation,
  teamIdValidation,
  updateTeamRemarksValidation,
  updateTeamStatusValidation,
  updateUserStatusValidation,
} from "../validators/admin.validator.js";
import {
  confirmSpotRegistration,
  getSpotPaymentScreenshot,
  getSpotRegistration,
  listSpotRegistrations,
  updateSpotRegistration,
} from "../../spotRegistrations/controllers/spotRegistration.controller.js";
import {
  listSpotRegistrationsValidation,
  spotIdValidation,
} from "../../spotRegistrations/validators/spotRegistration.validator.js";
import { uploadPaymentScreenshot } from "../../../middleware/upload.middleware.js";

const router = Router();

router.use(authenticate, authorizeRoles("admin"));

router.get("/", (_req, res) => sendSuccess(res, 200, "Admin routes ready"));
router.get("/dashboard", getDashboard);
router.get("/overview", getAdminOverview);
router.get("/users", listUsers);
router.get("/audit-logs", listAuditLogsValidation, validateRequest, listAuditLogs);
router.get("/teams", listTeamsValidation, validateRequest, listTeams);
router.get("/offline-registrations", listOfflineRegistrationsValidation, validateRequest, listOfflineRegistrations);
router.get("/offline-registrations/:teamId", legacyTeamIdValidation, validateRequest, getOfflineRegistrationDetails);
router.get("/spot-registrations", listSpotRegistrationsValidation, validateRequest, listSpotRegistrations);
router.get("/spot-registrations/:id", spotIdValidation, validateRequest, getSpotRegistration);
router.get("/spot-registrations/:id/payment-screenshot", spotIdValidation, validateRequest, getSpotPaymentScreenshot);
router.patch(
  "/spot-registrations/:id",
  spotIdValidation,
  validateRequest,
  uploadPaymentScreenshot.single("paymentScreenshot"),
  updateSpotRegistration
);
router.post("/spot-registrations/:id/confirm", spotIdValidation, validateRequest, confirmSpotRegistration);
router.get("/team/:id", teamIdValidation, validateRequest, getTeamDetails);
router.get("/teams/:teamId", legacyTeamIdValidation, validateRequest, getTeamDetails);
router.put("/team/:id", teamIdValidation, validateRequest, updateAdminTeamDetails);
router.put("/teams/:teamId", legacyTeamIdValidation, validateRequest, updateAdminTeamDetails);
router.delete("/team/:id", teamIdValidation, deleteTeamValidation, validateRequest, deleteTeam);
router.delete("/teams/:teamId", legacyTeamIdValidation, deleteTeamValidation, validateRequest, deleteTeam);
router.post("/team/:id/email", teamIdValidation, validateRequest, sendTeamEmail);
router.post("/teams/:teamId/email", legacyTeamIdValidation, validateRequest, sendTeamEmail);
router.get("/team/:id/download", teamIdValidation, validateRequest, downloadTeamSubmission);
router.get("/teams/:teamId/download", legacyTeamIdValidation, validateRequest, downloadTeamSubmission);
router.get("/team/:id/documents/:type", teamIdValidation, validateRequest, serveAdminTeamDocument);
router.get("/teams/:teamId/documents/:type", legacyTeamIdValidation, validateRequest, serveAdminTeamDocument);
router.get("/submissions", listSubmissionsValidation, validateRequest, listSubmissions);
router.get("/analytics", getAnalytics);
router.get("/export", exportValidation, validateRequest, exportAdminData);
router.patch("/team/:id/status", teamIdValidation, updateTeamStatusValidation, validateRequest, updateTeamStatus);
router.patch("/team/:id/remarks", teamIdValidation, updateTeamRemarksValidation, validateRequest, updateTeamRemarks);
router.patch("/teams/:teamId/remarks", legacyTeamIdValidation, updateTeamRemarksValidation, validateRequest, updateTeamRemarks);
router.patch(
  "/teams/:teamId/status",
  legacyTeamIdValidation,
  updateTeamStatusValidation,
  validateRequest,
  updateTeamStatus
);
router.patch("/users/:userId/status", updateUserStatusValidation, validateRequest, updateUserStatus);
router.delete("/users/:userId", deleteUserValidation, validateRequest, deleteUser);
router.get("/leads", listNotificationLeads);
router.get("/leads/export", exportNotificationLeads);
router.delete("/leads/:id", deleteNotificationLead);

export default router;
