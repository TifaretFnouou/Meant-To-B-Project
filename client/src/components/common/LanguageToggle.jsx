import React from "react";
import { Button, Tooltip } from "@mui/material";
import TranslateIcon from "@mui/icons-material/Translate";
import { useLanguage } from "../../context/LanguageContext";
import { brand } from "../../theme/brand";

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
        borderColor: brand.dustyRose,
        color: brand.dustyRose,
        fontWeight: 700,
        bgcolor: "rgba(255,255,255,0.96)",
        boxShadow: `0 8px 24px ${brand.peachSoft}`,
        backdropFilter: "blur(8px)",
        "&:hover": {
          bgcolor: brand.white,
          borderColor: brand.dustyRose,
          boxShadow: `0 10px 28px ${brand.dustyRoseSoft}`,
        },
      }
    : {
        flexShrink: 0,
        minWidth: 96,
        borderColor: brand.peach,
        color: brand.dustyRose,
        fontWeight: 700,
        bgcolor: brand.peachSoft,
        "&:hover": {
          bgcolor: brand.dustyRoseSoft,
          borderColor: brand.dustyRose,
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
