import MeetingModel from "../models/meeting.js";

/** Normalize Mongo ObjectId / populated doc / string to a comparable id string */
function normalizeId(value) {
  if (value == null) return "";
  if (typeof value === "object") {
    return String(value._id ?? value.id ?? "");
  }
  return String(value);
}

function sameInstant(a, b) {
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  if (Number.isNaN(ta) || Number.isNaN(tb)) return false;
  // Allow tiny serialization drift between client/server Date handling
  return Math.abs(ta - tb) < 1000;
}

/**
 * Shared video room for mentor + mentee.
 * Uses Jitsi (works without Google OAuth); both parties get the same URL.
 */
export function generateMeetLink(meetingId) {
  const safeId = String(meetingId).replace(/[^a-zA-Z0-9]/g, "").slice(-16) || "room";
  return `https://meet.jit.si/QueenB-${safeId}`;
}

// 1. create a new meeting (mentee requests a meeting)
export async function createMeeting(menteeId, mentorId) {
  if (normalizeId(menteeId) === normalizeId(mentorId)) {
    throw Object.assign(new Error("You cannot book a meeting with yourself"), { status: 400 });
  }

  // Only one active meeting at a time for a mentee (any mentor)
  const activeForMentee = await MeetingModel.findOne({
    menteeId,
    status: { $in: ["PENDING_MENTOR_TIMES", "PENDING_MENTEE_SELECTION", "MATCHED"] },
  });

  if (activeForMentee) {
    throw Object.assign(
      new Error("You already have an active meeting request. Cancel or complete it before booking another."),
      { status: 400 }
    );
  }

  // Also block duplicate open request with the same mentor (safety)
  const existingMeeting = await MeetingModel.findOne({
    menteeId,
    mentorId,
    status: { $in: ["PENDING_MENTOR_TIMES", "PENDING_MENTEE_SELECTION", "MATCHED"] },
  });

  if (existingMeeting) {
    throw Object.assign(new Error("An active meeting request already exists with this mentor"), {
      status: 400,
    });
  }

  const newMeeting = new MeetingModel({
    menteeId,
    mentorId,
    status: "PENDING_MENTOR_TIMES",
  });

  await newMeeting.save();
  return newMeeting;
}

// 2. mentor proposes times
export async function proposeTimes(meetingId, mentorId, proposedTimes) {
  const meeting = await MeetingModel.findById(meetingId);

  if (!meeting) {
    throw Object.assign(new Error("Meeting not found"), { status: 404 });
  }

  if (normalizeId(meeting.mentorId) !== normalizeId(mentorId)) {
    throw Object.assign(new Error("Only the assigned mentor can propose times"), { status: 403 });
  }

  // Mentor may propose (or re-propose) only while waiting to send times,
  // or while mentee is still selecting (mentor updating offers).
  if (!["PENDING_MENTOR_TIMES", "PENDING_MENTEE_SELECTION"].includes(meeting.status)) {
    throw Object.assign(new Error("Cannot propose times at this stage"), { status: 400 });
  }

  if (!Array.isArray(proposedTimes) || proposedTimes.length === 0) {
    throw Object.assign(new Error("Please provide at least one proposed time"), { status: 400 });
  }

  if (proposedTimes.length > 3) {
    throw Object.assign(new Error("You can propose up to 3 time options"), { status: 400 });
  }

  meeting.proposedTimes = proposedTimes;
  meeting.status = "PENDING_MENTEE_SELECTION";

  await meeting.save();
  return meeting;
}

// 3. mentee selects one of the proposed times
export async function selectTime(meetingId, menteeId, selectedTime) {
  const meeting = await MeetingModel.findById(meetingId);

  if (!meeting) {
    throw Object.assign(new Error("Meeting not found"), { status: 404 });
  }

  if (normalizeId(meeting.menteeId) !== normalizeId(menteeId)) {
    throw Object.assign(new Error("Only the assigned mentee can select the time"), { status: 403 });
  }

  if (meeting.status !== "PENDING_MENTEE_SELECTION") {
    throw Object.assign(new Error("Meeting is not awaiting time selection"), { status: 400 });
  }

  if (!selectedTime?.startTime || !selectedTime?.endTime) {
    throw Object.assign(new Error("Selected time is required"), { status: 400 });
  }

  const matchedProposal = (meeting.proposedTimes || []).find((pt) =>
    sameInstant(pt.startTime, selectedTime.startTime)
  );
  if (!matchedProposal) {
    throw Object.assign(new Error("Selected time must be one of the mentor's proposed options"), {
      status: 400,
    });
  }

  // Persist the mentor's exact proposed range (avoids client duration/timezone drift)
  meeting.scheduledTime = {
    startTime: new Date(matchedProposal.startTime),
    endTime: new Date(matchedProposal.endTime || selectedTime.endTime),
  };
  meeting.status = "MATCHED";
  meeting.meetLink = generateMeetLink(meeting._id);

  await meeting.save();
  return meeting;
}

// 4. reject the meeting (can be done by both sides)
export async function rejectMeeting(meetingId, userId) {
  const meeting = await MeetingModel.findById(meetingId);

  if (!meeting) {
    throw Object.assign(new Error("Meeting not found"), { status: 404 });
  }

  if (
    normalizeId(meeting.menteeId) !== normalizeId(userId) &&
    normalizeId(meeting.mentorId) !== normalizeId(userId)
  ) {
    throw Object.assign(new Error("Unauthorized to reject this meeting"), { status: 403 });
  }

  meeting.status = "CANCELLED";
  await meeting.save();
  return meeting;
}

// 5. get all the meetings of the user (as a mentor or a mentee)
export async function getUserMeetings(userId) {
  return await MeetingModel.find({
    $or: [{ menteeId: userId }, { mentorId: userId }],
  })
    .populate("menteeId", "firstName lastName email profilePicture")
    .populate("mentorId", "firstName lastName email profilePicture")
    .sort({ createdAt: -1 });
}

/** Mentee asks mentor to propose different slots (during selection only, once). */
export async function requestMoreSlots(meetingId, menteeId) {
  const meeting = await MeetingModel.findById(meetingId);

  if (!meeting) {
    throw Object.assign(new Error("Meeting not found"), { status: 404 });
  }

  if (normalizeId(meeting.menteeId) !== normalizeId(menteeId)) {
    throw Object.assign(new Error("Only the assigned mentee can request more slots"), {
      status: 403,
    });
  }

  if (meeting.status !== "PENDING_MENTEE_SELECTION") {
    throw Object.assign(new Error("Can only request more slots while choosing a time"), {
      status: 400,
    });
  }

  if ((meeting.moreSlotsCount || 0) >= 1) {
    throw Object.assign(
      new Error("You already requested more slots once. Cancel the meeting or pick a time."),
      { status: 400 }
    );
  }

  meeting.moreSlotsCount = (meeting.moreSlotsCount || 0) + 1;
  meeting.status = "PENDING_MENTOR_TIMES";
  meeting.proposedTimes = [];

  await meeting.save();
  return { meeting, cancelled: false };
}

/** After MATCHED: one reschedule, then cancel. */
export async function markUnavailable(meetingId, userId) {
  const meeting = await MeetingModel.findById(meetingId);

  if (!meeting) {
    throw Object.assign(new Error("Meeting not found"), { status: 404 });
  }

  if (
    normalizeId(meeting.mentorId) !== normalizeId(userId) &&
    normalizeId(meeting.menteeId) !== normalizeId(userId)
  ) {
    throw Object.assign(new Error("Unauthorized to modify this meeting"), { status: 403 });
  }

  if (meeting.status !== "MATCHED") {
    throw Object.assign(new Error("Only a scheduled meeting can be marked unavailable"), {
      status: 400,
    });
  }

  if ((meeting.rescheduleCount || 0) >= 1) {
    meeting.status = "CANCELLED";
    meeting.meetLink = null;
    await meeting.save();
    return { meeting, cancelled: true };
  }

  meeting.rescheduleCount = (meeting.rescheduleCount || 0) + 1;
  meeting.status = "PENDING_MENTOR_TIMES";
  meeting.proposedTimes = [];
  meeting.scheduledTime = null;
  meeting.meetLink = null;

  await meeting.save();
  return { meeting, cancelled: false };
}
