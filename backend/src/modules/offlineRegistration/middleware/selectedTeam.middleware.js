import mongoose from "mongoose";
import Team from "../../teams/models/team.model.js";
import ApiError from "../../../utils/apiError.js";

export const requireSelectedTeam = async (req, _res, next) => {
  try {
    const { teamId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      throw new ApiError(400, "Invalid team id");
    }

    const team = await Team.findById(teamId);

    if (!team) {
      throw new ApiError(404, "Team not found");
    }

    if (team.currentStatus !== "selected") {
      throw new ApiError(403, "Only selected teams can access offline registration");
    }

    const isAdmin = req.user.role === "admin";
    const isTeamMember = team.members.some((member) => member.toString() === req.user.id);

    if (!isAdmin && !isTeamMember) {
      throw new ApiError(403, "You do not have access to this team");
    }

    req.team = team;
    return next();
  } catch (error) {
    return next(error);
  }
};
