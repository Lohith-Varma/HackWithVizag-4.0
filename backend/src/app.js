import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { getDatabaseStatus } from "./config/database.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import adminRoutes from "./modules/admin/routes/admin.routes.js";
import authRoutes from "./modules/auth/routes/auth.routes.js";
import dashboardRoutes from "./modules/dashboard/routes/dashboard.routes.js";
import eventRoutes from "./modules/events/routes/event.routes.js";
import problemStatementRoutes from "./modules/problemStatements/routes/problemStatement.routes.js";
import inquiryRoutes from "./modules/inquiries/routes/inquiry.routes.js";
import offlineRegistrationRoutes from "./modules/offlineRegistration/routes/offlineRegistration.routes.js";
import paymentRoutes from "./modules/payments/routes/payment.routes.js";
import projectRoutes from "./modules/projects/routes/project.routes.js";
import submissionRoutes from "./modules/submissions/routes/submission.routes.js";
import teamRoutes from "./modules/teams/routes/team.routes.js";
import userRoutes from "./modules/users/routes/users.routes.js";
import ApiError from "./utils/apiError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = [
  ...(process.env.CLIENT_URL || "").split(",").map((o) => o.trim()).filter(Boolean),
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "https://www.hackwithvizag.com",
  "https://hackwithvizag.com",
];

// Simple NoSQL Injection Sanitizer
const sanitizeInput = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  for (const key in obj) {
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
    } else if (typeof obj[key] === "object") {
      sanitizeInput(obj[key]);
    }
  }
  return obj;
};

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        return callback(null, true);
      }

      return callback(new ApiError(403, "Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use((req, _res, next) => {
  if (req.body) sanitizeInput(req.body);
  if (req.query) sanitizeInput(req.query);
  if (req.params) sanitizeInput(req.params);
  next();
});
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));


app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/api/health", (_req, res) => {
  return res.status(200).json({
    success: true,
    message: "Hack With Vizag Backend Running",
    database: getDatabaseStatus(),
  });
});

app.use("/api/event", eventRoutes);
app.use("/api/problem-statements", problemStatementRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/inquiry", inquiryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/offline-registration", offlineRegistrationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
