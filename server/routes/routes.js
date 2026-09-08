import express from "express";
import userRoutes from "./userRoutes.js";
import authRoutes from "./authRoutes.js";
import meetingRoutes from "./meetingRoutes.js";
import adminRoutes from "./adminRoutes.js";

const router = express.Router();
const baseURL = "api/v1";

// connect routes
router.use(`/${baseURL}/users`, userRoutes);
router.use(`/${baseURL}/auth`, authRoutes);
router.use(`/${baseURL}/meetings`, meetingRoutes);
router.use(`/${baseURL}/admin`, adminRoutes);
export default router;
