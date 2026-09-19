import User from "../../auth/models/user.model.js";
import AuditLog from "../../admin/models/auditLog.model.js";

const requestMetadata = (req) => ({
  ip: String(req.ip || req.socket?.remoteAddress || "").slice(0, 100),
  userAgent: String(req.get?.("user-agent") || "").slice(0, 500),
  requestId: String(req.get?.("x-request-id") || "").slice(0, 200),
});

export const writeSpotAudit = async ({ req, action, registration, details = {} }) => {
  const actor = req.user?.id ? await User.findById(req.user.id).select("email").lean() : null;
  try {
    await AuditLog.create({
      action,
      actorAdminId: req.user?.id || null,
      actorAdminEmail: actor?.email || "",
      targetType: "SPOT_REGISTRATION",
      targetId: registration._id.toString(),
      targetLabel: registration.registrationNumber,
      result: "SUCCESS",
      requestMetadata: requestMetadata(req),
      details,
    });
  } catch (error) {
    console.error(`[audit] writeFailed action=${action} target=${registration._id} message=${error.message}`);
  }
};
