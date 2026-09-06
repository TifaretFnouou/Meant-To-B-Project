import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { useScheduling } from "../../context/SchedulingContext";
import { useLanguage } from "../../context/LanguageContext";

export default function FeedbackDialog({ open, meeting, onClose }) {
  const { currentUser } = useAuth();
  const { submitFeedback } = useScheduling();
  const { t } = useLanguage();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setRating(5);
    setComment("");
    setSubmitted(false);
    setSubmitting(false);
    setError("");
  }, [open, meeting?.id]);

  if (!meeting || !currentUser) return null;

  const role =
    String(currentUser.id) === String(meeting.mentorId) ? "mentor" : "mentee";

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await submitFeedback(meeting.id, role, {
        rating,
        comments: comment,
        comment,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || t("calendar.actionFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(5);
    setComment("");
    setSubmitted(false);
    setError("");
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("feedback.title")}</DialogTitle>
      <DialogContent>
        {submitted ? (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              {t("feedback.thanks")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {role === "mentor"
                ? t("feedback.thanksMentor")
                : t("feedback.thanksMentee")}
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body2" sx={{ mb: 1.5 }}>
              {t("feedback.subtitle")}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              {role === "mentor" ? t("feedback.sentToAdmin") : t("feedback.sentToMentor")}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              {t("feedback.rating")}
            </Typography>
            <ToggleButtonGroup
              exclusive
              value={rating}
              onChange={(_, v) => v && setRating(v)}
              sx={{ mb: 2, flexWrap: "wrap" }}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <ToggleButton key={n} value={n}>
                  {n} ★
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <TextField
              fullWidth
              multiline
              rows={4}
              label={t("feedback.comments")}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("feedback.commentsPlaceholder")}
            />
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        {!submitted ? (
          <>
            <Button onClick={handleClose} disabled={submitting}>
              {t("common.cancel")}
            </Button>
            <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <CircularProgress size={22} color="inherit" /> : t("feedback.submit")}
            </Button>
          </>
        ) : (
          <Button variant="contained" onClick={handleClose}>
            {t("common.close")}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
