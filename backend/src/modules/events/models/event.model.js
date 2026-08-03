import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: [true, "Event name is required"],
      trim: true,
      default: "Hack With Vizag 4.0",
    },
    eventYear: {
      type: String,
      required: [true, "Event year is required"],
      trim: true,
      default: "2026",
    },
    registrationStartDate: {
      type: Date,
      default: () => new Date("2026-01-01T00:00:00Z"),
    },
    registrationEndDate: {
      type: Date,
      default: () => new Date("2026-08-31T23:59:59Z"),
    },
    onlineSubmissionDeadline: {
      type: Date,
      default: () => new Date("2026-09-05T23:59:59Z"),
    },
    screeningResultDate: {
      type: Date,
      default: () => new Date("2026-09-10T00:00:00Z"),
    },
    offlineRegistrationStartDate: {
      type: Date,
      default: () => new Date("2026-09-11T00:00:00Z"),
    },
    offlineRegistrationEndDate: {
      type: Date,
      default: () => new Date("2026-09-18T23:59:59Z"),
    },
    hackathonDate: {
      type: Date,
      default: () => new Date("2026-09-25T09:00:00Z"),
    },
    registrationFee: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    minTeamSize: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    maxTeamSize: {
      type: Number,
      required: true,
      default: 4,
      min: 1,
    },
    minAbstractWords: {
      type: Number,
      required: true,
      default: 50,
      min: 10,
    },
    maxAbstractWords: {
      type: Number,
      required: true,
      default: 500,
      min: 50,
    },
    maxPptSizeMb: {
      type: Number,
      required: true,
      default: 15,
      min: 1,
    },
    maxSupportingDocSizeMb: {
      type: Number,
      required: true,
      default: 15,
      min: 1,
    },
    allowedPptFormats: {
      type: [String],
      default: [".ppt", ".pptx", ".pdf"],
    },
    allowedSupportingDocFormats: {
      type: [String],
      default: [".pdf", ".zip", ".rar", ".doc", ".docx"],
    },
    allowedVideoPlatforms: {
      type: [String],
      default: ["youtube.com", "youtu.be"],
    },
    eventStatus: {
      type: String,
      enum: ["Draft", "Published", "Closed"],
      default: "Published",
    },
    activeEvent: {
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

const Event = mongoose.model("Event", eventSchema);

export default Event;
