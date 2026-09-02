import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { useScheduling } from "../../context/SchedulingContext";

export default function AttendanceDialog({ open, session, onClose }) {
  const { currentUser } = useAuth();
  const { submitAttendance } = useScheduling();

  if (!session) return null;

  const role = currentUser.id === session.mentorId ? "mentor" : "mentee";

  const handleAnswer = (attended) => {
    submitAttendance(session.id, role, attended);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>אישור הגעה לפגישה</DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          האם הפגישה שהייתה מתוכננת ל-
          {session.matchedSlot
            ? new Date(session.matchedSlot).toLocaleString("he-IL")
            : "—"}{" "}
          התקיימה?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button color="error" onClick={() => handleAnswer(false)}>
          לא
        </Button>
        <Button variant="contained" onClick={() => handleAnswer(true)}>
          כן
        </Button>
      </DialogActions>
    </Dialog>
  );
}
