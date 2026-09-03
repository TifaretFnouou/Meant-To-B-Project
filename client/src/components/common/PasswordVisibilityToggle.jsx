import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useLanguage } from "../../context/LanguageContext";

export default function PasswordVisibilityToggle({ visible, onToggle }) {
  const { t } = useLanguage();
  const label = t(visible ? "auth.hidePassword" : "auth.showPassword");

  return (
    <Tooltip title={label}>
      <IconButton
        aria-label={label}
        size="small"
        edge="end"
        onMouseDown={(event) => event.preventDefault()}
        onClick={onToggle}
      >
        {visible ? (
          <VisibilityOffIcon fontSize="small" />
        ) : (
          <VisibilityIcon fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  );
}
