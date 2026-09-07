import mongoose from "mongoose";
const offlineRegistrationSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
      unique: true,
      index: true,
    },
    contactName: {
      type: String,
      trim: true,
      default: "",
      maxlength: [80, "Contact name must not exceed 80 characters"],
    },
    contactPhone: {
      type: String,
      trim: true,
      default: "",
    },
    arrivalDate: {
      type: Date,
      default: null,
    },
    accommodationRequired: {
      type: Boolean,
      default: false,
    },
    registrationCompleted: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["PAYMENT_PENDING", "OFFLINE_SUBMITTED"],
      default: "PAYMENT_PENDING",
      index: true,
    },
    teamSize: { type: Number, required: true, enum: [3, 4] },
    expectedAmount: { type: Number, required: true, min: 0 },
    utrId: {
      type: String,
      required: [true, "UTR ID is required"],
      trim: true,
      minlength: [6, "UTR ID must be at least 6 characters"],
      maxlength: [64, "UTR ID must not exceed 64 characters"],
    },
    paymentScreenshot: {
      filename: { type: String, required: true },
      originalName: { type: String, required: true },
      mimeType: { type: String, required: true },
      size: { type: Number, required: true },
    },
    submittedAt: { type: Date, default: null },
    confirmationCode: {
      type: String,
      trim: true,
      default: "",
    },
    payment: {
      amount: {
        type: Number,
        default: 0,
      },
      status: { type: String, default: "submitted" },
      provider: { type: String, default: "manual_upi" },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const OfflineRegistration = mongoose.model("OfflineRegistration", offlineRegistrationSchema);

export default OfflineRegistration;
