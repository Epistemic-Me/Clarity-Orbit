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
