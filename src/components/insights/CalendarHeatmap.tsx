import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { format, startOfWeek, addDays, subWeeks, isSameDay, subDays } from 'date-fns'
import { useMoodStore } from '@/store/moodStore'
import { useThemeStore } from '@/store/themeStore'
import { MOOD_META } from '@/lib/utils'
import type { MoodEntry } from '@/types/mood'

const CELL = 11
const GAP  = 2
const STEP = CELL + GAP  // 13px
const WEEKS = 53
const LEFT_PAD = 28   // day label column
const TOP_PAD  = 22   // month label row
const LEGEND_H = 32
const SVG_W = WEEKS * STEP + LEFT_PAD
const SVG_H = 7 * STEP + TOP_PAD + LEGEND_H

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']
const MOOD_LEVELS = [1, 2, 3, 4, 5] as const

interface HoverInfo {
  dateStr: string
  entry: MoodEntry | undefined
  x: number
  y: number
}

export function CalendarHeatmap() {
  const entries = useMoodStore((s) => s.entries)
  const isDark = useThemeStore((s) => s.isDark)
  const [hover, setHover] = useState<HoverInfo | null>(null)

  const entryMap = useMemo(
    () => new Map(entries.map((e) => [e.date, e])),
    [entries]
  )

  // Build 53×7 grid starting from the last Sunday ~52 weeks ago
  const today = useMemo(() => new Date(), [])
  const gridStart = useMemo(
    () => startOfWeek(subWeeks(today, WEEKS - 1), { weekStartsOn: 0 }),
    [today]
  )

  const weeks = useMemo(() => {
    const result: (Date | null)[][] = []
    let cursor = gridStart
    for (let w = 0; w < WEEKS; w++) {
      const week: (Date | null)[] = []
      for (let d = 0; d < 7; d++) {
        week.push(cursor > today ? null : new Date(cursor))
        cursor = addDays(cursor, 1)
      }
      result.push(week)
    }
    return result
  }, [gridStart, today])

  // Month label positions
  const monthLabels = useMemo(() => {
    const labels: { label: string; x: number }[] = []
    let lastMonth = -1
    weeks.forEach((week, wi) => {
      const first = week.find((d) => d !== null)
      if (!first) return
      const m = first.getMonth()
      if (m !== lastMonth) {
        labels.push({ label: format(first, 'MMM'), x: wi * STEP + LEFT_PAD })
        lastMonth = m
      }
    })
    return labels
  }, [weeks])

  // Dark-mode-aware colors
  const emptyFill    = isDark ? '#292524' : '#e7e5e0'   // stone-800 / stone-200
  const labelFill    = isDark ? '#78716c' : '#a8a29e'   // stone-500 / stone-400
  const todayStroke  = isDark ? '#f5f5f4' : '#1c1917'   // stone-100 / stone-900

  function cellColor(date: Date): string {
    const dateStr = format(date, 'yyyy-MM-dd')
    const entry = entryMap.get(dateStr)
    if (!entry) return emptyFill
    return MOOD_META[entry.mood].color
  }

  const loggedInPeriod = useMemo(() => {
    let count = 0
    for (const week of weeks) {
      for (const date of week) {
        if (date && entryMap.has(format(date, 'yyyy-MM-dd'))) count++
      }
    }
    return count
  }, [weeks, entryMap])

  // Entries sorted chronologically for the SR table (past 53 weeks)
  const srEntries = useMemo(() => {
    const cutoff = subDays(today, WEEKS * 7)
    return [...entries]
      .filter((e) => new Date(e.date + 'T00:00:00') >= cutoff)
      .sort((a, b) => b.timestamp - a.timestamp)
  }, [entries, today])

  return (
    <div>
      {/* Screen-reader summary table (visually hidden) */}
      <div className="sr-only">
        <p>{loggedInPeriod} of the past year's days have mood entries.</p>
        <table>
          <caption>Mood entries for the past year</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Mood</th>
            </tr>
          </thead>
          <tbody>
            {srEntries.map((entry) => (
              <tr key={entry.id}>
                <td>{format(new Date(entry.date + 'T00:00:00'), 'MMMM d, yyyy')}</td>
                <td>{MOOD_META[entry.mood].label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto pb-2">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          width="100%"
          style={{ display: 'block', minWidth: 500 }}
          aria-hidden="true"
          onMouseLeave={() => setHover(null)}
        >
          {/* Month labels */}
          {monthLabels.map(({ label, x }) => (
            <text
              key={label + x}
              x={x}
              y={TOP_PAD - 6}
              fontSize={10}
              fill={labelFill}
              fontFamily="Outfit, sans-serif"
            >
              {label}
            </text>
          ))}

          {/* Day-of-week labels */}
          {DAY_LABELS.map((label, i) =>
            label ? (
              <text
                key={i}
                x={LEFT_PAD - 5}
                y={TOP_PAD + i * STEP + CELL - 1}
                fontSize={9}
                fill={labelFill}
                textAnchor="end"
                fontFamily="Outfit, sans-serif"
              >
                {label}
              </text>
            ) : null
          )}

          {/* Calendar cells */}
          {weeks.map((week, wi) =>
            week.map((date, di) => {
              if (!date) return null
              const dateStr = format(date, 'yyyy-MM-dd')
              const entry = entryMap.get(dateStr)
              const isToday = isSameDay(date, today)
              const cx = wi * STEP + LEFT_PAD
              const cy = di * STEP + TOP_PAD

              return (
                <g key={dateStr}>
                  <rect
                    x={cx}
                    y={cy}
                    width={CELL}
                    height={CELL}
                    rx={2}
                    ry={2}
                    fill={cellColor(date)}
                    stroke={isToday ? todayStroke : 'none'}
                    strokeWidth={isToday ? 1.5 : 0}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={(e) =>
                      setHover({ dateStr, entry, x: e.clientX, y: e.clientY })
                    }
                    onMouseMove={(e) =>
                      setHover((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)
                    }
                  />
                </g>
              )
            })
          )}

          {/* Legend */}
          {(() => {
            const legendY = TOP_PAD + 7 * STEP + 12
            return (
              <g>
                <text
                  x={LEFT_PAD}
                  y={legendY + 9}
                  fontSize={10}
                  fill={labelFill}
                  fontFamily="Outfit, sans-serif"
                >
                  No entry
                </text>
                <rect
                  x={LEFT_PAD + 54}
                  y={legendY}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  fill={emptyFill}
                />
                {MOOD_LEVELS.map((level, i) => (
                  <g key={level}>
                    <rect
                      x={LEFT_PAD + 70 + i * (CELL + 3)}
                      y={legendY}
                      width={CELL}
                      height={CELL}
                      rx={2}
                      fill={MOOD_META[level].color}
                    />
                  </g>
                ))}
                <text
                  x={LEFT_PAD + 70 + MOOD_LEVELS.length * (CELL + 3) + 4}
                  y={legendY + 9}
                  fontSize={10}
                  fill={labelFill}
                  fontFamily="Outfit, sans-serif"
                >
                  {MOOD_META[5].emoji} Great
                </text>
              </g>
            )
          })()}
        </svg>
      </div>

      {/* Hover tooltip via portal */}
      {hover &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              left: hover.x + 14,
              top: hover.y - 72,
              zIndex: 9999,
              pointerEvents: 'none',
            }}
            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 shadow-xl min-w-[160px]"
          >
            <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1">
              {format(new Date(hover.dateStr + 'T00:00:00'), 'EEE, MMMM d, yyyy')}
            </p>
            {hover.entry ? (
              <>
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                  {MOOD_META[hover.entry.mood].emoji} {MOOD_META[hover.entry.mood].label}
                </p>
                {hover.entry.sentimentScore !== null && (
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 tabular-nums">
                    Sentiment:{' '}
                    {hover.entry.sentimentScore > 0 ? '+' : ''}
                    {hover.entry.sentimentScore.toFixed(2)}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-stone-400 dark:text-stone-500">No entry</p>
            )}
          </div>,
          document.body
        )}
    </div>
  )
}
