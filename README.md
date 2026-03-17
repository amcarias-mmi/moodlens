# MoodLens

A fully client-side mood journaling app with sentiment analysis, data visualizations, and weekly digest reports. Zero backend — everything lives in your browser's IndexedDB.

---

## Features

| Feature | Details |
|---|---|
| **Daily Check-in** | Log mood (5 levels) + optional note (500 chars) |
| **Sentiment Analysis** | AFINN-based NLP, normalized −1 → +1 score per entry |
| **Divergence Detection** | Flags when note sentiment contradicts selected mood |
| **Entry History** | Search, mood filter, edit, delete with timeline grouping |
| **Calendar Heatmap** | Full-year 53×7 SVG grid colored by mood |
| **Sentiment Trend** | Recharts line chart with 7-day rolling average + emoji dots |
| **Word Cloud** | d3-cloud word cloud, click-to-filter, sentiment-colored |
| **Weekly Digest** | Mon–Sun donut chart, best/toughest day, top words, week navigation |
| **Dark Mode** | Persisted to localStorage, toggled from NavBar |
| **Export / Import** | JSON export & validated import (merge or replace) |
| **Erase All Data** | Requires typing `DELETE` to confirm |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript (strict mode) |
| Build | Vite 6 |
| State | Zustand |
| Storage | IndexedDB via `idb` |
| Styling | Tailwind CSS v3 + shadcn/ui |
| Sentiment | `sentiment` (AFINN lexicon) |
| Charts | Recharts |
| Word Cloud | d3-cloud |
| Animations | Framer Motion |
| Routing | React Router v7 |
| Fonts | Cormorant (display) + Outfit (UI) — Google Fonts |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Type-check
npx tsc -p tsconfig.app.json --noEmit

# Production build
npm run build
```

### Seed demo data (dev only)

Open the browser console on `http://localhost:5173` and run:

```js
__seed()
```

Then hard-refresh. This populates 14 entries across two weeks.

---

## Project Structure

```
src/
├── types/mood.ts          # MoodEntry, MoodLevel types
├── lib/
│   ├── db.ts              # IndexedDB layer (idb)
│   ├── sentiment.ts       # AFINN wrapper → normalized score
│   ├── utils.ts           # MOOD_META, date helpers, extractTopWords
│   ├── streak.ts          # Streak counter + greeting
│   ├── cn.ts              # Tailwind class merge helper
│   └── seedData.ts        # Dev-only seed utility (window.__seed)
├── store/
│   ├── moodStore.ts       # Zustand CRUD store (optimistic + IndexedDB)
│   └── themeStore.ts      # Dark mode Zustand store
├── components/
│   ├── layout/            # AppShell, NavBar
│   ├── checkin/           # CheckInModal, MoodSelector
│   ├── history/           # EntryList, EntryCard
│   ├── insights/          # CalendarHeatmap, SentimentTrend, WordCloud
│   ├── weekly/            # WeeklyReport
│   └── ui/                # shadcn/ui primitives
├── pages/                 # Dashboard, History, Insights, Weekly, Settings
├── App.tsx
└── main.tsx
```

---

## Routes

| Path | Page |
|---|---|
| `/` | Dashboard — streak, today's check-in CTA |
| `/history` | Entry list — search, filter, edit, delete |
| `/insights` | Tabs: `#calendar` · `#trends` · `#wordcloud` |
| `/weekly` | Weekly digest report |
| `/settings` | Export / Import / Erase / Dark mode |

---

## Privacy

All data is stored locally in your browser's IndexedDB. No network requests are made (except Google Fonts on load). No accounts, no sync, no telemetry.
