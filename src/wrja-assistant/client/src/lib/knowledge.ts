import starter from '../../../server/data/knowledge-base.json';
import type { KnowledgeBase, KnowledgeEntry } from '../../../server/services/types';

const STORAGE_KEY = 'askwise.knowledge.v1';
const MAX_IMPORT_BYTES = 1_000_000;
const MAX_ENTRIES = 1000;

const starterKnowledge = starter as KnowledgeBase;

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function cleanStringArray(value: unknown, maxItems = 30, maxLength = 180): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().slice(0, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function slugify(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72);
}

function normalizeEntry(value: unknown, index: number): KnowledgeEntry {
  if (!value || typeof value !== 'object') throw new Error(`Entry ${index + 1} must be a JSON object.`);
  const record = value as Record<string, unknown>;
  const title = cleanText(record.title, 160);
  const answer = cleanText(record.answer, 8000);
  if (!title || !answer) throw new Error(`Entry ${index + 1} needs a non-empty title and answer.`);

  return {
    id: cleanText(record.id, 100) || `${slugify(title) || 'entry'}-${index + 1}`,
    title,
    category: cleanText(record.category, 120) || 'Uncategorized',
    keywords: cleanStringArray(record.keywords),
    relatedTerms: cleanStringArray(record.relatedTerms ?? record.related_terms),
    questions: cleanStringArray(record.questions ?? record.exampleQuestions),
    answer,
    source: cleanText(record.source, 240) || undefined,
    notes: cleanText(record.notes, 1000) || undefined,
    updatedAt: cleanText(record.updatedAt, 30) || new Date().toISOString().slice(0, 10),
  };
}

export function parseKnowledgeJson(raw: string): KnowledgeBase {
  if (new TextEncoder().encode(raw).length > MAX_IMPORT_BYTES) {
    throw new Error('That JSON file is larger than 1 MB. Split it into smaller knowledge files.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('This file is not valid JSON. Check its syntax and try again.');
  }

  const entriesValue = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object'
      ? (parsed as Record<string, unknown>).entries
      : null;
  if (!Array.isArray(entriesValue) || entriesValue.length === 0) {
    throw new Error('Use a JSON array of entries or an object with an "entries" array.');
  }
  if (entriesValue.length > MAX_ENTRIES) throw new Error(`A knowledge base can contain at most ${MAX_ENTRIES} entries.`);

  const entries = entriesValue.map(normalizeEntry);
  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.id)) throw new Error(`The knowledge base contains a duplicate entry ID: ${entry.id}`);
    seen.add(entry.id);
  }
  return { version: 1, entries };
}

export function loadKnowledgeBase(): KnowledgeBase {
  if (typeof window === 'undefined') return starterKnowledge;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return starterKnowledge;
    return parseKnowledgeJson(saved);
  } catch {
    return starterKnowledge;
  }
}

export function saveKnowledgeBase(knowledgeBase: KnowledgeBase): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(knowledgeBase));
  } catch {
    throw new Error('The browser could not save this knowledge base. Export a backup and remove some entries or free browser storage.');
  }
}

export function exportKnowledgeBase(knowledgeBase: KnowledgeBase): string {
  return JSON.stringify(knowledgeBase, null, 2);
}

export function starterKnowledgeBase(): KnowledgeBase {
  return JSON.parse(JSON.stringify(starterKnowledge)) as KnowledgeBase;
}

export function createBlankEntry(): KnowledgeEntry {
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `entry-${Date.now()}`;
  return {
    id,
    title: '',
    category: 'General',
    keywords: [],
    relatedTerms: [],
    questions: [],
    answer: '',
    source: '',
  };
}
