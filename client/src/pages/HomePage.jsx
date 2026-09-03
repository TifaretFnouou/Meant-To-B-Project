import React from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Stack,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import GroupsIcon from "@mui/icons-material/Groups";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import { useAuth } from "../context/AuthContext";
import { useRoleMode } from "../context/RoleModeContext";
import { useLanguage } from "../context/LanguageContext";
import { brand } from "../theme/brand";

const features = [
  { icon: AutoAwesomeIcon, titleKey: "home.feature1Title", descKey: "home.feature1Desc" },
  { icon: CalendarMonthIcon, titleKey: "home.feature2Title", descKey: "home.feature2Desc" },
  { icon: GroupsIcon, titleKey: "home.feature3Title", descKey: "home.feature3Desc" },
];

export default function HomePage() {
  const { isAuthenticated, currentUser, isMentor, isAdmin } = useAuth();
  const { isMenteeMode, isMentorMode } = useRoleMode();
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <MainLayout>
      <Paper
        sx={{
          p: { xs: 4, md: 7 },
          mb: 4,
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(135deg, ${brand.peach} 0%, ${brand.lavender} 45%, ${brand.dustyRose} 100%)`,
          color: brand.charcoal,
          border: "none",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: brand.yellowSoft,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: -40,
            left: -40,
            width: 150,
            height: 150,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.35)",
          }}
        />

        <Box
          component="img"
          src="/logoW.png"
          alt={t("home.title")}
          sx={{
            width: { xs: 88, md: 112 },
            height: { xs: 88, md: 112 },
            objectFit: "contain",
            mb: 2,
            filter: "drop-shadow(0 8px 20px rgba(59,59,59,0.12))",
          }}
        />

        <Typography variant="h3" component="h1" gutterBottom fontWeight={800} sx={{ color: brand.charcoal }}>
          {t("home.title")}
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, opacity: 0.85, maxWidth: 560, mx: "auto", color: brand.charcoal }}>
          {t("home.subtitle")}
        </Typography>

        {isAuthenticated ? (
          <Box>
            <Typography variant="body1" sx={{ mb: 3, fontSize: "1.1rem" }}>
              {t("home.greeting", { name: currentUser.firstName })}
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
              {isAdmin ? (
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => navigate("/admin")}
                  size="large"
                >
                  {t("nav.admin")}
                </Button>
              ) : (
                <>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate("/mentors")}
                    size="large"
                  >
                    {t("home.findMentors")}
                  </Button>
                  <Button
                    variant={isMenteeMode ? "outlined" : "contained"}
                    color="primary"
                    onClick={() => navigate("/sessions")}
                    size="large"
                  >
                    {isMentorMode ? t("nav.sessionsAsMentor") : t("home.mySessions")}
                  </Button>
                  {isMenteeMode && (
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => navigate("/become-mentor")}
                      size="large"
                    >
                      {isMentor ? t("nav.mentorProfile") : t("mentors.becomeMentor")}
                    </Button>
                  )}
                </>
              )}
            </Stack>
          </Box>
        ) : (
          <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate("/register")}
              size="large"
            >
              {t("home.joinNow")}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate("/login")}
              size="large"
            >
              {t("nav.login")}
            </Button>
          </Stack>
        )}
      </Paper>

      <Grid container spacing={3}>
        {features.map(({ icon: Icon, titleKey, descKey }) => (
          <Grid item xs={12} md={4} key={titleKey}>
            <Paper sx={{ p: 3, height: "100%", textAlign: "center" }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 3,
                  mx: "auto",
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `linear-gradient(135deg, ${brand.peachSoft}, ${brand.lavenderSoft})`,
                }}
              >
                <Icon sx={{ color: brand.dustyRose, fontSize: 28 }} />
              </Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                {t(titleKey)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t(descKey)}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </MainLayout>
  );
}
