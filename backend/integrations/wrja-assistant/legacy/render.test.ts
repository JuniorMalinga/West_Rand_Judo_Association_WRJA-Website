import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from '../client/src/App';
import { MessageBubble, type ChatMessage } from '../client/src/components/MessageBubble';

describe('Askwise UI shell', () => {
  it('renders the assistant screen and local-first prompts', () => {
    const markup = renderToStaticMarkup(createElement(App));
    expect(markup).toContain('Answers grounded');
    expect(markup).toContain('How do I add my own knowledge?');
    expect(markup).toContain('Knowledge base');
  });

  it('renders Markdown lists and links plus a retry control on a fallback response', () => {
    const message: ChatMessage = {
      id: 'markdown-test', role: 'assistant', mode: 'fallback',
      content: '- First point\n- Second point\n\n[Reference](https://example.com)',
      note: 'Gemini returned HTTP 503.', retry: () => undefined,
    };
    const markup = renderToStaticMarkup(createElement(MessageBubble, { message }));
    expect(markup).toContain('<li>First point</li>');
    expect(markup).toContain('<a href="https://example.com">Reference</a>');
    expect(markup).toContain('Retry Gemini');
  });
});
