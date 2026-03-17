import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { MOOD_META } from '@/lib/utils'
import type { MoodLevel } from '@/types/mood'

interface MoodSelectorProps {
  value: MoodLevel | null
  onChange: (mood: MoodLevel) => void
}

const MOODS: MoodLevel[] = [5, 4, 3, 2, 1]

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="flex gap-2 w-full" role="group" aria-label="Select your mood">
      {MOODS.map((mood) => {
        const meta = MOOD_META[mood]
        const selected = value === mood

        return (
          <motion.button
            key={mood}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${meta.label} ${meta.emoji}`}
            onClick={() => onChange(mood)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onChange(mood)
              }
            }}
            animate={{
              scale: selected ? 1.05 : 1,
              y: selected ? -3 : 0,
            }}
            whileHover={{ scale: selected ? 1.05 : 1.03, y: selected ? -3 : -1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className={cn(
              'relative flex-1 flex flex-col items-center gap-1.5 py-3.5 px-1 rounded-2xl border-2 overflow-hidden',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2',
              'transition-colors duration-200',
              selected
                ? 'border-transparent shadow-lg'
                : 'border-stone-200 bg-white hover:border-stone-300'
            )}
          >
            {/* Sliding color background — shared layout animation */}
            <AnimatePresence>
              {selected && (
                <motion.span
                  key="bg"
                  layoutId="mood-selection-bg"
                  className="absolute inset-0 rounded-2xl"
                  style={{ backgroundColor: meta.color }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </AnimatePresence>

            {/* Emoji */}
            <span
              className="relative z-10 text-2xl leading-none select-none"
              role="img"
              aria-hidden="true"
            >
              {meta.emoji}
            </span>

            {/* Label */}
            <span
              className={cn(
                'relative z-10 text-[11px] font-semibold tracking-wide transition-colors duration-150',
                selected ? 'text-white' : 'text-stone-500'
              )}
            >
              {meta.label}
            </span>

            {/* Check indicator */}
            <AnimatePresence>
              {selected && (
                <motion.span
                  key="check"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ delay: 0.05, type: 'spring', stiffness: 500, damping: 30 }}
                  className="relative z-10"
                >
                  <Check size={10} className="text-white/80" strokeWidth={3} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )
      })}
    </div>
  )
}
