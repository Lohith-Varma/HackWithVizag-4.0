import express from "express";
import {
  createProblemStatement,
  deleteProblemStatement,
  getAdminProblemStatements,
  getProblemStatementById,
  getPublicProblemStatements,
  reorderProblemStatements,
  updateProblemStatement,
} from "../controllers/problemStatement.controller.js";
import { authenticate, authorizeRoles } from "../../../middleware/auth.middleware.js";

const router = express.Router();

// Admin management routes
router.use("/admin", authenticate, authorizeRoles("admin"));
router.get("/admin", getAdminProblemStatements);
router.post("/admin", createProblemStatement);
router.patch("/admin/reorder", reorderProblemStatements);
router.put("/admin/:id", updateProblemStatement);
router.delete("/admin/:id", deleteProblemStatement);

// Public route to fetch problem statements for active event
router.get("/", getPublicProblemStatements);
router.get("/:id", getProblemStatementById);

export default router;
