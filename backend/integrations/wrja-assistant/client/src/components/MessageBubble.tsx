import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { ArrowUpRight } from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  pending?: boolean;
  showSupportLink?: boolean;
  /** Clickable follow-up questions shown under the latest assistant reply. */
  suggestions?: string[];
  /** Set on a failed reply so the visitor can resend the question that failed. */
  retryable?: boolean;
  retryText?: string;
}

interface Props { message: ChatMessage; onRetry?: () => void }

export function MessageBubble({ message, onRetry }: Props) {
  const isUser = message.role === 'user';
  return (
    <article className={`message-row ${isUser ? 'message-row-user' : 'message-row-assistant'}`}>
      {!isUser && <div className="assistant-avatar wrja-assistant-avatar" aria-hidden="true">W</div>}
      <div className={`message-content ${isUser ? 'message-content-user' : 'message-content-assistant'}`}>
        <div className={`message-bubble ${isUser ? 'bubble-user' : 'bubble-assistant'}`}>
          {message.pending ? (
            <div className="thinking-line" role="status" aria-label="WRJA assistant is responding">
              <span className="thinking-dots"><i /><i /><i /></span><span>Typing…</span>
            </div>
          ) : (
            <div className="markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>{message.content}</ReactMarkdown></div>
          )}
        </div>
        {!isUser && !message.pending && message.retryable && onRetry && (
          <button type="button" className="wrja-retry-button" onClick={onRetry}>Try again</button>
        )}
        {!isUser && !message.pending && message.showSupportLink && (
          <a className="wrja-support-link" href="/contact">Contact WRJA support <ArrowUpRight size={13} /></a>
        )}
      </div>
    </article>
  );
}
