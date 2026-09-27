import { useEffect, useRef, useState } from "react";
import { sendChatMessage } from "../services/geminiChat";

const quickReplies = [
  "What programs do you offer?",
  "Where are you located?",
];

// Used only if the Gemini API key is missing or a request fails — keeps
// the widget from ever going silent.
function getFallbackReply(userMessage) {
  const message = userMessage.toLowerCase();

  if (message.includes("program") || message.includes("judo")) {
    return "We offer Kids, Adult, and Women's Judo programs. You can see all the details on our Programs page!";
  }
  if (message.includes("locat") || message.includes("where") || message.includes("address")) {
    return "Our affiliated clubs train in Randfontein and Krugersdorp — check the Contact page for exact addresses and a map.";
  }
  if (message.includes("contact") || message.includes("phone") || message.includes("email")) {
    return "You'll find phone numbers and emails for both clubs on our Contact page.";
  }

  return "Thanks for reaching out! For a detailed answer right now, our Contact page is the best way to reach WRJA directly.";
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, from: "bot", text: "Hi! I'm the WRJA assistant. Ask me about programs, events, payments, or where to find us." },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage = { id: Date.now(), from: "user", text: trimmed };
    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInputValue("");
    setIsTyping(true);

    try {
      const replyText = await sendChatMessage(updatedHistory);
      setMessages((current) => [...current, { id: Date.now() + 1, from: "bot", text: replyText }]);
    } catch (error) {
      console.error("Gemini chat failed, falling back to a canned reply:", error);
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, from: "bot", text: getFallbackReply(trimmed) },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(inputValue);
  };

  return (
    <div className="chat-widget">
      {isOpen && (
        <div className="chat-panel">
          <div className="chat-panel-header">
            <div>
              <p className="chat-panel-title">WRJA Assistant</p>
              <p className="chat-panel-subtitle">Usually replies right away</p>
            </div>
            <button
              className="chat-panel-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              &times;
            </button>
          </div>

          <div className="chat-panel-messages">
            {messages.map((message) => (
              <div key={message.id} className={`chat-bubble chat-bubble-${message.from}`}>
                {message.text}
              </div>
            ))}

            {isTyping && (
              <div className="chat-bubble chat-bubble-bot chat-typing">
                <span /><span /><span />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="chat-quick-replies">
              {quickReplies.map((reply) => (
                <button key={reply} onClick={() => sendMessage(reply)}>
                  {reply}
                </button>
              ))}
            </div>
          )}

          <form className="chat-panel-input" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Type a message..."
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
            />
            <button type="submit" aria-label="Send message">&#10148;</button>
          </form>
        </div>
      )}

      <button
        className={`chat-toggle ${isOpen ? "chat-toggle-open" : ""}`}
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? "\u00d7" : "\ud83e\udd4b"}
        {!isOpen && <span className="chat-toggle-pulse" />}
      </button>
    </div>
  );
}
