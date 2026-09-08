import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
} from "@mui/material";
import StatusBadge from "../../components/common/StatusBadge";
import { UserIdentity } from "../../components/common/UserAvatar";

// Shared dialog for viewing full meeting details and feedback
export default function AdminMeetingDialog({ open, meeting, onClose }) {
  if (!meeting) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 700 }}>Meeting Details</DialogTitle>
      <DialogContent dividers>
        <Box>
          <Typography variant="h6" gutterBottom>Participants</Typography>
          <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Mentor</Typography>
              <UserIdentity user={meeting.mentorId} />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Mentee</Typography>
              <UserIdentity user={meeting.menteeId} />
            </Box>
          </Box>
          
          <Typography variant="h6" gutterBottom>Timing & Status</Typography>
          <Typography>Status: <StatusBadge status={meeting.status} /></Typography>
          <Typography>
            Time: {meeting.scheduledTime?.startTime 
              ? new Date(meeting.scheduledTime.startTime).toLocaleString("en-US") 
              : "Pending selection"}
          </Typography>
          
          <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>Feedback</Typography>
          <Paper sx={{ p: 2, bgcolor: "#f5f5f5" }}>
            <Typography variant="subtitle2">Mentee Feedback:</Typography>
            <Typography mb={2}>
              {meeting.menteeFeedback?.isFilled 
                ? `${meeting.menteeFeedback.rating}/5 - ${meeting.menteeFeedback.comments}` 
                : "Not filled yet"}
            </Typography>
            <Typography variant="subtitle2">Mentor Feedback:</Typography>
            <Typography>
              {meeting.mentorFeedback?.isFilled 
                ? `${meeting.mentorFeedback.rating}/5 - ${meeting.mentorFeedback.comments}` 
                : "Not filled yet"}
            </Typography>
          </Paper>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
