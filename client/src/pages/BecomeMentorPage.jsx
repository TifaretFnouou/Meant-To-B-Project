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
  CircularProgress,
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
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [topicsError, setTopicsError] = useState("");

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaved(false);

    if (form.topics.length === 0) {
      setTopicsError("Please select at least one area of expertise");
      return;
    }

    setTopicsError("");
    setLoading(true);
    const isNewMentor = !currentUser.roles.includes(ROLES.MENTOR);
    const roles = isNewMentor
      ? [...currentUser.roles, ROLES.MENTOR]
      : currentUser.roles;

    try {
      await updateProfile({
        roles,
        mentorProfile: {
          ...currentUser.mentorProfile,
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

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <Paper sx={{ p: 4, maxWidth: 640, mx: "auto" }}>
        <Typography variant="h5" gutterBottom fontWeight={600}>
          {existing ? "עריכת פרופיל מנטורית" : "הצטרפות כמנטורית"}
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
            Fill out your mentoring details — they will be displayed in the mentor catalog
        </Alert>
        {saved && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Profile updated successfully
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                required
                label="Professional Background"
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
                onChange={(_, v) => {
                  setForm((p) => ({ ...p, topics: v }));
                  if (v.length > 0) setTopicsError("");
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={option} {...getTagProps({ index })} key={option} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Advice Topics *"
                    error={Boolean(topicsError)}
                    helperText={topicsError}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                required
                label="Max Sessions"
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
                label="Session Length (minutes)"
                value={form.sessionLengthMinutes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, sessionLengthMinutes: e.target.value }))
                }
              >
                {SESSION_LENGTHS.map((len) => (
                  <MenuItem key={len} value={len}>
                    {len} minutes
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
            sx={{ mt: 3 }}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </Box>
      </Paper>
    </MainLayout>
  );
}
