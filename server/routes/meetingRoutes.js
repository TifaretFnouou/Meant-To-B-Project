import express from "express";
import {
  createMeetingController,
  proposeTimesController,
  selectTimeController,
  rejectMeetingController,
  getMyMeetingsController,
  markUnavailableController
} from "../controllers/meetingController.js";
const router = express.Router();

router.post("/", createMeetingController); // create a new meeting
router.put("/:id/propose-times", proposeTimesController); // propose times to the mentor
router.put("/:id/select-time", selectTimeController); // select a time from the proposed times
router.put("/:id/reject", rejectMeetingController); // reject the meeting
router.get("/my-meetings", getMyMeetingsController); // get all the meetings of the logged in user
router.put("/:id/mark-unavailable", markUnavailableController); // mark the meeting as unavailable

export default router;


