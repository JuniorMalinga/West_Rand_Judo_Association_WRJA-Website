import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { KnowledgeEntry } from './types';

type SuppliedFact = {
  id: string;
  title: string;
  category: string;
  keywords: string[];
  content: string;
};

const DATA_DIRECTORY = new URL('../data/wrja/', import.meta.url);
const WEBSITE_KNOWLEDGE_DIRECTORY = new URL('../../../../knowledge/', import.meta.url);

function isSuppliedFact(value: unknown): value is SuppliedFact {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === 'string'
    && typeof record.title === 'string'
    && typeof record.category === 'string'
    && typeof record.content === 'string'
    && Array.isArray(record.keywords)
    && record.keywords.every((keyword) => typeof keyword === 'string');
}

/**
 * Load trusted WRJA facts on the server; browser requests never provide or replace them.
 * Every `*.json` file in server/data/wrja/ is loaded, so adding fees.json, contact.json,
 * schedule.json etc. needs no code change.
 */
export function loadWrjaEntries(directory?: URL): KnowledgeEntry[] {
  const entries: KnowledgeEntry[] = [];
  const seenIds = new Set<string>();
  const usingWebsiteFallback = !directory && !existsSync(fileURLToPath(DATA_DIRECTORY));
  const sourceDirectory = directory
    ?? (existsSync(fileURLToPath(DATA_DIRECTORY)) ? DATA_DIRECTORY : WEBSITE_KNOWLEDGE_DIRECTORY);
  const directoryPath = fileURLToPath(sourceDirectory);
  const filenames = readdirSync(directoryPath)
    .filter((name) => name.toLowerCase().endsWith('.json'))
    .filter((name) => !usingWebsiteFallback || name.toLowerCase() !== 'programs.json')
    .sort();

  for (const filename of filenames) {
    const filepath = fileURLToPath(new URL(filename, sourceDirectory));
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(filepath, 'utf8').replace(/^\uFEFF/, ''));
    } catch (error) {
      throw new Error(`Could not load WRJA content file ${filename}.`, { cause: error });
    }
    if (!Array.isArray(parsed)) throw new Error(`WRJA content file ${filename} must contain an array.`);

    for (const [index, value] of parsed.entries()) {
      if (!isSuppliedFact(value) || !value.id.trim() || !value.title.trim() || !value.content.trim()) {
        throw new Error(`Invalid WRJA content in ${filename} at entry ${index + 1}.`);
      }
      const originalId = value.id.trim();
      const id = seenIds.has(originalId)
        ? `${filename.replace(/\.json$/i, '')}:${originalId}`
        : originalId;
      if (seenIds.has(id)) throw new Error(`Duplicate WRJA content ID: ${id}.`);
      seenIds.add(id);
      entries.push({
        id,
        title: value.title.trim(),
        category: value.category.trim().toLowerCase(),
        keywords: value.keywords.map((keyword) => keyword.trim()).filter(Boolean),
        relatedTerms: [],
        questions: [value.title.trim()],
        answer: value.content.trim(),
        source: 'WRJA website information',
      });
    }
  }

  if (entries.length === 0) throw new Error('No WRJA content is configured.');
  return entries;
}

export function getWrjaEventEntries(entries = loadWrjaEntries()): KnowledgeEntry[] {
  return entries.filter((entry) => entry.category === 'event');
}
