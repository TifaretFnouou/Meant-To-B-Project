import React, { createContext, useContext, useMemo, useState } from "react";
import { mockNotifications } from "../data/mockData";
import { useLanguage } from "./LanguageContext";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState(mockNotifications);

  const resolveMessage = (n) => {
    if (n.messageKey) return t(n.messageKey, n.messageParams || {});
    return n.message || "";
  };

  const addNotification = (userId, messageKey, messageParams = {}, sessionId = null) => {
    const item = {
      id: `notif-${Date.now()}`,
      userId,
      messageKey,
      messageParams,
      read: false,
      createdAt: new Date().toISOString(),
      sessionId,
    };
    setNotifications((prev) => [item, ...prev]);
    return item;
  };

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = (userId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.userId === userId ? { ...n, read: true } : n))
    );
  };

  const getForUser = (userId) =>
    notifications.filter((n) => n.userId === userId);

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
