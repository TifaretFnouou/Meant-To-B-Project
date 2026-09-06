import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLanguage } from "./LanguageContext";

const NotificationContext = createContext(null);
const STORAGE_KEY = "queenb_notifications_v1";

function loadNotifications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistNotifications(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore quota errors */
  }
}

export function NotificationProvider({ children }) {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState(loadNotifications);

  useEffect(() => {
    persistNotifications(notifications);
  }, [notifications]);

  const resolveMessage = (n) => {
    if (n.messageKey) return t(n.messageKey, n.messageParams || {});
    return n.message || "";
  };

  const addNotification = (userId, messageKey, messageParams = {}, meetingId = null) => {
    if (!userId) return null;
    const item = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: String(userId),
      messageKey,
      messageParams,
      read: false,
      createdAt: new Date().toISOString(),
      meetingId: meetingId ? String(meetingId) : null,
    };
    setNotifications((prev) => [item, ...prev].slice(0, 100));
    return item;
  };

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = (userId) => {
    const uid = String(userId);
    setNotifications((prev) =>
      prev.map((n) => (String(n.userId) === uid ? { ...n, read: true } : n))
    );
  };

  const getForUser = (userId) =>
    notifications.filter((n) => String(n.userId) === String(userId));

  const value = useMemo(
    () => ({
      notifications,
      addNotification,
      markAsRead,
      markAllAsRead,
      getForUser,
      resolveMessage,
    }),
    [notifications, resolveMessage]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
}
