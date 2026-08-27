import mongoose from "mongoose";

const registrationLeadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    source: {
      type: String,
      default: "registrations-opening-soon-page",
    },
  },
  {
    timestamps: true,
  }
);

const RegistrationLead = mongoose.model("RegistrationLead", registrationLeadSchema);

export default RegistrationLead;
