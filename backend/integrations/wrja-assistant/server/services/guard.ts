export interface ParsedReply {
  text: string;
  /** null when the model omitted the control line entirely; [] when it deliberately offered none. */
  followUps: string[] | null;
  support: boolean | null;
}

const FOLLOW_UP_TAG = /\[\[\s*FOLLOW[_\s-]?UPS?\s*:?([^\]]*)\]\]/gi;
const SUPPORT_TAG = /\[\[\s*SUPPORT\s*:?\s*(yes|no|true|false)?\s*\]\]/gi;
const ANY_CONTROL_TAG = /\[\[[^\]]*\]\]/g;
const MAX_FOLLOW_UPS = 3;
const MAX_FOLLOW_UP_LENGTH = 60;

function cleanFollowUp(value: string): string {
  return value.replace(/^[\s\-–•*"“”']+|[\s"“”']+$/g, '').replace(/\s+/g, ' ');
}

/** Cut text back to the last complete sentence when a reply was truncated mid-thought. */
export function trimToCompleteSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed || /[.!?)"”’…:*\]]$/.test(trimmed) || /\n[-*•]\s.+$/.test(trimmed)) return trimmed;
  const lastEnd = Math.max(trimmed.lastIndexOf('. '), trimmed.lastIndexOf('! '), trimmed.lastIndexOf('? '), trimmed.lastIndexOf('.\n'), trimmed.lastIndexOf('\n\n'));
  return lastEnd >= 20 ? trimmed.slice(0, lastEnd + 1).trim() : trimmed;
}

/** Split the model output into the visible reply and its hidden control lines. */
export function parseModelReply(raw: string): ParsedReply {
  let followUps: string[] | null = null;
  let support: boolean | null = null;

  for (const match of raw.matchAll(FOLLOW_UP_TAG)) {
    const items = (match[1] ?? '').split('|').map(cleanFollowUp).filter((item) => item.length >= 3 && item.length <= MAX_FOLLOW_UP_LENGTH);
    followUps = items;
  }
  for (const match of raw.matchAll(SUPPORT_TAG)) {
    const value = (match[1] ?? '').toLowerCase();
    if (value === 'yes' || value === 'true') support = true;
    else if (value === 'no' || value === 'false') support = false;
  }

  // Drop every control tag, plus a dangling, unterminated one at the very end of a truncated reply.
  const text = trimToCompleteSentence(raw.replace(ANY_CONTROL_TAG, '').replace(/\[\[[^\]]*$/, '').replace(/\n{3,}/g, '\n\n').trim());
  const seen = new Set<string>();
  const unique = followUps === null ? null : followUps.filter((item) => { const key = item.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; }).slice(0, MAX_FOLLOW_UPS);
  return { text, followUps: unique, support };
}

/* ---------- Hallucination guard ---------- */

const EMERGENCY_NUMBERS = ['112', '10177', '10111', '0800567567'];

function digitsOnly(value: string): string {
  return value.replace(/\D+/g, '');
}

function randAmounts(text: string): Set<string> {
  const amounts = new Set<string>();
  for (const match of text.matchAll(/\bR\s?(\d{1,3}(?:[ ,]\d{3})+|\d+)(?:[.,](\d{1,2}))?\b/g)) {
    amounts.add(`${digitsOnly(match[1])}${match[2] && Number(match[2]) !== 0 ? `.${match[2]}` : ''}`);
  }
  for (const match of text.matchAll(/\b(\d{1,3}(?:[ ,]\d{3})+|\d+)\s?(?:rand|ZAR)\b/gi)) amounts.add(digitsOnly(match[1]));
  return amounts;
}

function to24Hour(hour: number, minute: number, meridiem: string | undefined): string | null {
  let h = hour;
  if (meridiem) {
    if (h < 1 || h > 12) return null;
    const pm = meridiem.toLowerCase().startsWith('p');
    h = (h % 12) + (pm ? 12 : 0);
  }
  if (h > 23 || minute > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function clockTimes(text: string): Set<string> {
  const times = new Set<string>();
  for (const match of text.matchAll(/\b([01]?\d|2[0-3])\s?[:h.]\s?([0-5]\d)\b(?:\s?(am|pm))?/gi)) {
    if (match[0].includes('.') && !match[3]) continue; // avoid reading "1.50" prices as times
    const value = to24Hour(Number(match[1]), Number(match[2]), match[3]);
    if (value) times.add(value);
  }
  for (const match of text.matchAll(/\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s?(am|pm)\b/gi)) {
    const value = to24Hour(Number(match[1]), Number(match[2] ?? 0), match[3]);
    if (value) times.add(value);
  }
  return times;
}

export interface FactCheck {
  ok: boolean;
  problems: string[];
}

/**
 * Reject replies that state specific prices, clock times, e-mail addresses, phone numbers or web
 * addresses that are not in the verified WRJA facts. This is the last line of defence against a model
 * filling a gap with something plausible.
 */
export function checkAgainstFacts(answer: string, factsCorpus: string): FactCheck {
  const problems: string[] = [];

  const knownAmounts = randAmounts(factsCorpus);
  for (const amount of randAmounts(answer)) if (!knownAmounts.has(amount)) problems.push(`price R${amount}`);

  const knownTimes = clockTimes(factsCorpus);
  for (const time of clockTimes(answer)) if (!knownTimes.has(time)) problems.push(`time ${time}`);

  const emails = answer.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g) ?? [];
  for (const email of emails) if (!factsCorpus.toLowerCase().includes(email.toLowerCase())) problems.push('email address');

  const factsDigits = digitsOnly(factsCorpus);
  for (const match of answer.matchAll(/(?:\+?\d[\d\s().-]{6,}\d)/g)) {
    const digits = digitsOnly(match[0]);
    if (digits.length < 7) continue;
    if (EMERGENCY_NUMBERS.some((number) => digits.endsWith(number) || digits === number)) continue;
    if (factsDigits.includes(digits)) continue;
    // Year-like or date-like digit runs are not phone numbers.
    if (/^(?:19|20)\d{2}$/.test(digits)) continue;
    problems.push('phone number');
  }
  for (const match of answer.matchAll(/\b(?:https?:\/\/|www\.)[^\s)]+/gi)) {
    if (!factsCorpus.toLowerCase().includes(match[0].toLowerCase())) problems.push('web address');
  }

  return { ok: problems.length === 0, problems };
}

const INTERNAL_LEAK = /\b(?:knowledge base|wrja facts|facts (?:block|section)|system prompt|system instruction|control lines?|follow_ups?|reference material)\b|\[\[/i;

/** True when a reply exposes how the assistant works or contains control syntax. */
export function leaksInternals(answer: string): boolean {
  return INTERNAL_LEAK.test(answer);
}
