import { verifyToken } from "../services/authService.js";
import UserModel from "../models/user.js";
import NotificationModel from "../models/notification.js";
import {
  getNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
  createNotification,
} from "../services/notificationService.js";

function statusFromError(error, fallback = 400) {
  return error.status || fallback;
}

function startOfWeekMonday(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

async function ensureWeeklyAvailabilityReminder(userId) {
  const user = await UserModel.findById(userId).select("roles");
  if (!user?.roles?.includes("mentor")) return;

  const weekStart = startOfWeekMonday();
  const existing = await NotificationModel.findOne({
    userId,
    messageKey: "notif.setWeeklyAvailability",
    createdAt: { $gte: weekStart },
  });
  if (existing) return;

  await createNotification({
    userId,
    messageKey: "notif.setWeeklyAvailability",
    messageParams: {},
  });
}

export const getMyNotificationsController = async (req, res) => {
  try {
    const actor = verifyToken(req);
    await ensureWeeklyAvailabilityReminder(actor.id);
    const list = await getNotificationsForUser(actor.id);
    res.status(200).json({
      data: list.map((n) => ({
        id: String(n._id),
        userId: String(n.userId),
        messageKey: n.messageKey,
        messageParams: n.messageParams || {},
        meetingId: n.meetingId ? String(n.meetingId) : null,
        read: Boolean(n.read),
        createdAt: n.createdAt,
      })),
    });
  } catch (err) {
    res.status(statusFromError(err, 401)).json({ error: err.message });
  }
};

export const markReadController = async (req, res) => {
  try {
    const actor = verifyToken(req);
    const doc = await markNotificationRead(req.params.id, actor.id);
    res.status(200).json({
      data: {
        id: String(doc._id),
        read: doc.read,
      },
    });
  } catch (err) {
    res.status(statusFromError(err, 401)).json({ error: err.message });
  }
};

export const markAllReadController = async (req, res) => {
  try {
    const actor = verifyToken(req);
    await markAllNotificationsRead(actor.id);
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(statusFromError(err, 401)).json({ error: err.message });
  }
};
