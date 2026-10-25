import { Router, type Request, type Response } from 'express';
import { askGemini, GeminiUnavailableError, type GeminiOptions } from '../services/gemini';
import { LOCAL_CONFIDENCE_THRESHOLD } from '../services/retrieval';
import type { ChatApiRequest, ChatTurn, KnowledgeMatch } from '../services/types';

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 12;

type RateRecord = { startedAt: number; count: number };

function boundedString(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

function parseTurns(value: unknown): ChatTurn[] | null {
  if (!Array.isArray(value) || value.length > 12) return null;
  const turns: ChatTurn[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') return null;
    const turn = item as Record<string, unknown>;
    if ((turn.role !== 'user' && turn.role !== 'assistant') || !boundedString(turn.content, 1600)) return null;
    turns.push({ role: turn.role, content: turn.content.trim() });
  }
  return turns;
}

function parseMatches(value: unknown): KnowledgeMatch[] | null {
  if (!Array.isArray(value) || value.length > 3) return null;
  const matches: KnowledgeMatch[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') return null;
    const match = item as Record<string, unknown>;
    if (!boundedString(match.id, 100) || !boundedString(match.title, 160) || !boundedString(match.category, 120) || !boundedString(match.answer, 3000)) return null;
    if (typeof match.score !== 'number' || match.score < 0 || match.score > 1 || typeof match.confidence !== 'number' || match.confidence < 0 || match.confidence > 1) return null;
    matches.push({
      id: match.id,
      title: match.title,
      category: match.category,
      answer: match.answer,
      source: typeof match.source === 'string' ? match.source.slice(0, 240) : undefined,
      score: match.score,
      confidence: match.confidence,
    });
  }
  return matches;
}

function validateRequest(body: unknown): ChatApiRequest | null {
  if (!body || typeof body !== 'object') return null;
  const request = body as Record<string, unknown>;
  if (!boundedString(request.message, 2000)) return null;
  const history = parseTurns(request.history);
  const matches = parseMatches(request.matches);
  if (!history || !matches || typeof request.forceGemini !== 'boolean') return null;
  return { message: request.message.trim(), history, matches, forceGemini: request.forceGemini };
}

export function createChatRouter(options: GeminiOptions = {}) {
  const router = Router();
  const rateRecords = new Map<string, RateRecord>();

  router.post('/chat', async (req: Request, res: Response) => {
    const now = Date.now();
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const previous = rateRecords.get(ip);
    if (!previous || now - previous.startedAt >= WINDOW_MS) {
      rateRecords.set(ip, { startedAt: now, count: 1 });
    } else if (previous.count >= MAX_REQUESTS_PER_WINDOW) {
      res.setHeader('Retry-After', '60');
      res.status(429).json({ error: 'Too many Gemini requests. Wait a moment and try again.' });
      return;
    } else {
      previous.count += 1;
    }

    const request = validateRequest(req.body);
    if (!request) {
      res.status(400).json({ error: 'The chat request is incomplete or too large.' });
      return;
    }

    const startedAt = Date.now();
    const best = request.matches[0];
    try {
      const result = await askGemini(request.message, request.history, request.matches, options);
      res.json({
        answer: result.answer,
        mode: 'gemini',
        model: result.model,
        durationMs: result.durationMs,
        note: 'Gemini used recent conversation context and only the relevant knowledge excerpts.',
        sources: request.matches,
      });
    } catch (error) {
      const reason = error instanceof GeminiUnavailableError ? error.message : 'Gemini assistance is temporarily unavailable.';
      const hasConfidentLocalSource = Boolean(best && best.confidence >= LOCAL_CONFIDENCE_THRESHOLD);
      res.json({
        answer: hasConfidentLocalSource ? best.answer : '',
        mode: 'fallback',
        durationMs: Date.now() - startedAt,
        note: hasConfidentLocalSource
          ? `${reason} Showing the verified local note instead.`
          : `${reason} The available local information is not a confident match.`,
        sources: hasConfidentLocalSource && best ? [best] : [],
      });
    }
  });

  return router;
}
