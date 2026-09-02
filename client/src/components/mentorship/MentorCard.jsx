import React from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Button,
  Box,
  Avatar,
  Stack,
} from "@mui/material";
import WorkIcon from "@mui/icons-material/Work";
import TimerIcon from "@mui/icons-material/Timer";
import EventIcon from "@mui/icons-material/Event";
import { useLanguage } from "../../context/LanguageContext";
import { brand } from "../../theme/brand";

export default function MentorCard({
  mentor,
  onExpressInterest,
  hasPendingRequest,
  canExpressInterest = true,
}) {
  const { t } = useLanguage();
  const profile = mentor.mentorProfile;
  const initials = `${mentor.firstName?.[0] || ""}${mentor.lastName?.[0] || ""}`;

  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <Avatar
            src={mentor.profilePicture || undefined}
            sx={{ width: 48, height: 48, bgcolor: brand.dustyRose }}
          >
            {initials}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {mentor.firstName} {mentor.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {mentor.jobTitle} · {mentor.company}
            </Typography>
          </Box>
        </Box>

        <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
          {profile?.bio}
        </Typography>

        <Stack direction="row" spacing={0.5} sx={{ mb: 1, flexWrap: "wrap", gap: 0.5 }}>
          {profile?.topics?.map((topic) => (
            <Chip key={topic} label={topic} size="small" color="primary" variant="outlined" />
          ))}
        </Stack>

        <Stack direction="row" spacing={2} sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <WorkIcon fontSize="small" sx={{ color: brand.dustyRose }} />
            <Typography variant="caption">{mentor.yearsOfExperience} {t("mentors.yearsExp")}</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <EventIcon fontSize="small" sx={{ color: brand.dustyRose }} />
            <Typography variant="caption">{t("mentors.maxSessions", { count: profile?.maxSessions })}</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <TimerIcon fontSize="small" sx={{ color: brand.dustyRose }} />
            <Typography variant="caption">{t("mentors.sessionLength", { min: profile?.sessionLengthMinutes })}</Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.5} sx={{ mt: 1.5, flexWrap: "wrap", gap: 0.5 }}>
          {mentor.techStack?.map((tech) => (
            <Chip key={tech} label={tech} size="small" />
          ))}
        </Stack>
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0 }}>
        {canExpressInterest ? (
          <Button
            fullWidth
            variant="contained"
            onClick={() => onExpressInterest(mentor)}
            disabled={hasPendingRequest}
          >
            {hasPendingRequest ? t("mentors.requestPending") : t("mentors.expressInterest")}
          </Button>
        ) : (
          <Button fullWidth variant="outlined" disabled>
            {t("mentors.browseOnly")}
          </Button>
        )}
      </CardActions>
    </Card>
  );
}
