import React from "react";
import { Chip } from "@mui/material";
import { useLanguage } from "../../context/LanguageContext";

const colorMap = {
  pending: "warning",
  slots_proposed: "info",
  matched: "success",
  cancelled: "error",
  completed: "default",
  reschedule: "secondary",
  pending_request: "warning",
  rejected: "error",
  slot_selected: "info",
  additional_slots_requested: "warning",
  additional_slots_proposed: "info",
  reschedule_requested: "secondary",
};

export default function StatusBadge({ status, schedulingState }) {
  const { t } = useLanguage();
  const key = schedulingState || status;
  const label = t(`status.${key}`) !== `status.${key}` ? t(`status.${key}`) : key;
  const color = colorMap[key] || "default";

  return <Chip label={label} color={color} size="small" sx={{ fontWeight: 600 }} />;
}
