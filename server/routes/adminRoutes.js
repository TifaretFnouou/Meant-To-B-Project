import express from "express";
import { requireAuth, isAdmin } from "../middleware/authMiddleware.js";
import {
  getAdminMeetingsReport,
  getAdminAlerts,
} from "../controllers/adminController.js";
import {
  getConfigController,
  addTechController,
  removeTechController,
  addTopicController,
  removeTopicController,
} from "../controllers/configController.js";

const router = express.Router();

// it runs both middleware functions on *all* routes in this file
router.use(requireAuth, isAdmin);

// these routes will be protected automatically
router.get("/meetings", getAdminMeetingsReport);
router.get("/alerts", getAdminAlerts);

// Categories & Tags config
router.get("/config", getConfigController);
router.post("/config/tech-stack", addTechController);
router.delete("/config/tech-stack/:item", removeTechController);
router.post("/config/advice-topics", addTopicController);
router.delete("/config/advice-topics/:item", removeTopicController);

export default router;