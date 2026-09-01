import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../utils/apiResponse.js";
import { addMemberToTeam, createTeamForUser, getTeamById, getUserTeam } from "../services/team.service.js";

export const createTeam = asyncHandler(async (req, res) => {
  const team = await createTeamForUser(req.user.id, req.body);

  return sendSuccess(res, 201, "Team created successfully", { team });
});

export const getMyTeam = asyncHandler(async (req, res) => {
  const data = await getUserTeam(req.user.id);

  return sendSuccess(res, 200, "Team fetched successfully", data);
});

export const getTeam = asyncHandler(async (req, res) => {
  const data = await getTeamById(req.params.teamId, req.user);

  return sendSuccess(res, 200, "Team fetched successfully", data);
});

export const addTeamMember = asyncHandler(async (req, res) => {
  const team = await addMemberToTeam(req.params.teamId, req.user.id, req.body);

  return sendSuccess(res, 200, "Team member added successfully", { team });
});

