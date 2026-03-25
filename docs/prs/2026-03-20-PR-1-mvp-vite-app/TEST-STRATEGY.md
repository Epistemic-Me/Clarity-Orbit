# PR #1: MVP Vite App — Test Strategy

**Created**: 2026-03-20
**Based on**: [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md)

## Acceptance Criteria

| ID | Criteria | Priority |
|----|----------|----------|
| AC1 | App builds and runs without errors | Must |
| AC2 | All 10 opportunities render in correct ring groups | Must |
| AC3 | Number inputs work (type, arrows, shift+arrows, tab, enter) | Must |
| AC4 | Auto-balance redistributes outer→middle→inner when over capacity | Must |
| AC5 | Plan ↔ Actuals toggle maintains independent data | Must |
| AC6 | Data persists in localStorage across refresh | Must |
| AC7 | Week navigation with auto-fill from previous week | Must |
| AC8 | Lock In generates summary and copies to clipboard | Must |
| AC9 | Team add/remove/edit works and propagates to all weeks | Must |
| AC10 | Opportunity add/remove/edit works and propagates to all weeks | Must |
| AC11 | Quick command bar executes `robert +5 builder` correctly | Should |
| AC12 | Export copies CSV to clipboard | Should |
| AC13 | Projections show on-track/late against target dates | Should |
| AC14 | Sparklines and deltas render correctly | Should |
| AC15 | Deploys to Vercel | Must |

## Test Matrix

| Test ID | Test Case | AC | Pass Criteria |
|---------|-----------|-----|---------------|
| T1 | `npm run build` | AC1 | Exit 0, zero TS errors |
| T2 | Load app, verify 10 opportunities in 3 ring groups | AC2 | Inner: 2, Middle: 2, Outer: 6 |
| T3 | Click input, type number, verify total updates | AC3 | Row total = sum of inputs |
| T4 | Arrow up in full-capacity column | AC4 | Outer ring allocations decrease |
| T5 | Toggle to Actuals, enter data, toggle back to Plan | AC5 | Plan data unchanged |
| T6 | Enter data, refresh browser | AC6 | All data restored |
| T7 | Navigate to week 2 (empty), verify auto-filled | AC7 | Week 2 = week 1's plan |
| T8 | Click Lock In, check clipboard | AC8 | Summary text in clipboard |
| T9 | Open team editor, add "Designer", verify column appears | AC9 | New column in table |
| T10 | Open opp editor, add "New Client", verify row appears | AC10 | New row in outer ring |
| T11 | Press /, type "robert +5 builder", verify | AC11 | Builder Robert += 5 |
| T12 | Click Export, paste into text editor | AC12 | Valid CSV with headers |
| T13 | Set Builder hours to 1, check projection | AC13 | Shows "170wk (X late)" |
| T14 | Navigate weeks, check sparklines update | AC14 | Mini charts visible |
| T15 | Push to Vercel, load production URL | AC15 | App loads and functions |

## Test Execution Order

1. T1 — Build gate
2. T2-T3 — Core rendering and input
3. T4 — Constraint engine
4. T5-T7 — Data management
5. T8, T12 — Export/Lock In
6. T9-T10 — Configuration
7. T11 — Quick commands
8. T13-T14 — Projections and trends
9. T15 — Deployment

## Definition of Done

- [ ] All "Must" acceptance criteria pass
- [ ] `npm run build` produces zero errors
- [ ] App is live on Vercel
- [ ] Tested in a simulated weekly meeting flow (plan → adjust → lock in)
