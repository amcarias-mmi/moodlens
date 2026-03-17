# MoodLens — Claude Code Context

## Project

Fully client-side mood journaling app with sentiment analysis, visualizations, and weekly reports. Zero backend — IndexedDB only.

## Ground Rules

- **TypeScript strict mode** — no `any`, no unused locals/params
- **Authoritative type check**: `npx tsc -p tsconfig.app.json --noEmit` (stricter than `tsc --noEmit`)
- **Zustand is the single source of truth** — all mutations go through `useMoodStore` or `useThemeStore`
- **No backend calls** — all data stays in IndexedDB
- **One conventional commit per logical phase**

## Commands

```bash
npm run dev                                 # dev server (Vite, default port 5173)
npx tsc -p tsconfig.app.json --noEmit      # authoritative type check
npm run build                               # production build (must be zero warnings)
```

## Key Files

| File | Purpose |
|---|---|
| `src/types/mood.ts` | `MoodEntry`, `MoodLevel` types |
| `src/lib/db.ts` | IndexedDB: `getDB`, `getAllEntries`, `upsertEntry`, `deleteEntry`, `clearAllEntries` |
| `src/lib/sentiment.ts` | `analyzeSentiment(note)` → `{ score: Math.tanh(comparative), comparative }` or `null` |
| `src/lib/utils.ts` | `MOOD_META`, `formatDate`, `todayString`, `extractTopWords`, `STOP_WORDS` |
| `src/lib/streak.ts` | `computeStreak(entries)`, `getGreeting()` |
| `src/store/moodStore.ts` | Zustand CRUD: `loadEntries`, `addEntry`, `updateEntry`, `deleteEntry`, `clearAll`, `importEntries` |
| `src/store/themeStore.ts` | `isDark`, `init()`, `toggle()` — persisted to `localStorage`, toggles `html.dark` class |
| `src/lib/seedData.ts` | Dev-only seed (14 entries) — exposed as `window.__seed()` in dev mode |

## Data Model

```ts
export type MoodLevel = 1 | 2 | 3 | 4 | 5
// 1=Rough 😞  2=Low 😔  3=Okay 😐  4=Good 😊  5=Great 😄

export interface MoodEntry {
  id: string            // uuid v4
  date: string          // "YYYY-MM-DD"
  timestamp: number     // Unix ms
  mood: MoodLevel
  note: string          // max 500 chars
  sentimentScore: number | null       // normalized −1.0 to 1.0 via Math.tanh
  sentimentComparative: number | null
  divergenceFlag: boolean             // (mood≥4 && score<−0.2) || (mood≤2 && score>0.2)
  createdAt: number
  updatedAt: number
}
```

## IndexedDB

- DB name: `moodlog_db` v1
- Store: `mood_entries` (keyPath: `id`)
- Indexes: `by_date` (unique), `by_timestamp`

## Design System

- **Fonts**: Cormorant (`font-display`, italic headings) + Outfit (`font-body`, UI)
- **Palette**: stone/warm neutrals, amber accents, mood color CSS variables
- **Mood colors**: `--mood-great: #22c55e` · `--mood-good: #86efac` · `--mood-okay: #fbbf24` · `--mood-low: #fb923c` · `--mood-rough: #ef4444`
- **Cards**: `bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700/50 shadow-sm`
- **Page headers**: `font-display italic text-5xl md:text-6xl font-medium text-stone-900 dark:text-stone-50`
- **Dark mode**: Tailwind `dark:` variants, toggled via `html.dark` class

## Patterns & Conventions

- **Optimistic updates**: state updated immediately, IndexedDB write is async `await`
- **Date strings**: always `"YYYY-MM-DD"` — parse as `new Date(date + 'T00:00:00')` to avoid timezone shifts
- **Framer Motion**: `layoutId` for shared element transitions (mood selector, tab indicator)
- **Portal tooltips**: calendar heatmap uses `createPortal` to escape `overflow-hidden` containers
- **Word cloud click**: navigates to `/history?word=<word>`, wired via `useSearchParams` in History.tsx
- **Import validation**: `validateEntry(raw)` in Settings.tsx — checks all required fields before accepting

## Build Notes

- Chunk splitting configured in `vite.config.ts` (`vendor-react`, `vendor-charts`, `vendor-motion`, `vendor-d3`)
- This keeps all chunks under 500 kB and avoids build warnings
- `src/lib/seedData.ts` is dev-only, imported dynamically in `main.tsx` under `import.meta.env.DEV`

## Phase History

| Commit | Phase |
|---|---|
| `chore: add gitignore` | gitignore |
| `chore: scaffold project...` | Phase 1 — Bootstrap |
| `feat(data): indexeddb layer...` | Phase 2 — Data Layer |
| `feat(checkin): check-in modal...` | Phase 3 — Check-in Flow |
| `feat(history): entry list...` | Phase 4 — Entry History |
| `feat(insights): calendar heatmap...` | Phase 5 — Visualizations |
| `feat(weekly): weekly digest...` | Phase 6 — Weekly Report |
| `feat(settings): export/import/clear...` | Phase 7 — Polish & Settings |
