import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Chip,
  Box,
  Link,
} from "@mui/material";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import { formatDateTime } from "../../utils/calendar";
import { useLanguage } from "../../context/LanguageContext";
import StatusBadge from "../common/StatusBadge";
import { UserIdentity } from "../common/UserAvatar";
import { SCHEDULING_STATE } from "../../constants";

export default function MeetingEventDialog({
  open,
  event,
  meeting,
  mentor,
  mentee,
  onClose,
  onCancel,
  onReschedule,
  onGoToMeeting,
}) {
  const { language, t } = useLanguage();
  const locale = language === "he" ? "he-IL" : "en-US";

  if (!event) return null;

  const isMatched =
    event.type === "matched" ||
    meeting?.schedulingState === SCHEDULING_STATE.MATCHED;
  const canCancel = Boolean(onCancel) && event.type !== "completed";
  const canReschedule = Boolean(onReschedule) && isMatched;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>
        {t(event.titleKey || "calendar.eventDetails")}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <StatusBadge
              status={meeting?.status || event.status}
              schedulingState={meeting?.schedulingState || event.schedulingState}
            />
            <Chip size="small" label={t(`calendar.type.${event.type}`)} />
          </Box>

          {event.type !== "pending" && (
            <Typography>
              <strong>{t("calendar.when")}:</strong> {formatDateTime(event.start, locale)}
            </Typography>
          )}

          <Box>
            <Typography variant="caption" color="text.secondary">
              {t("calendar.mentor")}
            </Typography>
            {mentor ? (
              <UserIdentity user={mentor} avatarSize={34} />
            ) : (
              <Typography>{event.mentorId}</Typography>
            )}
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {t("calendar.mentee")}
            </Typography>
            {mentee ? (
              <UserIdentity user={mentee} avatarSize={34} />
            ) : (
              <Typography>{event.menteeId}</Typography>
            )}
          </Box>

          {meeting?.durationMinutes && (
            <Typography>
              <strong>{t("calendar.duration")}:</strong> {meeting.durationMinutes}{" "}
              {t("calendar.minutes")}
            </Typography>
          )}

          {isMatched && meeting?.meetLink && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                {t("calendar.googleMeetTitle")}
              </Typography>
              <Link
                href={meeting.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
                sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, mt: 0.5 }}
              >
                <VideoCallIcon fontSize="small" />
                {t("calendar.joinGoogleMeet")}
              </Link>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1, flexWrap: "wrap" }}>
        <Button onClick={onClose}>{t("common.close")}</Button>
        {onGoToMeeting && (
          <Button variant="outlined" onClick={onGoToMeeting}>
            {t("calendar.openMeeting")}
          </Button>
        )}
        {canReschedule && (
          <Button color="warning" variant="outlined" onClick={onReschedule}>
            {t("calendar.reschedule")}
          </Button>
        )}
        {canCancel && (
          <Button color="error" variant="contained" onClick={onCancel}>
            {t("calendar.cancelMeeting")}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
