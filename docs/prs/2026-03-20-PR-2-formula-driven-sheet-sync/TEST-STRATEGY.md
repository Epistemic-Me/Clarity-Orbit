# PR #2: Formula-Driven Sheet + Full 2-Way Sync - Test Strategy

**Created**: 2026-03-20
**Based on**: [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md)

## Acceptance Criteria

| ID | Criteria | Priority |
|----|----------|----------|
| AC1 | LRP formulas match Excel calculations | Must |
| AC2 | IRR formulas match Excel calculations | Must |
| AC3 | LTV formulas match Excel calculations | Must |
| AC4 | Resource Allocation formulas match Excel | Must |
| AC5 | Expense Detail totals are formula-driven | Must |
| AC6 | Runway & KPIs are formula-driven | Must |
| AC7 | All input cells are blue (#e3f2fd) | Must |
| AC8 | All formula cells are gray (#f5f5f5) | Must |
| AC9 | Orbit allocation change → RA tab updates | Should |
| AC10 | Sheet edit → Orbit app reflects on refresh | Should |

## Test Matrix

| Test ID | Test Case | AC | Pass Criteria |
|---------|-----------|-----|---------------|
| T1 | Change LRP PEPM Rate → verify revenue recalculates | AC1 | Revenue = Rate × Customers × Employees × 12 × Share% |
| T2 | Change IRR hours → verify ROI recalculates | AC2 | ROI = Annual Revenue / (Hours × Rate) |
| T3 | Change LTV revenue → verify LTV/CAC recalculates | AC3 | LTV/CAC = (GP × Lifetime) / (CAC + Onboarding) |
| T4 | Change RA percentages → verify hours recalculate | AC4 | Hours = % × Monthly Hours |
| T5 | Verify all input cells are blue | AC7 | Visual inspection |
| T6 | Verify no formula cells are blue | AC8 | Visual inspection |
| T7 | Change Orbit week → check RA tab | AC9 | RA percentages update |
| T8 | Edit team name in Sheet → refresh Orbit | AC10 | Name change appears |

## Definition of Done

- [ ] All formula tabs produce same values as the Excel reference
- [ ] Color coding is consistent and correct across all tabs
- [ ] 2-way sync tested: Orbit → Sheet and Sheet → Orbit
