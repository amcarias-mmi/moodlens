# Product Requirements Document
## MoodLens — Mood Tracker with Sentiment Analysis
**Version:** 1.0 | **Date:** March 17, 2026 | **Status:** Ready for Development

---

## 1. Overview

### 1.1 Product Summary
A fully client-side mood journaling app. Users log their daily emotional state with a short note; the app surfaces sentiment trends, a calendar heatmap, word cloud, and weekly digest reports — all stored locally with zero backend dependency.

### 1.2 Goals
- Frictionless daily mood check-in ritual
- Client-side NLP to surface sentiment patterns
- Polished data visualizations that make emotional trends tangible
- 100% privacy: no server, no account, no data leaves the device

### 1.3 Non-Goals
- User authentication or multi-device sync
- Backend API or ML inference services
- Social / sharing features
- Mobile native apps (web-responsive only)

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript (strict mode) |
| Build Tool | Vite |
| State Management | Zustand |
| UI Components | shadcn/ui + Radix UI |
| Styling | Tailwind CSS v4 |
| Storage | IndexedDB via `idb` (localStorage fallback) |
| Sentiment Engine | `sentiment` npm package (AFINN lexicon) |
| Charts | Recharts |
| Word Cloud | `d3-cloud` |
| Date Utilities | `date-fns` |
| Routing | React Router v7 |
| Unique IDs | `uuid` |

---

## 3. User Stories & Acceptance Criteria

### 3.1 Core — Mood Logging

**US-01 · Daily Check-in**
- [ ] User selects a mood from 5 options: 😄 Great / 😊 Good / 😐 Okay / 😔 Low / 😞 Rough
- [ ] Optional free-text note (max 500 chars, live counter shown)
- [ ] Entry auto-stamped with current date/time
- [ ] One entry per calendar day; editing replaces existing entry with a confirmation dialog
- [ ] Entry persists to IndexedDB immediately on save
- [ ] Success/error toasts on save

**US-02 · Entry History**
- [ ] Entries listed in reverse-chronological order
- [ ] Each card: date, mood emoji + label, sentiment badge, note excerpt (100 chars, expandable)
- [ ] Delete with confirm dialog; edit (note + mood only, date locked)
- [ ] Empty state shown when no entries exist

### 3.2 Sentiment Analysis

**US-03 · Automatic Sentiment Scoring**
- [ ] Note passed through `sentiment` (AFINN) on save
- [ ] Normalized score (−1.0 → +1.0) stored with entry
- [ ] Colored badge: Positive (green) / Neutral (gray) / Negative (red)
- [ ] No note → `null` score, displayed as "—"
- [ ] Fully in-browser, no network calls

**US-04 · Mood vs. Sentiment Divergence**
- [ ] Divergence flag: mood=Great but score < −0.3, or mood=Rough but score > +0.3
- [ ] Flagged entries show ⚠️ indicator
- [ ] Tooltip: "Your note tone didn't match your selected mood"

### 3.3 Visualizations

**US-05 · Mood Calendar Heatmap**
- [ ] Full-year 52×7 grid; cells colored by mood (gray = no entry)
- [ ] Hover tooltip: date, mood label, sentiment score
- [ ] Current day highlighted; month labels; color legend

**US-06 · Sentiment Trend Chart**
- [ ] Recharts LineChart: date × sentiment score
- [ ] 7-day rolling average overlay; mood emoji dot markers
- [ ] Time range selector: 7d / 30d / 90d / All
- [ ] Dashed zero-line reference; info callout for < 3 entries

**US-07 · Word Cloud**
- [ ] Stop words filtered; word size ∝ frequency; color ∝ avg sentiment
- [ ] Click word → filters entry list
- [ ] Requires ≥ 5 entries; placeholder otherwise
- [ ] Time range filter: 30d / 90d / All

### 3.4 Weekly Summary Report

**US-08 · Weekly Digest**
- [ ] Auto-generated for most recent Mon–Sun week
- [ ] Shows: dominant mood, avg sentiment, entry count, best/toughest day, top 3 words
- [ ] Mini mood distribution donut chart (Recharts)
- [ ] Prev/Next week navigation

### 3.5 Settings & Data Management

**US-09 · Data Portability**
- [ ] Export all entries as timestamped JSON
- [ ] Import JSON with validation; warn on existing data (merge vs. replace)

**US-10 · Clear Data**
- [ ] "Erase all data" requires typing "DELETE" to confirm
- [ ] Clears IndexedDB + Zustand state; redirects to dashboard

---

## 4. Information Architecture

```
/              → Dashboard (check-in CTA, streak, quick stats)
/history       → Entry list (search + mood filter)
/insights      → Tabs: #calendar · #trends · #wordcloud
/weekly        → Weekly digest report
/settings      → Export / Import / Clear data
```

---

## 5. Data Model

```typescript
// /src/types/mood.ts
export type MoodLevel = 1 | 2 | 3 | 4 | 5;
// 1=Rough 😞  2=Low 😔  3=Okay 😐  4=Good 😊  5=Great 😄

export interface MoodEntry {
  id: string;                        // uuid v4
  date: string;                      // "YYYY-MM-DD"
  timestamp: number;                 // Unix ms
  mood: MoodLevel;
  note: string;                      // max 500 chars
  sentimentScore: number | null;     // normalized −1.0 to 1.0
  sentimentComparative: number | null;
  divergenceFlag: boolean;
  createdAt: number;
  updatedAt: number;
}

export type NewEntryInput = Pick<MoodEntry, 'mood' | 'note'>;

// /src/lib/utils.ts
export const MOOD_META: Record<MoodLevel, {
  label: string; emoji: string; color: string;
  polarity: 'positive' | 'neutral' | 'negative'
}> = {
  5: { label: 'Great', emoji: '😄', color: 'var(--mood-great)', polarity: 'positive' },
  4: { label: 'Good',  emoji: '😊', color: 'var(--mood-good)',  polarity: 'positive' },
  3: { label: 'Okay',  emoji: '😐', color: 'var(--mood-okay)',  polarity: 'neutral'  },
  2: { label: 'Low',   emoji: '😔', color: 'var(--mood-low)',   polarity: 'negative' },
  1: { label: 'Rough', emoji: '😞', color: 'var(--mood-rough)', polarity: 'negative' },
};
```

---

## 6. File Structure

```
src/
├── types/mood.ts
├── lib/
│   ├── db.ts           # IndexedDB via idb
│   ├── sentiment.ts    # AFINN wrapper
│   └── utils.ts        # MOOD_META, date helpers, stop words
├── store/moodStore.ts  # Zustand CRUD store
├── components/
│   ├── layout/         # AppShell, NavBar
│   ├── checkin/        # CheckInModal, MoodSelector
│   ├── history/        # EntryList, EntryCard
│   ├── insights/       # CalendarHeatmap, SentimentTrend, WordCloud
│   └── weekly/         # WeeklyReport
├── pages/              # Dashboard, History, Insights, Weekly, Settings
├── App.tsx
└── main.tsx
```

---

## 7. Bonus / Stretch Goals

| Feature | Priority |
|---|---|
| Streak counter with 🔥 icon on dashboard | High |
| Dark mode toggle (persisted) | High |
| Keyboard shortcut to open check-in (`n`) | Medium |
| Weekly report PNG export (`html-to-image`) | Medium |
| PWA / installable offline (Vite PWA plugin) | Medium |
| Confetti on positive mood save (`canvas-confetti`) | Low |
| Animated mood selection (`framer-motion`) | Low |

---

## 8. Error Handling

| Scenario | Behavior |
|---|---|
| IndexedDB unavailable | localStorage fallback + persistent warning banner |
| Sentiment library fails | Save with `sentimentScore: null`; log silently |
| Import JSON malformed | Toast with specific validation messages |
| Storage quota exceeded | Toast: export + clear old entries |
| Duplicate entry same day | Open edit dialog rather than blocking |

---

## 9. UX Principles

- One primary action per screen — check-in CTA always reachable
- Optimistic UI — state updates immediately, IndexedDB writes async
- Empty states are instructional — never a blank screen
- WCAG AA contrast on all mood colors
- Responsive: 375px → 1440px

---

## 10. Build Phases

### Phase 1 — Bootstrap
1. `npm create vite@latest moodlog -- --template react-ts`
2. Install all tech stack dependencies
3. `tsconfig.json`: `"strict": true`
4. Init shadcn/ui (Zinc base, CSS variables on)
5. Add shadcn components: `button card dialog textarea badge tabs toast separator`
6. Tailwind mood color variables:
   ```css
   --mood-great: #22c55e;
   --mood-good:  #86efac;
   --mood-okay:  #fbbf24;
   --mood-low:   #fb923c;
   --mood-rough: #ef4444;
   ```
7. Scaffold file structure (empty placeholder exports)
8. Verify: `npm run dev` runs, `tsc --noEmit` passes
9. **Commit:** `chore: scaffold project with vite, react, shadcn, zustand`

### Phase 2 — Data Layer
1. `db.ts`: IndexedDB `moodlog_db` v1, store `mood_entries` (keyPath: `id`), indexes `by_date` (unique) + `by_timestamp`. Export: `getDB`, `getAllEntries`, `getEntryByDate`, `upsertEntry`, `deleteEntry`, `clearAllEntries`
2. `sentiment.ts`: wrap `sentiment` package → `analyzeSentiment(note)` returns normalized score via `Math.tanh`; empty string → `null`
3. `moodStore.ts`: Zustand store with `loadEntries`, `addEntry` (runs sentiment + divergence + uuid + IndexedDB), `updateEntry`, `deleteEntry`, `clearAll`
   - Divergence: `(mood >= 4 && score < -0.2) || (mood <= 2 && score > 0.2)`
4. **Commit:** `feat(data): indexeddb layer, sentiment engine, zustand store`

### Phase 3 — Check-in Flow
1. `MoodSelector.tsx`: 5 emoji buttons, keyboard accessible, clear selected state
2. `CheckInModal.tsx`: shadcn Dialog — date display, MoodSelector, Textarea (500 char + counter), Save button (disabled until mood selected); pre-populate if today's entry exists
3. `Dashboard.tsx`: greeting, streak counter, today's status, "Log Today" CTA
4. Wire success/error/fallback toasts
5. **Commit:** `feat(checkin): check-in modal with streak counter`

### Phase 4 — Entry History
1. `EntryCard.tsx`: date, mood, sentiment badge, note excerpt, ⚠️ divergence tooltip, edit/delete
2. `EntryList.tsx`: reverse-chron, search, mood filter, empty state
3. **Commit:** `feat(history): entry list with search, filter, edit, delete`

### Phase 5 — Visualizations
1. `CalendarHeatmap.tsx`: 52×7 SVG, mood-colored cells, hover tooltip, month labels, legend
2. `SentimentTrend.tsx`: LineChart, rolling avg, emoji markers, range selector, zero-line
3. `WordCloud.tsx`: d3-cloud, stop words filtered, click-to-filter, 150-word stoplist
4. Wire into `Insights.tsx` with shadcn Tabs
5. **Commit:** `feat(insights): calendar heatmap, sentiment trend, word cloud`

### Phase 6 — Weekly Report
1. `WeeklyReport.tsx`: Mon–Sun navigator, stats, top 3 words, donut chart
2. **Commit:** `feat(weekly): weekly digest with mood distribution chart`

### Phase 7 — Polish & Settings
1. Settings page: JSON export/import, "Erase All Data" (type DELETE)
2. Dark mode toggle (Tailwind `dark:`, persisted to localStorage)
3. Responsive pass: 375px, 768px, 1280px
4. `tsc --noEmit` — zero errors; `npm run build` — zero warnings
5. **Commit:** `feat(settings): export/import/clear, dark mode, responsive polish`

---

## 11. Quality Gates (before every commit)
- [ ] `tsc --noEmit` passes — zero errors, zero `any` types
- [ ] `npm run dev` — no console errors
- [ ] All interactive elements keyboard accessible
- [ ] Zustand is the single source of truth

---

## 12. Git Workflow

```bash
# Worktrees per feature vertical
git worktree add ../moodlens-feat-logging        feat/mood-logging
git worktree add ../moodlens-feat-sentiment      feat/sentiment-engine
git worktree add ../moodlens-feat-visualizations feat/visualizations
git worktree add ../moodlens-feat-weekly         feat/weekly-report

# Commit convention examples
feat(logging): add daily check-in modal with mood selector
feat(sentiment): integrate AFINN scoring with divergence detection
feat(viz): implement calendar heatmap with recharts
fix(storage): handle IndexedDB quota exceeded gracefully
chore(deps): add idb, sentiment, d3-cloud packages
```

**Session hygiene:**
- No `.env` files — no secrets in this app
- No raw code dumps in Claude prompts — reference file paths, describe behavior
- PRs squash-merged to main with a single descriptive commit
