# PR #1: MVP Vite App — Implementation Plan

**Created**: 2026-03-20
**Based on**: [RESEARCH.md](./RESEARCH.md)
**Design Source**: Magic Patterns artifact `ca031a64-f419-481a-81a0-076995ae0561`

## Chosen Approach

Port the 10-file Magic Patterns design to a production Vite + React + TypeScript app. The Magic Patterns code is the spec — adapt it for production quality (proper TypeScript, clean imports, tested) while preserving the exact UX.

## Scope

### In Scope
- Vite + React 18 + TypeScript project scaffolding
- All 10 source files ported from Magic Patterns
- Tailwind CSS v3 with Clarity brand tokens
- localStorage persistence via `usePersistedState` hook
- Constraint engine with auto-balance
- Plan ↔ Actuals toggle
- Dynamic team roster (add/remove/edit members)
- Configurable opportunities (add/remove/edit, change ring)
- Quick command bar (`/` shortcut)
- Keyboard shortcuts (Arrow ±1, Shift+Arrow ±5, Tab, Enter, Escape)
- Lock In with clipboard copy
- CSV export
- Ring health gauge in header
- Demand gen funnel inline row
- Week-over-week deltas and 4-week sparklines
- Target date projections (on track ✓ / late)
- Vercel deployment config

### Out of Scope (Phase 2+)
- Linear API integration for actuals
- Multi-user real-time sync
- Backend / database
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
| `src/lib/types.ts` | Port | Core TypeScript interfaces |
| `src/lib/data.ts` | Port | Default data, utilities, CSV export |
| `src/lib/hooks.ts` | Port | usePersistedState, useAnimatedNumber |
| `src/lib/constraintEngine.ts` | Port | Auto-balance redistribution algorithm |
| `src/components/AllocationTable.tsx` | Port | Main table (largest component) |
| `src/components/RingHealthGauge.tsx` | Port | Header arc visualization |
| `vercel.json` | Create | Deployment config |
| `.gitignore` | Create | Standard Vite gitignore |

## Step-by-Step Implementation

### Step 1: Scaffold Vite Project
```bash
npm create vite@latest . -- --template react-ts
npm install tailwindcss postcss autoprefixer lucide-react
npx tailwindcss init -p
```

### Step 2: Port Foundation Files
- `tailwind.config.js` — add forest/blossom colors, Poppins/JetBrains Mono fonts
- `src/index.css` — Tailwind imports, CSS vars, animations (cellFlash, fadeOut)
- `src/lib/types.ts` — TeamMember, Opportunity, Allocation, WeekData, CellKey, AllocMode

### Step 3: Port Data Layer
- `src/lib/data.ts` — DEFAULT_TEAM, DEFAULT_OPPORTUNITIES, makeWeeks(), autoFillWeek(), generateLockSummary(), parseQuickCommand(), exportWeekCSV(), addMemberToWeeks(), removeMemberFromWeeks(), addOppToWeeks(), removeOppFromWeeks()
- `src/lib/hooks.ts` — usePersistedState (localStorage), useAnimatedNumber (easeOutExpo), usePrevious
- `src/lib/constraintEngine.ts` — redistributeAllocations(), getPersonSummary()

### Step 4: Port Components
- `src/components/RingHealthGauge.tsx` — concentric arc SVG, Forest Green glow when platform > 60%
- `src/components/AllocationTable.tsx` — the main component (~500 lines), includes:
  - Ring-grouped rows with colored separators and tinted backgrounds
  - Number inputs with flash animations for auto-adjusted cells
  - Person header popovers with ring breakdown
  - Plan ↔ Actuals segmented toggle
  - Auto-balance toggle
  - Quick command bar (dark terminal style)
  - Demand gen funnel inline row
  - Editable capacity meters
  - Team editor popover
  - Opportunity editor popover
  - Sparklines and delta badges
  - Ring distribution bar with spring animation
  - Milestone progress bars

### Step 5: Wire App Shell
- `src/App.tsx` — all state via usePersistedState, constraint engine integration, week navigation, Lock In, Export, Copy Last Week, toast notifications

### Step 6: Deploy
- Add `vercel.json` for SPA routing
- Deploy to Vercel

## Verification Checklist

- [ ] `npm run build` — zero TypeScript errors
- [ ] `npm run dev` — app loads on localhost:5173
- [ ] All 10 opportunities render in correct rings
- [ ] Number inputs accept typing, arrow keys, shift+arrow
- [ ] Auto-balance redistributes outer ring first when over capacity
- [ ] Plan ↔ Actuals toggle shows independent data
- [ ] Data persists across browser refresh
- [ ] Week navigation works with auto-fill
- [ ] Lock In generates summary and copies to clipboard
- [ ] Export copies CSV to clipboard
- [ ] Team editor: add/remove/rename members works
- [ ] Opportunity editor: add/remove/change ring works
- [ ] Quick command bar: `robert +5 builder` executes correctly
- [ ] Mystica Maintenance shows warning at >2h
- [ ] Sparklines render for weeks with data
- [ ] Deltas show +/- compared to previous week
- [ ] Projections show ✓ or "X late" against target dates
- [ ] Vercel deployment succeeds

## Rollback Plan

Delete the entire repo. This is a greenfield project with no dependencies.
