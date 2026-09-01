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
import { useLanguage } from "../context/LanguageContext";

const features = [
  { icon: AutoAwesomeIcon, titleKey: "home.feature1Title", descKey: "home.feature1Desc" },
  { icon: CalendarMonthIcon, titleKey: "home.feature2Title", descKey: "home.feature2Desc" },
  { icon: GroupsIcon, titleKey: "home.feature3Title", descKey: "home.feature3Desc" },
];

export default function HomePage() {
  const { isAuthenticated, currentUser } = useAuth();
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
          background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 40%, #ec4899 100%)",
          color: "white",
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
            background: "rgba(255,255,255,0.1)",
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
            background: "rgba(255,255,255,0.08)",
          }}
        />

        <Typography variant="h3" component="h1" gutterBottom fontWeight={800}>
          {t("home.title")}
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, opacity: 0.92, maxWidth: 560, mx: "auto" }}>
          {t("home.subtitle")}
        </Typography>

        {isAuthenticated ? (
          <Box>
            <Typography variant="body1" sx={{ mb: 3, fontSize: "1.1rem" }}>
              {t("home.greeting", { name: currentUser.firstName })}
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
              <Button
                variant="contained"
                color="secondary"
                onClick={() => navigate("/mentors")}
                size="large"
              >
                {t("home.findMentors")}
              </Button>
              <Button
                variant="outlined"
                sx={{ color: "white", borderColor: "rgba(255,255,255,0.6)" }}
                onClick={() => navigate("/sessions")}
                size="large"
              >
                {t("home.mySessions")}
              </Button>
            </Stack>
          </Box>
        ) : (
          <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
            <Button
              variant="contained"
              color="secondary"
              onClick={() => navigate("/register")}
              size="large"
            >
              {t("home.joinNow")}
            </Button>
            <Button
              variant="outlined"
              sx={{ color: "white", borderColor: "rgba(255,255,255,0.6)" }}
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
                  background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(236,72,153,0.15))",
                }}
              >
                <Icon sx={{ color: "#7c3aed", fontSize: 28 }} />
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
