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
}

export interface ChatApiResponse {
  answer: string;
  mode: 'local' | 'gemini' | 'fallback' | 'handoff';
  model?: string;
  durationMs: number;
  showSupportLink?: boolean;
  /** Short, clickable next questions the visitor might naturally ask. */
  suggestions?: string[];
}
