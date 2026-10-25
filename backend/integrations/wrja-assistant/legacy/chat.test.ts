import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../server/index';
import type { ChatApiRequest, KnowledgeMatch } from '../server/services/types';

const localMatch: KnowledgeMatch = {
  id: 'saved-note',
  title: 'Known local note',
  category: 'Test',
  answer: 'The verified local answer is forty-two.',
  source: 'Test fixture',
  score: 0.88,
  confidence: 0.88,
};

function payload(overrides: Partial<ChatApiRequest> = {}): ChatApiRequest {
  return {
    message: 'What is the answer?',
    history: [],
    matches: [localMatch],
    forceGemini: false,
    ...overrides,
  };
}

describe('Express chat endpoint', () => {
  it('returns the verified local answer when Gemini has no key', async () => {
    const app = createApp({ apiKey: '' });
    const response = await request(app).post('/api/chat').send(payload());
    expect(response.status).toBe(200);
    expect(response.body.mode).toBe('fallback');
    expect(response.body.answer).toContain('forty-two');
    expect(response.body.sources[0].id).toBe('saved-note');
  });

  it('honestly reports an unknown question when no local note is confident', async () => {
    const app = createApp({ apiKey: '' });
    const response = await request(app).post('/api/chat').send(payload({ matches: [] }));
    expect(response.status).toBe(200);
    expect(response.body.mode).toBe('fallback');
    expect(response.body.answer).toBe('');
    expect(response.body.note).toMatch(/not a confident match/i);
  });

  it('rejects malformed or oversized chat input', async () => {
    const app = createApp({ apiKey: '' });
    const response = await request(app).post('/api/chat').send(payload({ message: 'x'.repeat(2001) }));
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/incomplete or too large/i);
  });

  it('calls Gemini only on the server and disables provider-side interaction storage', async () => {
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect((init?.headers as Record<string, string>)['x-goog-api-key']).toBe('server-only-test-key');
      expect(body.store).toBe(false);
      expect(body.model).toBe('gemini-3.8-flash');
      expect(body.input).toContain('Known local note');
      expect(body.input).toContain('CURRENT USER QUESTION');
      return new Response(JSON.stringify({
        output: [{ type: 'model_output', content: [{ type: 'text', text: 'A careful Gemini explanation.' }] }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }) as unknown as typeof fetch;

    const app = createApp({ apiKey: 'server-only-test-key', model: 'gemini-3.8-flash', fetchImpl: fetchMock });
    const response = await request(app).post('/api/chat').send(payload({ forceGemini: true }));
    expect(response.status).toBe(200);
    expect(response.body.mode).toBe('gemini');
    expect(response.body.answer).toBe('A careful Gemini explanation.');
    expect(response.body.sources[0].id).toBe('saved-note');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to verified local material when Gemini is unreachable', async () => {
    const fetchMock = vi.fn(async () => { throw new Error('network down'); }) as unknown as typeof fetch;
    const app = createApp({ apiKey: 'server-only-test-key', fetchImpl: fetchMock });
    const response = await request(app).post('/api/chat').send(payload({ forceGemini: true }));
    expect(response.status).toBe(200);
    expect(response.body.mode).toBe('fallback');
    expect(response.body.answer).toContain('forty-two');
    expect(response.body.note).toMatch(/could not reach Gemini/i);
  });
});


describe('chat resilience', () => {
  it('handles multiple concurrent Gemini requests independently', async () => {
    const capturedInputs: string[] = [];
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      capturedInputs.push(body.input as string);
      return new Response(JSON.stringify({
        output: [{ type: 'model_output', content: [{ type: 'text', text: 'Concurrent response.' }] }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }) as unknown as typeof fetch;
    const app = createApp({ apiKey: 'server-only-test-key', fetchImpl: fetchMock });
    const responses = await Promise.all([1, 2, 3].map((number) => request(app).post('/api/chat').send(payload({
      message: `Question ${number}`,
      history: [{ role: 'user', content: `Prior subject ${number}` }],
      forceGemini: true,
    }))));

    expect(responses.map((response) => response.status)).toEqual([200, 200, 200]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    for (const number of [1, 2, 3]) {
      expect(capturedInputs.some((input) => input.includes(`Prior subject ${number}`) && input.includes(`Question ${number}`))).toBe(true);
    }
  });

  it('falls back to the local note when Gemini rejects an invalid key', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ error: { message: 'invalid API key' } }), { status: 400 })) as unknown as typeof fetch;
    const app = createApp({ apiKey: 'invalid-test-key', fetchImpl: fetchMock });
    const response = await request(app).post('/api/chat').send(payload({ forceGemini: true }));
    expect(response.status).toBe(200);
    expect(response.body.mode).toBe('fallback');
    expect(response.body.answer).toContain('forty-two');
    expect(response.body.note).toMatch(/HTTP 400/);
  });

  it('returns a clear fallback when Gemini times out', async () => {
    const timeoutError = Object.assign(new Error('The operation was aborted'), { name: 'TimeoutError' });
    const fetchMock = vi.fn(async () => { throw timeoutError; }) as unknown as typeof fetch;
    const app = createApp({ apiKey: 'server-only-test-key', fetchImpl: fetchMock, timeoutMs: 5 });
    const response = await request(app).post('/api/chat').send(payload({ forceGemini: true }));
    expect(response.status).toBe(200);
    expect(response.body.mode).toBe('fallback');
    expect(response.body.answer).toContain('forty-two');
    expect(response.body.note).toMatch(/timed out/i);
  });
});


describe('Gemini latency settings', () => {
  it('requests the low thinking level by default for interactive chat', async () => {
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body.generation_config.thinking_level).toBe('low');
      expect(body.generation_config.max_output_tokens).toBe(900);
      return new Response(JSON.stringify({ output_text: 'Fast chat answer.' }), { status: 200 });
    }) as unknown as typeof fetch;
    const app = createApp({ apiKey: 'server-only-test-key', fetchImpl: fetchMock });
    const response = await request(app).post('/api/chat').send(payload({ forceGemini: true }));
    expect(response.status).toBe(200);
    expect(response.body.mode).toBe('gemini');
  });
});
