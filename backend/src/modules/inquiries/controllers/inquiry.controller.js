import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../utils/apiResponse.js";
import ApiError from "../../../utils/apiError.js";
import { sendInquiryEmail } from "../services/email.service.js";

export const submitInquiry = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  try {
    await sendInquiryEmail({ name, email, phone, subject, message });
    return sendSuccess(res, 200, "Your inquiry has been sent successfully. We will get back to you shortly.");
  } catch (error) {
    console.error("Inquiry email sending failed:", error);
    throw new ApiError(500, "Unable to send inquiry email right now. Please try again later or contact hackwithvizag@nsrit.edu.in directly.");
  }
});
