const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

function getProvider() {
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return null;
}

function buildSystemPrompt() {
  return [
    "You are QueenB assistant for the Meant To B mentorship platform.",
    "Only answer about mentorship, mentors, mentees, sessions, scheduling, and platform navigation.",
    "If the user asks outside this scope, politely refuse and redirect to platform-related help.",
    "Never expose private data such as password hashes, phone numbers, personal email addresses, tokens, or raw database objects.",
    "When you share mentor data, keep it concise and professional.",
  ].join(" ");
}

async function callOpenAi({ messages, tools }) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      tools,
      tool_choice: "auto",
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI error: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message;
}

async function callGemini({ messages }) {
  const prompt = messages
    .map((msg) => `${msg.role.toUpperCase()}: ${msg.content || ""}`)
    .join("\n\n");

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2 },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini error: ${response.status} ${text}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return { content: text };
}

export async function runLlmTurn({ userMessage, toolRunner }) {
  const provider = getProvider();

  if (!provider) {
    return "אפשר לעזור בחיפוש מנטוריות ובניווט באתר, אבל שירות הבינה לא הוגדר עדיין בשרת.";
  }

  const systemPrompt = buildSystemPrompt();
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  if (provider === "gemini") {
    const result = await callGemini({ messages });
    return (
      result?.content?.trim() ||
      "לא הצלחתי לייצר תשובה כרגע. אפשר לנסות שאלה נוספת על מנטוריות או פגישות."
    );
  }

  const tools = [
    {
      type: "function",
      function: {
        name: "getMentorsByTech",
        description: "Find mentors by technology or mentoring topic",
        parameters: {
          type: "object",
          properties: {
            tech: {
              type: "string",
              description: "Technology or mentoring topic to search for",
            },
          },
          required: ["tech"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "getActiveMentors",
        description: "List active mentors on the platform",
        parameters: {
          type: "object",
          properties: {},
        },
      },
    },
  ];

  const firstResponse = await callOpenAi({ messages, tools });
  const toolCalls = firstResponse?.tool_calls || [];

  if (!toolCalls.length) {
    return (
      firstResponse?.content?.trim() ||
      "אפשר לשאול אותי על מנטוריות, פגישות, וטכנולוגיות באתר."
    );
  }

  messages.push(firstResponse);

  for (const call of toolCalls) {
    const toolName = call?.function?.name;
    const argsRaw = call?.function?.arguments || "{}";
    const args = JSON.parse(argsRaw);
    const toolResult = await toolRunner(toolName, args);

    messages.push({
      role: "tool",
      tool_call_id: call.id,
      content: JSON.stringify(toolResult),
    });
  }

  const secondResponse = await callOpenAi({ messages, tools });
  return (
    secondResponse?.content?.trim() ||
    "מצאתי מידע רלוונטי, אבל לא הצלחתי לנסח תשובה. אפשר לנסות שוב."
  );
}
