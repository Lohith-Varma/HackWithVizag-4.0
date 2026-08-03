import express from "express";
import { getAdminDashboard, getParticipantDashboard } from "../controllers/dashboard.controller.js";
import { authenticate, authorizeRoles } from "../../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/participant", authenticate, getParticipantDashboard);
router.get("/admin", authenticate, authorizeRoles("admin"), getAdminDashboard);

export default router;
