import React, { useMemo, useState } from "react";
import {
  Typography,
  Tabs,
  Tab,
  Box,
  Alert,
} from "@mui/material";
import { Navigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import PageHeader from "../components/common/PageHeader";
import SessionSchedulingPanel from "../components/scheduling/SessionSchedulingPanel";
import FeedbackDialog from "../components/feedback/FeedbackDialog";
import AttendanceDialog from "../components/feedback/AttendanceDialog";
import { useAuth } from "../context/AuthContext";
import { useRoleMode } from "../context/RoleModeContext";
import { useScheduling } from "../context/SchedulingContext";
import { useLanguage } from "../context/LanguageContext";
import { SESSION_STATUS, SCHEDULING_STATE } from "../constants";

function categorizeSessions(sessions) {
  const now = new Date();
  const upcoming = [];
  const planned = [];
  const past = [];

  sessions.forEach((s) => {
    if (s.status === SESSION_STATUS.COMPLETED || s.schedulingState === SCHEDULING_STATE.COMPLETED) {
      past.push(s);
    } else if (s.matchedSlot && new Date(s.matchedSlot) > now) {
      upcoming.push(s);
    } else if (s.status === SESSION_STATUS.MATCHED) {
      planned.push(s);
    } else {
      planned.push(s);
    }
  });

  return { upcoming, planned, past };
}

export default function MySessionsPage() {
  const { currentUser, users, isAdmin } = useAuth();
  const { isMenteeMode, isMentorMode } = useRoleMode();
  const { getSessionsForUser, sessions } = useScheduling();
  const [tab, setTab] = useState(0);
  const [feedbackSession, setFeedbackSession] = useState(null);
  const [attendanceSession, setAttendanceSession] = useState(null);

  const { t } = useLanguage();

  const allSessions = getSessionsForUser(currentUser?.id);
  const mySessions = useMemo(() => {
    if (!currentUser) return [];
    if (isMenteeMode) {
      return allSessions.filter((s) => s.menteeId === currentUser.id);
    }
    if (isMentorMode) {
      return allSessions.filter((s) => s.mentorId === currentUser.id);
    }
    return allSessions;
  }, [allSessions, currentUser, isMenteeMode, isMentorMode]);
  const { upcoming, planned, past } = useMemo(
    () => categorizeSessions(mySessions),
    [mySessions, sessions]
  );

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const getUser = (id) => users.find((u) => u.id === id);

  const tabSessions = [upcoming, planned, past][tab] || [];

  const needsFeedback = (session) => {
    const role = currentUser.id === session.mentorId ? "mentor" : "mentee";
    if (role === "mentor" && !isMentorMode) return false;
    if (role === "mentee" && !isMenteeMode) return false;
    return (
      session.schedulingState === SCHEDULING_STATE.COMPLETED &&
      !session.feedback?.[role]
    );
  };

  const needsAttendance = (session) => {
    const role = currentUser.id === session.mentorId ? "mentor" : "mentee";
    if (role === "mentor" && !isMentorMode) return false;
    if (role === "mentee" && !isMenteeMode) return false;
    const slotPassed = session.matchedSlot && new Date(session.matchedSlot) < new Date();
    return (
      slotPassed &&
      session.schedulingState === SCHEDULING_STATE.MATCHED &&
      session.attendance?.[role] === null
    );
  };

  return (
    <MainLayout>
      <PageHeader
        title={isMentorMode ? t("nav.sessionsAsMentor") : t("sessions.title")}
        subtitle={isMentorMode ? t("mode.mentoringDesc") : t("mode.learningDesc")}
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label={`${t("sessions.upcoming")} (${upcoming.length})`} />
        <Tab label={`${t("sessions.planned")} (${planned.length})`} />
        <Tab label={`${t("sessions.past")} (${past.length})`} />
      </Tabs>

      {tabSessions.length === 0 && (
        <Alert severity="info">
          {isMentorMode ? t("sessions.emptyMentor") : t("sessions.emptyMentee")}
        </Alert>
      )}

      {tabSessions.map((session) => {
        const mentor = getUser(session.mentorId);
        const mentee = getUser(session.menteeId);
        return (
          <Box key={session.id}>
            <SessionSchedulingPanel
              session={session}
              mentor={mentor}
              mentee={mentee}
            />
            {needsAttendance(session) && (
              <Alert
                severity="warning"
                action={
                  <button
                    type="button"
                    onClick={() => setAttendanceSession(session)}
                    style={{ cursor: "pointer", border: "none", background: "none", color: "#ed6c02", fontWeight: 600 }}
                  >
                    {t("sessions.confirmAttendance")}
                  </button>
                }
                sx={{ mb: 2 }}
              >
                האם הפגישה התקיימה?
              </Alert>
            )}
            {needsFeedback(session) && (
              <Alert
                severity="info"
                action={
                  <button
                    type="button"
                    onClick={() => setFeedbackSession(session)}
                    style={{ cursor: "pointer", border: "none", background: "none", color: "#1976d2", fontWeight: 600 }}
                  >
                    {t("sessions.fillFeedback")}
                  </button>
                }
                sx={{ mb: 2 }}
              >
                נדרש משוב על הפגישה
              </Alert>
            )}
          </Box>
        );
      })}

      <FeedbackDialog
        open={Boolean(feedbackSession)}
        session={feedbackSession}
        onClose={() => setFeedbackSession(null)}
      />
      <AttendanceDialog
        open={Boolean(attendanceSession)}
        session={attendanceSession}
        onClose={() => setAttendanceSession(null)}
      />
    </MainLayout>
  );
}
