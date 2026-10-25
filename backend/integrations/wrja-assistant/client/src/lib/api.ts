import type { ChatApiRequest, ChatApiResponse } from '../../../server/services/types';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function requestAssistant(payload: ChatApiRequest, signal?: AbortSignal): Promise<ChatApiResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  const result = await response.json().catch(() => ({})) as Partial<ChatApiResponse> & { error?: string };
  if (!response.ok) throw new ApiError(result.error || `Chat service returned HTTP ${response.status}.`, response.status);
  if (typeof result.answer !== 'string' || !['local', 'gemini', 'fallback', 'handoff'].includes(String(result.mode))) {
    throw new ApiError('The chat service returned an unexpected response.', 502);
  }
  return result as ChatApiResponse;
}
