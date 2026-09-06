import React, { useCallback, useEffect, useState } from "react";
import { Snackbar, Alert, Button } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { useScheduling } from "../../context/SchedulingContext";
import { useLanguage } from "../../context/LanguageContext";
import FeedbackDialog from "./FeedbackDialog";

const DISMISS_KEY = "queenb_feedback_dismissed_v1";

function loadDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDismissed(map) {
  try {
    localStorage.setItem(DISMISS_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function meetingHasEnded(meeting) {
  if (!meeting?.matchedSlot) return false;
  const start = new Date(meeting.matchedSlot).getTime();
  if (Number.isNaN(start)) return false;
  const end = start + (meeting.durationMinutes || 60) * 60000;
  return Date.now() >= end;
}

function userNeedsFeedback(meeting, userId) {
  if (!meeting || !userId) return false;
  if (["cancelled"].includes(String(meeting.status || "").toLowerCase())) return false;
  if (meeting.schedulingState === "cancelled") return false;
  if (!meetingHasEnded(meeting)) return false;

  const role =
    String(userId) === String(meeting.mentorId)
      ? "mentor"
      : String(userId) === String(meeting.menteeId)
        ? "mentee"
        : null;
  if (!role) return false;
  return !meeting.feedback?.[role]?.isFilled;
}

/**
 * After a meeting ends, open feedback for mentor and mentee.
 * Mentee feedback → mentor notification; mentor feedback → admin notification.
 */
export default function FeedbackReminder() {
  const { currentUser } = useAuth();
  const { Meetings, getMeetingsForUser, refreshMeetings } = useScheduling();
  const { t } = useLanguage();
  const [snackOpen, setSnackOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [meeting, setMeeting] = useState(null);

  const findPending = useCallback(() => {
    if (!currentUser) return null;
    const list = getMeetingsForUser(currentUser.id) || Meetings || [];
    const dismissed = loadDismissed();
    return (
      list.find((s) => {
        if (!userNeedsFeedback(s, currentUser.id)) return false;
        const key = `${currentUser.id}:${s.id}`;
        return !dismissed[key];
      }) || null
    );
  }, [currentUser, getMeetingsForUser, Meetings]);

  useEffect(() => {
    if (!currentUser) return undefined;

    const tick = () => {
      const pending = findPending();
      if (pending) {
        setMeeting(pending);
        setDialogOpen(true);
        setSnackOpen(false);
      }
    };

    tick();
    const id = setInterval(tick, 20000);
    return () => clearInterval(id);
  }, [currentUser, findPending, Meetings]);

  useEffect(() => {
    if (!currentUser) return undefined;
    const id = setInterval(() => {
      refreshMeetings?.();
    }, 60000);
    return () => clearInterval(id);
  }, [currentUser, refreshMeetings]);

  if (!currentUser) return null;

  const dismissForNow = () => {
    if (meeting && currentUser) {
      const map = loadDismissed();
      map[`${currentUser.id}:${meeting.id}`] = Date.now();
      saveDismissed(map);
    }
    setSnackOpen(false);
    setDialogOpen(false);
  };

  return (
    <>
      <Snackbar
        open={snackOpen && !dialogOpen}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="info"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                setSnackOpen(false);
                setDialogOpen(true);
              }}
            >
              {t("Meetings.fillFeedback")}
            </Button>
          }
        >
          {t("notif.feedbackReminder")}
        </Alert>
      </Snackbar>

      <FeedbackDialog
        open={dialogOpen && Boolean(meeting)}
        meeting={meeting}
        onClose={() => {
          dismissForNow();
          const next = findPending();
          if (next && String(next.id) !== String(meeting?.id)) {
            setTimeout(() => {
              setMeeting(next);
              setDialogOpen(true);
            }, 400);
          }
        }}
      />
    </>
  );
}
