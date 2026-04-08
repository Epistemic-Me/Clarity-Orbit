# PR #5: xero-financial-reconciliation - Plan

**Created**: 2026-04-07
**Based on**: [RESEARCH.md](./RESEARCH.md)
**Branch**: `feature/pr-5-xero-financial-reconciliation`
**Linear**: CLA-135

## Chosen Approach

Hybrid: Claude Code conversational workflows (Xero MCP + Google Workspace MCP) that write actuals into the Sheets financial model. No new Orbit application code — this is an AI-native operations layer.

## Scope

### In Scope
- Xero discovery: validate current state (contacts, accounts, invoices)
- Monthly P&L reconciliation workflow (Xero actuals vs Sheets forecast)
- Invoice generation from Orbit lock-in data
- Cash position / runway sync from Xero
- Expense drift detection
- Sheet structure changes to support actuals columns

### Out of Scope
- Automated scheduling (cron/triggers) — manual Claude Code commands for now
- Orbit UI changes — no new buttons or views in the React app
- Xero bank feed setup — assumed to be configured separately
- Payroll integration — contractor payments tracked but not automated
- Multi-currency support

## Technical Design

### Changes Required

| File | Change | Why |
|------|--------|-----|
| Google Sheet: Monthly P&L | Add "Actual" columns alongside forecast | Enable variance tracking |
| Google Sheet: Runway & KPIs | Wire AR/AP/Cash to pull from Actuals | Real-time financial health |
| Google Sheet: Balance Sheet | Populate with Xero-derived data | Currently entirely empty |
| Google Sheet: Expense Detail | Add "Actual" column per month | Drift detection |

### New Files

| File | Purpose |
|------|---------|
| `docs/workflows/monthly-reconciliation.md` | Runbook for monthly close workflow |
| `docs/workflows/invoice-generation.md` | Runbook for lock-in → invoice workflow |
| `docs/workflows/cash-pulse.md` | Runbook for on-demand cash position check |
| `docs/workflows/expense-audit.md` | Runbook for expense drift detection |

## Implementation Order

1. **Phase 1: Xero Discovery** — Pull current Xero state (contacts, accounts, invoices, balances) to understand baseline
2. **Phase 2: Sheet Structure** — Add Actuals columns to Monthly P&L and Expense Detail
3. **Phase 3: Reconciliation Workflow** — Build and test monthly P&L reconciliation
4. **Phase 4: Invoice Workflow** — Build lock-in → draft invoice generation
5. **Phase 5: Cash Pulse Workflow** — Build on-demand cash position sync
6. **Phase 6: Runbook Documentation** — Document all workflows for repeatable use

## Testing Strategy

### Phase 1: Read-Only Validation (Safe)
- [ ] `list-contacts`: Verify Dayforce (Ceridian), Mystica exist as Xero contacts
- [ ] `list-invoices`: Verify invoice history matches known billing periods
- [ ] `list-accounts`: Verify chart of accounts has expected categories
- [ ] `list-bank-transactions`: Verify expense transactions match Expense Detail categories
- [ ] `list-aged-receivables-by-contact`: Verify AR matches outstanding invoices
- [ ] `list-profit-and-loss`: Compare Xero P&L vs Sheets P&L for overlapping periods
- [ ] `list-report-balance-sheet`: Get baseline balance sheet from Xero

### Phase 2: Write Validation (Careful)
- [ ] Create a DRAFT invoice for a known billing period — verify line items, amounts, contact
- [ ] Verify the draft invoice matches what would be manually created
- [ ] Delete/void the test draft after validation
- [ ] Create a test contact (Intapp) — verify fields populated correctly
- [ ] Run reconciliation workflow twice — verify no duplicate sheet entries

### Phase 3: Workflow Validation
- [ ] Monthly reconciliation: Run for Mar'26, verify actuals match Xero, variances flagged
- [ ] Invoice generation: Use 3/30 lock-in data, verify Mystica invoice amounts
- [ ] Cash pulse: Verify bank balance, AR, AP populate Runway & KPIs correctly
- [ ] Expense audit: Verify drift detection catches intentional test variance

### Phase 4: End-to-End
- [ ] Full monthly close: lock-in → invoice → payment → reconcile → runway update
- [ ] Verify all Sheets tabs reflect consistent, accurate data after workflow

## Rollback Plan

- All Xero invoices created as DRAFT (not sent) — can be deleted
- Sheet changes are additive (new columns) — existing formulas unaffected
- Workflow runbooks are documentation only — no code dependencies
- Git revert of sheet structure changes if needed

## Definition of Done

- [ ] Xero state validated and documented
- [ ] Sheet structure updated with Actuals support
- [ ] All 4 workflows tested against real data
- [ ] Runbook documentation complete
- [ ] GitHub PR created and reviewed
- [ ] Linear CLA-135 moved to Done
