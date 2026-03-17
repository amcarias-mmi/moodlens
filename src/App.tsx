import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { AppShell } from '@/components/layout/AppShell'
import { useMoodStore } from '@/store/moodStore'
import { useThemeStore } from '@/store/themeStore'
import Dashboard from '@/pages/Dashboard'
import History from '@/pages/History'
import Insights from '@/pages/Insights'
import Weekly from '@/pages/Weekly'
import Settings from '@/pages/Settings'

export default function App() {
  const loadEntries = useMoodStore((s) => s.loadEntries)
  const initTheme = useThemeStore((s) => s.init)

  useEffect(() => {
    initTheme()
    void loadEntries()
  }, [loadEntries, initTheme])

  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/weekly" element={<Weekly />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </AppShell>
      <Toaster />
    </BrowserRouter>
  )
}
