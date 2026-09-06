import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
} from "@mui/material";
import { useLanguage } from "../../context/LanguageContext";
import MeetingsSchedulingPanel from "../scheduling/MeetingsSchedulingPanel";

/**
 * Compact meeting details + actions sheet.
 * Opened from the calendar or the Meetings list.
 */
export default function MeetingEventDialog({
  open,
  event,
  meeting,
  mentor,
  mentee,
  onClose,
}) {
  const { t } = useLanguage();

  const titleKey =
    event?.titleKey ||
    (meeting?.matchedSlot
      ? "calendar.eventBooked"
      : meeting?.proposedSlots?.length
        ? "calendar.eventProposed"
        : "calendar.eventDetails");

  return (
    <Dialog
      open={Boolean(open && (event || meeting))}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>{t(titleKey)}</DialogTitle>
      <DialogContent dividers sx={{ px: { xs: 1.5, sm: 2 }, py: 2 }}>
        {meeting ? (
          <MeetingsSchedulingPanel
            meeting={meeting}
            mentor={mentor}
            mentee={mentee}
            compact
            onDone={onClose}
          />
        ) : (
          <Alert severity="warning">
            <Typography variant="body2">{t("calendar.meetingNotFound")}</Typography>
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2.5, py: 1.5 }}>
        <Button onClick={onClose}>{t("common.close")}</Button>
      </DialogActions>
    </Dialog>
  );
}
