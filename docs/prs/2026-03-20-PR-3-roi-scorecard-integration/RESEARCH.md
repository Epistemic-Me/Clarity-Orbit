# PR #3: ROI Scorecard Integration - Research

**Created**: 2026-03-20
**Author**: @robertta
**Source**: Jonathan's `Clarity_Orbit_ROI_v2.xlsx` (Google Drive: `1aqNpkFV2TpijPbfVAUGLw9X2DudOIWQV`)

## Requirements Analysis

**Problem**: We allocate hours in Orbit, but we don't know if those hours go to the highest ROI activities. Jonathan built an ROI framework that accounts for:
1. **Time value of money** — revenue now is worth more than revenue later (3% monthly discount rate)
2. **Execution confidence** — a 90% probable $300K deal is worth more than a 15% probable $360K deal
3. **Hours cost** — every hour has a $150 loaded cost, so ROI = value created / cost invested

**The ask**: Integrate this into the Financial Model Google Sheet AND into the Clarity Orbit app so that during the weekly meeting, founders can see ROI rankings as they adjust allocations.

## Jonathan's Framework (from the Excel)

### Sheet 1: Revenue & Hours Forecast
Monthly revenue and weekly hours per opportunity, 18 months (Jul'25 → Dec'26).
- Maps to existing P&L line items
- Hours are weekly (not monthly like the P&L)
- Opportunities match Orbit's opportunity list

### Sheet 2: ROI Scorecard
All formulas — no manual inputs here.

| Metric | Formula | Purpose |
|--------|---------|---------|
| **Undisc. Future Rev** | SUM of all revenue from current month onward | Total remaining revenue in the pipe |
| **Discounted NPV** | Each month's rev / (1 + 0.03)^months_from_now | Present value — penalizes distant revenue |
| **Confidence %** | Manual input per opportunity (0.0–1.0) | Execution probability, updated weekly |
| **Risk-Adj NPV** | Discounted NPV × Confidence | The "real" expected value |
| **Remaining Hrs** | SUM of all hours from current month onward × 4.3 (wks/mo) | Total hours left to invest |
| **VPH (Value Per Hour)** | Risk-Adj NPV / Remaining Hrs | Dollars of value created per hour |
| **ROI Multiple** | VPH / $150 cost per hour | Above 1x = value-creating |
| **Accrues to API?** | Boolean — does this build platform? | Strategic filter |

### Sheet 2: Ring Summary
| Ring | Risk-Adj NPV | Hrs | VPH | ROI | % of Hrs |
|------|-------------|-----|-----|-----|----------|
| Outer | $157K | 1,772h | $89/hr | 0.59x | 64% |
| Middle | $200K | 667h | $300/hr | 2.0x | 24% |
| Inner | $0 | 344h | $0/hr | 0x | 12% |

**Key insight**: Middle ring (Dayforce) has 2x ROI — highest value per hour. Outer ring is below 1x — value-destroying at current forecast. Inner ring (Builder) has 0x because it's pre-revenue, but accrues to platform.

### Sheet 2: Ranked by ROI
1. Dayforce — 2.0x ROI, $300/hr VPH
2. Mystica — 1.3x ROI, $196/hr VPH
3. Sprint Zero — 0.59x
4. Intapp — 0.04x
5. Clarity Builder — 0x (pre-revenue)

### Sheet 3: Formula Reference
Documents the 5-step calculation and interpretation guide (>10x = max allocation, 1-2x = marginal, <1x = restructure).

## What Needs to Happen

### 1. Add to Financial Model Google Sheet
- **New tab: "ROI Forecast"** — Revenue and Hours forecast per opportunity per month (inputs)
- **New tab: "ROI Scorecard"** — All formulas, pulling from ROI Forecast tab
- These reference the P&L for revenue data where possible
- Confidence % is a weekly input (this is the "key weekly judgment call")

### 2. Add to Clarity Orbit App
- **New column or section**: show VPH and ROI Multiple per opportunity
- **Confidence % input**: editable per opportunity in Orbit (syncs to Sheet)
- **Ring summary with ROI**: not just hours/cost, but VPH and ROI per ring
- **Ranked view**: sort opportunities by ROI, highlight which are value-creating vs value-destroying
- **Color coding**: Green >2x, amber 1-2x, red <1x, gray 0x

### 3. Sync via Apps Script
- Orbit saves confidence % → Sheet
- Orbit reads ROI calculations from Sheet (or computes client-side from same formulas)
- Revenue forecast could pull from P&L or be a separate input

## Architecture Decision: Server-Side vs Client-Side ROI Calc

**Option A: Calculate in Google Sheet, read from Orbit**
- Pros: Sheet is the single source of truth, formulas are auditable
- Cons: Slower (API call to read), more complex sync

**Option B: Calculate client-side in Orbit**
- Pros: Instant updates as you adjust hours, no API call needed
- Cons: Formulas duplicated between Sheet and app, could drift

**Recommendation**: **Both**. Calculate client-side for instant feedback in the meeting. Write to Sheet on save for the auditable CFO view. The confidence % and revenue forecast inputs sync both ways.

## Dependencies

- PR #1 (MVP app) — merged
- PR #2 (formula-driven sheet) — in progress
- Jonathan's ROI model — the reference implementation

## Open Questions

- [ ] Should revenue forecast be a separate input or auto-pull from P&L monthly columns?
- [ ] Should confidence % live in the Orbit:Opportunities tab (adding a column) or in a separate ROI tab?
- [ ] How should pre-revenue opportunities (Builder, Growth) be scored? Jonathan uses 0x ROI — should there be a "strategic value" multiplier?
- [ ] Should the discount rate (3%/mo) be configurable in the app?
