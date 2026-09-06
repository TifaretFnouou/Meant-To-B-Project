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

export default function AttendanceDialog({ open, meeting, onClose }) {
  const { currentUser } = useAuth();
  const { submitAttendance } = useScheduling();

  if (!meeting) return null;

  const role = currentUser.id === meeting.mentorId ? "mentor" : "mentee";

  const handleAnswer = (attended) => {
    submitAttendance(meeting.id, role, attended);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>אישור הגעה לפגישה</DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          האם הפגישה שהייתה מתוכננת ל-
          {meeting.matchedSlot
            ? new Date(meeting.matchedSlot).toLocaleString("he-IL")
            : "-"}{" "}
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
