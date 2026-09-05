import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import NotificationBell from "../common/NotificationBell";
import LanguageToggle from "../common/LanguageToggle";
import ProfileMenu from "../common/ProfileMenu";
import RoleModeSwitcher from "../common/RoleModeSwitcher";
import ThemeToggle from "../common/ThemeToggle";
import { useRoleMode } from "../../context/RoleModeContext";
import { brand } from "../../theme/brand";

export default function MainLayout({ children }) {
  const { currentUser, isAdmin, isMentor } = useAuth();
  const { isMenteeMode, isMentorMode } = useRoleMode();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [mobileAnchor, setMobileAnchor] = useState(null);

  const go = (path) => {
    setMobileAnchor(null);
    navigate(path);
  };

  const userNavigation = isAdmin
    ? [{ label: t("nav.admin"), path: "/admin" }]
    : [
        { label: t("nav.mentors"), path: "/mentors" },
        ...(isMenteeMode && !isMentor
          ? [{ label: t("mentors.becomeMentor"), path: "/become-mentor" }]
          : []),
        {
          label: isMentorMode ? t("nav.sessionsAsMentor") : t("nav.sessions"),
          path: "/sessions",
        },
        { label: t("nav.calendar"), path: "/calendar" },
      ];

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <AppBar position="sticky">
        <Toolbar
          sx={{
            gap: { xs: 0.5, md: 1 },
            flexWrap: "wrap",
            py: { xs: 0.75, md: 1 },
            px: { xs: 1.5, sm: 2.5 },
            minHeight: { xs: 64, md: 72 },
          }}
        >
          <Box
            component="button"
            type="button"
            onClick={() => navigate("/")}
            aria-label={t("nav.brand")}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              border: 0,
              p: 0,
              color: "inherit",
              background: "transparent",
              cursor: "pointer",
              userSelect: "none",
              flexShrink: 0,
            }}
          >
            <Box
              component="img"
              src="/logoW.png"
              alt=""
              sx={{ width: { xs: 46, md: 56 }, height: { xs: 46, md: 56 }, objectFit: "contain" }}
            />
            <Typography
              variant="h6"
              sx={{
                display: { xs: "none", sm: "block" },
                fontWeight: 800,
                background: `linear-gradient(135deg, ${brand.peach}, ${brand.dustyRose})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {t("nav.brand")}
            </Typography>
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

          {(!currentUser || isAdmin) && <Box sx={{ flexGrow: 1 }} />}

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
            <ThemeToggle />
            {currentUser && <NotificationBell />}
            {currentUser && <ProfileMenu />}

            {currentUser ? (
              <>
                <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 0.25 }}>
                  {isAdmin && <RoleModeSwitcher />}
                  {userNavigation.map((item) => (
                    <Button key={item.path} color="inherit" onClick={() => navigate(item.path)}>
                      {item.label}
                    </Button>
                  ))}
                </Box>
                <IconButton
                  color="inherit"
                  onClick={(event) => setMobileAnchor(event.currentTarget)}
                  aria-label="Open navigation"
                  sx={{ display: { xs: "inline-flex", md: "none" } }}
                >
                  <MenuIcon />
                </IconButton>
                <Menu
                  anchorEl={mobileAnchor}
                  open={Boolean(mobileAnchor)}
                  onClose={() => setMobileAnchor(null)}
                >
                  {userNavigation.map((item) => (
                    <MenuItem key={item.path} onClick={() => go(item.path)}>
                      {item.label}
                    </MenuItem>
                  ))}
                </Menu>
              </>
            ) : (
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <Button color="inherit" onClick={() => navigate("/login")} sx={{ px: { xs: 1, sm: 2 } }}>
                  {t("nav.login")}
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate("/register")}
                  sx={{ px: { xs: 1.25, sm: 2.5 } }}
                >
                  {t("nav.register")}
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: { xs: 2.5, md: 4 }, pb: 10, px: { xs: 2, sm: 3 } }}>
        {children}
      </Container>

      <LanguageToggle floating />
    </Box>
  );
}
