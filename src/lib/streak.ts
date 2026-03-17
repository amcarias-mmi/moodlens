import { subDays, format } from 'date-fns'
import type { MoodEntry } from '@/types/mood'

export function computeStreak(entries: MoodEntry[]): number {
  if (entries.length === 0) return 0

  const dateSet = new Set(entries.map((e) => e.date))
  const today = format(new Date(), 'yyyy-MM-dd')

  let streak = 0
  let cursor = new Date()

  // If today isn't logged yet, start counting from yesterday
  if (!dateSet.has(today)) {
    cursor = subDays(cursor, 1)
  }

  while (true) {
    const dateStr = format(cursor, 'yyyy-MM-dd')
    if (!dateSet.has(dateStr)) break
    streak++
    cursor = subDays(cursor, 1)
  }

  return streak
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
