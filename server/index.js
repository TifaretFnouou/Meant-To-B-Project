// must be loaded before other imports so that modules that call process.env at loading time will receive values
import "dotenv/config";

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chat.routes.js";
import meetingRoutes from "./routes/meetingRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { startMeetingReminderJob } from "./services/meetingReminderService.js";

const app = express();
const PORT = process.env.PORT || 5001;

app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
// matches 20 messages × 2,000 characters, including UTF-8 and still limits the payload
app.use(express.json({ limit: "128kb" }));
app.use(express.urlencoded({ extended: true, limit: "128kb" }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get("/", (req, res) => {
  res.json({ message: "Welcome to QueenB API" });
});

app.get("/api/v1/health", (req, res) => {
  res.json({
    message: "QueenB Server is running!",
    timestamp: new Date().toISOString(),
    status: "healthy",
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/meetings", meetingRoutes);
app.use("/api/v1/availability", availabilityRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/admin", adminRoutes);

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ code: "INVALID_JSON", error: "Invalid JSON body" });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({ code: "PAYLOAD_TOO_LARGE", error: "Request body is too large" });
  }

    // error codes (4xx) send a useful message to the client, but server errors do not expose internal details
  const status = err.status || 500;
  if (status >= 500) {
    console.error(err.stack);
  }

  res.status(status).json({
    code: status >= 500 ? "SERVER_ERROR" : "REQUEST_ERROR",
    error: status >= 500 ? "Something went wrong!" : err.message,
  });
});

app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

async function start() {
  try {
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 3000,
      });
      console.log("🌱 Connected to MongoDB successfully!");
    } else {
      console.warn("⚠️ MONGO_URI not set — starting without database");
    }
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    console.warn("⚠️ Starting API without MongoDB (chat still available)");
  }

  if (mongoose.connection.readyState === 1) {
    startMeetingReminderJob();
  }

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📱 Health check: http://localhost:${PORT}/api/v1/health`);
    console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/v1/chat`);
  });

  server.on("error", (err) => {
    console.error("❌ Server listen error:", err.message);
    process.exit(1);
  });
}

start();
