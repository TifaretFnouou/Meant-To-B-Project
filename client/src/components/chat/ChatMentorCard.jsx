import React from "react";
import { Box, Typography, Chip, Avatar, Stack, Button, Tooltip, IconButton } from "@mui/material";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import GitHubIcon from "@mui/icons-material/GitHub";
import WorkIcon from "@mui/icons-material/Work";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { brand } from "../../theme/brand";

const MAX_TECH_CHIPS = 4;

// כתובות שנשמרו בפרופיל לא תמיד כוללות פרוטוקול, ובלי זה הדפדפן מתייחס אליהן כנתיב יחסי
const toExternalUrl = (rawUrl, domain) => {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) return null;
  try {
    const value = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (
      url.protocol !== "https:" ||
      (hostname !== domain && !hostname.endsWith(`.${domain}`))
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
};

export default function ChatMentorCard({ mentor = {} }) {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const initials = `${mentor.firstName?.[0] || ""}${mentor.lastName?.[0] || ""}`.trim();
  const subtitle = [mentor.jobTitle, mentor.company].filter(Boolean).join(" · ");
  const linkedinUrl = toExternalUrl(mentor.linkedinUrl, "linkedin.com");
  const githubUrl = toExternalUrl(mentor.githubUrl, "github.com");
  const techStack = [...new Set(Array.isArray(mentor.techStack) ? mentor.techStack : [])];
  const adviceTopics = [
    ...new Set(Array.isArray(mentor.adviceTopics) ? mentor.adviceTopics : []),
  ];
  const extraTech = techStack.length - MAX_TECH_CHIPS;

  return (
    <Box
      sx={{
        alignSelf: "flex-start",
        width: "100%",
        p: 1.5,
        borderRadius: 4,
        background: `linear-gradient(135deg, ${brand.white} 0%, ${brand.peachRgb} 100%)`,
        border: `1px solid ${brand.dustyRoseSoft}`,
        boxShadow: `0 8px 20px ${brand.peachSoft}`,
      }}
    >
      <Box sx={{ display: "flex", gap: 1.25, alignItems: "center" }}>
        <Avatar
          src={mentor.profilePicture || undefined}
          imgProps={{ alt: mentor.name || "" }}
          aria-label={mentor.name || undefined}
          sx={{ width: 44, height: 44, bgcolor: brand.dustyRose, fontSize: 15, fontWeight: 700 }}
        >
          {initials}
        </Avatar>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant="subtitle2" fontWeight={800} noWrap sx={{ color: brand.charcoal }}>
            {mentor.name}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" noWrap component="div">
              {subtitle}
            </Typography>
          )}
        </Box>

        <Stack direction="row" spacing={0.25}>
          {linkedinUrl && (
            <Tooltip title="LinkedIn">
              <IconButton
                size="small"
                component="a"
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`LinkedIn – ${mentor.name}`}
                sx={{ color: brand.dustyRose }}
              >
                <LinkedInIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {githubUrl && (
            <Tooltip title="GitHub">
              <IconButton
                size="small"
                component="a"
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`GitHub – ${mentor.name}`}
                sx={{ color: brand.charcoal }}
              >
                <GitHubIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>

      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
        <WorkIcon sx={{ fontSize: 15, color: brand.dustyRose }} />
        <Typography variant="caption" sx={{ color: brand.charcoal }}>
          {t("chat.yearsExp", { count: mentor.yearsOfExperience })}
        </Typography>
      </Stack>

      {mentor.bio && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            mt: 0.75,
          }}
        >
          {mentor.bio}
        </Typography>
      )}

      {adviceTopics.length > 0 && (
        <Stack direction="row" sx={{ mt: 1, flexWrap: "wrap", gap: 0.5 }}>
          {adviceTopics.map((topic) => (
            <Chip
              key={topic}
              label={topic}
              size="small"
              sx={{
                height: 22,
                fontSize: 11,
                bgcolor: brand.lavenderRgb,
                color: brand.charcoal,
              }}
            />
          ))}
        </Stack>
      )}

      {techStack.length > 0 && (
        <Stack direction="row" sx={{ mt: 0.5, flexWrap: "wrap", gap: 0.5 }}>
          {techStack.slice(0, MAX_TECH_CHIPS).map((tech) => (
            <Chip
              key={tech}
              label={tech}
              size="small"
              variant="outlined"
              sx={{ height: 22, fontSize: 11, borderColor: brand.peach, color: brand.charcoal }}
            />
          ))}
          {extraTech > 0 && (
            <Chip
              label={`+${extraTech}`}
              size="small"
              variant="outlined"
              sx={{ height: 22, fontSize: 11, borderColor: brand.peach, color: brand.charcoal }}
            />
          )}
        </Stack>
      )}

      <Button
        fullWidth
        size="small"
        variant="contained"
        onClick={() =>
          isAuthenticated
            ? navigate("/mentors")
            : navigate("/login", { state: { from: { pathname: "/mentors" } } })
        }
        sx={{ mt: 1.25, fontSize: 12, py: 0.75 }}
      >
        {t("chat.viewCatalog")}
      </Button>
    </Box>
  );
}
