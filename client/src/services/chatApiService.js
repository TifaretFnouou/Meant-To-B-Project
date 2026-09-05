const API_BASE_URL = (process.env.REACT_APP_API_URL || "/api/v1").replace(/\/+$/, "");
const REQUEST_TIMEOUT_MS = 30_000;

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
    // לא שולחים חזרה לשרת id-ים וכרטיסי מנטוריות מה-UI; רק את תוכן השיחה הנחוץ למודל
    const conversation = (Array.isArray(messages) ? messages : [])
      .slice(-20)
      .filter(
        ({ role, content }) =>
          (role === "user" || role === "assistant") &&
          typeof content === "string" &&
          content.trim()
      )
      .map(({ role, content }) => ({ role, content }));

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

    return { reply: data.reply, mentors: data.mentors || [] };
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
