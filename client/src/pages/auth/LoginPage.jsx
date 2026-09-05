import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Link,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import PasswordRequirementsInfo from "../../components/common/PasswordRequirementsInfo";
import PasswordVisibilityToggle from "../../components/common/PasswordVisibilityToggle";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import MainLayout from "../../components/layout/MainLayout";

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.roles.includes("admin") ? "/admin" : from);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <Box sx={{ maxWidth: 440, mx: "auto" }}>
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
            {t("auth.loginTitle")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t("auth.loginSubtitle")}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label={t("auth.email")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label={t("auth.password")}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
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
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 2, py: 1.4 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : t("auth.loginBtn")}
            </Button>
          </Box>

          <Typography variant="body2" sx={{ mt: 2 }}>
            {t("auth.noAccount")}{" "}
            <Link component="button" variant="body2" onClick={() => navigate("/register")}>
              {t("auth.registerLink")}
            </Link>
          </Typography>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="caption" fontWeight={600} display="block" gutterBottom>
              {t("auth.demoAccounts")}:
            </Typography>
            <Typography variant="caption" display="block">admin@queenb.com / Admin123!</Typography>
            <Typography variant="caption" display="block">mentor@queenb.com / Mentor123!</Typography>
            <Typography variant="caption" display="block">mentee@queenb.com / Mentee123!</Typography>
            <Typography variant="caption" display="block">dual@queenb.com / Dual123! (Mentor + Mentee)</Typography>
          </Alert>
        </Paper>
      </Box>
    </MainLayout>
  );
}
