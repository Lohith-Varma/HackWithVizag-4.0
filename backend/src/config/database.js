import mongoose from "mongoose";

export const connectDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is required");
  }

  mongoose.set("strictQuery", true);

  const connection = await mongoose.connect(mongoUri, {
    autoIndex: process.env.NODE_ENV !== "production",
    serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 10000),
  });

  console.log(`MongoDB connected: ${connection.connection.host}`);
  return connection;
};

export const getDatabaseStatus = () => {
  return mongoose.connection.readyState === 1 ? "connected" : "disconnected";
};

export default connectDatabase;
