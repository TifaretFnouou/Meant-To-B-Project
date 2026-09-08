import { getStoredToken } from "./api";

const API_BASE_URL = (process.env.REACT_APP_API_URL || "/api/v1").replace(/\/+$/, "");
const REQUEST_TIMEOUT_MS = 55_000;

function formatSlotHint(slot) {
  if (!slot?.startTime) return null;
  try {
    return new Date(slot.startTime).toISOString();
  } catch {
    return null;
  }
}

/**
 * Enrich assistant turns so the model remembers mentor ids / offered slots
 * across turns (the UI cards are not sent as structured data otherwise).
 */
function toModelContent(message) {
  let content = typeof message.content === "string" ? message.content.trim() : "";
  if (!content) return "";

  if (message.role === "assistant" && Array.isArray(message.mentors) && message.mentors.length) {
    const mentorHints = message.mentors
      .filter((mentor) => mentor?.id)
      .map((mentor) => `${mentor.name || "Mentor"}|id=${mentor.id}`)
      .join("; ");
    if (mentorHints) {
      content = `${content}\n[Mentors available to book: ${mentorHints}]`;
    }
  }

  if (message.role === "assistant" && Array.isArray(message.slots) && message.slots.length) {
    const slotHints = message.slots
      .map(formatSlotHint)
      .filter(Boolean)
      .map((iso, index) => `${index + 1}:${iso}`)
      .join(", ");
    if (slotHints) {
      content = `${content}\n[Open slots (ISO): ${slotHints}]`;
    }
  }

  if (message.role === "assistant" && message.meeting?.id) {
    content = `${content}\n[Meeting request created: id=${message.meeting.id} status=${message.meeting.status || "pending"}]`;
  }

  return content;
}

export async function sendChatMessage(messages, language = "he", { signal } = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const abortRequest = () => controller.abort();

  if (signal?.aborted) {
    controller.abort();
  } else {
    signal?.addEventListener("abort", abortRequest, { once: true });
  }

  try {
    // Just if we don't send back mentor ids and meeting tokens from the UI; just the chat content needed for the model
    const conversation = (Array.isArray(messages) ? messages : [])
      .slice(-20)
      .map((message) => ({
        role: message.role,
        content: toModelContent(message),
      }))
      .filter(
        ({ role, content }) =>
          (role === "user" || role === "assistant") &&
          typeof content === "string" &&
          content.trim()
      );

    const headers = {
      "Content-Type": "application/json",
    };
    const token = getStoredToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({ messages: conversation, language }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const details = await response.json().catch(() => ({}));
      const error = new Error(details.error || `Chat request failed (${response.status})`);
      error.code = details.code || "SERVER_ERROR";
      throw error;
    }

    const data = await response.json();
    if (
      !data ||
      typeof data.reply !== "string" ||
      !data.reply.trim() ||
      !Array.isArray(data.mentors)
    ) {
      const error = new Error("Chat server returned an invalid response");
      error.code = "INVALID_RESPONSE";
      throw error;
    }

    return {
      reply: data.reply,
      mentors: data.mentors || [],
      slots: Array.isArray(data.slots) ? data.slots : [],
      meeting: data.meeting && typeof data.meeting === "object" ? data.meeting : null,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      const abortError = new Error(signal?.aborted ? "Chat request cancelled" : "Chat request timed out");
      abortError.code = signal?.aborted ? "ABORTED" : "TIMEOUT";
      throw abortError;
    }

    console.error("Chat API Error:", error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abortRequest);
  }
}
