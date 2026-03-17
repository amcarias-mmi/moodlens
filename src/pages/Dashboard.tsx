import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { Flame, Plus, Pencil, TrendingUp, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckInModal } from '@/components/checkin/CheckInModal'
import { useMoodStore } from '@/store/moodStore'
import { MOOD_META } from '@/lib/utils'
import { computeStreak, getGreeting } from '@/lib/streak'
import { cn } from '@/lib/cn'

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

export default function Dashboard() {
  const [modalOpen, setModalOpen] = useState(false)
  const entries = useMoodStore((s) => s.entries)
  const isLoading = useMoodStore((s) => s.isLoading)

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayEntry = entries.find((e) => e.date === today)
  const streak = useMemo(() => computeStreak(entries), [entries])
  const greeting = getGreeting()
  const formattedDate = format(new Date(), 'EEEE, MMMM d, yyyy')

  // Keyboard shortcut: press 'n' to open check-in
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const tag = target.tagName.toLowerCase()
      if (
        e.key === 'n' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        tag !== 'input' &&
        tag !== 'textarea'
      ) {
        setModalOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      <div className="space-y-8">

        {/* ── Header ── */}
        <motion.div
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="pt-2"
        >
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2">
            {formattedDate}
          </p>
          <h1 className="font-display italic text-5xl md:text-6xl font-medium text-stone-900 dark:text-stone-50 leading-[1.1]">
            {greeting}.
          </h1>

          {/* Streak badge */}
          {streak > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25, type: 'spring', stiffness: 400, damping: 25 }}
              className="mt-4 inline-flex"
            >
              <Badge className="gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border-amber-200 text-sm font-semibold rounded-full">
                <Flame size={13} className="text-amber-500" />
                {streak} day{streak !== 1 ? 's' : ''} streak
              </Badge>
            </motion.div>
          )}
        </motion.div>

        {/* ── Today's check-in card ── */}
        <motion.div
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
        >
          {isLoading ? (
            <div className="h-48 bg-white rounded-3xl border border-stone-200 animate-pulse" />
          ) : todayEntry ? (
            /* ── Already logged ── */
            <TodayCard
              entry={todayEntry}
              onEdit={() => setModalOpen(true)}
            />
          ) : (
            /* ── Not yet logged ── */
            <CTACard onOpen={() => setModalOpen(true)} />
          )}
        </motion.div>

        {/* ── Quick stats row ── */}
        {!isLoading && entries.length > 0 && (
          <motion.div
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
            className="grid grid-cols-2 gap-3"
          >
            <StatCard
              icon={<BookOpen size={16} className="text-stone-500" />}
              label="Total entries"
              value={entries.length.toString()}
            />
            <StatCard
              icon={<TrendingUp size={16} className="text-stone-500" />}
              label="This week"
              value={weekCount(entries)}
            />
          </motion.div>
        )}
      </div>

      {/* ── Check-in modal ── */}
      <CheckInModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        existingEntry={todayEntry}
      />
    </>
  )
}

/* ── Sub-components ── */

function CTACard({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-stone-300 dark:border-stone-700 bg-white/60 dark:bg-stone-900/60 p-8 text-center">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_-10%,#fef3c733,transparent_60%)] pointer-events-none" />

      <div className="relative space-y-4">
        <span className="text-5xl block" role="img" aria-label="journal">
          📓
        </span>
        <div>
          <h2 className="font-display text-2xl font-medium text-stone-900 dark:text-stone-50">
            Ready to check in?
          </h2>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Take a moment to reflect on how you're feeling.
          </p>
        </div>

        <Button
          size="lg"
          className="rounded-2xl bg-stone-900 hover:bg-stone-800 text-white px-8 py-6 text-base font-medium shadow-lg hover:shadow-xl transition-all"
          onClick={onOpen}
        >
          <Plus size={18} className="mr-1.5" />
          Log today's mood
        </Button>

        <p className="text-xs text-stone-400">
          Press{' '}
          <kbd className="px-1.5 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-stone-500 font-mono text-[10px]">
            N
          </kbd>{' '}
          to quickly open
        </p>
      </div>
    </div>
  )
}

function TodayCard({
  entry,
  onEdit,
}: {
  entry: NonNullable<ReturnType<typeof useMoodStore.getState>['entries'][0]>
  onEdit: () => void
}) {
  const meta = MOOD_META[entry.mood]
  const sentimentLabel =
    entry.sentimentScore === null
      ? null
      : entry.sentimentScore > 0.2
        ? 'Positive'
        : entry.sentimentScore < -0.2
          ? 'Negative'
          : 'Neutral'

  const sentimentColor =
    sentimentLabel === 'Positive'
      ? 'text-green-600 bg-green-50 border-green-200'
      : sentimentLabel === 'Negative'
        ? 'text-red-600 bg-red-50 border-red-200'
        : 'text-stone-600 bg-stone-50 border-stone-200'

  return (
    <div className="relative overflow-hidden rounded-3xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 p-6 shadow-sm">
      {/* Mood color accent stripe */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
        style={{ backgroundColor: meta.color }}
      />

      <div className="flex items-start justify-between gap-4 mt-2">
        <div className="flex items-center gap-4">
          <span
            className="text-4xl w-14 h-14 flex items-center justify-center rounded-2xl flex-shrink-0"
            style={{ backgroundColor: meta.color + '22' }}
          >
            {meta.emoji}
          </span>
          <div>
            <p className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
              Today's mood
            </p>
            <h2 className="font-display text-2xl font-medium text-stone-900 dark:text-stone-50 mt-0.5">
              {meta.label}
            </h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {sentimentLabel && (
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full border font-medium',
                    sentimentColor
                  )}
                >
                  {sentimentLabel}
                </span>
              )}
              {entry.divergenceFlag && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700 font-medium"
                  title="Your note tone didn't match your selected mood"
                >
                  ⚠️ Divergence
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onEdit}
          className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors px-2 py-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
          aria-label="Edit today's entry"
        >
          <Pencil size={13} />
          Edit
        </button>
      </div>

      {entry.note && (
        <p className="mt-4 text-sm text-stone-600 dark:text-stone-300 leading-relaxed border-t border-stone-100 dark:border-stone-800 pt-4 line-clamp-3">
          {entry.note}
        </p>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700/50 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-stone-500 dark:text-stone-400">{label}</span>
      </div>
      <p className="font-display text-3xl font-medium text-stone-900 dark:text-stone-50">{value}</p>
    </div>
  )
}

function weekCount(entries: { date: string }[]): string {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0=Sun
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
  monday.setHours(0, 0, 0, 0)

  const count = entries.filter((e) => {
    const d = new Date(e.date + 'T00:00:00')
    return d >= monday && d <= now
  }).length

  return `${count} / 7`
}
