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

export default function SessionSchedulingPanel({ session, mentor, mentee }) {
  const { currentUser } = useAuth();
  const {
    approveRequest,
    rejectRequest,
    proposeSlots,
    selectSlot,
    requestMoreSlots,
    cancelSession,
    markUnavailable,
  } = useScheduling();
  const { language, t } = useLanguage();
  const locale = language === "he" ? "he-IL" : "en-US";

  const [localSlots, setLocalSlots] = useState(session.proposedSlots || []);
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(
      session.proposedSlots?.[0]
        ? new Date(session.proposedSlots[0])
        : session.matchedSlot
          ? new Date(session.matchedSlot)
          : new Date()
    )
  );

  useEffect(() => {
    setLocalSlots(session.proposedSlots || []);
  }, [session.id, session.proposedSlots]);

  const isMentor = currentUser.id === session.mentorId;
  const isMentee = currentUser.id === session.menteeId;
  const actorName = `${currentUser.firstName} ${currentUser.lastName}`;
  const state = session.schedulingState;

  const otherName = isMentor
    ? `${mentee?.firstName || ""} ${mentee?.lastName || ""}`.trim()
    : `${mentor?.firstName || ""} ${mentor?.lastName || ""}`.trim();
  const otherUser = isMentor ? mentee : mentor;

  const calendarEvents = useMemo(
    () => toCalendarEvents([session]),
    [session]
  );

  // Mentor proposes when: approved with empty slots, additional requested, or reschedule
  const showMentorSlotPicker =
    isMentor &&
    ((state === SCHEDULING_STATE.SLOTS_PROPOSED && (!session.proposedSlots || session.proposedSlots.length === 0)) ||
      state === SCHEDULING_STATE.ADDITIONAL_SLOTS_REQUESTED ||
      state === SCHEDULING_STATE.RESCHEDULE_REQUESTED);

  const showMentorWaiting =
    isMentor &&
    (state === SCHEDULING_STATE.SLOTS_PROPOSED ||
      state === SCHEDULING_STATE.ADDITIONAL_SLOTS_PROPOSED) &&
    session.proposedSlots?.length > 0;

  const showMenteePicker =
    isMentee &&
    (state === SCHEDULING_STATE.SLOTS_PROPOSED ||
      state === SCHEDULING_STATE.ADDITIONAL_SLOTS_PROPOSED) &&
    session.proposedSlots?.length > 0;

  const handleApprove = () => approveRequest(session.id, actorName);
  const handleReject = () => rejectRequest(session.id, actorName);

  const handleToggleSlot = (iso) => {
    setLocalSlots((prev) =>
      prev.some((s) => isSameSlot(s, iso))
        ? prev.filter((s) => !isSameSlot(s, iso))
        : [...prev, iso].sort((a, b) => new Date(a) - new Date(b))
    );
  };

  const handlePropose = () => {
    if (localSlots.length === 0) return;
    proposeSlots(session.id, localSlots, actorName);
  };

  const handleSelect = (slot) => selectSlot(session.id, slot, actorName);
  const handleRequestMore = () => requestMoreSlots(session.id, actorName);
  const handleCancel = () => cancelSession(session.id, actorName);
  const handleUnavailable = () => markUnavailable(session.id, isMentor ? "mentor" : "mentee");

  return (
    <Paper sx={{ p: 3, mb: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 1, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
          <UserAvatar user={otherUser} size={42} />
          <Typography variant="h6" fontWeight={700}>
            {isMentor ? t("calendar.requestFrom", { name: otherName }) : t("calendar.sessionWith", { name: otherName })}
          </Typography>
        </Box>
        <StatusBadge status={session.status} schedulingState={state} />
      </Box>

      {state === SCHEDULING_STATE.PENDING_REQUEST && isMentor && (
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            {t("calendar.pendingMentorHint")}
          </Alert>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button variant="contained" onClick={handleApprove}>
              {t("calendar.approveOpenCalendar")}
            </Button>
            <Button variant="outlined" color="error" onClick={handleReject}>
              {t("calendar.rejectRequest")}
            </Button>
          </Stack>
        </Box>
      )}

      {state === SCHEDULING_STATE.PENDING_REQUEST && isMentee && (
        <Alert severity="warning">{t("calendar.pendingMenteeHint")}</Alert>
      )}

      {state === SCHEDULING_STATE.REJECTED && (
        <Alert severity="error">
          {t("calendar.rejected")}
          {isMentee ? ` ${t("calendar.backToSearch")}` : ""}
        </Alert>
      )}

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
            {(state === SCHEDULING_STATE.ADDITIONAL_SLOTS_REQUESTED ||
              state === SCHEDULING_STATE.RESCHEDULE_REQUESTED) && (
              <Button color="error" onClick={handleCancel}>
                {t("calendar.cancelSession")}
              </Button>
            )}
          </Stack>
        </Box>
      )}

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

      {showMenteePicker && (
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            {t("calendar.menteePickSlot")}
          </Alert>
          <WeekCalendar
            weekStart={weekStart}
            onWeekChange={setWeekStart}
            mode="select-one"
            selectableSlots={session.proposedSlots}
            selectedSlots={[]}
            onSelectSlot={handleSelect}
            events={calendarEvents}
          />
          <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
            {!session.additionalSlotsUsed && (
              <Button variant="outlined" onClick={handleRequestMore}>
                {t("calendar.requestMoreSlots")}
              </Button>
            )}
            <Button color="error" onClick={handleCancel}>
              {t("calendar.cancelSession")}
            </Button>
          </Stack>
        </Box>
      )}

      {state === SCHEDULING_STATE.ADDITIONAL_SLOTS_REQUESTED && isMentee && (
        <Alert severity="info">{t("calendar.moreSlotsRequested")}</Alert>
      )}

      {state === SCHEDULING_STATE.MATCHED && (
        <Box>
          <Alert severity="success" sx={{ mb: 2 }}>
            {t("calendar.matchedAt", {
              date: formatDateTime(session.matchedSlot, locale),
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
