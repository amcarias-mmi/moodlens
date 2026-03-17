import { motion } from 'framer-motion'
import { WeeklyReport } from '@/components/weekly/WeeklyReport'

export default function Weekly() {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="pt-2"
      >
        <h1 className="font-display italic text-5xl md:text-6xl font-medium text-stone-900 dark:text-stone-50 leading-[1.1]">
          Weekly
        </h1>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
          Your mood digest, week by week.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: 'easeOut' }}
      >
        <WeeklyReport />
      </motion.div>
    </div>
  )
}
