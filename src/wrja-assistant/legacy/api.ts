import type { ChatApiRequest, ChatApiResponse } from '../../../server/services/types';

export async function requestGeminiHelp(payload: ChatApiRequest, signal?: AbortSignal): Promise<ChatApiResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  const result = await response.json().catch(() => ({})) as Partial<ChatApiResponse> & { error?: string };
  if (!response.ok) throw new Error(result.error || `Chat service returned HTTP ${response.status}.`);
  if (typeof result.answer !== 'string' || (result.mode !== 'gemini' && result.mode !== 'fallback')) {
    throw new Error('The chat service returned an unexpected response.');
  }
  return result as ChatApiResponse;
}
