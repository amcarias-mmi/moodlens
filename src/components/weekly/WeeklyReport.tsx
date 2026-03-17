import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  differenceInWeeks,
  format,
  getISOWeek,
  isWithinInterval,
} from 'date-fns'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  Minus,
} from 'lucide-react'
import { useMoodStore } from '@/store/moodStore'
import { MOOD_META, extractTopWords } from '@/lib/utils'
import type { MoodLevel } from '@/types/mood'

// ── Types ────────────────────────────────────────────────────
interface PieDataItem {
  mood: MoodLevel
  label: string
  emoji: string
  color: string
  count: number
}

interface PieTooltipProps {
  active?: boolean
  payload?: { value: number; payload: PieDataItem }[]
}

// ── Helpers ──────────────────────────────────────────────────
const MOOD_LEVELS = [5, 4, 3, 2, 1] as const

function sentimentIcon(avg: number | null) {
  if (avg === null) return <Minus size={14} className="text-stone-400" />
  if (avg > 0.15) return <TrendingUp size={14} className="text-green-600" />
  if (avg < -0.15) return <TrendingDown size={14} className="text-red-500" />
  return <Minus size={14} className="text-stone-400" />
}

function sentimentColor(avg: number | null): string {
  if (avg === null) return 'text-stone-500'
  if (avg > 0.15) return 'text-green-700'
  if (avg < -0.15) return 'text-red-600'
  return 'text-stone-600'
}

function PieTooltip({ active, payload }: PieTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  if (!item) return null
  return (
    <div className="bg-white border border-stone-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-stone-700">
        {item.payload.emoji} {item.payload.label}:{' '}
        <span className="font-semibold">{item.value}</span>
      </p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export function WeeklyReport() {
  const [weekOffset, setWeekOffset] = useState(0)
  const entries = useMoodStore((s) => s.entries)

  // Week bounds (Mon–Sun)
  const { weekStart, weekEnd } = useMemo(() => {
    const base = addWeeks(new Date(), weekOffset)
    return {
      weekStart: startOfWeek(base, { weekStartsOn: 1 }),
      weekEnd:   endOfWeek(base,   { weekStartsOn: 1 }),
    }
  }, [weekOffset])

  // Navigation limits
  const minOffset = useMemo(() => {
    if (entries.length === 0) return 0
    const oldest = entries[entries.length - 1]
    const oldestWeekStart = startOfWeek(
      new Date(oldest.date + 'T00:00:00'),
      { weekStartsOn: 1 }
    )
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    return differenceInWeeks(oldestWeekStart, currentWeekStart)
  }, [entries])

  const canGoBack    = weekOffset > minOffset
  const canGoForward = weekOffset < 0

  // Entries in this week
  const weekEntries = useMemo(
    () =>
      entries.filter((e) =>
        isWithinInterval(new Date(e.date + 'T00:00:00'), {
          start: weekStart,
          end:   weekEnd,
        })
      ),
    [entries, weekStart, weekEnd]
  )

  // Stats
  const stats = useMemo(() => {
    if (weekEntries.length === 0) return null

    const sorted = [...weekEntries].sort((a, b) => b.mood - a.mood)
    const bestDay     = sorted[0]!
    const toughestDay = sorted[sorted.length - 1]!

    const moodCounts = new Map<MoodLevel, number>()
    for (const e of weekEntries) {
      moodCounts.set(e.mood, (moodCounts.get(e.mood) ?? 0) + 1)
    }
    const dominantMood = ([5, 4, 3, 2, 1] as MoodLevel[]).find(
      (m) => moodCounts.get(m) === Math.max(...moodCounts.values())
    )!

    const sentimentEntries = weekEntries.filter((e) => e.sentimentScore !== null)
    const avgSentiment =
      sentimentEntries.length > 0
        ? sentimentEntries.reduce((s, e) => s + (e.sentimentScore ?? 0), 0) /
          sentimentEntries.length
        : null

    const divergenceCount = weekEntries.filter((e) => e.divergenceFlag).length

    const pieData: PieDataItem[] = MOOD_LEVELS.map((mood) => ({
      mood,
      label: MOOD_META[mood].label,
      emoji: MOOD_META[mood].emoji,
      color: MOOD_META[mood].color,
      count: moodCounts.get(mood) ?? 0,
    })).filter((d) => d.count > 0)

    const topWords = extractTopWords(weekEntries, 3)

    return {
      dominantMood,
      avgSentiment,
      entryCount: weekEntries.length,
      divergenceCount,
      bestDay,
      toughestDay,
      pieData,
      topWords,
      moodCounts,
    }
  }, [weekEntries])

  const weekNumber   = getISOWeek(weekStart)
  const weekLabel    = `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`
  const dominantMeta = stats ? MOOD_META[stats.dominantMood] : null

  return (
    <div className="space-y-5">
      {/* ── Week navigator ── */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          disabled={!canGoBack}
          aria-label="Previous week"
          className="p-2 rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="text-center">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">
            Week {weekNumber}
          </p>
          <p className="font-display italic text-stone-800 text-lg leading-tight">
            {weekLabel}
          </p>
        </div>

        <button
          onClick={() => setWeekOffset((o) => o + 1)}
          disabled={!canGoForward}
          aria-label="Next week"
          className="p-2 rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={weekOffset}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {stats === null ? (
            <EmptyWeek weekLabel={weekLabel} hasAnyEntries={entries.length > 0} />
          ) : (
            <div className="space-y-4">
              {/* ── Hero: dominant mood ── */}
              <div
                className="relative overflow-hidden rounded-3xl p-8 text-center"
                style={{
                  background: `radial-gradient(ellipse at 50% 0%, ${dominantMeta!.color}33 0%, transparent 70%), #fff`,
                  border: `1px solid ${dominantMeta!.color}44`,
                }}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.05, type: 'spring', stiffness: 350, damping: 25 }}
                >
                  <span className="text-6xl block mb-3" role="img" aria-label={dominantMeta!.label}>
                    {dominantMeta!.emoji}
                  </span>
                  <h2 className="font-display italic text-3xl font-medium text-stone-900">
                    {dominantMeta!.label}
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Your dominant mood this week
                  </p>
                </motion.div>
              </div>

              {/* ── Stats row ── */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard
                  icon={<Calendar size={14} className="text-stone-400" />}
                  label="Days logged"
                  value={`${stats.entryCount}`}
                  sub="of 7"
                />
                <StatCard
                  icon={sentimentIcon(stats.avgSentiment)}
                  label="Avg sentiment"
                  value={
                    stats.avgSentiment !== null
                      ? `${stats.avgSentiment > 0 ? '+' : ''}${stats.avgSentiment.toFixed(2)}`
                      : '—'
                  }
                  valueClass={sentimentColor(stats.avgSentiment)}
                />
                <StatCard
                  icon={<span className="text-xs">⚠️</span>}
                  label="Divergences"
                  value={`${stats.divergenceCount}`}
                />
              </div>

              {/* ── Donut chart + distribution ── */}
              <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-4">
                  Mood distribution
                </p>
                <div className="flex items-center gap-6 flex-wrap">
                  {/* Donut */}
                  <div className="relative flex-shrink-0" style={{ width: 140, height: 140 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.pieData}
                          dataKey="count"
                          nameKey="label"
                          innerRadius={42}
                          outerRadius={65}
                          paddingAngle={stats.pieData.length > 1 ? 3 : 0}
                          strokeWidth={0}
                          startAngle={90}
                          endAngle={-270}
                        >
                          {stats.pieData.map((item) => (
                            <Cell key={item.mood} fill={item.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center label */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <p className="font-display text-2xl font-medium text-stone-900 leading-none">
                          {stats.entryCount}
                        </p>
                        <p className="text-[9px] text-stone-400 uppercase tracking-widest mt-0.5">
                          entries
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Legend bars */}
                  <div className="flex-1 min-w-[140px] space-y-2">
                    {MOOD_LEVELS.filter((m) => (stats.moodCounts.get(m) ?? 0) > 0).map((mood) => {
                      const meta  = MOOD_META[mood]
                      const count = stats.moodCounts.get(mood) ?? 0
                      const pct   = (count / stats.entryCount) * 100
                      return (
                        <div key={mood} className="flex items-center gap-2.5">
                          <span className="text-sm w-5 text-center">{meta.emoji}</span>
                          <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: meta.color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ delay: 0.15, duration: 0.5, ease: 'easeOut' }}
                            />
                          </div>
                          <span className="text-xs text-stone-500 tabular-nums w-4 text-right">
                            {count}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* ── Best / Toughest day ── */}
              <div className="grid grid-cols-2 gap-3">
                <DayCard
                  label="Best day"
                  entry={stats.bestDay}
                  accent="green"
                />
                <DayCard
                  label="Toughest day"
                  entry={stats.toughestDay}
                  accent="red"
                />
              </div>

              {/* ── Top words ── */}
              {stats.topWords.length > 0 && (
                <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm">
                  <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-4">
                    Top words this week
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {stats.topWords.map((word, i) => (
                      <motion.span
                        key={word}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 + i * 0.06, type: 'spring', stiffness: 400, damping: 25 }}
                        className="font-display italic text-2xl md:text-3xl font-medium text-stone-700 bg-stone-50 border border-stone-200 rounded-2xl px-4 py-2"
                      >
                        {word}
                      </motion.span>
                    ))}
                    {stats.topWords.length === 0 && (
                      <p className="text-sm text-stone-400">
                        Add notes to your entries to see top words.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  valueClass = 'text-stone-900',
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  valueClass?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider leading-none">
          {label}
        </span>
      </div>
      <p className={`font-display text-3xl font-medium leading-none ${valueClass}`}>
        {value}
        {sub && (
          <span className="text-base font-body font-normal text-stone-400 ml-1">{sub}</span>
        )}
      </p>
    </div>
  )
}

function DayCard({
  label,
  entry,
  accent,
}: {
  label: string
  entry: ReturnType<typeof useMoodStore.getState>['entries'][0]
  accent: 'green' | 'red'
}) {
  const meta = MOOD_META[entry.mood]
  const accentClass =
    accent === 'green'
      ? 'text-green-700 bg-green-50 border-green-200'
      : 'text-red-600 bg-red-50 border-red-200'

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm flex flex-col gap-2">
      <span className={`self-start text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${accentClass}`}>
        {label}
      </span>
      <p className="text-xs font-display italic text-stone-400">
        {format(new Date(entry.date + 'T00:00:00'), 'EEE, MMM d')}
      </p>
      <p className="text-lg font-medium text-stone-900 flex items-center gap-1.5">
        <span>{meta.emoji}</span>
        <span>{meta.label}</span>
      </p>
      {entry.note && (
        <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">
          {entry.note}
        </p>
      )}
    </div>
  )
}

function EmptyWeek({
  weekLabel,
  hasAnyEntries,
}: {
  weekLabel: string
  hasAnyEntries: boolean
}) {
  return (
    <div className="bg-white rounded-3xl border border-stone-200 py-16 px-8 text-center shadow-sm">
      <span className="text-5xl mb-4 block" role="img" aria-label="calendar">
        🗓️
      </span>
      <h3 className="font-display italic text-2xl font-medium text-stone-700">
        No entries this week
      </h3>
      <p className="mt-2 text-sm text-stone-400 max-w-xs mx-auto leading-relaxed">
        {hasAnyEntries
          ? `Nothing was logged for ${weekLabel}. Navigate to another week or start logging from the dashboard.`
          : 'Start logging your mood from the dashboard to see your weekly digest here.'}
      </p>
    </div>
  )
}
