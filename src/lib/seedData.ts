import { v4 as uuidv4 } from 'uuid'
import { upsertEntry } from './db'
import { analyzeSentiment } from './sentiment'
import type { MoodEntry, MoodLevel } from '@/types/mood'

function computeDivergence(mood: MoodLevel, score: number | null): boolean {
  if (score === null) return false
  return (mood >= 4 && score < -0.2) || (mood <= 2 && score > 0.2)
}

function makeEntry(date: string, mood: MoodLevel, note: string): MoodEntry {
  const ts = new Date(date + 'T12:00:00').getTime()
  const sent = analyzeSentiment(note)
  return {
    id: uuidv4(),
    date,
    timestamp: ts,
    mood,
    note,
    sentimentScore: sent?.score ?? null,
    sentimentComparative: sent?.comparative ?? null,
    divergenceFlag: computeDivergence(mood, sent?.score ?? null),
    createdAt: ts,
    updatedAt: ts,
  }
}

/** Returns a date string N days before today */
function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

const SEED_ENTRIES: [number, MoodLevel, string][] = [
  [0,  4, 'Productive day, shipped a feature I had been working on for a while. Feeling proud and energized.'],
  [1,  5, 'Amazing morning run and great coffee. Everything felt clear and joyful today.'],
  [2,  3, 'Pretty average day. Meetings dragged on but finished the work I needed to do.'],
  [3,  2, 'Tired and a bit overwhelmed. Too many tasks, not enough focus. Need rest.'],
  [4,  4, 'Had a wonderful lunch with friends. Work was fine, overall a good day.'],
  [5,  3, 'Quiet day at home. Relaxed but also felt a bit restless and unmotivated.'],
  [6,  5, 'Best day this week! Finished a big project and celebrated with the team.'],
  // extra week for rolling avg and heatmap coverage
  [7,  4, 'Steady and calm. Got through my todo list without any stress.'],
  [8,  2, 'Rough morning. Headache all day and struggled to concentrate on anything.'],
  [9,  3, 'Okay day. Nothing exciting, just routine work and a quiet evening.'],
  [10, 5, 'Brilliant sunshine and a spontaneous walk. Felt deeply happy and grateful.'],
  [11, 4, 'Good progress on side project. Feeling creative and focused.'],
  [12, 3, 'Mixed bag. Some frustrating bugs but also good music while coding.'],
  [13, 1, 'Really struggled today. Everything felt hard and the anxiety was high.'],
]

export async function seedDemoData(): Promise<void> {
  for (const [daysBack, mood, note] of SEED_ENTRIES) {
    const entry = makeEntry(daysAgo(daysBack), mood, note)
    await upsertEntry(entry)
  }
  console.info(`[MoodLens] Seeded ${SEED_ENTRIES.length} demo entries. Refresh the page.`)
}
