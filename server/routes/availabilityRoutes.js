import express from "express";
import {
  getMyAvailabilityController,
  setMyAvailabilityController,
  getMentorAvailabilityController,
  requestMoreAvailabilityController,
} from "../controllers/availabilityController.js";

const router = express.Router();

router.get("/me", getMyAvailabilityController);
router.put("/me", setMyAvailabilityController);
router.get("/mentor/:mentorId", getMentorAvailabilityController);
router.post("/mentor/:mentorId/request", requestMoreAvailabilityController);

export default router;
