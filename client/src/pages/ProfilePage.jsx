import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Autocomplete,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  MenuItem,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useAdminConfig } from "../context/AdminConfigContext";
import MainLayout from "../components/layout/MainLayout";
import UserAvatar from "../components/common/UserAvatar";
import { ROLES, SESSION_LENGTHS } from "../constants";

function createForm(user) {
  return {
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    company: user?.company || "",
    jobTitle: user?.jobTitle || "",
    techStack: user?.techStack || [],
    yearsOfExperience: user?.yearsOfExperience || 0,
    githubUrl: user?.githubUrl || "",
    linkedinUrl: user?.linkedinUrl || "",
    profilePicture: user?.profilePicture || "",
    mentorProfile: {
      isActive: user?.mentorProfile?.isActive !== false,
      bio: user?.mentorProfile?.bio || "",
      topics: user?.mentorProfile?.topics || [],
      maxSessions: user?.mentorProfile?.maxSessions || 2,
      sessionLengthMinutes: user?.mentorProfile?.sessionLengthMinutes || 60,
    },
    menteeProfile: {
      isActive: user?.menteeProfile?.isActive !== false,
      MenteeGoals: user?.menteeProfile?.MenteeGoals || "",
    },
  };
}

export default function ProfilePage() {
  const { currentUser, updateProfile } = useAuth();
  const { techStack, adviceTopics } = useAdminConfig();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [topicsError, setTopicsError] = useState("");
  const [loading, setLoading] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [form, setForm] = useState(() => createForm(currentUser));
  const roles = currentUser?.roles || [];
  const isMentor = roles.includes(ROLES.MENTOR);
  const isMentee = roles.includes(ROLES.MENTEE);

  useEffect(() => {
    setForm(createForm(currentUser));
    setProfilePictureFile(null);
    setPreviewUrl("");
  }, [currentUser]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePictureFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaved(false);

    if (isMentor && form.mentorProfile.topics.length === 0) {
      setTopicsError("Please select at least one area of expertise");
      return;
    }

    setTopicsError("");
    setLoading(true);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        company: form.company,
        jobTitle: form.jobTitle,
        techStack: form.techStack,
        yearsOfExperience: Number(form.yearsOfExperience) || 0,
        githubUrl: form.githubUrl,
        linkedinUrl: form.linkedinUrl,
        profilePictureFile,
      };

      if (isMentor) {
        payload.mentorProfile = {
          ...currentUser.mentorProfile,
          ...form.mentorProfile,
          maxSessions: Number(form.mentorProfile.maxSessions),
          sessionLengthMinutes: Number(form.mentorProfile.sessionLengthMinutes),
        };
      }

      if (isMentee) {
        payload.menteeProfile = {
          ...currentUser.menteeProfile,
          ...form.menteeProfile,
        };
      }

      await updateProfile(payload);
      setProfilePictureFile(null);
      setPreviewUrl("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const avatarSrc = previewUrl || form.profilePicture || undefined;
  return (
    <MainLayout>
      <Paper sx={{ p: { xs: 2, sm: 4 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <UserAvatar user={form} src={avatarSrc} size={72} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={600}>
              הפרופיל שלי
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
              {form.email} 
            </Typography>
          </Box>
        </Box>

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
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="שם פרטי" value={form.firstName || ""} onChange={update("firstName")} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="שם משפחה" value={form.lastName || ""} onChange={update("lastName")} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth disabled label="Email" value={form.email} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="טלפון" value={form.phone} onChange={update("phone")} />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                freeSolo
                options={techStack}
                value={form.techStack || []}
                onChange={(_, val) => setForm((prev) => ({ ...prev, techStack: val }))}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={option} {...getTagProps({ index })} key={option} />
                  ))
                }
                renderInput={(params) => (
                  <TextField {...params} label="סטאק טכנולוגי" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="מקום עבודה" value={form.company || ""} onChange={update("company")} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="משרה" value={form.jobTitle || ""} onChange={update("jobTitle")} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="שנות ניסיון"
                value={form.yearsOfExperience || 0}
                onChange={update("yearsOfExperience")}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button variant="outlined" component="label" fullWidth sx={{ height: 56 }}>
                העלאת תמונה
                <input hidden accept="image/*" type="file" onChange={handleFileChange} />
              </Button>
              {profilePictureFile && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }}>
                  {profilePictureFile.name}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="GitHub" value={form.githubUrl || ""} onChange={update("githubUrl")} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="LinkedIn" value={form.linkedinUrl || ""} onChange={update("linkedinUrl")} />
            </Grid>

            {isMentee && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="h6">פרטי חניכה</Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="מטרות למידה"
                    value={form.menteeProfile.MenteeGoals}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        menteeProfile: {
                          ...prev.menteeProfile,
                          MenteeGoals: e.target.value,
                        },
                      }))
                    }
                  />
                </Grid>
              </>
            )}

            {isMentor && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="h6">פרטי מנטורינג</Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    required
                    label="רקע מקצועי"
                    value={form.mentorProfile.bio}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        mentorProfile: {
                          ...prev.mentorProfile,
                          bio: e.target.value,
                        },
                      }))
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={adviceTopics}
                    value={form.mentorProfile.topics}
                    onChange={(_, value) => {
                      setForm((prev) => ({
                        ...prev,
                        mentorProfile: {
                          ...prev.mentorProfile,
                          topics: value,
                        },
                      }));
                      if (value.length > 0) setTopicsError("");
                    }}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip label={option} {...getTagProps({ index })} key={option} />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="תחומי ייעוץ *"
                        error={Boolean(topicsError)}
                        helperText={topicsError}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    type="number"
                    label="מכסת פגישות"
                    value={form.mentorProfile.maxSessions}
                    inputProps={{ min: 1, max: 10 }}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        mentorProfile: {
                          ...prev.mentorProfile,
                          maxSessions: e.target.value,
                        },
                      }))
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    required
                    label="אורך פגישה (דקות)"
                    value={form.mentorProfile.sessionLengthMinutes}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        mentorProfile: {
                          ...prev.mentorProfile,
                          sessionLengthMinutes: e.target.value,
                        },
                      }))
                    }
                  >
                    {SESSION_LENGTHS.map((length) => (
                      <MenuItem key={length} value={length}>
                        {length} דקות
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </>
            )}
          </Grid>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
            sx={{ mt: 3 }}
          >
            {loading ? "Saving..." : "שמירת שינויים"}
          </Button>
        </Box>
      </Paper>
    </MainLayout>
  );
}
