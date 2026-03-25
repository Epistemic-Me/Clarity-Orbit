# PR #3: ROI Scorecard Integration - Test Strategy

**Created**: 2026-03-20
**Based on**: [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md)

## Acceptance Criteria

| ID | Criteria | Priority |
|----|----------|----------|
| AC1 | ROI Forecast tab exists with revenue + hours data | Must |
| AC2 | ROI Scorecard tab formulas match Jonathan's Excel | Must |
| AC3 | Client-side ROI calculation matches Sheet | Must |
| AC4 | Dayforce ROI ~2.0x, Mystica ~1.3x | Must |
| AC5 | ROI column visible in AllocationTable | Must |
| AC6 | Color coding: green >2x, amber 1-2x, red <1x, gray 0x | Must |
| AC7 | Confidence % editable per opportunity | Must |
| AC8 | Changing confidence updates ROI in real-time | Must |
| AC9 | Ring summary includes ROI metrics | Should |
| AC10 | Opportunities sortable/ranked by ROI | Should |

## Test Matrix

| Test ID | Test Case | AC | Pass Criteria |
|---------|-----------|-----|---------------|
| T1 | Open ROI Scorecard tab in Sheet | AC1,AC2 | Values match Jonathan's Excel |
| T2 | Change Dayforce confidence 0.9→0.5 in Sheet | AC2 | Risk-Adj NPV drops ~44% |
| T3 | Verify Dayforce ROI in Orbit app | AC3,AC4 | Shows ~2.0x in green |
| T4 | Verify Mystica ROI in Orbit app | AC3,AC4 | Shows ~1.3x in amber |
| T5 | Verify Builder ROI in Orbit app | AC3 | Shows 0x in gray |
| T6 | Change confidence in Orbit | AC7,AC8 | ROI updates instantly |
| T7 | Verify color coding for all opportunities | AC6 | Colors match thresholds |
| T8 | Check ring summary ROI | AC9 | Middle ring highest VPH |

## Definition of Done

- [ ] ROI Scorecard tab matches Jonathan's Excel within 1% tolerance
- [ ] Client-side ROI visible for all opportunities during allocation planning
- [ ] Weekly meeting flow: adjust hours → see ROI impact → adjust confidence → lock in
