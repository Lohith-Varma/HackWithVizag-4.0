import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        "TEAM_DELETED",
        "USER_DELETED",
        "TEAM_DELETE_FAILED",
        "USER_DELETE_FAILED",
        "UNAUTHORIZED_DELETE_ATTEMPT",
        "SPOT_REGISTRATION_CREATED",
        "SPOT_REGISTRATION_UPDATED",
        "SPOT_REGISTRATION_CONFIRMED",
      ],
      index: true,
    },
    actorAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    actorAdminEmail: { type: String, trim: true, lowercase: true, default: "" },
    targetType: { type: String, enum: ["TEAM", "USER", "SPOT_REGISTRATION"], required: true, index: true },
    targetId: { type: String, required: true, trim: true, index: true },
    targetLabel: { type: String, trim: true, default: "" },
    result: {
      type: String,
      enum: ["SUCCESS", "FAILED", "DENIED", "PARTIAL_FAILURE", "PENDING_STORAGE"],
      required: true,
      index: true,
    },
    reason: { type: String, trim: true, maxlength: 1000, default: "" },
    requestMetadata: {
      ip: { type: String, trim: true, maxlength: 100, default: "" },
      userAgent: { type: String, trim: true, maxlength: 500, default: "" },
      requestId: { type: String, trim: true, maxlength: 200, default: "" },
    },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Audit history is intentionally exposed without update/delete application routes.
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
