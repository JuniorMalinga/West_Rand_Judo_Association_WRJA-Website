// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { App } from '../client/src/App';

type ChatResponse = { answer: string; mode: 'gemini' | 'fallback'; durationMs: number; note?: string; sources: unknown[] };
function mockResponse(data: unknown): Response {
  return { ok: true, json: async () => data } as Response;
}

function composerSend(text: string) {
  fireEvent.change(screen.getByRole('textbox', { name: 'Your message' }), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
}

describe('chat UI interactions', () => {
  beforeEach(() => {
    window.localStorage.clear();
    HTMLElement.prototype.scrollIntoView = vi.fn();
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      if (String(input) === '/api/health') return mockResponse({ geminiConfigured: false });
      throw new Error(`Unexpected request to ${String(input)}`);
    }));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it('answers a known question locally without calling the chat API', async () => {
    const fetchMock = vi.mocked(fetch);
    render(createElement(App));
    composerSend('How do I add my own knowledge?');

    expect(await screen.findByText(/Open Knowledge Base and choose Import JSON/)).toBeTruthy();
    expect(screen.getByText('From your knowledge base')).toBeTruthy();
    expect(screen.getByText('Importing a knowledge base')).toBeTruthy();
    expect(fetchMock.mock.calls.some(([url]) => String(url) === '/api/chat')).toBe(false);
  });

  it('carries a previous topic into a pronoun-based follow-up without a Gemini call', async () => {
    const fetchMock = vi.mocked(fetch);
    render(createElement(App));

    composerSend('How do I add my own knowledge?');
    expect(await screen.findByText(/Open Knowledge Base and choose Import JSON/)).toBeTruthy();
    composerSend('Will it appear on another device?');
    expect(await screen.findByText(/Imported knowledge is stored in this browser's local storage/)).toBeTruthy();
    expect(screen.getByText('Where imported knowledge is stored')).toBeTruthy();
    expect(fetchMock.mock.calls.some(([url]) => String(url) === '/api/chat')).toBe(false);
  });

  it('keeps Shift+Enter unhandled by submit and sends when Enter is pressed', async () => {
    render(createElement(App));
    const textarea = screen.getByRole('textbox', { name: 'Your message' }) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'How do I add my own knowledge?' } });

    expect(fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })).toBe(true);
    fireEvent.change(textarea, { target: { value: 'How do I add my own knowledge?\n' } });
    expect(textarea.value).toContain('\n');
    expect(screen.queryByText('From your knowledge base')).toBeNull();

    fireEvent.change(textarea, { target: { value: 'How do I add my own knowledge?' } });
    expect(fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })).toBe(false);
    expect(await screen.findByText(/Open Knowledge Base and choose Import JSON/)).toBeTruthy();
  });

  it('does not create duplicate messages from rapid send clicks', async () => {
    const fetchMock = vi.mocked(fetch);
    const { container } = render(createElement(App));
    const textarea = screen.getByRole('textbox', { name: 'Your message' });
    fireEvent.change(textarea, { target: { value: 'How do I add my own knowledge?' } });
    const sendButton = screen.getByRole('button', { name: 'Send message' });
    fireEvent.click(sendButton);
    fireEvent.click(sendButton);

    expect(await screen.findByText(/Open Knowledge Base and choose Import JSON/)).toBeTruthy();
    expect(container.querySelectorAll('.message-row-user')).toHaveLength(1);
    expect(fetchMock.mock.calls.some(([url]) => String(url) === '/api/chat')).toBe(false);
  });

  it('keeps two rapid requests in separate message slots when responses complete out of order', async () => {
    const pending: Array<{ resolve: (response: Response) => void; body: Record<string, unknown> }> = [];
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input) === '/api/health') return Promise.resolve(mockResponse({ geminiConfigured: false }));
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Promise<Response>((resolve) => pending.push({ resolve, body }));
    });
    vi.stubGlobal('fetch', fetchMock);
    const { container } = render(createElement(App));

    composerSend('Who sells moon rocks on Saturn?');
    composerSend('What is the capital of Atlantis?');
    await waitFor(() => expect(pending).toHaveLength(2));
    expect(screen.getByText('Who sells moon rocks on Saturn?')).toBeTruthy();
    expect(screen.getByText('What is the capital of Atlantis?')).toBeTruthy();

    pending[1].resolve(mockResponse({ answer: 'Second answer.', mode: 'gemini', durationMs: 80, sources: [] } satisfies ChatResponse));
    expect(await screen.findByText('Second answer.')).toBeTruthy();
    pending[0].resolve(mockResponse({ answer: 'First answer.', mode: 'gemini', durationMs: 120, sources: [] } satisfies ChatResponse));
    expect(await screen.findByText('First answer.')).toBeTruthy();

    const rows = Array.from(container.querySelectorAll('.message-row')).map((row) => row.textContent || '');
    expect(rows.join('|').indexOf('First answer')).toBeLessThan(rows.join('|').indexOf('Second answer'));
  });

  it('offers a user-triggered Gemini retry after a 503 while retaining the fallback answer', async () => {
    let chatCount = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input) === '/api/health') return mockResponse({ geminiConfigured: true });
      if (String(input) === '/api/chat') {
        chatCount += 1;
        return chatCount === 1
          ? mockResponse({ answer: 'The best available local note.', mode: 'fallback', durationMs: 90, note: 'Gemini returned HTTP 503. Showing the verified local note instead.', sources: [] } satisfies ChatResponse)
          : mockResponse({ answer: 'Gemini is responding again.', mode: 'gemini', durationMs: 110, sources: [] } satisfies ChatResponse);
      }
      throw new Error(`Unexpected request to ${String(input)}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    render(createElement(App));

    composerSend('Who is the ambassador of Saturn?');
    expect(await screen.findByText('The best available local note.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry Gemini' }));
    expect(await screen.findByText('Gemini is responding again.')).toBeTruthy();
    expect(chatCount).toBe(2);
  });
});
