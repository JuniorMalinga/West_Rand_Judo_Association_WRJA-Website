// Same-origin by default (Vite proxies /api to the server in development).
const CHAT_SERVER_URL = import.meta.env.VITE_CHAT_SERVER_URL || "";

export class ChatApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ChatApiError";
    this.status = status;
  }
}

export async function sendChatMessage(conversationHistory) {
  const latestUserMessage = [...conversationHistory].reverse().find((message) => message.from === "user");
  if (!latestUserMessage) {
    throw new Error("No user message to send");
  }

  const history = conversationHistory
    .slice(1, -1)
    .filter((message, index, messages) =>
      !message.pending && !message.retryable &&
      !(message.from === "user" && messages[index + 1]?.retryable)
    )
    .slice(-24)
    .map((message) => ({
      role: message.from === "user" ? "user" : "assistant",
      content: message.text,
    }));

  const response = await fetch(`${CHAT_SERVER_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Requested-With": "wrja-web" },
    body: JSON.stringify({ message: latestUserMessage.text, history }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ChatApiError(data?.error || `Chat server error: ${response.status}`, response.status);
  }

  if (typeof data?.answer !== "string" || !data.answer || !["local", "gemini", "fallback", "handoff"].includes(data.mode)) {
    throw new ChatApiError(data?.error || "The assistant returned an unexpected response.", 502);
  }

  return data;
}