import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import WeekCalendar from "../calendar/WeekCalendar";
import { useLanguage } from "../../context/LanguageContext";
import { useScheduling } from "../../context/SchedulingContext";
import { useAuth } from "../../context/AuthContext";
import { formatDateTime, startOfWeek } from "../../utils/calendar";
import availabilityService from "../../services/availabilityService";

/** Show "request more slots" when mentor has fewer than this many open times */
const LOW_AVAILABILITY_THRESHOLD = 2;

function resolveMentorId(mentor) {
  if (!mentor) return null;
  return mentor.id || mentor._id || null;
}

/**
 * Mentee books a free slot from a mentor's published availability.
 * If availability is low/empty, mentee can ask the mentor to add more calendar slots.
 */
export default function BookMentorDialog({ open, mentor, onClose, onBooked }) {
  const { t, language } = useLanguage();
  const locale = language === "he" ? "he-IL" : "en-US";
  const { currentUser } = useAuth();
  const { getMentorAvailability, bookFromAvailability } = useScheduling();

  const mentorId = resolveMentorId(mentor);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [openSlots, setOpenSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [selectedIso, setSelectedIso] = useState(null);
  const [requestNote, setRequestNote] = useState("");

  useEffect(() => {
    if (!open || !mentorId) return undefined;

    let cancelled = false;
    setLoading(true);
    setError("");
    setInfo("");
    setSelectedIso(null);
    setRequestNote("");

    getMentorAvailability(mentorId)
      .then((data) => {
        if (cancelled) return;
        const slots = (data?.slots || [])
          .slice()
          .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        setOpenSlots(slots);
        if (slots[0]?.startTime) {
          setWeekStart(startOfWeek(new Date(slots[0].startTime)));
        } else {
          setWeekStart(startOfWeek(new Date()));
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.response?.data?.error || err.message || t("calendar.actionFailed"));
        setOpenSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, mentorId, getMentorAvailability, t]);

  const selectableSlots = useMemo(
    () => openSlots.map((s) => s.startTime),
    [openSlots]
  );

  const availabilityEvents = useMemo(
    () =>
      openSlots.map((s, index) => ({
        id: `avail-${index}`,
        type: "available",
        start: s.startTime,
        end: s.endTime,
        titleKey: "calendar.legendAvailable",
      })),
    [openSlots]
  );

  const lowAvailability = openSlots.length < LOW_AVAILABILITY_THRESHOLD;

  const handleSelect = (iso) => {
    setSelectedIso(iso);
    setError("");
    setWeekStart(startOfWeek(new Date(iso)));
  };

  const handleBook = async () => {
    if (!selectedIso || !mentorId) return;
    const slot = openSlots.find(
      (s) => new Date(s.startTime).getTime() === new Date(selectedIso).getTime()
    );
    if (!slot) {
      setError(t("calendar.slotUnavailable"));
      return;
    }

    setBooking(true);
    setError("");
    try {
      const menteeName =
        `${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`.trim() || "Mentee";
      const meeting = await bookFromAvailability({
        mentorId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        menteeName,
      });
      onBooked?.(meeting);
      onClose?.();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || t("calendar.actionFailed"));
    } finally {
      setBooking(false);
    }
  };

  const handleRequestMore = async () => {
    if (!mentorId) return;
    setRequesting(true);
    setError("");
    setInfo("");
    try {
      await availabilityService.requestMoreAvailability(mentorId, requestNote);
      setInfo(t("calendar.availabilityRequestSent"));
      setRequestNote("");
    } catch (err) {
      setError(err?.response?.data?.error || err.message || t("calendar.actionFailed"));
    } finally {
      setRequesting(false);
    }
  };

  const mentorName = mentor
    ? `${mentor.firstName || ""} ${mentor.lastName || ""}`.trim()
    : "";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{t("mentors.bookWith", { name: mentorName })}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("calendar.hintSelectOne")}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {info && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setInfo("")}>
            {info}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {selectableSlots.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                {t("calendar.noAvailability")}
              </Alert>
            ) : (
              <>
                {lowAvailability && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {t("calendar.lowAvailability", { count: openSlots.length })}
                  </Alert>
                )}
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  {t("calendar.openSlotsList", { count: openSlots.length })}
                </Typography>
                <Stack spacing={1} sx={{ mb: 2 }}>
                  {openSlots.map((slot) => {
                    const active =
                      selectedIso &&
                      new Date(selectedIso).getTime() === new Date(slot.startTime).getTime();
                    return (
                      <Button
                        key={slot.startTime}
                        variant={active ? "contained" : "outlined"}
                        onClick={() => handleSelect(slot.startTime)}
                        sx={{ justifyContent: "flex-start", py: 1.25 }}
                      >
                        {formatDateTime(slot.startTime, locale)}
                      </Button>
                    );
                  })}
                </Stack>

                <WeekCalendar
                  weekStart={weekStart}
                  onWeekChange={setWeekStart}
                  mode="select-one"
                  selectableSlots={selectableSlots}
                  selectedSlots={selectedIso ? [selectedIso] : []}
                  events={availabilityEvents}
                  onSelectSlot={handleSelect}
                  disablePast
                />
              </>
            )}

            {lowAvailability && (
              <Box sx={{ mt: 3, p: 2, border: "1px dashed", borderColor: "divider", borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  {t("calendar.requestMoreAvailabilityTitle")}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {t("calendar.requestMoreAvailabilityHint")}
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  label={t("calendar.requestMoreAvailabilityNote")}
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  sx={{ mb: 1.5 }}
                />
                <Button
                  variant="outlined"
                  onClick={handleRequestMore}
                  disabled={requesting || Boolean(info)}
                >
                  {requesting ? (
                    <CircularProgress size={22} color="inherit" />
                  ) : (
                    t("calendar.requestMoreAvailability")
                  )}
                </Button>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={booking || requesting}>
          {t("common.cancel")}
        </Button>
        <Button
          variant="contained"
          onClick={handleBook}
          disabled={!selectedIso || booking || loading || selectableSlots.length === 0}
        >
          {booking ? <CircularProgress size={22} color="inherit" /> : t("mentors.confirmBooking")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
