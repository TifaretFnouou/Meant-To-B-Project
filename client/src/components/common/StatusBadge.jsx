import React from "react";
import { Chip } from "@mui/material";
import { useLanguage } from "../../context/LanguageContext";

// Colors mapped by the ACTUAL status values used across the app
// (uppercase enum values from the backend, e.g. "PENDING_MENTOR_APPROVAL", "NO_SHOW").
// Keys here are lowercased because we normalize the incoming status/schedulingState
// to lowercase before looking it up - see `normalizedKey` below.

const colorMap = {
  pending_mentor_times: "warning",
  pending_mentee_selection: "warning",
  pending_mentor_approval: "warning",
  matched: "success",
  attendance_confirmed: "info",
  completed: "default",
  feedback_filled: "primary",
  cancelled: "error",
  no_show: "error",

  // Legacy / alternate keys kept for backward compatibility with older
  // schedulingState values that might still exist on old records.

  pending: "warning",
  slots_proposed: "info",
  reschedule: "secondary",
  pending_request: "warning",
  rejected: "error",
  slot_selected: "info",
  additional_slots_requested: "warning",
  additional_slots_proposed: "info",
  reschedule_requested: "secondary",
};

// Readable fallback label, e.g. "NO_SHOW" -> "No Show", "PENDING_MENTOR_APPROVAL" -> "Pending Mentor Approval".
// Used whenever there is no matching translation key in the language file,
// so we never show the raw ALL_CAPS enum value to the user.

function toReadableLabel(rawKey) {
  if (!rawKey) return "";
  return String(rawKey)
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function StatusBadge({ status, schedulingState }) {
  const { t } = useLanguage();

  const rawKey = schedulingState || status || "";
  const normalizedKey = rawKey.toLowerCase();

  const translationKey = `status.${normalizedKey}`;
  const translated = t(translationKey);

  // If a real translation exists for this key, use it.
  // Otherwise, fall back to a readable version of the raw status
  // instead of dumping the ALL_CAPS enum value on screen.
  const label = translated !== translationKey ? translated : toReadableLabel(rawKey);

  const color = colorMap[normalizedKey] || "default";

  return <Chip label={label} color={color} size="small" sx={{ fontWeight: 600 }} />;
}