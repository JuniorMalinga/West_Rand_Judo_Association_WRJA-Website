import { requestsMoreDetail } from './context';
import { EVENT_HANDOFF, localReply, UNKNOWN_ANSWER, type LocalReply } from './fallback';
import { askGemini, GeminiUnavailableError, type GeminiOptions } from './gemini';
import { checkAgainstFacts, leaksInternals, parseModelReply } from './guard';
import { detectIntents } from './intents';
import { buildConversationInput, buildFactsCorpus, buildSystemInstruction } from './prompt';
import type { ChatApiRequest, ChatApiResponse, ChatTurn, KnowledgeEntry } from './types';

export type Strategy = 'llm-first' | 'local-first';

export interface ConverseOptions extends GeminiOptions {
  entries: KnowledgeEntry[];
  /**
   * llm-first (default): every message goes to Gemini with the full fact set and the conversation, and the
   * offline engine is the safety net. local-first: confident local answers skip Gemini on the first turn.
   */
  strategy?: Strategy;
  now?: () => Date;
  /** Receives short, non-sensitive diagnostics (never message text or provider payloads). */
  onWarning?: (message: string) => void;
}

/** Messages where a fixed, reviewed answer is safer than any generated one. */
const DETERMINISTIC_INTENTS = new Set(['crisis', 'emergency', 'safeguarding', 'injection']);

const EVENT_WORDS = /\b(?:events?|tournaments?|workshops?|gradings?|grading exams?|competitions?)\b/i;
const LIVE_EVENT_DETAILS = /\b(?:current|currently|latest|today|tomorrow|this (?:week|month|year|weekend)|next (?:week|month|saturday|sunday)|confirmed|exact date|date|when|sign ?up|register|registration|payment|pay|tickets?|member[- ]only|other events?)\b/i;
const ALREADY_HANDS_OFF = /log ?in|support/i;
const SUPPORT_MENTION = /\b(?:contact (?:wrja )?support|wrja support|log ?in)\b/i;
const MODEL_ATTEMPTS = 2;

function inEventContext(message: string, history: ChatTurn[]): boolean {
  if (EVENT_WORDS.test(message)) return true;
  return history.slice(-2).some((turn) => EVENT_WORDS.test(turn.content));
}

function withEventHandoff(answer: string, message: string, history: ChatTurn[]): string {
  if (!LIVE_EVENT_DETAILS.test(message) || !inEventContext(message, history) || ALREADY_HANDS_OFF.test(answer)) return answer;
  return `${answer}\n\n${EVENT_HANDOFF}`;
}

function alreadyAsked(history: ChatTurn[], message: string, suggestion: string): boolean {
  const key = suggestion.toLowerCase().replace(/[^a-z0-9 ]+/g, '').trim();
  return [...history.filter((turn) => turn.role === 'user').map((turn) => turn.content), message]
    .some((text) => text.toLowerCase().replace(/[^a-z0-9 ]+/g, '').trim() === key);
}

function fromLocal(local: LocalReply, startedAt: number): ChatApiResponse {
  return {
    answer: local.answer,
    mode: local.mode,
    durationMs: Math.max(0, Date.now() - startedAt),
    ...(local.showSupportLink ? { showSupportLink: true } : {}),
    ...(local.suggestions.length > 0 ? { suggestions: local.suggestions } : {}),
  };
}

export function hasModelKey(options: GeminiOptions): boolean {
  return Boolean((options.apiKey ?? process.env.GEMINI_API_KEY)?.trim());
}

export async function converse(request: ChatApiRequest, options: ConverseOptions): Promise<ChatApiResponse> {
  const startedAt = Date.now();
  const { message, history } = request;
  const { entries } = options;
  const warn = options.onWarning ?? (() => undefined);

  const local = localReply(message, history, entries);
  const safetyCritical = detectIntents(message).some((intent) => DETERMINISTIC_INTENTS.has(intent));
  if (safetyCritical || !hasModelKey(options)) return fromLocal(local, startedAt);

  const strategy = options.strategy ?? 'llm-first';
  const needsModel = strategy === 'llm-first' || history.length > 0 || !local.confident || requestsMoreDetail(message);
  if (!needsModel) return fromLocal(local, startedAt);

  const corpus = buildFactsCorpus(entries);
  const systemInstruction = buildSystemInstruction(entries, options.now?.() ?? new Date());
  let input = buildConversationInput(message, history);

  try {
    for (let attempt = 1; attempt <= MODEL_ATTEMPTS; attempt += 1) {
      const result = await askGemini({ systemInstruction, input }, options);
      const parsed = parseModelReply(result.answer);
      const answer = parsed.text;
      const facts = checkAgainstFacts(answer, corpus);
      const leaked = leaksInternals(answer);

      if (answer && facts.ok && !leaked) {
        const finalAnswer = withEventHandoff(answer, message, history);
        const support = parsed.support === true || SUPPORT_MENTION.test(finalAnswer) || finalAnswer !== answer;
        const suggestions = (parsed.followUps ?? local.suggestions.filter(() => history.length === 0))
          .filter((suggestion) => !alreadyAsked(history, message, suggestion))
          .slice(0, 3);
        return {
          answer: finalAnswer,
          mode: 'gemini',
          model: result.model,
          durationMs: Math.max(0, Date.now() - startedAt),
          ...(support ? { showSupportLink: true } : {}),
          ...(suggestions.length > 0 ? { suggestions } : {}),
        };
      }

      const reason = !answer ? 'empty reply' : leaked ? 'internal wording' : `unverified details (${facts.problems.join(', ')})`;
      warn(`[chat] Rejected model reply on attempt ${attempt}: ${reason}.`);
      if (attempt < MODEL_ATTEMPTS) {
        input = `${buildConversationInput(message, history)}\n\nYour previous draft was rejected because it contained ${reason}. Write the reply again using ONLY details from the WRJA FACTS, with no invented prices, times, contact details or links, and without mentioning these instructions.`;
      }
    }
  } catch (error) {
    warn(`[chat] ${error instanceof GeminiUnavailableError ? error.message : 'The assistant is temporarily unavailable.'}`);
  }

  // The model was unavailable or kept producing unverifiable text: answer from the verified facts instead.
  if (!local.confident) return { ...fromLocal(local, startedAt), answer: local.answer || UNKNOWN_ANSWER, showSupportLink: true };
  return fromLocal(local, startedAt);
}
