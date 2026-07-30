import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../utils/apiResponse.js";
import { getPaymentGatewayPlaceholder } from "../services/payment.service.js";

export const getPaymentPlaceholder = asyncHandler(async (_req, res) => {
  return sendSuccess(res, 200, "Payment placeholder fetched successfully", {
    payment: getPaymentGatewayPlaceholder(),
  });
});
