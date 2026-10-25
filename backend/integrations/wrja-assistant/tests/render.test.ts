import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from '../client/src/App';
import { MessageBubble, type ChatMessage } from '../client/src/components/MessageBubble';

describe('WRJA visitor interface', () => {
  it('renders the association website with the assistant collapsed behind a launcher', () => {
    const markup = renderToStaticMarkup(createElement(App));
    expect(markup).toContain('WEST RAND JUDO ASSOCIATION');
    expect(markup).toContain('aria-label="Open WRJA chat"');
    expect(markup).toContain('Chat with WRJA');
    expect(markup.toLowerCase()).not.toContain('knowledge base');
  });

  it('renders safe Markdown and an explicit WRJA support link', () => {
    const message: ChatMessage = {
      id: 'markdown-test', role: 'assistant', showSupportLink: true,
      content: '- First point\n- Second point\n\n[Reference](https://example.com)',
    };
    const markup = renderToStaticMarkup(createElement(MessageBubble, { message }));
    expect(markup).toContain('<li>First point</li>');
    expect(markup).toContain('<a href="https://example.com">Reference</a>');
    expect(markup).toContain('Contact WRJA support');
    expect(markup).not.toContain('knowledge base');
  });
});
