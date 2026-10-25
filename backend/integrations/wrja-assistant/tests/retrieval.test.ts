import { describe, expect, it } from 'vitest';
import { contextualizeQuestion, findFocusEntry, isFollowUpQuestion, requestsMoreDetail } from '../server/services/context';
import { isConfidentLocalMatch } from '../server/services/pipeline';
import { searchKnowledge } from '../server/services/retrieval';
import { loadWrjaEntries } from '../server/services/wrjaKnowledge';

const entries = loadWrjaEntries();
const top = (q: string) => searchKnowledge(q, entries.filter((e) => e.category !== 'event'), [], 3);

describe('WRJA fact data', () => {
  it('loads every JSON file in the data folder with unique ids', () => {
    expect(entries.length).toBeGreaterThan(30);
    expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length);
    for (const category of ['club', 'event', 'faq', 'instructor']) expect(entries.some((e) => e.category === category)).toBe(true);
  });
});

describe('retrieval with everyday wording', () => {
  const cases: Array<[string, string]> = [
    ['what is judo', 'what-is-judo'],
    ['at what age can my kid start', 'age-to-start'],
    ['what should my son wear on the first day', 'what-to-wear'],
    ['what is a gi', 'what-is-a-gi'],
    ['is it dangerous', 'is-judo-dangerous'],
    ['does my daughter have to do competitions', 'does-child-have-to-compete'],
    ['is judo an official sport', 'is-judo-recognised'],
    ['how does my child get a new belt', 'how-to-advance'],
  ];
  for (const [question, id] of cases) {
    it(`“${question}” → ${id}`, () => {
      const matches = top(question);
      expect(matches[0]?.id).toBe(id);
      expect(isConfidentLocalMatch(matches[0], matches[1])).toBe(true);
    });
  }

  it('matches a timid child to the reassurance answers', () => {
    expect(['shy-or-nervous', 'will-judo-help-confidence']).toContain(top('my child is really timid')[0]?.id);
  });

  it('does not give a confident answer to an unrelated topic', () => {
    const matches = top('where can I book dragon flights on Saturn');
    expect(isConfidentLocalMatch(matches[0], matches[1])).toBe(false);
  });
});

describe('conversation context', () => {
  it('recognises referential follow-ups but not fresh questions', () => {
    for (const q of ['what about roodepoort?', 'and the cost?', 'how much is it?', 'when?', 'tell me more']) expect(isFollowUpQuestion(q)).toBe(true);
    for (const q of ['where do your clubs train?', 'is there a camp in January?', 'when is the tournament?', 'what is judo?']) expect(isFollowUpQuestion(q)).toBe(false);
  });

  it('adds the previous topic only to follow-ups', () => {
    const history = [{ role: 'user' as const, content: 'tell me about the grading exams' }];
    expect(contextualizeQuestion('how much is it?', history)).toContain('grading exams');
    expect(contextualizeQuestion('what is judo?', history)).toBe('what is judo?');
  });

  it('finds the single club/event/coach being discussed, and nothing when several are named', () => {
    const single = [{ role: 'user' as const, content: 'tell me about the womens workshop' }];
    expect(findFocusEntry(single, entries)?.id).toBe('womens-self-defense');
    const many = [{ role: 'assistant' as const, content: 'Randburg, Roodepoort and Krugersdorp are our clubs.' }];
    expect(findFocusEntry(many, entries)).toBeUndefined();
  });

  it('detects a request for more detail', () => {
    expect(requestsMoreDetail('Tell me more about that')).toBe(true);
    expect(requestsMoreDetail('Where do you train?')).toBe(false);
  });
});
