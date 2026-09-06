import { processChatWithAI } from "../services/aiChatService.js";

const MAX_HISTORY = 20;
const MAX_MESSAGE_LENGTH = 2000;
const SUPPORTED_LANGUAGES = new Set(["he", "en"]);

  // The client can send any JSON, so we only keep valid role/content and prevent system prompt injection
const sanitizeMessages = (messages) => {
  const sanitized = messages
    .slice(-MAX_HISTORY * 2)
    .filter(
      (message) =>
        message &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim()
    )
    .slice(-MAX_HISTORY)
    .map((message) => ({
      role: message.role,
      content: message.content
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
        .trim()
        .slice(0, MAX_MESSAGE_LENGTH),
    }))
    .filter((message) => message.content);

  // מאחדים תפקידים רצופים כדי לשמור היסטוריה תקינה גם מול לקוח פגום או זדוני
  return sanitized.reduce((result, message) => {
    if (result.length === 0 && message.role === "assistant") {
      return result;
    }
    const previous = result[result.length - 1];
    if (previous?.role === message.role) {
      previous.content = `${previous.content}\n${message.content}`.slice(-MAX_MESSAGE_LENGTH);
    } else {
      result.push(message);
    }
    return result;
  }, []);
};

export const handleChat = async (req, res) => {
  try {
    const { messages, language } =
      req.body && typeof req.body === "object" ? req.body : {};

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const sanitized = sanitizeMessages(messages);

    if (sanitized.length === 0) {
      return res.status(400).json({ error: "At least one valid message is required" });
    }

    if (sanitized[sanitized.length - 1].role !== "user") {
      return res.status(400).json({ error: "The last valid message must be from the user" });
    }

    const safeLanguage = SUPPORTED_LANGUAGES.has(language) ? language : "he";
    const { reply, mentors } = await processChatWithAI(sanitized, safeLanguage);

    res.status(200).json({
      reply: typeof reply === "string" ? reply : "",
      mentors: Array.isArray(mentors) ? mentors : [],
    });
  } catch (error) {
    console.error("Chat Controller Error:", error);

    if (error.code === "CHAT_NOT_CONFIGURED") {
      return res.status(503).json({ code: "NOT_CONFIGURED", error: "Chat service is not configured" });
    }

    if (error.status === 401) {
      return res.status(503).json({ code: "NOT_CONFIGURED", error: "Chat service credentials are invalid" });
    }

    if (error.status === 429) {
      return res.status(429).json({ code: "RATE_LIMITED", error: "Chat service quota exceeded" });
    }

    if (
      error.status === 408 ||
      error.code === "ETIMEDOUT" ||
      error.name === "APIConnectionTimeoutError"
    ) {
      return res.status(504).json({ code: "TIMEOUT", error: "Chat service timed out" });
    }

    if (error.status >= 400 && error.status < 500) {
      return res.status(502).json({ code: "PROVIDER_ERROR", error: "Chat provider rejected the request" });
    }

    res.status(500).json({ code: "SERVER_ERROR", error: "Internal server error in chat processing" });
  }
};
