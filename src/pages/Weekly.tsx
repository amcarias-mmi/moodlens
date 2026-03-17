import { motion } from 'framer-motion'
import { WeeklyReport } from '@/components/weekly/WeeklyReport'

export default function Weekly() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <WeeklyReport />
    </motion.div>
  )
}
