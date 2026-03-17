import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { format } from 'date-fns'
import type { MoodEntry, MoodLevel, NewEntryInput } from '@/types/mood'
import { analyzeSentiment } from '@/lib/sentiment'
import {
  getAllEntries,
  upsertEntry,
  deleteEntry as dbDeleteEntry,
  clearAllEntries,
} from '@/lib/db'

interface MoodState {
  entries: MoodEntry[]
  isLoading: boolean
  error: string | null
  // Actions
  loadEntries: () => Promise<void>
  addEntry: (input: NewEntryInput) => Promise<MoodEntry>
  updateEntry: (id: string, updates: Pick<MoodEntry, 'mood' | 'note'>) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  clearAll: () => Promise<void>
  importEntries: (incoming: MoodEntry[], mode: 'merge' | 'replace') => Promise<number>
  getEntryByDate: (date: string) => MoodEntry | undefined
}

function computeDivergence(mood: MoodLevel, score: number | null): boolean {
  if (score === null) return false
  return (mood >= 4 && score < -0.2) || (mood <= 2 && score > 0.2)
}

export const useMoodStore = create<MoodState>((set, get) => ({
  entries: [],
  isLoading: false,
  error: null,

  loadEntries: async () => {
    set({ isLoading: true, error: null })
    try {
      const entries = await getAllEntries()
      // Sort reverse-chronological for UI consumption
      const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp)
      set({ entries: sorted, isLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load entries'
      set({ error: message, isLoading: false })
      throw err
    }
  },

  addEntry: async ({ mood, note }: NewEntryInput) => {
    const now = Date.now()
    const date = format(new Date(now), 'yyyy-MM-dd')
    const sentimentResult = analyzeSentiment(note)

    const entry: MoodEntry = {
      id: uuidv4(),
      date,
      timestamp: now,
      mood,
      note,
      sentimentScore: sentimentResult?.score ?? null,
      sentimentComparative: sentimentResult?.comparative ?? null,
      divergenceFlag: computeDivergence(mood, sentimentResult?.score ?? null),
      createdAt: now,
      updatedAt: now,
    }

    // Optimistic update
    set((state) => ({
      entries: [entry, ...state.entries],
    }))

    // Persist async
    await upsertEntry(entry)

    return entry
  },

  updateEntry: async (id: string, updates: Pick<MoodEntry, 'mood' | 'note'>) => {
    const existing = get().entries.find((e) => e.id === id)
    if (!existing) throw new Error(`Entry ${id} not found`)

    const now = Date.now()
    const sentimentResult = analyzeSentiment(updates.note)

    const updated: MoodEntry = {
      ...existing,
      mood: updates.mood,
      note: updates.note,
      sentimentScore: sentimentResult?.score ?? null,
      sentimentComparative: sentimentResult?.comparative ?? null,
      divergenceFlag: computeDivergence(updates.mood, sentimentResult?.score ?? null),
      updatedAt: now,
    }

    // Optimistic update
    set((state) => ({
      entries: state.entries.map((e) => (e.id === id ? updated : e)),
    }))

    await upsertEntry(updated)
  },

  deleteEntry: async (id: string) => {
    // Optimistic update
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    }))

    await dbDeleteEntry(id)
  },

  clearAll: async () => {
    set({ entries: [] })
    await clearAllEntries()
  },

  importEntries: async (incoming: MoodEntry[], mode: 'merge' | 'replace'): Promise<number> => {
    const existing = get().entries
    let toImport: MoodEntry[]

    if (mode === 'replace') {
      set({ entries: [] })
      await clearAllEntries()
      toImport = incoming
    } else {
      const existingDates = new Set(existing.map((e) => e.date))
      toImport = incoming.filter((e) => !existingDates.has(e.date))
    }

    const merged = [...toImport, ...(mode === 'replace' ? [] : existing)].sort(
      (a, b) => b.timestamp - a.timestamp
    )
    set({ entries: merged })

    for (const entry of toImport) {
      await upsertEntry(entry)
    }

    return toImport.length
  },

  getEntryByDate: (date: string) => {
    return get().entries.find((e) => e.date === date)
  },
}))
