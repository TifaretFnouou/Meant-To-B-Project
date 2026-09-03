import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import NotificationBell from "../common/NotificationBell";
import LanguageToggle from "../common/LanguageToggle";
import ProfileMenu from "../common/ProfileMenu";
import RoleModeSwitcher from "../common/RoleModeSwitcher";
import ChatWidget from "../chat/ChatWidget";
import { useRoleMode } from "../../context/RoleModeContext";
import { brand } from "../../theme/brand";

export default function MainLayout({ children }) {
  const { currentUser, isAdmin, isMentor } = useAuth();
  const { isMenteeMode, isMentorMode } = useRoleMode();
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <AppBar position="sticky">
        <Toolbar sx={{ gap: 1.5, flexWrap: "wrap", py: 1.5, minHeight: 80 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexShrink: 0 }}>
            <Box
              onClick={() => navigate("/")}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <Box
                component="img"
                src="/logo.png"
                alt={t("nav.brand")}
                sx={{
                  width: 64,
                  height: 64,
                  objectFit: "contain",
                  display: "block",
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  background: `linear-gradient(135deg, ${brand.peach}, ${brand.dustyRose})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: brand.charcoal,
                }}
              >
                {t("nav.brand")}
              </Typography>
            </Box>
            {currentUser && <ProfileMenu />}
          </Box>

          {currentUser && !isAdmin && (
            <Box
              sx={{
                flexGrow: 1,
                display: "flex",
                justifyContent: "center",
                order: { xs: 3, md: 0 },
                width: { xs: "100%", md: "auto" },
                py: { xs: 0.5, md: 0 },
              }}
            >
              <RoleModeSwitcher />
            </Box>
          )}

          {!(currentUser && !isAdmin) && <Box sx={{ flexGrow: 1 }} />}

          {currentUser ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap", ml: "auto" }}>
              {isAdmin ? (
                <>
                  <RoleModeSwitcher />
                  <Button color="inherit" onClick={() => navigate("/admin")}>
                    {t("nav.admin")}
                  </Button>
                </>
              ) : (
                <>
                  <Button color="inherit" onClick={() => navigate("/mentors")}>
                    {t("nav.mentors")}
                  </Button>
                  {isMenteeMode && !isMentor && (
                    <Button color="inherit" onClick={() => navigate("/become-mentor")}>
                      {t("mentors.becomeMentor")}
                    </Button>
                  )}
                  <Button color="inherit" onClick={() => navigate("/sessions")}>
                    {isMentorMode ? t("nav.sessionsAsMentor") : t("nav.sessions")}
                  </Button>
                  <Button color="inherit" onClick={() => navigate("/calendar")}>
                    {t("nav.calendar")}
                  </Button>
                </>
              )}
              <NotificationBell />
            </Box>
          ) : (
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", ml: "auto" }}>
              <Button color="inherit" onClick={() => navigate("/login")}>
                {t("nav.login")}
              </Button>
              <Button variant="contained" color="primary" onClick={() => navigate("/register")}>
                {t("nav.register")}
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4, pb: 10 }}>
        {children}
      </Container>

      <LanguageToggle floating />
      <ChatWidget />
    </Box>
  );
}
