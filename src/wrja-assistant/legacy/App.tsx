import { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, ChevronDown, MessageSquareText, Plus, Send, Sparkles, PanelLeftClose, PanelLeftOpen, ShieldCheck } from 'lucide-react';
import { KnowledgeManager } from './components/KnowledgeManager';
import { MessageBubble, type ChatMessage } from './components/MessageBubble';
import { requestGeminiHelp } from './lib/api';
import { loadKnowledgeBase, saveKnowledgeBase } from './lib/knowledge';
import { searchKnowledge } from '../../server/services/retrieval';
import { decideResponse, isConfidentLocalMatch, shouldOfferGeminiRetry } from '../../server/services/pipeline';
import type { ChatApiRequest, ChatTurn, KnowledgeBase, KnowledgeMatch } from '../../server/services/types';

type Screen = 'chat' | 'knowledge';

const QUICK_PROMPTS = [
  'How do I add my own knowledge?',
  'Is my knowledge uploaded to a server?',
  'Can Askwise answer when Gemini is unavailable?',
];

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function LogoMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none">
        <path d="M10 5H6v22h4M22 5h4v22h-4M12.5 21.5 16 10l3.5 11.5M14 17h4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function App() {
  const [screen, setScreen] = useState<Screen>('chat');
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase>(() => loadKnowledgeBase());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [geminiReady, setGeminiReady] = useState<boolean | null>(null);
  const [storageError, setStorageError] = useState('');
  const conversationRef = useRef<ChatMessage[]>([]);
  const submitLock = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const retrievalCache = useRef(new Map<string, KnowledgeMatch[]>());

  const publishMessages = useCallback((next: ChatMessage[]) => {
    conversationRef.current = next;
    setMessages(next);
  }, []);

  useEffect(() => {
    try {
      saveKnowledgeBase(knowledgeBase);
      setStorageError('');
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : 'Could not save to this browser.');
    }
    retrievalCache.current.clear();
  }, [knowledgeBase]);

  useEffect(() => {
    let active = true;
    fetch('/api/health').then((response) => response.json()).then((data) => {
      if (active) setGeminiReady(Boolean(data.geminiConfigured));
    }).catch(() => {
      if (active) setGeminiReady(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  function updateKnowledge(next: KnowledgeBase) {
    setKnowledgeBase(next);
    try {
      saveKnowledgeBase(next);
      setStorageError('');
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : 'Could not save to this browser.');
    }
  }

  function findMatches(question: string, history: ChatTurn[]): KnowledgeMatch[] {
    const cacheKey = JSON.stringify([question, history.slice(-3), knowledgeBase.entries.length, knowledgeBase.entries.map((entry) => entry.id).join('|')]);
    const cached = retrievalCache.current.get(cacheKey);
    if (cached) return cached;
    const matches = searchKnowledge(question, knowledgeBase.entries, history, 3);
    retrievalCache.current.set(cacheKey, matches);
    if (retrievalCache.current.size > 64) {
      const oldest = retrievalCache.current.keys().next().value;
      if (oldest) retrievalCache.current.delete(oldest);
    }
    return matches;
  }

  async function runGeminiRequest(
    assistantId: string,
    payload: ChatApiRequest,
    localMatch: KnowledgeMatch | undefined,
    localMs: number,
  ) {
    try {
      const result = await requestGeminiHelp(payload);
      const canRetry = result.mode === 'fallback' && shouldOfferGeminiRetry(result.note ?? '');
      const fallbackContent = result.answer || 'I could not find a reliable answer in the knowledge you provided. Add a relevant entry or try a more specific question.';
      const assistant: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: fallbackContent,
        mode: result.mode,
        sources: result.sources,
        durationMs: result.durationMs,
        note: [result.note, `Local search: ${localMs} ms.`].filter(Boolean).join(' '),
        retry: canRetry ? () => retryGeminiRequest(assistantId, payload, localMatch, localMs) : undefined,
      };
      publishMessages(conversationRef.current.map((message) => message.id === assistantId ? assistant : message));
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'The Gemini service could not be reached.';
      const canRetry = !isConfidentLocalMatch(localMatch) || shouldOfferGeminiRetry(reason);
      const assistant: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: isConfidentLocalMatch(localMatch)
          ? localMatch.answer
          : 'I could not find a reliable answer in your knowledge base, and the Gemini service could not be reached. Check the server setup or try again.',
        mode: 'fallback',
        sources: isConfidentLocalMatch(localMatch) ? [localMatch] : [],
        note: `${reason} Local search: ${localMs} ms.`,
        error: !isConfidentLocalMatch(localMatch),
        retry: canRetry ? () => retryGeminiRequest(assistantId, payload, localMatch, localMs) : undefined,
      };
      publishMessages(conversationRef.current.map((message) => message.id === assistantId ? assistant : message));
    }
  }

  function retryGeminiRequest(assistantId: string, payload: ChatApiRequest, localMatch: KnowledgeMatch | undefined, localMs: number) {
    publishMessages(conversationRef.current.map((message) => message.id === assistantId
      ? { id: assistantId, role: 'assistant', content: '', pending: true }
      : message));
    void runGeminiRequest(assistantId, payload, localMatch, localMs);
  }

  function sendQuestion(question: string) {
    const trimmed = question.trim();
    if (!trimmed || submitLock.current) return;
    submitLock.current = true;
    setDraft('');

    const previousMessages = conversationRef.current;
    const history: ChatTurn[] = previousMessages
      .filter((message) => !message.pending && !message.error && message.content.trim())
      .map((message) => ({ role: message.role, content: message.content }));
    const searchStarted = performance.now();
    const matches = findMatches(trimmed, history);
    const localMs = Math.max(0, Math.round(performance.now() - searchStarted));
    const best = matches[0];
    const decision = decideResponse(trimmed, matches);
    const userMessage: ChatMessage = { id: makeId(), role: 'user', content: trimmed };

    if (decision.mode === 'local') {
      const assistant: ChatMessage = {
        id: makeId(), role: 'assistant', content: decision.match.answer, mode: 'local',
        sources: [decision.match], durationMs: localMs,
      };
      publishMessages([...previousMessages, userMessage, assistant]);
      submitLock.current = false;
      return;
    }

    const assistantId = makeId();
    const pending: ChatMessage = { id: assistantId, role: 'assistant', content: '', pending: true };
    const payload: ChatApiRequest = {
      message: trimmed,
      history,
      matches,
      forceGemini: decision.reason === 'user-requested-detail',
    };
    publishMessages([...previousMessages, userMessage, pending]);
    submitLock.current = false;
    const confidentFallback = isConfidentLocalMatch(best, matches[1]) ? best : undefined;
    void runGeminiRequest(assistantId, payload, confidentFallback, localMs);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendQuestion(draft);
  }

  function handleComposerKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendQuestion(draft);
    }
  }

  function startNewConversation() {
    publishMessages([]);
    setScreen('chat');
    setMobileNavOpen(false);
    setDraft('');
  }

  const sidebar = (
    <>
      <div className="brand-lockup"><LogoMark /><div><span className="brand-name">askwise</span><span className="brand-caption">knowledge, in context</span></div></div>
      <button className="new-chat-button" type="button" onClick={startNewConversation}><Plus size={16} /><span>New conversation</span><kbd>⌘ K</kbd></button>
      <div className="nav-section-label">Workspace</div>
      <nav className="primary-nav" aria-label="Main navigation">
        <button className={`nav-item ${screen === 'chat' ? 'active' : ''}`} type="button" onClick={() => { setScreen('chat'); setMobileNavOpen(false); }}><MessageSquareText size={17} /><span>Assistant</span><ChevronDown className="nav-chevron" size={14} /></button>
        <button className={`nav-item ${screen === 'knowledge' ? 'active' : ''}`} type="button" onClick={() => { setScreen('knowledge'); setMobileNavOpen(false); }}><BookOpen size={17} /><span>Knowledge base</span><span className="nav-count">{knowledgeBase.entries.length}</span></button>
      </nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-library-card">
        <div className="sidebar-library-icon"><ShieldCheck size={17} /></div>
        <div><strong>Saved on this device</strong><span>Only relevant notes go to Gemini</span></div>
      </div>
      <div className="sidebar-footer"><span className={`status-dot ${geminiReady ? 'status-on' : 'status-off'}`} /><span>{geminiReady ? 'Gemini assistance ready' : 'Local-first mode'}</span><span className="footer-version">v1</span></div>
    </>
  );

  return (
    <div className="app-shell">
      {mobileNavOpen && <button className="mobile-backdrop" aria-label="Close navigation" type="button" onClick={() => setMobileNavOpen(false)} />}
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-mobile-close"><button className="icon-button" type="button" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation"><PanelLeftClose size={18} /></button></div>
        {sidebar}
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button className="icon-button mobile-menu-toggle" type="button" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><PanelLeftOpen size={18} /></button>
          <div className="topbar-context"><span className="breadcrumb-muted">Askwise</span><span className="breadcrumb-divider">/</span><span>{screen === 'chat' ? 'Assistant' : 'Knowledge base'}</span></div>
          <div className="topbar-right">
            <span className="status-pill"><span className={`status-dot ${geminiReady ? 'status-on' : 'status-off'}`} />{geminiReady ? 'Gemini ready' : 'Local-first'}</span>
            <button className="topbar-new-chat" type="button" onClick={startNewConversation}><Plus size={15} /> New chat</button>
          </div>
        </header>

        {screen === 'knowledge' ? (
          <main className="page-scroll"><KnowledgeManager knowledgeBase={knowledgeBase} onChange={updateKnowledge} /></main>
        ) : (
          <main className="chat-page">
            {messages.length === 0 ? (
              <section className="chat-empty-state">
                <div className="welcome-mark"><LogoMark /></div>
                <p className="eyebrow">A thoughtful place for your knowledge</p>
                <h1>Answers grounded<br />in what you know.</h1>
                <p className="welcome-copy">Ask a question and I’ll check your knowledge base first. Follow up naturally — I’ll keep the thread in mind.</p>
                <div className="quick-prompt-label">Try one of these</div>
                <div className="quick-prompts">{QUICK_PROMPTS.map((prompt) => <button type="button" key={prompt} onClick={() => sendQuestion(prompt)}>{prompt}<span>↗</span></button>)}</div>
                <button className="empty-add-knowledge" type="button" onClick={() => setScreen('knowledge')}><BookOpen size={15} /> Add your own knowledge base <span>→</span></button>
              </section>
            ) : (
              <div className="conversation-scroll" ref={scrollRef}>
                <div className="conversation-column">
                  <div className="conversation-heading"><div><p className="eyebrow">Current conversation</p><h1>Askwise assistant</h1></div><span className="conversation-context"><Sparkles size={13} /> Context-aware</span></div>
                  <div className="message-list">{messages.map((message) => <MessageBubble key={message.id} message={message} />)}<div ref={endRef} /></div>
                </div>
              </div>
            )}

            <div className={`composer-wrap ${messages.length === 0 ? 'composer-wrap-empty' : ''}`}>
              <form className="composer" onSubmit={handleSubmit}>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  placeholder="Ask about something in your knowledge base…"
                  rows={1}
                  aria-label="Your message"
                  maxLength={2000}
                />
                <div className="composer-bottom">
                  <span className="composer-hint">{draft.length > 0 ? `${draft.length} / 2,000` : 'Enter to send · Shift + Enter for a new line'}</span>
                  <button className="send-button" type="submit" disabled={!draft.trim()} aria-label="Send message"><Send size={16} /></button>
                </div>
              </form>
              <p className="composer-disclaimer">Local answers stay in your browser. Gemini only receives relevant excerpts when needed.</p>
              {storageError && <p className="storage-error" role="alert">{storageError}</p>}
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
