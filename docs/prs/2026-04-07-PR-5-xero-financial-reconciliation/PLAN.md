# PR #5: xero-financial-reconciliation - Plan

**Created**: 2026-04-07
**Updated**: 2026-04-08 (v5 — dollar-for-dollar reconciliation, CAC tracking, accrual success criteria)
**Based on**: [RESEARCH.md](./RESEARCH.md)
**Branch**: `feature/pr-5-xero-financial-reconciliation`
**Linear**: CLA-135

## Success Criteria

> Everything is accounted for. You can look at the monthly P&L. You can calculate what our margins are and should be.

1. **Dollar-for-dollar reconciliation** — Xero monthly P&L and the Sheets Actual columns must match on every single cell. Zero tolerance. If Xero says Service Revenue was $46,000 in March, the Sheets Actual column for March says $46,000. Not $46K. Not "approximately." The exact number.
2. **Accrual accounting** — Revenue recognized when earned, expenses when incurred. Not when cash moves.
3. **Margin visibility** — Gross margin and net margin calculated explicitly each month. COGS properly separated from OpEx.
4. **CAC trackable** — Community, content, and marketing costs rolled up as customer acquisition cost. Not buried in Professional Fees or generic Advertising.

## Chosen Approach

**Xero-first, accrual-basis accounting.** Fix Xero to be the source of truth with proper COGS, expense classification, accrual adjustments, and equity realization. Then restructure the Sheets P&L to match Xero's chart of accounts **cell-for-cell** — same account codes, same line items, same numbers. Then build reconciliation workflows that enforce this match monthly. Orbit remains the planning interface for IRR/resource allocation — its code doesn't change, but the Apps Script bridge and Sheets structure it reads from do.

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

#### 0c. Break Up Professional Fees ($97,400) + CAC Account Structure

**Problem:** $97K in Professional Fees is a catch-all. Worse, customer acquisition spend is invisible — content, community, and outbound costs look like generic overhead instead of strategic investment. An investor (or the founders themselves) can't see margins or defend the allocation.

**Reclassification:**
| What | From | To | Code |
|------|------|----|------|
| Robert & Jonathan 1099 comp | Professional Fees (6290) | Contract Labor (6090) | Then split COGS/OpEx per 0a |
| QA contractor (ThirstySprout) | Professional Fees (6290) | COGS - Labor (5100) | 100% direct |
| Social media (Contra/Benjamin) | Professional Fees (6290) | Advertising (6000) | → CAC: Content Production |
| ACQ Community membership | Professional Fees (6290) | Advertising (6000) | → CAC: Community/Lead Gen |
| Actual professional fees only | Stay in 6290 | Stay in 6290 | Legal, accounting, etc. |

**CAC Sub-Account Structure in Xero:**

All CAC items go to Advertising (6000) but use **tracking categories** or **description conventions** to sub-classify:

| CAC Line Item | Xero Account | Description Tag | What It Is |
|--------------|-------------|-----------------|------------|
| Community Memberships | Advertising (6000) | `CAC:Community` | ACQ Community — lead gen network, warm introductions |
| Content Production | Advertising (6000) | `CAC:Content` | Social media agency, video (Contra, HeyGen, Kite) |
| Outbound Tools | Advertising (6000) | `CAC:Outbound` | Instantly, Apollo, Senja — cold outreach infra |
| Other Marketing | Advertising (6000) | `CAC:Other` | Ascend Viral, ad spend, misc marketing |

**CAC Metrics (tracked monthly in Sheets Runway & KPIs):**
```
Total CAC Spend ................. sum of all Advertising (6000)
New Customers Acquired .......... count of new contracts signed
CAC per Customer ................ Total CAC / Customers
Content ROI ..................... Revenue attributable to content / Content spend
CAC Trend ....................... month-over-month trajectory
```

**The Narrative (built into the P&L forecast):**

The forecast should tell this story over 18 months:
1. **Now (investment phase):** CAC is high ($2-5K/mo). Content flywheel is being built — podcast, blog, social. Community (ACQ) is warming leads. ROI is < 1x.
2. **6 months (compounding phase):** SEO backlog compounds. Podcast episodes rank. Social following grows. Inbound leads increase. CAC spend stays flat but leads grow → CAC/customer drops.
3. **12 months (flywheel phase):** Organic inbound dominates. Content produces more leads than outbound. CAC trends toward zero. Robert's personal brand drives negative CAC (content generates revenue via speaking, referrals, inbound that costs nothing marginal).

**Each CAC line item should have a projected ROI and timeframe** so it reads as strategic investment, not cost drag:

| Investment | Monthly Spend | Expected Mechanism | ROI Timeline |
|-----------|--------------|-------------------|-------------|
| ACQ Community ($3K/quarter) | $1K/mo | Warm intros → discovery calls → 35% close | 2.9x per quarter |
| Content production | $0/mo (ended Mar'26) | SEO + social compound → inbound leads | Lagging — 3-6 months |
| Outbound tools ($95/mo) | $95/mo | Cold email → meetings → pipeline | 1-3 month cycles |
| Robert's time on content (Orbit: outer ring hours) | ~$2.25K/mo (15h × $150) | Brand building → authority → inbound | 6-12 months |

**Note:** Robert's content hours are not a cash cost — they're an opportunity cost tracked in Orbit. But they should be visible in the CAC analysis as "hours diverted from billable work" so the investment is explicit.

#### 0d. Journal Personal Card Expenses ($11,301)

Debit various expense accounts, Credit Due to Director (820):

| Category | Xero Account | Code |
|----------|-------------|------|
| AI/ML APIs (Anthropic, OpenAI, Moonshot, Kimi) | Cost of Goods Sold | 5000 |
| AI/ML Subscriptions (Claude, ChatGPT) | Dues and Subscriptions | 6110 |
| Hosting, Dev Tools, Team Tools, Domain, Email | Software & Web | 6340 |
| Sales/Marketing (Instantly, Apollo) | Advertising — CAC | 6000 |
| Community (ACQ) | Advertising — CAC | 6000 |
| Social media, Content/Video | Advertising — CAC | 6000 |
| Business Services, Legal, Tax, HR | Professional Fees | 6290 |
| Internet, Coworking | Telephone and Internet | 6390 |

#### 0e. Equity Reclassification — BLOCKED (pending legal)

**Status: On hold.** Cannot reclassify $32,475 from Account 820 → APIC (3200) until founder equity split is formalized.

**What's needed (one legal session, ~$1-2K):**
1. Founder equity split (Robert + Jonathan, % and share count)
2. Stock Purchase Agreement for Robert's $32,475 (retroactive to Aug-Oct 2025 injection dates)
3. Vesting schedule decision (if any)
4. Authorized share count confirmation
5. Board consent resolution covering all of the above

**Why blocked:** Moving money to equity without a stock purchase agreement creates worse audit risk than leaving it in 820. The journal entry is simple — Debit 820 $32,475, Credit APIC (3200) — but it must be backed by signed legal docs.

**Impact on rest of plan:** None. All other Phase 0 items proceed independently. The $32,475 stays in Account 820 until legal paperwork is complete. After 0d (personal card journaling), 820 will show $43,776 ($32,475 capital + $11,301 reimbursement). Only the $32,475 moves to equity once docs are signed.

#### 0f. Accrual Adjustments

Moving from implicit cash-basis to proper accrual accounting. Every line item has a clear recognition rule:

**Revenue recognition (when earned, not when paid):**
| Revenue | Recognition Rule |
|---------|-----------------|
| Dayforce $25K/mo | Recognized in the month services are delivered. Invoice dated end-of-month. Payment arrives Net-30 — irrelevant to P&L timing. |
| Mystica $13K retainer | Recognized monthly when services delivered. |
| Mystica profit share | Recognized when calculated (monthly), regardless of payment timing. |
| Sprint Zero | Recognized in the month the sprint is delivered. |

**Expense recognition (when incurred, not when paid):**
| Expense | Recognition Rule |
|---------|-----------------|
| Robert/Jonathan 1099 comp | Accrued in the month work is performed. If Rippling pays on the 25th for work done all month, the full month accrues. |
| W2 wages | Accrued per pay period in the month worked. |
| QA contractor (ThirstySprout) | Accrued in the month work is performed, even if paid the following month. |
| Social media contractor | Accrued in the month content is delivered. |
| Annual subscriptions | Amortized monthly over the subscription period (not expensed when paid). |

**Specific prepaid amortization entries:**
- Namecheap domain ($550 paid Sep'25) → $46/mo over 12 months → Prepaid Expenses (1300) asset, amortized to Software & Web (6340)
- 1Password ($239 paid Aug'25) → $20/mo over 12 months → Prepaid Expenses (1300) asset, amortized to Software & Web (6340)
- Any future annual payment > $200 gets the same treatment

**Accrued liabilities:**
- If a contractor works in month N but invoice arrives in month N+1, book the expense in month N via: Debit expense account, Credit Accrued Expenses (2100)
- Reverse the accrual when the actual invoice is received and paid

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

**Fix:** Restructure to mirror Xero **cell-for-cell**. Every line item maps to a Xero account code. No custom categories that don't exist in Xero.

```
SERVICE REVENUE
  Dayforce Contract Revenue ............... (4100)
  Mystica Retainer ....................... (4100)
  Mystica Profit Share ................... (4100)
  Sprint Zero / Impl Readiness ........... (4100)
  Other Agency Retainers ................. (4100)
SOFTWARE REVENUE (future)
  PEPM Profit Share
  Clarity Builder Subscriptions
─────────────────────────────────────────────────
TOTAL REVENUE

COST OF GOODS SOLD
  Contract Labor — COGS portion .......... (5100)
  AI/ML API Costs ........................ (5000)
  Client Hosting ......................... (5000)
─────────────────────────────────────────────────
TOTAL COGS

GROSS PROFIT
GROSS MARGIN %

OPERATING EXPENSES
  Contract Labor — R&D/platform .......... (6090)
  Wages & Salaries - W2 .................. (6450)
  Payroll Taxes .......................... (6360)
  Software & Web ......................... (6340)
  Dues & Subscriptions ................... (6110)
  Professional Fees ...................... (6290)
  Telephone & Internet ................... (6390)
  Bank Fees .............................. (6030)
  Filing & Registration .................. (525)
─────────────────────────────────────────────────
TOTAL OPEX (excl. CAC)

CUSTOMER ACQUISITION COSTS (CAC)
  Community Memberships (ACQ) ............ (6000)
  Content Production (video, social) ..... (6000)
  Social Media Agency .................... (6000)
  Outbound Tools (Instantly, Apollo) ..... (6000)
  Other Marketing ........................ (6000)
─────────────────────────────────────────────────
TOTAL CAC
CAC / NEW CUSTOMER (if applicable)

─────────────────────────────────────────────────
TOTAL OPERATING EXPENSES (OpEx + CAC)

NET INCOME
NET MARGIN %
```

**Column structure per month:**

| | Forecast | Actual | Variance | Var % |
|---|---|---|---|---|
| Service Revenue | $46,000 | $46,000 | $0 | 0% |
| ... | ... | ... | ... | ... |

- **Forecast**: manually maintained forward-looking plan
- **Actual**: populated from Xero via reconciliation workflow (must match Xero to the dollar)
- **Variance**: `=Actual - Forecast` (Sheet formula)
- **Var %**: `=Variance / Forecast` (Sheet formula)

**Reconciliation check row at bottom of each month:**
```
XERO P&L NET INCOME .................... $X,XXX    ← pulled from Xero
SHEETS ACTUAL NET INCOME ............... $X,XXX    ← sum of Actual column
RECONCILIATION DELTA ................... $0        ← MUST BE ZERO
```

If the delta is non-zero, something is miscategorized or missing. This is the enforcement mechanism for dollar-for-dollar accuracy.

Also restructure:
- **Balance Sheet** → populate from Xero balance sheet report (must match Xero)
- **Runway & KPIs** → wire to Xero actuals (real cash, AR, AP) + add CAC metrics
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

#### Monthly Reconciliation (Xero → Sheets) — Dollar-for-Dollar
```
Trigger: "Reconcile {month}" in Claude Code

1. Pull Xero P&L for period (list-profit-and-loss --fromDate --toDate --timeframe MONTH)
2. Pull Xero balance sheet (list-report-balance-sheet)
3. Map each Xero account to its Sheets row using account code (defined mapping table)
4. Write each Xero line item into the Sheets "Actual" column for that month
5. Sum Sheets Actual column → compute Sheets Net Income
6. Compare Sheets Net Income vs Xero Net Income
7. **RECONCILIATION CHECK: delta must be $0.00**
   - If delta ≠ 0: identify which account is mismatched, fix before proceeding
   - Common causes: missing journal entry, wrong account code, unreconciled transaction
8. Once delta = 0, compute and report:
   - Gross margin % (Revenue - COGS) / Revenue
   - Net margin % (Net Income / Revenue)
   - Total CAC and CAC per customer (if new customers acquired)
   - Top 3 forecast variances by absolute dollar amount
```

**The reconciliation check is non-negotiable.** Every cell in the Actuals column must trace back to a specific Xero account balance. If they don't add up, the books aren't clean.

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
5. **0e.** Equity reclassification ($32,475) → APIC (3200) — **BLOCKED: needs founder equity split + stock purchase agreement from lawyer**
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
- [ ] Monthly reconciliation for Apr'26: **reconciliation delta = $0**
- [ ] Every Xero account with a balance maps to exactly one Sheets row
- [ ] Every Sheets Actual cell traces to a Xero account code
- [ ] Gross margin % identical in Xero P&L report and Sheets model
- [ ] CAC total in Sheets matches sum of Xero Advertising (6000) sub-entries
- [ ] Invoice generation: DRAFT invoice matches expected amounts
- [ ] Cash pulse: real bank balance, AR, AP in Sheets

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

### Non-Negotiable (must all pass)
- [ ] **Reconciliation delta = $0** — Xero monthly P&L net income matches Sheets Actual column net income, to the penny, for Apr'26
- [ ] **Gross margin visible** — explicit gross margin % calculated from COGS each month (expected range: 55-65%)
- [ ] **Net margin visible** — explicit net margin % after all OpEx + CAC each month
- [ ] **CAC tracked separately** — community, content, social, outbound tools rolled up as Customer Acquisition Cost with a total line
- [ ] **Accrual-basis** — revenue recognized when earned, expenses when incurred, prepaid amortized monthly
- [ ] **Every dollar accounted for** — no transactions in Xero that don't map to a Sheets row; no Sheets line items without a Xero account

### Required
- [ ] Professional Fees broken into Contract Labor + CAC + actual fees
- [ ] Personal card expenses ($11,301) journaled to correct accounts
- [ ] Equity ($32,475) reclassified to APIC (3200) — **blocked on legal: founder equity split + stock purchase agreement**
- [ ] Sheets P&L structure matches Xero chart of accounts (same codes, same line items)
- [ ] IRR/LTV/Scorecard tabs updated and validated against new P&L structure
- [ ] Apps Script updated to write Orbit data to new Sheets structure
- [ ] Monthly reconciliation + COGS allocation workflows documented as runbooks
- [ ] Xero is the single source of truth; Orbit is the planning interface
- [ ] Linear CLA-135 moved to Done
