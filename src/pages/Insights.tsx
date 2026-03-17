import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarHeatmap } from '@/components/insights/CalendarHeatmap'
import { SentimentTrend } from '@/components/insights/SentimentTrend'
import { WordCloud } from '@/components/insights/WordCloud'
import { cn } from '@/lib/cn'

const TABS = [
  { id: 'calendar',  label: 'Calendar'   },
  { id: 'trends',    label: 'Trends'     },
  { id: 'wordcloud', label: 'Word Cloud' },
] as const

type TabId = (typeof TABS)[number]['id']

const VALID_TABS = new Set<string>(TABS.map((t) => t.id))

export default function Insights() {
  const location = useLocation()
  const navigate = useNavigate()

  const hash = location.hash.slice(1)
  const activeTab: TabId = VALID_TABS.has(hash) ? (hash as TabId) : 'calendar'

  const setTab = (id: TabId) => void navigate(`/insights#${id}`, { replace: true })

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="pt-2"
      >
        <h1 className="font-display italic text-5xl md:text-6xl font-medium text-stone-900 dark:text-stone-50 leading-[1.1]">
          Insights
        </h1>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
          Patterns and trends from your emotional data.
        </p>
      </motion.div>

      {/* Animated tab nav */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
        className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700/50 p-1 flex gap-0.5"
        role="tablist"
        aria-label="Insights tabs"
      >
        {TABS.map(({ id, label }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              aria-controls={`tabpanel-${id}`}
              onClick={() => setTab(id)}
              className={cn(
                'relative flex-1 py-2.5 text-sm font-medium rounded-xl transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
                active
                  ? 'text-stone-900 dark:text-stone-100'
                  : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
              )}
            >
              {/* Sliding background indicator */}
              {active && (
                <motion.span
                  layoutId="tab-indicator"
                  className="absolute inset-0 bg-stone-100 dark:bg-stone-800 rounded-xl"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10">{label}</span>
            </button>
          )
        })}
      </motion.div>

      {/* Tab panels */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
      >
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-700/50 p-5 md:p-6 shadow-sm">
          {activeTab === 'calendar'  && <CalendarHeatmap />}
          {activeTab === 'trends'    && <SentimentTrend  />}
          {activeTab === 'wordcloud' && <WordCloud        />}
        </div>
      </motion.div>
    </div>
  )
}
