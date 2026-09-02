import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { Navigate, useNavigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import PageHeader from "../components/common/PageHeader";
import WeekCalendar from "../components/calendar/WeekCalendar";
import SessionEventDialog from "../components/calendar/SessionEventDialog";
import { useAuth } from "../context/AuthContext";
import { useRoleMode } from "../context/RoleModeContext";
import { useScheduling } from "../context/SchedulingContext";
import { useLanguage } from "../context/LanguageContext";
import { toCalendarEvents } from "../services/appointmentService";
import { startOfWeek } from "../utils/calendar";
import { SCHEDULING_STATE } from "../constants";

export default function CalendarPage() {
  const { currentUser, users, isAdmin } = useAuth();
  const { isMentorMode, isMenteeMode } = useRoleMode();
  const { sessions, cancelSession, markUnavailable, getSessionsForUser } = useScheduling();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [filter, setFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const role = isMentorMode ? "mentor" : "mentee";

  const mySessions = useMemo(() => {
    if (!currentUser) return [];
    const all = getSessionsForUser(currentUser.id);
    if (isMentorMode) return all.filter((s) => s.mentorId === currentUser.id);
    if (isMenteeMode) return all.filter((s) => s.menteeId === currentUser.id);
    return all;
  }, [currentUser, getSessionsForUser, isMentorMode, isMenteeMode, sessions]);

  const events = useMemo(() => {
    let list = toCalendarEvents(mySessions, { userId: currentUser?.id, role });
    if (filter === "matched") list = list.filter((e) => e.type === "matched" || e.type === "completed");
    if (filter === "proposed") list = list.filter((e) => e.type === "proposed");
    if (filter === "pending") list = list.filter((e) => e.type === "pending");
    return list;
  }, [mySessions, currentUser?.id, role, filter]);

  useEffect(() => {
    const firstTimed = events.find((e) => e.type !== "pending");
    if (firstTimed) {
      setWeekStart(startOfWeek(new Date(firstTimed.start)));
    }
  }, [role, currentUser?.id]);

  if (isAdmin) return <Navigate to="/admin" replace />;

  const sessionForEvent = selectedEvent
    ? mySessions.find((s) => s.id === selectedEvent.sessionId)
    : null;
  const mentor = sessionForEvent ? users.find((u) => u.id === sessionForEvent.mentorId) : null;
  const mentee = sessionForEvent ? users.find((u) => u.id === sessionForEvent.menteeId) : null;
  const actorName = `${currentUser.firstName} ${currentUser.lastName}`;

  const pendingCount = mySessions.filter(
    (s) => s.schedulingState === SCHEDULING_STATE.PENDING_REQUEST
  ).length;

  return (
    <MainLayout>
      <PageHeader
        title={isMentorMode ? t("calendar.mentorTitle") : t("calendar.menteeTitle")}
        subtitle={isMentorMode ? t("calendar.mentorSubtitle") : t("calendar.menteeSubtitle")}
      />

      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <Chip label={`${t("calendar.legendBooked")}`} sx={{ bgcolor: "rgba(16,185,129,0.18)" }} />
        <Chip label={`${t("calendar.legendProposed")}`} sx={{ bgcolor: "rgba(99,102,241,0.16)" }} />
        <Chip label={`${t("calendar.legendPending")}`} sx={{ bgcolor: "rgba(245,158,11,0.18)" }} />
        {pendingCount > 0 && isMentorMode && (
          <Chip color="warning" label={t("calendar.pendingRequests", { count: pendingCount })} />
        )}
      </Stack>

      <ToggleButtonGroup
        exclusive
        size="small"
        value={filter}
        onChange={(_, v) => v && setFilter(v)}
        sx={{ mb: 2 }}
      >
        <ToggleButton value="all">{t("calendar.filterAll")}</ToggleButton>
        <ToggleButton value="matched">{t("calendar.filterBooked")}</ToggleButton>
        <ToggleButton value="proposed">{t("calendar.filterProposed")}</ToggleButton>
        <ToggleButton value="pending">{t("calendar.filterPending")}</ToggleButton>
      </ToggleButtonGroup>

      {events.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t("calendar.empty")}
        </Alert>
      )}

      <WeekCalendar
        weekStart={weekStart}
        onWeekChange={setWeekStart}
        mode="view"
        events={events.filter((e) => e.type !== "pending")}
        onEventClick={setSelectedEvent}
      />

      {events.some((e) => e.type === "pending") && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            {t("calendar.pendingList")}
          </Typography>
          <Stack spacing={1}>
            {events
              .filter((e) => e.type === "pending")
              .map((event) => {
                const s = mySessions.find((x) => x.id === event.sessionId);
                const other =
                  role === "mentor"
                    ? users.find((u) => u.id === s?.menteeId)
                    : users.find((u) => u.id === s?.mentorId);
                return (
                  <Alert
                    key={event.id}
                    severity="warning"
                    action={
                      <Chip
                        size="small"
                        label={t("calendar.openSession")}
                        onClick={() => navigate("/sessions")}
                        clickable
                      />
                    }
                  >
                    {t("calendar.pendingItem", {
                      name: other ? `${other.firstName} ${other.lastName}` : "",
                    })}
                  </Alert>
                );
              })}
          </Stack>
        </Box>
      )}

      <SessionEventDialog
        open={Boolean(selectedEvent)}
        event={selectedEvent}
        session={sessionForEvent}
        mentor={mentor}
        mentee={mentee}
        onClose={() => setSelectedEvent(null)}
        onGoToSession={() => {
          setSelectedEvent(null);
          navigate("/sessions");
        }}
        onCancel={
          sessionForEvent &&
          ![SCHEDULING_STATE.CANCELLED, SCHEDULING_STATE.COMPLETED].includes(
            sessionForEvent.schedulingState
          )
            ? async () => {
                await cancelSession(sessionForEvent.id, actorName);
                setSelectedEvent(null);
              }
            : undefined
        }
        onReschedule={
          sessionForEvent?.schedulingState === SCHEDULING_STATE.MATCHED
            ? async () => {
                await markUnavailable(
                  sessionForEvent.id,
                  currentUser.id === sessionForEvent.mentorId ? "mentor" : "mentee"
                );
                setSelectedEvent(null);
                navigate("/sessions");
              }
            : undefined
        }
      />
    </MainLayout>
  );
}
