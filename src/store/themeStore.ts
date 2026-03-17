import { create } from 'zustand'

interface ThemeState {
  isDark: boolean
  init: () => void
  toggle: () => void
}

function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark)
  localStorage.setItem('theme', isDark ? 'dark' : 'light')
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: false,

  init: () => {
    const isDark = localStorage.getItem('theme') === 'dark'
    set({ isDark })
    document.documentElement.classList.toggle('dark', isDark)
  },

  toggle: () => {
    const next = !get().isDark
    set({ isDark: next })
    applyTheme(next)
  },
}))
