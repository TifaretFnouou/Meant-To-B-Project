import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  InputBase,
  Avatar,
  Fab,
  Grow,
  Chip,
  Stack,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { useNavigate } from "react-router-dom";
import { sendChatMessage } from "../../services/chatApiService";
import { useLanguage } from "../../context/LanguageContext";
import { brand } from "../../theme/brand";
import ChatMentorCard from "./ChatMentorCard";

const SUGGESTION_KEYS = [
  "chat.suggestion1",
  "chat.suggestion2",
  "chat.suggestion3",
  "chat.suggestionBook",
];
const MAX_INPUT_LENGTH = 2000;
const MAX_UI_MESSAGES = 40;
const CHAT_BOT_LOGO = "/logo.png";

/** Brand logo avatar for the chat FAB + header */
function ChatBotAvatar({ size = 36 }) {
  return (
    <Box
      component="img"
      src={CHAT_BOT_LOGO}
      alt=""
      aria-hidden
      sx={{
        width: size,
        height: size,
        display: "block",
        flexShrink: 0,
        objectFit: "contain",
        borderRadius: "50%",
        bgcolor: brand.white,
      }}
    />
  );
}

const typingDot = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  bgcolor: brand.dustyRose,
  animation: "chatDot 1.2s infinite ease-in-out",
};

export default function ChatWidget() {
  const { t, language, isRtl } = useLanguage();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const fabRef = useRef(null);
  const dialogRef = useRef(null);
  const messagesRef = useRef([]);
  const requestRef = useRef(null);
  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);
  const messageIdRef = useRef(0);
  const languageRef = useRef(language);
  const shouldAutoScrollRef = useRef(true);

  const nextMessageId = () => {
    messageIdRef.current += 1;
    return `chat-${Date.now()}-${messageIdRef.current}`;
  };

  const trimMessages = (items) => items.slice(-MAX_UI_MESSAGES);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    if (isOpen) {
      const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 150);
      return () => window.clearTimeout(focusTimer);
    }
    return undefined;
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && shouldAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, isOpen]);

  const closeChat = () => {
    setIsOpen(false);
    window.setTimeout(() => fabRef.current?.focus(), 0);
  };

  const handleDialogKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeChat();
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll(
      'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable?.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const send = async (text) => {
    const userMessage = typeof text === "string" ? text.trim().slice(0, MAX_INPUT_LENGTH) : "";
    if (!userMessage || inFlightRef.current) return;

    setInput("");
    const nextMessages = trimMessages([
      ...messagesRef.current,
      { id: nextMessageId(), role: "user", content: userMessage },
    ]);
    messagesRef.current = nextMessages;
    setMessages(nextMessages);
    shouldAutoScrollRef.current = true;
    inFlightRef.current = true;
    setLoading(true);
    const controller = new AbortController();
    requestRef.current = controller;

    try {
      // שולחים את שפת הממשק כדי שהתשובה תתיישר עם כפתור השפה ולא עם שפת ההקלדה
      let requestLanguage = languageRef.current;
      let result = await sendChatMessage(nextMessages, requestLanguage, {
        signal: controller.signal,
      });

      // אם השפה הוחלפה בזמן ההמתנה, מבקשים מחדש פעם אחת בשפה הנוכחית.
      if (languageRef.current !== requestLanguage) {
        requestLanguage = languageRef.current;
        result = await sendChatMessage(nextMessages, requestLanguage, {
          signal: controller.signal,
        });
      }
      if (!mountedRef.current) return;

      const updatedMessages = trimMessages([
        ...nextMessages,
        {
          id: nextMessageId(),
          role: "assistant",
          content: result.reply,
          mentors: result.mentors,
          slots: result.slots,
          meeting: result.meeting,
        },
      ]);
      messagesRef.current = updatedMessages;
      setMessages(updatedMessages);
    } catch (err) {
      if (!mountedRef.current || err.code === "ABORTED") return;

      const messageKey =
        err.code === "RATE_LIMITED"
          ? "chat.rateLimit"
          : err.code === "TIMEOUT"
            ? "chat.timeout"
            : err.code === "NOT_CONFIGURED"
              ? "chat.notConfigured"
            : "chat.fallback";
      const updatedMessages = trimMessages([
        ...nextMessages,
        { id: nextMessageId(), role: "assistant", contentKey: messageKey },
      ]);
      messagesRef.current = updatedMessages;
      setMessages(updatedMessages);
    } finally {
      inFlightRef.current = false;
      requestRef.current = null;
      if (mountedRef.current) setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    send(input);
  };

  return (
    <Box dir={isRtl ? "rtl" : "ltr"}>
      <style>{`
        @keyframes chatDot {
          0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-3px); }
        }
      `}</style>

      {!isOpen && (
        <Tooltip title={t("chat.open")} placement={isRtl ? "left" : "right"}>
          <Fab
            ref={fabRef}
            onClick={() => {
              shouldAutoScrollRef.current = true;
              setIsOpen(true);
            }}
            aria-label={t("chat.open")}
            sx={{
              position: "fixed",
              bottom: 20,
              right: 20,
              zIndex: 1600,
              width: 60,
              height: 60,
              bgcolor: brand.white,
              boxShadow: `0 10px 28px ${brand.dustyRoseSoft}`,
              overflow: "hidden",
              "&:hover": {
                bgcolor: brand.yellowSoft,
                transform: "translateY(-2px)",
              },
              transition: "transform 0.25s ease",
            }}
          >
            <ChatBotAvatar size={56} />
          </Fab>
        </Tooltip>
      )}

      <Grow in={isOpen} unmountOnExit style={{ transformOrigin: "bottom right" }}>
        <Paper
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-dialog-title"
          aria-describedby="chat-dialog-subtitle"
          onKeyDown={handleDialogKeyDown}
          sx={{
            position: "fixed",
            bottom: "max(20px, env(safe-area-inset-bottom))",
            right: 20,
            zIndex: 1600,
            width: { xs: "calc(100vw - 40px)", sm: 390 },
            height: { xs: "min(70dvh, calc(100dvh - 40px))", sm: 560 },
            maxHeight: "calc(100dvh - 40px)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: 5,
            border: `1px solid ${brand.dustyRoseSoft}`,
            boxShadow: `0 22px 48px ${brand.peachSoft}`,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              px: 2,
              py: 1.5,
              background: `linear-gradient(135deg, ${brand.dustyRose} 0%, ${brand.peach} 100%)`,
              color: brand.white,
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: brand.white,
                overflow: "hidden",
              }}
            >
              <ChatBotAvatar size={32} />
            </Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography id="chat-dialog-title" variant="subtitle2" fontWeight={800} noWrap>
                {t("chat.title")}
              </Typography>
              <Typography
                id="chat-dialog-subtitle"
                variant="caption"
                sx={{ opacity: 0.85 }}
                noWrap
                component="div"
              >
                {t("chat.subtitle")}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={closeChat}
              aria-label={t("chat.close")}
              sx={{ color: brand.white }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box
            ref={messagesContainerRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            onScroll={(event) => {
              const element = event.currentTarget;
              shouldAutoScrollRef.current =
                element.scrollHeight - element.scrollTop - element.clientHeight < 80;
            }}
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              px: 1.75,
              py: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1.25,
              background: `linear-gradient(180deg, ${brand.white} 0%, ${brand.yellowSoft} 100%)`,
            }}
          >
            {messages.length === 0 && (
              <>
                {/* נגזרת מהשפה הנוכחית כדי להתחלף מיד עם כפתור השפה */}
                <Bubble variant="assistant">{t("chat.greeting")}</Bubble>
                <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75, mt: 0.5 }}>
                  {SUGGESTION_KEYS.map((key) => (
                    <Chip
                      key={key}
                      label={t(key)}
                      size="small"
                      disabled={loading}
                      onClick={() => send(t(key))}
                      sx={{
                        bgcolor: brand.white,
                        border: `1px solid ${brand.peach}`,
                        color: brand.charcoal,
                        fontSize: 12,
                        "&:hover": { bgcolor: brand.peachSoft },
                      }}
                    />
                  ))}
                </Stack>
              </>
            )}

            {messages.map((msg) => (
              <React.Fragment key={msg.id}>
                {(msg.content || msg.contentKey) && (
                  <Bubble variant={msg.role}>
                    {msg.contentKey ? t(msg.contentKey) : msg.content}
                  </Bubble>
                )}
                {msg.mentors?.length > 0 && (
                  <Stack spacing={1} sx={{ width: "100%" }}>
                    {msg.mentors.map((mentor, mentorIndex) => (
                      <ChatMentorCard
                        key={mentor.id || `${msg.id}-mentor-${mentorIndex}`}
                        mentor={mentor}
                      />
                    ))}
                  </Stack>
                )}
                {msg.meeting?.id && (
                  <Chip
                    size="small"
                    label={t("chat.meetingRequested")}
                    onClick={() => navigate("/Meetings")}
                    sx={{
                      alignSelf: "flex-start",
                      bgcolor: brand.lavenderRgb,
                      color: brand.charcoal,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  />
                )}
              </React.Fragment>
            ))}

            {loading && (
              <Box
                aria-label={t("chat.typing")}
                sx={{
                  alignSelf: "flex-start",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.6,
                  px: 1.75,
                  py: 1.25,
                  borderRadius: "16px 16px 16px 4px",
                  bgcolor: brand.white,
                  border: `1px solid ${brand.dustyRoseSoft}`,
                }}
              >
                <Box sx={typingDot} />
                <Box sx={{ ...typingDot, animationDelay: "0.15s" }} />
                <Box sx={{ ...typingDot, animationDelay: "0.3s" }} />
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Box>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              p: 1.25,
              borderTop: `1px solid ${brand.dustyRoseSoft}`,
              bgcolor: brand.white,
            }}
          >
            <InputBase
              inputRef={inputRef}
              value={input}
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("chat.placeholder")}
              inputProps={{
                "aria-label": t("chat.placeholder"),
                maxLength: MAX_INPUT_LENGTH,
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && event.nativeEvent.isComposing) {
                  event.preventDefault();
                }
              }}
              sx={{
                flexGrow: 1,
                px: 1.75,
                py: 0.9,
                fontSize: 14,
                borderRadius: 999,
                bgcolor: brand.peachRgb,
                border: `1px solid ${brand.dustyRoseSoft}`,
                "&.Mui-focused": { borderColor: brand.dustyRose },
              }}
            />
            <IconButton
              type="submit"
              disabled={loading || !input.trim()}
              aria-label={t("chat.send")}
              sx={{
                width: 40,
                height: 40,
                color: brand.white,
                background: `linear-gradient(135deg, ${brand.dustyRose} 0%, ${brand.peach} 100%)`,
                "&:hover": { background: `linear-gradient(135deg, #B86F82 0%, ${brand.dustyRose} 100%)` },
                "&.Mui-disabled": { background: brand.dustyRoseSoft, color: brand.white },
              }}
            >
              <SendRoundedIcon
                fontSize="small"
                sx={{ transform: isRtl ? "scaleX(-1)" : "none" }}
              />
            </IconButton>
          </Box>
        </Paper>
      </Grow>
    </Box>
  );
}

function Bubble({ variant, children }) {
  const isUser = variant === "user";

  return (
    <Box
      sx={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "85%",
        px: 1.75,
        py: 1.15,
        fontSize: 14,
        lineHeight: 1.55,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        color: isUser ? brand.white : brand.charcoal,
        background: isUser
          ? `linear-gradient(135deg, ${brand.dustyRose} 0%, ${brand.peach} 100%)`
          : brand.white,
        border: isUser ? "none" : `1px solid ${brand.dustyRoseSoft}`,
        boxShadow: isUser ? `0 6px 16px ${brand.dustyRoseSoft}` : "none",
      }}
    >
      {children}
    </Box>
  );
}
