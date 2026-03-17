import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { subDays } from 'date-fns'
import cloud from 'd3-cloud'
import type { Word } from 'd3-cloud'
import { useMoodStore } from '@/store/moodStore'
import { STOP_WORDS } from '@/lib/utils'
import { cn } from '@/lib/cn'

type TimeRange = '30d' | '90d' | 'all'

interface CloudWord extends Word {
  text: string
  size: number
  fill: string
  count: number
  avgSentiment: number
}

const RANGES: { label: string; value: TimeRange }[] = [
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
  { label: 'All', value: 'all' },
]

const CLOUD_W = 600
const CLOUD_H = 340

function sentimentToFill(avg: number): string {
  if (avg >  0.35) return '#15803d'  // green-700
  if (avg >  0.12) return '#65a30d'  // lime-600
  if (avg < -0.35) return '#dc2626'  // red-600
  if (avg < -0.12) return '#ea580c'  // orange-600
  return '#57534e'                   // stone-600 neutral
}

function buildWordData(
  entries: ReturnType<typeof useMoodStore.getState>['entries'],
  daysBack: number | null
): CloudWord[] {
  const cutoff = daysBack ? subDays(new Date(), daysBack) : null

  const freq = new Map<
    string,
    { count: number; totalSentiment: number; sentimentCount: number }
  >()

  for (const entry of entries) {
    if (!entry.note) continue
    if (cutoff && new Date(entry.date + 'T00:00:00') < cutoff) continue

    const words = entry.note
      .toLowerCase()
      .replace(/[^a-z\s']/g, ' ')
      .split(/\s+/)
      .map((w) => w.replace(/^'+|'+$/g, ''))  // strip leading/trailing apostrophes
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))

    for (const word of words) {
      const existing = freq.get(word) ?? { count: 0, totalSentiment: 0, sentimentCount: 0 }
      existing.count++
      if (entry.sentimentScore !== null) {
        existing.totalSentiment += entry.sentimentScore
        existing.sentimentCount++
      }
      freq.set(word, existing)
    }
  }

  const sorted = [...freq.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 80)

  if (sorted.length === 0) return []

  const maxCount = sorted[0]?.[1]?.count ?? 1

  return sorted.map(([text, data]) => {
    const avgSentiment =
      data.sentimentCount > 0 ? data.totalSentiment / data.sentimentCount : 0
    return {
      text,
      size: 13 + (data.count / maxCount) * 38,
      fill: sentimentToFill(avgSentiment),
      count: data.count,
      avgSentiment,
    }
  })
}

export function WordCloud() {
  const [timeRange, setTimeRange] = useState<TimeRange>('all')
  const [layoutWords, setLayoutWords] = useState<CloudWord[]>([])
  const [hoveredWord, setHoveredWord] = useState<string | null>(null)
  const navigate = useNavigate()
  const entries = useMoodStore((s) => s.entries)
  const cancelRef = useRef(false)

  const wordData = useMemo(() => {
    const daysBack = timeRange === 'all' ? null : Number(timeRange.replace('d', ''))
    return buildWordData(entries, daysBack)
  }, [entries, timeRange])

  const hasEnoughEntries = entries.length >= 5

  useEffect(() => {
    if (wordData.length === 0) {
      setLayoutWords([])
      return
    }

    cancelRef.current = false

    const layout = cloud<CloudWord>()
      .size([CLOUD_W, CLOUD_H])
      .words(wordData.map((w) => ({ ...w })))
      .padding(6)
      .rotate(() => 0)  // all horizontal — most readable
      .font('Outfit, sans-serif')
      .fontSize((d) => d.size ?? 14)
      .on('end', (output) => {
        if (!cancelRef.current) {
          setLayoutWords(output as CloudWord[])
        }
      })

    layout.start()

    return () => {
      cancelRef.current = true
    }
  }, [wordData])

  const handleWordClick = (word: string) => {
    void navigate(`/history?word=${encodeURIComponent(word)}`)
  }

  if (!hasEnoughEntries) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-5xl mb-4" role="img" aria-label="speech balloon">
          💬
        </span>
        <h3 className="font-display italic text-2xl font-medium text-stone-700">
          Keep journaling
        </h3>
        <p className="mt-2 text-sm text-stone-400 max-w-xs leading-relaxed">
          Add notes to at least{' '}
          <span className="font-semibold text-stone-600">5 entries</span> to see your
          word cloud — your most-used words, colored by emotional tone.
        </p>
        <p className="mt-3 text-xs text-stone-400">
          {entries.length} / 5 entries logged
        </p>
      </div>
    )
  }

  if (wordData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-5xl mb-4">📝</span>
        <p className="text-sm text-stone-400">
          No notes found in this time range.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Time range selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">
          Word frequency · colored by sentiment
        </p>
        <div className="flex gap-1 bg-stone-100 rounded-xl p-1">
          {RANGES.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setTimeRange(value)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150',
                timeRange === value
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Cloud SVG */}
      <div className="relative overflow-hidden rounded-2xl bg-stone-50 border border-stone-100">
        <svg
          viewBox={`0 0 ${CLOUD_W} ${CLOUD_H}`}
          width="100%"
          style={{ display: 'block', minHeight: 200 }}
          aria-label="Word cloud visualization"
        >
          <g transform={`translate(${CLOUD_W / 2},${CLOUD_H / 2})`}>
            {layoutWords.map((word) => (
              <text
                key={word.text}
                textAnchor="middle"
                transform={`translate(${word.x ?? 0},${word.y ?? 0}) rotate(${word.rotate ?? 0})`}
                fontSize={word.size}
                fontFamily="Outfit, sans-serif"
                fontWeight={word.count > 3 ? '600' : '400'}
                fill={word.fill}
                opacity={
                  hoveredWord === null
                    ? 1
                    : hoveredWord === word.text
                      ? 1
                      : 0.25
                }
                style={{
                  cursor: 'pointer',
                  transition: 'opacity 0.15s ease',
                  userSelect: 'none',
                }}
                onClick={() => handleWordClick(word.text)}
                onMouseEnter={() => setHoveredWord(word.text)}
                onMouseLeave={() => setHoveredWord(null)}
                aria-label={`${word.text}, used ${word.count} time${word.count !== 1 ? 's' : ''}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleWordClick(word.text)
                  }
                }}
              >
                {word.text}
              </text>
            ))}
          </g>
        </svg>

        {/* Hover hint */}
        {hoveredWord && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
            <span className="text-xs bg-white/90 backdrop-blur-sm border border-stone-200 rounded-full px-3 py-1 text-stone-600 shadow-sm">
              Click to filter history by{' '}
              <span className="font-semibold">"{hoveredWord}"</span>
            </span>
          </div>
        )}
      </div>

      {/* Color legend */}
      <div className="flex items-center gap-4 text-xs flex-wrap">
        {[
          { color: '#15803d', label: 'Very positive' },
          { color: '#65a30d', label: 'Positive'      },
          { color: '#57534e', label: 'Neutral'        },
          { color: '#ea580c', label: 'Negative'       },
          { color: '#dc2626', label: 'Very negative'  },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5 text-stone-500">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
