import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  ScrollText,
  BarChart2,
  CalendarDays,
  Settings,
  Sun,
  Moon,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { useThemeStore } from '@/store/themeStore'
import { useMoodStore } from '@/store/moodStore'
import { todayString } from '@/lib/utils'
import type { MoodLevel } from '@/types/mood'

const MOOD_DOT_COLORS: Record<MoodLevel, { bg: string; shadow: string; shadowHover: string }> = {
  5: { bg: '#22c55e', shadow: '0 0 8px #22c55e88',  shadowHover: '0 0 12px #22c55eaa' },
  4: { bg: '#86efac', shadow: '0 0 8px #86efac88',  shadowHover: '0 0 12px #86efacaa' },
  3: { bg: '#fbbf24', shadow: '0 0 8px #fbbf2488',  shadowHover: '0 0 12px #fbbf24aa' },
  2: { bg: '#fb923c', shadow: '0 0 8px #fb923c88',  shadowHover: '0 0 12px #fb923caa' },
  1: { bg: '#ef4444', shadow: '0 0 8px #ef444488',  shadowHover: '0 0 12px #ef4444aa' },
}
const FALLBACK_DOT = { bg: '#a8a29e', shadow: '0 0 8px #a8a29e55', shadowHover: '0 0 12px #a8a29e77' }

const NAV_ITEMS = [
  { to: '/',          label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/history',   label: 'History',   Icon: ScrollText      },
  { to: '/insights',  label: 'Insights',  Icon: BarChart2       },
  { to: '/weekly',    label: 'Weekly',    Icon: CalendarDays    },
  { to: '/settings',  label: 'Settings',  Icon: Settings        },
] as const

export function NavBar() {
  const { pathname } = useLocation()
  const { isDark, toggle } = useThemeStore()
  const entries = useMoodStore(s => s.entries)
  const todayEntry = entries.find(e => e.date === todayString())
  const dot = todayEntry ? MOOD_DOT_COLORS[todayEntry.mood] : FALLBACK_DOT

  return (
    <>
      {/* ── Desktop top nav ── */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-16 bg-white/80 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-700/30 items-center transition-colors duration-300">
        <div className="max-w-5xl mx-auto w-full px-6 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <span
              className="w-2.5 h-2.5 rounded-full transition-shadow"
              style={{ backgroundColor: dot.bg, boxShadow: dot.shadow }}
              onMouseEnter={e => { (e.currentTarget as HTMLSpanElement).style.boxShadow = dot.shadowHover }}
              onMouseLeave={e => { (e.currentTarget as HTMLSpanElement).style.boxShadow = dot.shadow }}
            />
            <span className="font-display italic text-[22px] font-medium text-stone-900 dark:text-stone-50 tracking-tight">
              MoodLens
            </span>
          </Link>

          {/* Nav links + theme toggle */}
          <div className="flex items-center gap-1">
            <nav className="flex items-center gap-0.5">
              {NAV_ITEMS.map(({ to, label, Icon }) => {
                const active = pathname === to
                return (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      active
                        ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
                        : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100/80 dark:hover:bg-stone-800'
                    )}
                  >
                    <Icon size={14} strokeWidth={active ? 2.5 : 2} />
                    <span>{label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Dark mode toggle */}
            <button
              onClick={toggle}
              className="ml-2 w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all duration-200"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <motion.div
                key={isDark ? 'moon' : 'sun'}
                initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </motion.div>
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-stone-950/95 backdrop-blur-md border-t border-stone-200/80 dark:border-stone-700/30 transition-colors duration-300">
        <div className="flex items-center justify-around px-2 py-2 safe-area-bottom">
          {NAV_ITEMS.map(({ to, label, Icon }) => {
            const active = pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[52px]',
                  active
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-stone-400 dark:text-stone-500'
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span className={cn('text-[10px] font-medium', active ? 'font-semibold' : '')}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
