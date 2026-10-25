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
  'im', 'ive', 'id', 'want', 'wanna', 'need', 'like', 'know', 'also', 'any', 'really', 'new', 'got', 'work', 'works', 'much', 'many',
]);

/** Everyday wording → the vocabulary used in the WRJA facts. */
const SYNONYMS: Record<string, string> = {
  // people
  kid: 'children', kids: 'children', child: 'children', childs: 'children', son: 'children', daughter: 'children',
  boy: 'children', girl: 'children', toddler: 'children', youngster: 'children', youth: 'children', junior: 'children',
  children: 'children', little: 'children', young: 'children',
  teacher: 'coach', teachers: 'coach', coaches: 'coach', coaching: 'coach', trainer: 'coach', trainers: 'coach',
  instructors: 'instructor', senseis: 'sensei', judoka: 'judoka', students: 'judoka', student: 'judoka',
  ladies: 'women', woman: 'women', female: 'women', females: 'women', womens: 'women',
  // places & time
  clubs: 'club', dojo: 'club', dojos: 'club', gym: 'club', venue: 'club', venues: 'club', branch: 'club', branches: 'club',
  location: 'location', locations: 'location', address: 'location', directions: 'location', suburb: 'location', area: 'location',
  near: 'location', nearest: 'location', closest: 'location', close: 'location',
  train: 'training', trains: 'training', trained: 'training', trainings: 'training', practice: 'training', practise: 'training',
  session: 'training', sessions: 'training', lesson: 'class', lessons: 'class', classes: 'class',
  schedule: 'schedule', timetable: 'schedule', times: 'schedule', time: 'schedule', hours: 'schedule',
  // events
  events: 'event', tournaments: 'tournament', competitions: 'tournament', competition: 'tournament', championship: 'tournament',
  championships: 'tournament', compete: 'tournament', competing: 'tournament', workshops: 'workshop', seminar: 'workshop',
  seminars: 'workshop', grading: 'grading', gradings: 'grading', exams: 'grading', exam: 'grading', test: 'grading',
  promotion: 'grading', promoted: 'grading', advance: 'grading', advancing: 'grading', progress: 'grading', rank: 'grading',
  // money
  price: 'cost', prices: 'cost', cost: 'cost', costs: 'cost', fee: 'cost', fees: 'cost', pay: 'cost', paying: 'cost',
  payment: 'cost', expensive: 'cost', cheap: 'cost', afford: 'cost', rand: 'cost',
  // joining
  join: 'join', joining: 'join', enrol: 'join', enroll: 'join', enrolment: 'join', signup: 'join', register: 'join',
  registration: 'join', trial: 'join', beginner: 'beginner', beginners: 'beginner', newbie: 'beginner', novice: 'beginner',
  // kit
  uniform: 'gi', kimono: 'gi', clothes: 'wear', clothing: 'wear', wearing: 'wear', outfit: 'wear', bring: 'wear',
  belts: 'belt', colours: 'colour', colors: 'colour', color: 'colour',
  // safety & benefits
  hurt: 'injury', injured: 'injury', injuries: 'injury', safe: 'safety', unsafe: 'safety', risky: 'safety', dangerous: 'safety',
  danger: 'safety', protect: 'self-defence', defend: 'self-defence', defense: 'self-defence', defence: 'self-defence',
  'self-defense': 'self-defence', bullied: 'confidence', bullying: 'confidence', scared: 'nervous', anxious: 'nervous',
  timid: 'nervous', shyness: 'shy', fit: 'fitness', exercise: 'fitness', unfit: 'fitness', weight: 'fitness',
  focus: 'concentration', adhd: 'concentration', attention: 'concentration',
  olympics: 'olympic', olympian: 'olympic', recognised: 'recognised', recognized: 'recognised', official: 'recognised',
  legit: 'recognised', registered: 'recognised', governing: 'recognised', federation: 'recognised',
  // age
  old: 'age', older: 'age', youngest: 'age', adult: 'adult', adults: 'adult', grownups: 'adult', parents: 'adult',
};

/** Very small plural/verb stemmer so “throws”, “clubs”, “coaches” still line up. */
function stem(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith('ches') || word.endsWith('shes') || word.endsWith('sses')) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('us')) return word.slice(0, -1);
  return word;
}

export function tokenize(text: string): string[] {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((word) => word && !STOP_WORDS.has(word))
    .map((word) => SYNONYMS[word] ?? stem(word))
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
  const generic = new Set(['judo']);
  const titleCore = new Set(tokenize(entry.title).filter((token) => !generic.has(token)));
  const queryCore = new Set(uniqueQuery.filter((token) => !generic.has(token)));
  const sameAsTitle = titleCore.size > 0 && queryCore.size === titleCore.size && [...queryCore].every((token) => titleCore.has(token));
  const phraseBoost = matchesQuestion ? 0.17 : sameAsTitle ? 0.14 : matchesTitle ? 0.1 : 0;
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
