import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { Search, X, BookOpen } from 'lucide-react'
import { EntryCard } from './EntryCard'
import { CheckInModal } from '@/components/checkin/CheckInModal'
import { useMoodStore } from '@/store/moodStore'
import { MOOD_META } from '@/lib/utils'
import { cn } from '@/lib/cn'
import type { MoodEntry, MoodLevel } from '@/types/mood'

interface EntryListProps {
  /** Optional word to filter entries by (wired up in Phase 5 from word cloud) */
  wordFilter?: string
}

const MOOD_LEVELS: MoodLevel[] = [5, 4, 3, 2, 1]

export function EntryList({ wordFilter }: EntryListProps) {
  const entries = useMoodStore((s) => s.entries)
  const [search, setSearch] = useState('')
  const [moodFilter, setMoodFilter] = useState<MoodLevel | null>(null)
  const [editEntry, setEditEntry] = useState<MoodEntry | null>(null)

  const hasFilters = Boolean(search || moodFilter || wordFilter)

  const filtered = useMemo(() => {
    const q = (search || wordFilter || '').toLowerCase().trim()
    return entries.filter((e) => {
      const matchesMood = moodFilter === null || e.mood === moodFilter
      const matchesText = !q || e.note.toLowerCase().includes(q)
      return matchesMood && matchesText
    })
  }, [entries, search, moodFilter, wordFilter])

  // Group by month-year for the timeline view
  const grouped = useMemo(() => {
    const groups: { key: string; label: string; entries: MoodEntry[] }[] = []
    let currentKey = ''

    for (const entry of filtered) {
      const key = format(new Date(entry.date + 'T00:00:00'), 'yyyy-MM')
      const label = format(new Date(entry.date + 'T00:00:00'), 'MMMM yyyy')
      if (key !== currentKey) {
        currentKey = key
        groups.push({ key, label, entries: [entry] })
      } else {
        groups[groups.length - 1].entries.push(entry)
      }
    }
    return groups
  }, [filtered])

  const clearFilters = () => {
    setSearch('')
    setMoodFilter(null)
  }

  return (
    <div className="space-y-4">
      {/* Persistent live region for screen readers — announces filter results */}
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {hasFilters
          ? `${filtered.length} ${filtered.length === 1 ? 'entry' : 'entries'} found`
          : ''}
      </p>

      {/* ── Search bar ── */}
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search your notes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn(
            'w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border bg-white dark:bg-stone-900',
            'text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-600',
            'focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-900/40 focus:border-amber-300 dark:focus:border-amber-700',
            'transition-all duration-200',
            search ? 'border-amber-300 dark:border-amber-700' : 'border-stone-200 dark:border-stone-700'
          )}
        />
        <AnimatePresence>
          {search && (
            <motion.button
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
              aria-label="Clear search"
            >
              <X size={14} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Mood filter pills ── */}
      <div
        role="group"
        aria-label="Filter by mood"
        className="flex gap-1.5 flex-wrap items-center"
      >
        <button
          onClick={() => setMoodFilter(null)}
          aria-pressed={moodFilter === null}
          className={cn(
            'cursor-pointer px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-150',
            moodFilter === null
              ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100 shadow-sm'
              : 'bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
          )}
        >
          All
        </button>

        {MOOD_LEVELS.map((level) => {
          const meta = MOOD_META[level]
          const active = moodFilter === level
          return (
            <button
              key={level}
              onClick={() => setMoodFilter(active ? null : level)}
              aria-pressed={active}
              style={active ? { backgroundColor: meta.color, borderColor: 'transparent' } : undefined}
              className={cn(
                'cursor-pointer flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-150',
                active
                  ? 'text-white shadow-sm'
                  : 'bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
              )}
            >
              <span aria-hidden="true">{meta.emoji}</span>
              <span>{meta.label}</span>
            </button>
          )
        })}

        <AnimatePresence>
          {hasFilters && (
            <motion.button
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              onClick={clearFilters}
              className="ml-1 text-xs text-stone-400 hover:text-stone-600 underline underline-offset-2 transition-colors"
            >
              Clear filters
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Word filter banner — CSS transition avoids height-driven layout shift ── */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-out',
          wordFilter ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        )}
        aria-hidden={!wordFilter}
      >
        <div className="flex items-center justify-between px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm">
          <span className="text-amber-800">
            Showing entries containing{' '}
            <span className="font-semibold">"{wordFilter}"</span>
          </span>
        </div>
      </div>

      {/* ── Results count — always rendered to avoid height shift ── */}
      <p className="text-xs text-stone-400 min-h-[18px] transition-opacity duration-150" style={{ opacity: hasFilters ? 1 : 0 }}>
        {hasFilters ? `${filtered.length} ${filtered.length === 1 ? 'entry' : 'entries'} found` : ''}
      </p>

      {/* ── Timeline grouped list ── */}
      <AnimatePresence>
        {grouped.length > 0 ? (
          grouped.map(({ key, label, entries: groupEntries }) => (
            <motion.div
              key={key}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {/* Month/year separator */}
              <div className="flex items-center gap-3 pt-2 first:pt-0">
                <span className="font-display italic text-stone-400 dark:text-stone-500 text-sm whitespace-nowrap">
                  {label}
                </span>
                <div className="flex-1 h-px bg-stone-100 dark:bg-stone-800" />
                <span className="text-xs text-stone-300 tabular-nums">
                  {groupEntries.length}
                </span>
              </div>

              {/* Cards in this month */}
              <div className="space-y-2">
                <AnimatePresence>
                  {groupEntries.map((entry, idx) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      onEdit={setEditEntry}
                      index={idx}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          ))
        ) : (
          <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
        )}
      </AnimatePresence>

      {/* ── Edit modal ── */}
      <CheckInModal
        open={editEntry !== null}
        onOpenChange={(open) => {
          if (!open) setEditEntry(null)
        }}
        existingEntry={editEntry ?? undefined}
      />
    </div>
  )
}

/* ── Empty states ── */

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean
  onClear: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="py-16 flex flex-col items-center text-center"
    >
      {hasFilters ? (
        <>
          <span className="text-4xl mb-4" role="img" aria-label="magnifying glass">
            🔍
          </span>
          <h3 className="font-display text-xl font-medium text-stone-700">
            No entries match
          </h3>
          <p className="mt-1 text-sm text-stone-400 max-w-xs">
            Try adjusting your search or filters.
          </p>
          <button
            onClick={onClear}
            className="mt-4 text-sm font-medium text-amber-600 hover:text-amber-700 underline underline-offset-2 transition-colors"
          >
            Clear all filters
          </button>
        </>
      ) : (
        <>
          <div className="relative mb-4">
            <span className="text-5xl" role="img" aria-label="open book">
              📖
            </span>
            <div className="absolute -top-1 -right-2 w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
          </div>
          <h3 className="font-display italic text-2xl font-medium text-stone-700 dark:text-stone-400">
            Your journal awaits
          </h3>
          <p className="mt-2 text-sm text-stone-400 dark:text-stone-500 max-w-xs leading-relaxed">
            Log your first mood entry from the dashboard to start your chronicle.
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-stone-400">
            <BookOpen size={12} />
            <span>Every great story starts somewhere</span>
          </div>
        </>
      )}
    </motion.div>
  )
}
