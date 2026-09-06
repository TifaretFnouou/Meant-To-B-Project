import { verifyToken } from "../services/authService.js";
import {
  getMyAvailability,
  setWeekAvailability,
  getMentorOpenSlots,
  requestMoreAvailability,
} from "../services/availabilityService.js";

function statusFromError(error, fallback = 400) {
  return error.status || fallback;
}

export const getMyAvailabilityController = async (req, res) => {
  try {
    const actor = verifyToken(req);
    const data = await getMyAvailability(actor.id);
    res.status(200).json({ data });
  } catch (err) {
    res.status(statusFromError(err, 401)).json({ error: err.message });
  }
};

export const setMyAvailabilityController = async (req, res) => {
  try {
    const actor = verifyToken(req);
    const { weekStart, weekEnd, slots } = req.body || {};

    if (!weekStart || !weekEnd) {
      return res.status(400).json({ message: "weekStart and weekEnd are required" });
    }

    const data = await setWeekAvailability(actor.id, weekStart, weekEnd, slots || []);
    res.status(200).json({ message: "Availability saved", data });
  } catch (err) {
    res.status(statusFromError(err, 401)).json({ error: err.message });
  }
};

export const getMentorAvailabilityController = async (req, res) => {
  try {
    verifyToken(req);
    const data = await getMentorOpenSlots(req.params.mentorId);
    res.status(200).json({ data });
  } catch (err) {
    res.status(statusFromError(err, 401)).json({ error: err.message });
  }
};

export const requestMoreAvailabilityController = async (req, res) => {
  try {
    const actor = verifyToken(req);
    const data = await requestMoreAvailability(
      actor.id,
      req.params.mentorId,
      req.body?.message
    );
    res.status(200).json({
      message: "Availability request sent to the mentor",
      data,
    });
  } catch (err) {
    res.status(statusFromError(err, 401)).json({ error: err.message });
  }
};
