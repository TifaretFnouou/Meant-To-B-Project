import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api, { getStoredToken } from "../services/api";
import { useAuth } from "./AuthContext";
import { useLanguage } from "./LanguageContext";

const NotificationContext = createContext(null);

function mapServerNotification(n) {
  return {
    id: String(n.id || n._id),
    userId: String(n.userId),
    messageKey: n.messageKey,
    messageParams: n.messageParams || {},
    read: Boolean(n.read),
    createdAt: n.createdAt || new Date().toISOString(),
    meetingId: n.meetingId ? String(n.meetingId) : null,
  };
}

export function NotificationProvider({ children }) {
  const { t } = useLanguage();
  const { currentUser, authReady } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const refreshNotifications = useCallback(async () => {
    if (!getStoredToken() || !currentUser) {
      setNotifications([]);
      return [];
    }
    try {
      const response = await api.get("/notifications/me", {
        params: { _ts: Date.now() },
      });
      const list = (response.data?.data || []).map(mapServerNotification);
      setNotifications(list);
      return list;
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      return [];
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (!authReady) return;
    if (!currentUser) {
      setNotifications([]);
      return undefined;
    }
    refreshNotifications();
    const id = setInterval(refreshNotifications, 30000);
    return () => clearInterval(id);
  }, [authReady, currentUser?.id, refreshNotifications]);

  const resolveMessage = (n) => {
    if (n.messageKey) return t(n.messageKey, n.messageParams || {});
    return n.message || "";
  };

  /** Optimistic local + server persist when possible */
  const addNotification = async (userId, messageKey, messageParams = {}, meetingId = null) => {
    if (!userId) return null;
    // Local optimistic item (for same-browser UX); server is source of truth via poll
    const item = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: String(userId),
      messageKey,
      messageParams,
      read: false,
      createdAt: new Date().toISOString(),
      meetingId: meetingId ? String(meetingId) : null,
    };
    setNotifications((prev) => [item, ...prev].slice(0, 100));
    // Booking notifications for mentors are created server-side; refresh soon
    setTimeout(() => {
      refreshNotifications();
    }, 800);
    return item;
  };

  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    if (String(id).startsWith("local-")) return;
    try {
      await api.put(`/notifications/${id}/read`);
    } catch (error) {
      console.error("Failed to mark notification read:", error);
    }
  };

  const markAllAsRead = async (userId) => {
    const uid = String(userId);
    setNotifications((prev) =>
      prev.map((n) => (String(n.userId) === uid ? { ...n, read: true } : n))
    );
    try {
      await api.put("/notifications/me/read-all");
    } catch (error) {
      console.error("Failed to mark all notifications read:", error);
    }
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
      refreshNotifications,
    }),
    [notifications, resolveMessage, refreshNotifications]
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
