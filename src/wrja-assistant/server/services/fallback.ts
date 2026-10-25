import { contextualizeQuestion, entryMentionedIn, findFocusEntry, isFollowUpQuestion } from './context';
import { detectIntents, looksAfrikaans, type Intent } from './intents';
import { isConfidentLocalMatch } from './pipeline';
import { searchKnowledge } from './retrieval';
import type { ChatTurn, KnowledgeEntry } from './types';

export interface LocalReply {
  answer: string;
  suggestions: string[];
  showSupportLink: boolean;
  /** True when this is a deliberate, well-grounded answer (not a "I'm not sure" reply). */
  confident: boolean;
  mode: 'local' | 'handoff' | 'fallback';
}

export const EVENT_HANDOFF = 'For confirmed current dates, registration details, or any additional member events, please log in or contact WRJA support.';
export const UNKNOWN_ANSWER = 'I’m not certain about that. Please contact WRJA support and they’ll point you to the right information.';

const TOPIC_STARTERS = ['Where do your clubs train?', 'Who are your coaches?', 'What events do you offer?', 'How do I get started with judo?'];

/** Rotate wording so repeated intents in one conversation don't read like a script. */
function pick<T>(options: T[], history: ChatTurn[]): T {
  return options[history.filter((turn) => turn.role === 'assistant').length % options.length];
}

function asked(history: ChatTurn[], message: string, suggestion: string): boolean {
  const key = suggestion.toLowerCase().replace(/[^a-z0-9 ]+/g, '').trim();
  return [...history.filter((turn) => turn.role === 'user').map((turn) => turn.content), message]
    .some((text) => text.toLowerCase().replace(/[^a-z0-9 ]+/g, '').trim() === key);
}

function freshSuggestions(pool: string[], history: ChatTurn[], message: string, limit = 3): string[] {
  return pool.filter((suggestion) => !asked(history, message, suggestion)).slice(0, limit);
}

function firstSentence(text: string): string {
  const match = text.match(/^.*?[.!?](?=\s|$)/s);
  return (match ? match[0] : text).trim();
}

function splitTitle(title: string): { role: string; name: string } {
  const parts = title.split(/\s+-\s+/);
  return parts.length > 1 ? { role: parts[0].trim(), name: parts.slice(1).join(' - ').trim() } : { role: '', name: title.trim() };
}

function supportOnly(answer: string, suggestions: string[] = []): LocalReply {
  return { answer, suggestions, showSupportLink: true, confident: true, mode: 'handoff' };
}

function reply(answer: string, suggestions: string[], extra: Partial<LocalReply> = {}): LocalReply {
  return { answer, suggestions, showSupportLink: false, confident: true, mode: 'local', ...extra };
}

/* ---------- WRJA-specific sections ---------- */

function clubsSection(entries: KnowledgeEntry[]): string | null {
  const clubs = entries.filter((entry) => entry.category === 'club');
  if (clubs.length === 0) return null;
  const lead = clubs.length === 1 ? 'Here’s our club:' : `We have ${clubs.length} clubs across the West Rand:`;
  return `${lead}\n\n${clubs.map((club) => `- **${club.title}:** ${club.answer}`).join('\n')}`;
}

function coachesSection(entries: KnowledgeEntry[]): string | null {
  const coaches = entries.filter((entry) => entry.category === 'instructor');
  if (coaches.length === 0) return null;
  const lines = coaches.map((coach) => {
    const { role, name } = splitTitle(coach.title);
    const rank = coach.answer.match(/\b(\d(?:st|nd|rd|th) Dan|Sho Dan)\b/i)?.[1];
    const employment = coach.answer.match(/\b(full-time|part-time)\b/i)?.[1]?.toLowerCase();
    const nickname = /^Coach\s+\w+$/.test(role) ? `known as ${role}` : '';
    const roleText = role && !/^(?:Coach|Instructor)$/i.test(role) && !nickname ? role : '';
    const details = [roleText, nickname, rank, employment].filter(Boolean).join(', ');
    return `- **${name}**${details ? ` — ${details}` : ''}`;
  });
  return `Here’s the coaching team:\n\n${lines.join('\n')}\n\nTell me a name and I’ll share their background.`;
}

function eventsSection(entries: KnowledgeEntry[]): string | null {
  const events = entries.filter((entry) => entry.category === 'event');
  if (events.length === 0) return null;
  return `Here are the events I have details on:\n\n${events.map((event) => `- **${event.title}:** ${event.answer}`).join('\n')}\n\n${EVENT_HANDOFF}`;
}

function classesSection(entries: KnowledgeEntry[]): string | null {
  const ids = ['age-to-start', 'what-to-wear', 'shy-or-nervous', 'do-i-need-to-be-athletic'];
  const found = ids.map((id) => entries.find((entry) => entry.id === id)).filter((entry): entry is KnowledgeEntry => Boolean(entry));
  if (found.length === 0) return null;
  const lines = found.map((entry) => `- **${entry.title}** ${entry.answer}`);
  return `Our classes are built to welcome new judoka. A few things people usually want to know first:\n\n${lines.join('\n')}`;
}

function moneyLines(entries: KnowledgeEntry[]): string[] {
  const lines: string[] = [];
  for (const entry of entries.filter((item) => item.category === 'event')) {
    const sentences = entry.answer.split(/(?<=[.!?])\s+/).filter((sentence) => /\bR\s?\d|\bfree\b/i.test(sentence));
    if (sentences.length > 0) lines.push(`- **${entry.title}:** ${sentences.join(' ')}`);
  }
  return lines;
}

/* ---------- Intent replies ---------- */

function replyForIntent(intent: Intent, message: string, history: ChatTurn[], entries: KnowledgeEntry[]): LocalReply | null {
  const hasHistory = history.length > 0;
  switch (intent) {
    case 'crisis':
      return supportOnly(
        'I’m really sorry things feel this heavy right now — you matter, and you don’t have to carry it alone. Please reach out to someone you trust today. In South Africa you can call the SADAG crisis line on 0800 567 567, and if you’re in immediate danger, call 112.\n\nI’m only a judo website assistant, so I can’t give you the support you deserve, but I’m glad you said something.',
      );
    case 'emergency':
      return supportOnly('If someone is hurt or in danger right now, please call emergency services first — 112 from a mobile phone, or 10177 for an ambulance. Once everyone is safe, WRJA support can help with anything else.');
    case 'safeguarding':
      return supportOnly('Thank you for raising this — I take anything involving a child’s wellbeing or a concern about conduct seriously, and I’m not the right one to assess it. Please contact WRJA support directly so a person can look into it properly. If a child may be in immediate danger, call the police on 10111 or 112.');
    case 'injection':
      return reply('I can’t change how I work, but I’m happy to help with anything about WRJA — our clubs, coaches, events, or getting started in judo. What would you like to know?', TOPIC_STARTERS.slice(0, 3));
    case 'insult':
      return reply('I’m sorry I’ve frustrated you — I’d like to put that right. Tell me what you’re trying to find out, or I can point you to WRJA support so a person can help.', TOPIC_STARTERS.slice(0, 3), { showSupportLink: true });
    case 'human':
      return supportOnly(pick([
        'Of course — a real person is the best option for that. The link below takes you to WRJA support. Is there anything I can help with while you’re here?',
        'Happy to point you to the team. Use the support link below and they’ll take it from there.',
      ], history));
    case 'identity':
      return reply('I’m the West Rand Judo Association’s AI assistant. I can help with our clubs, coaches, events, and getting started in judo — and if you’d rather speak to a person, WRJA support can help. What would you like to know?', TOPIC_STARTERS.slice(0, 3));
    case 'capabilities':
      return reply('I can tell you where and when our clubs train, who our coaches are, which events we run, and answer common questions about starting judo — like what age kids can begin and what to wear. For anything else, I’ll point you to WRJA support. Where would you like to start?', TOPIC_STARTERS);
    case 'greeting':
      return reply(hasHistory
        ? 'Hi again! What else can I help you with?'
        : 'Hello! I’m the WRJA assistant. I can help with our clubs, beginner classes, coaches, judo in general, and our events. What would you like to know?',
      TOPIC_STARTERS.slice(0, 3));
    case 'how-are-you':
      return reply('Doing well, thanks for asking! How can I help you with judo or WRJA today?', TOPIC_STARTERS.slice(0, 3));
    case 'goodbye':
      return reply('Thanks for stopping by — all the best, and I hope to see you on the mat soon!', []);
    case 'thanks':
      return reply(pick(['You’re very welcome! Is there anything else you’d like to know?', 'Happy to help! Anything else on your mind?'], history), freshSuggestions(TOPIC_STARTERS, history, message));
    case 'acknowledge':
      if (/^\s*(?:no|nope|nah)\b/i.test(message)) return reply('No problem at all — if anything else comes up, just ask.', []);
      return reply(/^\s*(?:yes|yep|yeah|ja|sure)\b/i.test(message) && hasHistory
        ? 'Great — what would you like to know more about?'
        : 'Glad that helps! Anything else you’d like to ask?', freshSuggestions(TOPIC_STARTERS, history, message));
    case 'contact':
      return supportOnly('I don’t have a phone number or e-mail address I can share here, but the support link below will put you in touch with the WRJA team. The only addresses I have are for our clubs — would you like those?', ['Where do your clubs train?']);
    case 'cost': {
      const lines = moneyLines(entries);
      const known = lines.length > 0 ? `\n\nWhat I do have:\n\n${lines.join('\n')}` : '';
      return supportOnly(`I don’t have WRJA’s regular class fees or membership costs, and I don’t want to guess.${known}\n\nFor class fees, WRJA support can give you the exact numbers.`, ['How do I get started with judo?', 'What events do you offer?']);
    }
    case 'join': {
      const workshop = entries.find((entry) => entry.id === 'beginners-workshop');
      const wear = entries.find((entry) => entry.id === 'what-to-wear');
      const parts = [
        'I’m not able to confirm how enrolment or booking works from here, so WRJA support is the best place to start.',
        workshop ? `A good low-pressure way to try judo: ${workshop.answer}` : '',
        wear ? wear.answer : '',
      ].filter(Boolean);
      return supportOnly(parts.join('\n\n'), ['What age can children start judo?', 'Where do your clubs train?']);
    }
    case 'medical':
      return supportOnly('Thanks for mentioning that — I can’t give medical advice, and the right person to clear any health condition or injury for judo is your doctor. Our coaches can talk through what’s suitable, so it’s worth chatting to WRJA support before a first class. In the meantime, I can tell you about our clubs and beginner classes.', ['Where do your clubs train?', 'Is judo dangerous?']);
    case 'adult': {
      const parts = [
        'Judo is for everyone, and adults are very welcome to try it.',
        entries.find((entry) => entry.id === 'beginners-workshop') ? 'Our Judo for Beginners Workshop is open to all ages with no experience needed.' : '',
        'I don’t have details on regular adult class times, so WRJA support can confirm what’s on offer.',
      ].filter(Boolean);
      return supportOnly(parts.join(' '), ['What events do you offer?', 'Where do your clubs train?']);
    }
    case 'nearest-club': {
      const section = clubsSection(entries);
      return reply(`${section ?? ''}\n\nI can’t measure distances from here, but tell me your suburb or town and I’ll do my best to suggest the nearest one.`.trim(), ['Who are your coaches?', 'What should my child wear?']);
    }
    default:
      return null;
  }
}

/* ---------- Event handling ---------- */

const LIVE_EVENT_DETAILS = /\b(?:current|currently|latest|today|tomorrow|this (?:week|month|year|weekend)|next (?:week|month|saturday|sunday)|confirmed|exact date|date|when|sign ?up|register|registration|payment|pay|tickets?|member[- ]only|other events?)\b/i;

function eventReply(message: string, history: ChatTurn[], entries: KnowledgeEntry[], forceFocus = false): LocalReply {
  const events = entries.filter((entry) => entry.category === 'event');
  const named = entryMentionedIn(message, events);
  const focus = named.length === 0 && (forceFocus || isFollowUpQuestion(message)) ? findFocusEntry(history, events) : undefined;
  const target = named.length === 1 ? named[0] : focus;
  const names = events.map((event) => event.title);
  const nameList = names.length > 1 ? `${names.slice(0, -1).join(', ')}, or ${names.at(-1)}` : names[0] ?? 'the listed events';
  const needsHandoff = LIVE_EVENT_DETAILS.test(message);

  if (target) {
    const answer = needsHandoff ? `${target.answer}\n\n${EVENT_HANDOFF}` : target.answer;
    return reply(answer, freshSuggestions(['What events do you offer?', 'Where do your clubs train?', 'Who are your coaches?'], history, message), { showSupportLink: needsHandoff });
  }
  if (named.length === 0) {
    const matches = searchKnowledge(message, events, [], 2);
    if (isConfidentLocalMatch(matches[0], matches[1])) {
      const answer = needsHandoff ? `${matches[0].answer}\n\n${EVENT_HANDOFF}` : matches[0].answer;
      return reply(answer, freshSuggestions(['What events do you offer?', 'Where do your clubs train?'], history, message), { showSupportLink: needsHandoff });
    }
    const broad = /\b(?:what|which|list|all|any|upcoming|offer|have|coming|happening|on)\b/i.test(message) || message.trim().split(/\s+/).length <= 2;
    const wasList = history.some((turn) => turn.role === 'assistant' && /events I have details on/i.test(turn.content));
    if (broad && !wasList) return reply(eventsSection(entries) ?? UNKNOWN_ANSWER, names.slice(0, 3).map((name) => `Tell me about ${name}`), { showSupportLink: true });
    if (wasList && isFollowUpQuestion(message)) {
      return reply(`Happy to go deeper — which one would you like to hear more about: ${nameList}? ${EVENT_HANDOFF}`, names.slice(0, 3).map((name) => `Tell me about ${name}`), { showSupportLink: true });
    }
  }
  return supportOnly(`I don’t see that one in the events I have details on — those are ${nameList}. I can’t check a live calendar from here, so for anything else please log in to view member events, or contact WRJA support.`, names.slice(0, 3).map((name) => `Tell me about ${name}`));
}

/* ---------- Main entry ---------- */

function withAfrikaansNote(result: LocalReply, message: string): LocalReply {
  if (!looksAfrikaans(message)) return result;
  return { ...result, answer: `Jammer, ek kan op die oomblik net in Engels volledig help — hier is wat ek weet:\n\n${result.answer}` };
}

export function localReply(message: string, history: ChatTurn[], entries: KnowledgeEntry[]): LocalReply {
  const intents = detectIntents(message);
  const [primary] = intents;

  // 0. “How much is it?” / “what time does it start?” right after talking about one specific club or event.
  const pronounRef = /\b(?:it|that|this|that one|there|they)\b/i.test(message);
  const refersToFocus = pronounRef && entryMentionedIn(message, entries).length === 0;
  const topical = intents.filter((intent) => ['cost', 'join', 'schedule', 'more-detail'].includes(intent));
  if (refersToFocus && topical.length > 0 && !intents.some((intent) => ['crisis', 'emergency', 'safeguarding', 'injection', 'insult', 'human', 'contact'].includes(intent))) {
    const focused = findFocusEntry(history, entries);
    if (focused?.category === 'event') return withAfrikaansNote(eventReply(message, history, entries, true), message);
    if (focused?.category === 'club' && intents.includes('schedule')) {
      return withAfrikaansNote(reply(focused.answer, freshSuggestions(['Who are your coaches?', 'What events do you offer?', 'What should my child wear?'], history, message)), message);
    }
  }

  // 1. Safety and conversation mechanics always win.
  const mechanical: Intent[] = ['crisis', 'emergency', 'safeguarding', 'injection', 'insult', 'human', 'identity', 'capabilities', 'greeting', 'how-are-you', 'goodbye', 'thanks', 'acknowledge', 'contact', 'cost', 'join', 'medical', 'adult', 'nearest-club'];
  const mechanicalIntent = intents.find((intent) => mechanical.includes(intent));
  // “thanks” inside a real question shouldn't swallow the question.
  const thanksWithQuestion = mechanicalIntent === 'thanks' && intents.some((intent) => ['clubs', 'coaches', 'classes', 'events', 'cost', 'join'].includes(intent));
  if (mechanicalIntent && !thanksWithQuestion) {
    // Specific event questions that merely mention “register/free/cost” stay in the event flow.
    const eventish = intents.includes('events') && ['cost', 'join'].includes(mechanicalIntent);
    if (!eventish) {
      const result = replyForIntent(mechanicalIntent, message, history, entries);
      if (result) return withAfrikaansNote(result, message);
    }
  }

  // 2. Events (including follow-ups inside an event conversation).
  const lastAssistant = [...history].reverse().find((turn) => turn.role === 'assistant');
  const inEventConversation = Boolean(lastAssistant && /\b(?:event|tournament|workshop|grading)\b/i.test(lastAssistant.content));
  const eventFollowUp = inEventConversation && isFollowUpQuestion(message) && !intents.some((intent) => ['clubs', 'coaches', 'classes'].includes(intent));
  const mentionsEvents = intents.includes('events') && !intents.some((intent) => ['clubs', 'coaches'].includes(intent));
  if (primary === 'events' || mentionsEvents || eventFollowUp) {
    return withAfrikaansNote(eventReply(message, history, entries), message);
  }

  // 3. Overview sections (can combine, e.g. “where are your clubs and who coaches?”).
  const sections: string[] = [];
  const suggestionPool: string[] = [];
  if (intents.includes('clubs')) { const s = clubsSection(entries); if (s) { sections.push(s); suggestionPool.push('Who are your coaches?', 'What age can children start judo?'); } }
  if (intents.includes('coaches')) {
    const named = entryMentionedIn(message, entries.filter((entry) => entry.category === 'instructor'));
    if (named.length === 1) { sections.push(named[0].answer); suggestionPool.push('Where do your clubs train?', 'Who are your coaches?'); }
    else { const s = coachesSection(entries); if (s) { sections.push(s); suggestionPool.push('Where do your clubs train?', 'How do I get started with judo?'); } }
  }
  if (intents.includes('classes')) { const s = classesSection(entries); if (s) { sections.push(s); suggestionPool.push('Where do your clubs train?', 'What events do you offer?'); } }
  if (intents.includes('schedule') && sections.length === 0) { const s = clubsSection(entries); if (s) { sections.push(`Training days and times are listed per club:\n\n${s.split('\n\n').slice(1).join('\n\n')}`); suggestionPool.push('What events do you offer?'); } }
  if (sections.length > 0) {
    const closing = sections.length === 1 && intents.includes('clubs') ? '\n\nWould you like to know about our coaches, or what a first class is like?' : '';
    return withAfrikaansNote(reply(`${sections.join('\n\n')}${closing}`, freshSuggestions(suggestionPool, history, message)), message);
  }

  // 4. A named club / coach with no other signal, or a referential follow-up (“and the times?”).
  const named = entryMentionedIn(message, entries.filter((entry) => entry.category !== 'event'));
  if (named.length === 1) {
    return withAfrikaansNote(reply(named[0].answer, freshSuggestions(['Where do your clubs train?', 'Who are your coaches?', 'What events do you offer?'], history, message)), message);
  }

  const followUp = isFollowUpQuestion(message);
  const focus = followUp ? findFocusEntry(history, entries) : undefined;
  const more = intents.includes('more-detail');

  // 5. General retrieval, using conversation context for follow-ups.
  const nonEventEntries = entries.filter((entry) => entry.category !== 'event');
  const matches = searchKnowledge(message, nonEventEntries, history, 4);
  const best = matches[0];
  const second = matches[1];
  // Two equally good FAQ answers (e.g. “how do belts work?”): share both rather than guessing one.
  if (best && second && best.category === 'faq' && second.category === 'faq' && best.confidence >= 0.5 && second.confidence >= 0.5 && best.score - second.score < 0.045 && !(more && focus)) {
    return withAfrikaansNote(reply(`${best.answer}\n\n${second.answer}`, freshSuggestions(['Where do your clubs train?', 'What should my child wear?', 'Who are your coaches?'], history, message)), message);
  }
  if (isConfidentLocalMatch(best, matches[1]) && !(more && focus)) {
    const category = best.category;
    const pool = category === 'faq'
      ? ['Where do your clubs train?', 'What should my child wear?', 'Is judo safe for kids?', 'Who are your coaches?']
      : ['Where do your clubs train?', 'What events do you offer?'];
    return withAfrikaansNote(reply(best.answer, freshSuggestions(pool, history, message)), message);
  }

  if (focus) {
    const text = more
      ? `That’s everything I have on ${focus.title}. ${focus.category === 'event' ? EVENT_HANDOFF : 'I’m happy to help with something else about WRJA, or WRJA support can fill in anything missing.'}`
      : focus.answer;
    return withAfrikaansNote(reply(text, freshSuggestions(TOPIC_STARTERS, history, message), { showSupportLink: more }), message);
  }

  if (more && history.length > 0) {
    return reply('Happy to go further — which part would you like more on? I can cover our clubs, coaches, events, or what to expect at a first class.', TOPIC_STARTERS.slice(0, 3));
  }

  // 6. Honest "I don't know" that keeps the conversation going.
  const weak = best && best.confidence >= 0.3 ? `The closest thing I have is this: ${best.answer}\n\nIf that’s not what you meant, ` : '';
  const answer = weak
    ? `${weak}WRJA support can point you to the right information.`
    : 'I don’t have a reliable answer to that, and I’d rather not guess. I can help with our clubs, coaches, events, and getting started in judo — or WRJA support can answer anything else. What would you like to try?';
  return withAfrikaansNote({ answer, suggestions: TOPIC_STARTERS.slice(0, 3), showSupportLink: true, confident: false, mode: 'fallback' }, message);
}
