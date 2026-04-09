# PR #5: xero-financial-reconciliation - Implementation

**Status**: In Progress (Phase 0b complete, Phase 0c/0d drafted pending CPA review)
**Based on**: [PLAN.md](./PLAN.md)
**Branch**: `feature/pr-5-xero-financial-reconciliation`
**GitHub PR**: https://github.com/Epistemic-Me/Clarity-Orbit/pull/5
**Linear**: CLA-135

## Summary

Cleaning up Epistemic Me's Xero books to establish proper accrual accounting with COGS, CAC tracking, and dollar-for-dollar reconciliation to the Sheets financial model. Xero is the source of truth.

## Completed Work

### Phase 0b: Revenue Reclassification — DONE
**Method:** Edited invoices directly in Xero (not journal entries). Cleaner — source documents are correct.

| Invoice | Contact | Change | Amount |
|---------|---------|--------|--------|
| INV-0005 | Dayforce | Account 4000 → 4100 (Service Revenue) | $25,000 |
| INV-0008 | Dayforce | Account 4000 → 4100 (Service Revenue) | $25,000 |
| INV-0010 | Dayforce | Account 4000 → 4100 (Service Revenue) | $25,000 |
| INV-0006 | Tom Cote → Relationship Psychics | Retainer: already 4100. Profit share: 4000 → 4200 | $20,717.83 |
| INV-0007 | Tom Cote → Relationship Psychics | Retainer: already 4100. Profit share: 4000 → 4200 | $21,294.09 |
| INV-0009 | Tom Cote → Relationship Psychics | Retainer: already 4100. Profit share: 4000 → 4200 | $21,657.61 |

**Result:** Sale of Goods (4000) = $0. Service Revenue (4100) = $151,100. Profit Share (4200) = $37,795.36. Total revenue unchanged: $188,895.36.

**Decision: Profit share tracked separately.** Account 4200 renamed from "Other Revenues" to "Profit Share Revenue". This is performance-based revenue (35% of Mystica's profit), distinct from service/consulting revenue. Keeps revenue types clean for when software revenue starts.

### Phase 0g: Contacts — DONE

| Contact | Type | ID |
|---------|------|-----|
| Relationship Psychics | Customer (Mystica legal entity) | 461a488c |
| Intapp | Customer (closing ~Apr 22) | 0289e653 |
| Anthropic | Supplier | 96ada1de |
| TrueFrame | Supplier (social media agency) | 98819cb6 |
| Contra / Benjamin Spiegel | Supplier | d740217c |

### Tracking Category — DONE

**Business Line** (ID: a776bc1f) with options:
- Services (client delivery — Dayforce, Mystica)
- Platform (R&D — Clarity Growth, Builder)
- Acquisition (sales, content, community — CAC)
- G&A (admin, legal, overhead)

### Phase 0c: Professional Fees Breakup — DRAFTED (pending CPA review)

3 reclassification journals, all dated Apr 9, 2026:

| Journal | From → To | Amount | Rationale |
|---------|-----------|--------|-----------|
| Founder 1099 comp | 6290 → 6090 (Contract Labor) | $72,000 | 6 Rippling payments Sep'25-Feb'26. Founder comp, not professional services. |
| QA contractor | 6290 → 5100 (COGS-Labor) | $8,400 | ThirstySprout — 100% client delivery. Direct cost, not overhead. |
| $8K TrueFrame reimbursement | 6290 → 820 (Due to Director) | $8,000 | Was partial repayment to Robert for personal card expenses. Not a P&L expense — balance sheet movement. |

**Decision: Bank transactions can't be edited at source.** All are reconciled with bank statement. Xero locks reconciled transactions. Journal entries are the standard accounting method for reclassifying reconciled transactions.

**Decision: $8K reimbursement treated as director repayment, not expense.** The $8K Robert paid himself from the business account was a partial reimbursement for TrueFrame costs paid on personal card ($14,604.42 total). Recording it as a director repayment (820) is lower audit risk than recording it as a direct expense — it matches what actually happened.

### Phase 0d: Personal Card Expenses — DRAFTED (pending CPA review)

10 monthly journals, each dated last day of the respective month. Total: $37,905.64 across 182 transactions.

| Month | Total | COGS (5000) | CAC (6000) | Subs (6110) | S&W (6340) | Prof Fees (6290) | Telecom (6390) |
|-------|-------|------------|-----------|------------|-----------|-----------------|---------------|
| Jul'25 | $1,214.77 | — | $192.00 | $137.02 | $46.75 | $839.00 | — |
| Aug'25 | $1,813.23 | — | $185.55 | $220.00 | $1,310.43 | $97.25 | — |
| Sep'25 | $3,524.80 | — | $3,151.00 | $124.24 | $208.96 | $40.60 | — |
| Oct'25 | $7,593.45 | — | $7,198.00 | $120.00 | $255.45 | $20.00 | — |
| Nov'25 | $7,619.32 | — | $7,148.77 | $120.00 | $244.43 | $20.00 | $86.12 |
| Dec'25 | $201.76 | — | — | $40.00 | $161.76 | — | — |
| Jan'26 | $7,446.57 | $525.58 | $6,265.77 | $213.72 | $346.50 | $20.00 | $75.00 |
| Feb'26 | $1,640.02 | $150.26 | $337.00 | $320.00 | $726.61 | $20.00 | $86.15 |
| Mar'26 | $6,433.00 | $360.08 | $4,246.48 | $402.38 | $824.06 | $550.00 | $50.00 |
| Apr'26 | $418.72 | — | — | $300.00 | $118.72 | — | — |
| **Total** | **$37,905.64** | **$1,035.92** | **$28,724.57** | **$1,997.36** | **$4,243.67** | **$1,606.85** | **$297.27** |

**Category mapping to Xero accounts:**
- AI/ML APIs (Anthropic, OpenAI, Moonshot, Kimi) → COGS (5000) — direct cost of service delivery
- AI/ML Subscriptions (Claude, ChatGPT) → Dues & Subscriptions (6110)
- All hosting, dev tools, team tools, domain, email → Software & Web (6340)
- All marketing, community, social media, content → Advertising/CAC (6000)
- Business services, legal, tax, HR → Professional Fees (6290)
- Internet, coworking → Telephone & Internet (6390)

All journals credit Due to Director (820) — company owes Robert Ta for business expenses paid via personal credit cards.

**Decision: Monthly journals, not lump-sum.** Each month's expenses dated to last day of that month so each period's P&L is accurate. A single April lump-sum entry would distort prior periods and overstate April expenses.

## Expected P&L After Posting

```
REVENUE
  Service Revenue (4100):      $151,100.00
  Profit Share (4200):          $37,795.36
  TOTAL REVENUE:               $188,895.36    (unchanged)

COST OF GOODS SOLD
  COGS (5000):                   $1,035.92    (AI APIs — personal card)
  COGS-Labor (5100):             $8,400.00    (QA contractor reclassified)
  TOTAL COGS:                    $9,435.92
  GROSS MARGIN:                  95.0%        (improves when founder COGS allocated)

OPERATING EXPENSES
  Contract Labor (6090):        $72,000.00    (founder 1099 — reclassified from 6290)
  Advertising/CAC (6000):       $28,724.57    (personal card — community, content, social, outbound)
  Wages & Salaries (6450):      $10,038.70    (W2 via Rippling — unchanged)
  Software & Web (6340):         $4,394.92    ($151.25 existing + $4,243.67 personal card)
  Dues & Subscriptions (6110):   $1,997.36    (AI/ML subs — personal card)
  Professional Fees (6290):     $10,606.85    ($9,000 remaining + $1,606.85 personal card)
  Payroll Taxes (6360):          $1,467.87    (unchanged)
  Telephone & Internet (6390):     $297.27    (personal card)
  Bank Fees (6030):                $175.50    (unchanged)
  Filing & Registration (525):     $679.00    (unchanged)
  TOTAL OPEX:                  $130,381.94

NET INCOME:                     $49,077.40    (down from $78,983 — $37.9K previously unrecorded expenses + $8K reclass to balance sheet)

BALANCE SHEET
  Account 820 (Due to Director): $62,380.64
    Capital injections:          $32,475.00   (moves to APIC when Clerky signed)
    Reimbursement owed:          $29,905.64   ($37,905.64 personal card - $8,000 already repaid)
```

## Deviations from Plan

| Planned | Actual | Reason |
|---------|--------|--------|
| Revenue reclassification via journal entry | Edited invoices directly in Xero | Cleaner — fixes at source, no contradiction between invoices and journals |
| Social media $8K reclassified to Advertising (6000) | Reclassified to Due to Director (820) | It's a director reimbursement, not a direct expense. Lower audit risk. Full TrueFrame cost recorded separately via personal card journals. |
| Profit share in Service Revenue (4100) | Separate account: Profit Share (4200) | Founder decision to track performance-based revenue separately from service/consulting revenue |
| Single lump-sum journals for personal card expenses | Monthly journals (10 journals, one per month) | Proper accrual — each month's P&L reflects expenses incurred that month |
| Edit bank transactions at source | Journal entries for reclassifications | Bank transactions are reconciled and locked by Xero — cannot be modified via API or UI |
| Tom Cote as Mystica contact | Relationship Psychics as contact | Corrected to legal entity name |

## Follow-up Items (After CPA Review + Posting)

- [ ] Phase 0e: Equity reclassification ($32,475 → APIC 3200) — blocked on Clerky stock issuance signature
- [ ] Phase 0f: Accrual adjustments (prepaid amortization for Namecheap, 1Password)
- [ ] Phase 1: Restructure Sheets P&L to mirror Xero account hierarchy
- [ ] Phase 1: Create CAC Tracker, 13-Week Cash Flow, Revenue Concentration tabs
- [ ] Phase 1: Restructure ROI Scorecard (VPH per opportunity)
- [ ] Phase 1: Audit IRR/LTV/Scorecard formulas before restructuring
- [ ] Phase 1: Update Apps Script for new Sheets structure
- [ ] Phase 2: Build monthly close workflow (COGS allocation + reconciliation + ROI scorecard)
- [ ] Phase 2: Build invoice generation, cash pulse, expense audit workflows
- [ ] Phase 4: Fix CPL formula in AllocationTable.tsx (hardcoded $4K agency, ended Mar'26)
- [ ] Phase 4: Document all workflows as runbooks
- [ ] Identify ~$13K residual in Sale of Goods (4000) if any remains after invoice edits

---
*PR Merged: {to be filled}*
