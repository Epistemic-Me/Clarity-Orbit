# PR #5: xero-financial-reconciliation - Plan

**Created**: 2026-04-07
**Updated**: 2026-04-08 (v3 — reordered: Xero accrual first, then Sheets alignment, then workflows)
**Based on**: [RESEARCH.md](./RESEARCH.md)
**Branch**: `feature/pr-5-xero-financial-reconciliation`
**Linear**: CLA-135

## Chosen Approach

**Xero-first, accrual-basis accounting.** Fix Xero to be the source of truth with proper COGS, expense classification, accrual adjustments, and equity realization. Then restructure the Sheets P&L to mirror Xero's account hierarchy. Then build reconciliation workflows. Orbit remains the planning interface for IRR/resource allocation, reading from the aligned Sheets model.

## Scope

### In Scope
- **Phase 0:** Xero accounting standards — COGS setup, accrual adjustments, expense reclassification, equity realization, missing contacts
- **Phase 1:** Sheets P&L restructuring — mirror Xero's Revenue → COGS → Gross Margin → OpEx → Net Income structure
- **Phase 2:** Monthly reconciliation workflow — Xero actuals → Sheets actuals columns
- **Phase 3:** Invoice generation, cash pulse, expense audit workflows
- **Phase 4:** Workflow runbook documentation

### Out of Scope
- Automated scheduling — manual Claude Code commands for now
- Orbit UI changes — Orbit reads from Sheets, no new views needed
- Payroll automation — Rippling handles payroll, Xero records it
- Multi-currency support

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
2. Calculate % of Robert/Jonathan hours on client-billable work (inner + middle ring)
3. Allocate that % of their monthly comp to COGS (5100)
4. Remainder stays in OpEx as R&D/platform investment

**Example — March 2026:**
- Robert: 55h total, 35h on Dayforce+Mystica = 64% → $5K total comp × 64% = $3,200 COGS
- Jonathan: 47h total, 40h on Dayforce+Mystica = 85% → $15K total comp × 85% = $12,750 COGS
- QA: 15h all client work = 100% → $2,800 COGS
- Total COGS labor: $18,750
- Revenue: ~$46K → **Gross margin: ~59%**

#### 0b. Revenue Reclassification

Reclassify $112,795 from Sale of Goods (4000) → Service Revenue (4100).
- All current revenue is services (Dayforce consulting, Mystica retainer + profit share)
- Future software revenue (Clarity Builder, PEPM) will go to a new **Software Revenue** account when it materializes

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
| Intapp | Customer | Closing ~Apr 22 |

### Phase 1: Sheets P&L Restructuring

**Problem:** The current Sheets Monthly P&L has this structure:
```
Platform Revenue → Services Revenue → Reference Design Revenue → Total Revenue
→ COGS (flat estimates) → Gross Profit → OpEx → Net Income
```

This doesn't match Xero's chart of accounts. The categories are different, the line items don't align, and there's no way to drop Xero actuals directly into the model.

**Fix:** Restructure Sheets Monthly P&L to match Xero's account hierarchy:

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
- **Expense Detail** → replace flat budgets with Xero-derived actuals

### Phase 2: Monthly Reconciliation Workflow

```
Trigger: "Reconcile {month}" in Claude Code
1. Pull Xero P&L for period (list-profit-and-loss --fromDate --toDate)
2. Pull Xero balance sheet (list-report-balance-sheet)
3. Map Xero accounts to Sheets rows (account code → row mapping)
4. Write actuals into Sheets "Actual" columns for that month
5. Calculate variances (actual - forecast) automatically via Sheet formulas
6. Produce summary: gross margin %, net margin %, key variances
```

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

**COGS Labor Allocation (monthly):**
```
1. Pull Orbit lock-in hours for the month
2. Calculate client-work % for Robert & Jonathan
3. Journal COGS allocation in Xero (Debit 5100, Credit 6090)
4. This is the key input for accurate gross margin
```

## Implementation Order

### Priority 1: Xero Source of Truth
1. **0a.** COGS account setup and initial labor allocation
2. **0b.** Revenue reclassification (Sale of Goods → Service Revenue)
3. **0c.** Break up Professional Fees → Contract Labor + Advertising
4. **0d.** Journal personal card expenses ($11,301) → Account 820
5. **0e.** Equity reclassification ($32,475) → APIC (3200)
6. **0f.** Accrual adjustments (prepaid amortization, expense matching)
7. **0g.** Create missing contacts (Relationship Psychics, Intapp)

### Priority 2: Sheets Alignment
8. Restructure Sheets Monthly P&L to mirror Xero account hierarchy
9. Add Forecast + Actual column pairs per month
10. Restructure Balance Sheet, Runway & KPIs to pull from Xero
11. Replace Expense Detail budgets with actuals-derived numbers

### Priority 3: Workflow Automation
12. Build monthly reconciliation workflow (Xero → Sheets)
13. Build COGS labor allocation workflow (Orbit hours → Xero journal)
14. Build invoice generation workflow (lock-ins → Xero DRAFT)
15. Build cash pulse + expense audit workflows
16. Document all workflows as runbooks

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
- [ ] Sheets P&L structure matches Xero account hierarchy
- [ ] Revenue → COGS → Gross Margin → OpEx → Net Income flows correctly
- [ ] Each month has Forecast + Actual columns
- [ ] Balance Sheet populated from Xero ($111K assets, $32K liabilities)
- [ ] Runway & KPIs wired to real Xero data

### Phase 2-3: Workflow Validation
- [ ] Monthly reconciliation: run for Mar'26, actuals populate Sheets correctly
- [ ] COGS allocation: Orbit hours drive labor COGS split in Xero
- [ ] Invoice generation: DRAFT invoice matches expected amounts
- [ ] Cash pulse: real bank balance, AR, AP in Sheets
- [ ] Gross margin % consistent between Xero report and Sheets model

## Rollback Plan

- All Xero changes are journal entries — reversible with counter-entries
- Sheets restructuring done in new columns/tabs — old structure preserved
- Contact creation is additive
- No deployed code changes — all Claude Code workflows

## Definition of Done

- [ ] Xero produces accurate monthly P&L with **Revenue → COGS → Gross Margin → OpEx → Net Income**
- [ ] Gross margin calculated explicitly each month (target: track 55-65% range)
- [ ] Professional Fees broken into Contract Labor + Advertising + actual fees
- [ ] Personal card expenses journaled; equity reclassified
- [ ] Accrual adjustments in place (prepaid amortization, expense matching)
- [ ] Sheets P&L mirrors Xero structure with Forecast + Actual columns
- [ ] Monthly reconciliation workflow tested and documented
- [ ] COGS labor allocation workflow (Orbit → Xero) tested
- [ ] Xero is the single source of truth; Orbit is the planning interface
- [ ] Linear CLA-135 moved to Done
