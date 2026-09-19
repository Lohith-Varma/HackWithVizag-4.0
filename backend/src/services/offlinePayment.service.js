import Event from "../modules/events/models/event.model.js";
import ApiError from "../utils/apiError.js";

export const getOfflinePaymentConfig = async (teamSize, { required = true } = {}) => {
  const size = Number(teamSize);
  if (![3, 4].includes(size)) {
    throw new ApiError(400, "Registration is available only for 3 or 4 member teams");
  }

  const event = await Event.findOne({ activeEvent: true });
  const config = size === 3
    ? event?.offlinePaymentConfig?.threeMembers
    : event?.offlinePaymentConfig?.fourMembers;
  const configured = Boolean(config?.qrCodeUrl) && Number.isFinite(config?.fee) && config.fee > 0;

  if (!configured && required) {
    throw new ApiError(503, "Offline payment configuration is not available. Please contact the organisers.");
  }

  return {
    teamSize: size,
    expectedAmount: configured ? config.fee : null,
    qrCodeUrl: configured ? config.qrCodeUrl : "",
    configured,
  };
};
