import { describe, expect, it } from 'vitest';
import starter from '../server/data/knowledge-base.json';
import { isFollowUpQuestion, requestsMoreDetail } from '../server/services/context';
import { LOCAL_CONFIDENCE_THRESHOLD, searchKnowledge } from '../server/services/retrieval';
import type { ChatTurn, KnowledgeBase } from '../server/services/types';

const entries = (starter as KnowledgeBase).entries;

describe('local knowledge retrieval', () => {
  it('answers an exact question from the relevant local entry', () => {
    const matches = searchKnowledge('How do I add my own knowledge?', entries);
    expect(matches[0]?.id).toBe('kb-import-json');
    expect(matches[0]?.confidence).toBeGreaterThanOrEqual(LOCAL_CONFIDENCE_THRESHOLD);
  });

  it('matches a paraphrased question using related terms and synonyms', () => {
    const matches = searchKnowledge('Can I upload my notes and reference file?', entries);
    expect(matches[0]?.id).toBe('kb-import-json');
    expect(matches[0]?.confidence).toBeGreaterThanOrEqual(LOCAL_CONFIDENCE_THRESHOLD);
  });

  it('uses prior turns to find the subject of a short follow-up', () => {
    const history: ChatTurn[] = [
      { role: 'user', content: 'How do I add my own knowledge?' },
      { role: 'assistant', content: entries.find((entry) => entry.id === 'kb-import-json')?.answer ?? '' },
    ];
    expect(isFollowUpQuestion('Will it appear on another device?')).toBe(true);
    const matches = searchKnowledge('Will it appear on another device?', entries, history);
    expect(matches[0]?.id).toBe('kb-browser-storage');
    expect(matches[0]?.confidence).toBeGreaterThanOrEqual(LOCAL_CONFIDENCE_THRESHOLD);
  });

  it('uses the previous topic when a follow-up has no useful standalone terms', () => {
    const history: ChatTurn[] = [
      { role: 'user', content: 'How do I add my own knowledge?' },
      { role: 'assistant', content: entries.find((entry) => entry.id === 'kb-import-json')?.answer ?? '' },
    ];
    const matches = searchKnowledge('What about it?', entries, history);
    expect(matches[0]?.id).toBe('kb-import-json');
    expect(matches[0]?.confidence).toBeGreaterThanOrEqual(LOCAL_CONFIDENCE_THRESHOLD);
  });

  it('recognizes an explicit request for more explanation', () => {
    expect(requestsMoreDetail('Tell me more about that')).toBe(true);
    expect(requestsMoreDetail('How do I import my knowledge?')).toBe(false);
  });

  it('does not return a confident unrelated answer for an unknown topic', () => {
    const matches = searchKnowledge('Where can I book dragon flights on Saturn?', entries);
    expect(matches[0]?.confidence ?? 0).toBeLessThan(LOCAL_CONFIDENCE_THRESHOLD);
  });
});
