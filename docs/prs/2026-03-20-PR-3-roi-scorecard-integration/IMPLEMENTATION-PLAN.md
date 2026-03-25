# PR #3: ROI Scorecard Integration - Implementation Plan

**Created**: 2026-03-20
**Based on**: [RESEARCH.md](./RESEARCH.md)
**Source**: Jonathan's `Clarity_Orbit_ROI_v2.xlsx`

## Chosen Approach

Dual calculation: client-side for instant meeting feedback, Google Sheet for auditable CFO view. Confidence % and revenue forecast sync both ways via Apps Script.

## Scope

### In Scope
- Add "ROI Forecast" tab to Financial Model Google Sheet (revenue + hours per opp per month)
- Add "ROI Scorecard" tab with all NPV/confidence/VPH/ROI formulas
- Add confidence % to Orbit:Opportunities tab (new column)
- Client-side ROI calculation in Orbit app (instant updates)
- ROI column in AllocationTable showing VPH and ROI multiple per opportunity
- Ring summary includes ROI metrics
- Color-coded ROI indicators (green/amber/red/gray)
- Apps Script: sync confidence %, read/write ROI Forecast tab
- Ranked view or sort-by-ROI option

### Out of Scope
- Configurable discount rate in UI (hardcode 3%/mo for now)
- Strategic value multiplier for pre-revenue opportunities
- Historical ROI tracking (trending over weeks)

## Files Summary

### Google Sheet (via MCP)
| Tab | Action | Purpose |
|-----|--------|---------|
| ROI Forecast | Create | Monthly revenue + hours per opp (inputs, blue) |
| ROI Scorecard | Create | NPV, confidence, VPH, ROI formulas (gray) |
| Orbit:Opportunities | Update | Add confidence column |

### Apps Script
| File | Action | Purpose |
|------|--------|---------|
| Code.gs | Update | Save/load confidence %, read ROI Forecast |

### Vite App
| File | Action | Purpose |
|------|--------|---------|
| `src/lib/types.ts` | Update | Add confidence to Opportunity, ROI types |
| `src/lib/roiEngine.ts` | Create | Client-side NPV/VPH/ROI calculation |
| `src/lib/data.ts` | Update | Add confidence to DEFAULT_OPPORTUNITIES |
| `src/lib/sheetSync.ts` | Update | Sync confidence %, load ROI data |
| `src/components/AllocationTable.tsx` | Update | Show ROI column, confidence input, color coding |
| `src/App.tsx` | Update | Wire ROI calculations |

## Step-by-Step Implementation

### Step 1: Add ROI Forecast Tab to Google Sheet
Create "ROI Forecast" tab matching Jonathan's structure:
- Row headers: Opportunity names (matching Orbit IDs)
- Column headers: months Jul'25 through Dec'26
- Two sections: Revenue Forecast ($/mo) and Weekly Hours Forecast (hrs/wk)
- Populate with Jonathan's data
- Blue background for inputs

### Step 2: Add ROI Scorecard Tab to Google Sheet
Create "ROI Scorecard" tab with ALL formulas:
- Undiscounted Future Revenue = SUMIF(months >= current)
- Discounted NPV = SUMPRODUCT with discount factor
- Confidence from Orbit:Opportunities tab
- Risk-Adj NPV = Discounted × Confidence
- Remaining Hours = SUMIF(hours >= current) × 4.3
- VPH = Risk-Adj NPV / Remaining Hours
- ROI Multiple = VPH / 150
- Ring Summary section
- Ranked by ROI section
- Portfolio Metrics (blended ROI, platform % of NPV, discount haircut)

### Step 3: Update Opportunity Data Model
Add `confidence` field to Opportunity type and default data:
```typescript
interface Opportunity {
  // ... existing fields
  confidence: number  // 0.0 - 1.0
  revenueForMonths?: number[]  // monthly revenue forecast
}
```

### Step 4: Build Client-Side ROI Engine
```typescript
// src/lib/roiEngine.ts
interface ROIResult {
  undiscountedRev: number
  discountedNPV: number
  riskAdjNPV: number
  remainingHours: number
  vph: number  // value per hour
  roiMultiple: number  // VPH / cost per hour
}

function calculateROI(
  monthlyRevenue: number[],
  weeklyHours: number[],
  confidence: number,
  discountRate: number, // 0.03
  currentMonthIndex: number,
  costPerHour: number, // 150
): ROIResult
```

### Step 5: Add ROI Column to AllocationTable
- Between Cost and Projection columns: "ROI" column
- Shows ROI multiple with color: green >2x, amber 1-2x, red <1x, gray 0x
- Tooltip shows: "VPH: $300/hr | NPV: $200K | Conf: 90%"
- Ring separator rows show ring-level ROI

### Step 6: Add Confidence Input
- In opportunity editor (gear icon) or inline in the table
- Slider or number input for confidence % per opportunity
- Saves to Orbit:Opportunities tab via Apps Script

### Step 7: Update Apps Script
- Save confidence % when opportunities are saved
- Load ROI Forecast data in loadState()

### Step 8: Format and Deploy
- Format ROI tabs (blue inputs, gray formulas)
- Deploy Apps Script new version
- Deploy Vercel

## Verification Checklist

- [ ] ROI Forecast tab has revenue + hours for all opportunities
- [ ] ROI Scorecard formulas produce same values as Jonathan's Excel
- [ ] Dayforce shows ~2.0x ROI, Mystica ~1.3x
- [ ] Client-side ROI matches Sheet calculations
- [ ] Confidence % editable in Orbit and syncs to Sheet
- [ ] ROI column visible in table with correct color coding
- [ ] Ring summary shows ROI metrics
- [ ] Pre-revenue opportunities show 0x (gray) not red
- [ ] Build passes, Vercel deployment succeeds

## Rollback Plan

Remove ROI column from AllocationTable, delete ROI tabs from Sheet. Core allocation functionality unaffected.
