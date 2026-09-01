import mongoose from "mongoose";

const fileMetaSchema = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    path: { type: String, default: "" },
    originalName: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

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
      maxlength: [200, "Project title must not exceed 200 characters"],
    },
    theme: {
      type: String,
      required: [true, "Theme is required"],
      trim: true,
      maxlength: [150, "Theme must not exceed 150 characters"],
    },
    problemStatement: {
      type: String,
      required: [true, "Problem statement is required"],
      trim: true,
      maxlength: [4000, "Problem statement must not exceed 4000 characters"],
    },
    problemStatementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProblemStatement",
      default: null,
    },
    problemCode: {
      type: String,
      trim: true,
      default: "",
    },
    problemType: {
      type: String,
      enum: ["official", "open"],
      default: "official",
    },
    abstract: {
      type: String,
      required: [true, "Abstract is required"],
      trim: true,
      maxlength: [6000, "Abstract must not exceed 6000 characters"],
    },
    technologyStack: {
      type: String,
      trim: true,
      maxlength: [1000, "Technology stack must not exceed 1000 characters"],
      default: "",
    },
    githubRepository: {
      type: String,
      required: [true, "GitHub repository link is required"],
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
      type: fileMetaSchema,
      default: () => ({}),
    },
    supportingDocFile: {
      type: fileMetaSchema,
      default: () => ({}),
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
