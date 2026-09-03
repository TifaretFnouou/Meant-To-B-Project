import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ROLES } from "../constants";
import { useLanguage } from "./LanguageContext";
import {
  clearStoredToken,
  fetchMe,
  fetchUsers,
  getErrorMessage,
  getStoredToken,
  loginRequest,
  registerRequest,
  setStoredToken,
  updateProfilePictureRequest,
  updateUserRequest,
} from "../services/api";

const AuthContext = createContext(null);
const USER_STORAGE_KEY = "queenb_auth_user";

function loadStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistUser(user) {
  if (!user) {
    localStorage.removeItem(USER_STORAGE_KEY);
    return;
  }
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }) {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(loadStoredUser);
  const [authReady, setAuthReady] = useState(false);

  const refreshUsers = useCallback(async () => {
    try {
      const list = await fetchUsers();
      setUsers(list);
      return list;
    } catch {
      setUsers([]);
      return [];
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const token = getStoredToken();
      if (!token) {
        setCurrentUser(null);
        persistUser(null);
        setUsers([]);
        if (!cancelled) setAuthReady(true);
        return;
      }

      try {
        const me = await fetchMe();
        if (cancelled) return;
        setCurrentUser(me);
        persistUser(me);
        await refreshUsers();
      } catch {
        if (cancelled) return;
        clearStoredToken();
        setCurrentUser(null);
        persistUser(null);
        setUsers([]);
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [refreshUsers]);

  const login = async (email, password) => {
    try {
      const { user, token } = await loginRequest(email, password);
      setStoredToken(token);
      setCurrentUser(user);
      persistUser(user);
      await refreshUsers();
      return user;
    } catch (error) {
      throw new Error(getErrorMessage(error, t("auth.invalidCredentials")));
    }
  };

  const register = async (payload) => {
    try {
      const formData = new FormData();
      const {
        profilePictureFile,
        techStack = [],
        roles,
        menteeGoals,
        yearsOfExperience,
        ...rest
      } = payload;
      delete rest.profilePicture;
      delete rest.profilePictureUrl;

      Object.entries(rest).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        formData.append(key, value);
      });

      formData.append("yearsOfExperience", String(Number(yearsOfExperience) || 0));
      formData.append("techStack", JSON.stringify(techStack));
      formData.append("roles", JSON.stringify(roles || [ROLES.MENTEE]));
      if (menteeGoals) {
        formData.append("menteeGoals", menteeGoals);
      }

      if (profilePictureFile instanceof File) {
        formData.append("profilePicture", profilePictureFile);
      }

      const { user, token } = await registerRequest(formData);
      setStoredToken(token);
      setCurrentUser(user);
      persistUser(user);
      await refreshUsers();
      return user;
    } catch (error) {
      throw new Error(getErrorMessage(error, t("auth.userExists")));
    }
  };

  const updateProfile = async (updates = {}) => {
    if (!currentUser) return null;

    try {
      const {
        profilePictureFile,
        password,
        id,
        _id,
        email,
        createdAt,
        updatedAt,
        __v,
        ...safeUpdates
      } = updates;
      delete safeUpdates.profilePicture;

      let updated = currentUser;

      if (Object.keys(safeUpdates).length > 0) {
        updated = await updateUserRequest(currentUser.id, safeUpdates);
      }

      if (profilePictureFile instanceof File) {
        await updateProfilePictureRequest(
          currentUser.id,
          profilePictureFile
        );
      }

      updated = await fetchMe();
      setCurrentUser(updated);
      persistUser(updated);
      setUsers((prev) => {
        const exists = prev.some((u) => u.id === updated.id);
        if (!exists) return [...prev, updated];
        return prev.map((u) => (u.id === updated.id ? updated : u));
      });
      return updated;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Failed to update profile"));
    }
  };

  const logout = () => {
    clearStoredToken();
    setCurrentUser(null);
    persistUser(null);
    setUsers([]);
  };

  const value = useMemo(
    () => ({
      currentUser,
      users,
      authReady,
      login,
      register,
      updateProfile,
      logout,
      refreshUsers,
      isAuthenticated: Boolean(currentUser),
      isAdmin: currentUser?.roles?.includes(ROLES.ADMIN),
      isMentor: currentUser?.roles?.includes(ROLES.MENTOR),
      isMentee: currentUser?.roles?.includes(ROLES.MENTEE),
    }),
    [currentUser, users, authReady, refreshUsers]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
