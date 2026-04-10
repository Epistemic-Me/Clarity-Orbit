---
date: 2026-04-10T10:16:09-07:00
git_commit: a89907a
branch: feature/pr-5-xero-financial-reconciliation
repository: Clarity-Orbit
topic: "Xero Financial Reconciliation — Books Cleanup + Sheets Restructuring"
tags: [finance, xero, accounting, google-sheets, accrual, cogs, cac]
status: in-progress
---

# Handoff: Xero Books Cleanup & Sheets P&L Restructuring

## Task(s)

**Linear:** [CLA-135](https://linear.app/epistemicme/issue/CLA-135)
**GitHub PR:** [Epistemic-Me/Clarity-Orbit#5](https://github.com/Epistemic-Me/Clarity-Orbit/pull/5)

### Phase 0: Xero Cleanup
- **0b. Revenue reclassification** — COMPLETED. Edited invoices directly in Xero. Sale of Goods (4000) → Service Revenue (4100) + Profit Share Revenue (4200). Total revenue $188,895.36 unchanged.
- **0g. Contacts** — COMPLETED. Created: Relationship Psychics, Intapp, Anthropic, TrueFrame, Contra/Benjamin Spiegel.
- **Tracking category** — COMPLETED. "Business Line" with options: Services, Platform, Acquisition, G&A.
- **0c. Professional Fees breakup** — DRAFTED (3 journals, pending CPA review). Founder 1099 $72K → Contract Labor (6090). QA $8.4K → COGS-Labor (5100). $8K reimbursement → Due to Director (820).
- **0d. Personal card expenses** — DRAFTED (10 monthly journals, pending CPA review). $37,905.64 total across Jul'25 → Apr'26. Each journal dated last day of respective month. All credit Due to Director (820).
- **0e. Equity reclassification** — BLOCKED on Clerky stock issuance signature from Jonathan (expired 12/20/25, needs resend). $32,475 → APIC (3200).
- **0f. Accrual adjustments** — NOT STARTED. Depends on journals posting first.

### Phase 1: Sheets P&L Restructuring
- **1c. Formula audit** — COMPLETED. Only 2 tabs reference Monthly P&L: Cash Flow Waterfall (94+ formulas) and Runway & KPIs (7 formulas). 6 other tabs are safe (self-contained).
- **1a. Build new P&L tab** — NOT STARTED. This is the immediate next step.
- **1a-ii. CAC Tracker tab** — NOT STARTED.
- **1a-iii. 13-Week Cash Flow tab** — NOT STARTED.
- **1a-iv. Revenue Concentration** — NOT STARTED.
- **1d. ROI Scorecard restructure** — NOT STARTED.
- **1b. Apps Script update** — NOT STARTED.

### Phase 2-3: Workflows — NOT STARTED
### Phase 4: Orbit code cleanup — NOT STARTED

## Critical References

1. `docs/prs/2026-04-07-PR-5-xero-financial-reconciliation/PLAN.md` — The full execution plan (v5.3). Includes P&L target structure, CAC breakdown, COGS allocation method, monthly close workflow, all account mappings.
2. `docs/prs/2026-04-07-PR-5-xero-financial-reconciliation/IMPLEMENTATION.md` — Tracks all completed work, decisions made, deviations from plan, expected P&L after posting.
3. `docs/prs/2026-04-07-PR-5-xero-financial-reconciliation/HANDOFF.md` — Quick reference for all IDs, account codes, contact IDs, spreadsheet IDs.

## Recent Changes

- `docs/prs/2026-04-07-PR-5-xero-financial-reconciliation/RESEARCH.md` — v3: accrual accounting focus, monthly margin calculation target, full Xero state documented
- `docs/prs/2026-04-07-PR-5-xero-financial-reconciliation/PLAN.md` — v5.3: 13-week cash flow, revenue concentration, ROI scorecard with VPH, CAC tracker, dollar-for-dollar reconciliation requirement, accrual rules per line item
- `docs/prs/2026-04-07-PR-5-xero-financial-reconciliation/IMPLEMENTATION.md` — Phase 0b/0g complete, 0c/0d drafted with full expected P&L
- `docs/prs/2026-04-07-PR-5-xero-financial-reconciliation/HANDOFF.md` — Session reference with all IDs

## Learnings

### Xero MCP Setup
- Xero MCP server (`@xeroapi/xero-mcp-server`) requires Custom Connection app type (not Web App) for `client_credentials` grant
- US orgs don't support payroll scopes — must patch `xero-client.js` to remove `payroll.settings payroll.employees payroll.timesheets` from scope string
- Patch location: `~/.npm/_npx/2b97e4bc92a65d02/node_modules/@xeroapi/xero-mcp-server/dist/clients/xero-client.js` line ~61
- Credentials configured at user scope via `claude mcp add xero --scope user`
- Creds in 1Password: `op://Clarity-Claw/Xero MCP App` (Client ID: B2CC1875..., Custom Connection "EM Bookkeeper 9000")

### Xero API Limitations
- **Reconciled bank transactions cannot be edited** via API or UI. Must use journal entries for reclassifications.
- **PAID invoices cannot be edited** via API (`update-invoice` only works on DRAFT). But they CAN be edited in the Xero UI (Robert did this successfully for revenue reclassification).
- **AUTHORISED invoices** also can't be edited via API, but can in the UI.

### Accounting Decisions Made
- **Profit share tracked separately** in account 4200 (renamed from "Other Revenues" to "Profit Share Revenue"). Performance-based revenue distinct from service/consulting.
- **TrueFrame $8K reimbursement** → Due to Director (820), not Advertising. It's a balance sheet movement (partial director repayment). Full $14,604.42 TrueFrame cost recorded via personal card journals to Advertising (6000). Net 820 impact: $29,905.64 owed to Robert.
- **Monthly journals, not lump-sum** for personal card expenses. Each month dated to last day of that month for proper accrual.
- **Robert's capital injections ($32,475)** are an equity purchase (not convertible note, not loan). No agreement signed yet — blocked on Clerky stock issuance.
- **ACQ Community** = lead gen → Advertising/CAC (6000), not professional development.
- **All current revenue** = Service Revenue (4100). Sale of Goods was misclassified. Future software revenue (PEPM, Builder) will use a new account.
- **Social media contractor (TrueFrame/Contra)** ended March 2026 — final payment.
- **Mystica legal entity** = Relationship Psychics. Tom Cote is the contact person.
- **Intapp closing ~April 22, 2026.** Contact created proactively.
- **No historical restatement** — start clean from Apr'26. Orbit lock-in data only exists from 3/16.

### Tax Urgency
- Epistemic Me is a **C-Corp** (Clerky formation)
- **Form 7004** (tax extension) due April 15, 2026 — Robert is filing
- 2025 was a loss year (retained earnings -$19,702) — likely $0 federal tax owed
- **1099 vs W2 misclassification** is the biggest compliance risk. Both founders are 93% 1099 / 7% W2. Research shows S-Corp election is the standard playbook for bootstrapped startups ($18-22K/yr FICA savings).
- Delaware franchise tax may have been handled ($550 "State Tax Solutions" payment Mar'26)

### Formula Dependencies (Phase 1c Audit)
- **Cash Flow Waterfall** has 94+ formulas referencing Monthly P&L rows by number (rows 9, 12, 13, 14, 15, 16, 18, 24, 38, 46). ALL will break when P&L restructured.
- **Runway & KPIs** has 7 formulas referencing Monthly P&L (K46, K24, J24, K38, K12, K9, K18).
- IRR by Channel, LTV Model, ROI Forecast, ROI Scorecard, Resource Allocation, Scenario Analysis — all self-contained, no Monthly P&L references.

## Artifacts

### PR Documents
- `docs/prs/2026-04-07-PR-5-xero-financial-reconciliation/RESEARCH.md`
- `docs/prs/2026-04-07-PR-5-xero-financial-reconciliation/PLAN.md`
- `docs/prs/2026-04-07-PR-5-xero-financial-reconciliation/IMPLEMENTATION.md`
- `docs/prs/2026-04-07-PR-5-xero-financial-reconciliation/HANDOFF.md`

### Obsidian Notes (NibsNotes vault)
- `/Users/rbtna/Documents/NibsNotes/projects/Epistemic Me/Business Strategy/Xero Reconciliation Game Plan.md`
- `/Users/rbtna/Documents/NibsNotes/projects/Epistemic Me/Business Strategy/CEO Operating Mode — Bottom Line Thinking.md`
- `/Users/rbtna/Documents/NibsNotes/projects/Epistemic Me/Business Strategy/Books Cleanup — Action Items.md`
- `/Users/rbtna/Documents/NibsNotes/projects/Epistemic Me/Business Strategy/Founder Compensation — S-Corp Decision Framework.md`

### Memory Files
- `/Users/rbtna/.claude/projects/-Users-rbtna-Documents-GitHub/memory/ceo-operating-mode.md`

### Xero (13 draft journals pending CPA review)
Phase 0c reclassifications (dated Apr 9, 2026):
- Founder 1099 → Contract Labor: `13fa2d63-1383-4ec8-93ac-f44b1d41a8e0`
- QA → COGS-Labor: `6e81240c-0b5d-4676-a9f3-e70a7b2877f9`
- $8K reimbursement → 820: `02175759-215f-41aa-8475-e49b198889f9`

Phase 0d monthly personal card journals:
- Jul'25 ($1,214.77): `c5f6f23c-58ca-4c15-9c3b-a5c6584265c4`
- Aug'25 ($1,813.23): `25f49872-e0da-4a09-a6d9-ac5ea1aa889f`
- Sep'25 ($3,524.80): `dcce7aa9-0a80-4d37-a198-d5f80181b240`
- Oct'25 ($7,593.45): `5703f0bf-d18e-4317-811b-f5275dcd9c03`
- Nov'25 ($7,619.32): `8a7346a2-efdb-4da8-9bf7-8e8bc9fe2919`
- Dec'25 ($201.76): `b55b880b-e0fe-463d-9052-4736778daa83`
- Jan'26 ($7,446.57): `5f294750-e0e5-4e31-876e-4e0e17217453`
- Feb'26 ($1,640.02): `56370201-4a36-472d-9c94-50ef93085ea1`
- Mar'26 ($6,433.00): `8b8ec308-70f9-4d32-b2be-7c257909ab0f`
- Apr'26 ($418.72): `79d65879-5848-47da-9d10-35b088551005`

## Action Items & Next Steps

### Immediate (Phase 1a — build in Sheets)
1. **Build `Monthly P&L v2` tab** in the financial model spreadsheet (`1mUh7a0AwH8t4U1eEJTVatbBsAujAh0pnQH8zAQ6-e6s`). Target structure:
   ```
   Service Revenue (4100) by client → Profit Share (4200) → TOTAL REVENUE
   → COGS (5000, 5100) → GROSS PROFIT / MARGIN %
   → OpEx (6090, 6450, 6360, 6340, 6110, 6290, 6390, 6030, 525) excl CAC
   → CAC (6000) sub-items → TOTAL CAC
   → TOTAL EXPENSES → NET INCOME / MARGIN %
   → Reconciliation check row (Xero Net Income - Sheets Net Income = $0)
   → Fully loaded CAC memo (cash + imputed time from Orbit)
   ```
   Each month gets 4 columns: Forecast, Actual, Variance, Var%.

2. **Create CAC Tracker tab** — deal log, monthly activity, rolling LTV:CAC metrics.
3. **Create 13-Week Cash Flow Forecast tab** — weekly cash in/out with $10K threshold alerts.
4. **Add Revenue Concentration** to Runway & KPIs.
5. **Restructure ROI Scorecard** — VPH per opportunity with imputed time CAC.

### After New Tabs Built
6. **Update Cash Flow Waterfall formulas** — point 94+ formula cells to new P&L tab row numbers.
7. **Update Runway & KPIs formulas** — point 7 formula cells to new P&L tab.
8. **Parallel validation** — verify old tab and new tab produce consistent revenue/expense/net income totals.
9. **Cutover** — rename `Monthly P&L` → `Monthly P&L (legacy)`, `Monthly P&L v2` → `Monthly P&L`.

### Blocked (waiting on Robert)
10. CPA review of 13 draft journals → then post them
11. File Form 7004 tax extension (due Apr 15)
12. Resend Clerky stock issuance to Jonathan
13. Download credit card statements + export expense sheet PDF (audit prep)
14. Draft board consent for accounting cleanup

### Future Phases
15. Phase 0f: Accrual adjustments (after journals posted)
16. Phase 1b: Apps Script update
17. Phase 2-3: Monthly close, COGS allocation, invoice generation, cash pulse workflows
18. Phase 4: Fix CPL formula in `AllocationTable.tsx:278` (hardcoded $4K agency cost, ended Mar'26)

## Other Notes

### Key Spreadsheets
- Financial Model: `1mUh7a0AwH8t4U1eEJTVatbBsAujAh0pnQH8zAQ6-e6s` (21 tabs)
- Expense Sheet: `1Cv0WU2gslfIQLhBdblKHEs2_AhkN7AIASVVnCyMI29A` (Jonathan's 182-transaction reconciliation)

### Xero Account Codes (Most Used)
| Code | Account | Usage |
|------|---------|-------|
| 4100 | Service Revenue | Dayforce, Mystica retainer |
| 4200 | Profit Share Revenue | Mystica 35% profit share |
| 5000 | COGS | AI/ML APIs |
| 5100 | COGS - Labor | QA contractor, future founder COGS allocation |
| 6000 | Advertising | All CAC (community, content, social, outbound) |
| 6090 | Contract Labor | Founder 1099 comp |
| 6110 | Dues & Subscriptions | Claude, ChatGPT subscriptions |
| 6290 | Professional Fees | Legal, accounting only (after cleanup) |
| 6340 | Software & Web | Hosting, dev tools, team tools |
| 6390 | Telephone & Internet | Sonic, Starlink, coworking |
| 6450 | Wages & Salaries | W2 comp via Rippling |
| 820 | Due to Director | Capital injections + personal card reimbursement |
| 3200 | Additional Paid In Capital | For equity reclassification (when Clerky signed) |

### Expected P&L After All Journals Post
- Total Revenue: $188,895.36 (unchanged)
- COGS: $9,435.92 (AI APIs + QA contractor)
- Gross Margin: 95% (improves when founder COGS allocated monthly)
- Contract Labor: $72,000 (founder 1099)
- Advertising/CAC: $28,724.57 (personal card marketing + community + TrueFrame)
- Net Income: $49,077.40 (down from $78,983 due to $37.9K previously unrecorded expenses)
- Account 820: $62,380.64 ($32,475 capital + $29,905.64 owed to Robert)

### Cofounder Context
Jonathan (cofounder) is pushing for:
- Daily bottom-line thinking (CEO operating mode)
- Dollar-for-dollar reconciliation between Xero and Sheets
- Proper accrual accounting with monthly margin visibility
- CAC tracked as strategic investment, not buried in consulting fees
- Xero = source of truth, Orbit = planning interface
