import React, { useEffect, useState } from "react";
import { Alert, AlertTitle, Box, IconButton, Stack, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const AUTO_ROTATE_MS = 6000;

export default function AdminAlertsCarousel({ alerts = [] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // If the alerts list changes (e.g. after a refresh), ensure the index doesn't "get stuck"
  // past the new boundary of the array.
  useEffect(() => {
    if (index >= alerts.length) setIndex(0);
  }, [alerts.length, index]);

  // Automatic scrolling every AUTO_ROTATE_MS, paused when the mouse is over the carousel
  // or when there is only one alert (no point in scrolling).
  useEffect(() => {
    if (paused || alerts.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % alerts.length);
    }, AUTO_ROTATE_MS);
    return () => clearInterval(timer);
  }, [paused, alerts.length]);

  if (alerts.length === 0) return null;

  const current = alerts[index] || alerts[0];

  const goPrev = () => setIndex((prev) => (prev - 1 + alerts.length) % alerts.length);
  const goNext = () => setIndex((prev) => (prev + 1) % alerts.length);

  return (
    <Box
      sx={{ mb: 4 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <IconButton
          size="small"
          onClick={goPrev}
          disabled={alerts.length <= 1}
          aria-label="previous alert"
        >
          <ChevronLeftIcon />
        </IconButton>

        <Alert severity={current.type} sx={{ flex: 1, py: 0.5 }}>
          <AlertTitle sx={{ mb: 0.25 }}>{current.title}</AlertTitle>
          <Typography variant="body2">{current.message}</Typography>
        </Alert>

        <IconButton
          size="small"
          onClick={goNext}
          disabled={alerts.length <= 1}
          aria-label="next alert"
        >
          <ChevronRightIcon />
        </IconButton>
      </Stack>

      {alerts.length > 1 && (
        <Stack direction="row" justifyContent="center" spacing={0.75} sx={{ mt: 1 }}>
          {alerts.map((alert, i) => (
            <Box
              key={alert.id}
              onClick={() => setIndex(i)}
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                cursor: "pointer",
                bgcolor: i === index ? "primary.main" : "grey.300",
                transition: "background-color 0.2s",
              }}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}