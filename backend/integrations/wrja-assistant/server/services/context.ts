import type { ChatTurn, KnowledgeEntry } from './types';

const FOLLOW_UP_START = /^(?:(?:and|but|so|then|ok(?:ay)?|cool|great|thanks?|alright)[\s,]+)*(?:(?:is|was|does|did|can|could|will|would|has|have|are|were)\s+)?(?:it|that|this|they|them|those|these|he|she|his|her|why|what about|what if|how about|tell me more|explain more|can you elaborate|could you elaborate|go on|continue|elaborate|which one|the (?:first|second|third|last|other) one)\b/i;
const SHORT_WH_FOLLOW_UP = /^(?:and\s+)?(?:when|where|how (?:much|many|long|often|far)|which|what time|what day)\b/i;
const DETAIL_REQUEST = /\b(?:tell me more|more (?:about|info|information|details?)|explain (?:more|further|that)|elaborate|go deeper|more detail|why is that|how so|expand on that|what else)\b/i;

export function isFollowUpQuestion(message: string): boolean {
  const clean = message.trim();
  const words = clean.split(/\s+/).length;
  return FOLLOW_UP_START.test(clean) || DETAIL_REQUEST.test(clean) || (words <= 4 && /^(?:and|but|what about|how about|so)\b/i.test(clean)) || (SHORT_WH_FOLLOW_UP.test(clean) && (words <= 2 || (words <= 6 && /\b(?:it|that|this|they|them|there)\b/i.test(clean))));
}

export function requestsMoreDetail(message: string): boolean {
  return DETAIL_REQUEST.test(message.trim());
}

/** Add the previous subject only for short or referential follow-ups. */
export function contextualizeQuestion(message: string, history: ChatTurn[]): string {
  const cleanMessage = message.trim();
  if (!isFollowUpQuestion(cleanMessage)) return cleanMessage;

  const previousUser = [...history].reverse().find((turn) => turn.role === 'user');
  if (!previousUser) return cleanMessage;

  const priorQuestion = previousUser.content.trim().slice(0, 500);
  return [cleanMessage, `Previous user topic: ${priorQuestion}`].join('\n');
}

export function compactHistory(history: ChatTurn[], maxTurns = 8): ChatTurn[] {
  return history.slice(-maxTurns).map((turn) => ({
    role: turn.role,
    content: turn.content.trim().slice(0, 1200),
  }));
}

/* ---------- Entity focus: “what is the cost?” → which thing were we just talking about? ---------- */

const GENERIC_ALIAS_WORDS = new Set([
  'judo', 'club', 'annual', 'wrja', 'workshop', 'coach', 'instructor', 'head', 'assistant', 'founder', 'fitness',
  'conditioning', 'of', 'for', 'the', 'and', 'exams', 'exam', 'self', 'defense', 'defence', 'kjk', 'golden', 'score',
  'a', 's', 'in', 'to',
]);
const FOCUS_CATEGORIES = new Set(['club', 'event', 'instructor']);

function aliasesFor(entry: KnowledgeEntry): string[] {
  const words = entry.title
    .toLowerCase()
    .replace(/[’']s\b/g, '')
    .replace(/[^a-z0-9\s-]+/g, ' ')
    .split(/[\s-]+/)
    .filter((word) => word.length > 2 && !GENERIC_ALIAS_WORDS.has(word));
  const aliases = new Set(words);
  if (entry.category === 'event') {
    if (entry.id.includes('women')) aliases.add('women');
    if (entry.id.includes('grading')) { aliases.add('grading'); aliases.add('belt'); }
    if (entry.id.includes('tournament')) aliases.add('tournament');
    if (entry.id.includes('beginner')) aliases.add('beginners');
  }
  return [...aliases];
}

/** Which club / event / coach was named most recently? Scans newest → oldest, user turns first on ties. */
export function findFocusEntry(history: ChatTurn[], entries: KnowledgeEntry[]): KnowledgeEntry | undefined {
  const candidates = entries.filter((entry) => FOCUS_CATEGORIES.has(entry.category));
  for (const turn of [...history].reverse()) {
    const text = ` ${turn.content.toLowerCase().replace(/[’']s\b/g, '').replace(/[^a-z0-9\s-]+/g, ' ')} `;
    const hits = candidates.filter((entry) => aliasesFor(entry).some((alias) => text.includes(` ${alias} `) || text.includes(` ${alias}s `)));
    // Only trust an unambiguous mention; a list answer that names everything gives no single focus.
    if (hits.length === 1) return hits[0];
  }
  return undefined;
}

export function entryMentionedIn(message: string, entries: KnowledgeEntry[]): KnowledgeEntry[] {
  const text = ` ${message.toLowerCase().replace(/[’']s\b/g, '').replace(/[^a-z0-9\s-]+/g, ' ')} `;
  return entries.filter((entry) => FOCUS_CATEGORIES.has(entry.category)
    && aliasesFor(entry).some((alias) => text.includes(` ${alias} `) || text.includes(` ${alias}s `)));
}
