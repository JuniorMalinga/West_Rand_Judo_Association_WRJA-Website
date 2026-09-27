const CHAT_SERVER_URL = import.meta.env.VITE_CHAT_SERVER_URL || "http://localhost:5000";

export async function sendChatMessage(conversationHistory) {
  const latestUserMessage = [...conversationHistory].reverse().find((message) => message.from === "user");
  if (!latestUserMessage) {
    throw new Error("No user message to send");
  }

  const response = await fetch(`${CHAT_SERVER_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: latestUserMessage.text }),
  });

  if (!response.ok) {
    throw new Error(`Chat server error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Unknown chat server error");
  }

  return data.answer;
}