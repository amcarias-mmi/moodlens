import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { format, startOfWeek, addDays, subWeeks, isSameDay } from 'date-fns'
import { useMoodStore } from '@/store/moodStore'
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

  function cellColor(date: Date): string {
    const dateStr = format(date, 'yyyy-MM-dd')
    const entry = entryMap.get(dateStr)
    if (!entry) return '#e7e5e0'
    return MOOD_META[entry.mood].color
  }

  return (
    <div>
      <div className="overflow-x-auto pb-2">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          width="100%"
          style={{ display: 'block', minWidth: 500 }}
          onMouseLeave={() => setHover(null)}
        >
          {/* Month labels */}
          {monthLabels.map(({ label, x }) => (
            <text
              key={label + x}
              x={x}
              y={TOP_PAD - 6}
              fontSize={10}
              fill="#a8a29e"
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
                fill="#a8a29e"
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
                    stroke={isToday ? '#1c1917' : 'none'}
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
                  fill="#a8a29e"
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
                  fill="#e7e5e0"
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
                  fill="#a8a29e"
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
            className="bg-white border border-stone-200 rounded-xl px-3 py-2.5 shadow-xl min-w-[160px]"
          >
            <p className="text-xs font-semibold text-stone-500 mb-1">
              {format(new Date(hover.dateStr + 'T00:00:00'), 'EEE, MMMM d, yyyy')}
            </p>
            {hover.entry ? (
              <>
                <p className="text-sm font-medium text-stone-900">
                  {MOOD_META[hover.entry.mood].emoji} {MOOD_META[hover.entry.mood].label}
                </p>
                {hover.entry.sentimentScore !== null && (
                  <p className="text-xs text-stone-500 mt-0.5 tabular-nums">
                    Sentiment:{' '}
                    {hover.entry.sentimentScore > 0 ? '+' : ''}
                    {hover.entry.sentimentScore.toFixed(2)}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-stone-400">No entry</p>
            )}
          </div>,
          document.body
        )}
    </div>
  )
}
