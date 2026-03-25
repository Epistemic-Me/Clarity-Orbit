/**
 * Client-side ROI calculation engine.
 * Mirrors the formulas in the ROI Scorecard Google Sheet tab.
 *
 * The 5-step calculation (from Jonathan's framework):
 * 1. Future revenue: sum monthly forecast from current month onward
 * 2. Discount to NPV: each month / (1 + rate)^months_from_now
 * 3. Risk-adjust: NPV × confidence
 * 4. Value per hour: risk-adj NPV / remaining hours
 * 5. ROI multiple: VPH / cost per hour
 */

import type { Opportunity, ROIResult } from './types'

const DISCOUNT_RATE = 0.03 // 3% monthly = ~36% annual
const COST_PER_HOUR = 150 // Loaded cost per hour
const CURRENT_MONTH_INDEX = 8 // 0-indexed: 8 = Mar'26 (Jul'25 = 0)
const WEEKS_PER_MONTH = 4.3

export function calculateROI(opp: Opportunity): ROIResult {
  const rev = opp.monthlyRevenue || []
  const hrs = opp.weeklyHours || []
  const confidence = opp.confidence || 0

  // Step 1: Sum future revenue (months >= current)
  let undiscountedRev = 0
  let discountedNPV = 0
  let remainingWeeklyHours = 0

  for (let i = CURRENT_MONTH_INDEX; i < 18; i++) {
    const monthRev = rev[i] || 0
    const monthHrs = hrs[i] || 0
    const monthsFromNow = i - CURRENT_MONTH_INDEX

    // Step 1
    undiscountedRev += monthRev

    // Step 2: Discount
    const discountFactor = Math.pow(1 + DISCOUNT_RATE, monthsFromNow)
    discountedNPV += monthRev / discountFactor

    // Remaining hours
    remainingWeeklyHours += monthHrs
  }

  // Convert weekly hours to total hours
  const remainingHours = remainingWeeklyHours * WEEKS_PER_MONTH

  // Step 3: Risk-adjust
  const riskAdjNPV = discountedNPV * confidence

  // Step 4: Value per hour
  const vph = remainingHours > 0 ? riskAdjNPV / remainingHours : 0

  // Step 5: ROI multiple
  const roiMultiple = vph / COST_PER_HOUR

  return { undiscountedRev, discountedNPV, riskAdjNPV, remainingHours, vph, roiMultiple }
}

export function calculatePortfolioROI(opps: Opportunity[]): {
  totalNPV: number
  totalRiskAdj: number
  totalHours: number
  blendedROI: number
  platformPctNPV: number
  discountHaircut: number
  ringROI: Record<string, { riskAdjNPV: number; hours: number; vph: number; roi: number }>
  ranked: Array<{ opp: Opportunity; roi: ROIResult }>
} {
  let totalNPV = 0
  let totalRiskAdj = 0
  let totalHours = 0
  let platformRiskAdj = 0

  const ringData: Record<string, { riskAdjNPV: number; hours: number }> = {
    inner: { riskAdjNPV: 0, hours: 0 },
    middle: { riskAdjNPV: 0, hours: 0 },
    outer: { riskAdjNPV: 0, hours: 0 },
  }

  const results: Array<{ opp: Opportunity; roi: ROIResult }> = []

  for (const opp of opps) {
    const roi = calculateROI(opp)
    results.push({ opp, roi })

    totalNPV += roi.discountedNPV
    totalRiskAdj += roi.riskAdjNPV
    totalHours += roi.remainingHours

    if (opp.ring === 'inner' || opp.ring === 'middle') {
      platformRiskAdj += roi.riskAdjNPV
    }

    if (ringData[opp.ring]) {
      ringData[opp.ring].riskAdjNPV += roi.riskAdjNPV
      ringData[opp.ring].hours += roi.remainingHours
    }
  }

  // Ring-level ROI
  const ringROI: Record<string, { riskAdjNPV: number; hours: number; vph: number; roi: number }> = {}
  for (const [ring, data] of Object.entries(ringData)) {
    const vph = data.hours > 0 ? data.riskAdjNPV / data.hours : 0
    ringROI[ring] = { ...data, vph, roi: vph / COST_PER_HOUR }
  }

  // Ranked by ROI (descending)
  const ranked = [...results].sort((a, b) => b.roi.roiMultiple - a.roi.roiMultiple)

  const totalUndiscounted = results.reduce((s, r) => s + r.roi.undiscountedRev, 0)

  return {
    totalNPV,
    totalRiskAdj,
    totalHours,
    blendedROI: totalHours > 0 ? (totalRiskAdj / totalHours) / COST_PER_HOUR : 0,
    platformPctNPV: totalRiskAdj > 0 ? platformRiskAdj / totalRiskAdj : 0,
    discountHaircut: totalUndiscounted - totalNPV,
    ringROI,
    ranked,
  }
}

// Color coding for ROI display
export function roiColor(multiple: number): string {
  if (multiple >= 2) return 'text-emerald-600'     // Green: strong
  if (multiple >= 1) return 'text-amber-600'        // Amber: marginal
  if (multiple > 0) return 'text-red-500'           // Red: value-destroying
  return 'text-slate-400'                           // Gray: zero/pre-revenue
}

export function roiLabel(multiple: number): string {
  if (multiple >= 10) return 'Max allocation'
  if (multiple >= 2) return 'Strong'
  if (multiple >= 1) return 'Marginal'
  if (multiple > 0) return 'Below cost'
  return 'Pre-revenue'
}

export function formatVPH(vph: number): string {
  if (vph === 0) return '$0/hr'
  if (vph >= 1000) return `$${Math.round(vph / 1000)}K/hr`
  return `$${Math.round(vph)}/hr`
}

export function formatROI(multiple: number): string {
  if (multiple === 0) return '0x'
  return `${multiple.toFixed(1)}x`
}
