import express from "express";
import {
  getMyNotificationsController,
  markReadController,
  markAllReadController,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/me", getMyNotificationsController);
router.put("/:id/read", markReadController);
router.put("/me/read-all", markAllReadController);

export default router;
