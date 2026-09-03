import React, { useState } from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useLanguage } from "../../context/LanguageContext";

export default function PasswordRequirementsInfo() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const title = (
    <Box sx={{ py: 0.25, px: 0.25 }}>
      <Typography variant="caption" fontWeight={700} display="block" sx={{ mb: 0.5 }}>
        {t("auth.passwordRequirementsTitle")}
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2 }}>
        <Typography component="li" variant="caption">
          {t("auth.passwordReqLength")}
        </Typography>
        <Typography component="li" variant="caption">
          {t("auth.passwordReqUppercase")}
        </Typography>
        <Typography component="li" variant="caption">
          {t("auth.passwordReqLowercase")}
        </Typography>
        <Typography component="li" variant="caption">
          {t("auth.passwordReqSpecial")}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Tooltip
      arrow
      title={title}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      enterTouchDelay={0}
      leaveTouchDelay={4000}
    >
      <IconButton
        aria-label={t("auth.passwordRequirementsTitle")}
        size="small"
        edge="end"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        <InfoOutlinedIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
