import OfflineRegistration from "../models/offlineRegistration.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import ApiError from "../../../utils/apiError.js";
import { sendSuccess } from "../../../utils/apiResponse.js";
import Event from "../../events/models/event.model.js";
import Project from "../../projects/models/project.model.js";
import path from "path";
import { uploadRoot } from "../../../middleware/upload.middleware.js";

const getPaymentConfig = async (team, { required = true } = {}) => {
  const teamSize = team.members.length;
  if (![3, 4].includes(teamSize)) throw new ApiError(400, "Offline registration is available only for 3 or 4 member teams");
  const event = await Event.findOne({ activeEvent: true });
  const config = teamSize === 3 ? event?.offlinePaymentConfig?.threeMembers : event?.offlinePaymentConfig?.fourMembers;
  const configured = Boolean(config?.qrCodeUrl) && Number.isFinite(config?.fee) && config.fee > 0;
  if (!configured && required) {
    throw new ApiError(503, "Offline payment configuration is not available. Please contact the organisers.");
  }
  return {
    teamSize,
    expectedAmount: configured ? config.fee : null,
    qrCodeUrl: configured ? config.qrCodeUrl : "",
    configured,
  };
};

const serializeRegistration = (registration) => registration && ({
  ...registration.toObject(),
  paymentScreenshotUrl: `/api/offline-registration/team/${registration.team._id || registration.team}/payment-screenshot`,
});

export const getOfflineRegistrationEligibility = asyncHandler(async (req, res) => {
  const [project, offlineRegistration] = await Promise.all([
    Project.findOne({ team: req.team._id }).populate("problemStatementId", "code title problemStatement"),
    OfflineRegistration.findOne({ team: req.team._id }),
  ]);
  // A previously submitted team must continue to see its submitted state even
  // if organisers later rotate/remove the QR configuration.
  const payment = offlineRegistration ? null : await getPaymentConfig(req.team, { required: false });
  return sendSuccess(res, 200, "Team is eligible for offline registration", {
    eligible: true,
    team: req.team,
    project,
    payment,
    offlineRegistration: serializeRegistration(offlineRegistration),
  });
});

export const getOfflineRegistration = asyncHandler(async (req, res) => {
  const teamId = req.team?._id || req.params.teamId;
  const offlineRegistration = await OfflineRegistration.findOne({ team: teamId }).populate("team");

  return sendSuccess(res, 200, "Offline registration fetched successfully", { offlineRegistration: serializeRegistration(offlineRegistration) });
});

export const submitOfflineRegistration = asyncHandler(async (req, res) => {
  const teamId = req.team?._id || req.params.teamId;
  if (req.team.leader.toString() !== req.user.id) throw new ApiError(403, "Only the team lead can submit offline payment details");
  if (!req.file) throw new ApiError(400, "Payment screenshot is required");
  if (!["image/jpeg", "image/png", "image/webp"].includes(req.file.mimetype)) {
    throw new ApiError(400, "Payment screenshot must be a JPG, PNG, or WebP image");
  }
  if (await OfflineRegistration.exists({ team: teamId })) throw new ApiError(409, "Offline registration has already been submitted for this team");
  const payment = await getPaymentConfig(req.team);
  const confirmationCode = `HWV-OFF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  let offlineRegistration;
  try {
    offlineRegistration = await OfflineRegistration.create({
      team: teamId, teamSize: payment.teamSize, expectedAmount: payment.expectedAmount,
      utrId: req.body.utrId.trim(), status: "OFFLINE_SUBMITTED", submittedAt: new Date(),
      registrationCompleted: true, confirmationCode,
      payment: { amount: payment.expectedAmount, status: "submitted", provider: "manual_upi" },
      paymentScreenshot: { filename: req.file.filename, originalName: req.file.originalname, mimeType: req.file.mimetype, size: req.file.size },
    });
  } catch (error) {
    if (error?.code === 11000) throw new ApiError(409, "Offline registration has already been submitted for this team");
    throw error;
  }
  return sendSuccess(res, 201, "Offline registration submitted successfully", { offlineRegistration: serializeRegistration(offlineRegistration) });
});

export const getPaymentScreenshot = asyncHandler(async (req, res) => {
  const registration = await OfflineRegistration.findOne({ team: req.team._id });
  if (!registration?.paymentScreenshot?.filename) throw new ApiError(404, "Payment screenshot not found");
  return res.type(registration.paymentScreenshot.mimeType).sendFile(path.join(uploadRoot, "payment-proofs", registration.paymentScreenshot.filename));
});
