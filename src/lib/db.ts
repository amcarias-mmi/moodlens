import { openDB, type IDBPDatabase } from 'idb'
import type { MoodEntry } from '@/types/mood'

const DB_NAME = 'moodlog_db'
const DB_VERSION = 1
const STORE = 'mood_entries'

type MoodDB = {
  mood_entries: {
    key: string
    value: MoodEntry
    indexes: {
      by_date: string
      by_timestamp: number
    }
  }
}

let dbPromise: Promise<IDBPDatabase<MoodDB>> | null = null

export function getDB(): Promise<IDBPDatabase<MoodDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MoodDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('by_date', 'date', { unique: true })
        store.createIndex('by_timestamp', 'timestamp', { unique: false })
      },
    })
  }
  return dbPromise
}

export async function getAllEntries(): Promise<MoodEntry[]> {
  const db = await getDB()
  return db.getAllFromIndex(STORE, 'by_timestamp')
}

export async function getEntryByDate(date: string): Promise<MoodEntry | undefined> {
  const db = await getDB()
  return db.getFromIndex(STORE, 'by_date', date)
}

export async function upsertEntry(entry: MoodEntry): Promise<void> {
  const db = await getDB()
  await db.put(STORE, entry)
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE, id)
}

export async function clearAllEntries(): Promise<void> {
  const db = await getDB()
  await db.clear(STORE)
}
