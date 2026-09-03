import React, { useMemo, useState } from "react";
import {
  Badge,
  Box,
  CircularProgress,
  Divider,
  Drawer,
  Fab,
  IconButton,
  List,
  ListItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import { useLanguage } from "../../context/LanguageContext";
import { sendChatMessage } from "../../services/chatService";
import { brand } from "../../theme/brand";

const WELCOME_MESSAGES = {
  he: "היי, אני העוזרת של Meant To B. אפשר לשאול אותי על מנטוריות, פגישות וטכנולוגיות.",
  en: "Hi, I am Meant To B assistant. Ask me about mentors, sessions, and technologies.",
};

export default function ChatWidget() {
  const { t, language, isRtl } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState(() => [
    { id: "welcome", role: "assistant", text: WELCOME_MESSAGES[language] || WELCOME_MESSAGES.he },
  ]);

  const unreadCount = useMemo(
    () => messages.filter((m) => m.role === "assistant").length,
    [messages]
  );

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || isLoading) return;

    const userMessage = { id: `user-${Date.now()}`, role: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setDraft("");
    setIsLoading(true);

    try {
      const data = await sendChatMessage(text);
      const botText = data?.reply || t("chat.fallback");
      setMessages((prev) => [
        ...prev,
        { id: `assistant-${Date.now()}`, role: "assistant", text: botText },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          text: t("chat.fallback"),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <Tooltip title={t("chat.open")} placement={isRtl ? "left" : "right"}>
        <Badge
          color="secondary"
          overlap="circular"
          badgeContent={unreadCount > 9 ? "9+" : unreadCount}
          sx={{
            position: "fixed",
            bottom: 24,
            [isRtl ? "left" : "right"]: 24,
            zIndex: 1300,
            "& .MuiBadge-badge": {
              border: "2px solid white",
            },
          }}
        >
          <Fab color="primary" onClick={() => setIsOpen(true)} aria-label={t("chat.open")}>
            <ChatRoundedIcon />
          </Fab>
        </Badge>
      </Tooltip>

      <Drawer
        anchor={isRtl ? "left" : "right"}
        open={isOpen}
        onClose={() => setIsOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 420 },
            maxWidth: "100vw",
          },
        }}
      >
        <Stack sx={{ height: "100%" }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: `1px solid ${brand.dustyRoseSoft}`,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <SmartToyRoundedIcon color="primary" />
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  {t("chat.title")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t("chat.subtitle")}
                </Typography>
              </Box>
            </Stack>
            <IconButton onClick={() => setIsOpen(false)} aria-label={t("chat.close")}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>

          <List sx={{ flexGrow: 1, overflowY: "auto", px: 1.5, py: 1 }}>
            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <ListItem
                  key={message.id}
                  disableGutters
                  sx={{ justifyContent: isUser ? "flex-end" : "flex-start", py: 0.5 }}
                >
                  <Paper
                    sx={{
                      px: 1.5,
                      py: 1,
                      maxWidth: "90%",
                      background: isUser
                        ? `linear-gradient(135deg, ${brand.dustyRose} 0%, ${brand.peach} 100%)`
                        : "rgba(255,255,255,0.9)",
                      color: isUser ? brand.white : brand.charcoal,
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      {isUser ? (
                        <PersonRoundedIcon fontSize="small" />
                      ) : (
                        <SmartToyRoundedIcon fontSize="small" color="primary" />
                      )}
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {message.text}
                      </Typography>
                    </Stack>
                  </Paper>
                </ListItem>
              );
            })}
            {isLoading && (
              <ListItem disableGutters sx={{ py: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" px={1}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    {t("chat.typing")}
                  </Typography>
                </Stack>
              </ListItem>
            )}
          </List>

          <Divider />
          <Box sx={{ p: 1.5 }}>
            <Stack direction="row" spacing={1}>
              <TextField
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("chat.placeholder")}
                fullWidth
                multiline
                minRows={1}
                maxRows={4}
              />
              <IconButton
                color="primary"
                onClick={handleSend}
                disabled={!draft.trim() || isLoading}
                aria-label={t("chat.send")}
              >
                <SendRoundedIcon />
              </IconButton>
            </Stack>
          </Box>
        </Stack>
      </Drawer>
    </>
  );
}
