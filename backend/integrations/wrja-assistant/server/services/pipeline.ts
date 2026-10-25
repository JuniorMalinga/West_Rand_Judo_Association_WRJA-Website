import type { KnowledgeMatch } from './types';
import { LOCAL_CONFIDENCE_THRESHOLD } from './retrieval';

export function isConfidentLocalMatch(match?: KnowledgeMatch, runnerUp?: KnowledgeMatch): match is KnowledgeMatch {
  if (!match || match.confidence < LOCAL_CONFIDENCE_THRESHOLD) return false;
  return !runnerUp || match.confidence >= 0.76 || match.score - runnerUp.score >= 0.045;
}

export function shouldOfferGeminiRetry(message: string): boolean {
  return /\b(?:timed out|http 5\d\d|could not reach|network|fetch failed|temporarily unavailable)\b/i.test(message);
}
