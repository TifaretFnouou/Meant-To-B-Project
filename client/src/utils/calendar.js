import { brand } from "../theme/brand";

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
  matched: { bg: brand.lavenderSoft, border: brand.lavender, text: brand.charcoal },
  proposed: { bg: brand.peachSoft, border: brand.peach, text: "#A8796C" },
  pending: { bg: brand.yellowSoft, border: brand.pastelYellow, text: "#9A7B3C" },
  completed: { bg: "rgba(59,59,59,0.08)", border: "#9CA3AF", text: brand.charcoal },
  selected: { bg: brand.dustyRoseSoft, border: brand.dustyRose, text: brand.dustyRose },
};
