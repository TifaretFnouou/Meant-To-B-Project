import express from "express";
import { handleChat } from "../controllers/chatController.js";

const router = express.Router();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 15;
const requestsByIp = new Map();

const chatRateLimit = (req, res, next) => {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const recentRequests = (requestsByIp.get(key) || []).filter(
    (timestamp) => now - timestamp < WINDOW_MS
  );

  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((WINDOW_MS - (now - recentRequests[0])) / 1000)
    );
    res.set("Retry-After", String(retryAfterSeconds));
    return res.status(429).json({
      code: "RATE_LIMITED",
      error: "Too many chat requests",
    });
  }

  recentRequests.push(now);
  requestsByIp.set(key, recentRequests);

  // ניקוי עצל מונע מה-Map לגדול ללא גבול בלי להחזיק timer שמונע מהשרת להיסגר
  if (requestsByIp.size > 1_000) {
    for (const [ip, timestamps] of requestsByIp) {
      if (timestamps.every((timestamp) => now - timestamp >= WINDOW_MS)) {
        requestsByIp.delete(ip);
      }
    }
  }

  next();
};

// POST /api/v1/chat
router.post("/", chatRateLimit, handleChat);

export default router;
