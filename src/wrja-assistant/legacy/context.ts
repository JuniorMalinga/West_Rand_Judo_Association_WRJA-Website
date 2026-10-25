import type { ChatTurn } from './types';

const FOLLOW_UP_START = /^(?:(?:and|but|so|then)\s+)?(?:(?:is|was|does|did|can|could|will|would|has|have|are|were)\s+)?(?:it|that|this|they|them|those|these|he|she|why|how|what about|what if|tell me more|explain more|can you elaborate|could you elaborate|go on|continue|elaborate)\b/i;
const DETAIL_REQUEST = /\b(?:tell me more|explain (?:more|further|that)|elaborate|go deeper|more detail|why is that|how so|expand on that)\b/i;

export function isFollowUpQuestion(message: string): boolean {
  return FOLLOW_UP_START.test(message.trim()) || DETAIL_REQUEST.test(message);
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
  return [
    cleanMessage,
    `Previous user topic: ${priorQuestion}`,
  ].join('\n');
}

export function compactHistory(history: ChatTurn[], maxTurns = 8): ChatTurn[] {
  return history.slice(-maxTurns).map((turn) => ({
    role: turn.role,
    content: turn.content.trim().slice(0, 1200),
  }));
}
