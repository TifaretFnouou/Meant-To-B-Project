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
import { brand } from "../../theme/brand";

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
          bgcolor: brand.lavenderSoft,
          color: brand.charcoal,
          border: `1px solid ${brand.lavender}`,
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
          bgcolor: isMenteeMode ? brand.lavenderSoft : brand.dustyRoseSoft,
          color: isMenteeMode ? "#8B7398" : brand.dustyRose,
          border: "1px solid",
          borderColor: isMenteeMode ? brand.lavender : brand.dustyRose,
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
          width: { xs: 190, sm: 220 },
          maxWidth: "100%",
          p: 0.5,
          borderRadius: 999,
          bgcolor: "background.paper",
          border: `1px solid ${brand.dustyRoseSoft}`,
          boxShadow: `0 4px 14px ${brand.peachSoft}`,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 4,
            bottom: 4,
            width: "calc(50% - 18px)",
            left: isMentorMode ? "calc(50% + 14px)" : 4,
            borderRadius: 999,
            background: isMentorMode
              ? `linear-gradient(135deg, ${brand.dustyRose}, ${brand.peach})`
              : `linear-gradient(135deg, ${brand.lavender}, ${brand.peach})`,
            boxShadow: isMentorMode
              ? `0 4px 12px ${brand.dustyRoseSoft}`
              : `0 4px 12px ${brand.lavenderSoft}`,
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
            gap: 0.4,
            py: 0.85,
            px: 0.5,
            borderRadius: 999,
            color: isMenteeMode ? brand.charcoal : "text.secondary",
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
            width: 24,
            height: 24,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "background.paper",
            border: `1px solid ${brand.peach}`,
            color: brand.dustyRose,
            boxShadow: `0 2px 8px ${brand.peachSoft}`,
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
            gap: 0.4,
            py: 0.85,
            px: 0.5,
            borderRadius: 999,
            color: isMentorMode ? brand.white : "text.secondary",
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
