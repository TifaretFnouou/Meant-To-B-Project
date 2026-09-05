import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import { useThemeMode } from "../../context/ThemeModeContext";
import { useLanguage } from "../../context/LanguageContext";

export default function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useThemeMode();
  const { t } = useLanguage();
  const label = isDarkMode ? t("theme.useLight") : t("theme.useDark");

  return (
    <Tooltip title={label}>
      <IconButton color="inherit" onClick={toggleTheme} aria-label={label}>
        {isDarkMode ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
      </IconButton>
    </Tooltip>
  );
}
