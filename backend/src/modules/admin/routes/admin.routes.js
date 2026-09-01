import { Router } from "express";
import { authenticate, authorizeRoles } from "../../../middleware/auth.middleware.js";
import { validateRequest } from "../../../middleware/validateRequest.middleware.js";
import { sendSuccess } from "../../../utils/apiResponse.js";
import {
  deleteTeam,
  downloadTeamSubmission,
  exportAdminData,
  getAnalytics,
  getAdminOverview,
  getDashboard,
  getTeamDetails,
  listSubmissions,
  listTeams,
  listUsers,
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
  listSubmissionsValidation,
  listTeamsValidation,
  teamIdValidation,
  updateTeamRemarksValidation,
  updateTeamStatusValidation,
  updateUserStatusValidation,
} from "../validators/admin.validator.js";

const router = Router();

router.use(authenticate, authorizeRoles("admin"));

router.get("/", (_req, res) => sendSuccess(res, 200, "Admin routes ready"));
router.get("/dashboard", getDashboard);
router.get("/overview", getAdminOverview);
router.get("/users", listUsers);
router.get("/teams", listTeamsValidation, validateRequest, listTeams);
router.get("/team/:id", teamIdValidation, validateRequest, getTeamDetails);
router.get("/teams/:teamId", legacyTeamIdValidation, validateRequest, getTeamDetails);
router.put("/team/:id", teamIdValidation, validateRequest, updateAdminTeamDetails);
router.put("/teams/:teamId", legacyTeamIdValidation, validateRequest, updateAdminTeamDetails);
router.delete("/team/:id", teamIdValidation, validateRequest, deleteTeam);
router.delete("/teams/:teamId", legacyTeamIdValidation, validateRequest, deleteTeam);
router.post("/team/:id/email", teamIdValidation, validateRequest, sendTeamEmail);
router.post("/teams/:teamId/email", legacyTeamIdValidation, validateRequest, sendTeamEmail);
router.get("/team/:id/download", teamIdValidation, validateRequest, downloadTeamSubmission);
router.get("/teams/:teamId/download", legacyTeamIdValidation, validateRequest, downloadTeamSubmission);
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
router.get("/leads", listNotificationLeads);
router.get("/leads/export", exportNotificationLeads);
router.delete("/leads/:id", deleteNotificationLead);

export default router;

