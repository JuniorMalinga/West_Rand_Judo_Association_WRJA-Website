import { describe, expect, it } from 'vitest';
import { decideResponse, shouldOfferGeminiRetry } from '../server/services/pipeline';
import type { KnowledgeMatch } from '../server/services/types';

const verified: KnowledgeMatch = {
  id: 'approved-fact',
  title: 'Verified fact',
  category: 'Reference',
  answer: 'The verified answer is kept as written in the local source.',
  source: 'Approved policy',
  score: 0.91,
  confidence: 0.91,
};

describe('response choice', () => {
  it('keeps a confident local answer as the final answer without requesting Gemini', () => {
    const decision = decideResponse('What is the verified fact?', [verified]);
    expect(decision.mode).toBe('local');
    if (decision.mode === 'local') expect(decision.match.answer).toBe(verified.answer);
  });

  it('sends an explicit “tell me more” request to Gemini with the verified note attached', () => {
    const decision = decideResponse('Tell me more about that', [verified]);
    expect(decision.mode).toBe('gemini');
    expect(decision.reason).toBe('user-requested-detail');
    if (decision.mode === 'gemini') expect(decision.bestMatch?.id).toBe('approved-fact');
  });

  it('uses Gemini for a weak or ambiguous local match rather than presenting it as verified', () => {
    const weak = { ...verified, score: 0.2, confidence: 0.2 };
    const decision = decideResponse('Something unrelated', [weak]);
    expect(decision.mode).toBe('gemini');
    expect(decision.reason).toBe('local-match-insufficient');
  });
});

describe('transient Gemini retry policy', () => {
  it('offers retry for timeout, network, and server errors', () => {
    expect(shouldOfferGeminiRetry('Gemini timed out.')).toBe(true);
    expect(shouldOfferGeminiRetry('Gemini returned HTTP 503.')).toBe(true);
    expect(shouldOfferGeminiRetry('Could not reach Gemini.')).toBe(true);
  });

  it('does not offer retry for missing keys or permanent request errors', () => {
    expect(shouldOfferGeminiRetry('Gemini is not configured.')).toBe(false);
    expect(shouldOfferGeminiRetry('Gemini returned HTTP 400.')).toBe(false);
  });
});
