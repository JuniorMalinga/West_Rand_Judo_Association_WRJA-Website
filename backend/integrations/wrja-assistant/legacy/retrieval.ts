import { contextualizeQuestion } from './context';
import type { ChatTurn, KnowledgeEntry, KnowledgeMatch } from './types';

const STOP_WORDS = new Set([
  'a', 'about', 'after', 'all', 'am', 'an', 'and', 'are', 'as', 'at', 'be', 'because',
  'been', 'before', 'being', 'but', 'by', 'can', 'could', 'did', 'do', 'does', 'for',
  'from', 'get', 'give', 'has', 'have', 'he', 'her', 'here', 'hers', 'him', 'his', 'how',
  'i', 'if', 'in', 'into', 'is', 'it', 'its', 'just', 'me', 'my', 'of', 'on', 'or', 'our',
  'please', 'she', 'so', 'some', 'tell', 'than', 'that', 'the', 'their', 'them', 'then',
  'there', 'these', 'they', 'this', 'those', 'to', 'up', 'us', 'was', 'we', 'were', 'what',
  'when', 'where', 'which', 'who', 'why', 'will', 'with', 'would', 'you', 'your',
]);

const SYNONYMS: Record<string, string> = {
  add: 'import', adding: 'import', bring: 'import', load: 'import', loading: 'import',
  upload: 'import', uploaded: 'import', uploading: 'import', files: 'file', documents: 'file',
  notes: 'knowledge', note: 'knowledge', dataset: 'knowledge', data: 'knowledge',
  offline: 'unavailable', disconnected: 'unavailable', down: 'unavailable',
  backup: 'export', back: 'export', transfer: 'export', move: 'export',
  certain: 'confident', sure: 'confident', reliable: 'confident', trustworthy: 'confident',
  remember: 'context', remembered: 'context', followup: 'context', follow: 'context',
  private: 'local', device: 'browser',
};

export function tokenize(text: string): string[] {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((word) => word && !STOP_WORDS.has(word))
    .map((word) => SYNONYMS[word] ?? word);
}

function normalizedPhrase(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function entryText(entry: KnowledgeEntry): string {
  return [
    entry.title,
    entry.category,
    ...entry.keywords,
    ...entry.relatedTerms,
    ...entry.questions,
    entry.answer,
    entry.source ?? '',
    entry.notes ?? '',
  ].join(' ');
}

function weightedEntryScore(queryTokens: string[], entry: KnowledgeEntry, allEntries: KnowledgeEntry[], query: string): number {
  const fields = [
    { text: entry.title, weight: 2.2 },
    { text: entry.category, weight: 0.7 },
    { text: entry.keywords.join(' '), weight: 2.3 },
    { text: entry.relatedTerms.join(' '), weight: 1.9 },
    { text: entry.questions.join(' '), weight: 2.2 },
    { text: entry.answer, weight: 0.75 },
    { text: entry.source ?? '', weight: 0.25 },
  ];

  const uniqueQuery = [...new Set(queryTokens)];
  if (uniqueQuery.length === 0) return 0;
  let totalWeight = 0;
  let matchedWeight = 0;
  let metadataHits = 0;

  for (const token of uniqueQuery) {
    const documentFrequency = allEntries.filter((candidate) => tokenize(entryText(candidate)).includes(token)).length;
    const idf = 1 + Math.log((allEntries.length + 1) / (documentFrequency + 1));
    const queryWeight = idf;
    totalWeight += queryWeight;
    let strongestField = 0;

    for (const field of fields) {
      if (tokenize(field.text).includes(token)) strongestField = Math.max(strongestField, field.weight);
    }

    if (strongestField > 0) {
      matchedWeight += queryWeight;
      if (strongestField >= 1.9) metadataHits += 1;
    }
  }

  const coverage = matchedWeight / totalWeight;
  const phrase = normalizedPhrase(query);
  const matchesQuestion = entry.questions.some((question) => {
    const candidate = normalizedPhrase(question);
    return candidate.length > 8 && (phrase.includes(candidate) || candidate.includes(phrase));
  });
  const matchesTitle = normalizedPhrase(entry.title).length > 5 && phrase.includes(normalizedPhrase(entry.title));
  const phraseBoost = matchesQuestion ? 0.17 : matchesTitle ? 0.1 : 0;
  const metadataBoost = Math.min(metadataHits * 0.035, 0.14);
  return Math.min(0.99, coverage * 0.72 + metadataBoost + phraseBoost);
}

export const LOCAL_CONFIDENCE_THRESHOLD = 0.44;

export function searchKnowledge(
  message: string,
  entries: KnowledgeEntry[],
  history: ChatTurn[] = [],
  limit = 3,
): KnowledgeMatch[] {
  const contextualQuestion = contextualizeQuestion(message, history);
  const queryTokens = tokenize(contextualQuestion);
  const currentTokens = tokenize(message);
  if (queryTokens.length === 0) return [];

  return entries
    .map((entry) => {
      const contextualScore = weightedEntryScore(queryTokens, entry, entries, contextualQuestion);
      const hasPriorContext = contextualQuestion !== message.trim();
      const currentWeight = currentTokens.length >= 3 ? 0.8 : currentTokens.length > 0 ? 0.55 : 0;
      const score = hasPriorContext
        ? weightedEntryScore(currentTokens, entry, entries, message) * currentWeight + contextualScore * (1 - currentWeight)
        : contextualScore;
      return {
        id: entry.id,
        title: entry.title,
        category: entry.category,
        answer: entry.answer,
        source: entry.source,
        score: Number(score.toFixed(3)),
        confidence: Number(Math.min(0.99, score).toFixed(3)),
      } satisfies KnowledgeMatch;
    })
    .filter((match) => match.score >= 0.12)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
