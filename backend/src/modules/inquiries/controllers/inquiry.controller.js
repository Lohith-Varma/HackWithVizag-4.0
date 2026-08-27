import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../utils/apiResponse.js";
import ApiError from "../../../utils/apiError.js";
import { sendInquiryEmail } from "../services/email.service.js";
import RegistrationLead from "../models/registrationLead.model.js";

export const submitInquiry = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  try {
    await sendInquiryEmail({ name, email, phone, subject, message });
    return sendSuccess(
      res,
      200,
      "Your inquiry has been emailed to hackwithvizag@nsrit.edu.in. Our team will get back to you shortly."
    );
  } catch (error) {
    console.error("Inquiry email sending failed:", error);
    throw new ApiError(
      500,
      "Unable to send inquiry email right now. Please try again later or contact hackwithvizag@nsrit.edu.in directly."
    );
  }
});

export const submitNotificationLead = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, "Valid email address is required");
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanName = (name || "").trim();

  const lead = await RegistrationLead.findOneAndUpdate(
    { email: cleanEmail },
    { name: cleanName, source: "registrations-opening-soon-page" },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return sendSuccess(
    res,
    200,
    "You have been added to the priority registration notification list.",
    { lead }
  );
});
