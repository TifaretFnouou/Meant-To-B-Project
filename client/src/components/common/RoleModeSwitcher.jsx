import React from "react";
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Chip,
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import StarIcon from "@mui/icons-material/Star";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { useRoleMode } from "../../context/RoleModeContext";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { USER_MODES } from "../../constants";

export default function RoleModeSwitcher() {
  const { currentUser, isAdmin } = useAuth();
  const { activeMode, setMode, canSwitchMode, isMenteeMode } = useRoleMode();
  const { t } = useLanguage();

  if (!currentUser) return null;

  if (isAdmin) {
    return (
      <Chip
        size="small"
        icon={<AdminPanelSettingsIcon />}
        label={t("mode.adminOnly")}
        sx={{
          fontWeight: 600,
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
        label={isMenteeMode ? t("mode.menteeOnly") : t("mode.mentorOnly")}
        sx={{
          fontWeight: 600,
          bgcolor: isMenteeMode ? "rgba(99,102,241,0.12)" : "rgba(236,72,153,0.12)",
          color: isMenteeMode ? "#4338ca" : "#be185d",
          border: "1px solid",
          borderColor: isMenteeMode ? "rgba(99,102,241,0.25)" : "rgba(236,72,153,0.25)",
        }}
      />
    );
  }

  return (
    <Tooltip title={t("mode.switchHint")} arrow>
      <Box>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={activeMode}
          onChange={(_, value) => value && setMode(value)}
          sx={{
            bgcolor: "rgba(255,255,255,0.95)",
            borderRadius: 2,
            "& .MuiToggleButton-root": {
              px: 1.5,
              py: 0.5,
              fontWeight: 600,
              fontSize: "0.8rem",
              border: "none",
              gap: 0.5,
              color: "#64748b",
              "&.Mui-selected": {
                bgcolor: "transparent",
                color: "#7c3aed",
              },
            },
          }}
        >
          <ToggleButton value={USER_MODES.MENTEE}>
            <SchoolIcon sx={{ fontSize: 18 }} />
            {t("mode.learning")}
          </ToggleButton>
          <ToggleButton value={USER_MODES.MENTOR}>
            <StarIcon sx={{ fontSize: 18 }} />
            {t("mode.mentoring")}
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Tooltip>
  );
}
