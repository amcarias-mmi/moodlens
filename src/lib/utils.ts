import type { MoodEntry, MoodLevel } from '@/types/mood'

export const MOOD_META: Record<MoodLevel, {
  label: string;
  emoji: string;
  color: string;
  polarity: 'positive' | 'neutral' | 'negative';
}> = {
  5: { label: 'Great', emoji: '😄', color: 'var(--mood-great)', polarity: 'positive' },
  4: { label: 'Good',  emoji: '😊', color: 'var(--mood-good)',  polarity: 'positive' },
  3: { label: 'Okay',  emoji: '😐', color: 'var(--mood-okay)',  polarity: 'neutral'  },
  2: { label: 'Low',   emoji: '😔', color: 'var(--mood-low)',   polarity: 'negative' },
  1: { label: 'Rough', emoji: '😞', color: 'var(--mood-rough)', polarity: 'negative' },
}

export function formatDate(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Extract the top N most-frequent non-stop words from a set of entries. */
export function extractTopWords(entries: MoodEntry[], limit = 3): string[] {
  const freq = new Map<string, number>()
  for (const entry of entries) {
    if (!entry.note) continue
    const words = entry.note
      .toLowerCase()
      .replace(/[^a-z\s']/g, ' ')
      .split(/\s+/)
      .map((w) => w.replace(/^'+|'+$/g, ''))
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
    for (const word of words) {
      freq.set(word, (freq.get(word) ?? 0) + 1)
    }
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word)
}

export const STOP_WORDS = new Set([
  'a','about','above','after','again','against','all','am','an','and','any','are',
  'as','at','be','because','been','before','being','below','between','both','but',
  'by','can','did','do','does','doing','don','down','during','each','few','for',
  'from','further','get','got','had','has','have','having','he','her','here','hers',
  'herself','him','himself','his','how','i','if','in','into','is','it','its',
  'itself','just','know','like','ll','me','more','most','my','myself','no','nor',
  'not','now','of','off','on','once','only','or','other','our','ours','ourselves',
  'out','over','own','re','same','she','should','so','some','such','than','that',
  'the','their','theirs','them','themselves','then','there','these','they','this',
  'those','through','to','too','under','until','up','us','ve','very','was','we',
  'were','what','when','where','which','while','who','whom','why','will','with',
  'would','you','your','yours','yourself','yourselves','been','day','feel','feeling',
  'felt','got','had','has','have','just','really','today','very','bit','little',
  'much','good','great','bad','also','still','even','back','think','things','thing',
])
