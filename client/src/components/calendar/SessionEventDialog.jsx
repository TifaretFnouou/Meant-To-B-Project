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
} from "@mui/material";
import { formatDateTime } from "../../utils/calendar";
import { useLanguage } from "../../context/LanguageContext";
import StatusBadge from "../common/StatusBadge";
import { UserIdentity } from "../common/UserAvatar";

export default function SessionEventDialog({
  open,
  event,
  session,
  mentor,
  mentee,
  onClose,
  onCancel,
  onReschedule,
  onGoToSession,
}) {
  const { language, t } = useLanguage();
  const locale = language === "he" ? "he-IL" : "en-US";

  if (!event) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>{t(event.titleKey || "calendar.eventDetails")}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <StatusBadge status={session?.status || event.status} schedulingState={session?.schedulingState || event.schedulingState} />
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

          {session?.durationMinutes && (
            <Typography>
              <strong>{t("calendar.duration")}:</strong> {session.durationMinutes} {t("calendar.minutes")}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1, flexWrap: "wrap" }}>
        <Button onClick={onClose}>{t("common.cancel")}</Button>
        {onGoToSession && (
          <Button variant="outlined" onClick={onGoToSession}>
            {t("calendar.openSession")}
          </Button>
        )}
        {onReschedule && event.type === "matched" && (
          <Button color="warning" variant="outlined" onClick={onReschedule}>
            {t("calendar.reschedule")}
          </Button>
        )}
        {onCancel && event.type !== "completed" && (
          <Button color="error" variant="contained" onClick={onCancel}>
            {t("calendar.cancelSession")}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
