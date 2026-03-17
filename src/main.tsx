import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Dev-only seed helper — open browser console and run: __seed()
if (import.meta.env.DEV) {
  import('./lib/seedData').then(({ seedDemoData }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).__seed = seedDemoData
    console.info('[MoodLens] Dev seed available → run __seed() in console')
  })
}

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
