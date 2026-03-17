import { useMemo, useState } from 'react'
import { subDays, format } from 'date-fns'
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { Info } from 'lucide-react'
import { useMoodStore } from '@/store/moodStore'
import { MOOD_META } from '@/lib/utils'
import { cn } from '@/lib/cn'
import type { MoodLevel } from '@/types/mood'

type Range = '7d' | '30d' | '90d' | 'all'

interface TrendPoint {
  date: string
  sentimentScore: number | null
  rollingAvg: number | null
  mood: MoodLevel
}

const RANGES: { label: string; value: Range }[] = [
  { label: '7d',   value: '7d'  },
  { label: '30d',  value: '30d' },
  { label: '90d',  value: '90d' },
  { label: 'All',  value: 'all' },
]

const WINDOW = 7

function computeRollingAvg(data: TrendPoint[]): TrendPoint[] {
  return data.map((point, i) => {
    const window = data
      .slice(Math.max(0, i - WINDOW + 1), i + 1)
      .filter((p) => p.sentimentScore !== null)
    if (window.length === 0) return { ...point, rollingAvg: null }
    const avg = window.reduce((sum, p) => sum + (p.sentimentScore ?? 0), 0) / window.length
    return { ...point, rollingAvg: avg }
  })
}

// Recharts injects cx, cy, payload at runtime — typed to match expected SVGElement generic
type DotRenderer = (props: Record<string, unknown>) => React.ReactElement<SVGElement>

const renderEmojiDot: DotRenderer = (props) => {
  const cx = Number(props.cx ?? 0)
  const cy = Number(props.cy ?? 0)
  const payload = props.payload as TrendPoint | undefined
  if (!payload?.sentimentScore) {
    return (<g key={`de-${cx}-${cy}`} />) as unknown as React.ReactElement<SVGElement>
  }
  return (
    <text
      key={`d-${payload.date}`}
      x={cx}
      y={cy + 5}
      textAnchor="middle"
      fontSize={11}
      style={{ userSelect: 'none', pointerEvents: 'none' }}
    >
      {MOOD_META[payload.mood].emoji}
    </text>
  ) as unknown as React.ReactElement<SVGElement>
}

interface CustomTooltipProps {
  active?: boolean
  payload?: { value: number; dataKey: string; payload: TrendPoint }[]
  label?: string
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null
  const raw = payload.find((p) => p.dataKey === 'sentimentScore')
  const avg = payload.find((p) => p.dataKey === 'rollingAvg')

  return (
    <div className="bg-white border border-stone-200 rounded-xl px-3 py-2.5 shadow-xl text-xs min-w-[150px]">
      <p className="font-semibold text-stone-500 mb-1.5">
        {format(new Date(point.date + 'T00:00:00'), 'EEE, MMM d')}
      </p>
      <p className="text-stone-900 flex items-center gap-1.5">
        <span>{MOOD_META[point.mood].emoji}</span>
        <span className="font-medium">{MOOD_META[point.mood].label}</span>
      </p>
      {raw?.value != null && (
        <p className="text-stone-500 mt-1 tabular-nums">
          Score:{' '}
          <span className="text-stone-700 font-medium">
            {raw.value > 0 ? '+' : ''}
            {raw.value.toFixed(2)}
          </span>
        </p>
      )}
      {avg?.value != null && (
        <p className="text-stone-400 tabular-nums">
          7-day avg:{' '}
          <span className="font-medium">
            {avg.value > 0 ? '+' : ''}
            {avg.value.toFixed(2)}
          </span>
        </p>
      )}
    </div>
  )
}

export function SentimentTrend() {
  const [range, setRange] = useState<Range>('30d')
  const entries = useMoodStore((s) => s.entries)

  const data = useMemo<TrendPoint[]>(() => {
    const cutoff =
      range === 'all' ? null : subDays(new Date(), Number(range.replace('d', '')))

    const filtered = [...entries]
      .filter((e) => {
        if (!cutoff) return true
        return new Date(e.date + 'T00:00:00') >= cutoff
      })
      .filter((e) => e.sentimentScore !== null)
      .sort((a, b) => a.timestamp - b.timestamp)

    const raw: TrendPoint[] = filtered.map((e) => ({
      date: e.date,
      sentimentScore: e.sentimentScore,
      rollingAvg: null,
      mood: e.mood,
    }))

    return computeRollingAvg(raw)
  }, [entries, range])

  const hasEnoughData = data.length >= 3

  return (
    <div className="space-y-4">
      {/* Range selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">
          Sentiment over time
        </p>
        <div className="flex gap-1 bg-stone-100 rounded-xl p-1">
          {RANGES.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150',
                range === value
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Not enough data callout */}
      {!hasEnoughData && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-500">
          <Info size={15} className="text-stone-400 flex-shrink-0" />
          <span>
            {data.length === 0
              ? 'No entries with notes in this range. Add some notes to see your sentiment trend.'
              : `Add ${3 - data.length} more noted entries to see the full trend.`}
          </span>
        </div>
      )}

      {/* Chart */}
      {data.length > 0 && (
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#d97706" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0}    />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f0ee"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                tickFormatter={(d: string) =>
                  format(new Date(d + 'T00:00:00'), 'MMM d')
                }
                tick={{ fontSize: 10, fill: '#a8a29e', fontFamily: 'Outfit' }}
                axisLine={{ stroke: '#e7e5e0' }}
                tickLine={false}
                interval="preserveStartEnd"
              />

              <YAxis
                domain={[-1, 1]}
                ticks={[-1, -0.5, 0, 0.5, 1]}
                tickFormatter={(v: number) => v.toFixed(1)}
                tick={{ fontSize: 10, fill: '#a8a29e', fontFamily: 'Outfit' }}
                axisLine={false}
                tickLine={false}
                width={32}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Zero reference line */}
              <ReferenceLine
                y={0}
                stroke="#d1cdc7"
                strokeDasharray="5 3"
                strokeWidth={1}
              />

              {/* Raw sentiment area */}
              <Area
                type="monotone"
                dataKey="sentimentScore"
                stroke="#d97706"
                strokeWidth={2}
                fill="url(#sentGrad)"
                dot={renderEmojiDot as unknown as React.ComponentProps<typeof Area>['dot']}
                activeDot={false}
                connectNulls={false}
              />

              {/* 7-day rolling average */}
              <Line
                type="monotone"
                dataKey="rollingAvg"
                stroke="#a8a29e"
                strokeDasharray="5 3"
                strokeWidth={1.5}
                dot={false}
                activeDot={false}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Legend */}
      {data.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-amber-600 inline-block rounded" />
            Sentiment
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 inline-block border-t border-dashed border-stone-400" />
            7-day avg
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 inline-block border-t border-dashed border-stone-300" />
            Neutral
          </span>
        </div>
      )}
    </div>
  )
}
