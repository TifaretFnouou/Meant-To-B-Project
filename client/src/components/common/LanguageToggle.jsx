import React from "react";
import { Button, Tooltip } from "@mui/material";
import TranslateIcon from "@mui/icons-material/Translate";
import { useLanguage } from "../../context/LanguageContext";

export default function LanguageToggle({ floating = false }) {
  const { language, toggleLanguage, t } = useLanguage();
  const label = language === "he" ? "English" : "עברית";

  const buttonSx = floating
    ? {
        position: "fixed",
        left: 16,
        bottom: 16,
        zIndex: 1500,
        minWidth: 108,
        px: 2,
        py: 1.1,
        borderRadius: 3,
        borderColor: "rgba(124,58,237,0.4)",
        color: "#7c3aed",
        fontWeight: 700,
        bgcolor: "rgba(255,255,255,0.96)",
        boxShadow: "0 8px 24px rgba(124,58,237,0.22)",
        backdropFilter: "blur(8px)",
        "&:hover": {
          bgcolor: "#fff",
          borderColor: "#7c3aed",
          boxShadow: "0 10px 28px rgba(124,58,237,0.3)",
        },
      }
    : {
        flexShrink: 0,
        minWidth: 96,
        borderColor: "rgba(124,58,237,0.4)",
        color: "#7c3aed",
        fontWeight: 700,
        bgcolor: "rgba(124,58,237,0.06)",
        "&:hover": {
          bgcolor: "rgba(124,58,237,0.12)",
          borderColor: "#7c3aed",
        },
      };

  return (
    <Tooltip title={t("common.language")} placement={floating ? "right" : "bottom"}>
      <Button
        onClick={toggleLanguage}
        size="small"
        variant="outlined"
        startIcon={<TranslateIcon />}
        aria-label={t("common.language")}
        sx={buttonSx}
      >
        {label}
      </Button>
    </Tooltip>
  );
}
