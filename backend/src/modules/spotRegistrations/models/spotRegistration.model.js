import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Participant name is required"], trim: true, maxlength: 80 },
    email: {
      type: String,
      required: [true, "Participant email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Participant email is invalid"],
    },
    // Spot Registration intentionally treats phone as free-form required text.
    phone: { type: String, required: [true, "Participant phone is required"], trim: true },
    collegeName: { type: String, required: [true, "Participant college is required"], trim: true, maxlength: 160 },
  },
  { _id: false }
);

const screenshotSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    storageProvider: { type: String, enum: ["supabase"], required: true },
    bucket: { type: String, required: true },
    storagePath: { type: String, required: true },
  },
  { _id: false }
);

const spotRegistrationSchema = new mongoose.Schema(
  {
    registrationNumber: { type: String, required: true, unique: true, immutable: true, index: true },
    teamName: { type: String, required: [true, "Team name is required"], trim: true, maxlength: 100 },
    collegeName: { type: String, required: [true, "College is required"], trim: true, maxlength: 160 },
    teamSize: { type: Number, required: true, enum: [3, 4] },
    teamLeader: { type: participantSchema, required: true },
    members: {
      type: [participantSchema],
      required: true,
      validate: {
        validator(members) {
          return Array.isArray(members) && members.length === this.teamSize - 1;
        },
        message: "Member count must match the selected team size",
      },
    },
    participantEmails: { type: [String], required: true, select: false },
    calculatedFee: { type: Number, required: true, min: 0 },
    payment: {
      amount: { type: Number, required: true, min: 0 },
      utr: { type: String, required: [true, "UTR ID is required"], trim: true, maxlength: 100 },
      screenshot: { type: screenshotSchema, required: true },
    },
    status: {
      type: String,
      enum: ["SPOT_SUBMITTED", "SPOT_CONFIRMED"],
      default: "SPOT_SUBMITTED",
      index: true,
    },
    submittedAt: { type: Date, required: true, default: Date.now },
    confirmedAt: { type: Date, default: null },
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, versionKey: false }
);

// MongoDB's unique multikey index prevents an email from appearing in two
// SpotRegistration documents, closing the simultaneous-submission race.
spotRegistrationSchema.index(
  { participantEmails: 1 },
  { unique: true, name: "unique_spot_participant_email" }
);
spotRegistrationSchema.index({ status: 1, createdAt: -1 });
spotRegistrationSchema.index({ "teamLeader.email": 1 });

const SpotRegistration = mongoose.model("SpotRegistration", spotRegistrationSchema);

let indexesReadyPromise;
export const ensureSpotRegistrationIndexes = () => {
  if (!indexesReadyPromise) {
    indexesReadyPromise = SpotRegistration.createIndexes().catch((error) => {
      indexesReadyPromise = undefined;
      throw error;
    });
  }
  return indexesReadyPromise;
};

export default SpotRegistration;
