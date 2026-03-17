import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import Dashboard from '@/pages/Dashboard'
import History from '@/pages/History'
import Insights from '@/pages/Insights'
import Weekly from '@/pages/Weekly'
import Settings from '@/pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/history" element={<History />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/weekly" element={<Weekly />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}
