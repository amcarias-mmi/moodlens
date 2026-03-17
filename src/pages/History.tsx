import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { useSearchParams } from 'react-router-dom'
import { useMoodStore } from '@/store/moodStore'
import { EntryList } from '@/components/history/EntryList'
import { MOOD_META } from '@/lib/utils'
import type { MoodLevel } from '@/types/mood'

export default function History() {
  const entries = useMoodStore((s) => s.entries)
  const [searchParams] = useSearchParams()
  const wordFilter = searchParams.get('word') ?? undefined

  const stats = useMemo(() => {
    if (entries.length === 0) return null

    const oldest = entries[entries.length - 1]

    // Dominant mood
    const moodCounts = entries.reduce<Record<number, number>>((acc, e) => {
      acc[e.mood] = (acc[e.mood] ?? 0) + 1
      return acc
    }, {})
    const dominantMoodRaw = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
    const dominantMood = dominantMoodRaw
      ? (parseInt(dominantMoodRaw, 10) as MoodLevel)
      : undefined

    return { oldest, dominantMood }
  }, [entries])

  return (
    <div className="space-y-8">
      {/* ── Page header ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="pt-2"
      >
        <h1 className="font-display italic text-5xl md:text-6xl font-medium text-stone-900 dark:text-stone-50 leading-[1.1]">
          Your Journal
        </h1>

        {stats ? (
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <p className="text-sm text-stone-500 dark:text-stone-400">
              <span className="font-semibold text-stone-700 dark:text-stone-300">{entries.length}</span>{' '}
              {entries.length === 1 ? 'entry' : 'entries'}
            </p>
            <span className="text-stone-300">·</span>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Since{' '}
              <span className="font-semibold text-stone-700 dark:text-stone-300">
                {format(new Date(stats.oldest.date + 'T00:00:00'), 'MMM d, yyyy')}
              </span>
            </p>
            {stats.dominantMood && (
              <>
                <span className="text-stone-300">·</span>
                <p className="text-sm text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                  Mostly{' '}
                  <span className="font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                    {MOOD_META[stats.dominantMood].emoji} {MOOD_META[stats.dominantMood].label}
                  </span>
                </p>
              </>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-stone-400">
            No entries yet — start logging from the dashboard.
          </p>
        )}
      </motion.div>

      {/* ── List with search + filter ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
      >
        <EntryList wordFilter={wordFilter} />
      </motion.div>
    </div>
  )
}
