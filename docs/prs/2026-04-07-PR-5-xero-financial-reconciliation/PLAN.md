# PR #5: xero-financial-reconciliation - Plan

**Created**: 2026-04-07
**Updated**: 2026-04-08 (v4 — added Orbit integration, Apps Script, historical restatement, transition plan)
**Based on**: [RESEARCH.md](./RESEARCH.md)
**Branch**: `feature/pr-5-xero-financial-reconciliation`
**Linear**: CLA-135

## Chosen Approach

**Xero-first, accrual-basis accounting.** Fix Xero to be the source of truth with proper COGS, expense classification, accrual adjustments, and equity realization. Then restructure the Sheets P&L to mirror Xero's account hierarchy. Then build reconciliation workflows. Orbit remains the planning interface for IRR/resource allocation — its code doesn't change, but the Apps Script bridge and Sheets structure it reads from do.

## Scope

### In Scope
- **Phase 0:** Xero accounting standards — COGS setup, accrual adjustments, expense reclassification, equity realization, missing contacts
- **Phase 1:** Sheets P&L restructuring — mirror Xero's Revenue → COGS → Gross Margin → OpEx → Net Income
- **Phase 1b:** Apps Script update — re-map Orbit data writes to new Sheets structure
- **Phase 1c:** IRR/LTV/Scorecard tab formula audit — ensure they survive restructuring
- **Phase 2:** Monthly reconciliation + COGS labor allocation workflows
- **Phase 3:** Invoice generation, cash pulse, expense audit workflows
- **Phase 4:** Orbit code cleanup (CPL formula, stale defaults) + runbook docs

### Out of Scope
- Automated scheduling — manual Claude Code commands for now
- New Orbit UI views — Orbit's React code is hours-only, financial display stays as-is
- Payroll automation — Rippling handles payroll, Xero records it
- Multi-currency support
- Full historical restatement to Jul'25 — start clean from cutover month

## Key Decision: Historical Restatement

**Decision: Start clean from Apr'26 forward.** Do not restate Jul'25 → Mar'26.

**Rationale:**
- Orbit lock-in data only exists for weeks of 3/16, 3/23, 3/30 — no hours data before mid-March to drive COGS labor allocation
- Attempting to retroactively estimate client-work % without Orbit data would be guesswork
- The 2025 Retained Earnings (-$19,702) stays as-is in Xero — a clean historical figure
- Apr'26 is the first month where Xero, Sheets, and Orbit are all aligned

**What this means:**
- Phase 0 Xero cleanup fixes classifications going forward (new transactions get correct accounts)
- Historical transactions in wrong accounts (e.g., $112K in Sale of Goods) get reclassified via journal entries — this fixes the cumulative totals but doesn't create month-by-month historical COGS
- Mar'26 becomes the "bridge month" — partial data, used for testing workflows
- Apr'26 is the first fully accrual-basis month with COGS allocation from Orbit

## Technical Design

### Phase 0: Xero Accounting Standards

The goal is to produce accurate monthly P&L reports from Xero with this structure:
```
Revenue → COGS → Gross Profit (margin %) → OpEx → Net Income (margin %)
```

#### 0a. COGS Setup & Contractor Allocation

**Problem:** All expenses are in operating expense accounts. No COGS means gross margin = 100%, which is meaningless for a services business.

**Direct costs (COGS) for EM:**
| Cost | Account | Code | Basis |
|------|---------|------|-------|
| Robert — client delivery hours | Cost of Goods Sold - Labor | 5100 | % of hours on Dayforce/Mystica (from Orbit) |
| Jonathan — client delivery hours | Cost of Goods Sold - Labor | 5100 | % of hours on Dayforce/Mystica (from Orbit) |
| QA contractor (ThirstySprout) | Cost of Goods Sold - Labor | 5100 | 100% client delivery |
| AI/ML API costs | Cost of Goods Sold | 5000 | Direct cost of service delivery |
| Client-facing hosting | Cost of Goods Sold | 5000 | Portion serving Dayforce/Mystica |

**Accrual method for labor COGS:**
1. Each month, pull Orbit lock-in data for hours by opportunity
2. Calculate % of Robert/Jonathan hours on client-billable work (middle ring = Dayforce + Mystica)
3. Allocate that % of their monthly comp to COGS (5100)
4. Remainder stays in OpEx as R&D/platform investment (6090)

**Example — March 2026 (from Orbit lock-ins):**
- Robert: 55h total, 35h on Dayforce+Mystica = 64% → $5K comp × 64% = $3,200 COGS
- Jonathan: 47h total, 40h on Dayforce+Mystica = 85% → $15K comp × 85% = $12,750 COGS
- QA: 15h all client work = 100% → $2,800 COGS
- Total COGS labor: $18,750
- Revenue: ~$46K → **Gross margin: ~59%**

#### 0b. Revenue Reclassification

Reclassify $112,795 from Sale of Goods (4000) → Service Revenue (4100).
- All current revenue is services (Dayforce consulting, Mystica retainer + profit share)
- Future software revenue (Clarity Builder, PEPM) will use a new account when it materializes

#### 0c. Break Up Professional Fees ($97,400)

| What | From | To | Code |
|------|------|----|------|
| Robert & Jonathan 1099 comp | Professional Fees (6290) | Contract Labor (6090) | Then split COGS/OpEx per 0a |
| QA contractor (ThirstySprout) | Professional Fees (6290) | COGS - Labor (5100) | 100% direct |
| Social media (Contra/Benjamin) | Professional Fees (6290) | Advertising (6000) | Marketing expense |
| Actual professional fees only | Stay in 6290 | Stay in 6290 | Legal, accounting, etc. |

#### 0d. Journal Personal Card Expenses ($11,301)

Debit various expense accounts, Credit Due to Director (820):

| Category | Xero Account | Code |
|----------|-------------|------|
| AI/ML APIs (Anthropic, OpenAI, Moonshot, Kimi) | Cost of Goods Sold | 5000 |
| AI/ML Subscriptions (Claude, ChatGPT) | Dues and Subscriptions | 6110 |
| Hosting, Dev Tools, Team Tools, Domain, Email | Software & Web | 6340 |
| Sales/Marketing, Community (ACQ), Social, Content | Advertising | 6000 |
| Business Services, Legal, Tax, HR | Professional Fees | 6290 |
| Internet, Coworking | Telephone and Internet | 6390 |

#### 0e. Equity Reclassification

Journal: Debit Due to Director (820) $32,475 → Credit Additional Paid In Capital (3200) $32,475.
Robert's capital injections are an equity purchase. After 0d, 820 will have $43,776; only the $32,475 moves to equity, $11,301 stays as director reimbursement.

#### 0f. Accrual Adjustments

**Prepaid expenses:** Amortize large annual payments monthly:
- Namecheap domain ($550 paid Sep'25) → $46/mo over 12 months
- 1Password ($239 paid Aug'25) → $20/mo over 12 months

**Accrued expenses:** If a contractor works in month N but is paid in month N+1, the expense accrues in month N.

**Revenue recognition:** Revenue recognized when service is delivered, regardless of payment timing. Dayforce $25K is the month's revenue even if payment arrives Net-30.

#### 0g. Create Missing Contacts

| Contact | Type | Purpose |
|---------|------|---------|
| Relationship Psychics | Customer | Mystica's legal entity |
| Contra / Benjamin | Supplier | Social media (ended Mar'26) |
| Anthropic | Supplier | AI API + subscriptions |
| Intapp | Customer | Closing ~Apr 22 — create contact + invoice template proactively |

### Phase 1: Sheets P&L Restructuring

#### 1a. Monthly P&L Structure

**Problem:** Current Sheets P&L uses custom categories (Platform Revenue / Services Revenue / Reference Design Revenue) that don't match Xero's chart of accounts. Actuals from Xero can't drop in without manual mapping.

**Fix:** Restructure to mirror Xero:

```
SERVICE REVENUE
  Dayforce Contract Revenue (4100)
  Mystica Retainer (4100)
  Mystica Profit Share (4100)
  Sprint Zero / Impl Readiness (4100)
  Other Agency Retainers (4100)
SOFTWARE REVENUE (future)
  PEPM Profit Share
  Clarity Builder Subscriptions
TOTAL REVENUE

COST OF GOODS SOLD
  Contract Labor — COGS portion (5100)
  AI/ML API Costs (5000)
  Client Hosting (5000)
TOTAL COGS

GROSS PROFIT
GROSS MARGIN %

OPERATING EXPENSES
  Contract Labor — non-COGS portion (6090)
  Wages & Salaries - W2 (6450)
  Payroll Taxes (6360)
  Advertising & Marketing (6000)
  Software & Web (6340)
  Dues & Subscriptions (6110)
  Professional Fees (6290)
  Telephone & Internet (6390)
  Bank Fees (6030)
  Filing & Registration (525)
TOTAL OPEX

NET INCOME
NET MARGIN %
```

Each month gets two columns: **Forecast** and **Actual**. Actuals populated from Xero via reconciliation workflow.

Also restructure:
- **Balance Sheet** → populate from Xero balance sheet report
- **Runway & KPIs** → wire to Xero actuals (real cash, AR, AP)
- **Expense Detail** → replace flat budgets with Xero-derived actuals per category

#### 1b. Apps Script Update

**Problem:** The Apps Script (`Code.gs`, project ID `1Ea2gdGOSDr534PmA55NZ_GPEwHgcVJ5frcC-fVNjKTljDWP0x-S8a3f2`) maps Orbit data to specific Sheet rows/tabs. When we restructure the P&L, any row references in the Apps Script will break.

**What to check:**
- `saveWeek` handler — writes allocations to `Orbit:Week:*` tabs (likely fine — separate tabs)
- `saveTeam` handler — writes team data to `Orbit:Team` tab (likely fine)
- `saveOpportunities` handler — writes to `Orbit:Opportunities` tab (likely fine)
- Any logic that writes to `Resource Allocation` or financial model tabs (would break)

**Method:** Read `Code.gs` from the Apps Script editor, identify all row/tab references to financial model tabs, update to match new structure.

**Risk:** Medium — the Apps Script is not version-controlled. Read it first, make targeted changes.

#### 1c. IRR / LTV / Scorecard Formula Audit

**Problem:** The Sheets model has `IRR by Channel`, `LTV Model`, `ROI Forecast`, and `ROI Scorecard` tabs that likely reference the current P&L structure via cell references or named ranges. Restructuring the P&L will break these formulas silently.

**Method:**
1. Read each tab's formulas (Google Workspace MCP: `read_sheet_values` with `include_formulas: true`)
2. Map all cross-tab references to the Monthly P&L
3. Update references to match new row structure
4. Verify calculations produce same results before/after

**Risk:** High if ignored — broken formulas produce wrong numbers silently. Must audit before restructuring.

### Phase 2: Reconciliation Workflows

#### Monthly Reconciliation (Xero → Sheets)
```
Trigger: "Reconcile {month}" in Claude Code
1. Pull Xero P&L for period (list-profit-and-loss --fromDate --toDate --timeframe MONTH)
2. Pull Xero balance sheet (list-report-balance-sheet)
3. Map Xero account codes to Sheets rows (defined mapping table)
4. Write actuals into Sheets "Actual" columns for that month
5. Calculate variances via Sheet formulas (actual - forecast)
6. Produce summary: gross margin %, net margin %, top 3 variances
```

#### COGS Labor Allocation (Orbit → Xero)
```
Trigger: "Allocate COGS for {month}" in Claude Code
1. Read Orbit:LockInLog from Sheets for all weeks in the month
2. Sum hours by person by opportunity
3. Calculate client-work % (middle ring hours / total hours) for Robert & Jonathan
4. Compute COGS amounts: client-work % × monthly comp
5. Create journal entry in Xero: Debit COGS-Labor (5100), Credit Contract Labor (6090)
6. Verify: Xero P&L now shows COGS and gross margin for the month
```

This is the **key new workflow** that bridges Orbit → Xero directly. It's what makes gross margin real.

### Phase 3: Supporting Workflows

**Invoice from Lock-Ins:**
```
1. Read Orbit:LockInLog for the month
2. Sum hours by client
3. Create DRAFT invoices in Xero (Dayforce $25K, Mystica $13K + profit share)
4. Human reviews and approves
```

**Cash Pulse:**
```
1. Pull Xero bank balance, AR aging, AP aging
2. Update Sheets Runway & KPIs
3. Flag overdue invoices
```

**Expense Audit:**
```
1. Pull Xero transactions for period
2. Read expense sheet (personal card transactions)
3. Three-way compare: Xero vs expense sheet vs Sheets budget
4. Flag variances, missing entries, uncategorized items
```

### Phase 4: Orbit Code Cleanup + Runbooks

#### 4a. CPL Formula Fix
`AllocationTable.tsx:278` hardcodes `$4,000/4.3` (social media agency monthly / weeks) and `$150/hr`. The social media agency ended in March. Either:
- Remove the hardcoded agency cost (just use `demandGen.hours * rate`)
- Or parameterize it so it can be set to $0

#### 4b. Default Opportunities Staleness
`src/lib/data.ts` has hardcoded `monthlyRevenue` and `weeklyHours` arrays per opportunity as seed data. These were the original forecasts. Now that Sheets is the source of truth:
- These are only used for first-time initialization (before Sheets sync loads)
- Low priority — consider marking them as seed data with a comment, or loading from Sheets on first sync

#### 4c. Workflow Runbooks
Document all workflows as repeatable runbooks:
| File | Purpose |
|------|---------|
| `docs/workflows/monthly-close.md` | Full monthly close: COGS allocation + reconciliation + Sheets update |
| `docs/workflows/invoice-generation.md` | Lock-in → DRAFT invoice in Xero |
| `docs/workflows/cash-pulse.md` | On-demand cash position check |
| `docs/workflows/expense-audit.md` | Three-way expense comparison |
| `docs/workflows/xero-mcp-setup.md` | Custom Connection setup, scope patch, 1Password config |

## Transition Plan

**Approach: Parallel run, then cutover.**

1. **Phase 0 (Xero cleanup):** Execute journal entries in Xero. This fixes cumulative totals but doesn't restructure Sheets yet. Old Sheets structure continues to work.
2. **Phase 1 (Sheets restructuring):** Create new P&L structure in a **new tab** (`Monthly P&L v2`) alongside the existing tab. Don't delete the old one yet.
3. **Validation:** Run the April reconciliation against both old and new tabs. Verify totals match (different structure, same numbers).
4. **Cutover:** Once validated, rename `Monthly P&L` → `Monthly P&L (legacy)` and `Monthly P&L v2` → `Monthly P&L`. Update any cross-tab references (IRR, LTV, etc.) to point to the new tab.
5. **Apps Script update:** Update `Code.gs` to write Orbit data to the new structure.
6. **Cleanup:** After 1 month of stable operation, archive the legacy tab.

This ensures zero downtime — the old model keeps working until the new one is validated.

## Implementation Order

### Priority 1: Xero Source of Truth (Phase 0)
1. **0a.** COGS account setup and initial labor allocation (Apr'26 as first month)
2. **0b.** Revenue reclassification (Sale of Goods → Service Revenue)
3. **0c.** Break up Professional Fees → Contract Labor + Advertising
4. **0d.** Journal personal card expenses ($11,301) → Account 820
5. **0e.** Equity reclassification ($32,475) → APIC (3200)
6. **0f.** Accrual adjustments (prepaid amortization, expense matching)
7. **0g.** Create missing contacts (Relationship Psychics, Intapp)

### Priority 2: Sheets Alignment (Phase 1)
8. **1c.** Audit IRR/LTV/Scorecard formulas FIRST (understand what will break)
9. **1a.** Create new P&L tab mirroring Xero structure (parallel to old tab)
10. Add Forecast + Actual column pairs per month
11. Restructure Balance Sheet, Runway & KPIs
12. **1b.** Update Apps Script to write to new structure
13. Validate: run April reconciliation against both old and new tabs
14. Cutover: swap tabs, update cross-references

### Priority 3: Workflow Automation (Phase 2-3)
15. Build COGS labor allocation workflow (Orbit hours → Xero journal)
16. Build monthly reconciliation workflow (Xero → Sheets)
17. Build invoice generation workflow (lock-ins → Xero DRAFT)
18. Build cash pulse + expense audit workflows

### Priority 4: Cleanup (Phase 4)
19. Fix CPL formula in `AllocationTable.tsx`
20. Document all workflows as runbooks
21. Archive legacy Sheets tabs after 1 month stable

## Testing Strategy

### Phase 0: Xero Accounting Validation
- [x] Baseline Xero state documented (P&L, balance sheet, trial balance)
- [ ] COGS accounts (5000, 5100) have entries; gross margin < 100%
- [ ] Revenue: $0 in Sale of Goods, all in Service Revenue (4100)
- [ ] Professional Fees < $5K (only actual legal/accounting fees remain)
- [ ] Contract Labor (6090) shows founder + QA comp
- [ ] Advertising (6000) shows social media + ACQ + marketing
- [ ] Account 820 has $11,301 director reimbursement
- [ ] APIC (3200) has $32,475 equity
- [ ] Prepaid amortization entries created for annual subscriptions
- [ ] **Monthly P&L from Xero shows explicit gross margin per month**

### Phase 1: Sheets Model Validation
- [ ] IRR/LTV/Scorecard formula audit complete — all cross-references mapped
- [ ] New P&L tab created alongside old tab (parallel run)
- [ ] Revenue → COGS → Gross Margin → OpEx → Net Income flows correctly
- [ ] Each month has Forecast + Actual columns
- [ ] Balance Sheet populated from Xero ($111K assets)
- [ ] Runway & KPIs wired to real Xero data
- [ ] Apps Script updated and tested — Orbit data writes to new structure
- [ ] Old tab and new tab produce consistent totals

### Phase 2-3: Workflow Validation
- [ ] COGS allocation: Orbit hours drive labor COGS split in Xero
- [ ] Monthly reconciliation: run for Apr'26, actuals populate Sheets correctly
- [ ] Invoice generation: DRAFT invoice matches expected amounts
- [ ] Cash pulse: real bank balance, AR, AP in Sheets
- [ ] Gross margin % consistent between Xero report and Sheets model

### Phase 4: Cleanup Validation
- [ ] CPL formula updated (no hardcoded agency cost)
- [ ] Runbooks documented and tested
- [ ] Legacy tabs archived after 1 month stable

## Rollback Plan

- All Xero changes are journal entries — reversible with counter-entries
- Sheets restructuring in new tabs — old tabs preserved during parallel run
- Apps Script changes logged — can revert to previous version in Apps Script editor
- Contact creation is additive — no destructive changes
- Orbit code changes (CPL fix) are a single-line edit — trivial revert

## Definition of Done

- [ ] Xero produces accurate monthly P&L with **Revenue → COGS → Gross Margin → OpEx → Net Income**
- [ ] Gross margin calculated explicitly each month (target: track 55-65% range)
- [ ] Professional Fees broken into Contract Labor + Advertising + actual fees
- [ ] Personal card expenses journaled; equity reclassified
- [ ] Accrual adjustments in place (prepaid amortization, expense matching)
- [ ] Sheets P&L mirrors Xero structure with Forecast + Actual columns
- [ ] IRR/LTV/Scorecard tabs updated and validated against new P&L structure
- [ ] Apps Script updated to write Orbit data to new Sheets structure
- [ ] Monthly reconciliation + COGS allocation workflows tested and documented
- [ ] CPL formula cleaned up in Orbit
- [ ] Xero is the single source of truth; Orbit is the planning interface
- [ ] Linear CLA-135 moved to Done
