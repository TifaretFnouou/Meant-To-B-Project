import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../common/StatusBadge";
import WeekCalendar from "../calendar/WeekCalendar";
import { SCHEDULING_STATE } from "../../constants";
import { useAuth } from "../../context/AuthContext";
import { useScheduling } from "../../context/SchedulingContext";
import { useLanguage } from "../../context/LanguageContext";
import { formatDateTime, isSameSlot, startOfWeek } from "../../utils/calendar";
import { toCalendarEvents } from "../../services/appointmentService";
import UserAvatar from "../common/UserAvatar";

const MAX_SLOTS = 3;

export default function MeetingsSchedulingPanel({
  meeting,
  mentor,
  mentee,
  compact = false,
  onDone,
}) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const {
    rejectRequest,
    proposeSlots,
    selectSlot,
    requestMoreSlots,
    cancelMeeting,
    markUnavailable,
    getMentorAvailability,
    rebookFromAvailability,
    approveRequest,
  } = useScheduling();
  const { language, t } = useLanguage();
  const locale = language === "he" ? "he-IL" : "en-US";

  const [localSlots, setLocalSlots] = useState(meeting.proposedSlots || []);
  const [editingSlots, setEditingSlots] = useState(false);
  const [error, setError] = useState("");
  const [selectingSlot, setSelectingSlot] = useState(null);
  const [copied, setCopied] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(
      meeting.proposedSlots?.[0]
        ? new Date(meeting.proposedSlots[0])
        : meeting.matchedSlot
          ? new Date(meeting.matchedSlot)
          : new Date()
    )
  );
  const [openSlots, setOpenSlots] = useState([]);
  const [loadingOpen, setLoadingOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    setLocalSlots(meeting.proposedSlots || []);
    setEditingSlots(false);
    setError("");
    setCopied(false);
    const anchor = meeting.matchedSlot || meeting.proposedSlots?.[0] || null;
    if (anchor) setWeekStart(startOfWeek(new Date(anchor)));
  }, [meeting.id, meeting.proposedSlots, meeting.matchedSlot, meeting.schedulingState]);

  useEffect(() => {
    if (meeting.schedulingState !== SCHEDULING_STATE.MATCHED || !meeting.matchedSlot) {
      return undefined;
    }
    const id = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(id);
  }, [meeting.schedulingState, meeting.matchedSlot]);

  const isMentor = Boolean(currentUser) && String(currentUser.id) === String(meeting.mentorId);
  const isMentee = Boolean(currentUser) && String(currentUser.id) === String(meeting.menteeId);
  const actorName = `${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`.trim();
  const state =
    meeting.schedulingState ||
    (meeting.matchedSlot ? SCHEDULING_STATE.MATCHED : SCHEDULING_STATE.PENDING_REQUEST);

  const awaitingMentor =
    state === SCHEDULING_STATE.PENDING_REQUEST ||
    state === SCHEDULING_STATE.RESCHEDULE_REQUESTED ||
    state === SCHEDULING_STATE.ADDITIONAL_SLOTS_REQUESTED;

  const awaitingMentorApproval = state === SCHEDULING_STATE.PENDING_MENTOR_APPROVAL;

  useEffect(() => {
    if (!isMentee || !awaitingMentor || !meeting.mentorId) return undefined;
    let cancelled = false;
    setLoadingOpen(true);
    getMentorAvailability(meeting.mentorId)
      .then((data) => {
        if (cancelled) return;
        const slots = data?.slots || [];
        setOpenSlots(slots);
        if (slots[0]?.startTime) setWeekStart(startOfWeek(new Date(slots[0].startTime)));
      })
      .catch(() => {
        if (!cancelled) setOpenSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingOpen(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isMentee, awaitingMentor, meeting.mentorId, meeting.id, getMentorAvailability]);

  const canJoinMeet = useMemo(() => {
    if (!meeting.matchedSlot) return false;
    const start = new Date(meeting.matchedSlot).getTime();
    const end = start + (meeting.durationMinutes || 60) * 60000;
    const openFrom = start - 15 * 60000;
    return nowTick >= openFrom && nowTick <= end + 30 * 60000;
  }, [meeting.matchedSlot, meeting.durationMinutes, nowTick]);

  const otherName = isMentor
    ? `${mentee?.firstName || ""} ${mentee?.lastName || ""}`.trim()
    : `${mentor?.firstName || ""} ${mentor?.lastName || ""}`.trim();
  const otherUser = isMentor ? mentee : mentor;
  const calendarEvents = useMemo(() => toCalendarEvents([meeting]), [meeting]);

  const showMentorSlotPicker =
    isMentor &&
    (state === SCHEDULING_STATE.PENDING_REQUEST ||
      state === SCHEDULING_STATE.ADDITIONAL_SLOTS_REQUESTED ||
      state === SCHEDULING_STATE.RESCHEDULE_REQUESTED ||
      ((state === SCHEDULING_STATE.SLOTS_PROPOSED ||
        state === SCHEDULING_STATE.ADDITIONAL_SLOTS_PROPOSED) &&
        editingSlots));

  const showMentorWaiting =
    isMentor &&
    (state === SCHEDULING_STATE.SLOTS_PROPOSED ||
      state === SCHEDULING_STATE.ADDITIONAL_SLOTS_PROPOSED) &&
    !editingSlots;

  const showMenteePicker =
    isMentee &&
    (state === SCHEDULING_STATE.SLOTS_PROPOSED ||
      state === SCHEDULING_STATE.ADDITIONAL_SLOTS_PROPOSED) &&
    meeting.proposedSlots?.length > 0;

  const showMenteeRebook = isMentee && awaitingMentor;

  const run = async (fn, { closeOnSuccess = false } = {}) => {
    setError("");
    try {
      await fn();
      if (closeOnSuccess) onDone?.();
    } catch (err) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message;
      if (status === 403) {
        setError(t("calendar.selectAsMenteeOnly"));
      } else {
        setError(serverMsg || err?.message || t("calendar.actionFailed"));
      }
    }
  };

  const handleReject = () =>
    run(() => rejectRequest(meeting.id, actorName), { closeOnSuccess: true });
  const handleCancel = () =>
    run(() => cancelMeeting(meeting.id, actorName), { closeOnSuccess: true });
  const handleRequestMore = () => run(() => requestMoreSlots(meeting.id, actorName));
  const handleUnavailable = () =>
    run(() => markUnavailable(meeting.id, isMentor ? "mentor" : "mentee"), {
      closeOnSuccess: true,
    });

  const handleApproveBooking = () => {
    if (approving) return;
    setApproving(true);
    setSuccessMsg("");
    run(async () => {
      await approveRequest(meeting.id);
      setSuccessMsg(t("calendar.meetingApprovedSuccess"));
    }).finally(() => setApproving(false));
  };

  const handleToggleSlot = (iso) => {
    setLocalSlots((prev) => {
      if (prev.some((s) => isSameSlot(s, iso))) {
        setError("");
        return prev.filter((s) => !isSameSlot(s, iso));
      }
      if (prev.length >= MAX_SLOTS) {
        setError(t("calendar.maxThreeSlots"));
        return prev;
      }
      setError("");
      return [...prev, iso].sort((a, b) => new Date(a) - new Date(b));
    });
  };

  const handlePropose = () => {
    if (localSlots.length === 0 || localSlots.length > MAX_SLOTS) return;
    run(async () => {
      await proposeSlots(meeting.id, localSlots, actorName);
      setEditingSlots(false);
    });
  };

  const handleSelect = (slot) => {
    if (!isMentee) {
      setError(t("calendar.selectAsMenteeOnly"));
      return;
    }
    if (selectingSlot) return;
    setSelectingSlot(slot);
    run(async () => {
      await selectSlot(meeting.id, slot, actorName);
    }).finally(() => setSelectingSlot(null));
  };

  const handleRebook = (iso) => {
    if (selectingSlot) return;
    const slot = openSlots.find(
      (s) => new Date(s.startTime).getTime() === new Date(iso).getTime()
    );
    if (!slot) {
      setError(t("calendar.slotUnavailable"));
      return;
    }
    setSelectingSlot(iso);
    run(async () => {
      await rebookFromAvailability(meeting.id, slot.startTime, slot.endTime, actorName);
    }).finally(() => setSelectingSlot(null));
  };

  return (
    <Box
      component={compact ? "div" : Paper}
      elevation={compact ? undefined : 0}
      sx={{
        p: compact ? 0 : { xs: 2, sm: 3 },
        mb: compact ? 0 : 2,
        border: compact ? "none" : "1px solid",
        borderColor: "divider",
        borderRadius: compact ? 0 : 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
          <UserAvatar user={otherUser} size={compact ? 36 : 42} />
          <Typography variant={compact ? "subtitle1" : "h6"} fontWeight={700} noWrap>
            {isMentor
              ? t("calendar.requestFrom", { name: otherName || "—" })
              : t("calendar.meetingWith", { name: otherName || "—" })}
          </Typography>
        </Box>
        <StatusBadge status={meeting.status} schedulingState={state} />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg("")}>
          {successMsg}
        </Alert>
      )}

      {awaitingMentorApproval && (
        <Box sx={{ mb: 2 }}>
          <Alert severity={isMentor ? "warning" : "info"} sx={{ mb: 2 }}>
            {isMentor
              ? t("calendar.approveBookingHint", {
                  date: formatDateTime(meeting.matchedSlot, locale),
                })
              : t("calendar.waitingMentorApproval", {
                  date: formatDateTime(meeting.matchedSlot, locale),
                })}
          </Alert>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {isMentor && (
              <Button
                variant="contained"
                color="success"
                disabled={approving}
                onClick={handleApproveBooking}
              >
                {approving ? (
                  <CircularProgress size={22} color="inherit" />
                ) : (
                  t("calendar.approveMeeting")
                )}
              </Button>
            )}
            <Button
              color="error"
              variant="outlined"
              disabled={approving}
              onClick={isMentor ? handleReject : handleCancel}
            >
              {isMentor ? t("calendar.rejectRequest") : t("calendar.cancelMeeting")}
            </Button>
          </Stack>
        </Box>
      )}

      {awaitingMentor && isMentor && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => navigate("/calendar")}>
              {t("calendar.openAvailability")}
            </Button>
          }
        >
          {t("calendar.awaitingMenteeFromAvailability")}
        </Alert>
      )}

      {state === SCHEDULING_STATE.REJECTED && (
        <Alert severity="error">
          {t("calendar.rejected")}
          {isMentee ? ` ${t("calendar.backToSearch")}` : ""}
        </Alert>
      )}

      {showMenteeRebook && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            {t("calendar.rebookFromAvailability")}
          </Alert>
          {loadingOpen ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={28} />
            </Box>
          ) : openSlots.length === 0 ? (
            <Alert severity="warning">{t("calendar.noAvailability")}</Alert>
          ) : (
            <WeekCalendar
              weekStart={weekStart}
              onWeekChange={setWeekStart}
              mode="select-one"
              selectableSlots={openSlots.map((s) => s.startTime)}
              onSelectSlot={handleRebook}
              events={openSlots.map((s, i) => ({
                id: `rebook-${i}`,
                type: "available",
                start: s.startTime,
                end: s.endTime,
              }))}
            />
          )}
          <Button color="error" variant="outlined" sx={{ mt: 2 }} onClick={handleCancel}>
            {t("calendar.cancelMeeting")}
          </Button>
        </Box>
      )}

      {showMentorSlotPicker && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {t("calendar.mentorPickSlotsOptional")}
          </Typography>
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
          <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
            <Button
              variant="contained"
              onClick={handlePropose}
              disabled={localSlots.length === 0 || localSlots.length > MAX_SLOTS}
            >
              {t("calendar.sendSlots")}
            </Button>
            {editingSlots && (
              <Button variant="outlined" onClick={() => setEditingSlots(false)}>
                {t("calendar.cancelEdit")}
              </Button>
            )}
            <Button
              color="error"
              variant="outlined"
              onClick={awaitingMentor ? handleReject : handleCancel}
            >
              {awaitingMentor ? t("calendar.rejectRequest") : t("calendar.cancelMeeting")}
            </Button>
          </Stack>
        </Box>
      )}

      {showMentorWaiting && !showMentorSlotPicker && (
        <Box>
          <Alert severity="success" sx={{ mb: 2 }}>
            {t("calendar.slotsSentWaiting")}
          </Alert>
          {!compact && (
            <WeekCalendar
              weekStart={weekStart}
              onWeekChange={setWeekStart}
              mode="view"
              events={calendarEvents}
            />
          )}
          {compact && meeting.proposedSlots?.length > 0 && (
            <Stack spacing={0.75} sx={{ mb: 2 }}>
              {(meeting.proposedSlots || []).map((slot) => (
                <Chip key={slot} label={formatDateTime(slot, locale)} variant="outlined" />
              ))}
            </Stack>
          )}
          <Stack direction="row" spacing={1} sx={{ mt: compact ? 0 : 2 }} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              onClick={() => {
                setLocalSlots(meeting.proposedSlots || []);
                setEditingSlots(true);
              }}
            >
              {t("calendar.editProposedSlots")}
            </Button>
            <Button color="error" variant="outlined" onClick={handleCancel}>
              {t("calendar.cancelMeeting")}
            </Button>
          </Stack>
        </Box>
      )}

      {showMenteePicker && (
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            {t("calendar.menteePickSlot")}
          </Alert>
          <Stack direction="column" spacing={1.25} sx={{ mb: 1 }}>
            {(meeting.proposedSlots || []).map((slot) => {
              const busy = selectingSlot === slot;
              return (
                <Button
                  key={slot}
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={Boolean(selectingSlot)}
                  onClick={() => handleSelect(slot)}
                  sx={{ justifyContent: "space-between", py: 1.5, px: 2, textAlign: "start" }}
                >
                  <span>{formatDateTime(slot, locale)}</span>
                  <span>{busy ? "…" : t("calendar.selectThisSlot")}</span>
                </Button>
              );
            })}
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
            {!meeting.moreSlotsUsed && (
              <Button
                variant="outlined"
                disabled={Boolean(selectingSlot)}
                onClick={handleRequestMore}
              >
                {t("calendar.requestMoreSlots")}
              </Button>
            )}
            <Button
              color="error"
              variant="outlined"
              disabled={Boolean(selectingSlot)}
              onClick={handleCancel}
            >
              {t("calendar.cancelMeeting")}
            </Button>
          </Stack>
        </Box>
      )}

      {(state === SCHEDULING_STATE.MATCHED ||
        (Boolean(meeting.matchedSlot) &&
          state !== SCHEDULING_STATE.CANCELLED &&
          state !== SCHEDULING_STATE.COMPLETED &&
          state !== SCHEDULING_STATE.PENDING_MENTOR_APPROVAL &&
          !showMenteeRebook &&
          !showMentorSlotPicker &&
          !showMentorWaiting &&
          !showMenteePicker &&
          !awaitingMentorApproval)) && (
        <Box>
          <Alert severity="success" sx={{ mb: 2 }}>
            {t("calendar.matchedAt", {
              date: formatDateTime(meeting.matchedSlot, locale),
            })}{" "}
            {t("calendar.addedToBothCalendars")}
          </Alert>

          {meeting.meetLink && (
            <Box
              sx={{
                p: 2,
                mb: 2,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(211,138,155,0.1)"
                    : "rgba(211,138,155,0.06)",
              }}
            >
              <Stack spacing={1.25}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <VideoCallIcon color="primary" />
                  <Typography fontWeight={700}>{t("calendar.googleMeetTitle")}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {canJoinMeet
                    ? t("calendar.googleMeetJoinHint")
                    : t("calendar.googleMeetWaitHint", {
                        date: formatDateTime(meeting.matchedSlot, locale),
                      })}
                </Typography>
                <Divider />
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<VideoCallIcon />}
                    href={canJoinMeet ? meeting.meetLink : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    disabled={!canJoinMeet}
                  >
                    {t("calendar.joinGoogleMeet")}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ContentCopyIcon />}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(meeting.meetLink);
                        setError("");
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      } catch {
                        setError(t("calendar.copyMeetFailed"));
                      }
                    }}
                  >
                    {copied ? t("calendar.copied") : t("calendar.copyMeetLink")}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}

          {!compact && (
            <WeekCalendar
              weekStart={weekStart}
              onWeekChange={setWeekStart}
              mode="view"
              events={calendarEvents}
            />
          )}
          <Stack direction="row" spacing={1} sx={{ mt: compact ? 0 : 2 }} flexWrap="wrap" useFlexGap>
            {!meeting.rescheduleUsed && (
              <Button variant="outlined" color="warning" onClick={handleUnavailable}>
                {t("calendar.markUnavailable")}
              </Button>
            )}
            <Button color="error" variant="outlined" onClick={handleCancel}>
              {t("calendar.cancelMeeting")}
            </Button>
          </Stack>
        </Box>
      )}

      {state === SCHEDULING_STATE.CANCELLED && (
        <Alert severity="error">{t("calendar.cancelled")}</Alert>
      )}

      {state === SCHEDULING_STATE.COMPLETED && (
        <Alert severity="success">{t("calendar.completed")}</Alert>
      )}
    </Box>
  );
}
