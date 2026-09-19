import "dotenv/config";
import http from "http";
import mongoose from "mongoose";
import app from "./app.js";
import connectDatabase from "./config/database.js";
import { ensureSpotRegistrationIndexes } from "./modules/spotRegistrations/models/spotRegistration.model.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`Hack With Vizag backend running on port ${PORT}`);
  });

  try {
    await connectDatabase();
    // Production disables global auto-indexing. Create only this new model's
    // declared indexes so its registration-number and participant-email
    // uniqueness guarantees are active before public submissions arrive.
    await ensureSpotRegistrationIndexes();
  } catch (error) {
    console.warn("MongoDB connection/index warning:", error.message);
  }

  const shutdown = (signal) => {
    console.log(`${signal} received. Shutting down server`);
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

startServer();
