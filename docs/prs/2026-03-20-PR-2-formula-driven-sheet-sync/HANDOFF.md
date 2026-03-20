# PR #2: Formula-Driven Sheet + Full 2-Way Sync — Handoff

**Created**: 2026-03-20
**From Session**: Clarity Orbit MVP build (6+ hours)
**For**: Next Claude Code session to research and plan implementation

---

## Context: What Was Built Today

### Clarity Orbit App (PR #1 — complete, deployed)
- **Live**: https://clarity-orbit.vercel.app
- **Repo**: https://github.com/Epistemic-Me/Clarity-Orbit (branch: `feature/pr-1-mvp-vite-app`)
- **Stack**: Vite + React 18 + TypeScript + Tailwind v4
- Single-screen weekly allocation table with constraint engine, auto-balance, keyboard shortcuts, command bar, sparklines, deltas, projections, Lock In, export
- localStorage + Google Sheet sync via Apps Script

### Financial Model Google Sheet (single source of truth)
- **Sheet**: https://docs.google.com/spreadsheets/d/1mUh7a0AwH8t4U1eEJTVatbBsAujAh0pnQH8zAQ6-e6s
- **15 tabs total**: 11 financial model tabs + 4 Orbit tabs (Orbit:Team, Orbit:Opportunities, Orbit:DemandGen, Orbit:LockInLog)
- **Apps Script**: https://script.google.com/d/1Ea2gdGOSDr534PmA55NZ_GPEwHgcVJ5frcC-fVNjKTljDWP0x-S8a3f2/edit
- **Deployment URL**: https://script.google.com/macros/s/AKfycbzo5ibJwW6izmRNWkyOzd-nZLIjmIWrLyvERjMBi7xs7LQMaPQsfK1UtBgWYFukjlCw/exec

### Original Excel Model (reference for formulas)
- **File**: `/Users/rbtna/Downloads/Epistemic Me - Financial Model UPDATED 20260319 2.xlsx`
- This is the canonical reference for what formulas should exist. The Google Sheet was populated from this but many formulas were lost (written as static values).

---

## What's Formula-Driven Now (done in this session)

| Tab | Status | Formulas |
|-----|--------|----------|
| **Monthly P&L** | ✅ Complete | TOTAL PLATFORM/SERVICES/REF DESIGN = SUM of line items. Payment Processing = Revenue × 3%. TOTAL COGS = SUM. GROSS PROFIT = Revenue - COGS. Gross Margin % = GP/Revenue. TOTAL OPEX = SUM. NET INCOME = GP - OPEX. CUMULATIVE = running sum. Revenue Mix % = segment/total. Monthly Burn = COGS + OPEX. YTD Total = SUM across months. |
| **Cash Flow Waterfall** | ✅ Complete | Dayforce collections lagged Net-30 (references P&L row 12, offset 1 month). Mystica/Agency = same month (references P&L rows 13+14+15). Sprint Zero = same month (P&L row 16). TOTAL CASH IN = SUM. TOTAL CASH OUT = P&L COGS + OPEX. NET CASH FLOW = In - Out. ENDING BALANCE = Starting + Net. Starting Balance = prior month's Ending. MONTHS OF RUNWAY = Balance / Cash Out. |
| **Sales Pipeline** | ✅ Complete | Annual $ = Monthly × 12. Weighted $ = Annual × Probability. Total Pipeline = SUM(Annual). Weighted Pipeline = SUM(Weighted). Closed Won = SUMPRODUCT where prob=1. |

## What Was Rebuilt With Formulas (COMPLETED in this session)

### LRP (5-Year) — ✅ DONE
**Reference**: Excel rows 22-39
- `PEPM Gross Revenue` = Rate × Customers × Avg Employees × 12 (row 24)
- `PEPM Profit Share` = PEPM Gross × Profit Share % (row 25)
- `Total Platform Revenue` = SUM of PEPM lines (row 26)
- `Mystica Retainer (annual)` = Monthly × 12 (row 30)
- `Mystica Profit Share (annual)` = Monthly × 12 (row 31)
- `Other Agency Retainers (annual)` = # Retainers × Avg Monthly × 12 (row 32)
- `Sprint Zero Revenue` = # per year × Avg Price (row 33)
- `Total Services Revenue` = SUM (row 34)
- `TOTAL REVENUE` = Platform + Services (row 36)
- `Revenue Mix %` = segment / total (rows 38-39)
- **All assumption cells (rows 7-20) are INPUTS; all revenue cells (rows 22-39) are FORMULAS**

### IRR by Channel — ✅ DONE
- `Total Investment` = Hours × Blended Rate (row 7)
- `Simple ROI` = Annual Revenue / Investment (row 11)
- Hours, Rate, Monthly Revenue, Annual Revenue are INPUTS

### LTV Model — ✅ DONE
- `Monthly Gross Profit` = Revenue - COGS (row 14)
- `Gross Margin %` = GP / Revenue (row 15)
- `Simple LTV` = GP × Lifetime (row 16)
- `Total Acquisition Cost` = CAC + Onboarding (row 17)
- `LTV / CAC Ratio` = LTV / TAC (row 18)
- `CAC Payback` = TAC / GP (row 19)
- `Churn-Adjusted LTV` = GP / Churn Rate (row 20)
- All unit economics assumptions (rows 5-11) are INPUTS

### Resource Allocation — ✅ DONE
- `Robert Hours` = Robert % × Robert Monthly Hours (row 18)
- `Jonathan Hours` = Jonathan % × Jonathan Monthly Hours (row 19)
- `QA Hours` = QA % × QA Monthly Hours (row 20)
- `TOTAL HOURS` per bucket = SUM of person hours (row 21)
- Aggregate view: `Hours/Mo` = SUM of relevant buckets (rows 25-27)
- `% of Total` = Hours / Total Hours
- `Gap` = % of Total - Target %
- `Months to Milestone` = Hours to Milestone / Monthly Hours allocated
- Percentage cells (rows 13-15) are INPUTS; hours and aggregates are FORMULAS

### Expense Detail — ✅ DONE
- `Total Personnel` = SUM of personnel rows (row 10)
- `Total Tooling` = SUM of tooling rows (row 22)
- `TOTAL MONTHLY EXPENSES` = Personnel + Tooling (row 24)
- `Annual Total` column = SUM across months
- Individual line items are INPUTS

### Runway & KPIs — ✅ DONE
- `MONTHS OF RUNWAY` = Cash Balance / Net Burn (or ∞ if positive)
- `NET CASH POSITION` = Cash + AR - AP - CC Outstanding
- `ARR` = MRR × 12
- Cash Balance, MRR are INPUTS; Runway, ARR are FORMULAS

### Balance Sheet — FUTURE (not in Excel either)
- Currently empty shell. Not a priority.

---

## 2-Way Sync: What Exists vs What's Needed

### Currently Synced (Orbit ↔ Sheet)
| Data | Direction | Mechanism |
|------|-----------|-----------|
| Team roster | Orbit → Sheet | saveTeam() on edit |
| Opportunities | Orbit → Sheet | saveOpportunities() on edit |
| Weekly allocations | Orbit → Sheet | debouncedSaveWeek() on change, creates Orbit:Week:X/XX tabs |
| Demand gen metrics | Orbit → Sheet | saveDemandGen() on change |
| Lock In summaries | Orbit → Sheet | lockIn() appends to Orbit:LockInLog |
| Team + Opps config | Sheet → Orbit | loadState() on app start |

### NOT Yet Synced (needed for full 2-way)
| Data | Why It Matters | How to Wire |
|------|---------------|-------------|
| Weekly allocations → Resource Allocation tab | Orbit's "this week" allocation should update the RA percentages | Apps Script: on saveWeek(), compute % from hours and write to RA tab |
| Resource Allocation → Orbit | If someone edits RA in the sheet, Orbit should reflect it | loadState() should also read RA tab and reconcile |
| Orbit allocations → P&L cost projections | If Robert increases from 40h to 50h, compensation should adjust | Longer term — P&L comp rows could reference Orbit:Team capacity × rate |
| Pipeline changes → Orbit opportunities | If a new deal is added in Pipeline, it should appear as an Orbit opportunity | Would need a mapping layer between Pipeline rows and Orbit opportunities |
| Lock In summaries → visible in Sheet nicely | Currently raw text in LockInLog | Could format as a dashboard tab |

### Recommended Phase 2 Sync Priorities
1. **Weekly allocations → Resource Allocation tab** — highest value, makes RA dynamic
2. **Formula-rebuild all remaining tabs** — makes the sheet a real CFO tool
3. **Sheet edits → Orbit refresh** — polling or manual "Refresh from Sheet" button
4. **Pipeline ↔ Orbit opportunity mapping** — future

---

## Color Coding Convention (established in this session)

| Color | Hex | Meaning | Where |
|-------|-----|---------|-------|
| Light blue | `#e3f2fd` | Free input cell — edit these | Revenue inputs, cost inputs, assumptions |
| Gray | `#f5f5f5` | Formula cell — don't edit | Totals, calculations, derived metrics |
| Light green | `#e8f5e9` | Key summary row | Gross Profit, Net Income, Cumulative, Ending Cash |
| Blue-gray | `#e8eaf6` | Column/row headers | Month headers, section headers |

---

## Files to Modify

| File | What to Do |
|------|-----------|
| Google Sheet (via MCP) | Rebuild formulas for LRP, IRR, LTV, RA, Expense, Runway tabs |
| Google Sheet (via MCP) | Apply blue/gray/green formatting to all tabs |
| Apps Script `Code.gs` | Add sync: saveWeek → update Resource Allocation tab |
| Apps Script `Code.gs` | Add loadResourceAllocation() to loadState() |
| `src/lib/sheetSync.ts` | Add refresh/polling capability |
| `src/App.tsx` | Add "Refresh from Sheet" button or auto-refresh on focus |

---

## How to Execute

1. **Read the Excel file** at `/Users/rbtna/Downloads/Epistemic Me - Financial Model UPDATED 20260319 2.xlsx` using openpyxl to extract exact formula patterns
2. **For each tab**: clear → rewrite with formulas (USER_ENTERED) → format (blue inputs, gray formulas)
3. **Update Apps Script** to write Resource Allocation when weekly allocations change
4. **Test**: change a number in Orbit → verify it flows through Sheet → verify formulas recalculate
5. **Redeploy Apps Script** (new version) and redeploy Vercel app if client code changes

---

## Key IDs and URLs

| Resource | ID/URL |
|----------|--------|
| Financial Model Sheet | `1mUh7a0AwH8t4U1eEJTVatbBsAujAh0pnQH8zAQ6-e6s` |
| Apps Script Project | `1Ea2gdGOSDr534PmA55NZ_GPEwHgcVJ5frcC-fVNjKTljDWP0x-S8a3f2` |
| Apps Script Deployment | `https://script.google.com/macros/s/AKfycbzo5ibJwW6izmRNWkyOzd-nZLIjmIWrLyvERjMBi7xs7LQMaPQsfK1UtBgWYFukjlCw/exec` |
| Clarity Orbit App | `https://clarity-orbit.vercel.app` |
| GitHub Repo | `https://github.com/Epistemic-Me/Clarity-Orbit` |
| Magic Patterns Design | `https://www.magicpatterns.com/c/iutywzsbzqlueqndkk2xna` |
| Obsidian Context Note | `Epistemic Me/Business Strategy/ROI Investment Framework` |
| Excel Reference | `/Users/rbtna/Downloads/Epistemic Me - Financial Model UPDATED 20260319 2.xlsx` |
| Google user email | `robert@epistemicme.com` |
