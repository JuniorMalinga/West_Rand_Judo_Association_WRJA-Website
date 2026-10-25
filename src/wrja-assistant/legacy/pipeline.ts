import { requestsMoreDetail } from './context';
import type { KnowledgeMatch } from './types';
import { LOCAL_CONFIDENCE_THRESHOLD } from './retrieval';

export type ResponseDecision =
  | { mode: 'local'; match: KnowledgeMatch; reason: 'confident-local-match' }
  | { mode: 'gemini'; bestMatch?: KnowledgeMatch; reason: 'user-requested-detail' | 'local-match-insufficient' };

export function isConfidentLocalMatch(match?: KnowledgeMatch, runnerUp?: KnowledgeMatch): match is KnowledgeMatch {
  if (!match || match.confidence < LOCAL_CONFIDENCE_THRESHOLD) return false;
  return !runnerUp || match.confidence >= 0.76 || match.score - runnerUp.score >= 0.045;
}

export function decideResponse(message: string, matches: KnowledgeMatch[]): ResponseDecision {
  const best = matches[0];
  if (requestsMoreDetail(message)) {
    return { mode: 'gemini', bestMatch: best, reason: 'user-requested-detail' };
  }
  if (!isConfidentLocalMatch(best, matches[1])) {
    return { mode: 'gemini', bestMatch: best, reason: 'local-match-insufficient' };
  }
  return { mode: 'local', match: best, reason: 'confident-local-match' };
}

export function shouldOfferGeminiRetry(message: string): boolean {
  return /\b(?:timed out|http 5\d\d|could not reach|network|fetch failed|temporarily unavailable)\b/i.test(message);
}
