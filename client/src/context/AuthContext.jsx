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
  SESSION_EXPIRED_EVENT,
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
  // Track token in React state so UI cannot stay "logged in" after localStorage token disappears
  const [hasToken, setHasToken] = useState(() => Boolean(getStoredToken()));

  const clearSession = useCallback(() => {
    clearStoredToken();
    setHasToken(false);
    setCurrentUser(null);
    persistUser(null);
    setUsers([]);
  }, []);

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
        clearSession();
        if (!cancelled) setAuthReady(true);
        return;
      }

      setHasToken(true);
      try {
        const me = await fetchMe();
        if (cancelled) return;
        setCurrentUser(me);
        persistUser(me);
        await refreshUsers();
      } catch {
        if (cancelled) return;
        clearSession();
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [refreshUsers, clearSession]);

  // Cross-tab logout / token cleared elsewhere / 401 from API
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== "queenb_token") return;
      if (!event.newValue) {
        clearSession();
      } else {
        setHasToken(true);
      }
    };

    const onSessionExpired = () => {
      clearSession();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    };
  }, [clearSession]);

  const login = async (email, password) => {
    try {
      const { user, token } = await loginRequest(email, password);
      if (!token) {
        throw new Error(t("auth.invalidCredentials"));
      }
      setStoredToken(token);
      setHasToken(true);
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
        menteeGoals,
        yearsOfExperience,
        // --- NEW FIELDS EXTRACTED ---
        isMentor,
        mentorProfile,
        ...rest
      } = payload;
      
      delete rest.profilePicture;
      delete rest.profilePictureUrl;
      // We also don't extract 'roles' anymore, because the backend determines it based on 'isMentor'

      Object.entries(rest).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        formData.append(key, value);
      });

      formData.append("yearsOfExperience", String(Number(yearsOfExperience) || 0));
      formData.append("techStack", JSON.stringify(techStack));
      
      if (menteeGoals) {
        formData.append("menteeGoals", menteeGoals);
      }

      // --- NEW LOGIC: APPEND MENTOR DATA ---
      if (isMentor !== undefined) {
        formData.append("isMentor", isMentor);
      }
      
      // If the user wants to be a mentor, append the stringified profile object
      if (isMentor && mentorProfile) {
        formData.append("mentorProfile", JSON.stringify(mentorProfile));
      }

      if (profilePictureFile instanceof File) {
        formData.append("profilePicture", profilePictureFile);
      }

      const { user, token } = await registerRequest(formData);
      if (!token) {
        throw new Error(t("auth.invalidCredentials"));
      }
      setStoredToken(token);
      setHasToken(true);
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

      // Note: No JSON.stringify is needed here because updateUserRequest (PUT)
      // usually sends application/json by default, not FormData.
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
    clearSession();
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
      // Require both user + token so protected pages cannot call APIs without Authorization
      isAuthenticated: Boolean(currentUser && hasToken),
      isAdmin: currentUser?.roles?.includes(ROLES.ADMIN),
      isMentor: currentUser?.roles?.includes(ROLES.MENTOR),
      isMentee: currentUser?.roles?.includes(ROLES.MENTEE),
    }),
    [currentUser, users, authReady, hasToken, refreshUsers]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}