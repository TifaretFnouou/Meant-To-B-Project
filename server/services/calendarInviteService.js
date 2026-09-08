import { sendMail, getEmailFromAddress } from "./emailService.js";
import UserModel from "../models/user.js";

function pad(n) {
  return String(n).padStart(2, "0");
}

/** Format Date as UTC iCal stamp: 20260908T130000Z */
function toIcalUtc(date) {
  const d = new Date(date);
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function icalEscape(text) {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function displayName(user) {
  return `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.email || "User";
}

function meetingUid(meetingId) {
  return `meanttob-meeting-${meetingId}@queenb`;
}

/**
 * Build a METHOD:REQUEST / CANCEL iCalendar payload.
 * Gmail and most clients offer "Add to Calendar" / auto-import.
 */
export function buildMeetingIcs({
  meeting,
  mentee,
  mentor,
  method = "REQUEST",
  sequence = 0,
}) {
  const start = new Date(meeting.scheduledTime.startTime);
  const end = new Date(
    meeting.scheduledTime.endTime || new Date(start.getTime() + 60 * 60000)
  );
  const organizerEmail = getEmailFromAddress();
  const title = `QueenB mentoring: ${displayName(mentee)} ↔ ${displayName(mentor)}`;
  const description = [
    "Mentoring session via Meant To B / QueenB.",
    meeting.meetLink ? `Video link: ${meeting.meetLink}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const attendees = [mentee, mentor]
    .filter((u) => u?.email)
    .map(
      (u) =>
        `ATTENDEE;CN=${icalEscape(displayName(u))};RSVP=TRUE;PARTSTAT=NEEDS-ACTION:mailto:${u.email}`
    )
    .join("\r\n");

  const status = method === "CANCEL" ? "CANCELLED" : "CONFIRMED";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Meant To B//Mentoring//EN",
    "CALSCALE:GREGORIAN",
    `METHOD:${method}`,
    "BEGIN:VEVENT",
    `UID:${meetingUid(meeting._id)}`,
    `DTSTAMP:${toIcalUtc(new Date())}`,
    `DTSTART:${toIcalUtc(start)}`,
    `DTEND:${toIcalUtc(end)}`,
    `SUMMARY:${icalEscape(title)}`,
    `DESCRIPTION:${icalEscape(description)}`,
    meeting.meetLink ? `LOCATION:${icalEscape(meeting.meetLink)}` : null,
    `ORGANIZER;CN=Meant To B:mailto:${organizerEmail}`,
    attendees,
    `STATUS:${status}`,
    `SEQUENCE:${sequence}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

/**
 * Email both participants a calendar invite (works without Google OAuth login).
 * Never throws — must not break meeting booking.
 */
export async function sendMeetingCalendarInvite(meeting, { cancel = false } = {}) {
  try {
    if (!meeting?.scheduledTime?.startTime || !meeting?._id) return;

    const participants = await UserModel.find({
      _id: { $in: [meeting.menteeId, meeting.mentorId] },
    }).select("firstName lastName email");

    const byId = new Map(participants.map((u) => [String(u._id), u]));
    const mentee = byId.get(String(meeting.menteeId));
    const mentor = byId.get(String(meeting.mentorId));
    if (!mentee?.email && !mentor?.email) return;

    const recipients = [mentee, mentor].filter((u) => u?.email);
    const method = cancel ? "CANCEL" : "REQUEST";
    const sequence = cancel ? 1 : 0;
    const ics = buildMeetingIcs({ meeting, mentee, mentor, method, sequence });
    const title = cancel
      ? "בוטלה פגישת מנטורינג — Meant To B"
      : "הזמנה ליומן: פגישת מנטורינג — Meant To B";
    const body = cancel
      ? "הפגישה בוטלה. אם היא כבר ביומן שלך — אפשר להסיר אותה."
      : [
          "נקבעה לך פגישת מנטורינג.",
          meeting.meetLink ? `קישור לשיחה: ${meeting.meetLink}` : "",
          "",
          "מצורפת הזמנה ליומן — ב-Gmail לחצי Add to Calendar / הוספה ליומן.",
        ]
          .filter(Boolean)
          .join("\n");

    const html = `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.5"><p>${body
      .split("\n")
      .map((line) => (line ? escapeHtml(line) : "<br/>"))
      .join("<br/>")}</p></div>`;

    // One email per participant — calendar clients match ATTENDEE to the recipient
    await Promise.all(
      recipients.map((user) =>
        sendMail({
          to: user.email,
          subject: title,
          text: body,
          html,
          icalEvent: {
            filename: cancel ? "cancel.ics" : "invite.ics",
            method,
            content: ics,
          },
        })
      )
    );
  } catch (err) {
    console.error("[calendar-invite] failed:", err?.message || err);
  }
}
