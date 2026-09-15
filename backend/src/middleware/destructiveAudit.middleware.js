import AuditLog from "../modules/admin/models/auditLog.model.js";

const DELETE_ROUTE = /^\/api\/admin\/(?:team|teams|users)\/([a-f\d]{24})\/?$/i;

export const auditDeniedDestructiveRequest = (req, res, next) => {
  const match = req.method === "DELETE" ? req.originalUrl.split("?")[0].match(DELETE_ROUTE) : null;
  if (!match) return next();

  res.on("finish", () => {
    if (![401, 403].includes(res.statusCode)) return;
    const targetType = req.originalUrl.includes("/users/") ? "USER" : "TEAM";
    AuditLog.create({
      action: "UNAUTHORIZED_DELETE_ATTEMPT",
      actorAdminId: req.user?.id || null,
      targetType,
      targetId: match[1],
      result: "DENIED",
      reason: res.statusCode === 401 ? "Authentication required" : "Admin authorization required",
      requestMetadata: {
        ip: String(req.ip || req.socket?.remoteAddress || "").slice(0, 100),
        userAgent: String(req.get("user-agent") || "").slice(0, 500),
        requestId: String(req.get("x-request-id") || "").slice(0, 200),
      },
    }).catch((error) => console.error(`[audit] unauthorizedAttemptWriteFailed message=${error.message}`));
  });
  return next();
};
