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
      <DialogTitle>Confirm attendance for the meeting</DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          Did the meeting scheduled for
          {meeting.matchedSlot
            ? new Date(meeting.matchedSlot).toLocaleString("he-IL")
            : "-"}{" "}
          happen?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button color="error" onClick={() => handleAnswer(false)}>
          No
        </Button>
        <Button variant="contained" onClick={() => handleAnswer(true)}>
          Yes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
