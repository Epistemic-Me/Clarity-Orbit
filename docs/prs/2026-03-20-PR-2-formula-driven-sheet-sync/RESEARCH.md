# PR #2: Formula-Driven Sheet + Full 2-Way Sync - Research

**Created**: 2026-03-20
**Author**: @robertta

## Requirements Analysis

**Source**: PR #1 build session — identified that financial model formulas were lost when porting from Excel to Google Sheets (written as static values), and that Orbit weekly allocations don't flow back into the Resource Allocation tab.

### Core Requirements
1. All 11 financial model tabs must have dynamic formulas (not static values)
2. Input cells (blue) vs formula cells (gray) must be visually distinct
3. Orbit weekly allocations should flow into the Resource Allocation tab
4. Sheet edits should be reflected in the Orbit app

## Current State Analysis

See [HANDOFF.md](./HANDOFF.md) for complete current state including:
- Which tabs have formulas (3 of 11)
- Which tabs need formulas (6 of 11, 2 are empty/future)
- Current sync architecture
- All IDs and URLs

## Implementation Gap Analysis

- **6 tabs** need formula rebuilds (LRP, IRR, LTV, Resource Allocation, Expense Detail, Runway & KPIs)
- **Apps Script** needs 2 new functions: write-back to Resource Allocation, load Resource Allocation into Orbit
- **Vite app** needs a refresh mechanism to pull Sheet changes

## Dependencies and Risks

- Excel file must be available as formula reference
- Google Workspace MCP must be connected for sheet modifications
- Apps Script redeployment requires manual step (Deploy → New Version in editor)
- Risk: circular references if Resource Allocation formulas reference Orbit tabs that reference RA

## Open Questions

- [ ] Should Resource Allocation % update automatically from Orbit weekly hours, or should users set % manually?
- [ ] How often should Orbit poll the Sheet for changes? (On focus? Every 60s? Manual button?)
- [ ] Should the Expense Detail tab reference the P&L COGS rows, or be independent inputs?
