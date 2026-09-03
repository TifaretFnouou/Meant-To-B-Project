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
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useAdminConfig } from "../context/AdminConfigContext";
import MainLayout from "../components/layout/MainLayout";
import UserAvatar from "../components/common/UserAvatar";

export default function ProfilePage() {
  const { currentUser, updateProfile } = useAuth();
  const { techStack } = useAdminConfig();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [form, setForm] = useState({ ...currentUser });

  useEffect(() => {
    setForm({ ...currentUser });
    setProfilePictureFile(null);
    setPreviewUrl("");
  }, [currentUser]);

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
    try {
      await updateProfile({
        ...form,
        yearsOfExperience: Number(form.yearsOfExperience) || 0,
        profilePictureFile,
      });
      setProfilePictureFile(null);
      setPreviewUrl("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
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
            הפרופיל עודכן בהצלחה
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
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="קישור לתמונה"
                value={
                  profilePictureFile
                    ? ""
                    : form.profilePicture?.startsWith("data:")
                      ? ""
                      : form.profilePicture || ""
                }
                onChange={(e) => {
                  setProfilePictureFile(null);
                  setPreviewUrl("");
                  update("profilePicture")(e);
                }}
                helperText={
                  profilePictureFile ? `נבחר קובץ: ${profilePictureFile.name}` : ""
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="GitHub" value={form.githubUrl || ""} onChange={update("githubUrl")} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="LinkedIn" value={form.linkedinUrl || ""} onChange={update("linkedinUrl")} />
            </Grid>
            {form.menteeProfile && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="מטרות למידה"
                  value={form.menteeProfile.MenteeGoals || ""}
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
            )}
          </Grid>
          <Button type="submit" variant="contained" sx={{ mt: 3 }}>
            שמירת שינויים
          </Button>
        </Box>
      </Paper>
    </MainLayout>
  );
}
