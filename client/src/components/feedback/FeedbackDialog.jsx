import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { useScheduling } from "../../context/SchedulingContext";

export default function FeedbackDialog({ open, session, onClose }) {
  const { currentUser } = useAuth();
  const { submitFeedback } = useScheduling();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!session) return null;

  const role = currentUser.id === session.mentorId ? "mentor" : "mentee";

  const handleSubmit = () => {
    submitFeedback(session.id, role, { rating, comment, submittedAt: new Date().toISOString() });
    setSubmitted(true);
  };

  const handleClose = () => {
    setRating(5);
    setComment("");
    setSubmitted(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>משוב על הפגישה</DialogTitle>
      <DialogContent>
        {submitted ? (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              תודה על המשוב!
            </Typography>
            {role === "mentor" && (
              <Typography variant="body2" color="text.secondary">
                תודה על תרומתך לקהילה — המנטורינג שלך משנה חיים 💜
              </Typography>
            )}
          </Box>
        ) : (
          <>
            <Typography variant="body2" sx={{ mb: 2 }}>
              דרגי את הפגישה והוסיפי הערות
            </Typography>
            <ToggleButtonGroup
              exclusive
              value={rating}
              onChange={(_, v) => v && setRating(v)}
              sx={{ mb: 2 }}
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
              label="הערות"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        {!submitted ? (
          <>
            <Button onClick={handleClose}>ביטול</Button>
            <Button variant="contained" onClick={handleSubmit}>
              שליחה
            </Button>
          </>
        ) : (
          <Button variant="contained" onClick={handleClose}>
            סגירה
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
