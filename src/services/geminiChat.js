
const CHAT_SERVER_URL = import.meta.env.VITE_CHAT_SERVER_URL || "http://localhost:5000";
const SESSION_STORAGE_KEY = "wrja_chat_session_id";
 
// Keep the session id in sessionStorage (not localStorage) so a conversation
// survives a page refresh but starts fresh in a new tab or after the
// browser is closed. Falls back to an in-memory variable if sessionStorage
// isn't available (e.g. some privacy modes / non-browser environments).
let inMemorySessionId = null;
 
function getStoredSessionId() {
  try {
    return window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return inMemorySessionId;
  }
}
 
function setStoredSessionId(sessionId) {
  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  } catch {
    inMemorySessionId = sessionId;
  }
}
 
function clearStoredSessionId() {
  try {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    inMemorySessionId = null;
  }
}
 
export async function sendChatMessage(conversationHistory) {
  const latestUserMessage = [...conversationHistory].reverse().find((message) => message.from === "user");
  if (!latestUserMessage) {
    throw new Error("No user message to send");
  }
 
  const sessionId = getStoredSessionId();
 
  const response = await fetch(`${CHAT_SERVER_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: latestUserMessage.text,
      ...(sessionId ? { sessionId } : {}),
    }),
  });
 
  if (!response.ok) {
    throw new Error(`Chat server error: ${response.status}`);
  }
 
  const data = await response.json();
 
  // Remember the session id for the next message, so the server can use
  // conversation history for follow-up questions.
  if (data.sessionId) {
    setStoredSessionId(data.sessionId);
  }
 
  // The server may return success: false with a friendly, on-brand answer
  // (e.g. when all its AI provider keys are temporarily unavailable). Prefer
  // showing that over the widget's local canned fallback when it's present.
  if (data.answer) {
    return data.answer;
  }
 
  throw new Error(data.error || "Unknown chat server error");
}
 
// Starts a brand new conversation: clears server-side history for this
// session and forgets the local session id so the next message gets a
// fresh one. Not wired to any UI yet — call it from a "New conversation"
// button if you add one.
export async function resetChatSession() {
  const sessionId = getStoredSessionId();
  clearStoredSessionId();
 
  if (!sessionId) return;
 
  try {
    await fetch(`${CHAT_SERVER_URL}/api/chat/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
  } catch (error) {
    // Non-fatal: the local session id is already cleared, so the next
    // message will just start a new session on the server too.
    console.error("Failed to reset chat session on server:", error);
  }
}
 





