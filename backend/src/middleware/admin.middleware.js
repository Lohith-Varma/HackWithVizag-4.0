import { authorizeRoles } from "./auth.middleware.js";

export const requireAdmin = authorizeRoles("admin");
