import { authorizeRoles } from "./auth.middleware.js";

export const requireReviewer = authorizeRoles("reviewer", "admin");
