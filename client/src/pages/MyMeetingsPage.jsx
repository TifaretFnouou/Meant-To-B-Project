import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Navigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import PageHeader from "../components/common/PageHeader";
import MeetingEventDialog from "../components/calendar/MeetingEventDialog";
import FeedbackDialog from "../components/feedback/FeedbackDialog";
import AttendanceDialog from "../components/feedback/AttendanceDialog";
import StatusBadge from "../components/common/StatusBadge";
import UserAvatar from "../components/common/UserAvatar";
import { useAuth } from "../context/AuthContext";
import { useRoleMode } from "../context/RoleModeContext";
import { useScheduling } from "../context/SchedulingContext";
import { useLanguage } from "../context/LanguageContext";
import { MEETING_STATUS, SCHEDULING_STATE } from "../constants";
import { formatDateTime } from "../utils/calendar";

function categorizeMeetings(meetings) {
  const upcoming = [];
  const planned = [];
  const past = [];
  const now = Date.now();

  meetings.forEach((s) => {
    const status = s.status || "";
    const isPastTerminal =
      status === MEETING_STATUS.COMPLETED ||
      status === MEETING_STATUS.CANCELLED ||
      status === "FEEDBACK_FILLED" ||
      s.schedulingState === SCHEDULING_STATE.COMPLETED ||
      s.schedulingState === SCHEDULING_STATE.CANCELLED;

    if (isPastTerminal) {
      past.push(s);
      return;
    }

    const isMatched =
      status === MEETING_STATUS.MATCHED || s.schedulingState === SCHEDULING_STATE.MATCHED;

    if (isMatched) {
      const start = s.matchedSlot ? new Date(s.matchedSlot).getTime() : NaN;
      const end = Number.isNaN(start)
        ? NaN
        : start + (s.durationMinutes || 60) * 60000;
      if (!Number.isNaN(end) && end < now) {
        past.push(s);
      } else {
        upcoming.push(s);
      }
      return;
    }

    planned.push(s);
  });

  return { upcoming, planned, past };
}

function MeetingListCard({ meeting, otherUser, otherName, isMentor, locale, language, t, onOpen }) {
  const when =
    meeting.matchedSlot ||
    meeting.proposedSlots?.[0] ||
    null;

  return (
    <Paper
      elevation={0}
      onClick={onOpen}
      sx={{
        p: 2,
        mb: 1.5,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        cursor: "pointer",
        transition: "border-color 0.15s ease, background 0.15s ease",
        "&:hover": {
          borderColor: "primary.main",
          bgcolor: "action.hover",
        },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <UserAvatar user={otherUser} size={44} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={700} noWrap>
            {isMentor
              ? t("calendar.requestFrom", { name: otherName || "—" })
              : t("calendar.meetingWith", { name: otherName || "—" })}
          </Typography>
          {when ? (
            <Typography variant="body2" color="text.secondary">
              {formatDateTime(when, locale)}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t("calendar.eventPending")}
            </Typography>
          )}
        </Box>
        <StatusBadge status={meeting.status} schedulingState={meeting.schedulingState} />
        <Button
          size="small"
          variant="outlined"
          endIcon={language === "he" ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
        >
          {t("Meetings.openDetails")}
        </Button>
      </Stack>
    </Paper>
  );
}

export default function MyMeetingsPage() {
  const { currentUser, users, isAdmin } = useAuth();
  const { isMenteeMode, isMentorMode } = useRoleMode();
  const { getMeetingsForUser, Meetings, refreshMeetings } = useScheduling();
  const { language, t } = useLanguage();
  const locale = language === "he" ? "he-IL" : "en-US";

  const [tab, setTab] = useState(0);
  const [tabReady, setTabReady] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);
  const [feedbackMeeting, setFeedbackMeeting] = useState(null);
  const [attendanceMeeting, setAttendanceMeeting] = useState(null);

  useEffect(() => {
    refreshMeetings();
  }, [refreshMeetings, currentUser?.id, isMentorMode, isMenteeMode]);

  useEffect(() => {
    setTabReady(false);
    setSelectedMeetingId(null);
  }, [currentUser?.id, isMentorMode, isMenteeMode]);

  const allMeetings = getMeetingsForUser(currentUser?.id);
  const myMeetings = useMemo(() => {
    if (!currentUser) return [];
    if (isMenteeMode) {
      return allMeetings.filter((s) => String(s.menteeId) === String(currentUser.id));
    }
    if (isMentorMode) {
      return allMeetings.filter((s) => String(s.mentorId) === String(currentUser.id));
    }
    return allMeetings;
  }, [allMeetings, currentUser, isMenteeMode, isMentorMode, Meetings]);

  const { upcoming, planned, past } = useMemo(
    () => categorizeMeetings(myMeetings),
    [myMeetings]
  );

  // Matched meetings live under "upcoming" — open that tab first when it has items.
  useEffect(() => {
    if (tabReady || myMeetings.length === 0) return;
    if (upcoming.length > 0) setTab(0);
    else if (planned.length > 0) setTab(1);
    else setTab(2);
    setTabReady(true);
  }, [tabReady, myMeetings.length, upcoming.length, planned.length]);

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const getUser = (id) => users.find((u) => String(u.id) === String(id));
  const tabMeetings = [upcoming, planned, past][tab] || [];

  const selectedMeeting = selectedMeetingId
    ? myMeetings.find((m) => String(m.id) === String(selectedMeetingId))
    : null;
  const selectedMentor = selectedMeeting
    ? selectedMeeting.mentorDetails || getUser(selectedMeeting.mentorId)
    : null;
  const selectedMentee = selectedMeeting
    ? selectedMeeting.menteeDetails || getUser(selectedMeeting.menteeId)
    : null;

  const needsFeedback = (meeting) => {
    const role = String(currentUser.id) === String(meeting.mentorId) ? "mentor" : "mentee";
    if (role === "mentor" && !isMentorMode) return false;
    if (role === "mentee" && !isMenteeMode) return false;
    if (meeting.feedback?.[role]?.isFilled) return false;

    const start = meeting.matchedSlot ? new Date(meeting.matchedSlot).getTime() : NaN;
    if (Number.isNaN(start)) return false;
    const ended = Date.now() >= start + (meeting.durationMinutes || 60) * 60000;
    if (!ended) return false;

    return (
      meeting.status === MEETING_STATUS.MATCHED ||
      meeting.status === MEETING_STATUS.COMPLETED ||
      meeting.schedulingState === SCHEDULING_STATE.MATCHED ||
      meeting.schedulingState === SCHEDULING_STATE.COMPLETED
    );
  };

  const needsAttendance = (meeting) => {
    const role = String(currentUser.id) === String(meeting.mentorId) ? "mentor" : "mentee";
    if (role === "mentor" && !isMentorMode) return false;
    if (role === "mentee" && !isMenteeMode) return false;

    const slotPassed = meeting.matchedSlot && new Date(meeting.matchedSlot) < new Date();

    return (
      slotPassed &&
      (meeting.status === MEETING_STATUS.MATCHED ||
        meeting.schedulingState === SCHEDULING_STATE.MATCHED) &&
      meeting.attendance?.[role] === null
    );
  };

  return (
    <MainLayout>
      <PageHeader
        title={isMentorMode ? t("nav.MeetingsAsMentor") : t("Meetings.title")}
        subtitle={isMentorMode ? t("mode.mentoringDesc") : t("mode.MenteeDesc")}
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label={`${t("Meetings.upcoming")} (${upcoming.length})`} />
        <Tab label={`${t("Meetings.planned")} (${planned.length})`} />
        <Tab label={`${t("Meetings.past")} (${past.length})`} />
      </Tabs>

      {tabMeetings.length === 0 && (
        <Alert severity="info">
          {isMentorMode ? t("Meetings.emptyMentor") : t("Meetings.emptyMentee")}
        </Alert>
      )}

      {tabMeetings.map((meeting) => {
        const mentor = meeting.mentorDetails || getUser(meeting.mentorId);
        const mentee = meeting.menteeDetails || getUser(meeting.menteeId);
        const isMentor = String(currentUser.id) === String(meeting.mentorId);
        const otherUser = isMentor ? mentee : mentor;
        const otherName = `${otherUser?.firstName || ""} ${otherUser?.lastName || ""}`.trim();

        return (
          <Box key={meeting.id}>
            <MeetingListCard
              meeting={meeting}
              otherUser={otherUser}
              otherName={otherName}
              isMentor={isMentor}
              locale={locale}
              language={language}
              t={t}
              onOpen={() => setSelectedMeetingId(meeting.id)}
            />
            {needsAttendance(meeting) && (
              <Alert
                severity="warning"
                action={
                  <Button color="inherit" size="small" onClick={() => setAttendanceMeeting(meeting)}>
                    {t("Meetings.confirmAttendance")}
                  </Button>
                }
                sx={{ mb: 2 }}
              >
                {t("Meetings.attendancePrompt")}
              </Alert>
            )}
            {needsFeedback(meeting) && (
              <Alert
                severity="info"
                action={
                  <Button color="inherit" size="small" onClick={() => setFeedbackMeeting(meeting)}>
                    {t("Meetings.fillFeedback")}
                  </Button>
                }
                sx={{ mb: 2 }}
              >
                {t("Meetings.feedbackPrompt")}
              </Alert>
            )}
          </Box>
        );
      })}

      <MeetingEventDialog
        open={Boolean(selectedMeeting)}
        meeting={selectedMeeting}
        mentor={selectedMentor}
        mentee={selectedMentee}
        onClose={() => setSelectedMeetingId(null)}
      />

      <FeedbackDialog
        open={Boolean(feedbackMeeting)}
        meeting={feedbackMeeting}
        onClose={() => setFeedbackMeeting(null)}
      />
      <AttendanceDialog
        open={Boolean(attendanceMeeting)}
        meeting={attendanceMeeting}
        onClose={() => setAttendanceMeeting(null)}
      />
    </MainLayout>
  );
}
