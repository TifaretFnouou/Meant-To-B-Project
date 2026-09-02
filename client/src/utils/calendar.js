const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Monday as first day of week */
export function startOfWeek(date) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

export function getWeekDays(weekStart) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function toSlotIso(day, hour, minute = 0) {
  const d = new Date(day);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function slotKey(iso) {
  return new Date(iso).toISOString();
}

export function isSameSlot(a, b) {
  return new Date(a).getTime() === new Date(b).getTime();
}

export function formatDayLabel(date, locale = "he-IL") {
  return date.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
}

export function formatTime(iso, locale = "he-IL") {
  return new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(iso, locale = "he-IL") {
  return new Date(iso).toLocaleString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function buildHourSlots(startHour = 8, endHour = 20, stepMinutes = 60) {
  const slots = [];
  for (let h = startHour; h < endHour; h += 1) {
    for (let m = 0; m < 60; m += stepMinutes) {
      if (h === endHour - 1 && m > 0 && stepMinutes < 60) break;
      slots.push({ hour: h, minute: m });
    }
  }
  return slots;
}

export function eventsOnDay(events, day) {
  const start = startOfDay(day).getTime();
  const end = start + DAY_MS;
  return events.filter((e) => {
    const t = new Date(e.start).getTime();
    return t >= start && t < end;
  });
}

export const EVENT_COLORS = {
  matched: { bg: "rgba(16,185,129,0.18)", border: "#10b981", text: "#047857" },
  proposed: { bg: "rgba(99,102,241,0.16)", border: "#6366f1", text: "#4338ca" },
  pending: { bg: "rgba(245,158,11,0.18)", border: "#f59e0b", text: "#b45309" },
  completed: { bg: "rgba(100,116,139,0.16)", border: "#64748b", text: "#475569" },
  selected: { bg: "rgba(124,58,237,0.22)", border: "#7c3aed", text: "#5b21b6" },
};
