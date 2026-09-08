import mongoose from "mongoose";
import MeetingModel from "../models/meeting.js";
import UserModel from "../models/user.js";
import { createNotification } from "./notificationService.js";

const REMINDER_LEAD_MS = 30 * 60 * 1000;
const REMINDER_POLL_MS = 60 * 1000;

function formatMeetingDate(date) {
  return new Date(date).toLocaleString("he-IL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function getDisplayName(userId) {
  const user = await UserModel.findById(userId).select("firstName lastName");
  if (!user) return "";
  return `${user.firstName || ""} ${user.lastName || ""}`.trim();
}

/**
 * Send email + in-app reminders ~30 minutes before MATCHED meetings.
 * Idempotent via reminder30mSentAt on the meeting document.
 */
export async function processUpcomingMeetingReminders() {
  if (mongoose.connection.readyState !== 1) return { checked: 0, sent: 0 };

  const now = Date.now();
  const windowEnd = new Date(now + REMINDER_LEAD_MS);

  const due = await MeetingModel.find({
    status: { $in: ["MATCHED", "ATTENDANCE_CONFIRMED"] },
    "scheduledTime.startTime": {
      $gt: new Date(now),
      $lte: windowEnd,
    },
    $or: [{ reminder30mSentAt: null }, { reminder30mSentAt: { $exists: false } }],
  }).select("_id menteeId mentorId scheduledTime meetLink");

  let sent = 0;

  for (const meeting of due) {
    // Claim the reminder first so concurrent polls don't double-email
    const claimed = await MeetingModel.findOneAndUpdate(
      {
        _id: meeting._id,
        $or: [{ reminder30mSentAt: null }, { reminder30mSentAt: { $exists: false } }],
      },
      { $set: { reminder30mSentAt: new Date() } },
      { new: true }
    );
    if (!claimed) continue;

    const start = meeting.scheduledTime?.startTime;
    const date = start ? formatMeetingDate(start) : "";
    const meetLink = meeting.meetLink || "";
    const mentorName = (await getDisplayName(meeting.mentorId)) || "המנטורית";
    const menteeName = (await getDisplayName(meeting.menteeId)) || "המנטורית";

    const baseParams = { date, meetLink };

    await Promise.all([
      createNotification({
        userId: meeting.menteeId,
        messageKey: "notif.meetingReminder30m",
        messageParams: { ...baseParams, name: mentorName },
        meetingId: meeting._id,
      }),
      createNotification({
        userId: meeting.mentorId,
        messageKey: "notif.meetingReminder30m",
        messageParams: { ...baseParams, name: menteeName },
        meetingId: meeting._id,
      }),
    ]);

    sent += 1;
    console.log(`[reminder] 30m email queued for meeting ${meeting._id}`);
  }

  return { checked: due.length, sent };
}

let reminderTimer = null;

/** Start polling once per process (safe to call after Mongo connects). */
export function startMeetingReminderJob() {
  if (reminderTimer) return;

  const tick = () => {
    processUpcomingMeetingReminders().catch((err) => {
      console.error("[reminder] Failed to process meeting reminders:", err.message);
    });
  };

  tick();
  reminderTimer = setInterval(tick, REMINDER_POLL_MS);
  if (typeof reminderTimer.unref === "function") reminderTimer.unref();
  console.log("[reminder] Meeting 30-minute email reminders enabled");
}

export function stopMeetingReminderJob() {
  if (!reminderTimer) return;
  clearInterval(reminderTimer);
  reminderTimer = null;
}
