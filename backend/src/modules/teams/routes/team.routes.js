import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware.js";
import { validateRequest } from "../../../middleware/validateRequest.middleware.js";
import { sendSuccess } from "../../../utils/apiResponse.js";
import { addTeamMember, createTeam, getMyTeam, getTeam } from "../controllers/team.controller.js";
import { addMemberValidation, createTeamValidation } from "../validators/team.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", (_req, res) => sendSuccess(res, 200, "Team routes ready"));
router.post("/", createTeamValidation, validateRequest, createTeam);
router.get("/my-team", getMyTeam);
router.get("/:teamId", getTeam);
router.post("/:teamId/members", addMemberValidation, validateRequest, addTeamMember);

export default router;
