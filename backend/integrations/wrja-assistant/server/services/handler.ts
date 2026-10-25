import { converse, type ConverseOptions, type Strategy } from './converse';
import type { GeminiOptions } from './gemini';
import type { ChatApiRequest, ChatApiResponse, ChatTurn, KnowledgeEntry } from './types';
import { loadWrjaEntries } from './wrjaKnowledge';

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;
export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_HISTORY_TURNS = 24;
const MAX_HISTORY_TURN_LENGTH = 2400;
const MAX_HISTORY_TOTAL_LENGTH = 24_000;

type RateRecord = { startedAt: number; count: number };

export interface ChatRouterOptions extends GeminiOptions {
  /** Server-only injection point used by deterministic tests. */
  entries?: KnowledgeEntry[];
  strategy?: Strategy;
  now?: () => Date;
  /** Clock for the rate limiter (tests). */
  clock?: () => number;
  onWarning?: (message: string) => void;
}

export type HandlerResult =
  | { status: 200; body: ChatApiResponse }
  | { status: 400 | 429; body: { error: string }; retryAfterSeconds?: number };

function cleanMessage(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const message = value.replace(/\u0000/g, '').trim();
  return message.length > 0 && message.length <= MAX_MESSAGE_LENGTH ? message : null;
}

function parseHistory(value: unknown): ChatTurn[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_HISTORY_TURNS) return null;
  const history: ChatTurn[] = [];
  let totalLength = 0;
  for (const raw of value) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const turn = raw as Record<string, unknown>;
    if ((turn.role !== 'user' && turn.role !== 'assistant') || typeof turn.content !== 'string') return null;
    const content = turn.content.replace(/\u0000/g, '').trim();
    if (!content || content.length > MAX_HISTORY_TURN_LENGTH) return null;
    totalLength += content.length;
    if (totalLength > MAX_HISTORY_TOTAL_LENGTH) return null;
    history.push({ role: turn.role, content });
  }
  return history;
}

export function validateRequest(body: unknown): ChatApiRequest | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const request = body as Record<string, unknown>;
  const message = cleanMessage(request.message);
  const history = parseHistory(request.history);
  if (!message || !history) return null;
  return { message, history };
}

/** Framework-free request handler: validation, rate limiting and the conversation itself. */
export function createChatHandler(options: ChatRouterOptions = {}) {
  const records = new Map<string, RateRecord>();
  const entries = options.entries ?? loadWrjaEntries();
  const clock = options.clock ?? Date.now;
  const converseOptions: ConverseOptions = {
    ...options,
    entries,
    strategy: options.strategy ?? (process.env.ASSISTANT_STRATEGY === 'local-first' ? 'local-first' : 'llm-first'),
    onWarning: options.onWarning ?? ((message) => console.warn(message)),
  };

  return async function handleChat(body: unknown, ip: string): Promise<HandlerResult> {
    const now = clock();
    const previous = records.get(ip);
    if (!previous || now - previous.startedAt >= WINDOW_MS) {
      records.set(ip, { startedAt: now, count: 1 });
    } else if (previous.count >= MAX_REQUESTS_PER_WINDOW) {
      return { status: 429, body: { error: 'You’re sending messages quickly — please wait a moment and try again.' }, retryAfterSeconds: Math.max(1, Math.ceil((WINDOW_MS - (now - previous.startedAt)) / 1000)) };
    } else {
      previous.count += 1;
    }
    if (records.size > 5000) {
      for (const [key, record] of records) if (now - record.startedAt >= WINDOW_MS) records.delete(key);
    }

    const request = validateRequest(body);
    if (!request) return { status: 400, body: { error: `Please enter a message of up to ${MAX_MESSAGE_LENGTH.toLocaleString('en-US')} characters.` } };

    return { status: 200, body: await converse(request, converseOptions) };
  };
}
