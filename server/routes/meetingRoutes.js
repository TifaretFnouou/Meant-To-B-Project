import express from "express";
import {
  createMeetingController,
  proposeTimesController,
  selectTimeController,
  rejectMeetingController,
  getMyMeetingsController,
  requestMoreSlotsController,
  markUnavailableController,
} from "../controllers/meetingController.js";
const router = express.Router();

router.post("/", createMeetingController);
router.get("/my-meetings", getMyMeetingsController);
router.put("/:id/propose-times", proposeTimesController);
router.put("/:id/select-time", selectTimeController);
router.put("/:id/reject", rejectMeetingController);
router.put("/:id/request-more-slots", requestMoreSlotsController);
router.put("/:id/mark-unavailable", markUnavailableController);

export default router;


