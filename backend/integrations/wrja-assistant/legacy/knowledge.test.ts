import { describe, expect, it } from 'vitest';
import { parseKnowledgeJson } from '../client/src/lib/knowledge';

describe('knowledge JSON import', () => {
  it('accepts a structured object and normalizes optional fields', () => {
    const parsed = parseKnowledgeJson(JSON.stringify({ entries: [{ title: 'Policy', answer: 'Use the policy.', keywords: ['claim'] }] }));
    expect(parsed.entries).toHaveLength(1);
    expect(parsed.entries[0].category).toBe('Uncategorized');
    expect(parsed.entries[0].keywords).toEqual(['claim']);
    expect(parsed.entries[0].questions).toEqual([]);
  });

  it('accepts a top-level array of entries', () => {
    const parsed = parseKnowledgeJson(JSON.stringify([{ id: 'one', title: 'One', answer: 'First answer.' }]));
    expect(parsed.entries[0].id).toBe('one');
  });

  it('rejects entries without both a title and answer', () => {
    expect(() => parseKnowledgeJson(JSON.stringify({ entries: [{ title: 'Missing answer' }] }))).toThrow(/title and answer/);
  });

  it('rejects duplicate entry IDs and files larger than the import limit', () => {
    const duplicate = [{ id: 'same', title: 'First', answer: 'One.' }, { id: 'same', title: 'Second', answer: 'Two.' }];
    expect(() => parseKnowledgeJson(JSON.stringify(duplicate))).toThrow(/duplicate entry ID/);
    expect(() => parseKnowledgeJson(' '.repeat(1_000_001))).toThrow(/larger than 1 MB/);
  });
});
