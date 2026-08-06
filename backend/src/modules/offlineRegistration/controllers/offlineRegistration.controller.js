import OfflineRegistration from "../models/offlineRegistration.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import ApiError from "../../../utils/apiError.js";
import { sendSuccess } from "../../../utils/apiResponse.js";

export const getOfflineRegistrationEligibility = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, "Team is eligible for offline registration", {
    eligible: true,
    team: req.team,
  });
});

export const getOfflineRegistration = asyncHandler(async (req, res) => {
  const teamId = req.team?._id || req.params.teamId;
  const offlineRegistration = await OfflineRegistration.findOne({ team: teamId }).populate("team");

  return sendSuccess(res, 200, "Offline registration fetched successfully", { offlineRegistration });
});

export const saveOfflineRegistration = asyncHandler(async (req, res) => {
  const teamId = req.team?._id || req.params.teamId;
  const offlineRegistration = await OfflineRegistration.findOneAndUpdate(
    { team: teamId },
    {
      team: teamId,
      contactName: req.body.contactName || req.body.emergencyContactName,
      contactPhone: req.body.contactPhone || req.body.emergencyContactPhone,
      arrivalDate: req.body.arrivalDate || req.body.arrivalDateTime || null,
      accommodationRequired: Boolean(req.body.accommodationRequired),
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  ).populate("team");

  return sendSuccess(res, 200, "Offline registration saved successfully", { offlineRegistration });
});

export const completeOfflineRegistration = asyncHandler(async (req, res) => {
  const teamId = req.team?._id || req.params.teamId;
  const offlineRegistration = await OfflineRegistration.findOneAndUpdate(
    { team: teamId },
    {
      registrationCompleted: true,
      "payment.status": "completed",
    },
    {
      new: true,
      runValidators: true,
    }
  ).populate("team");

  if (!offlineRegistration) {
    throw new ApiError(404, "Offline registration not found");
  }

  return sendSuccess(res, 200, "Offline registration completed successfully", { offlineRegistration });
});
