import mongoose from "mongoose";

const problemStatementSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      index: true,
    },
    code: {
      type: String,
      required: [true, "Problem statement code is required"],
      trim: true,
      unique: true,
    },
    title: {
      type: String,
      required: [true, "Problem statement title is required"],
      trim: true,
    },
    theme: {
      type: String,
      required: [true, "Theme is required"],
      trim: true,
    },
    problemStatement: {
      type: String,
      required: [true, "Problem description is required"],
      trim: true,
    },
    objectives: {
      type: [String],
      default: [],
    },
    onlineRoundRequirements: {
      type: String,
      required: [true, "Online round requirements are required"],
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard", "Advanced"],
      default: "Medium",
      index: true,
    },
    technologies: {
      type: [String],
      default: [],
    },
    organization: {
      type: String,
      trim: true,
      default: "HackWithVizag Team",
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    attachmentUrl: {
      type: String,
      trim: true,
      default: "",
    },
    type: {
      type: String,
      enum: ["official", "open"],
      default: "official",
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    activeStatus: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const ProblemStatement = mongoose.model("ProblemStatement", problemStatementSchema);

export default ProblemStatement;
