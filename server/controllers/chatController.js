import {
  getActiveMentors,
  getMentorsByTech,
  isMentoringDomainQuestion,
} from "../services/chatAgentService.js";
import { runLlmTurn } from "../services/chatLlmService.js";

function outOfScopeResponse() {
  return "אני עוזרת בנושאי מנטורינג באתר Meant To B: חיפוש מנטוריות, תיאום פגישות, וניווט בפלטפורמה.";
}

export async function chatController(req, res) {
  try {
    const message = req.body?.message;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ message: "Message is required" });
    }

    if (!isMentoringDomainQuestion(message)) {
      return res.status(200).json({
        reply: outOfScopeResponse(),
        source: "guardrail",
      });
    }

    const reply = await runLlmTurn({
      userMessage: message,
      toolRunner: async (toolName, args) => {
        if (toolName === "getMentorsByTech") {
          return getMentorsByTech(args?.tech);
        }
        if (toolName === "getActiveMentors") {
          return getActiveMentors();
        }
        return { error: `Unknown tool: ${toolName}` };
      },
    });

    return res.status(200).json({ reply, source: "llm" });
  } catch (error) {
    console.error("Chat controller error:", error.message);
    return res.status(503).json({
      reply: "יש כרגע תקלה זמנית בשירות. אפשר לנסות שוב בעוד רגע.",
      source: "fallback",
    });
  }
}
