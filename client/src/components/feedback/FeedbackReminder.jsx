import React, { useEffect, useState } from "react";
import { Snackbar, Alert, Button } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { useScheduling } from "../../context/SchedulingContext";
import { SCHEDULING_STATE } from "../../constants";
import { useLanguage } from "../../context/LanguageContext";
import FeedbackDialog from "./FeedbackDialog";

export default function FeedbackReminder() {
  const { currentUser } = useAuth();
  const { getSessionsForUser } = useScheduling();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const pending = getSessionsForUser(currentUser.id).find((s) => {
      const role = currentUser.id === s.mentorId ? "mentor" : "mentee";
      return (
        s.schedulingState === SCHEDULING_STATE.COMPLETED && !s.feedback?.[role]
      );
    });

    if (pending) {
      setSession(pending);
      setOpen(true);
    }
  }, [currentUser, getSessionsForUser]);

  if (!currentUser) return null;

  return (
    <>
      <Snackbar
        open={open}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="info"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                setOpen(false);
                setDialogOpen(true);
              }}
            >
              {t("sessions.fillFeedback")}
            </Button>
          }
        >
          {t("notif.feedbackReminder")}
        </Alert>
      </Snackbar>
      <FeedbackDialog
        open={dialogOpen}
        session={session}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}
