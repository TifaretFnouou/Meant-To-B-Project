import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  TextField,
  Autocomplete,
  Slider,
  Alert,
  Button,
} from "@mui/material";
import { useNavigate, Navigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import PageHeader from "../components/common/PageHeader";
import MentorCard from "../components/mentorship/MentorCard";
import { useAuth } from "../context/AuthContext";
import { useRoleMode } from "../context/RoleModeContext";
import { useScheduling } from "../context/SchedulingContext";
import { useAdminConfig } from "../context/AdminConfigContext";
import { useLanguage } from "../context/LanguageContext";
import { getCatalogMentors } from "../utils/mentors";
import { USER_MODES } from "../constants";

export default function MentorsCatalogPage() {
  const { users, currentUser, isMentor, isAdmin } = useAuth();
  const { isMenteeMode, isMentorMode, setMode } = useRoleMode();
  const { createRequest, sessions } = useScheduling();
  const { techStack, adviceTopics } = useAdminConfig();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [techFilter, setTechFilter] = useState([]);
  const [topicFilter, setTopicFilter] = useState([]);
  const [expRange, setExpRange] = useState([0, 15]);
  const [message, setMessage] = useState("");

  const mentors = useMemo(
    () => getCatalogMentors(users, currentUser?.id),
    [users, currentUser?.id]
  );

  const filtered = mentors.filter((m) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      `${m.firstName} ${m.lastName} ${m.company} ${m.jobTitle}`.toLowerCase().includes(q);
    const matchesTech =
      techFilter.length === 0 ||
      techFilter.every((t) => m.techStack?.includes(t));
    const matchesTopic =
      topicFilter.length === 0 ||
      topicFilter.every((t) => m.mentorProfile?.topics?.includes(t));
    const exp = m.yearsOfExperience || 0;
    const matchesExp = exp >= expRange[0] && exp <= expRange[1];
    return matchesSearch && matchesTech && matchesTopic && matchesExp;
  });

  const hasPendingWith = (mentorId) =>
    sessions.some(
      (s) =>
        s.mentorId === mentorId &&
        s.menteeId === currentUser?.id &&
        !["cancelled", "rejected", "completed"].includes(s.status) &&
        s.schedulingState !== "cancelled" &&
        s.schedulingState !== "rejected" &&
        s.schedulingState !== "completed"
    );

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleInterest = async (mentor) => {
    if (!isMenteeMode) return;
    await createRequest(
      mentor.id,
      currentUser.id,
      `${currentUser.firstName} ${currentUser.lastName}`
    );
    setMessage(t("mentors.requestSent", { name: `${mentor.firstName} ${mentor.lastName}` }));
  };

  return (
    <MainLayout>
      <PageHeader
        title={t("mentors.title")}
        action={
          isMenteeMode && (
            <Button variant="outlined" onClick={() => navigate("/become-mentor")}>
              {isMentor ? t("nav.mentorProfile") : t("mentors.becomeMentor")}
            </Button>
          )
        }
      />

      {isMentor && isMentorMode && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => setMode(USER_MODES.MENTEE)}>
              {t("mode.Mentee")}
            </Button>
          }
        >
          {t("mentors.mentorModeBanner")}
        </Alert>
      )}

      {message && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>
          {message}
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("mentors.resultsCount", { count: filtered.length })}
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, Company, Job Title..."
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Autocomplete
            multiple
            options={techStack}
            value={techFilter}
            onChange={(_, v) => setTechFilter(v)}
            renderInput={(params) => <TextField {...params} label="Technology" />}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Autocomplete
            multiple
            options={adviceTopics}
            value={topicFilter}
            onChange={(_, v) => setTopicFilter(v)}
            renderInput={(params) => <TextField {...params} label="Advice Topic" />}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body2" gutterBottom>
            Years of Experience: {expRange[0]}–{expRange[1]}
          </Typography>
          <Slider
            value={expRange}
            onChange={(_, v) => setExpRange(v)}
            min={0}
            max={15}
            valueLabelDisplay="auto"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {filtered.map((mentor) => (
          <Grid item xs={12} sm={6} md={4} key={mentor.id}>
            <MentorCard
              mentor={mentor}
              onExpressInterest={handleInterest}
              hasPendingRequest={hasPendingWith(mentor.id)}
              canExpressInterest={isMenteeMode}
            />
          </Grid>
        ))}
        {filtered.length === 0 && (
          <Grid item xs={12}>
            <Alert severity="info">{t("mentors.noResults")}</Alert>
          </Grid>
        )}
      </Grid>
    </MainLayout>
  );
}
