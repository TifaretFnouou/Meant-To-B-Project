// import React, { useEffect, useState } from "react";
// import {
//   Box,
//   Paper,
//   Typography,
//   TextField,
//   Button,
//   Alert,
//   Link,
//   Grid,
//   Autocomplete,
//   Chip,
//   InputAdornment,
// } from "@mui/material";
// import PasswordRequirementsInfo from "../../components/common/PasswordRequirementsInfo";
// import PasswordVisibilityToggle from "../../components/common/PasswordVisibilityToggle";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../../context/AuthContext";
// import { useAdminConfig } from "../../context/AdminConfigContext";
// import { useLanguage } from "../../context/LanguageContext";
// import MainLayout from "../../components/layout/MainLayout";
// import PasswordStrengthIndicator from "../../components/common/PasswordStrengthIndicator";
// import { isPasswordStrong } from "../../utils/passwordStrength";
// import UserAvatar from "../../components/common/UserAvatar";

// export default function RegisterPage() {
//   const { register } = useAuth();
//   const { techStack } = useAdminConfig();
//   const { t } = useLanguage();
//   const navigate = useNavigate();
//   const [error, setError] = useState("");
//   const [profilePictureFile, setProfilePictureFile] = useState(null);
//   const [previewUrl, setPreviewUrl] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [form, setForm] = useState({
//     email: "",
//     password: "",
//     firstName: "",
//     lastName: "",
//     techStack: [],
//     company: "",
//     jobTitle: "",
//     yearsOfExperience: 0,
//     githubUrl: "",
//     linkedinUrl: "",
//     menteeGoals: "",
//   });

//   const update = (field) => (e) =>
//     setForm((prev) => ({ ...prev, [field]: e.target.value }));

//   const handleFileChange = (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     setProfilePictureFile(file);
//     setPreviewUrl(URL.createObjectURL(file));
//   };

//   useEffect(() => {
//     return () => {
//       if (previewUrl) URL.revokeObjectURL(previewUrl);
//     };
//   }, [previewUrl]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     if (!isPasswordStrong(form.password)) {
//       setError(t("auth.weakPassword"));
//       return;
//     }

//     try {
//       await register({
//         ...form,
//         yearsOfExperience: Number(form.yearsOfExperience) || 0,
//         profilePictureFile,
//       });
//       navigate("/profile");
//     } catch (err) {
//       setError(err.message);
//     }
//   };

//   return (
//     <MainLayout>
//       <Box sx={{ maxWidth: 720, mx: "auto" }}>
//         <Paper sx={{ p: 4 }}>
//           <Typography variant="h5" gutterBottom fontWeight={700}
//             sx={{ background: "linear-gradient(135deg, #D38A9B, #F5C2B4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
//             {t("auth.registerTitle")}
//           </Typography>
//           <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
//             {t("auth.registerSubtitle")}
//           </Typography>

//           {error && (
//             <Alert severity="error" sx={{ mb: 2 }}>
//               {error}
//             </Alert>
//           )}

//           <Box component="form" onSubmit={handleSubmit}>
//             <Grid container spacing={2}>
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   required
//                   label="Email *"
//                   type="email"
//                   value={form.email}
//                   onChange={update("email")}
//                 />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   required
//                   label="First Name *"
//                   value={form.firstName}
//                   onChange={update("firstName")}
//                 />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   required
//                   label="Last Name *"
//                   value={form.lastName}
//                   onChange={update("lastName")}
//                 />
//               </Grid>
//               <Grid item xs={12}>
//                 <TextField
//                   fullWidth
//                   required
//                   label="Password *"
//                   type={showPassword ? "text" : "password"}
//                   value={form.password}
//                   onChange={update("password")}
//                   InputProps={{
//                     endAdornment: (
//                       <InputAdornment position="end">
//                         <PasswordVisibilityToggle
//                           visible={showPassword}
//                           onToggle={() => setShowPassword((prev) => !prev)}
//                         />
//                         <PasswordRequirementsInfo />
//                       </InputAdornment>
//                     ),
//                   }}
//                 />
//                 <PasswordStrengthIndicator password={form.password} />
//               </Grid>

//               <Grid item xs={12}>
//                 <Autocomplete
//                   multiple
//                   freeSolo
//                   options={techStack}
//                   value={form.techStack}
//                   onChange={(_, val) =>
//                     setForm((prev) => ({ ...prev, techStack: val }))
//                   }
//                   renderTags={(value, getTagProps) =>
//                     value.map((option, index) => (
//                       <Chip label={option} {...getTagProps({ index })} key={option} />
//                     ))
//                   }
//                   renderInput={(params) => (
//                     <TextField {...params} label="Technologies" />
//                   )}
//                 />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   label="Company"
//                   value={form.company}
//                   onChange={update("company")}
//                 />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   label="Job Title"
//                   value={form.jobTitle}
//                   onChange={update("jobTitle")}
//                 />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   type="number"
//                   label="Years of Experience"
//                   value={form.yearsOfExperience}
//                   onChange={update("yearsOfExperience")}
//                   inputProps={{ min: 0 }}
//                 />
//               </Grid>
//               <Grid item xs={12}>
//                 <Box
//                   sx={{
//                     display: "flex",
//                     alignItems: "center",
//                     gap: 2,
//                     p: 2,
//                     border: "1px solid",
//                     borderColor: "divider",
//                     borderRadius: 3,
//                   }}
//                 >
//                   <UserAvatar user={form} src={previewUrl || undefined} size={80} />
//                   <Box sx={{ flex: 1, minWidth: 0 }}>
//                     <Button variant="outlined" component="label">
//                       Upload Profile Picture
//                       <input hidden accept="image/*" type="file" onChange={handleFileChange} />
//                     </Button>
//                     <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }}>
//                       {profilePictureFile
//                         ? profilePictureFile.name
//                         : "No profile picture selected — initials will be displayed"}
//                     </Typography>
//                   </Box>
//                 </Box>
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   label="GitHub URL *"
//                   value={form.githubUrl}
//                   onChange={update("githubUrl")}
//                 />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   label="LinkedIn URL *"
//                   value={form.linkedinUrl}
//                   onChange={update("linkedinUrl")}
//                 />
//               </Grid>
//             </Grid>

//             <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, py: 1.4 }}>
//               {t("auth.registerBtn")}
//             </Button>
//           </Box>

//           <Typography variant="body2" sx={{ mt: 2 }}>
//             {t("auth.hasAccount")}{" "}
//             <Link component="button" variant="body2" onClick={() => navigate("/login")}>
//               {t("auth.loginLink")}
//             </Link>
//           </Typography>
//         </Paper>
//       </Box>
//     </MainLayout>
//   );
// }



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
  });

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

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

    try {
      await register({
        ...form,
        yearsOfExperience: Number(form.yearsOfExperience) || 0,
        profilePictureFile,
      });
      navigate("/profile");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <MainLayout>
      <Box sx={{ maxWidth: 720, mx: "auto" }}>
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

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {/* שורה 1: שם פרטי + שם משפחה (חובה) */}
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

              {/* שורה 2: אימייל + סיסמה (חובה) */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Email *"
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                />
              </Grid>
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

              {/* שורה 3: חברה + שם משרה (רשות) */}
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

              {/* שורה 4: טכנולוגיות + שנות ניסיון (רשות) */}
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

              {/* שורה 5: לינקים לגיט + לינקדין (רשות) */}
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

              {/* תמונת פרופיל (שורה נפרדת בתחתית) */}
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
                        : "No profile picture selected — initials will be displayed"}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, py: 1.4 }}>
              {t("auth.registerBtn")}
            </Button>
          </Box>

          <Typography variant="body2" sx={{ mt: 2 }}>
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