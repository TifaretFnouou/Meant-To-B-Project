import React from "react";
import { Box, Tooltip, Chip } from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import StarIcon from "@mui/icons-material/Star";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { useNavigate } from "react-router-dom";
import { useRoleMode } from "../../context/RoleModeContext";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { USER_MODES } from "../../constants";

/**
 * Main-nav role switcher: visual two-sided control that shows
 * how the user moves between Mentee and Mentor contexts.
 */
export default function RoleModeSwitcher() {
  const { currentUser, isAdmin } = useAuth();
  const { activeMode, setMode, canSwitchMode, isMenteeMode, isMentorMode } = useRoleMode();
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (!currentUser) return null;

  if (isAdmin) {
    return (
      <Chip
        size="small"
        icon={<AdminPanelSettingsIcon />}
        label={t("mode.adminOnly")}
        sx={{
          fontWeight: 700,
          bgcolor: "rgba(124,58,237,0.12)",
          color: "#6d28d9",
          border: "1px solid rgba(124,58,237,0.25)",
        }}
      />
    );
  }

  if (!canSwitchMode) {
    return (
      <Chip
        size="small"
        icon={isMenteeMode ? <SchoolIcon /> : <StarIcon />}
        label={
          isMenteeMode
            ? t("mode.activeMode", { mode: t("mode.activeMentee") })
            : t("mode.activeMode", { mode: t("mode.activeMentor") })
        }
        sx={{
          fontWeight: 700,
          bgcolor: isMenteeMode ? "rgba(99,102,241,0.12)" : "rgba(236,72,153,0.12)",
          color: isMenteeMode ? "#4338ca" : "#be185d",
          border: "1px solid",
          borderColor: isMenteeMode ? "rgba(99,102,241,0.3)" : "rgba(236,72,153,0.3)",
        }}
      />
    );
  }

  const selectMode = (mode) => {
    if (mode === activeMode) return;
    setMode(mode);
    navigate(mode === USER_MODES.MENTEE ? "/mentors" : "/sessions");
  };

  return (
    <Tooltip title={t("mode.switchHint")} arrow>
      <Box
        role="group"
        aria-label={t("mode.switchLabel")}
        sx={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          minWidth: { xs: 220, sm: 260 },
          p: 0.5,
          borderRadius: 999,
          bgcolor: "rgba(255,255,255,0.95)",
          border: "1px solid rgba(124,58,237,0.2)",
          boxShadow: "0 4px 14px rgba(124,58,237,0.12)",
          flexShrink: 0,
        }}
      >
          {/* Sliding highlight */}
          <Box
            sx={{
              position: "absolute",
              top: 4,
              bottom: 4,
              width: "calc(50% - 18px)",
              left: isMentorMode ? "calc(50% + 14px)" : 4,
              borderRadius: 999,
              background: isMentorMode
                ? "linear-gradient(135deg, #ec4899, #db2777)"
                : "linear-gradient(135deg, #6366f1, #4f46e5)",
              boxShadow: isMentorMode
                ? "0 4px 12px rgba(236,72,153,0.35)"
                : "0 4px 12px rgba(99,102,241,0.35)",
              transition: "left 0.28s ease, background 0.28s ease, box-shadow 0.28s ease",
              zIndex: 0,
            }}
          />

          <Box
            component="button"
            type="button"
            onClick={() => selectMode(USER_MODES.MENTEE)}
            aria-pressed={isMenteeMode}
            sx={{
              position: "relative",
              zIndex: 1,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.6,
              py: 0.85,
              px: 1,
              borderRadius: 999,
              color: isMenteeMode ? "#fff" : "#64748b",
              fontWeight: 800,
              fontSize: "0.8rem",
              fontFamily: "inherit",
              transition: "color 0.2s ease",
            }}
          >
            <SchoolIcon sx={{ fontSize: 18 }} />
            {t("mode.menteeOnly")}
          </Box>

          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              width: 28,
              height: 28,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "#fff",
              border: "1px solid rgba(124,58,237,0.25)",
              color: "#7c3aed",
              boxShadow: "0 2px 8px rgba(15,23,42,0.08)",
            }}
          >
            <SyncAltIcon sx={{ fontSize: 16 }} />
          </Box>

          <Box
            component="button"
            type="button"
            onClick={() => selectMode(USER_MODES.MENTOR)}
            aria-pressed={isMentorMode}
            sx={{
              position: "relative",
              zIndex: 1,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.6,
              py: 0.85,
              px: 1,
              borderRadius: 999,
              color: isMentorMode ? "#fff" : "#64748b",
              fontWeight: 800,
              fontSize: "0.8rem",
              fontFamily: "inherit",
              transition: "color 0.2s ease",
            }}
          >
            <StarIcon sx={{ fontSize: 18 }} />
            {t("mode.mentorOnly")}
          </Box>
      </Box>
    </Tooltip>
  );
}
