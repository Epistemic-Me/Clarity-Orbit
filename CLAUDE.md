# CLAUDE.md

## Project Overview

**Clarity Orbit** is a weekly ROI investment tracker for startup founders. It's a dog food product from the Clarity ecosystem — used by Epistemic Me's co-founders in their weekly planning meeting to allocate time across opportunities and track projected returns.

## Tech Stack

- **Framework**: Vite + React 18 + TypeScript
- **Styling**: Tailwind CSS v3
- **Fonts**: Poppins (text) + JetBrains Mono (numbers)
- **Storage**: localStorage (Phase 1), Linear API integration (Phase 2)
- **Deployment**: Vercel

## Brand

Follows Clarity brand guidelines:
- **Primary**: Forest Green `#6b785e`
- **Secondary**: Lighter Green `#95a888`
- **Accent**: Royal Blossom `#950952`
- **Background**: Warm off-white `#fdfcf9`

## Development

```bash
npm install
npm run dev      # localhost:5173
npm run build    # production build
npm run preview  # preview production build
```

## Architecture

Single-page app, single-screen design (no scrolling on 1440x900).

Key modules:
- `src/lib/types.ts` — Core types (TeamMember, Opportunity, Allocation, WeekData)
- `src/lib/data.ts` — Default data, week generation, export utilities
- `src/lib/constraintEngine.ts` — Auto-balance redistribution algorithm
- `src/lib/hooks.ts` — usePersistedState (localStorage), useAnimatedNumber
- `src/components/AllocationTable.tsx` — Main table with all interactions
- `src/components/RingHealthGauge.tsx` — Header arc visualization

## Design Reference

Magic Patterns design: https://www.magicpatterns.com/c/iutywzsbzqlueqndkk2xna
Live preview: https://project-brilliant-parrot-971.magicpatterns.app

## Git Workflow

Always use feature branches + PRs. Never push directly to main.
