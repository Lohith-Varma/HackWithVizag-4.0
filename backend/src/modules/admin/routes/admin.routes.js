import { Router } from "express";
import { authenticate, authorizeRoles } from "../../../middleware/auth.middleware.js";
import { validateRequest } from "../../../middleware/validateRequest.middleware.js";
import { sendSuccess } from "../../../utils/apiResponse.js";
import {
  getAdminOverview,
  listSubmissions,
  listTeams,
  listUsers,
  updateTeamStatus,
  updateUserStatus,
} from "../controllers/admin.controller.js";
import { updateTeamStatusValidation, updateUserStatusValidation } from "../validators/admin.validator.js";

const router = Router();

router.use(authenticate, authorizeRoles("admin"));

router.get("/", (_req, res) => sendSuccess(res, 200, "Admin routes ready"));
router.get("/overview", getAdminOverview);
router.get("/users", listUsers);
router.get("/teams", listTeams);
router.get("/submissions", listSubmissions);
router.patch("/teams/:teamId/status", updateTeamStatusValidation, validateRequest, updateTeamStatus);
router.patch("/users/:userId/status", updateUserStatusValidation, validateRequest, updateUserStatus);

export default router;
