import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { Navigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import PageHeader from "../components/common/PageHeader";
import WeekCalendar from "../components/calendar/WeekCalendar";
import MeetingEventDialog from "../components/calendar/MeetingEventDialog";
import { useAuth } from "../context/AuthContext";
import { useRoleMode } from "../context/RoleModeContext";
import { useScheduling } from "../context/SchedulingContext";
import { useLanguage } from "../context/LanguageContext";
import { toCalendarEvents } from "../services/appointmentService";
import { addDays, isSameSlot, startOfWeek } from "../utils/calendar";

export default function CalendarPage() {
  const { currentUser, users, isAdmin } = useAuth();
  const { isMentorMode, isMenteeMode } = useRoleMode();
  const {
    Meetings,
    getMeetingsForUser,
    refreshMeetings,
    getMyAvailability,
    saveWeekAvailability,
  } = useScheduling();

  useEffect(() => {
    refreshMeetings();
  }, [refreshMeetings, currentUser?.id, isMentorMode, isMenteeMode]);

  const { t } = useLanguage();

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [filter, setFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [availSlots, setAvailSlots] = useState([]);
  const [availLoading, setAvailLoading] = useState(false);
  const [savingAvail, setSavingAvail] = useState(false);
  const [availMsg, setAvailMsg] = useState("");
  const [availError, setAvailError] = useState("");

  // Mentors edit availability starting next week (current week is mostly past by mid-week).
  useEffect(() => {
    if (!isMentorMode) return;
    setWeekStart((prev) => {
      const nextWeek = addDays(startOfWeek(new Date()), 7);
      // Only nudge when landing on the current week (default browse for mentees).
      const thisWeek = startOfWeek(new Date()).getTime();
      return prev.getTime() === thisWeek ? nextWeek : prev;
    });
  }, [isMentorMode]);

  const role = isMentorMode ? "mentor" : "mentee";
  const durationMinutes = currentUser?.mentorProfile?.meetingLengthMinutes || 60;

  const myMeetings = useMemo(() => {
    if (!currentUser) return [];
    const all = getMeetingsForUser(currentUser.id);
    if (isMentorMode) return all.filter((s) => String(s.mentorId) === String(currentUser.id));
    if (isMenteeMode) return all.filter((s) => String(s.menteeId) === String(currentUser.id));
    return all;
  }, [currentUser, getMeetingsForUser, isMentorMode, isMenteeMode, Meetings]);

  const events = useMemo(() => {
    let list = toCalendarEvents(myMeetings, { userId: currentUser?.id, role });
    if (filter === "matched") list = list.filter((e) => e.type === "matched" || e.type === "completed");
    if (filter === "proposed") list = list.filter((e) => e.type === "proposed");
    if (filter === "pending") list = list.filter((e) => e.type === "pending");
    return list;
  }, [myMeetings, currentUser?.id, role, filter]);

  // Load mentor availability for the visible week (edit mode)
  useEffect(() => {
    if (!isMentorMode || !currentUser) return undefined;
    let cancelled = false;
    setAvailLoading(true);
    setAvailError("");

    getMyAvailability()
      .then((data) => {
        if (cancelled) return;
        const weekEnd = addDays(weekStart, 7).getTime();
        const weekStartMs = weekStart.getTime();
        const weekSlots = (data.slots || [])
          .filter((s) => {
            const t0 = new Date(s.startTime).getTime();
            return t0 >= weekStartMs && t0 < weekEnd;
          })
          .map((s) => s.startTime);
        setAvailSlots(weekSlots);
      })
      .catch((err) => {
        if (cancelled) return;
        setAvailError(err?.response?.data?.error || err.message || t("calendar.actionFailed"));
      })
      .finally(() => {
        if (!cancelled) setAvailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isMentorMode, currentUser?.id, weekStart, getMyAvailability, t]);

  const availabilityEvents = useMemo(
    () =>
      isMentorMode
        ? availSlots.map((start, index) => ({
            id: `my-avail-${index}`,
            type: "available",
            start,
            end: new Date(new Date(start).getTime() + durationMinutes * 60000).toISOString(),
          }))
        : [],
    [isMentorMode, availSlots, durationMinutes]
  );

  const calendarEvents = useMemo(() => {
    const booked = events.filter((e) => e.type !== "pending");
    if (!isMentorMode) return booked;
    return [...booked, ...availabilityEvents];
  }, [events, isMentorMode, availabilityEvents]);

  if (isAdmin) return <Navigate to="/admin" replace />;

  const meetingForEvent = selectedEvent
    ? myMeetings.find((s) => String(s.id) === String(selectedEvent.meetingId))
    : null;
  const mentor = meetingForEvent
    ? meetingForEvent.mentorDetails ||
      users.find((u) => String(u.id) === String(meetingForEvent.mentorId))
    : null;
  const mentee = meetingForEvent
    ? meetingForEvent.menteeDetails ||
      users.find((u) => String(u.id) === String(meetingForEvent.menteeId))
    : null;

  const handleToggleAvail = (iso) => {
    if (new Date(iso).getTime() <= Date.now()) {
      setAvailError(t("calendar.cannotSelectPast"));
      return;
    }
    setAvailMsg("");
    setAvailError("");
    setAvailSlots((prev) => {
      if (prev.some((s) => isSameSlot(s, iso))) {
        return prev.filter((s) => !isSameSlot(s, iso));
      }
      return [...prev, iso].sort((a, b) => new Date(a) - new Date(b));
    });
  };

  const handleSaveAvailability = async () => {
    setSavingAvail(true);
    setAvailMsg("");
    setAvailError("");
    try {
      const now = Date.now();
      const futureOnly = availSlots.filter((s) => new Date(s).getTime() > now);
      if (availSlots.length > 0 && futureOnly.length === 0) {
        setAvailError(t("calendar.onlyPastSlots"));
        return;
      }
      if (futureOnly.length !== availSlots.length) {
        setAvailSlots(futureOnly);
      }

      const weekEnd = addDays(weekStart, 7);
      const slots = futureOnly.map((startIso) => {
        const start = new Date(startIso);
        const end = new Date(start.getTime() + durationMinutes * 60000);
        return { startTime: start.toISOString(), endTime: end.toISOString() };
      });
      await saveWeekAvailability({
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        slots,
      });
      setAvailMsg(
        slots.length
          ? t("calendar.availabilitySaved")
          : t("calendar.availabilityCleared")
      );
    } catch (err) {
      setAvailError(err?.response?.data?.error || err.message || t("calendar.actionFailed"));
    } finally {
      setSavingAvail(false);
    }
  };

  return (
    <MainLayout>
      <PageHeader
        title={isMentorMode ? t("calendar.mentorTitle") : t("calendar.menteeTitle")}
        subtitle={
          isMentorMode ? t("calendar.mentorAvailabilitySubtitle") : t("calendar.menteeSubtitle")
        }
      />

      {isMentorMode && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t("calendar.availabilityHint")}
        </Alert>
      )}

      {isMentorMode && (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
          <Button size="small" variant="outlined" onClick={() => setWeekStart(startOfWeek(new Date()))}>
            {t("calendar.thisWeek")}
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={() => setWeekStart(addDays(startOfWeek(new Date()), 7))}
          >
            {t("calendar.nextWeek")}
          </Button>
        </Stack>
      )}

      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <Chip label={t("calendar.legendBooked")} sx={{ bgcolor: "rgba(16,185,129,0.18)" }} />
        {isMentorMode && (
          <Chip label={t("calendar.legendAvailable")} sx={{ bgcolor: "rgba(16,185,129,0.12)" }} />
        )}
        {!isMentorMode && (
          <Chip label={t("calendar.legendProposed")} sx={{ bgcolor: "rgba(99,102,241,0.16)" }} />
        )}
      </Stack>

      {!isMentorMode && (
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
      )}

      {availMsg && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setAvailMsg("")}>
          {availMsg}
        </Alert>
      )}
      {availError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setAvailError("")}>
          {availError}
        </Alert>
      )}

      {events.length === 0 && !isMentorMode && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t("calendar.empty")}
        </Alert>
      )}

      {availLoading && isMentorMode ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <WeekCalendar
          weekStart={weekStart}
          onWeekChange={setWeekStart}
          mode={isMentorMode ? "select-multi" : "view"}
          selectedSlots={isMentorMode ? availSlots : []}
          onToggleSlot={isMentorMode ? handleToggleAvail : undefined}
          events={calendarEvents}
          onEventClick={(event) => {
            if (!event?.meetingId || event.type === "available") return;
            setSelectedEvent(event);
          }}
          disablePast={isMentorMode}
        />
      )}

      {isMentorMode && (
        <Stack direction="row" spacing={2} sx={{ mt: 2 }} alignItems="center">
          <Button
            variant="contained"
            onClick={handleSaveAvailability}
            disabled={savingAvail || availLoading}
          >
            {savingAvail ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              t("calendar.saveAvailability")
            )}
          </Button>
          <Typography variant="body2" color="text.secondary">
            {t("calendar.selectedCount", { count: availSlots.length })}
          </Typography>
        </Stack>
      )}

      <MeetingEventDialog
        open={Boolean(selectedEvent)}
        event={selectedEvent}
        meeting={meetingForEvent}
        mentor={mentor}
        mentee={mentee}
        onClose={() => setSelectedEvent(null)}
      />
    </MainLayout>
  );
}
