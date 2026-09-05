import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Link,
  Grid,
  Autocomplete,
  Chip,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Divider,
  MenuItem,
} from "@mui/material";
import PasswordRequirementsInfo from "../../components/common/PasswordRequirementsInfo";
import PasswordVisibilityToggle from "../../components/common/PasswordVisibilityToggle";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAdminConfig } from "../../context/AdminConfigContext";
import { useLanguage } from "../../context/LanguageContext";
import MainLayout from "../../components/layout/MainLayout";
import PasswordStrengthIndicator from "../../components/common/PasswordStrengthIndicator";
import { isPasswordStrong } from "../../utils/passwordStrength";
import UserAvatar from "../../components/common/UserAvatar";

export default function RegisterPage() {
  const { register } = useAuth();
  const { techStack } = useAdminConfig();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [error, setError] = useState("");
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    techStack: [],
    company: "",
    jobTitle: "",
    yearsOfExperience: 0,
    githubUrl: "",
    linkedinUrl: "",
    menteeGoals: "",
    phone: "", 
    isMentor: false,
    mentorBio: "",
    mentorTopics: "",
    maxMeetings: 1,
    meetingLength: 45,
  });

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePictureFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isPasswordStrong(form.password)) {
      setError(t("auth.weakPassword"));
      return;
    }

    const mentorProfileData = form.isMentor ? {
      bio: form.mentorBio,
      topics: form.mentorTopics.split(",").map(topic => topic.trim()).filter(Boolean),
      maxMeetings: Number(form.maxMeetings) || 0,
      meetingLengthMinutes: Number(form.meetingLength) || 45
    } : undefined;

    try {
      await register({
        ...form,
        yearsOfExperience: Number(form.yearsOfExperience) || 0,
        profilePictureFile,
        mentorProfile: mentorProfileData, 
      });
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <MainLayout>
      <Box sx={{ maxWidth: 720, mx: "auto", my: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography
            variant="h5"
            gutterBottom
            fontWeight={700}
            sx={{
              background: "linear-gradient(135deg, #D38A9B, #F5C2B4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {t("auth.registerTitle")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t("auth.registerSubtitle")}
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {/* Row 1: First & Last Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="First Name *"
                  value={form.firstName}
                  onChange={update("firstName")}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Last Name *"
                  value={form.lastName}
                  onChange={update("lastName")}
                />
              </Grid>

              {/* Row 2: Email (Full Width) */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Email *"
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                />
              </Grid>

              {/* Row 3: Password (with strength indicator) & Phone */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Password *"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={update("password")}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <PasswordVisibilityToggle
                          visible={showPassword}
                          onToggle={() => setShowPassword((prev) => !prev)}
                        />
                        <PasswordRequirementsInfo />
                      </InputAdornment>
                    ),
                  }}
                />
                <PasswordStrengthIndicator password={form.password} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  type="tel"
                  value={form.phone}
                  onChange={update("phone")}
                />
              </Grid>

              {/* Row 4: Company & Job Title */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company"
                  value={form.company}
                  onChange={update("company")}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Job Title"
                  value={form.jobTitle}
                  onChange={update("jobTitle")}
                />
              </Grid>

              {/* Row 5: Tech Stack & Experience */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={techStack}
                  value={form.techStack}
                  onChange={(_, val) =>
                    setForm((prev) => ({ ...prev, techStack: val }))
                  }
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip label={option} {...getTagProps({ index })} key={option} />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Technologies" />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Years of Experience"
                  value={form.yearsOfExperience}
                  onChange={update("yearsOfExperience")}
                  inputProps={{ min: 0 }}
                />
              </Grid>

              {/* Row 6: GitHub & LinkedIn */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="GitHub URL"
                  value={form.githubUrl}
                  onChange={update("githubUrl")}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="LinkedIn URL"
                  value={form.linkedinUrl}
                  onChange={update("linkedinUrl")}
                />
              </Grid>

              {/* Row 7: Mentee Goals (For all users) */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Mentee Goals"
                  placeholder="What would you like to achieve in the platform? What topics are you interested in?"
                  value={form.menteeGoals}
                  onChange={update("menteeGoals")}
                />
              </Grid>

              {/* --- MENTOR TOGGLE SECTION --- */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.isMentor}
                      onChange={update("isMentor")}
                      color="primary"
                    />
                  }
                  label="I am also interested in becoming a mentor in the community"
                />
              </Grid>

              {/* --- MENTOR EXTRA FIELDS (Conditional) --- */}
              {form.isMentor && (
                <Grid item xs={12}>
                  <Box 
                    sx={{ 
                      p: 3, 
                      bgcolor: "background.default", 
                      borderRadius: 2, 
                      border: "1px solid", 
                      borderColor: "divider" 
                    }}
                  >
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Mentor Profile Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Bio"
                          placeholder="Tell us a bit about your background and how you can help..."
                          value={form.mentorBio}
                          onChange={update("mentorBio")}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Consulting Topics"
                          placeholder="e.g., React, Career Advice, Mock Interviews (comma separated)"
                          value={form.mentorTopics}
                          onChange={update("mentorTopics")}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Max Meetings (per month)"
                          value={form.maxMeetings}
                          onChange={update("maxMeetings")}
                          inputProps={{ min: 1, max: 10 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          select
                          label="Meeting Length"
                          value={form.meetingLength}
                          onChange={update("meetingLength")}
                        >
                          <MenuItem value={45}>45 Minutes</MenuItem>
                          <MenuItem value={60}>60 Minutes</MenuItem>
                          <MenuItem value={90}>90 Minutes</MenuItem>
                        </TextField>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              )}

              {/* Profile Picture */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 3,
                  }}
                >
                  <UserAvatar user={form} src={previewUrl || undefined} size={80} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Button variant="outlined" component="label">
                      Upload Profile Picture
                      <input hidden accept="image/*" type="file" onChange={handleFileChange} />
                    </Button>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }}>
                      {profilePictureFile
                        ? profilePictureFile.name
                        : "No profile picture selected - initials will be displayed"}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {}
            {error && (
              <Alert severity="error" sx={{ mt: 3, mb: 1 }}>
                {error}
              </Alert>
            )}

            <Button type="submit" fullWidth variant="contained" sx={{ mt: error ? 1 : 4, py: 1.4 }}>
              {t("auth.registerBtn")}
            </Button>
          </Box>

          <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>
            {t("auth.hasAccount")}{" "}
            <Link component="button" variant="body2" onClick={() => navigate("/login")}>
              {t("auth.loginLink")}
            </Link>
          </Typography>
        </Paper>
      </Box>
    </MainLayout>
  );
}