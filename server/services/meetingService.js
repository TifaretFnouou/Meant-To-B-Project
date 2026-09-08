import MeetingModel from "../models/meeting.js";
import {
  assertSlotIsBookable,
  consumeSlot,
  restoreSlot,
  normalizeId,
  sameInstant,
  rangesOverlap,
} from "./availabilityService.js";
import { createNotification } from "./notificationService.js";
import { sendMeetingCalendarInvite } from "./calendarInviteService.js";
import UserModel from "../models/user.js";

const ACTIVE_MEETING_STATUSES = [
  "PENDING_MENTOR_TIMES",
  "PENDING_MENTEE_SELECTION",
  "PENDING_MENTOR_APPROVAL",
  "MATCHED",
];

/** Statuses where the mentee already holds a concrete clock time. */
const SCHEDULED_TIME_STATUSES = [
  "PENDING_MENTOR_APPROVAL",
  "MATCHED",
  "ATTENDANCE_CONFIRMED",
];

/**
 * Shared video room for mentor + mentee.
 * Uses Jitsi (works without Google OAuth); both parties get the same URL.
 */
export function generateMeetLink(meetingId) {
  const safeId = String(meetingId).replace(/[^a-zA-Z0-9]/g, "").slice(-16) || "room";
  return `https://meet.jit.si/QueenB-${safeId}`;
}

function formatMeetingDate(date) {
  return new Date(date).toLocaleString("he-IL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function getUserDisplayName(userId) {
  const user = await UserModel.findById(userId).select("firstName lastName");
  if (!user) return "";
  return `${user.firstName || ""} ${user.lastName || ""}`.trim();
}

async function notifyUser(userId, messageKey, messageParams, meetingId) {
  if (!userId) return;
  await createNotification({
    userId,
    messageKey,
    messageParams: messageParams || {},
    meetingId: meetingId || null,
  });
}

async function assertNoActiveMeeting(menteeId, mentorId) {
  if (normalizeId(menteeId) === normalizeId(mentorId)) {
    throw Object.assign(new Error("You cannot book a meeting with yourself"), { status: 400 });
  }

  // Allow multiple concurrent meetings with different mentors; block only a duplicate
  // active request with the same mentor.
  const existingMeeting = await MeetingModel.findOne({
    menteeId,
    mentorId,
    status: { $in: ACTIVE_MEETING_STATUSES },
  });

  if (existingMeeting) {
    throw Object.assign(new Error("An active meeting request already exists with this mentor"), {
      status: 400,
    });
  }
}

/**
 * Prevent a mentee from holding two overlapping clock times across mentors.
 * Pending requests without a scheduledTime are allowed in parallel.
 */
async function assertMenteeTimeAvailable(menteeId, startTime, endTime, excludeMeetingId = null) {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    throw Object.assign(new Error("Invalid meeting time range"), { status: 400 });
  }

  const query = {
    menteeId,
    status: { $in: SCHEDULED_TIME_STATUSES },
    "scheduledTime.startTime": { $exists: true },
  };
  if (excludeMeetingId) {
    query._id = { $ne: excludeMeetingId };
  }

  const meetings = await MeetingModel.find(query).select("scheduledTime");
  const overlaps = meetings.some((meeting) => {
    if (!meeting.scheduledTime?.startTime) return false;
    const busyStart = new Date(meeting.scheduledTime.startTime).getTime();
    const busyEnd = new Date(
      meeting.scheduledTime.endTime || busyStart + 60 * 60000
    ).getTime();
    return rangesOverlap(start, end, busyStart, busyEnd);
  });

  if (overlaps) {
    throw Object.assign(
      new Error("You already have another meeting scheduled at this time"),
      { status: 400 }
    );
  }
}

// 1. create a new meeting (legacy: mentee requests without a slot)
export async function createMeeting(menteeId, mentorId) {
  await assertNoActiveMeeting(menteeId, mentorId);

  const newMeeting = new MeetingModel({
    menteeId,
    mentorId,
    status: "PENDING_MENTOR_TIMES",
  });

  await newMeeting.save();

  const menteeName = (await getUserDisplayName(menteeId)) || "Mentee";
  await notifyUser(
    mentorId,
    "notif.mentorshipRequest",
    { name: menteeName },
    newMeeting._id
  );

  return newMeeting;
}

/**
 * Mentee books a free mentor slot → awaiting mentor approval.
 * Mentor must confirm before the meeting becomes MATCHED.
 */
export async function bookFromAvailability(menteeId, mentorId, selectedTime) {
  await assertNoActiveMeeting(menteeId, mentorId);

  if (!selectedTime?.startTime || !selectedTime?.endTime) {
    throw Object.assign(new Error("Selected time is required"), { status: 400 });
  }

  const booked = await assertSlotIsBookable(
    mentorId,
    selectedTime.startTime,
    selectedTime.endTime
  );

  await assertMenteeTimeAvailable(menteeId, booked.startTime, booked.endTime);

  const newMeeting = new MeetingModel({
    menteeId,
    mentorId,
    proposedTimes: [{ startTime: booked.startTime, endTime: booked.endTime }],
    scheduledTime: {
      startTime: booked.startTime,
      endTime: booked.endTime,
    },
    status: "PENDING_MENTOR_APPROVAL",
  });

  await newMeeting.save();
  await consumeSlot(mentorId, booked.startTime);

  const menteeName = (await getUserDisplayName(menteeId)) || "Mentee";
  const mentorName = (await getUserDisplayName(mentorId)) || "Mentor";
  const date = formatMeetingDate(booked.startTime);

  await notifyUser(
    mentorId,
    "notif.bookingAwaitingApproval",
    { name: menteeName, date },
    newMeeting._id
  );
  await notifyUser(
    menteeId,
    "notif.bookingPendingApproval",
    { name: mentorName, date },
    newMeeting._id
  );

  return newMeeting;
}

/** Mentor confirms a mentee booking → MATCHED + meet link. */
export async function approveMeeting(meetingId, mentorId) {
  const meeting = await MeetingModel.findById(meetingId);

  if (!meeting) {
    throw Object.assign(new Error("Meeting not found"), { status: 404 });
  }

  if (normalizeId(meeting.mentorId) !== normalizeId(mentorId)) {
    throw Object.assign(new Error("Only the assigned mentor can approve this meeting"), {
      status: 403,
    });
  }

  if (meeting.status !== "PENDING_MENTOR_APPROVAL") {
    throw Object.assign(new Error("Meeting is not awaiting mentor approval"), { status: 400 });
  }

  if (!meeting.scheduledTime?.startTime) {
    throw Object.assign(new Error("Meeting has no scheduled time"), { status: 400 });
  }

  await assertMenteeTimeAvailable(
    meeting.menteeId,
    meeting.scheduledTime.startTime,
    meeting.scheduledTime.endTime ||
      new Date(new Date(meeting.scheduledTime.startTime).getTime() + 60 * 60000),
    meeting._id
  );

  meeting.status = "MATCHED";
  meeting.meetLink = generateMeetLink(meeting._id);
  await meeting.save();

  // ICS invite to each participant's login email (Add to Calendar)
  void sendMeetingCalendarInvite(meeting);

  const mentorName = (await getUserDisplayName(mentorId)) || "Mentor";
  const date = formatMeetingDate(meeting.scheduledTime.startTime);

  await notifyUser(
    meeting.menteeId,
    "notif.meetingApproved",
    { name: mentorName, date },
    meeting._id
  );

  return meeting;
}

/** After reschedule: mentee picks a new open slot → awaiting mentor approval again. */
export async function rebookFromAvailability(meetingId, menteeId, selectedTime) {
  const meeting = await MeetingModel.findById(meetingId);

  if (!meeting) {
    throw Object.assign(new Error("Meeting not found"), { status: 404 });
  }

  if (normalizeId(meeting.menteeId) !== normalizeId(menteeId)) {
    throw Object.assign(new Error("Only the assigned mentee can rebook the time"), {
      status: 403,
    });
  }

  if (!["PENDING_MENTOR_TIMES", "PENDING_MENTEE_SELECTION"].includes(meeting.status)) {
    throw Object.assign(new Error("Meeting is not awaiting a new time"), { status: 400 });
  }

  if (!selectedTime?.startTime || !selectedTime?.endTime) {
    throw Object.assign(new Error("Selected time is required"), { status: 400 });
  }

  const booked = await assertSlotIsBookable(
    meeting.mentorId,
    selectedTime.startTime,
    selectedTime.endTime
  );

  await assertMenteeTimeAvailable(menteeId, booked.startTime, booked.endTime, meeting._id);

  meeting.proposedTimes = [{ startTime: booked.startTime, endTime: booked.endTime }];
  meeting.scheduledTime = {
    startTime: booked.startTime,
    endTime: booked.endTime,
  };
  meeting.status = "PENDING_MENTOR_APPROVAL";
  meeting.meetLink = null;

  await meeting.save();
  await consumeSlot(meeting.mentorId, booked.startTime);

  const menteeName = (await getUserDisplayName(menteeId)) || "Mentee";
  const mentorName = (await getUserDisplayName(meeting.mentorId)) || "Mentor";
  const date = formatMeetingDate(booked.startTime);

  await notifyUser(
    meeting.mentorId,
    "notif.bookingAwaitingApproval",
    { name: menteeName, date },
    meeting._id
  );
  await notifyUser(
    menteeId,
    "notif.bookingPendingApproval",
    { name: mentorName, date },
    meeting._id
  );

  return meeting;
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

  const mentorName = (await getUserDisplayName(mentorId)) || "Mentor";
  await notifyUser(
    meeting.menteeId,
    "notif.slotsProposed",
    { name: mentorName },
    meeting._id
  );

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

  const startTime = new Date(matchedProposal.startTime);
  const endTime = new Date(matchedProposal.endTime || selectedTime.endTime);

  await assertMenteeTimeAvailable(menteeId, startTime, endTime, meeting._id);

  meeting.scheduledTime = {
    startTime,
    endTime,
  };
  meeting.status = "MATCHED";
  meeting.meetLink = generateMeetLink(meeting._id);

  await meeting.save();

  void sendMeetingCalendarInvite(meeting);

  const menteeName = (await getUserDisplayName(menteeId)) || "Mentee";
  const mentorName = (await getUserDisplayName(meeting.mentorId)) || "Mentor";
  const date = formatMeetingDate(meeting.scheduledTime.startTime);

  await notifyUser(
    meeting.mentorId,
    "notif.meetingScheduledAt",
    { name: menteeName, date },
    meeting._id
  );
  await notifyUser(
    menteeId,
    "notif.meetingScheduledAt",
    { name: mentorName, date },
    meeting._id
  );

  return meeting;
}

// 4. reject / cancel the meeting (can be done by both sides)
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

  const previousStatus = meeting.status;
  const scheduledStart = meeting.scheduledTime?.startTime;
  const scheduledEnd = meeting.scheduledTime?.endTime;

  meeting.status = "CANCELLED";
  await meeting.save();

  void sendMeetingCalendarInvite(meeting, { cancel: true });

  if (previousStatus === "PENDING_MENTOR_APPROVAL" && scheduledStart) {
    await restoreSlot(meeting.mentorId, scheduledStart, scheduledEnd);
  }

  const actorName = (await getUserDisplayName(userId)) || "";
  const otherId =
    normalizeId(meeting.menteeId) === normalizeId(userId)
      ? meeting.mentorId
      : meeting.menteeId;

  await notifyUser(
    otherId,
    "notif.meetingCancelled",
    { name: actorName },
    meeting._id
  );

  return meeting;
}

// 5. get all the meetings of the user (as a mentor or a mentee)
export async function getUserMeetings(userId, { isAdmin = false } = {}) {
  const query = isAdmin
    ? {}
    : { $or: [{ menteeId: userId }, { mentorId: userId }] };

  return await MeetingModel.find(query)
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

  const menteeName = (await getUserDisplayName(menteeId)) || "Mentee";
  await notifyUser(
    meeting.mentorId,
    "notif.moreSlotsRequested",
    { name: menteeName },
    meeting._id
  );

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

  const actorName = (await getUserDisplayName(userId)) || "";
  const otherId =
    normalizeId(meeting.menteeId) === normalizeId(userId)
      ? meeting.mentorId
      : meeting.menteeId;

  if ((meeting.rescheduleCount || 0) >= 1) {
    meeting.status = "CANCELLED";
    meeting.meetLink = null;
    await meeting.save();

    void sendMeetingCalendarInvite(meeting, { cancel: true });

    await notifyUser(
      otherId,
      "notif.meetingCancelled",
      { name: actorName },
      meeting._id
    );

    return { meeting, cancelled: true };
  }

  meeting.rescheduleCount = (meeting.rescheduleCount || 0) + 1;
  // Send cancel ICS while scheduledTime is still on the document
  void sendMeetingCalendarInvite(meeting, { cancel: true });
  meeting.status = "PENDING_MENTOR_TIMES";
  meeting.proposedTimes = [];
  meeting.scheduledTime = null;
  meeting.meetLink = null;

  await meeting.save();

  await notifyUser(
    otherId,
    "notif.rescheduleNeeded",
    { name: actorName },
    meeting._id
  );

  return { meeting, cancelled: false };
}

/** Submit post-meeting feedback. Mentee → mentor; Mentor → admins. */
export async function submitFeedback(meetingId, userId, { rating, comments }) {
  const meeting = await MeetingModel.findById(meetingId);

  if (!meeting) {
    throw Object.assign(new Error("Meeting not found"), { status: 404 });
  }

  const isMentor = normalizeId(meeting.mentorId) === normalizeId(userId);
  const isMentee = normalizeId(meeting.menteeId) === normalizeId(userId);

  if (!isMentor && !isMentee) {
    throw Object.assign(new Error("Unauthorized to feedback this meeting"), { status: 403 });
  }

  if (!["MATCHED", "ATTENDANCE_CONFIRMED", "COMPLETED", "FEEDBACK_FILLED"].includes(meeting.status)) {
    throw Object.assign(new Error("Feedback is only available after a scheduled meeting"), {
      status: 400,
    });
  }

  const endTime = meeting.scheduledTime?.endTime
    ? new Date(meeting.scheduledTime.endTime).getTime()
    : meeting.scheduledTime?.startTime
      ? new Date(meeting.scheduledTime.startTime).getTime() + 60 * 60000
      : null;

  if (endTime && Date.now() < endTime) {
    throw Object.assign(new Error("Feedback opens after the meeting ends"), { status: 400 });
  }

  const numericRating = Number(rating);
  if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
    throw Object.assign(new Error("Rating must be between 1 and 5"), { status: 400 });
  }

  const commentText = String(comments || "").trim();
  const actorName = (await getUserDisplayName(userId)) || "";
  const date = meeting.scheduledTime?.startTime
    ? formatMeetingDate(meeting.scheduledTime.startTime)
    : "";

  if (isMentee) {
    if (meeting.menteeFeedback?.isFilled) {
      throw Object.assign(new Error("You already submitted feedback for this meeting"), {
        status: 400,
      });
    }
    meeting.menteeFeedback = {
      isFilled: true,
      rating: numericRating,
      comments: commentText,
    };

    await notifyUser(
      meeting.mentorId,
      "notif.menteeFeedbackReceived",
      {
        name: actorName,
        rating: String(numericRating),
        comments: commentText || "—",
        date,
      },
      meeting._id
    );
  } else {
    if (meeting.mentorFeedback?.isFilled) {
      throw Object.assign(new Error("You already submitted feedback for this meeting"), {
        status: 400,
      });
    }
    meeting.mentorFeedback = {
      isFilled: true,
      rating: numericRating,
      comments: commentText,
    };

    const menteeName = (await getUserDisplayName(meeting.menteeId)) || "Mentee";
    const admins = await UserModel.find({ roles: "admin" }).select("_id");
    await Promise.all(
      admins.map((admin) =>
        notifyUser(
          admin._id,
          "notif.mentorFeedbackReceived",
          {
            name: actorName,
            menteeName,
            rating: String(numericRating),
            comments: commentText || "—",
            date,
          },
          meeting._id
        )
      )
    );
  }

  const menteeDone = Boolean(meeting.menteeFeedback?.isFilled);
  const mentorDone = Boolean(meeting.mentorFeedback?.isFilled);
  if (menteeDone && mentorDone) {
    meeting.status = "FEEDBACK_FILLED";
  } else {
    meeting.status = "COMPLETED";
  }

  await meeting.save();
  return meeting;
}

export async function getMessages(meetingId) {
  const meeting = await MeetingModel.findById(meetingId);
  if (!meeting) {
    const error = new Error("Meeting not found");
    error.status = 404;
    throw error;
  }
  return meeting.messages || [];
}

export async function addMessage(meetingId, userId, text) {
  if (!text || !text.trim()) {
    const error = new Error("Message text is required");
    error.status = 400;
    throw error;
  }

  const meeting = await MeetingModel.findById(meetingId);
  if (!meeting) {
    const error = new Error("Meeting not found");
    error.status = 404;
    throw error;
  }

  const newMessage = {
    sender: userId,
    text: text.trim(),
    createdAt: new Date(),
  };

  meeting.messages.push(newMessage);
  await meeting.save();

  // זיהוי מי הצד השני שצריך לקבל את ההתראה
  const isSenderMentor = String(meeting.mentorId) === String(userId);
  const recipientId = isSenderMentor ? meeting.menteeId : meeting.mentorId;
  const senderUser = await UserModel.findById(userId).select("firstName lastName");
  const senderName = senderUser ? `${senderUser.firstName || ""} ${senderUser.lastName || ""}`.trim() : "User";

  // התראה + מייל לצד השני על הודעה חדשה בצ'אט
  if (recipientId) {
    const preview = text.trim().slice(0, 160);
    await createNotification({
      userId: recipientId,
      messageKey: "notif.chatMessage",
      messageParams: { name: senderName, preview },
      meetingId: meeting._id,
    }).catch((err) => console.error("Failed to send message notification", err));
  }

  return meeting.messages[meeting.messages.length - 1];
}