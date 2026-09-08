/**
 * Hebrew templates matching client i18n keys (notif.*).
 * Used for email bodies when in-app notifications are created.
 */
const TEMPLATES = {
  "notif.mentorshipRequest": "{{name}} שלחה בקשה לפגישת מנטורינג",
  "notif.slotsProposed": "{{name}} הציעה זמנים לפגישה",
  "notif.requestRejected": "{{name}} דחתה את הבקשה",
  "notif.requestApproved": "{{name}} אישרה את הבקשה - ממתינים לקביעת זמנים",
  "notif.slotSelected": "{{name}} בחרה מועד לפגישה",
  "notif.meetingScheduled": "נקבעה פגישה חדשה עם {{name}}",
  "notif.meetingScheduledAt": "נקבעה פגישה חדשה עם {{name}} ל-{{date}}",
  "notif.meetingRescheduledAt": "הפגישה עם {{name}} תואמה מחדש ל-{{date}}",
  "notif.moreSlotsRequested": "{{name}} מבקשת זמנים נוספים",
  "notif.requestCancelled": "{{name}} ביטלה את הבקשה",
  "notif.meetingCancelled": "{{name}} ביטלה את תיאום הפגישה",
  "notif.rescheduleNeeded": "{{name}} סימנה שאינה יכולה להגיע — נדרש תיאום מחדש",
  "notif.feedbackReminder": "הפגישה הסתיימה — מלאי משוב קצר על החוויה",
  "notif.menteeFeedbackReceived":
    "קיבלת משוב מ{{name}} (דירוג {{rating}}/5): {{comments}}",
  "notif.mentorFeedbackReceived":
    "משוב מנטורית מ{{name}} על פגישה עם {{menteeName}} (דירוג {{rating}}/5): {{comments}}",
  "notif.availabilityRequested":
    "{{name}} מבקשת שתוסיפי שעות פנויות ביומן (כרגע {{openSlots}} פנויות){{note}}",
  "notif.bookingAwaitingApproval":
    "{{name}} קבעה פגישה ל-{{date}} — ממתינה לאישור שלך",
  "notif.bookingPendingApproval":
    "הבקשה לפגישה עם {{name}} ב-{{date}} נשלחה וממתינה לאישור",
  "notif.meetingApproved": "{{name}} אישרה את הפגישה ל-{{date}}",
  "notif.newRequest": "{{name}} שלחה בקשת פגישה חדשה",
  "notif.setWeeklyAvailability":
    "היי מנטורית, תזכורת שבועית: עדכני ביומן את הימים והשעות הפנויות שלך לפגישות מנטורינג",
  "notif.chatMessage": "הודעה חדשה מ{{name}}: {{preview}}",
  "notif.meetingReminder30m":
    "תזכורת: הפגישה עם {{name}} מתחילה בעוד כ־30 דקות ({{date}}). קישור לפגישה: {{meetLink}}",
  "notif.meetingThankYouMentor":
    "תודה רבה שהעברת פגישת מנטורינג עם {{name}} ב־{{date}}! ההשפעה שלך משמעותית לקהילה של Meant To B ❤️",
  "notif.meetingDidNotHappen":
    "עדכון: הפגישה עם {{name}} שתוכננה ל־{{date}} לא התקיימה.",
};

function interpolate(template, params = {}) {
  return String(template).replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = params[key];
    return value == null ? "" : String(value);
  });
}

/**
 * Resolve a human-readable notification body.
 * Raw messageKey strings (e.g. chat) are returned as-is.
 */
export function formatNotificationMessage(messageKey, messageParams = {}) {
  if (!messageKey) return "יש לך התראה חדשה ב-Meant To B";
  const template = TEMPLATES[messageKey];
  if (!template) return messageKey;
  return interpolate(template, messageParams);
}

export function notificationEmailSubject(messageKey) {
  if (messageKey === "notif.meetingReminder30m") {
    return "Meant To B — תזכורת לפגישה בעוד 30 דקות";
  }
  if (messageKey === "notif.meetingThankYouMentor") {
    return "Meant To B — תודה על הפגישה!";
  }
  if (messageKey === "notif.meetingDidNotHappen") {
    return "Meant To B — הפגישה לא התקיימה";
  }
  if (
    messageKey?.startsWith("notif.meeting") ||
    messageKey === "notif.mentorshipRequest" ||
    messageKey === "notif.bookingAwaitingApproval" ||
    messageKey === "notif.bookingPendingApproval" ||
    messageKey === "notif.slotsProposed" ||
    messageKey === "notif.moreSlotsRequested" ||
    messageKey === "notif.rescheduleNeeded"
  ) {
    return "Meant To B — עדכון פגישה";
  }
  if (messageKey?.toLowerCase().includes("feedback")) {
    return "Meant To B — משוב";
  }
  if (messageKey === "notif.chatMessage" || messageKey?.includes("message")) {
    return "Meant To B — הודעה בצ'אט";
  }
  return "Meant To B — התראה חדשה";
}
