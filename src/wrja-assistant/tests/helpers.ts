import { vi } from 'vitest';
import { createChatHandler, type ChatRouterOptions } from '../server/services/handler';
import type { ChatApiResponse, ChatTurn } from '../server/services/types';

export type Reply = string | Response | (() => Response | Promise<Response>);

/** A scripted stand-in for the Gemini Interactions API. Replies are consumed in order; the last one repeats. */
export function fakeGemini(replies: Reply[]) {
  const requests: Array<{ system: string; input: string; body: Record<string, unknown> }> = [];
  let index = 0;
  const fetchImpl = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
    if (init?.method === 'GET') return new Response(JSON.stringify({ id: 'poll-1', status: 'completed', output_text: 'Polled answer.' }), { status: 200 });
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    requests.push({ system: String(body.system_instruction), input: String(body.input), body });
    const next = replies[Math.min(index, replies.length - 1)];
    index += 1;
    if (typeof next === 'string') return new Response(JSON.stringify({ output_text: next }), { status: 200 });
    return typeof next === 'function' ? next() : next;
  }) as unknown as typeof fetch & { mock: { calls: unknown[][] } };
  return { fetchImpl, requests };
}

export function makeChat(options: ChatRouterOptions = {}) {
  const warnings: string[] = [];
  const handle = createChatHandler({ onWarning: (message) => warnings.push(message), ...options });
  async function ask(message: string, history: ChatTurn[] = [], ip = '10.0.0.1'): Promise<ChatApiResponse> {
    const result = await handle({ message, history }, ip);
    if (result.status !== 200) throw new Error(`Unexpected status ${result.status}: ${result.body.error}`);
    return result.body;
  }
  /** Run a multi-turn conversation, feeding each answer back as history like the real widget does. */
  async function converse(messages: string[]): Promise<ChatApiResponse[]> {
    const history: ChatTurn[] = [];
    const out: ChatApiResponse[] = [];
    for (const message of messages) {
      const response = await ask(message, history);
      out.push(response);
      history.push({ role: 'user', content: message }, { role: 'assistant', content: response.answer });
    }
    return out;
  }
  return { handle, ask, converse, warnings };
}

export const withTags = (text: string, followUps: string[] = [], support = false) =>
  `${text}\n[[FOLLOW_UPS: ${followUps.join(' | ')}]]\n[[SUPPORT: ${support ? 'yes' : 'no'}]]`;
