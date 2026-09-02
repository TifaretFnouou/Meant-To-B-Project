import React from "react";
import { Box, Typography } from "@mui/material";
import { brand } from "../../theme/brand";

export default function PageHeader({ title, subtitle, action }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        mb: 4,
        flexWrap: "wrap",
        gap: 2,
      }}
    >
      <Box>
        <Typography
          variant="h4"
          fontWeight={800}
          sx={{
            background: `linear-gradient(135deg, ${brand.dustyRose}, ${brand.peach})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action}
    </Box>
  );
}
