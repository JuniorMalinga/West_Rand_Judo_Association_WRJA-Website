const INTERACTIONS_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const DEFAULT_TIMEOUT_MS = 20_000;
const MAX_REQUEST_ATTEMPTS = 2;
const MAX_SINGLE_REQUEST_MS = 10_000;
const DEFAULT_POLL_INTERVAL_MS = 650;
// Thinking tokens can count against the output cap, so leave generous headroom for a complete reply.
const MAX_OUTPUT_TOKENS = 1_400;

export interface GeminiOptions {
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  thinkingLevel?: 'low' | 'medium' | 'high';
  pollIntervalMs?: number;
  fetchImpl?: typeof fetch;
}

export interface GeminiResult {
  answer: string;
  model: string;
  durationMs: number;
}

export class GeminiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeminiUnavailableError';
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function textFromResponse(payload: unknown): string {
  const record = asRecord(payload);
  if (!record) return '';
  if (typeof record.output_text === 'string') return record.output_text.trim();

  const output = Array.isArray(record.output)
    ? record.output
    : Array.isArray(record.steps)
      ? record.steps
      : [];
  const fragments: string[] = [];
  for (const step of output) {
    const stepRecord = asRecord(step);
    if (!stepRecord || (stepRecord.type && stepRecord.type !== 'model_output')) continue;
    const content = Array.isArray(stepRecord.content) ? stepRecord.content : [];
    for (const part of content) {
      const partRecord = asRecord(part);
      if (typeof partRecord?.text === 'string') fragments.push(partRecord.text);
    }
  }
  return fragments.join('\n').trim();
}

function interactionStatus(payload: unknown): string {
  const status = asRecord(payload)?.status;
  return typeof status === 'string' ? status : '';
}

function interactionId(payload: unknown): string {
  const id = asRecord(payload)?.id;
  return typeof id === 'string' ? id : '';
}

function shorten(value: string, limit: number): string {
  const normalized = value.replace(/\u0000/g, '').trim();
  return normalized.length <= limit ? normalized : `${normalized.slice(0, Math.max(0, limit - 1)).trimEnd()}…`;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isTimeout(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.name === 'TimeoutError' || error.name === 'AbortError' || /timed? ?out|timeout/i.test(error.message);
}

function configuredNumber(value: number | undefined, fallback: number, minimum: number, maximum: number): number {
  return Number.isFinite(value) && value !== undefined
    ? Math.min(maximum, Math.max(minimum, Math.floor(value)))
    : fallback;
}

function remainingMs(deadline: number): number {
  return Math.max(0, deadline - Date.now());
}

function requestTimeout(deadline: number, attemptsRemaining = 1): number {
  const remaining = remainingMs(deadline);
  if (remaining < 50) throw new GeminiUnavailableError('Gemini timed out.');
  return Math.max(50, Math.min(MAX_SINGLE_REQUEST_MS, Math.floor(remaining / Math.max(1, attemptsRemaining))));
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new GeminiUnavailableError('Gemini returned an unreadable response.');
  }
}

async function createInteraction(
  fetchImpl: typeof fetch,
  apiKey: string,
  requestBody: string,
  deadline: number,
): Promise<unknown> {
  for (let attempt = 0; attempt < MAX_REQUEST_ATTEMPTS; attempt += 1) {
    let response: Response;
    try {
      response = await fetchImpl(INTERACTIONS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: requestBody,
        signal: AbortSignal.timeout(requestTimeout(deadline, MAX_REQUEST_ATTEMPTS - attempt)),
      });
    } catch (error) {
      if (attempt + 1 < MAX_REQUEST_ATTEMPTS && remainingMs(deadline) > 350) {
        await wait(250);
        continue;
      }
      throw new GeminiUnavailableError(isTimeout(error) ? 'Gemini timed out.' : 'Could not reach Gemini.');
    }

    if (response.ok) return readJson(response);
    const retryable = [429, 500, 502, 503, 504].includes(response.status);
    if (retryable && attempt + 1 < MAX_REQUEST_ATTEMPTS && remainingMs(deadline) > 350) {
      await wait(250);
      continue;
    }
    // Do not return provider response bodies: they can contain account details or request fragments.
    throw new GeminiUnavailableError(`Gemini returned HTTP ${response.status}.`);
  }
  throw new GeminiUnavailableError('Gemini did not return a response.');
}

async function getInteraction(
  fetchImpl: typeof fetch,
  apiKey: string,
  id: string,
  deadline: number,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetchImpl(`${INTERACTIONS_URL}/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: { 'x-goog-api-key': apiKey },
      signal: AbortSignal.timeout(requestTimeout(deadline)),
    });
  } catch (error) {
    throw new GeminiUnavailableError(isTimeout(error) ? 'Gemini timed out.' : 'Could not reach Gemini.');
  }
  if (!response.ok) throw new GeminiUnavailableError(`Gemini returned HTTP ${response.status}.`);
  return readJson(response);
}

async function awaitCompletedInteraction(
  initialPayload: unknown,
  fetchImpl: typeof fetch,
  apiKey: string,
  deadline: number,
  pollIntervalMs: number,
): Promise<string> {
  let payload = initialPayload;
  while (true) {
    const status = interactionStatus(payload);
    const answer = textFromResponse(payload);
    // Older synchronous responses may omit a status, but still contain the complete text.
    if (!status && answer) return answer;
    if (status === 'completed' && answer) return answer;
    if (status === 'incomplete' && answer) return answer;
    if (status === 'completed' || status === 'incomplete') throw new GeminiUnavailableError('Gemini returned no text answer.');
    if (status && status !== 'in_progress') throw new GeminiUnavailableError('Gemini could not complete that response.');

    const id = interactionId(payload);
    if (!id) throw new GeminiUnavailableError('Gemini returned no text answer.');
    const delay = Math.min(pollIntervalMs, Math.max(0, remainingMs(deadline) - 50));
    if (delay <= 0) throw new GeminiUnavailableError('Gemini timed out.');
    await wait(delay);
    payload = await getInteraction(fetchImpl, apiKey, id, deadline);
  }
}

export interface GeminiPrompt {
  /** Trusted instructions plus verified facts. */
  systemInstruction: string;
  /** Conversation transcript and the visitor's new message (untrusted). */
  input: string;
}

export async function askGemini(prompt: GeminiPrompt, options: GeminiOptions = {}): Promise<GeminiResult> {
  const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;
  if (!apiKey?.trim()) throw new GeminiUnavailableError('Gemini is not configured.');

  const model = options.model ?? process.env.GEMINI_MODEL ?? 'gemini-3.8-flash';
  const configuredTimeout = options.timeoutMs ?? Number(process.env.GEMINI_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  const timeoutMs = configuredNumber(configuredTimeout, DEFAULT_TIMEOUT_MS, 500, 60_000);
  const configuredThinking = options.thinkingLevel ?? process.env.GEMINI_THINKING_LEVEL ?? 'low';
  const thinkingLevel = (['low', 'medium', 'high'] as const).find((level) => level === configuredThinking) ?? 'low';
  const pollIntervalMs = configuredNumber(options.pollIntervalMs, DEFAULT_POLL_INTERVAL_MS, 50, 5_000);
  const fetchImpl = options.fetchImpl ?? fetch;
  const startedAt = Date.now();
  const deadline = startedAt + timeoutMs;

  const requestBody = JSON.stringify({
    model,
    input: prompt.input,
    system_instruction: prompt.systemInstruction,
    generation_config: { max_output_tokens: MAX_OUTPUT_TOKENS, thinking_level: thinkingLevel },
    // Keep customer conversations out of provider-side history; the app sends bounded recent context itself.
    store: false,
  });
  const payload = await createInteraction(fetchImpl, apiKey, requestBody, deadline);
  const answer = await awaitCompletedInteraction(payload, fetchImpl, apiKey, deadline, pollIntervalMs);
  return { answer, model, durationMs: Date.now() - startedAt };
}
