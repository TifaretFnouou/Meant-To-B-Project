import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { mockUsers } from "../data/mockData";
import { ROLES } from "../constants";
import { useLanguage } from "./LanguageContext";

const AuthContext = createContext(null);
const STORAGE_KEY = "queenb_auth_user";
const USERS_STORAGE_KEY = "queenb_users";

function loadStoredUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return mockUsers;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return mockUsers;

    const mockIds = new Set(mockUsers.map((u) => u.id));
    const customUsers = parsed.filter((u) => !mockIds.has(u.id));
    return [...mockUsers, ...customUsers];
  } catch {
    return mockUsers;
  }
}

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
  const [users, setUsers] = useState(loadStoredUsers);
  const [currentUser, setCurrentUser] = useState(loadStoredUser);

  useEffect(() => {
    const customUsers = users.filter(
      (u) => !mockUsers.some((mockUser) => mockUser.id === u.id)
    );
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(customUsers));
  }, [users]);

  useEffect(() => {
    if (!currentUser) return;

    const fresh = users.find((u) => u.id === currentUser.id);
    if (!fresh) return;

    const safe = sanitizeUser(fresh);
    setCurrentUser((prev) => {
      if (!prev || JSON.stringify(prev) === JSON.stringify(safe)) return prev;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
      return safe;
    });
  }, [currentUser?.id, users]);

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
