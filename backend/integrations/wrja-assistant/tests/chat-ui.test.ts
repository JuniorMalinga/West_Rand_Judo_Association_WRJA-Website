// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { App } from '../client/src/App';

type ChatResponse = { answer: string; mode: 'local' | 'gemini' | 'fallback' | 'handoff'; durationMs: number; showSupportLink?: boolean; suggestions?: string[] };
function mockResponse(data: unknown): Response { return { ok: true, json: async () => data } as Response; }
function openWidget() { fireEvent.click(screen.getByRole('button', { name: 'Open WRJA chat' })); }
function send(text: string) {
  fireEvent.change(screen.getByRole('textbox', { name: 'Type a message' }), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
}

describe('WRJA visitor widget and Buddy', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    HTMLElement.prototype.scrollIntoView = vi.fn();
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      if (String(input) === '/api/chat') return mockResponse({ answer: 'Judo is a Japanese martial art and Olympic sport.', mode: 'local', durationMs: 4 } satisfies ChatResponse);
      throw new Error(`Unexpected request to ${String(input)}`);
    }));
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); window.sessionStorage.clear(); });

  it('starts as a closed chat bubble and opens on a single tap', () => {
    render(createElement(App));
    expect(screen.queryByRole('textbox', { name: 'Type a message' })).toBeNull();
    openWidget();
    expect(screen.getByRole('textbox', { name: 'Type a message' })).toBeTruthy();
    expect(screen.getByText(/Hi! I’m the WRJA assistant/)).toBeTruthy();
    expect(document.body.textContent?.toLowerCase()).not.toContain('knowledge base');
  });

  it('sends a message and renders the server answer without source/provenance labels', async () => {
    const { container } = render(createElement(App));
    openWidget();
    send('What is judo?');
    expect(await screen.findByText(/Japanese martial art and Olympic sport/)).toBeTruthy();
    expect(container.textContent?.toLowerCase()).not.toContain('knowledge base');
    expect(container.textContent).not.toContain('Gemini');
  });

  it('sends only actual conversation turns, not the welcome copy, as API history', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      if (body.message === 'What is judo?') expect(body.history).toEqual([]);
      if (body.message === 'Tell me more') {
        expect(body.history).toEqual([
          { role: 'user', content: 'What is judo?' },
          { role: 'assistant', content: 'Judo is a Japanese martial art and Olympic sport.' },
        ]);
      }
      return mockResponse({ answer: 'Judo is a Japanese martial art and Olympic sport.', mode: 'local', durationMs: 4 } satisfies ChatResponse);
    });
    vi.stubGlobal('fetch', fetchMock);
    render(createElement(App));
    openWidget();
    send('What is judo?');
    await screen.findByText(/Japanese martial art and Olympic sport/);
    send('Tell me more');
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it('shows the support path when the server declines to guess about a member-only event', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => mockResponse({
      answer: 'I can’t confirm that event or its current details here. Please log in to view member event information, or contact WRJA support.',
      mode: 'handoff', durationMs: 3, showSupportLink: true,
    } satisfies ChatResponse)));
    render(createElement(App));
    openWidget();
    send('Is the Spring Invitational happening this weekend?');
    expect(await screen.findByText(/Please log in to view member event information/)).toBeTruthy();
    expect(screen.getAllByRole('link', { name: /Contact WRJA support/ }).length).toBeGreaterThan(0);
  });

  it('keeps a clear support path if the chat API call fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network unavailable'); }));
    render(createElement(App));
    openWidget();
    send('What else can you tell me?');
    expect(await screen.findByText(/having trouble connecting right now/i)).toBeTruthy();
    expect(screen.getByText(/general information about judo, clubs, coaches, or the events listed here/i)).toBeTruthy();
    expect(screen.getAllByRole('link', { name: /Contact WRJA support/ }).length).toBeGreaterThan(0);
  });

  it('shows clickable follow-up questions under the latest answer and sends one when tapped', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      return mockResponse(body.message === 'Where is the Roodepoort club?'
        ? { answer: 'Roodepoort is at 456 Dojo Avenue.', mode: 'gemini', durationMs: 2 }
        : { answer: 'Judo is a martial art.', mode: 'gemini', durationMs: 2, suggestions: ['Where is the Roodepoort club?'] } satisfies ChatResponse);
    });
    vi.stubGlobal('fetch', fetchMock);
    render(createElement(App));
    openWidget();
    send('What is judo?');
    fireEvent.click(await screen.findByRole('button', { name: 'Where is the Roodepoort club?' }));
    expect(await screen.findByText(/456 Dojo Avenue/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Where is the Roodepoort club?' })).toBeNull();
  });

  it('offers Try again after a failure and does not resend the failed turn as history', async () => {
    let calls = 0;
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      calls += 1;
      if (calls === 1) throw new Error('network unavailable');
      const body = JSON.parse(String(init?.body));
      expect(body.history).toEqual([]);
      return mockResponse({ answer: 'Judo is a Japanese martial art and Olympic sport.', mode: 'local', durationMs: 2 } satisfies ChatResponse);
    });
    vi.stubGlobal('fetch', fetchMock);
    const { container } = render(createElement(App));
    openWidget();
    send('What is judo?');
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
    expect(await screen.findByText(/Japanese martial art and Olympic sport/)).toBeTruthy();
    expect(container.querySelectorAll('.message-row-user')).toHaveLength(1);
    expect(screen.queryByText(/having trouble connecting/i)).toBeNull();
  });

  it('shows the server’s own wait message when rate-limited instead of a connection error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 429, json: async () => ({ error: 'You’re sending messages quickly — please wait a moment and try again.' }) } as Response)));
    render(createElement(App));
    openWidget();
    send('Hello');
    expect(await screen.findByText(/sending messages quickly/)).toBeTruthy();
    expect(screen.queryByText(/having trouble connecting/i)).toBeNull();
  });

  it('keeps the conversation after a refresh and lets the visitor start a new one', async () => {
    const first = render(createElement(App));
    openWidget();
    send('What is judo?');
    await screen.findByText(/Japanese martial art and Olympic sport/);
    first.unmount();
    render(createElement(App));
    openWidget();
    expect(screen.getByText('What is judo?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Start a new conversation' }));
    expect(screen.queryByText('What is judo?')).toBeNull();
    expect(screen.getByText(/Hi! I’m the WRJA assistant/)).toBeTruthy();
  });

  it('supports Enter-to-send and keeps Shift+Enter as a newline', async () => {
    render(createElement(App));
    openWidget();
    const textarea = screen.getByRole('textbox', { name: 'Type a message' }) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'What is judo?' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
    fireEvent.change(textarea, { target: { value: 'What is judo?\n' } });
    expect(textarea.value).toContain('\n');
    fireEvent.change(textarea, { target: { value: 'What is judo?' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    expect(await screen.findByText(/Japanese martial art and Olympic sport/)).toBeTruthy();
  });

  it('prevents rapid duplicate submits while a request is pending', async () => {
    let resolveRequest: ((response: Response) => void) | undefined;
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => { resolveRequest = resolve; }));
    vi.stubGlobal('fetch', fetchMock);
    const { container } = render(createElement(App));
    openWidget();
    const textarea = screen.getByRole('textbox', { name: 'Type a message' });
    fireEvent.change(textarea, { target: { value: 'What is judo?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    resolveRequest?.(mockResponse({ answer: 'A local answer.', mode: 'local', durationMs: 3 } satisfies ChatResponse));
    expect(await screen.findByText('A local answer.')).toBeTruthy();
    expect(container.querySelectorAll('.message-row-user')).toHaveLength(1);
  });

  it('offers Buddy help, asks for confirmation, then pops Buddy in as a separate guide', async () => {
    render(createElement(App));
    openWidget();
    fireEvent.click(screen.getByRole('button', { name: 'Meet the Buddy' }));
    expect(screen.getByRole('dialog', { name: 'Start a guided tour' })).toBeTruthy();
    expect(screen.getByText('Are you ready?')).toBeTruthy();
    expect(screen.queryByRole('complementary', { name: 'WRJA Buddy guided tour' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Let’s go' }));
    expect(screen.getByRole('complementary', { name: 'WRJA Buddy guided tour' })).toBeTruthy();
    expect(screen.getByText(/Hi! I’m WRJA Buddy/)).toBeTruthy();
    expect(await screen.findByRole('img', { name: 'WRJA Buddy fallback illustration' }, { timeout: 1600 })).toBeTruthy();
  });

  it('allows visitors to cancel the Buddy prompt or close the widget independently', () => {
    render(createElement(App));
    openWidget();
    fireEvent.click(screen.getByRole('button', { name: 'Meet the Buddy' }));
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }));
    expect(screen.queryByRole('dialog', { name: 'Start a guided tour' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Close chat' }));
    expect(screen.queryByRole('textbox', { name: 'Type a message' })).toBeNull();
  });
});
