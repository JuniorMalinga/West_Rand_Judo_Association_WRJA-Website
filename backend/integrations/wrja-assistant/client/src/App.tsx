import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Maximize2, MessageSquareText, Minimize2, RotateCcw, Send, X } from 'lucide-react';
import { ApiError, requestAssistant } from './lib/api';
import type { ChatApiRequest, ChatApiResponse, ChatTurn } from '../../server/services/types';
import { MessageBubble, type ChatMessage } from './components/MessageBubble';
import WRJABuddy from './components/wrja-buddy/WRJABuddy';

type BuddyState = 'idle' | 'ready' | 'visible';
const QUICK_REPLIES = [
  'I’m new to judo — where do I start?',
  'Where do your clubs train?',
  'What age can children start judo?',
  'What events do you offer?',
];
const STORAGE_KEY = 'wrja-assistant-conversation-v1';
const MAX_STORED_MESSAGES = 60;
const MAX_HISTORY_TURNS = 24;
const WELCOME: ChatMessage = { id: 'welcome', role: 'assistant', content: 'Hi! I’m the WRJA assistant. Ask me about judo, our clubs, coaches or events — or just tell me what you’re looking for and I’ll help.' };
const CONNECTION_TROUBLE = 'I’m having trouble connecting right now, but I can still help with general information about judo, clubs, coaches, or the events listed here. Please try again in a moment or contact WRJA support.';

/** Keep the conversation across page refreshes in this tab only (sessionStorage), never on the server. */
function loadConversation(): ChatMessage[] {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [WELCOME];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [WELCOME];
    const restored = parsed.filter((item): item is ChatMessage => Boolean(item) && typeof item === 'object'
      && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string' && typeof item.id === 'string' && !item.pending);
    return restored.length > 0 ? [WELCOME, ...restored.filter((item) => item.id !== 'welcome')] : [WELCOME];
  } catch {
    return [WELCOME];
  }
}

function saveConversation(messages: ChatMessage[]): void {
  try {
    const stored = messages.filter((item) => item.id !== 'welcome' && !item.pending).slice(-MAX_STORED_MESSAGES);
    if (stored.length === 0) window.sessionStorage.removeItem(STORAGE_KEY);
    else window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Storage can be unavailable (private mode, quota); the chat still works without it.
  }
}
const TOUR_STOPS = [
  { id: 'classes', title: 'Classes', text: 'Explore how to get started and what to expect at a first class.' },
  { id: 'clubs', title: 'Our clubs', text: 'Find club information and training locations.' },
  { id: 'events', title: 'Events', text: 'See the public event information. For current member listings, log in or contact support.' },
  { id: 'contact', title: 'Contact', text: 'Reach the WRJA team if you need a person to help.' },
];

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function compactHistoryContent(content: string): string {
  const limit = 1600;
  if (content.length <= limit) return content;
  const edge = Math.floor(limit / 2);
  return `${content.slice(0, edge)}\n[…previous answer shortened…]\n${content.slice(-edge)}`;
}

/** Real conversation turns only: no welcome copy, no pending bubbles, and no failed exchanges. */
function historyFrom(list: ChatMessage[]): ChatTurn[] {
  return list
    .filter((item, index) => item.id !== 'welcome' && !item.pending && !item.retryable && item.content.trim()
      && !(item.role === 'user' && list[index + 1]?.retryable))
    .map((item) => ({ role: item.role, content: compactHistoryContent(item.content) }))
    .slice(-MAX_HISTORY_TURNS);
}

function BuddyIllustration() {
  return (
    <svg className="buddy-illustration" viewBox="0 0 100 100" role="img" aria-label="WRJA Buddy, a friendly judo guide">
      <ellipse cx="50" cy="91" rx="30" ry="6" fill="rgba(32, 48, 39, .12)" />
      <path d="M27 49 Q50 38 73 49 L81 80 Q50 92 19 80 Z" fill="#f5f2e8" stroke="#2c3c32" strokeWidth="3" strokeLinejoin="round" />
      <path d="M28 50 12 65 19 74 34 63M72 50 88 65 81 74 66 63" fill="#f5f2e8" stroke="#2c3c32" strokeWidth="3" strokeLinejoin="round" />
      <path d="m41 45 9 30 10-30-10-7z" fill="#fffdf7" stroke="#2c3c32" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M26 69 Q50 75 74 69 L75 77 Q50 84 25 77 Z" fill="#bd9d43" stroke="#2c3c32" strokeWidth="2.5" />
      <path d="M50 22c13 0 22 9 22 22 0 5-2 10-5 13l-3 6H36l-3-6c-4-4-5-8-5-13 0-13 9-22 22-22Z" fill="#d99a62" stroke="#2c3c32" strokeWidth="3" />
      <path d="M30 40c1-15 9-23 21-23 11 0 20 8 21 20-6-1-12-5-15-10-6 6-15 10-27 10Z" fill="#2c3c32" />
      <circle cx="42" cy="44" r="2" fill="#26362e" /><circle cx="58" cy="44" r="2" fill="#26362e" />
      <path d="M44 51q6 6 12 0" fill="none" stroke="#7f3f35" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M19 29q6-9 12 0M69 21q7-10 14-3" fill="none" stroke="#bd9d43" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function App() {
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(loadConversation);
  const [buddyState, setBuddyState] = useState<BuddyState>('idle');
  const [tourStep, setTourStep] = useState(0);
  const [buddyTarget, setBuddyTarget] = useState<{ x: number; y: number } | null>(null);
  const sendingRef = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages]);
  useEffect(() => { if (!sending) saveConversation(messages); }, [messages, sending]);
  useEffect(() => {
    if (!widgetOpen) return;
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 100);
    return () => window.clearTimeout(focusTimer);
  }, [widgetOpen]);
  useEffect(() => {
    if (buddyState !== 'visible') return;
    const measureTarget = () => {
      const target = document.getElementById(TOUR_STOPS[tourStep].id);
      if (!target) { setBuddyTarget(null); return; }
      const bounds = target.getBoundingClientRect();
      setBuddyTarget({ x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 });
    };
    measureTarget();
    window.addEventListener('scroll', measureTarget, { passive: true });
    window.addEventListener('resize', measureTarget);
    return () => {
      window.removeEventListener('scroll', measureTarget);
      window.removeEventListener('resize', measureTarget);
    };
  }, [buddyState, tourStep]);

  async function sendQuestion(value = draft, base: ChatMessage[] = messages) {
    const message = value.replace(/\u0000/g, '').trim();
    if (!message || sendingRef.current) return;
    sendingRef.current = true;
    setDraft('');
    setSending(true);
    const userId = makeId();
    const assistantId = makeId();
    const history = historyFrom(base);
    const payload: ChatApiRequest = { message: message.slice(0, 2000), history };
    setMessages((current) => [...current, { id: userId, role: 'user', content: message }, { id: assistantId, role: 'assistant', content: '', pending: true }]);
    try {
      const response: ChatApiResponse = await requestAssistant(payload, AbortSignal.timeout(45_000));
      const answer = response.answer.trim() || 'I’m not sure about that. Please contact WRJA support and they’ll point you to the right information.';
      setMessages((current) => current.map((item) => item.id === assistantId
        ? { id: assistantId, role: 'assistant', content: answer, showSupportLink: response.showSupportLink, suggestions: response.suggestions?.slice(0, 3) }
        : item));
    } catch (error) {
      const rateLimited = error instanceof ApiError && error.status === 429;
      setMessages((current) => current.map((item) => item.id === assistantId
        ? { id: assistantId, role: 'assistant', content: rateLimited ? error.message : CONNECTION_TROUBLE, showSupportLink: !rateLimited, retryable: true, retryText: message }
        : item));
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendQuestion();
  }

  function retryLast(text: string | undefined) {
    if (!text || sendingRef.current) return;
    // Drop the failed exchange so the retry doesn't send the same question twice in history.
    const failedIndex = messages.findIndex((item) => item.retryable && item.retryText === text);
    const remaining = failedIndex > 0 ? [...messages.slice(0, failedIndex - 1), ...messages.slice(failedIndex + 1)] : messages;
    setMessages(remaining);
    void sendQuestion(text, remaining);
  }

  function resetConversation() {
    if (sendingRef.current) return;
    setMessages([WELCOME]);
    setDraft('');
    saveConversation([WELCOME]);
    inputRef.current?.focus();
  }

  function beginBuddy() {
    setBuddyState('ready');
    setTourStep(0);
  }

  function launchBuddy() {
    setBuddyState('visible');
    setTourStep(0);
    document.getElementById(TOUR_STOPS[0].id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function advanceTour(direction: -1 | 1) {
    const next = Math.min(TOUR_STOPS.length - 1, Math.max(0, tourStep + direction));
    setTourStep(next);
    document.getElementById(TOUR_STOPS[next].id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const lastMessage = messages[messages.length - 1];
  const lastSuggestions = lastMessage && lastMessage.role === 'assistant' && !lastMessage.pending ? lastMessage.suggestions ?? [] : [];
  const activeStop = TOUR_STOPS[tourStep];
  const buddyActions = [
    ...(tourStep > 0 ? [{ label: 'Back', onClick: () => advanceTour(-1), variant: 'secondary' as const }] : []),
    { label: tourStep === TOUR_STOPS.length - 1 ? 'Finish' : 'Next', onClick: () => tourStep === TOUR_STOPS.length - 1 ? setBuddyState('idle') : advanceTour(1), variant: 'primary' as const },
  ];

  return (
    <div className="demo-website wrja-site">
      <header className="demo-site-header wrja-site-header">
        <a className="demo-site-brand" href="#home" aria-label="West Rand Judo Association home"><span className="demo-site-symbol">W</span><span>WEST RAND JUDO ASSOCIATION<span className="demo-site-period">.</span></span></a>
        <nav className="demo-site-nav" aria-label="Website navigation"><a href="#classes">Classes</a><a href="#clubs">Clubs</a><a href="#events">Events</a></nav>
        <a className="demo-site-contact" href="#contact">Contact <span>↗</span></a>
      </header>
      <main className="demo-site-main wrja-site-main" id="home">
        <section className="demo-site-hero wrja-hero">
          <p className="demo-site-eyebrow">West Rand Judo Association</p>
          <h1>Confidence, respect<br />and <em>community.</em></h1>
          <p>Judo for every age and every stage. Discover our clubs, meet our coaches and find a welcoming place to begin.</p>
          <a href="#clubs" className="demo-site-cta">Find your club <span>↓</span></a>
        </section>
        <section className="wrja-info-strip" id="classes"><div><span>01 / START HERE</span><h2>Your first class</h2><p>New to judo? Ask us what to expect and how to get started.</p></div><div id="clubs"><span>02 / OUR COMMUNITY</span><h2>Find a club</h2><p>Explore club and training information across the West Rand.</p></div></section>
        <section className="wrja-events-preview" id="events"><span>03 / EVENTS</span><h2>Training and events, together.</h2><p>Ask the assistant about the event information available here. For member event listings and current details, log in or contact support.</p></section>
        <footer className="demo-site-footer wrja-site-footer" id="contact"><span>WEST RAND JUDO ASSOCIATION</span><a href="/contact">Contact WRJA support <ArrowUpRight size={13} /></a></footer>
      </main>

      {widgetOpen && <section id="wrja-chat-panel" className={`embed-widget wrja-chat-widget ${expanded ? 'embed-widget-expanded' : ''}`} role="dialog" aria-modal="false" aria-label="WRJA website assistant">
        <header className="embed-widget-header">
          <div className="embed-widget-brand"><span className="wrja-widget-mark">W</span><div><strong>WRJA Assistant</strong><span><i className="wrja-live-dot" /> Here to help</span></div></div>
          <div className="embed-widget-actions">
            {messages.length > 1 && <button className="widget-nav-button" type="button" onClick={resetConversation} disabled={sending} aria-label="Start a new conversation" title="Start a new conversation"><RotateCcw size={15} /></button>}
            <button className="widget-nav-button" type="button" onClick={() => setExpanded((value) => !value)} aria-label={expanded ? 'Shrink chat' : 'Expand chat'}>{expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
            <button className="widget-nav-button widget-close" type="button" onClick={() => { setWidgetOpen(false); setExpanded(false); }} aria-label="Close chat"><X size={17} /></button>
          </div>
        </header>
        <div className="wrja-chat-messages" role="log" aria-live="polite" aria-relevant="additions text">
          {messages.map((message) => <MessageBubble key={message.id} message={message} onRetry={message.retryable ? () => retryLast(message.retryText) : undefined} />)}
          <div ref={endRef} />
          {!sending && lastSuggestions.length > 0 && <div className="wrja-quick-replies wrja-follow-ups" aria-label="Suggested questions">{lastSuggestions.map((reply) => <button type="button" key={reply} onClick={() => void sendQuestion(reply)}>{reply}</button>)}</div>}
          {messages.length === 1 && !sending && <div className="wrja-quick-replies">{QUICK_REPLIES.map((reply) => <button type="button" key={reply} onClick={() => void sendQuestion(reply)}>{reply}</button>)}</div>}
        </div>
        <div className="wrja-chat-footer">
          <form className="wrja-composer" onSubmit={handleSubmit}>
            <textarea ref={inputRef} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendQuestion(); } }} placeholder="Type a message…" rows={1} maxLength={2000} aria-label="Type a message" />
            <button type="submit" aria-label="Send message" disabled={!draft.trim() || sending}>{sending ? <span className="wrja-send-spinner" /> : <Send size={17} />}</button>
          </form>
          <div className="wrja-help-prompt"><BuddyIllustration /><span>Need help? I have a Buddy who can show you around.</span><button type="button" onClick={beginBuddy}>Meet the Buddy</button></div>
        </div>
      </section>}

      {buddyState === 'ready' && <div className="buddy-ready-card" role="dialog" aria-label="Start a guided tour"><BuddyIllustration /><div><strong>Are you ready?</strong><p>WRJA Buddy can show you around the website.</p><div className="buddy-ready-actions"><button type="button" className="buddy-yes" onClick={launchBuddy}>Let’s go</button><button type="button" className="buddy-no" onClick={() => setBuddyState('idle')}>Not now</button></div></div><button type="button" className="buddy-card-close" onClick={() => setBuddyState('idle')} aria-label="Dismiss Buddy prompt"><X size={15} /></button></div>}

      {buddyState === 'visible' && <aside className="buddy-mount" aria-label="WRJA Buddy guided tour">
        <WRJABuddy
          animation="jumpOut"
          animationKey={tourStep}
          size={112}
          message={tourStep === 0 ? `Hi! I’m WRJA Buddy. ${activeStop.text}` : activeStop.text}
          tourTarget={buddyTarget}
          onBuddyClick={() => setWidgetOpen(true)}
          actionButtons={buddyActions}
          onDismiss={() => setBuddyState('idle')}
          onSkip={() => setBuddyState('idle')}
        />
      </aside>}

      <button className={`chat-launcher wrja-chat-launcher ${widgetOpen ? 'chat-launcher-open' : ''}`} type="button" onClick={() => setWidgetOpen((open) => !open)} aria-expanded={widgetOpen} aria-controls="wrja-chat-panel" aria-label={widgetOpen ? 'Close WRJA chat' : 'Open WRJA chat'}>
        {widgetOpen ? <X size={21} /> : <MessageSquareText size={21} />}<span>{widgetOpen ? 'Close chat' : 'Chat with WRJA'}</span>
      </button>
    </div>
  );
}
