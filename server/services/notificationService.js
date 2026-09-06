import NotificationModel from "../models/notification.js";

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
