import React, { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LogoutIcon from "@mui/icons-material/Logout";
import SchoolIcon from "@mui/icons-material/School";
import StarIcon from "@mui/icons-material/Star";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import EditIcon from "@mui/icons-material/Edit";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useRoleMode } from "../../context/RoleModeContext";
import { useLanguage } from "../../context/LanguageContext";

export default function ProfileMenu() {
  const { currentUser, logout, isAdmin, isMentor } = useAuth();
  const { isMentorMode } = useRoleMode();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  if (!currentUser) return null;

  const initials = `${currentUser.firstName?.[0] || ""}${currentUser.lastName?.[0] || ""}`;
  const isMenteeOnly = !isAdmin && !isMentor;
  const activeModeLabel = isAdmin
    ? t("mode.adminOnly")
    : isMentorMode
      ? t("mode.activeMentor")
      : t("mode.activeMentee");

  const handleOpen = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const go = (path) => {
    handleClose();
    navigate(path);
  };

  const handleLogout = () => {
    handleClose();
    logout();
    navigate("/login");
  };

  return (
    <Box>
      <IconButton
        onClick={handleOpen}
        size="small"
        aria-label={t("nav.profile")}
        aria-controls={open ? "profile-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        sx={{
          p: 0.35,
          border: "2px solid",
          borderColor: open ? "#7c3aed" : "rgba(124,58,237,0.25)",
          transition: "border-color 0.2s ease",
        }}
      >
        <Avatar
          src={currentUser.profilePicture || undefined}
          sx={{
            width: 36,
            height: 36,
            bgcolor: "#7c3aed",
            fontSize: "0.85rem",
            fontWeight: 700,
          }}
        >
          {initials || <PersonOutlineIcon fontSize="small" />}
        </Avatar>
      </IconButton>

      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          sx: {
            mt: 1.2,
            minWidth: 300,
            borderRadius: 3,
            border: "1px solid rgba(124,58,237,0.12)",
            overflow: "hidden",
          },
        }}
        MenuListProps={{ sx: { py: 0 } }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
            background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(236,72,153,0.08))",
          }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            {currentUser.firstName} {currentUser.lastName}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {currentUser.email}
          </Typography>
          <Chip
            size="small"
            icon={
              isAdmin ? (
                <AdminPanelSettingsIcon />
              ) : isMentorMode ? (
                <StarIcon />
              ) : (
                <SchoolIcon />
              )
            }
            label={t("mode.activeMode", { mode: activeModeLabel })}
            sx={{
              mt: 1.25,
              fontWeight: 700,
              bgcolor: isMentorMode
                ? "rgba(236,72,153,0.14)"
                : "rgba(99,102,241,0.14)",
              color: isMentorMode ? "#be185d" : "#4338ca",
            }}
          />
        </Box>

        {isMenteeOnly && (
          <>
            <Box sx={{ px: 2, py: 1.75 }}>
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                startIcon={<WorkspacePremiumIcon />}
                onClick={() => go("/become-mentor")}
                sx={{ fontWeight: 800, borderRadius: 2, py: 1.1 }}
              >
                {t("mentors.becomeMentor")}
              </Button>
            </Box>
            <Divider />
          </>
        )}

        <MenuItem onClick={() => go("/profile")}>
          <ListItemIcon>
            <PersonOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t("nav.profile")} />
        </MenuItem>

        {isMentor && !isAdmin && (
          <MenuItem onClick={() => go("/become-mentor")}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t("nav.mentorProfile")} />
          </MenuItem>
        )}

        {isAdmin && (
          <MenuItem onClick={() => go("/admin")}>
            <ListItemIcon>
              <AdminPanelSettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t("nav.admin")} />
          </MenuItem>
        )}

        <Divider />

        <MenuItem onClick={handleLogout} sx={{ color: "#be185d", py: 1.2 }}>
          <ListItemIcon sx={{ color: "inherit" }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t("nav.logout")} />
        </MenuItem>
      </Menu>
    </Box>
  );
}
