import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import wrjaLogo from "../assets/images/Logo/wrja-logo.png";
import { ChatApiError, sendChatMessage } from "../services/geminiChat";

const quickReplies = [
  "I’m new to judo — where do I start?",
  "Where do your clubs train?",
  "What age can children start judo?",
  "What events do you offer?",
];
const WELCOME = {
  id: "welcome",
  from: "bot",
  text: "Hi! I’m the WRJA assistant. Ask me about judo, our clubs, coaches or events — or just tell me what you’re looking for and I’ll help.",
};
const STORAGE_KEY = "wrja-assistant-conversation-v1";
const MAX_STORED_MESSAGES = 60;

function loadConversation() {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return [WELCOME];
    const restored = saved.filter((message) =>
      message && typeof message === "object" &&
      (message.from === "user" || message.from === "bot") &&
      typeof message.id === "string" && typeof message.text === "string" &&
      !message.pending && message.id !== WELCOME.id
    );
    return [WELCOME, ...restored];
  } catch {
    return [WELCOME];
  }
}

function saveConversation(messages) {
  try {
    const saved = messages
      .filter((message) => message.id !== WELCOME.id && !message.pending)
      .slice(-MAX_STORED_MESSAGES);
    if (saved.length) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // The chat remains usable when session storage is unavailable.
  }
}

function messageId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

function normalizeQuestion(value) {
  return value.toLowerCase().replace(/[^a-z0-9 ]+/g, "").trim();
}

export default function ChatWidget({ onGuideRequest }) {
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [atHomeCheckpoint, setAtHomeCheckpoint] = useState(() => window.scrollY <= 120);
  const [messages, setMessages] = useState(loadConversation);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    const updateCheckpoint = () => setAtHomeCheckpoint(window.scrollY <= 120);
    updateCheckpoint();
    window.addEventListener("scroll", updateCheckpoint, { passive: true });
    return () => window.removeEventListener("scroll", updateCheckpoint);
  }, [pathname]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);
  useEffect(() => {
    if (!isTyping) saveConversation(messages);
  }, [messages, isTyping]);
  useEffect(() => {
    if (!isOpen) return;
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 100);
    return () => window.clearTimeout(focusTimer);
  }, [isOpen]);

  const sendMessage = async (text, baseMessages = messages) => {
    const trimmed = text.trim();
    if (!trimmed || sendingRef.current) return;

    sendingRef.current = true;
    const userMessage = { id: messageId(), from: "user", text: trimmed.slice(0, 2000) };
    const assistantId = messageId();
    const updatedHistory = [...baseMessages, userMessage];
    setMessages(updatedHistory);
    setInputValue("");
    setIsTyping(true);

    if (/\bguide\s+me\b/i.test(trimmed)) {
      onGuideRequest?.();
    }

    try {
      const response = await sendChatMessage(updatedHistory);
      setMessages((current) => [...current, {
        id: assistantId,
        from: "bot",
        text: response.answer,
        showSupportLink: response.showSupportLink,
        suggestions: response.suggestions?.slice(0, 3),
      }]);
    } catch (error) {
      console.error("WRJA assistant request failed:", error);
      setMessages((current) => [
        ...current,
        {
          id: assistantId,
          from: "bot",
          text: error instanceof ChatApiError && error.status === 429
            ? error.message
            : "I’m having trouble connecting right now. Please try again shortly or contact WRJA support.",
          retryable: true,
          retryText: trimmed,
        },
      ]);
    } finally {
      sendingRef.current = false;
      setIsTyping(false);
    }
  };

  const retryMessage = (text) => {
    if (!text || sendingRef.current) return;
    const failedIndex = messages.findIndex((message) => message.retryable && message.retryText === text);
    const remaining = failedIndex > 0
      ? [...messages.slice(0, failedIndex - 1), ...messages.slice(failedIndex + 1)]
      : messages;
    setMessages(remaining);
    sendMessage(text, remaining);
  };

  const resetConversation = () => {
    if (sendingRef.current) return;
    setMessages([WELCOME]);
    setInputValue("");
    saveConversation([WELCOME]);
    inputRef.current?.focus();
  };

  const askedQuestions = new Set(messages
    .filter((message) => message.from === "user")
    .map((message) => normalizeQuestion(message.text)));
  const suggestedReplies = (messages[messages.length - 1]?.suggestions || [])
    .filter((reply) => !askedQuestions.has(normalizeQuestion(reply)));
  const visibleQuickReplies = messages.length === 1 ? quickReplies : suggestedReplies;

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(inputValue);
  };

  return (
    <div className={`chat-widget ${isOpen ? "chat-widget-open" : ""} ${isOpen && isExpanded ? "chat-widget-expanded" : ""}`}>
      {isOpen && isExpanded && (
        <div className="chat-backdrop" onClick={() => setIsExpanded(false)} aria-hidden="true" />
      )}
      {isOpen && (
        <div className={`chat-panel ${isExpanded ? "chat-panel-expanded" : ""}`}>
          <div className="chat-panel-header">
            <div className="chat-panel-brand">
              <span className="chat-panel-brand-mark"><img src={wrjaLogo} alt="" /></span>
              <span className="chat-panel-brand-copy">
                <p className="chat-panel-title">WRJA Assistant</p>
                <p className="chat-panel-subtitle"><span aria-hidden="true" />Here to help</p>
              </span>
            </div>
            <div className="chat-panel-actions">
            {messages.length > 1 && (
              <button
                className="chat-panel-reset"
                onClick={resetConversation}
                disabled={isTyping}
                aria-label="Start a new conversation"
                title="Start a new conversation"
              >
                ↻
              </button>
            )}
            <button
              className="chat-panel-expand"
              onClick={() => setIsExpanded((expanded) => !expanded)}
              aria-label={isExpanded ? "Shrink chat" : "Expand chat"}
              title={isExpanded ? "Shrink chat" : "Expand chat"}
            >
              {isExpanded ? "\u2921" : "\u2922"}
            </button>
            <button
              className="chat-panel-close"
              onClick={() => { setIsOpen(false); setIsExpanded(false); }}
              aria-label="Close chat"
            >
              &times;
            </button>
            </div>
          </div>

          <div className="chat-panel-messages" role="log" aria-live="polite" aria-relevant="additions text">
            {messages.map((message) => (
              <div key={message.id} className={`chat-message-row chat-message-row-${message.from}`}>
                {message.from === "bot" && <span className="chat-assistant-avatar" aria-hidden="true">W</span>}
                <div className={`chat-bubble chat-bubble-${message.from}`}>
                  {message.pending ? (
                    <div className="chat-typing" role="status" aria-label="WRJA assistant is responding">
                      <span /><span /><span /><span className="chat-typing-label">Typing…</span>
                    </div>
                  ) : message.from === "bot" ? (
                    <div className="chat-markdown">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>{message.text}</ReactMarkdown>
                    </div>
                  ) : message.text}
                  {message.from === "bot" && !message.pending && message.showSupportLink && (
                    <Link className="chat-support-link" to="/contact">Contact WRJA support ↗</Link>
                  )}
                  {message.from === "bot" && !message.pending && message.retryable && (
                    <button className="chat-retry" type="button" onClick={() => retryMessage(message.retryText)}>Try again</button>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="chat-message-row chat-message-row-bot">
                <span className="chat-assistant-avatar" aria-hidden="true">W</span>
                <div className="chat-bubble chat-bubble-bot chat-typing">
                  <span /><span /><span /><span className="chat-typing-label">Typing…</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
            {!isTyping && visibleQuickReplies.length > 0 && (
              <div className="chat-quick-replies" aria-label="Suggested questions">
                {visibleQuickReplies.map((reply) => (
                  <button key={reply} onClick={() => sendMessage(reply)}>{reply}</button>
                ))}
              </div>
            )}
          </div>

          <p className="chat-panel-human">
            Prefer a person? <Link to="/contact" onClick={() => setIsExpanded(false)}>Send WRJA a message</Link>
          </p>
          <form className="chat-panel-input" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              placeholder="Type a message…"
              value={inputValue}
              rows={1}
              maxLength={2000}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage(inputValue);
                }
              }}
              aria-label="Type a message"
              disabled={isTyping}
            />
            <button type="submit" aria-label="Send message" disabled={!inputValue.trim() || isTyping}>&#10148;</button>
          </form>
          {onGuideRequest && (
            <button className="chat-buddy-invite" type="button" onClick={onGuideRequest}>
              <span className="chat-buddy-invite-mark" aria-hidden="true">🥋</span>
              <span className="chat-buddy-invite-copy">
                <strong>Need help?</strong>
                <span>WRJA Buddy can show you around</span>
              </span>
              <span className="chat-buddy-invite-action">Meet the Buddy <span aria-hidden="true">→</span></span>
            </button>
          )}
        </div>
      )}

      {!isOpen && pathname === "/" && atHomeCheckpoint && onGuideRequest && (
        <button className="chat-buddy-hint" type="button" onClick={onGuideRequest} aria-label="Meet WRJA Buddy for a guided tour">
          <span className="chat-buddy-hint-mark" aria-hidden="true">🥋</span>
          <span className="chat-buddy-hint-copy">
            <strong>Need a hand?</strong>
            <span>WRJA Buddy can show you around</span>
          </span>
          <span className="chat-buddy-hint-arrow" aria-hidden="true">→</span>
        </button>
      )}
      <div className="chat-launcher-row">
        <button
          className={`chat-toggle ${isOpen ? "chat-toggle-open" : ""}`}
          onClick={() => { setIsOpen((open) => !open); setIsExpanded(false); }}
          aria-label={isOpen ? "Close chat" : "Open chat"}
        >
          {isOpen ? "\u00d7" : "\ud83e\udd4b"}
          {!isOpen && <span className="chat-toggle-pulse" />}
        </button>
      </div>
    </div>
  );
}
