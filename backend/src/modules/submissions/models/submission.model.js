import mongoose from "mongoose";
import { SUBMISSION_STATUSES } from "../../../utils/constants.js";

const submissionSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
      unique: true,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      unique: true,
      index: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: SUBMISSION_STATUSES,
      default: "draft",
      index: true,
    },
    finalSubmittedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Submission = mongoose.model("Submission", submissionSchema);

export default Submission;
