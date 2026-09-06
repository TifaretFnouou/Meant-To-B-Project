import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Button,
  Box,
  Stack,
  Snackbar,
  Alert,
} from "@mui/material";
import WorkIcon from "@mui/icons-material/Work";
import TimerIcon from "@mui/icons-material/Timer";
import EventIcon from "@mui/icons-material/Event";
import { useLanguage } from "../../context/LanguageContext";
import { brand } from "../../theme/brand";
import UserAvatar from "../common/UserAvatar";
import BookMentorDialog from "../scheduling/BookMentorDialog";

export default function MentorCard({
  mentor,
  onExpressInterest,
  hasPendingRequest,
  canExpressInterest = true,
}) {
  const { t } = useLanguage();
  const profile = mentor.mentorProfile;
  const [bookOpen, setBookOpen] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: "", severity: "success" });

  const handleCloseFeedback = () => setFeedback((prev) => ({ ...prev, open: false }));

  const handleBooked = () => {
    setFeedback({
      open: true,
      message: t("mentors.bookingSuccess", {
        name: `${mentor.firstName} ${mentor.lastName}`,
      }),
      severity: "success",
    });
    onExpressInterest?.(mentor);
  };

  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <UserAvatar user={mentor} size={52} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={700}>
              {mentor.firstName} {mentor.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
              {mentor.jobTitle} · {mentor.company}
            </Typography>
          </Box>
        </Box>

        <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
          {profile?.bio}
        </Typography>

        <Stack direction="row" spacing={0.5} sx={{ mt: "auto", mb: 1, flexWrap: "wrap", gap: 0.5 }}>
          {profile?.topics?.map((topic) => (
            <Chip key={topic} label={topic} size="small" color="primary" variant="outlined" />
          ))}
        </Stack>

        <Stack direction="row" spacing={2} sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <WorkIcon fontSize="small" sx={{ color: brand.dustyRose }} />
            <Typography variant="caption">
              {mentor.yearsOfExperience} {t("mentors.yearsExp")}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <EventIcon fontSize="small" sx={{ color: brand.dustyRose }} />
            <Typography variant="caption">
              {t("mentors.maxMeetings", { count: profile?.maxMeetings })}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <TimerIcon fontSize="small" sx={{ color: brand.dustyRose }} />
            <Typography variant="caption">
              {t("mentors.meetingLength", { min: profile?.meetingLengthMinutes })}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.5} sx={{ mt: 1.5, flexWrap: "wrap", gap: 0.5 }}>
          {mentor.techStack?.map((tech) => (
            <Chip key={tech} label={tech} size="small" />
          ))}
        </Stack>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        {canExpressInterest ? (
          <Button
            fullWidth
            variant="contained"
            onClick={() => setBookOpen(true)}
            disabled={hasPendingRequest}
          >
            {hasPendingRequest ? t("mentors.requestPending") : t("mentors.bookMeeting")}
          </Button>
        ) : (
          <Button fullWidth variant="outlined" disabled>
            {t("mentors.browseOnly")}
          </Button>
        )}
      </CardActions>

      <BookMentorDialog
        open={bookOpen}
        mentor={mentor}
        onClose={() => setBookOpen(false)}
        onBooked={handleBooked}
      />

      <Snackbar
        open={feedback.open}
        autoHideDuration={5000}
        onClose={handleCloseFeedback}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseFeedback} severity={feedback.severity} sx={{ width: "100%" }}>
          {feedback.message}
        </Alert>
      </Snackbar>
    </Card>
  );
}
