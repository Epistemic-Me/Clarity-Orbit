# PR #5: xero-financial-reconciliation - Plan

**Created**: 2026-04-07
**Updated**: 2026-04-08
**Based on**: [RESEARCH.md](./RESEARCH.md)
**Branch**: `feature/pr-5-xero-financial-reconciliation`
**Linear**: CLA-135

## Chosen Approach

Hybrid: Claude Code conversational workflows (Xero MCP + Google Workspace MCP) that clean up Xero classifications, journal personal card expenses, and write actuals into the Sheets financial model. Phase 0 added to fix Xero data quality before reconciliation.

## Scope

### In Scope
- **Phase 0:** Xero cleanup — reclassify revenue, break up Professional Fees, journal personal card expenses, reclassify convertible note, create missing contacts
- **Phase 1:** Monthly P&L reconciliation workflow (Xero actuals vs Sheets forecast)
- **Phase 2:** Invoice generation from Orbit lock-in data
- **Phase 3:** Cash position / runway sync from Xero → Sheets
- **Phase 4:** Expense drift detection (personal cards vs Xero vs Sheets budget)
- **Phase 5:** Update Sheets financial model with actuals
- **Phase 6:** Workflow runbook documentation

### Out of Scope
- Automated scheduling (cron/triggers) — manual Claude Code commands for now
- Orbit UI changes — no new buttons or views in the React app
- Payroll automation — Rippling handles payroll, Xero records it
- Multi-currency support
- Stripe → Xero reconciliation (future work)

## Technical Design

### Phase 0: Xero Cleanup

#### 0a. Revenue Reclassification
Reclassify $112,795 from Sale of Goods (4000) → Service Revenue (4100). EM sells consulting services, not goods.
- **Method:** Manual journal entries or invoice edits in Xero
- **Risk:** Low — accounting reclassification, no cash impact

#### 0b. Break Up Professional Fees ($97,400)
Current state: Account 6290 lumps together 1099 contractor comp, QA, social media, and actual professional fees.

**Target classification:**
| What | Current Account | Target Account | Monthly Amount |
|------|----------------|----------------|----------------|
| Robert 1099 comp | Professional Fees (6290) | Contract Labor (6090) | $4-14K/mo |
| Jonathan 1099 comp | Professional Fees (6290) | Contract Labor (6090) | $9-14K/mo |
| QA contractor (ThirstySprout) | Professional Fees (6290) | Contract Labor (6090) | $1,400-2,800/mo |
| Social media (Contra/Benjamin) | Professional Fees (6290) | Advertising (6000) | ~$4,800/mo |
| Actual professional fees | Professional Fees (6290) | Professional Fees (6290) | Keep here |

- **Method:** Journal entries: Debit target accounts, Credit 6290
- **Risk:** Medium — need to identify exact amounts per category from bank transactions

#### 0c. Journal Personal Card Expenses ($11,301)
182 transactions on personal cards (5071, 3605, 4262) need to be entered.

**Category mapping to Xero accounts:**
| Expense Sheet Category | Xero Account | Code |
|----------------------|-------------|------|
| AI/ML Subscriptions | Dues and Subscriptions | 6110 |
| AI/ML APIs | Cost of Goods Sold | 5000 |
| Dev Tools, Dev Tools/Security | Software & Web | 6340 |
| Hosting | Software & Web | 6340 |
| Team Tools (Slack/Google) | Software & Web | 6340 |
| Sales/Marketing, Sales/CRM | Advertising | 6000 |
| Business Services, Legal, Tax, HR | Professional Fees | 6290 |
| Domain | Software & Web | 6340 |
| Email Service | Software & Web | 6340 |
| Contractor - Social Media | Advertising | 6000 |
| Community Membership (ACQ) | Training and Conferences | 6400 |
| Content/Video, AI Video | Advertising | 6000 |
| Internet, Coworking | Telephone and Internet | 6390 |

- **Method:** Journal entry: Debit various expense accounts $11,301, Credit Due to Director (820) $11,301
- **Note:** This increases 820 from $32,475 to $43,776
- **Risk:** Low — standard director expense reimbursement accounting

#### 0d. Convertible Note Reclassification
Move $32,475 from Account 820 (Due to Director) → Loans From Shareholder (2550).
- **Method:** Journal entry: Debit 820 $32,475, Credit 2550 $32,475
- **Note:** After 0c journaling, 820 will have $43,776. Only the original $32,475 capital injection moves to 2550. The $11,301 personal card reimbursement stays in 820 as a true director reimbursement.
- **Risk:** Low — need to confirm convertible note agreement is signed

#### 0e. Create Missing Contacts
| Contact | Type | Purpose |
|---------|------|---------|
| Mystica AI | Customer | Retainer + profit share invoicing |
| Contra / Benjamin | Supplier | Social media contractor |
| Anthropic | Supplier | AI API and subscription costs |
| Intapp | Prospect | Future client (discovery stage) |

#### 0f. COGS Setup
Move AI/ML API costs ($1,036 from expense sheet) to Cost of Goods Sold (5000).
Move hosting costs ($1,371 from expense sheet) to COGS or keep in Software & Web with tracking.
- **Why:** These are direct costs of delivering services to Dayforce/Mystica, not overhead

### Phase 1-5: Reconciliation Workflows (unchanged approach)

#### Workflow 1: Monthly Reconciliation
```
Trigger: "Reconcile {month}" in Claude Code
1. Pull Xero P&L for period (list-profit-and-loss)
2. Pull Xero balance sheet (list-report-balance-sheet)
3. Read Sheets Monthly P&L forecast columns
4. Compare actuals vs forecast, produce variance report
5. Write actuals into Sheets "Actual" columns
```

#### Workflow 2: Invoice from Lock-Ins
```
Trigger: "Generate invoices for {month}" in Claude Code
1. Read Orbit:LockInLog from Sheets
2. Sum hours by client for billing period
3. Dayforce: $25K flat (create-invoice)
4. Mystica: $13K retainer + calculated profit share (create-invoice)
5. Create as DRAFT for human review
```

#### Workflow 3: Cash Pulse
```
Trigger: "Cash position" in Claude Code
1. Pull Xero bank balance (list-report-balance-sheet)
2. Pull AR (list-aged-receivables-by-contact) — currently $75K Dayforce
3. Pull AP (list-aged-payables-by-contact)
4. Write to Sheets Runway & KPIs: real cash, AR, AP
5. Flag overdue invoices
```

#### Workflow 4: Expense Audit
```
Trigger: "Audit expenses for {month}" in Claude Code
1. Pull Xero bank transactions for period
2. Read expense sheet for same period
3. Read Sheets Expense Detail budgets
4. Three-way compare: Xero actuals vs expense sheet vs budget
5. Flag variances > 10%, missing entries, uncategorized items
```

### Changes Required

| Target | Change | Why |
|--------|--------|-----|
| Xero: Revenue accounts | Reclassify 4000 → 4100 | Services, not goods |
| Xero: Professional Fees | Break $97K into 6090/6000/6290 | Accurate comp vs marketing vs professional fees |
| Xero: Account 820 | Journal $11K personal expenses, reclassify $32K to 2550 | Director reimbursement + convertible note |
| Xero: Contacts | Add Mystica, Contra, Anthropic, Intapp | Missing from ledger |
| Xero: COGS | Categorize AI APIs as direct costs | Accurate gross margin |
| Sheets: Monthly P&L | Add "Actual" columns alongside forecast | Variance tracking |
| Sheets: Expense Detail | Replace budgets with actuals-derived amounts | Accurate burn tracking |
| Sheets: Runway & KPIs | Wire to Xero actuals (cash, AR, AP) | Real-time financial health |
| Sheets: Balance Sheet | Populate from Xero balance sheet | Currently all $0s |

### New Files

| File | Purpose |
|------|---------|
| `docs/workflows/monthly-reconciliation.md` | Runbook for monthly close |
| `docs/workflows/invoice-generation.md` | Runbook for lock-in → invoice |
| `docs/workflows/cash-pulse.md` | Runbook for cash position check |
| `docs/workflows/expense-audit.md` | Runbook for three-way expense comparison |
| `docs/workflows/xero-mcp-setup.md` | Setup guide: Custom Connection, scope patch, 1Password |

## Implementation Order

1. **Phase 0a:** Revenue reclassification (Sale of Goods → Service Revenue)
2. **Phase 0b:** Break up Professional Fees into Contract Labor + Advertising
3. **Phase 0c:** Journal personal card expenses ($11,301) → Account 820
4. **Phase 0d:** Reclassify convertible note ($32,475) → Account 2550
5. **Phase 0e:** Create missing contacts (Mystica, Contra, Anthropic, Intapp)
6. **Phase 0f:** Set up COGS tracking for AI APIs + hosting
7. **Phase 1:** Build and test monthly P&L reconciliation workflow
8. **Phase 2:** Build lock-in → draft invoice generation workflow
9. **Phase 3:** Build cash pulse workflow (Xero → Sheets Runway & KPIs)
10. **Phase 4:** Build three-way expense audit workflow
11. **Phase 5:** Update Sheets financial model with Xero actuals
12. **Phase 6:** Document all workflows as runbooks

## Testing Strategy

### Phase 0: Xero Cleanup Validation
- [x] `list-accounts`: Verified 119 accounts, identified correct target accounts
- [x] `list-contacts`: Verified 11 contacts, identified 4 missing
- [x] `list-invoices`: Verified 10 invoices (1 paid, 1 authorised, 8 voided Rippling)
- [x] `list-profit-and-loss`: Verified $189K revenue, $110K expenses, $79K net income
- [x] `list-report-balance-sheet`: Verified $36K cash, $75K AR, $32K director loan
- [x] `list-bank-transactions`: Verified Chase transactions (Rippling, ThirstySprout, Slack, Xero, Gov)
- [ ] After reclassification: P&L shows $0 in Sale of Goods, all in Service Revenue
- [ ] After breakup: Professional Fees < $10K, Contract Labor shows comp amounts
- [ ] After journaling: Account 820 increased by $11,301
- [ ] After convertible note move: 820 reduced by $32,475, 2550 shows $32,475
- [ ] Missing contacts created and verified

### Phase 1-4: Workflow Validation
- [ ] Monthly reconciliation: Run for Mar'26, verify actuals match Xero, variances flagged
- [ ] Invoice generation: Generate Dayforce Apr invoice, verify $25K amount and contact
- [ ] Cash pulse: Verify $36,458 cash, $75K AR populate Runway & KPIs
- [ ] Expense audit: Three-way compare catches known discrepancies (tooling budget $649 vs $1,100 actual)

### Phase 5: Sheets Model Validation
- [ ] Monthly P&L actual columns match Xero P&L report
- [ ] Balance Sheet populated: $111K assets, $32K liabilities, $79K equity
- [ ] Runway & KPIs shows real cash ($36K), real AR ($75K), calculated runway
- [ ] Expense Detail reflects actual category spending, not budgeted

### End-to-End
- [ ] Full monthly close: lock-in → invoice → Xero sync → reconcile → Sheets update
- [ ] Financial model and Xero agree on all major line items

## Rollback Plan

- All Xero journal entries can be reversed with counter-entries
- Revenue reclassification is journal entries — reversible
- Contact creation is additive — no destructive changes
- Sheet changes are additive (new columns) — existing formulas unaffected
- All workflows are Claude Code commands — no deployed code dependencies
- Git revert of documentation changes if needed

## Definition of Done

- [ ] Xero revenue correctly classified as Service Revenue
- [ ] Professional Fees broken into Contract Labor + Advertising + actual fees
- [ ] Personal card expenses journaled to correct accounts
- [ ] Convertible note reclassified to Loans From Shareholder
- [ ] Missing contacts created
- [ ] COGS tracking operational
- [ ] All 4 workflows tested against real data
- [ ] Sheets financial model reflects Xero actuals
- [ ] Runbook documentation complete
- [ ] GitHub PR reviewed and merged
- [ ] Linear CLA-135 moved to Done
