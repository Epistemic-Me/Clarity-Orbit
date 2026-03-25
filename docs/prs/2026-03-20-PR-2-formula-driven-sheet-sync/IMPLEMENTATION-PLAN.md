# PR #2: Formula-Driven Sheet + Full 2-Way Sync - Implementation Plan

**Created**: 2026-03-20
**Based on**: [RESEARCH.md](./RESEARCH.md) and [HANDOFF.md](./HANDOFF.md)

## Chosen Approach

{To be filled after research in next session}

## Scope

### In Scope
- Rebuild formulas for LRP, IRR, LTV, Resource Allocation, Expense Detail, Runway & KPIs tabs
- Apply blue/gray/green color coding to all tabs
- Apps Script: saveWeek → update Resource Allocation tab
- Orbit app: refresh from Sheet capability

### Out of Scope
- Balance Sheet (empty, not priority)
- Pipeline ↔ Orbit opportunity mapping
- Real-time multi-user sync

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| Google Sheet (6 tabs) | Rebuild | Formula-driven calculations |
| Google Sheet (all tabs) | Format | Blue inputs, gray formulas, green summaries |
| Apps Script Code.gs | Update | Add RA write-back on saveWeek |
| src/lib/sheetSync.ts | Update | Add refresh/polling |
| src/App.tsx | Update | Add refresh button or auto-refresh |

## Verification Checklist

- [ ] All formula tabs calculate correctly (compare against Excel values)
- [ ] Blue/gray/green formatting consistent across all 15 tabs
- [ ] Change Orbit allocation → Resource Allocation tab updates
- [ ] Edit Sheet directly → Orbit reflects changes on refresh
- [ ] No circular references
- [ ] Apps Script redeployed and tested

## Rollback Plan

Revert to static values from the Excel export. Orbit sync unaffected (different tabs).
