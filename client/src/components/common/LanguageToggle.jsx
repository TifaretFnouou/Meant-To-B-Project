import React from "react";
import { Button, Tooltip } from "@mui/material";
import TranslateIcon from "@mui/icons-material/Translate";
import { useLanguage } from "../../context/LanguageContext";

export default function LanguageToggle() {
  const { language, toggleLanguage, t } = useLanguage();
  const label = language === "he" ? "English" : "עברית";

  return (
    <Tooltip title={t("common.language")}>
      <Button
        onClick={toggleLanguage}
        size="small"
        variant="outlined"
        startIcon={<TranslateIcon />}
        sx={{
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
        }}
      >
        {label}
      </Button>
    </Tooltip>
  );
}
