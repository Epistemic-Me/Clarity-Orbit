# PR #5: Handoff — Session 2026-04-08/10

## Where We Left Off

**Phase 1c (formula audit) is COMPLETE.** Ready to start Phase 1a (build new P&L tab).

## Formula Audit Results

Only **2 tabs** reference Monthly P&L and will break on restructure:

### Cash Flow Waterfall (94+ formula cells) — HIGH RISK
Key references to Monthly P&L rows:
- Row 12 → Dayforce Contract Revenue
- Rows 13+14 → Mystica Retainer + Profit Share
- Row 15 → Other Agency Retainers
- Row 16 → Sprint Zero
- Row 24 → Total Revenue
- Row 38 → Gross Margin %
- Row 46 → Net Income
- Row 9 → Total Platform Revenue
- Row 18 → Total Services Revenue

### Runway & KPIs (7 formula cells) — HIGH RISK
- `'Monthly P&L'!K46` → Net Income
- `'Monthly P&L'!K24` → Total Revenue
- `'Monthly P&L'!J24` → Prior month Total Revenue
- `'Monthly P&L'!K38` → Gross Margin %
- `'Monthly P&L'!K12` → Dayforce Revenue (concentration)
- `'Monthly P&L'!K9` → Platform Revenue
- `'Monthly P&L'!K18` → Services Revenue

### Safe Tabs (no Monthly P&L references)
IRR by Channel, LTV Model, ROI Forecast, ROI Scorecard, Resource Allocation, Scenario Analysis — all self-contained.

## What's Done (Phase 0)

### Completed
- Phase 0b: Revenue reclassified at invoice level (Sale of Goods → Service Revenue + Profit Share)
- Phase 0g: 5 contacts created (Relationship Psychics, Intapp, Anthropic, TrueFrame, Contra)
- Tracking category "Business Line" created (Services/Platform/Acquisition/G&A)
- Tom Cote invoices reassigned to Relationship Psychics

### Drafted (pending CPA review)
- Phase 0c: 3 reclassification journals (founder 1099 → 6090, QA → 5100, $8K → 820)
- Phase 0d: 10 monthly personal card journals ($37,905.64 total, Jul'25 → Apr'26)

### Blocked
- Phase 0e: Equity → APIC (3200) — waiting on Clerky stock issuance
- Phase 0f: Accrual adjustments — waiting on journals to post

## Next Steps (Phase 1)

1. **Build new P&L tab** (`Monthly P&L v2`) with target structure:
   ```
   Service Revenue (4100) → Profit Share Revenue (4200) → TOTAL REVENUE
   → COGS (5000, 5100) → GROSS PROFIT / MARGIN %
   → OpEx (6090, 6450, 6360, 6340, 6110, 6290, 6390, 6030, 525)
   → CAC (6000) → TOTAL OpEx+CAC
   → NET INCOME / MARGIN %
   → Reconciliation check row
   → Fully loaded CAC memo
   ```
   Each month: Forecast + Actual + Variance + Var% columns.

2. **Create new tabs:** CAC Tracker, 13-Week Cash Flow, Revenue Concentration (in KPIs)

3. **Update Cash Flow Waterfall formulas** to point to new P&L tab

4. **Update Runway & KPIs formulas** to point to new P&L tab + add concentration metrics

5. **Parallel validation:** verify old and new tabs produce consistent totals

6. **Cutover:** rename tabs, update remaining references

## Key IDs and References

### Spreadsheets
- Financial Model: `1mUh7a0AwH8t4U1eEJTVatbBsAujAh0pnQH8zAQ6-e6s`
- Expense Sheet: `1Cv0WU2gslfIQLhBdblKHEs2_AhkN7AIASVVnCyMI29A`

### Xero
- MCP creds: `op://Clarity-Claw/Xero MCP App`
- Custom Connection: "EM Bookkeeper 9000"
- Scope patch: `~/.npm/_npx/2b97e4bc92a65d02/node_modules/@xeroapi/xero-mcp-server/dist/clients/xero-client.js` (remove payroll scopes)
- Tracking category "Business Line": `a776bc1f-8fbf-47b8-9512-16a8a79a165e`

### Contacts
- Relationship Psychics: `461a488c`
- Intapp: `0289e653`
- Anthropic: `96ada1de`
- TrueFrame: `98819cb6`
- Dayforce: `a1e9dc27`

### Key Accounts
- Service Revenue: 4100
- Profit Share Revenue: 4200
- COGS: 5000, COGS-Labor: 5100
- Contract Labor: 6090
- Advertising/CAC: 6000
- Software & Web: 6340
- Dues & Subscriptions: 6110
- Professional Fees: 6290
- Due to Director: 820
- APIC: 3200

## Obsidian Notes
- `projects/Epistemic Me/Business Strategy/Xero Reconciliation Game Plan.md`
- `projects/Epistemic Me/Business Strategy/CEO Operating Mode — Bottom Line Thinking.md`
- `projects/Epistemic Me/Business Strategy/Books Cleanup — Action Items.md`
- `projects/Epistemic Me/Business Strategy/Founder Compensation — S-Corp Decision Framework.md`
