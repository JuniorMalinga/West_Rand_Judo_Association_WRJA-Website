export type ChatRole = 'user' | 'assistant';

export interface ChatTurn {
  role: ChatRole;
  content: string;
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  category: string;
  keywords: string[];
  relatedTerms: string[];
  questions: string[];
  answer: string;
  source?: string;
  notes?: string;
  updatedAt?: string;
}

export interface KnowledgeBase {
  version: number;
  entries: KnowledgeEntry[];
}

export interface KnowledgeMatch {
  id: string;
  title: string;
  category: string;
  answer: string;
  source?: string;
  score: number;
  confidence: number;
}

export interface ChatApiRequest {
  message: string;
  history: ChatTurn[];
  matches: KnowledgeMatch[];
  forceGemini: boolean;
}

export interface ChatApiResponse {
  answer: string;
  mode: 'gemini' | 'fallback';
  model?: string;
  durationMs: number;
  note?: string;
  sources: KnowledgeMatch[];
}
