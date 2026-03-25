export type RingType = 'inner' | 'middle' | 'outer'

export interface TeamMember {
  id: string
  name: string
  capacity: number
  rate: number
}

export type Allocation = Record<string, number>

export interface Opportunity {
  id: string
  name: string
  ring: RingType
  isApi: boolean
  notes: string
  milestone?: { done: number; total: number }
  targetDate?: string
  revenueLabel?: string
  capPerWeek?: number
  confidence: number // 0.0 - 1.0, execution probability
  monthlyRevenue?: number[] // 18-month revenue forecast (Jul'25 → Dec'26)
  weeklyHours?: number[] // 18-month hours forecast
}

export interface ROIResult {
  undiscountedRev: number
  discountedNPV: number
  riskAdjNPV: number
  remainingHours: number
  vph: number // value per hour
  roiMultiple: number // VPH / cost per hour
}

export interface DemandGen {
  hours: number
  visitors: number
  leads: number
  pipeline: number
}

export type AllocMode = 'plan' | 'actual'

export interface WeekData {
  id: string
  label: string
  fullDate: string
  allocations: Record<string, { plan: Allocation; actual: Allocation }>
  demandGen: DemandGen
  lockedIn: boolean
  lockSummary?: string
}

export interface CellKey {
  oppId: string
  memberId: string
}

export interface OrbitState {
  team: TeamMember[]
  opportunities: Opportunity[]
  weeks: WeekData[]
  settings: { autoBalance: boolean; mode: AllocMode }
}
