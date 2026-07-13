import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import prisma from "./config/prisma.js";

console.log("Prisma User Model:", prisma.user);
console.log("Prisma Models:", Object.keys(prisma));

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

app.get("/api/health", async (req, res) => {
  try {
    const userCount = await prisma.user.count();

    res.status(200).json({
      success: true,
      message: "Hack With Vizag API is running",
      database: "connected",
      users: userCount,
    });
  } catch (error) {
    console.error("Health Check Error:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

export default app;