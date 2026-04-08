# PR #5: xero-financial-reconciliation - Research

**Created**: 2026-04-07
**Updated**: 2026-04-08
**Author**: @robertta
**Branch**: `feature/pr-5-xero-financial-reconciliation`
**Linear**: CLA-135

## Problem Statement

Clarity Orbit syncs weekly hour allocations to Google Sheets, which houses the full Epistemic Me financial model. But the model is disconnected from actual books in Xero, and Xero itself has classification problems that prevent accurate financial reporting.

**Three-way gap:** Orbit (hours) → Sheets (forecasts) → Xero (actuals) are disconnected, and each has data quality issues.

## Context Gathered

### Xero State of the Books (Verified Apr 8, 2026)

**Balance Sheet:**
| Item | Amount |
|------|--------|
| Cash (Chase Business Checking) | $36,458 |
| Accounts Receivable | $75,000 (3x Dayforce $25K) |
| Total Assets | $111,458 |
| Due to Director (820) | $32,475 (Robert capital injections) |
| Retained Earnings | -$19,702 (2025 loss) |
| Current Year Earnings | $98,685 |
| Net Income | $78,983 |

**P&L:**
| Line | Amount | Issue |
|------|--------|-------|
| Sale of Goods (4000) | $112,795 | Should be Service Revenue — EM sells services, not goods |
| Service Revenue (4100) | $76,100 | Only partial revenue classified here |
| Professional Fees (6290) | $97,400 | Catch-all: lumps 1099 comp + QA + social media + actual professional fees |
| Wages & Salaries (6450) | $10,039 | W2 comp only (Rippling) |
| Payroll Taxes (6360) | $1,468 | Correct |
| Software & Web (6340) | $151 | Massively understated — $11K+ on personal cards not entered |
| Bank Fees (6030) | $176 | Correct |
| Filing & Registration (525) | $679 | Correct |

**Contacts (11):** Dayforce US Inc., Tom Cote, Robert Ta, Jonathan McCoy, Jonathan, Xero, Rippling, Chase, ThirstySprout (QA), Slack, Government

**Missing contacts:** Mystica (no contact exists!), Contra/Benjamin (social media), Anthropic, Intapp

**Invoices:**
- INV-0009: Tom Cote $21,658 — PAID (Mystica profit share via Tom)
- INV-0010: Dayforce $25,000 — AUTHORISED (Mar 2026, due May 6)
- 8x Rippling bills — all VOIDED (payroll was restructured)
- $75K in AR = 3 outstanding Dayforce invoices (Feb, Mar, Apr)

**Bank Transactions (Chase only):** Rippling payroll, ThirstySprout QA contractor, Slack, Xero subscription, Government filings. Only ~10 transactions entered.

### Expense Sheet (Jonathan's Reconciliation)

182 transactions, Jul 2025 → Apr 2026, totaling $37,906 across 3 personal cards:
- Card 5071: Jul-Oct 2025
- Card 3605: Nov 2025 → present (primary)
- Card 4262: Cloudflare, Claude, Google Workspace (secondary)

**Summary:**
- Actual business ops: $11,301 (excluding community + socials)
- ACQ Community: $12,000 (4x $3K quarterly, 1 refund)
- Social Media Contractor (Contra/Benjamin): $14,604

**Key expense categories vs Sheets model:**
| Category | Monthly Budget (Sheets) | Actual Monthly Avg | Gap |
|----------|------------------------|-------------------|-----|
| Hosting (Render/Vercel/AWS/CF/Supabase/Hetzner) | $145 | ~$350 | +140% |
| Google Workspace | $24 | ~$75 | +212% |
| Dev Tools (Cursor/Lovable/Base44/Obsidian/GitHub/Magic) | not budgeted | ~$150 | Missing |
| AI/ML APIs (Anthropic/OpenAI/Moonshot/Kimi) | not budgeted | ~$115 | Missing |
| Sales/Marketing (Instantly/Apollo/Senja) | not budgeted | ~$95 | Missing |
| Claude subscriptions | $400 | ~$220 | -45% (dropped a plan) |

### Salary Structure (Confirmed by Robert)

| Period | Robert | Jonathan |
|--------|--------|----------|
| Jul-Dec 2025 | $0 | $1K W2 + $9K 1099 = $10K/mo |
| Jan-Feb 2026 | $1K W2 + $9K 1099 = $10K/mo | $1K W2 + $9K 1099 = $10K/mo |
| Mar 2026 | $1K W2 + $4K 1099 = $5K/mo | $1K W2 + $14K 1099 = $15K/mo |
| Apr-Aug 2026 | $1K W2 + $14K 1099 = $15K/mo | $1K W2 + $14K 1099 = $15K/mo |
| Sep-Dec 2026 | $18.75K/mo total (split TBD) | $18.75K/mo total (split TBD) |

Paid via Rippling. W2 goes to Wages & Salaries (6450). 1099 goes to Professional Fees (6290) — this is the main reason 6290 is $97K.

### Cofounder's Accounting Standardization Plan

Key items from Jonathan's reconciliation document:
1. **Liability reconciliation:** Journal $11,301 personal card expenses → Account 820 (Due to Director)
2. **COGS audit:** Move AI APIs ($1,036) and hosting ($1,371) from general expenses to COGS accounts
3. **Contractor sync:** Verify social media contractor ($14,604) in Xero Professional Fees
4. **AR tracking:** $75,000 owed by Dayforce (confirmed in Xero)
5. **Cash burn bridge:** $36,458 bank balance vs monthly burn
6. **Revenue reconciliation:** Match Xero Account 4000 ($112K) to Stripe logs
7. **Convertible note:** Reclassify Account 820 ($32,475) from director loan to Convertible Notes Payable
8. **CAC tracking:** Break out social media + community costs from Professional Fees into Marketing accounts

### Existing System (Orbit → Sheets)
- Orbit writes to Sheets via Apps Script proxy (`src/lib/sheetSync.ts`)
- Synced tabs: `Orbit:Team`, `Orbit:Opportunities`, `Orbit:Week:*`, `Orbit:DemandGen`, `Orbit:LockInLog`
- Financial model tabs consume Orbit data via Sheet formulas
- Spreadsheet: `1mUh7a0AwH8t4U1eEJTVatbBsAujAh0pnQH8zAQ6-e6s` (21 tabs)
- Expense sheet: `1Cv0WU2gslfIQLhBdblKHEs2_AhkN7AIASVVnCyMI29A` (Jonathan's reconciliation)

### Xero MCP Setup
- Custom Connection app: "EM Bookkeeper 9000"
- Credentials in 1Password: `op://Clarity-Claw/Xero MCP App`
- Configured at user scope in `.claude.json`
- Scope patch required: payroll scopes removed (US org, payroll via Rippling not Xero)
- Patch location: `~/.npm/_npx/2b97e4bc92a65d02/node_modules/@xeroapi/xero-mcp-server/dist/clients/xero-client.js`

## Identified Issues (Priority Order)

### P0: Xero Classification Errors
1. **Revenue misclassified:** $112K in "Sale of Goods" should be "Service Revenue"
2. **Professional Fees is a catch-all:** $97K lumps 1099 comp + QA + social media + actual professional fees
3. **$11K+ personal card expenses not journaled:** Software, hosting, tools on personal cards not in Xero
4. **Convertible note misclassified:** $32K in Account 820 should be Convertible Notes Payable

### P1: Financial Model Drift
5. **Sheets Expense Detail wildly inaccurate:** Budgets $649/mo tooling, actual is ~$1,100/mo
6. **Sheets Balance Sheet entirely empty:** Xero has $111K in assets
7. **Cash position static:** Sheets says $30K, Xero says $36,458
8. **Salary model vs reality:** Sheets budgets $10-18.75K/mo, actual varies by period

### P2: Missing Infrastructure
9. **Missing Xero contacts:** Mystica, Contra/Benjamin, Anthropic, Intapp
10. **No COGS tracking:** AI APIs + hosting should be direct costs, not general expenses
11. **No CAC tracking:** Marketing spend buried in Professional Fees

## Recommendation

**Option C: Hybrid approach** (unchanged from original research, validated by Xero discovery).

Claude Code MCP workflows handle all Xero operations. Sheets model gains Actuals columns. But we now add a **Phase 0: Xero Cleanup** to fix classification issues before reconciliation can be meaningful.

## Open Questions (Updated)

- [x] What's currently set up in Xero? → 119 accounts, 11 contacts, $189K revenue, $110K expenses
- [x] Does Xero have bank feed connected? → Chase checking connected, transactions being entered
- [ ] Should invoices be created as DRAFT or AUTHORISED? (recommend DRAFT for review)
- [ ] What's the desired frequency for reconciliation? Monthly? (recommend monthly close)
- [x] Should we add an "Actuals" tab or actuals columns? → Actuals columns alongside forecast
- [ ] How should Mystica revenue be split? Tom Cote is the contact, not "Mystica" — need clarification
- [ ] Is the convertible note agreement signed? Need to attach to journal entry
- [ ] Should ACQ Community ($12K) be classified as Marketing or Professional Development?
