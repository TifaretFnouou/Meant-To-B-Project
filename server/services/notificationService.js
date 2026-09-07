import NotificationModel from "../models/notification.js";
import UserModel from "../models/user.js";
import { sendMail, getAdminEmail } from "./emailService.js";
import {
  formatNotificationMessage,
  notificationEmailSubject,
} from "./notificationTemplates.js";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function emailNotification(doc) {
  const user = await UserModel.findById(doc.userId).select(
    "email firstName lastName"
  );
  if (!user?.email) return;

  const body = formatNotificationMessage(doc.messageKey, doc.messageParams || {});
  const subject = notificationEmailSubject(doc.messageKey);
  const adminEmail = getAdminEmail();

  const recipients = new Set(
    [user.email, adminEmail]
      .filter(Boolean)
      .map((e) => String(e).trim().toLowerCase())
  );

  const greeting = user.firstName
    ? `שלום ${user.firstName},`
    : "שלום,";
  const text = `${greeting}\n\n${body}\n\n— צוות Meant To B`;
  const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.5;">
      <p>${escapeHtml(greeting)}</p>
      <p>${escapeHtml(body)}</p>
      <p style="color:#666;">— צוות Meant To B</p>
    </div>
  `;

  await sendMail({
    to: [...recipients],
    subject,
    text,
    html,
  });
}

export async function createNotification({
  userId,
  messageKey,
  messageParams = {},
  meetingId = null,
}) {
  if (!userId || !messageKey) return null;
  const doc = await NotificationModel.create({
    userId,
    messageKey,
    messageParams,
    meetingId,
  });

  // Email user + admin; never fail the in-app notification on mail errors
  emailNotification(doc).catch((err) => {
    console.error("[email] Failed to send notification email:", err.message);
  });

  return doc;
}

export async function getNotificationsForUser(userId, limit = 50) {
  return NotificationModel.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
}

export async function markNotificationRead(notificationId, userId) {
  const doc = await NotificationModel.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true },
    { new: true }
  );
  if (!doc) {
    throw Object.assign(new Error("Notification not found"), { status: 404 });
  }
  return doc;
}

export async function markAllNotificationsRead(userId) {
  await NotificationModel.updateMany({ userId, read: false }, { read: true });
  return { ok: true };
}
