# PR #5: xero-financial-reconciliation - Research

**Created**: 2026-04-07
**Author**: @robertta
**Branch**: `feature/pr-5-xero-financial-reconciliation`
**Linear**: CLA-135

## Problem Statement

Clarity Orbit syncs weekly hour allocations to Google Sheets, which houses the full Epistemic Me financial model (Monthly P&L, Cash Flow Waterfall, Expense Detail, Runway & KPIs, Balance Sheet, Sales Pipeline). But the model is entirely disconnected from actual books in Xero:

- Balance Sheet is all $0s — no real assets/liabilities tracked
- Cash position is a static $30K input, not live bank balance
- Expense Detail lists budgeted amounts ($400/mo Claude, $100/mo Render) — never validated against actuals
- Cash Flow Waterfall assumes perfect Net-30 collection — doesn't reflect real payment patterns
- Invoices for Dayforce ($25K/mo) and Mystica ($13K retainer + profit share) are created manually

The result: the financial model drifts from reality over time, and founders make capital allocation decisions in Orbit based on projections that may not match the actual financial state.

## Context Gathered

### Existing System (Orbit → Sheets)
- Orbit writes to Sheets via Apps Script proxy (`src/lib/sheetSync.ts`)
- Synced tabs: `Orbit:Team`, `Orbit:Opportunities`, `Orbit:Week:*`, `Orbit:DemandGen`, `Orbit:LockInLog`
- Financial model tabs (P&L, Cash Flow, etc.) consume Orbit data via Sheet formulas
- Apps Script project: `1Ea2gdGOSDr534PmA55NZ_GPEwHgcVJ5frcC-fVNjKTljDWP0x-S8a3f2`
- Spreadsheet: `1mUh7a0AwH8t4U1eEJTVatbBsAujAh0pnQH8zAQ6-e6s` (21 tabs)

### Available MCP Tools
- **Xero MCP**: list-invoices, create-invoice, list-bank-transactions, list-accounts, list-contacts, create-contact, create-payment, list-aged-receivables-by-contact, list-aged-payables-by-contact, list-profit-and-loss, list-report-balance-sheet, list-trial-balance
- **Google Workspace MCP**: read-sheet-values, modify-sheet-values, append-table-rows

### Financial Model Structure
| Sheet | Purpose | Current State |
|-------|---------|---------------|
| Monthly P&L | 18-month forecast Jul'25-Dec'26 | Forecast only, no actuals column |
| Expense Detail | Line-item recurring costs | Budgeted amounts, not validated |
| Cash Flow Waterfall | Cash in/out with Net-30 lag | Assumes perfect collections |
| Runway & KPIs | Dashboard with cash, MRR, margins | Static inputs, KPI formulas broken |
| Balance Sheet | Assets = Liabilities + Equity | Entirely empty ($0) |
| Sales Pipeline | Dayforce, Mystica, Intapp | Manual stage tracking |
| Orbit:LockInLog | Weekly hour summaries | 3 entries (3/16, 3/23, 3/30) |

### Revenue Streams
- **Dayforce**: $25K/mo contract, 90% confidence, starts Jan'26
- **Mystica**: $13K/mo retainer + 35% profit share, 85% confidence, active Nov'25
- **Intapp**: $30K/mo potential, 35% probability, discovery stage
- **PEPM Profit Share**: Starts Oct'26, $2.5K growing to $7.5K/mo

## Options Considered

### Option A: Claude Code Conversational Workflows (MCP-only)
- **Approach**: Build workflows that run entirely through Claude Code using Xero MCP + Google Workspace MCP. No new application code — just conversational commands like "reconcile March" or "generate invoices".
- **Pros**: Zero code to maintain, works today with existing MCP tools, naturally AI-native
- **Cons**: No automation (requires manual trigger each time), depends on MCP server availability
- **Effort**: Low

### Option B: Apps Script Extension
- **Approach**: Extend the existing Apps Script to call Xero API directly. Add menu items in Google Sheets for reconciliation, invoice generation.
- **Pros**: Runs inside Sheets (familiar), could be scheduled via triggers
- **Cons**: Xero OAuth in Apps Script is complex, separate codebase from Orbit, harder to iterate
- **Effort**: High

### Option C: Hybrid — Claude Code Workflows + Sheet Formulas
- **Approach**: Use Claude Code MCP workflows for Xero operations (read actuals, create invoices), write results to dedicated "Actuals" columns/tabs in Sheets. Sheet formulas then compute variances automatically.
- **Pros**: Best of both — AI handles the Xero integration, Sheets handles the math, Orbit stays focused on allocation
- **Cons**: Requires adding Actuals columns to existing sheet structure
- **Effort**: Medium

## Recommendation

**Option C: Hybrid approach.** The conversational workflows handle all Xero interaction (no OAuth complexity), while the Sheets model gains Actuals columns that enable automatic variance tracking. This keeps Orbit as the allocation tool, Sheets as the financial model, and Claude Code as the reconciliation engine.

## Open Questions

- [ ] What's currently set up in Xero? (contacts, chart of accounts, existing invoices)
- [ ] Does Xero have bank feed connected, or are transactions entered manually?
- [ ] Should invoices be created as DRAFT or AUTHORISED in Xero?
- [ ] What's the desired frequency for reconciliation? Monthly? Weekly?
- [ ] Should we add an "Actuals" tab or add actuals columns to existing Monthly P&L?
