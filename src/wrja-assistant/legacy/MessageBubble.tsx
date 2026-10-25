import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { BookOpen, Clock3, Sparkles } from 'lucide-react';
import type { KnowledgeMatch } from '../../../server/services/types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: 'local' | 'gemini' | 'fallback';
  sources?: KnowledgeMatch[];
  durationMs?: number;
  note?: string;
  pending?: boolean;
  error?: boolean;
  retry?: () => void;
}

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';
  return (
    <article className={`message-row ${isUser ? 'message-row-user' : 'message-row-assistant'}`}>
      {!isUser && <div className="assistant-avatar" aria-hidden="true"><span>⌑</span></div>}
      <div className={`message-content ${isUser ? 'message-content-user' : 'message-content-assistant'}`}>
        {!isUser && message.mode && (
          <div className="message-provenance">
            {message.mode === 'local' || message.mode === 'fallback'
              ? <><BookOpen size={13} /> <span>{message.mode === 'local' ? 'From your knowledge base' : 'Local fallback'}</span></>
              : <><Sparkles size={13} /> <span>Gemini assisted</span></>}
            {typeof message.durationMs === 'number' && <span className="timing"><Clock3 size={12} /> {message.durationMs < 1000 ? `${message.durationMs} ms` : `${(message.durationMs / 1000).toFixed(1)} s`}</span>}
          </div>
        )}
        <div className={`message-bubble ${isUser ? 'bubble-user' : 'bubble-assistant'} ${message.error ? 'bubble-error' : ''}`}>
          {message.pending ? (
            <div className="thinking-line" role="status" aria-label="Assistant is thinking">
              <span className="thinking-dots"><i /><i /><i /></span>
              <span>Checking your notes and context…</span>
            </div>
          ) : (
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="source-list" aria-label="Knowledge-base sources">
            <span className="source-list-label">Sources</span>
            {message.sources.map((source) => (
              <span className="source-chip" key={source.id} title={source.source || source.category}>
                <BookOpen size={11} /> {source.title}
              </span>
            ))}
          </div>
        )}
        {!isUser && message.note && <p className="message-note">{message.note}</p>}
        {!isUser && !message.pending && message.retry && (
          <button className="retry-link" onClick={message.retry} type="button">Retry Gemini</button>
        )}
      </div>
    </article>
  );
}
