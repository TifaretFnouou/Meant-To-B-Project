import { verifyToken } from "../services/authService.js";
import {
  createMeeting,
  bookFromAvailability,
  rebookFromAvailability,
  approveMeeting,
  proposeTimes,
  selectTime,
  rejectMeeting,
  getUserMeetings,
  requestMoreSlots,
  markUnavailable,
  submitFeedback,
} from "../services/meetingService.js";

function statusFromError(error, fallback = 400) {
  return error.status || fallback;
}

export const createMeetingController = async (req, res) => {
  try {
    const actor = verifyToken(req);
    const { mentorId } = req.body;

    if (!mentorId) {
      return res.status(400).json({ message: "Mentor ID is required" });
    }

    const meeting = await createMeeting(actor.id, mentorId);
    res.status(201).json({ message: "Meeting requested successfully", meeting });
  } catch (err) {
    res.status(statusFromError(err)).json({ error: err.message });
  }
};

export const bookFromAvailabilityController = async (req, res) => {
  try {
    const actor = verifyToken(req);
    const { mentorId, selectedTime } = req.body || {};

    if (!mentorId) {
      return res.status(400).json({ message: "Mentor ID is required" });
    }
    if (!selectedTime?.startTime || !selectedTime?.endTime) {
      return res.status(400).json({ message: "Selected time is required" });
    }

    const meeting = await bookFromAvailability(actor.id, mentorId, selectedTime);
    const populated = await getUserMeetings(actor.id).then((list) =>
      list.find((m) => String(m._id) === String(meeting._id))
    );

    res.status(201).json({
      message: "Meeting booked successfully",
      meeting: populated || meeting,
    });
  } catch (err) {
    res.status(statusFromError(err)).json({ error: err.message });
  }
};

export const rebookFromAvailabilityController = async (req, res) => {
  try {
    const actor = verifyToken(req);
    const selectedTime = req.body?.selectedTime;

    if (!selectedTime?.startTime || !selectedTime?.endTime) {
      return res.status(400).json({ message: "Selected time is required" });
    }

    const meeting = await rebookFromAvailability(req.params.id, actor.id, selectedTime);
    res.status(200).json({ message: "Meeting rebooked successfully", meeting });
  } catch (err) {
    res.status(statusFromError(err)).json({ error: err.message });
  }
};

export const approveMeetingController = async (req, res) => {
  try {
    const actor = verifyToken(req);
    const meeting = await approveMeeting(req.params.id, actor.id);
    res.status(200).json({
      message: "Meeting approved successfully",
      meeting,
    });
  } catch (err) {
    res.status(statusFromError(err)).json({ error: err.message });
  }
};

export const proposeTimesController = async (req, res) => {
  try {
    const actor = verifyToken(req); // the logged in user (the mentor who proposes the times)
    const { proposedTimes } = req.body; // expect an array of objects { startTime, endTime }

    if (!proposedTimes || !Array.isArray(proposedTimes) || proposedTimes.length === 0) {
      return res.status(400).json({ message: "Please provide at least one proposed time" });
    }

    if (proposedTimes.length > 3) {
      return res.status(400).json({ message: "You can propose up to 3 time options" });
    }

    const meeting = await proposeTimes(req.params.id, actor.id, proposedTimes);
    res.status(200).json({ message: "Times proposed successfully", meeting });
  } catch (err) {
    res.status(statusFromError(err)).json({ error: err.message });
  }
};

export const selectTimeController = async (req, res) => {
  try {
    const actor = verifyToken(req); // the logged in user (the mentee who selects the time)
    const selectedTime = req.body?.selectedTime;

    if (!selectedTime || !selectedTime.startTime || !selectedTime.endTime) {
      return res.status(400).json({ message: "Selected time is required" });
    }

    const actorId = actor.id || actor._id;
    if (!actorId) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    const meeting = await selectTime(req.params.id, actorId, selectedTime);
    res.status(200).json({ message: "Time selected successfully. It's a match!", meeting });
  } catch (err) {
    res.status(statusFromError(err)).json({ error: err.message });
  }
};

export const rejectMeetingController = async (req, res) => {
  try {
    const actor = verifyToken(req);
    const meeting = await rejectMeeting(req.params.id, actor.id);
    res.status(200).json({ message: "Meeting rejected/cancelled successfully", meeting });
  } catch (err) {
    res.status(statusFromError(err)).json({ error: err.message });
  }
};

export const getMyMeetingsController = async (req, res) => {
  try {
    const actor = verifyToken(req);
    const isAdmin = Array.isArray(actor.roles) && actor.roles.includes("admin");
    const meetings = await getUserMeetings(actor.id, { isAdmin });
    res.status(200).json({ data: meetings });
  } catch (err) {
    res.status(statusFromError(err)).json({ error: err.message });
  }
};

export const submitFeedbackController = async (req, res) => {
  try {
    const actor = verifyToken(req);
    const rating = req.body?.rating ?? req.body?.feedback?.rating;
    const comments =
      req.body?.comments ??
      req.body?.comment ??
      req.body?.feedback?.comments ??
      req.body?.feedback?.comment ??
      "";

    const meeting = await submitFeedback(req.params.id, actor.id, { rating, comments });
    res.status(200).json({ message: "Feedback submitted successfully", meeting });
  } catch (err) {
    res.status(statusFromError(err)).json({ error: err.message });
  }
};

export const requestMoreSlotsController = async (req, res) => {
  try {
    const actor = verifyToken(req);
    const actorId = actor.id || actor._id;
    const { meeting, cancelled } = await requestMoreSlots(req.params.id, actorId);

    res.status(200).json({
      message: "More slots requested. Waiting for mentor to propose new times.",
      meeting,
      cancelled,
    });
  } catch (err) {
    res.status(statusFromError(err)).json({ error: err.message });
  }
};

export const markUnavailableController = async (req, res) => {
  try {
    const actor = verifyToken(req);
    const { meeting, cancelled } = await markUnavailable(req.params.id, actor.id);

    res.status(200).json({
      message: cancelled
        ? "Max reschedules reached. Meeting cancelled."
        : "Meeting marked unavailable. Awaiting new times.",
      meeting,
      cancelled,
    });
  } catch (err) {
    res.status(statusFromError(err)).json({ error: err.message });
  }
};
