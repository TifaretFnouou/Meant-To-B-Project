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

export default function MainLayout({ children }) {
  const { currentUser, logout, isAdmin } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <AppBar position="sticky">
        <Toolbar sx={{ gap: 1, flexWrap: "wrap", py: 1 }}>
          <Typography
            variant="h6"
            onClick={() => navigate("/")}
            sx={{
              cursor: "pointer",
              userSelect: "none",
              fontWeight: 800,
              background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              flexShrink: 0,
            }}
          >
            👑 {t("nav.brand")}
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <LanguageToggle />

          {currentUser ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
              <Button color="inherit" onClick={() => navigate("/mentors")}>
                {t("nav.mentors")}
              </Button>
              <Button color="inherit" onClick={() => navigate("/sessions")}>
                {t("nav.sessions")}
              </Button>
              <Button color="inherit" onClick={() => navigate("/profile")}>
                {t("nav.profile")}
              </Button>
              {isAdmin && (
                <Button color="inherit" onClick={() => navigate("/admin")}>
                  {t("nav.admin")}
                </Button>
              )}
              <NotificationBell />
              <Typography variant="body2" sx={{ mx: 1, fontWeight: 600 }}>
                {currentUser.firstName}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={handleLogout}
                sx={{ borderColor: "rgba(124,58,237,0.3)", color: "#7c3aed" }}
              >
                {t("nav.logout")}
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
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
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}
