import mongoose from "mongoose";
import { PAYMENT_STATUSES } from "../../../utils/constants.js";

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
      required: [true, "Contact name is required"],
      trim: true,
      maxlength: [80, "Contact name must not exceed 80 characters"],
    },
    contactPhone: {
      type: String,
      required: [true, "Contact phone is required"],
      trim: true,
      match: [/^[6-9]\d{9}$/, "Contact phone must be a valid 10 digit Indian mobile number"],
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
    payment: {
      amount: {
        type: Number,
        default: 0,
      },
      status: {
        type: String,
        enum: PAYMENT_STATUSES,
        default: "pending",
      },
      provider: {
        type: String,
        default: "placeholder",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const OfflineRegistration = mongoose.model("OfflineRegistration", offlineRegistrationSchema);

export default OfflineRegistration;
