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
      default: 3,
      min: 3,
    },
    maxTeamSize: {
      type: Number,
      required: true,
      default: 4,
      min: 3,
      max: 4,
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
    theme: {
      type: String,
      default: "Innovation for Coastal Infrastructure, Sustainability & AI",
    },
    description: {
      type: String,
      default: "Hack With Vizag 4.0 is Andhra Pradesh's premier flagship coastal tech hackathon bringing together visionary student developers and innovators.",
    },
    venue: {
      type: String,
      default: "NSRIT Campus Auditorium, Visakhapatnam, Andhra Pradesh",
    },
    rules: {
      type: [String],
      default: [
        "Teams must consist of 3 to 4 participants.",
        "Plagiarism or pre-built commercial products will lead to instant disqualification.",
        "All code must be committed to the public GitHub repository during the hackathon timeline.",
        "The decision of the jury panel is final and binding.",
      ],
    },
    schedule: {
      type: [mongoose.Schema.Types.Mixed],
      default: [
        { phase: "Registration Starts", date: "2026-01-01" },
        { phase: "Online Submission Deadline", date: "2026-09-05" },
        { phase: "Screening & Results Announcement", date: "2026-09-10" },
        { phase: "Grand Offline Hackathon Finale", date: "2026-09-25" },
      ],
    },
    prizePool: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        total: "INR 1,50,000+",
        firstPrize: "INR 75,000",
        secondPrize: "INR 45,000",
        thirdPrize: "INR 30,000",
      },
    },
    faqs: {
      type: [mongoose.Schema.Types.Mixed],
      default: [
        { question: "Who is eligible to participate?", answer: "All undergraduate and postgraduate engineering and technology students across India." },
        { question: "Is there a registration fee?", answer: "Registration for the online round is completely free of charge." },
      ],
    },
    sponsors: {
      type: [mongoose.Schema.Types.Mixed],
      default: [
        { name: "NSRIT Visakhapatnam", logo: "", category: "Organizer" },
        { name: "Vizag Tech Hub", logo: "", category: "Ecosystem Partner" },
      ],
    },
    contactInfo: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        email: "hackwithvizag@nsrit.edu.in",
        phone: "+91 91234 56789",
        address: "NSRIT Campus, Sontyam, Visakhapatnam, AP - 531173",
      },
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
