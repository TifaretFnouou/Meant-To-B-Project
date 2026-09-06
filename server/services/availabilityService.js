import AvailabilityModel from "../models/availability.js";
import MeetingModel from "../models/meeting.js";
import UserModel from "../models/user.js";
import NotificationModel from "../models/notification.js";
import { createNotification } from "./notificationService.js";

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
  return Math.abs(ta - tb) < 1000;
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

async function getBusyRanges(mentorId) {
  const meetings = await MeetingModel.find({
    mentorId,
    status: { $in: ["MATCHED", "ATTENDANCE_CONFIRMED"] },
    "scheduledTime.startTime": { $exists: true },
  }).select("scheduledTime");

  return meetings
    .filter((m) => m.scheduledTime?.startTime)
    .map((m) => ({
      start: new Date(m.scheduledTime.startTime).getTime(),
      end: new Date(
        m.scheduledTime.endTime ||
          new Date(m.scheduledTime.startTime).getTime() + 60 * 60000
      ).getTime(),
    }));
}

function isSlotFree(slot, busyRanges) {
  const start = new Date(slot.startTime).getTime();
  const end = new Date(slot.endTime).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return false;
  return !busyRanges.some((b) => rangesOverlap(start, end, b.start, b.end));
}

/** Mentor reads own availability (all future + past for editing). */
export async function getMyAvailability(mentorId) {
  const doc = await AvailabilityModel.findOne({ mentorId });
  return {
    mentorId: String(mentorId),
    slots: (doc?.slots || []).map((s) => ({
      startTime: new Date(s.startTime).toISOString(),
      endTime: new Date(s.endTime).toISOString(),
    })),
  };
}

/**
 * Replace slots that fall inside [weekStart, weekEnd) with the provided list.
 * Keeps slots outside that window so other weeks stay intact.
 */
export async function setWeekAvailability(mentorId, weekStartIso, weekEndIso, slots) {
  if (!weekStartIso || !weekEndIso) {
    throw Object.assign(new Error("weekStart and weekEnd are required"), { status: 400 });
  }

  const weekStart = new Date(weekStartIso).getTime();
  const weekEnd = new Date(weekEndIso).getTime();
  if (Number.isNaN(weekStart) || Number.isNaN(weekEnd) || weekEnd <= weekStart) {
    throw Object.assign(new Error("Invalid week range"), { status: 400 });
  }

  if (!Array.isArray(slots)) {
    throw Object.assign(new Error("slots must be an array"), { status: 400 });
  }

  const normalizedIncoming = slots.map((s) => {
    const startTime = new Date(s.startTime);
    const endTime = new Date(s.endTime);
    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      throw Object.assign(new Error("Invalid slot times"), { status: 400 });
    }
    if (endTime <= startTime) {
      throw Object.assign(new Error("Slot endTime must be after startTime"), { status: 400 });
    }
    const t = startTime.getTime();
    if (t < weekStart || t >= weekEnd) {
      throw Object.assign(new Error("All slots must fall within the selected week"), {
        status: 400,
      });
    }
    return { startTime, endTime };
  });

  let doc = await AvailabilityModel.findOne({ mentorId });
  if (!doc) {
    doc = new AvailabilityModel({ mentorId, slots: [] });
  }

  const kept = (doc.slots || []).filter((s) => {
    const t = new Date(s.startTime).getTime();
    return t < weekStart || t >= weekEnd;
  });

  doc.slots = [...kept, ...normalizedIncoming].sort(
    (a, b) => new Date(a.startTime) - new Date(b.startTime)
  );

  await doc.save();
  return getMyAvailability(mentorId);
}

/** Public free slots for a mentor (future only, minus booked meetings). */
export async function getMentorOpenSlots(mentorId) {
  const mentor = await UserModel.findById(mentorId).select(
    "firstName lastName mentorProfile roles"
  );
  if (!mentor) {
    throw Object.assign(new Error("Mentor not found"), { status: 404 });
  }
  if (!mentor.roles?.includes("mentor") || mentor.mentorProfile?.isActive === false) {
    throw Object.assign(new Error("User is not an active mentor"), { status: 400 });
  }

  const doc = await AvailabilityModel.findOne({ mentorId });
  const busy = await getBusyRanges(mentorId);
  const now = Date.now();

  const openSlots = (doc?.slots || [])
    .filter((s) => new Date(s.startTime).getTime() > now)
    .filter((s) => isSlotFree(s, busy))
    .map((s) => ({
      startTime: new Date(s.startTime).toISOString(),
      endTime: new Date(s.endTime).toISOString(),
    }));

  return {
    mentorId: String(mentorId),
    meetingLengthMinutes: mentor.mentorProfile?.meetingLengthMinutes || 60,
    slots: openSlots,
  };
}

/** Consume a booked slot from the mentor's availability (best-effort). */
export async function consumeSlot(mentorId, startTime) {
  const doc = await AvailabilityModel.findOne({ mentorId });
  if (!doc) return;

  doc.slots = (doc.slots || []).filter((s) => !sameInstant(s.startTime, startTime));
  await doc.save();
}

export async function assertSlotIsBookable(mentorId, startTime, endTime) {
  const open = await getMentorOpenSlots(mentorId);
  const match = open.slots.find((s) => sameInstant(s.startTime, startTime));
  if (!match) {
    throw Object.assign(new Error("Selected time is not available"), { status: 400 });
  }

  // Prefer mentor's stored endTime when present
  return {
    startTime: new Date(match.startTime),
    endTime: new Date(match.endTime || endTime),
    meetingLengthMinutes: open.meetingLengthMinutes,
  };
}

/**
 * Mentee asks mentor to publish more open calendar slots.
 * Rate-limited: one request per mentee→mentor pair every 24 hours.
 */
export async function requestMoreAvailability(menteeId, mentorId, message = "") {
  if (normalizeId(menteeId) === normalizeId(mentorId)) {
    throw Object.assign(new Error("You cannot request availability from yourself"), {
      status: 400,
    });
  }

  const mentor = await UserModel.findById(mentorId).select("roles mentorProfile firstName lastName");
  if (!mentor) {
    throw Object.assign(new Error("Mentor not found"), { status: 404 });
  }
  if (!mentor.roles?.includes("mentor") || mentor.mentorProfile?.isActive === false) {
    throw Object.assign(new Error("User is not an active mentor"), { status: 400 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = await NotificationModel.findOne({
    userId: mentorId,
    messageKey: "notif.availabilityRequested",
    createdAt: { $gte: since },
    "messageParams.menteeId": String(menteeId),
  });

  if (recent) {
    throw Object.assign(
      new Error("You already requested more availability from this mentor today"),
      { status: 400 }
    );
  }

  const mentee = await UserModel.findById(menteeId).select("firstName lastName");
  const menteeName = mentee
    ? `${mentee.firstName || ""} ${mentee.lastName || ""}`.trim()
    : "Mentee";

  const open = await getMentorOpenSlots(mentorId);
  const note = String(message || "").trim().slice(0, 300);

  await createNotification({
    userId: mentorId,
    messageKey: "notif.availabilityRequested",
    messageParams: {
      name: menteeName,
      menteeId: String(menteeId),
      openSlots: String(open.slots.length),
      note: note ? ` — "${note}"` : "",
    },
  });

  return {
    ok: true,
    openSlots: open.slots.length,
  };
}

export { normalizeId, sameInstant };
