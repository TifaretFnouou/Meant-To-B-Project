import express from "express";
import {
  createMeetingController,
  bookFromAvailabilityController,
  rebookFromAvailabilityController,
  approveMeetingController,
  proposeTimesController,
  selectTimeController,
  rejectMeetingController,
  getMyMeetingsController,
  requestMoreSlotsController,
  markUnavailableController,
  submitFeedbackController,
} from "../controllers/meetingController.js";
const router = express.Router();

router.post("/", createMeetingController);
router.post("/book", bookFromAvailabilityController);
router.get("/my-meetings", getMyMeetingsController);
router.put("/:id/propose-times", proposeTimesController);
router.put("/:id/select-time", selectTimeController);
router.put("/:id/rebook", rebookFromAvailabilityController);
router.put("/:id/approve", approveMeetingController);
router.put("/:id/reject", rejectMeetingController);
router.put("/:id/request-more-slots", requestMoreSlotsController);
router.put("/:id/mark-unavailable", markUnavailableController);
router.put("/:id/feedback", submitFeedbackController);

export default router;


