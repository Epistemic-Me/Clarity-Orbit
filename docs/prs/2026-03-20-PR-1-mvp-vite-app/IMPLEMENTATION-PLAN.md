# PR #1: MVP Vite App — Implementation Plan

**Created**: 2026-03-20
**Updated**: 2026-03-20 (storage architecture revision)
**Based on**: [RESEARCH.md](./RESEARCH.md)
**Design Source**: Magic Patterns artifact `ca031a64-f419-481a-81a0-076995ae0561`

## Chosen Approach

Port the 10-file Magic Patterns design to a production Vite + React + TypeScript app with a **dual storage architecture**:

1. **Google Sheet** = live backend (both founders see the same data, natural financial model bridge)
2. **GitHub repo JSON** = versioned audit trail (traceability, history, diff-able over time)
3. **localStorage** = cache layer (fast UX, offline resilience)

## Storage Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Clarity Orbit App (Vite + React)                        │
│                                                          │
│  ┌──────────────┐    ┌──────────────┐                    │
│  │ localStorage │←──→│ StorageProvider                   │
│  │ (cache)      │    │ interface     │                   │
│  └──────────────┘    └──────┬───────┘                    │
│                             │                            │
└─────────────────────────────┼────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
         ┌──────────────────┐  ┌──────────────────┐
         │ Google Sheet      │  │ GitHub Repo       │
         │ (live backend)    │  │ (versioned JSON)  │
         │                   │  │                   │
         │ Tab: Team         │  │ data/             │
         │ Tab: Opportunities│  │   orbit-state.json│
         │ Tab: Week 3/16    │  │   history/        │
         │ Tab: Week 3/23    │  │     2026-W12.json │
         │ Tab: ...          │  │     2026-W13.json │
         │ Tab: Lock In Log  │  │     ...           │
         └──────────────────┘  └──────────────────┘
              ↕                       ↕
         Both founders            git log = full
         see same data            allocation history
```

### Data Flow

**On app load:**
1. Read localStorage cache (instant render)
2. Fetch from Google Sheet in background
3. If Sheet data is newer → update local state + localStorage
4. If localStorage is newer (offline edits) → prompt to sync upstream

**On every state change:**
1. Update React state (instant UI)
2. Write to localStorage (instant persistence)
3. Debounced write to Google Sheet (500ms, batched)

**On Lock In:**
1. Write final week state to Google Sheet
2. Append to Lock In Log tab
3. Copy summary to clipboard
4. Trigger GitHub Action to snapshot `orbit-state.json` (or manual commit via CLI)

**Weekly (automated or manual):**
1. Export current `orbit-state.json` to `data/history/2026-WXX.json`
2. Commit to repo → full git history of every week's allocation decisions

### Google Sheet Structure

```
Sheet: "Clarity Orbit"
├── Tab: "Config:Team"
│   │ id        │ name     │ capacity │ rate │
│   │ robert    │ Robert   │ 50       │ 150  │
│   │ jonathan  │ Jonathan │ 50       │ 150  │
│
├── Tab: "Config:Opportunities"
│   │ id    │ name              │ ring   │ isApi │ milestone_done │ milestone_total │ targetDate │ capPerWeek │
│   │ opp-1 │ Dayforce/Surveys+ │ middle │ TRUE  │ 40             │ 340             │ 2026-07-01 │            │
│   │ opp-5 │ Mystica—Maint     │ outer  │ FALSE │                │                 │            │ 2          │
│
├── Tab: "Week:3/16"
│   │ oppId │ robert_plan │ jonathan_plan │ qa_plan │ robert_actual │ jonathan_actual │ qa_actual │
│   │ opp-1 │ 10          │ 15            │ 5       │ 12            │ 14              │ 5         │
│
├── Tab: "Week:3/23"
│   │ (same structure)
│
├── Tab: "DemandGen"
│   │ weekId │ hours │ visitors │ leads │ pipeline │
│   │ w-0    │ 5     │ 1240     │ 14    │ 45000    │
│
└── Tab: "LockInLog"
    │ weekLabel │ timestamp           │ summary                                          │
    │ 3/16      │ 2026-03-16T10:30:00 │ Week of 3/16: +5h Builder, -3h Maint. Platform 68%. │
```

### StorageProvider Interface

```typescript
interface OrbitState {
  team: TeamMember[]
  opportunities: Opportunity[]
  weeks: WeekData[]
  settings: { autoBalance: boolean; mode: AllocMode }
}

interface StorageProvider {
  load(): Promise<OrbitState>
  save(state: OrbitState): Promise<void>
  saveWeek(weekId: string, data: WeekData): Promise<void>
  appendLockIn(weekLabel: string, summary: string): Promise<void>
}

class LocalStorageProvider implements StorageProvider { ... }
class GoogleSheetProvider implements StorageProvider { ... }
class CompositeProvider implements StorageProvider {
  // Reads from cache first, syncs with Sheet in background
  // Writes to both simultaneously
}
```

### GitHub JSON Snapshot

```json
// data/orbit-state.json (current state, always up to date)
{
  "version": 1,
  "exportedAt": "2026-03-20T10:30:00Z",
  "team": [...],
  "opportunities": [...],
  "weeks": [...],
  "settings": { "autoBalance": true, "mode": "plan" }
}

// data/history/2026-W12.json (locked-in week snapshot)
{
  "weekId": "w-0",
  "label": "3/16",
  "lockedAt": "2026-03-16T10:30:00Z",
  "summary": "Week of 3/16: ...",
  "allocations": { ... },
  "demandGen": { ... }
}
```

## Scope

### In Scope
- Vite + React 18 + TypeScript project scaffolding
- All 10 source files ported from Magic Patterns
- Tailwind CSS v3 with Clarity brand tokens
- **StorageProvider abstraction** with LocalStorage + GoogleSheet + Composite implementations
- **Google Sheet integration** via Google Sheets API (create sheet, read/write tabs)
- **GitHub JSON snapshots** — `data/orbit-state.json` + `data/history/` weekly snapshots
- Constraint engine with auto-balance
- Plan ↔ Actuals toggle
- Dynamic team roster (add/remove/edit members)
- Configurable opportunities (add/remove/edit, change ring)
- Quick command bar (`/` shortcut)
- Keyboard shortcuts (Arrow ±1, Shift+Arrow ±5, Tab, Enter, Escape)
- Lock In with clipboard copy + Sheet + JSON snapshot
- CSV export
- Ring health gauge in header
- Demand gen funnel inline row
- Week-over-week deltas and 4-week sparklines
- Target date projections (on track ✓ / late)
- Sync status indicator ("Saved 2s ago" / "Syncing..." / "Offline")
- Vercel deployment config

### Out of Scope (Phase 2+)
- Linear API integration for actuals
- Real-time multi-user cursors
- Mobile-optimized layout
- Week comparison view
- Dark mode

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `package.json` | Create | Dependencies: react, vite, tailwind, lucide-react |
| `tsconfig.json` | Create | TypeScript config |
| `vite.config.ts` | Create | Vite build config |
| `tailwind.config.js` | Port | Brand colors (forest, forest-light, blossom) |
| `index.html` | Create | Entry HTML |
| `src/main.tsx` | Create | React entry point |
| `src/index.css` | Port | Poppins + JetBrains Mono, CSS vars, animations |
| `src/App.tsx` | Port | Main app shell, state management, header |
| `src/lib/types.ts` | Port + Extend | Core types + OrbitState + StorageProvider interface |
| `src/lib/data.ts` | Port | Default data, utilities, CSV export |
| `src/lib/hooks.ts` | Port + Extend | usePersistedState, useAnimatedNumber, useSyncStatus |
| `src/lib/constraintEngine.ts` | Port | Auto-balance redistribution algorithm |
| `src/lib/storage/index.ts` | Create | StorageProvider interface + CompositeProvider |
| `src/lib/storage/localStorage.ts` | Create | LocalStorageProvider implementation |
| `src/lib/storage/googleSheets.ts` | Create | GoogleSheetProvider implementation |
| `src/lib/storage/jsonExport.ts` | Create | JSON snapshot utilities for GitHub |
| `src/components/AllocationTable.tsx` | Port | Main table (largest component) |
| `src/components/RingHealthGauge.tsx` | Port | Header arc visualization |
| `src/components/SyncStatus.tsx` | Create | "Saved 2s ago" / "Syncing..." indicator |
| `data/orbit-state.json` | Create | Current state snapshot (committed to repo) |
| `data/history/.gitkeep` | Create | Weekly snapshots directory |
| `vercel.json` | Create | Deployment config |
| `.gitignore` | Create | Standard Vite gitignore (excludes node_modules, NOT data/) |
| `scripts/snapshot.sh` | Create | CLI script to export state → commit to repo |

## Step-by-Step Implementation

### Step 1: Scaffold Vite Project
```bash
npm create vite@latest . -- --template react-ts
npm install tailwindcss postcss autoprefixer lucide-react
npx tailwindcss init -p
```

### Step 2: Port Foundation Files
- `tailwind.config.js` — brand colors, fonts
- `src/index.css` — Tailwind imports, CSS vars, animations
- `src/lib/types.ts` — all types + `OrbitState` + `StorageProvider` interface

### Step 3: Build Storage Layer
- `src/lib/storage/index.ts` — StorageProvider interface, CompositeProvider
- `src/lib/storage/localStorage.ts` — read/write `clarity-orbit:*` keys
- `src/lib/storage/googleSheets.ts` — Google Sheets API integration:
  - Create sheet with tabs on first run
  - Read config tabs (Team, Opportunities) on load
  - Read/write week tabs on navigate/change
  - Append to LockInLog on Lock In
  - Debounced writes (500ms) to avoid API rate limits
- `src/lib/storage/jsonExport.ts` — serialize OrbitState to JSON, download helper
- `src/lib/hooks.ts` — usePersistedState (localStorage cache), useAnimatedNumber, useSyncStatus

### Step 4: Port Data Layer
- `src/lib/data.ts` — defaults, week generation, utilities
- `src/lib/constraintEngine.ts` — auto-balance algorithm

### Step 5: Port Components
- `src/components/RingHealthGauge.tsx` — header arc SVG
- `src/components/SyncStatus.tsx` — small footer indicator
- `src/components/AllocationTable.tsx` — main table with all interactions

### Step 6: Wire App Shell
- `src/App.tsx` — CompositeProvider init, state management, header, toast
- On load: localStorage → render → Sheet sync in background
- On change: state → localStorage → debounced Sheet write
- On Lock In: Sheet + clipboard + trigger snapshot

### Step 7: Set Up Google Sheet
- Create "Clarity Orbit" Google Sheet manually (or via MCP)
- Set up tabs per the schema above
- Store Sheet ID in env var / app config
- Test read/write cycle

### Step 8: Set Up GitHub Snapshots
- Create `data/` directory with initial `orbit-state.json`
- Create `scripts/snapshot.sh` that exports current state and commits
- Document the weekly snapshot workflow

### Step 9: Deploy
- Add `vercel.json` for SPA routing
- Set env vars (Google Sheet ID, API credentials)
- Deploy to Vercel

## Verification Checklist

- [ ] `npm run build` — zero TypeScript errors
- [ ] `npm run dev` — app loads on localhost:5173
- [ ] All 10 opportunities render in correct rings
- [ ] Number inputs accept typing, arrow keys, shift+arrow
- [ ] Auto-balance redistributes outer ring first when over capacity
- [ ] Plan ↔ Actuals toggle shows independent data
- [ ] **localStorage cache works** — data survives browser refresh
- [ ] **Google Sheet sync** — changes appear in Sheet within 1s
- [ ] **Both founders see same data** — open on two browsers, verify sync
- [ ] **Sync status indicator** — shows "Saved", "Syncing...", or "Offline"
- [ ] Week navigation works with auto-fill
- [ ] Lock In generates summary, copies to clipboard, writes to Sheet
- [ ] Export copies CSV to clipboard
- [ ] Team editor: add/remove/rename members → reflected in Sheet
- [ ] Opportunity editor: add/remove/change ring → reflected in Sheet
- [ ] Quick command bar: `robert +5 builder` executes correctly
- [ ] Mystica Maintenance shows warning at >2h
- [ ] Sparklines render for weeks with data
- [ ] Deltas show +/- compared to previous week
- [ ] Projections show ✓ or "X late" against target dates
- [ ] `data/orbit-state.json` — valid JSON, committed to repo
- [ ] `scripts/snapshot.sh` — exports and commits weekly snapshot
- [ ] Vercel deployment succeeds

## Rollback Plan

Delete the repo contents. Google Sheet persists independently as backup.
