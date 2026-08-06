import express from "express";
import {
  createEvent,
  deleteEvent,
  getActiveEvent,
  getAdminEvents,
  setActiveEvent,
  updateEvent,
} from "../controllers/event.controller.js";
import { authenticate, authorizeRoles } from "../../../middleware/auth.middleware.js";

const router = express.Router();

// Public route to get current active event settings
router.get("/", getActiveEvent);

// Admin management routes
router.use("/admin", authenticate, authorizeRoles("admin"));
router.get("/admin", getAdminEvents);
router.post("/admin", createEvent);
router.put("/admin/:id", updateEvent);
router.delete("/admin/:id", deleteEvent);
router.patch("/admin/:id/active", setActiveEvent);

export default router;

