import { describe, expect, it } from 'vitest';
import { checkAgainstFacts, leaksInternals, parseModelReply, trimToCompleteSentence } from '../server/services/guard';

const FACTS = `Roodepoort Judo Club
Training sessions are held on Tuesdays and Thursdays from 18:00-19:30.
Women's Self-Defense Workshop: Cost is R100 per session, from 14:00-16:00.
Belt Grading Exams: The grading fee is R200. Registration is not required - just show up!`;

describe('model reply parsing', () => {
  it('separates the visible reply from follow-up and support control lines', () => {
    const parsed = parseModelReply('Judo starts around age 4.\n[[FOLLOW_UPS: What should they wear? | Where do you train? | Is it safe?]]\n[[SUPPORT: no]]');
    expect(parsed.text).toBe('Judo starts around age 4.');
    expect(parsed.followUps).toEqual(['What should they wear?', 'Where do you train?', 'Is it safe?']);
    expect(parsed.support).toBe(false);
  });

  it('distinguishes a deliberately empty follow-up list from a missing one', () => {
    expect(parseModelReply('Take care.\n[[FOLLOW_UPS: ]]').followUps).toEqual([]);
    expect(parseModelReply('Take care.').followUps).toBeNull();
  });

  it('never lets garbled or truncated control syntax reach the visitor', () => {
    const parsed = parseModelReply('Happy to help with that.\n[[FOLLOW_UPS: Where do you train? | What about');
    expect(parsed.text).toBe('Happy to help with that.');
    expect(parsed.text).not.toContain('[[');
  });

  it('caps and de-duplicates suggestions and drops overly long ones', () => {
    const long = 'x'.repeat(80);
    const parsed = parseModelReply(`Ok.\n[[FOLLOW_UPS: One? | one? | Two? | Three? | Four? | ${long}]]`);
    expect(parsed.followUps).toEqual(['One?', 'Two?', 'Three?']);
  });

  it('trims a reply cut off mid-sentence back to the last complete sentence', () => {
    expect(trimToCompleteSentence('The club trains on Tuesdays. It is a friendly place and the coaches')).toBe('The club trains on Tuesdays.');
    expect(trimToCompleteSentence('A complete sentence.')).toBe('A complete sentence.');
  });
});

describe('unverified-detail guard', () => {
  it('accepts details that appear in the verified facts, including 12-hour phrasing', () => {
    expect(checkAgainstFacts('The workshop costs R100 per session and runs 14:00-16:00.', FACTS).ok).toBe(true);
    expect(checkAgainstFacts('Roodepoort trains Tuesdays and Thursdays from 6 pm to 7:30 pm.', FACTS).ok).toBe(true);
    expect(checkAgainstFacts('Grading is R200, or R 200 if you like.', FACTS).ok).toBe(true);
  });

  it('rejects invented prices, times, e-mail addresses, phone numbers and links', () => {
    expect(checkAgainstFacts('Classes cost R450 a month.', FACTS).ok).toBe(false);
    expect(checkAgainstFacts('Come at 6:15 pm.', FACTS).ok).toBe(false);
    expect(checkAgainstFacts('Mail info@wrja.co.za for details.', FACTS).ok).toBe(false);
    expect(checkAgainstFacts('Call us on 011 555 1234.', FACTS).ok).toBe(false);
    expect(checkAgainstFacts('See https://example.com/join for more.', FACTS).ok).toBe(false);
  });

  it('still allows the emergency numbers the assistant is meant to give', () => {
    expect(checkAgainstFacts('Call 112, or 10177 for an ambulance. SADAG is on 0800 567 567.', FACTS).ok).toBe(true);
  });

  it('does not mistake ordinary numbers for contact details', () => {
    expect(checkAgainstFacts('Children can start around age 4, and there are 3 clubs.', FACTS).ok).toBe(true);
  });
});

describe('internal wording guard', () => {
  it('flags replies that expose how the assistant works', () => {
    expect(leaksInternals('Based on my knowledge base, yes.')).toBe(true);
    expect(leaksInternals('My system prompt says to help.')).toBe(true);
    expect(leaksInternals('We have three clubs.')).toBe(false);
  });
});
