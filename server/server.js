import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const PORT = process.env.PORT || 5001;

app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);

app.get("/api/v1/health", (req, res) => {
  res.json({
    message: "QueenB Server is running!",
    timestamp: new Date().toISOString(),
    status: "healthy",
  });
});

app.get("/", (req, res) => {
  res.json({ message: "Welcome to QueenB API" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Something went wrong!",
  });
});

app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const mongoUri = process.env.MONGO_URI;

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("🌱 Connected to MongoDB successfully!");
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📱 Health check: http://localhost:${PORT}/api/v1/health`);
    });
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
  });
