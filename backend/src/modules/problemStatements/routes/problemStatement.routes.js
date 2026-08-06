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

// Public route to fetch problem statements for active event
router.get("/", getPublicProblemStatements);
router.get("/:id", getProblemStatementById);


// Admin management routes
router.use("/admin", authenticate, authorizeRoles("admin"));
router.get("/admin", getAdminProblemStatements);
router.post("/admin", createProblemStatement);
router.put("/admin/:id", updateProblemStatement);
router.delete("/admin/:id", deleteProblemStatement);
router.patch("/admin/reorder", reorderProblemStatements);

export default router;
