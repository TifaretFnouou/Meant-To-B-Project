import React, { createContext, useContext, useMemo, useState } from "react";
import { mockUsers } from "../data/mockData";
import { ROLES } from "../constants";
import { useLanguage } from "./LanguageContext";

const AuthContext = createContext(null);
const STORAGE_KEY = "queenb_auth_user";

function loadStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

export function AuthProvider({ children }) {
  const { t } = useLanguage();
  const [users, setUsers] = useState(mockUsers);
  const [currentUser, setCurrentUser] = useState(loadStoredUser);

  const login = async (identifier, password) => {
    const normalized = identifier.trim().toLowerCase();
    const found = users.find(
      (u) =>
        u.email.toLowerCase() === normalized ||
        u.username.toLowerCase() === normalized
    );

    if (!found || found.password !== password) {
      throw new Error(t("auth.invalidCredentials"));
    }

    const safe = sanitizeUser(found);
    setCurrentUser(safe);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
    return safe;
  };

  const register = async (payload) => {
    const exists = users.some(
      (u) =>
        u.email.toLowerCase() === payload.email.toLowerCase() ||
        u.username.toLowerCase() === payload.username.toLowerCase()
    );

    if (exists) {
      throw new Error(t("auth.userExists"));
    }

    const newUser = {
      id: `user-${Date.now()}`,
      roles: [ROLES.MENTEE],
      mentorProfile: null,
      menteeProfile: { isActive: true, learningGoals: payload.learningGoals || "" },
      ...payload,
    };

    setUsers((prev) => [...prev, newUser]);
    const safe = sanitizeUser(newUser);
    setCurrentUser(safe);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
    return safe;
  };

  const updateProfile = async (updates) => {
    if (!currentUser) return null;

    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, ...updates } : u))
    );

    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      currentUser,
      users,
      login,
      register,
      updateProfile,
      logout,
      isAuthenticated: Boolean(currentUser),
      isAdmin: currentUser?.roles?.includes(ROLES.ADMIN),
      isMentor: currentUser?.roles?.includes(ROLES.MENTOR),
      isMentee: currentUser?.roles?.includes(ROLES.MENTEE),
    }),
    [currentUser, users]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
