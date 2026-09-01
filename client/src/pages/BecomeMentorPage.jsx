import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Autocomplete,
  Chip,
  MenuItem,
  Alert,
} from "@mui/material";
import { useNavigate, Navigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import { useAuth } from "../context/AuthContext";
import { useRoleMode } from "../context/RoleModeContext";
import { useAdminConfig } from "../context/AdminConfigContext";
import { useLanguage } from "../context/LanguageContext";
import { ROLES, SESSION_LENGTHS, USER_MODES } from "../constants";

export default function BecomeMentorPage() {
  const { currentUser, updateProfile, isMentor, isAdmin } = useAuth();
  const { isMentorMode, setMode } = useRoleMode();
  const { adviceTopics } = useAdminConfig();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const existing = currentUser?.mentorProfile;

  const [form, setForm] = useState({
    bio: existing?.bio || "",
    topics: existing?.topics || [],
    maxSessions: existing?.maxSessions || 2,
    sessionLengthMinutes: existing?.sessionLengthMinutes || 60,
  });

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (isMentorMode && !isMentor) {
    return <Navigate to="/sessions" replace />;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const isNewMentor = !currentUser.roles.includes(ROLES.MENTOR);
    const roles = isNewMentor
      ? [...currentUser.roles, ROLES.MENTOR]
      : currentUser.roles;

    updateProfile({
      roles,
      mentorProfile: {
        isActive: true,
        ...form,
        maxSessions: Number(form.maxSessions),
        sessionLengthMinutes: Number(form.sessionLengthMinutes),
      },
    });

    if (isNewMentor) {
      setMode(USER_MODES.MENTOR);
      navigate("/sessions");
      return;
    }

    navigate(isMentorMode ? "/sessions" : "/mentors");
  };

  return (
    <MainLayout>
      <Paper sx={{ p: 4, maxWidth: 640, mx: "auto" }}>
        <Typography variant="h5" gutterBottom fontWeight={600}>
          {existing ? "עריכת פרופיל מנטורית" : "הצטרפות כמנטורית"}
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          מלאי את פרטי המנטורינג שלך — הן יוצגו בקטלוג המנטוריות
        </Alert>

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                required
                label="רקע מקצועי"
                value={form.bio}
                onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                freeSolo
                options={adviceTopics}
                value={form.topics}
                onChange={(_, v) => setForm((p) => ({ ...p, topics: v }))}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={option} {...getTagProps({ index })} key={option} />
                  ))
                }
                renderInput={(params) => (
                  <TextField {...params} required label="תחומי ייעוץ" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                required
                label="מכסת פגישות"
                value={form.maxSessions}
                onChange={(e) => setForm((p) => ({ ...p, maxSessions: e.target.value }))}
                inputProps={{ min: 1, max: 10 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                required
                label="אורך פגישה (דקות)"
                value={form.sessionLengthMinutes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, sessionLengthMinutes: e.target.value }))
                }
              >
                {SESSION_LENGTHS.map((len) => (
                  <MenuItem key={len} value={len}>
                    {len} דקות
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
          <Button type="submit" variant="contained" sx={{ mt: 3 }}>
            שמירה
          </Button>
        </Box>
      </Paper>
    </MainLayout>
  );
}
