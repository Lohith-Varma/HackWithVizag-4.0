import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../utils/apiResponse.js";
import User from "../../auth/models/user.model.js";
import Team from "../../teams/models/team.model.js";
import Project from "../../projects/models/project.model.js";
import Submission from "../../submissions/models/submission.model.js";
import Event from "../../events/models/event.model.js";
import { getDashboard as getAdminDashboardData } from "../../admin/controllers/admin.controller.js";

export const getParticipantDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [user, activeEvent, team] = await Promise.all([
    User.findById(userId).select("-password"),
    Event.findOne({ activeEvent: true }),
    Team.findOne({ $or: [{ leader: userId }, { members: userId }] })
      .populate("leader", "name email phone college collegeName department year")
      .populate("members", "name email phone college collegeName department year")
      .populate("reviewedBy", "name email"),
  ]);

  let project = null;
  let submission = null;

  if (team) {
    [project, submission] = await Promise.all([
      Project.findOne({ team: team._id }).populate("problemStatementId"),
      Submission.findOne({ team: team._id }),
    ]);
  }

  // Calculate Timeline Stage
  let timelineStage = "Draft";
  let statusText = "Registration Draft In Progress";

  if (team && submission) {
    if (team.currentStatus === "selected") {
      timelineStage = "Selected";
      statusText = "Congratulations! Your team has been Selected!";
    } else if (team.currentStatus === "rejected") {
      timelineStage = "Under Review";
      statusText = "Submission Review Completed";
    } else if (submission.status === "under_review" || team.currentStatus === "under_review") {
      timelineStage = "Under Review";
      statusText = "Your project is currently Under Review by the screening committee.";
    } else if (submission.status === "submitted" || submission.finalSubmittedAt) {
      timelineStage = "Submitted";
      statusText = "Submitted Successfully";
    }
  }

  const announcements = [
    {
      id: "1",
      title: `${activeEvent?.eventName || "Hack With Vizag 4.0"} Launched!`,
      content: `Registration is open until ${
        activeEvent?.registrationEndDate
          ? new Date(activeEvent.registrationEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : "August 31"
      }. Complete all 6 steps of the registration wizard.`,
      date: new Date().toISOString(),
      type: "important",
    },
    {
      id: "2",
      title: "Online Submission Guidelines",
      content: `Ensure your abstract is between ${activeEvent?.minAbstractWords || 50} and ${activeEvent?.maxAbstractWords || 500} words, and upload your presentation PPT.`,
      date: new Date().toISOString(),
      type: "info",
    },
  ];

  const yearSuffix = activeEvent?.eventYear || "2026";
  const registrationId = submission
    ? `HWV-${yearSuffix}-${submission._id.toString().slice(-6).toUpperCase()}`
    : null;

  return sendSuccess(res, 200, "Participant dashboard fetched successfully", {
    user,
    event: activeEvent,
    team,
    project,
    submission,
    registrationId,
    timelineStage,
    statusText,
    announcements,
    isEligibleForOffline: team?.currentStatus === "selected",
  });
});

export const getAdminDashboard = getAdminDashboardData;
