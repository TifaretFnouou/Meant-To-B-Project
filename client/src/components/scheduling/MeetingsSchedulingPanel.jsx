import React, { useEffect, useMemo, useState } from "react";
import {
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  Stack,
  Chip,
} from "@mui/material";
import StatusBadge from "../common/StatusBadge";
import WeekCalendar from "../calendar/WeekCalendar"; 
import { SCHEDULING_STATE } from "../../constants";
import { useAuth } from "../../context/AuthContext";
import { useScheduling } from "../../context/SchedulingContext";
import { useLanguage } from "../../context/LanguageContext";
import { formatDateTime, isSameSlot, startOfWeek } from "../../utils/calendar";
import { toCalendarEvents } from "../../services/appointmentService";
import UserAvatar from "../common/UserAvatar";

export default function MeetingsSchedulingPanel({ meeting, mentor, mentee }) {
  const { currentUser } = useAuth();
  const {
    rejectRequest,
    proposeSlots,
    selectSlot,
    requestMoreSlots,
    cancelMeeting,
    markUnavailable,
  } = useScheduling();
  const { language, t } = useLanguage();
  const locale = language === "he" ? "he-IL" : "en-US";

  const [localSlots, setLocalSlots] = useState(meeting.proposedSlots || []);
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(
      meeting.proposedSlots?.[0]
        ? new Date(meeting.proposedSlots[0])
        : meeting.matchedSlot
          ? new Date(meeting.matchedSlot)
          : new Date()
    )
  );

  useEffect(() => {
    setLocalSlots(meeting.proposedSlots || []);
  }, [meeting.id, meeting.proposedSlots]);

      // identify the current user
  const isMentor = String(currentUser.id) === String(meeting.mentorId);
  const isMentee = String(currentUser.id) === String(meeting.menteeId);
  
  const actorName = `${currentUser.firstName} ${currentUser.lastName}`;
  const state = meeting.schedulingState;

  const otherName = isMentor
    ? `${mentee?.firstName || ""} ${mentee?.lastName || ""}`.trim()
    : `${mentor?.firstName || ""} ${mentor?.lastName || ""}`.trim();
  const otherUser = isMentor ? mentee : mentor;

  const calendarEvents = useMemo(
    () => toCalendarEvents([meeting]),
    [meeting]
  );

  // --- logic for the new server ---
  
  // mentor proposes times when the request is just created, or when they requested more slots/rescheduled
  const showMentorSlotPicker =
    isMentor &&
    (state === SCHEDULING_STATE.PENDING_REQUEST ||
      state === SCHEDULING_STATE.ADDITIONAL_SLOTS_REQUESTED ||
      state === SCHEDULING_STATE.RESCHEDULE_REQUESTED);

  // mentor is waiting for the mentee to select a time
  const showMentorWaiting =
    isMentor && state === SCHEDULING_STATE.SLOTS_PROPOSED;

  // mentor can see the times and select one
  const showMenteePicker =
    isMentee && state === SCHEDULING_STATE.SLOTS_PROPOSED && meeting.proposedSlots?.length > 0;


  const handleReject = () => rejectRequest(meeting.id, actorName);

  const handleToggleSlot = (iso) => {
    setLocalSlots((prev) =>
      prev.some((s) => isSameSlot(s, iso))
        ? prev.filter((s) => !isSameSlot(s, iso))
        : [...prev, iso].sort((a, b) => new Date(a) - new Date(b))
    );
  };

  const handlePropose = () => {
    if (localSlots.length === 0) return;
    proposeSlots(meeting.id, localSlots, actorName);
  };

  const handleSelect = (slot) => selectSlot(meeting.id, slot, actorName);
  const handleRequestMore = () => requestMoreSlots(meeting.id, actorName);
  const handleCancel = () => cancelMeeting(meeting.id, actorName);
  const handleUnavailable = () => markUnavailable(meeting.id, isMentor ? "mentor" : "mentee");

  return (
    <Paper sx={{ p: 3, mb: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 1, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
          <UserAvatar user={otherUser} size={42} />
          <Typography variant="h6" fontWeight={700}>
            {isMentor ? t("calendar.requestFrom", { name: otherName }) : t("calendar.meetingWith", { name: otherName })}
          </Typography>
        </Box>
        <StatusBadge status={meeting.status} schedulingState={state} />
      </Box>

      {/* message to the mentor that she is waiting for the mentor to propose times */}
      {state === SCHEDULING_STATE.PENDING_REQUEST && isMentee && (
        <Alert severity="warning">{t("calendar.pendingMenteeHint")}</Alert>
      )}

      {state === SCHEDULING_STATE.REJECTED && (
        <Alert severity="error">
          {t("calendar.rejected")}
          {isMentee ? ` ${t("calendar.backToSearch")}` : ""}
        </Alert>
      )}

      {/* --- time proposal log (for the mentor) --- */}
      {showMentorSlotPicker && (
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            {t("calendar.mentorPickSlots")}
          </Alert>
          <WeekCalendar
            weekStart={weekStart}
            onWeekChange={setWeekStart}
            mode="select-multi"
            selectedSlots={localSlots}
            onToggleSlot={handleToggleSlot}
            events={calendarEvents.filter((e) => e.type === "matched")}
          />
          <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
            {localSlots.map((slot) => (
              <Chip
                key={slot}
                label={formatDateTime(slot, locale)}
                onDelete={() => handleToggleSlot(slot)}
                color="primary"
                variant="outlined"
              />
            ))}
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              onClick={handlePropose}
              disabled={localSlots.length === 0}
            >
              {t("calendar.sendSlots")}
            </Button>
            
            {/* reject/cancel button that appears for the mentor */}
            <Button color="error" variant="outlined" onClick={state === SCHEDULING_STATE.PENDING_REQUEST ? handleReject : handleCancel}>
              {state === SCHEDULING_STATE.PENDING_REQUEST ? t("calendar.rejectRequest") : t("calendar.cancelMeeting")}
            </Button>
          </Stack>
        </Box>
      )}

      {/* message to the mentor that she is waiting for the mentee to select a time */}
      {showMentorWaiting && !showMentorSlotPicker && (
        <Box>
          <Alert severity="success" sx={{ mb: 2 }}>
            {t("calendar.slotsSentWaiting")}
          </Alert>
          <WeekCalendar
            weekStart={weekStart}
            onWeekChange={setWeekStart}
            mode="view"
            events={calendarEvents}
          />
        </Box>
      )}

      {/* --- time selection log (for the mentee) --- */}
      {showMenteePicker && (
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            {t("calendar.menteePickSlot")}
          </Alert>
          <WeekCalendar
            weekStart={weekStart}
            onWeekChange={setWeekStart}
            mode="select-one"
            selectableSlots={meeting.proposedSlots}
            selectedSlots={[]}
            onSelectSlot={handleSelect} 
            events={calendarEvents}
          />
          <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
            {!meeting.rescheduleUsed && (
              <Button variant="outlined" onClick={handleRequestMore}>
                {t("calendar.requestMoreSlots")}
              </Button>
            )}
            
            <Button color="error" variant="contained" onClick={handleCancel}>
              {t("calendar.cancelMeeting")}
            </Button>
          </Stack>
        </Box>
      )}

      {state === SCHEDULING_STATE.ADDITIONAL_SLOTS_REQUESTED && isMentee && (
        <Alert severity="info">{t("calendar.moreSlotsRequested")}</Alert>
      )}

      {/* meeting has been scheduled */}
      {state === SCHEDULING_STATE.MATCHED && (
        <Box>
          <Alert severity="success" sx={{ mb: 2 }}>
            {t("calendar.matchedAt", {
              date: formatDateTime(meeting.matchedSlot, locale),
            })}
          </Alert>
          <WeekCalendar
            weekStart={weekStart}
            onWeekChange={setWeekStart}
            mode="view"
            events={calendarEvents}
          />
          <Button variant="outlined" color="warning" sx={{ mt: 2 }} onClick={handleUnavailable}>
            {t("calendar.markUnavailable")}
          </Button>
        </Box>
      )}

      {state === SCHEDULING_STATE.CANCELLED && (
        <Alert severity="error">{t("calendar.cancelled")}</Alert>
      )}

      {state === SCHEDULING_STATE.COMPLETED && (
        <Alert severity="success">{t("calendar.completed")}</Alert>
      )}
    </Paper>
  );
}