import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ROLES, USER_MODES } from "../constants";
import { useAuth } from "./AuthContext";

const RoleModeContext = createContext(null);

function modeStorageKey(userId) {
  return `queenb_mode_${userId}`;
}

function resolveDefaultMode(user) {
  if (!user) return USER_MODES.MENTEE;

  const hasMentor = user.roles?.includes(ROLES.MENTOR);
  const hasMentee = user.roles?.includes(ROLES.MENTEE);

  const saved = localStorage.getItem(modeStorageKey(user.id));
  if (saved === USER_MODES.MENTOR || saved === USER_MODES.MENTEE) {
    if (hasMentor || saved === USER_MODES.MENTEE) return saved;
  }

  if (hasMentor) return USER_MODES.MENTOR;
  return USER_MODES.MENTEE;
}

export function RoleModeProvider({ children }) {
  const { currentUser, isMentor, isMentee, isAdmin } = useAuth();
  const [activeMode, setActiveModeState] = useState(() => resolveDefaultMode(currentUser));

  useEffect(() => {
    if (isAdmin) return;
    setActiveModeState(resolveDefaultMode(currentUser));
  }, [currentUser?.id, isAdmin, isMentor, isMentee]);

  // Dual-role users (mentee + mentor) can switch views.
  // Mentors without mentee role can still open mentee view to seek mentorship.
  const canSwitchMode = Boolean(isMentor && !isAdmin);
  const isDualRole = Boolean(isMentor && isMentee && !isAdmin);

  const setMode = useCallback(
    (mode) => {
      if (!currentUser || isAdmin) return;
      if (mode !== USER_MODES.MENTEE && mode !== USER_MODES.MENTOR) return;

      if (isMentor) {
        setActiveModeState(mode);
        localStorage.setItem(modeStorageKey(currentUser.id), mode);
        return;
      }

      setActiveModeState(USER_MODES.MENTEE);
    },
    [currentUser, isAdmin, isMentor]
  );

  const isMenteeMode = !isAdmin && activeMode === USER_MODES.MENTEE;
  const isMentorMode = !isAdmin && activeMode === USER_MODES.MENTOR;

  const value = useMemo(
    () => ({
      activeMode,
      setMode,
      canSwitchMode,
      isDualRole,
      isMenteeMode,
      isMentorMode,
      isAdminMode: isAdmin,
      canActAsMentee: !isAdmin && isMenteeMode,
      canActAsMentor: !isAdmin && isMentor && isMentorMode,
    }),
    [
      activeMode,
      canSwitchMode,
      isAdmin,
      isDualRole,
      isMenteeMode,
      isMentor,
      isMentorMode,
      setMode,
    ]
  );

  return (
    <RoleModeContext.Provider value={value}>{children}</RoleModeContext.Provider>
  );
}

export function useRoleMode() {
  const ctx = useContext(RoleModeContext);
  if (!ctx) throw new Error("useRoleMode must be used within RoleModeProvider");
  return ctx;
}
