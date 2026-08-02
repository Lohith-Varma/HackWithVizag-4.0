import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: [true, "Team is required"],
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
      maxlength: [160, "Project title must not exceed 160 characters"],
    },
    theme: {
      type: String,
      required: [true, "Theme is required"],
      trim: true,
      maxlength: [120, "Theme must not exceed 120 characters"],
    },
    problemStatement: {
      type: String,
      required: [true, "Problem statement is required"],
      trim: true,
      maxlength: [3000, "Problem statement must not exceed 3000 characters"],
    },
    abstract: {
      type: String,
      required: [true, "Abstract is required"],
      trim: true,
      maxlength: [5000, "Abstract must not exceed 5000 characters"],
    },
    innovationSummary: {
      type: String,
      trim: true,
      maxlength: [3000, "Innovation summary must not exceed 3000 characters"],
      default: "",
    },
    technologyStack: {
      type: String,
      trim: true,
      maxlength: [1000, "Technology stack must not exceed 1000 characters"],
      default: "",
    },
    githubRepository: {
      type: String,
      trim: true,
      maxlength: [300, "GitHub repository must not exceed 300 characters"],
      default: "",
    },
    demoVideoUrl: {
      type: String,
      trim: true,
      maxlength: [300, "Demo video URL must not exceed 300 characters"],
      default: "",
    },
    pptFile: {
      url: String,
      path: String,
      originalName: String,
      mimeType: String,
      size: Number,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Project = mongoose.model("Project", projectSchema);

export default Project;
