# PR #5: xero-financial-reconciliation - Research

**Created**: 2026-04-07
**Updated**: 2026-04-08 (v3 — incorporates Jonathan's accrual accounting feedback)
**Author**: @robertta
**Branch**: `feature/pr-5-xero-financial-reconciliation`
**Linear**: CLA-135

## Problem Statement

Epistemic Me's financial stack has three layers — Xero (books), Sheets (model), Orbit (weekly allocation) — and all three are disconnected with data quality issues. More fundamentally, **we cannot calculate true monthly margins** because:

1. **Xero is on implicit cash-basis** — expenses hit when paid, not when incurred. Revenue is recognized on invoice, but costs aren't matched to the periods they belong to.
2. **The Sheets P&L structure doesn't match Xero's chart of accounts** — making reconciliation manual and error-prone.
3. **COGS aren't tracked** — gross margin is meaningless without separating direct costs (AI APIs, hosting, contractor labor for client work) from operating expenses.
4. **$97K in Professional Fees is undifferentiated** — founder comp, QA, social media, and actual professional fees are in one bucket.

**The fix must flow in one direction: Xero (source of truth) → Sheets (reporting model) → Orbit (planning interface).**

Xero needs to be corrected to proper accrual standards first. Then the Sheets P&L must be restructured to mirror Xero's account structure. Only then can Orbit's forecasts be meaningfully compared to actuals.

## Architecture: Data Flow

```
Xero (Source of Truth)
  ├── Accrual-basis P&L with proper COGS, OpEx, margin calculation
  ├── Balance Sheet (assets, liabilities, equity)
  └── AR/AP aging, cash position

      ↓ (Claude Code MCP: monthly reconciliation)

Sheets Financial Model (Reporting + Forecasting)
  ├── Monthly P&L: mirrors Xero structure (Revenue → COGS → Gross Margin → OpEx → Net Income)
  ├── Actuals columns populated from Xero
  ├── Forecast columns for forward planning
  └── Variance analysis (actual vs forecast)

      ↓ (Apps Script sync: weekly allocations)

Orbit (Planning Interface)
  ├── Weekly hour allocation by opportunity
  ├── IRR / resource planning based on Sheets forecasts
  └── Lock-in summaries → invoice generation
```

## Monthly Margin Calculation (Target State)

For each month, Xero should produce this structure:

```
SERVICE REVENUE
  Dayforce Contract Revenue ............... $25,000
  Mystica Retainer ........................ $13,000
  Mystica Profit Share .................... $8,293
  Sprint Zero / Impl Readiness ........... $12,500
  ─────────────────────────────────────────────────
  TOTAL REVENUE .......................... $58,793

COST OF GOODS SOLD (Direct Costs)
  Contract Labor — Robert (client work %) . $10,500    ← accrual: % of hours on client work
  Contract Labor — Jonathan (client work %) $10,500    ← accrual: % of hours on client work
  Contract Labor — QA ..................... $2,800
  AI/ML API Costs ........................ $115       ← direct cost of service delivery
  Hosting & Infrastructure ............... $350       ← direct cost of service delivery
  ─────────────────────────────────────────────────
  TOTAL COGS ............................. $24,265

GROSS PROFIT ............................. $34,528
GROSS MARGIN ............................. 58.7%

OPERATING EXPENSES
  Wages & Salaries (W2) .................. $2,000
  Payroll Taxes .......................... $400
  Software & Subscriptions ............... $220       ← Claude, dev tools (not client-facing)
  Software & Web ......................... $350       ← internal hosting, domains
  Advertising & Marketing ................ $500       ← Instantly, Apollo, ACQ, content
  Professional Fees ...................... $0         ← legal, accounting (actual fees only)
  Telephone & Internet ................... $136
  Bank Fees .............................. $15
  Filing & Registration .................. $20
  ─────────────────────────────────────────────────
  TOTAL OPEX ............................. $3,641

NET INCOME ............................... $30,887
NET MARGIN ............................... 52.5%
```

**Why this matters:** Without COGS separation, gross margin appears to be 100% (revenue minus nothing). With it, you can see that ~41% of revenue goes to direct delivery costs, leaving 59% gross margin. This is the number that tells you whether your services business is healthy and scalable.

**Accrual accounting implications:**
- **Revenue recognition:** Revenue recognized when service is delivered (monthly), not when invoice is paid. Dayforce $25K is Feb revenue even if paid in March.
- **Expense matching:** Contractor comp allocated to the month the work was performed, not when the Rippling payment clears. If Jonathan works 60% on Dayforce in March, 60% of his March comp is COGS.
- **Prepaid expenses:** Annual subscriptions (Namecheap $550, 1Password $239) should be amortized monthly, not expensed in the month paid.
- **Accrued expenses:** If QA contractor works in March but isn't paid until April, the expense accrues in March.

## Xero State of the Books (Verified Apr 8, 2026)

### Balance Sheet
| Item | Amount |
|------|--------|
| Cash (Chase Business Checking) | $36,458 |
| Accounts Receivable | $75,000 (3x Dayforce $25K) |
| Total Assets | $111,458 |
| Due to Director (820) | $32,475 (Robert capital injections) |
| Retained Earnings | -$19,702 (2025 loss) |
| Current Year Earnings | $98,685 |
| Net Income | $78,983 |

### P&L (Current — Before Cleanup)
| Line | Amount | Issue |
|------|--------|-------|
| Sale of Goods (4000) | $112,795 | Should be Service Revenue — EM sells services |
| Service Revenue (4100) | $76,100 | Only partial revenue here |
| Professional Fees (6290) | $97,400 | Catch-all: 1099 comp + QA + social media + actual fees |
| Wages & Salaries (6450) | $10,039 | W2 comp only (Rippling) |
| Payroll Taxes (6360) | $1,468 | Correct |
| Software & Web (6340) | $151 | Massively understated — $11K+ on personal cards |
| Bank Fees (6030) | $176 | Correct |
| Filing & Registration (525) | $679 | Correct |
| **COGS accounts** | **$0** | **Nothing classified as direct costs** |
| **Gross Margin** | **100%** | **Meaningless — no COGS tracked** |

### Contacts (11)
Dayforce US Inc., Tom Cote, Robert Ta, Jonathan McCoy, Jonathan, Xero, Rippling, Chase, ThirstySprout (QA), Slack, Government

**Missing:** Relationship Psychics (Mystica entity), Contra/Benjamin, Anthropic, Intapp

### Invoices
- INV-0009: Tom Cote $21,658 — PAID (Mystica profit share)
- INV-0010: Dayforce $25,000 — AUTHORISED (Mar 2026)
- 8x Rippling bills — all VOIDED
- $75K AR = 3 outstanding Dayforce invoices

### Bank Transactions
Chase only. ~10 transactions: Rippling payroll, ThirstySprout QA, Slack, Xero sub, Government filings.

## Expense Sheet (Jonathan's Reconciliation)

182 transactions, Jul'25 → Apr'26, $37,906 across 3 personal cards (5071, 3605, 4262).
- Business ops: $11,301
- ACQ Community (lead gen): $12,000
- Social media contractor (Contra/Benjamin): $14,604 — ended Mar'26

## Salary Structure

| Period | Robert | Jonathan |
|--------|--------|----------|
| Jul-Dec 2025 | $0 | $1K W2 + $9K 1099 = $10K/mo |
| Jan-Feb 2026 | $1K W2 + $9K 1099 = $10K/mo | Same |
| Mar 2026 | $1K W2 + $4K 1099 = $5K/mo | $1K W2 + $14K 1099 = $15K/mo |
| Apr-Aug 2026 | $1K W2 + $14K 1099 = $15K/mo | Same |
| Sep+ 2026 | $18.75K total (split TBD) | Same |

## Identified Issues (Priority Order — Revised)

### P0: Xero Accounting Standards (Do First)
1. **No COGS tracking** — gross margin calculation impossible
2. **Cash-basis accounting** — need accrual adjustments for accurate monthly margins
3. **Professional Fees catch-all** — $97K undifferentiated
4. **Revenue misclassified** — $112K in Sale of Goods should be Service Revenue
5. **$11K personal card expenses not journaled**
6. **$32K equity misclassified** as director loan

### P1: Sheets Model Restructuring (After Xero is Clean)
7. **Sheets P&L structure doesn't match Xero** — needs Revenue → COGS → Gross Margin → OpEx → Net Income
8. **Expense Detail uses budgets, not actuals**
9. **Balance Sheet empty**
10. **Cash position static**

### P2: Workflow Automation (After Model Aligned)
11. **Manual reconciliation** — needs Claude Code workflows
12. **Manual invoicing** — needs lock-in → invoice pipeline
13. **Missing contacts** — Relationship Psychics, Intapp (closing ~Apr 22)

## Recommendation

**Phase 0 (Xero cleanup) must complete before any reconciliation workflows are meaningful.** The Sheets P&L must be restructured to match Xero's account hierarchy so that monthly actuals from Xero drop directly into the model without manual mapping.

Priority order:
1. Fix Xero: proper COGS, accrual adjustments, expense classification, equity realization
2. Restructure Sheets P&L to mirror Xero (Revenue → COGS → Gross Margin → OpEx → Net Income)
3. Build reconciliation workflows that write Xero actuals into Sheets
4. Orbit remains the planning/IRR interface, reading from Sheets forecasts

## Resolved Questions

- [x] Mystica entity → **Relationship Psychics**
- [x] Capital injections → **Equity purchase** (not convertible note) → APIC (3200)
- [x] ACQ Community → **Lead gen** → Advertising (6000)
- [x] Revenue classification → All current = **Service Revenue (4100)**. Future software revenue gets new account.
- [x] Social media contractor → **Ended** (Mar final payment)
- [x] ThirstySprout → Already in Xero, paid from business account
- [x] Stripe → **No Stripe revenue.** Ignore.
- [x] Intapp → **Closing ~Apr 22.** Create contact now.
- [x] Sheets approach → **Restate to Xero actuals, then forward-looking**
- [ ] Sep'26 comp W2/1099 split (non-blocking)
