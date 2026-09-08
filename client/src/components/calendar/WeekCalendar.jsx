import React, { useMemo } from "react";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  buildHourSlots,
  EVENT_COLORS,
  eventsOnDay,
  formatDayLabel,
  formatTime,
  getWeekDays,
  isSameSlot,
  startOfWeek,
  toSlotIso,
} from "../../utils/calendar";
import { useLanguage } from "../../context/LanguageContext";
import { brand } from "../../theme/brand";

/**
 * Interactive week calendar.
 * mode:
 *  - "view"         - show events only
 *  - "select-multi" - mentor picks availability slots
 *  - "select-one"   - mentee picks one proposed slot
 */

export default function WeekCalendar({
  weekStart,
  onWeekChange,
  mode = "view",
  selectedSlots = [],
  selectableSlots = null,
  onToggleSlot,
  onSelectSlot,
  events = [],
  onEventClick,
  startHour = 8,
  endHour = 20,
  disablePast = false,
}) {
  const { language, t } = useLanguage();
  const locale = language === "he" ? "he-IL" : "en-US";
  const days = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const hours = useMemo(() => buildHourSlots(startHour, endHour, 60), [startHour, endHour]);

  const goPrev = () => onWeekChange?.(new Date(weekStart.getTime() - 7 * 86400000));
  const goNext = () => onWeekChange?.(new Date(weekStart.getTime() + 7 * 86400000));
  const goToday = () => onWeekChange?.(startOfWeek(new Date()));

  const isSelectableCell = (iso) => {
    if (mode === "view") return false;
    if (disablePast && new Date(iso).getTime() <= Date.now()) return false;
    if (mode === "select-one") {
      return selectableSlots?.some((s) => isSameSlot(s, iso));
    }
    return true;
  };

  const handleCellClick = (iso, dayEvents = []) => {
    const meetingEvents = dayEvents.filter(
      (e) => e?.meetingId && e.type !== "available"
    );
    if (meetingEvents.length > 0 && onEventClick) {
      onEventClick(meetingEvents[0]);
      return;
    }
    if (!isSelectableCell(iso)) return;
    if (mode === "select-multi") onToggleSlot?.(iso);
    if (mode === "select-one") onSelectSlot?.(iso);
  };

  return (
    <Paper sx={{ p: 2, overflow: "hidden" }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          {t("calendar.weekOf", {
            date: weekStart.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" }),
          })}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={goToday}>
            {t("calendar.today")}
          </Button>
          <Button size="small" onClick={goPrev} startIcon={<ChevronLeftIcon />}>
            {t("calendar.prev")}
          </Button>
          <Button size="small" onClick={goNext} endIcon={<ChevronRightIcon />}>
            {t("calendar.next")}
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ overflowX: "auto" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `64px repeat(7, minmax(96px, 1fr))`,
            minWidth: 780,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Box sx={{ bgcolor: "grey.50", p: 1, borderBottom: "1px solid", borderColor: "divider" }} />
          {days.map((day) => (
            <Box
              key={day.toISOString()}
              sx={{
                p: 1,
                textAlign: "center",
                bgcolor: "grey.50",
                borderBottom: "1px solid",
                borderLeft: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography variant="caption" fontWeight={700}>
                {formatDayLabel(day, locale)}
              </Typography>
            </Box>
          ))}

          {hours.map(({ hour, minute }) => (
            <React.Fragment key={`${hour}:${minute}`}>
              <Box
                sx={{
                  p: 0.75,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "center",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`}
                </Typography>
              </Box>

              {days.map((day) => {
                const iso = toSlotIso(day, hour, minute);
                const selected = selectedSlots.some((s) => isSameSlot(s, iso));
                const dayEvents = eventsOnDay(events, day).filter((e) => {
                  const eh = new Date(e.start).getHours();
                  return eh === hour;
                });
                const meetingEvents = dayEvents.filter(
                  (e) => e?.meetingId && e.type !== "available"
                );
                const selectable = isSelectableCell(iso);
                const isPast = new Date(iso).getTime() <= Date.now();
                const proposedHighlight =
                  mode === "select-one" && selectableSlots?.some((s) => isSameSlot(s, iso));
                const canOpenMeeting = Boolean(onEventClick) && meetingEvents.length > 0;

                return (
                  <Box
                    key={`${day.toISOString()}-${hour}`}
                    onClick={() => handleCellClick(iso, dayEvents)}
                    sx={{
                      minHeight: 52,
                      borderBottom: "1px solid",
                      borderLeft: "1px solid",
                      borderColor: "divider",
                      p: 0.4,
                      cursor: selectable || canOpenMeeting ? "pointer" : "default",
                      opacity: disablePast && isPast ? 0.35 : 1,
                      bgcolor: selected
                        ? EVENT_COLORS.selected.bg
                        : proposedHighlight
                          ? EVENT_COLORS.available.bg
                          : "transparent",
                      outline: selected ? `2px solid ${EVENT_COLORS.selected.border}` : "none",
                      outlineOffset: -2,
                      transition: "background 0.15s ease",
                      "&:hover":
                        selectable || canOpenMeeting
                          ? { bgcolor: selected ? EVENT_COLORS.selected.bg : brand.peachSoft }
                          : undefined,
                    }}
                  >
                    {dayEvents.map((event) => {
                      const colors = EVENT_COLORS[event.type] || EVENT_COLORS.pending;
                      const isMeeting = Boolean(event.meetingId) && event.type !== "available";
                      return (
                        <Chip
                          key={event.id}
                          size="small"
                          clickable={Boolean(onEventClick) && isMeeting}
                          label={formatTime(event.start, locale)}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isMeeting) onEventClick?.(event);
                          }}
                          sx={{
                            mb: 0.3,
                            width: "100%",
                            height: 24,
                            fontSize: "0.7rem",
                            bgcolor: colors.bg,
                            color: colors.text,
                            border: `1px solid ${colors.border}`,
                            fontWeight: 700,
                            cursor: onEventClick && isMeeting ? "pointer" : "default",
                          }}
                        />
                      );
                    })}
                  </Box>
                );
              })}
            </React.Fragment>
          ))}
        </Box>
      </Box>

      {(mode === "select-multi" || mode === "select-one") && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
          {mode === "select-multi" ? t("calendar.hintSelectMulti") : t("calendar.hintSelectOne")}
        </Typography>
      )}
    </Paper>
  );
}
