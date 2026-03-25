import type { Allocation, RingType, CellKey } from './types'

export interface RedistributionResult {
  allocations: Record<string, { plan: Allocation; actual: Allocation }>
  adjustedCells: CellKey[]
}

interface OppInfo { id: string; ring: RingType }

export function redistributeAllocations(
  current: Record<string, { plan: Allocation; actual: Allocation }>,
  changed: CellKey,
  newValue: number,
  opportunities: OppInfo[],
  memberCapacity: number,
): RedistributionResult {
  const allocs: Record<string, { plan: Allocation; actual: Allocation }> = {}
  for (const k of Object.keys(current)) {
    allocs[k] = { plan: { ...current[k].plan }, actual: { ...current[k].actual } }
  }

  if (!allocs[changed.oppId]) {
    allocs[changed.oppId] = { plan: {}, actual: {} }
  }
  allocs[changed.oppId].plan[changed.memberId] = Math.max(0, newValue)

  const memberId = changed.memberId
  let total = 0
  for (const opp of opportunities) {
    total += allocs[opp.id]?.plan[memberId] || 0
  }

  const overage = total - memberCapacity
  if (overage <= 0) return { allocations: allocs, adjustedCells: [] }

  const ringOrder: RingType[] = ['outer', 'middle', 'inner']
  let remaining = overage
  const adjustedCells: CellKey[] = []

  for (const ring of ringOrder) {
    if (remaining <= 0) break
    const opps = opportunities.filter(o => o.id !== changed.oppId && o.ring === ring)
    const withHours = opps.map(o => ({ id: o.id, hours: allocs[o.id]?.plan[memberId] || 0 })).filter(o => o.hours > 0)
    const ringTotal = withHours.reduce((s, o) => s + o.hours, 0)
    if (ringTotal <= 0) continue

    const toReduce = Math.min(remaining, ringTotal)
    for (const item of withHours) {
      const proportion = item.hours / ringTotal
      const reduction = Math.min(Math.round(proportion * toReduce), item.hours)
      if (reduction > 0) {
        const oldVal = allocs[item.id].plan[memberId] || 0
        allocs[item.id].plan[memberId] = Math.max(0, oldVal - reduction)
        adjustedCells.push({ oppId: item.id, memberId })
        remaining -= (oldVal - (allocs[item.id].plan[memberId] || 0))
      }
    }
    if (remaining > 0) {
      for (const item of withHours.sort((a, b) => b.hours - a.hours)) {
        if (remaining <= 0) break
        const cur = allocs[item.id].plan[memberId] || 0
        if (cur > 0) {
          const take = Math.min(remaining, cur)
          allocs[item.id].plan[memberId] = (allocs[item.id].plan[memberId] || 0) - take
          remaining -= take
          if (!adjustedCells.find(c => c.oppId === item.id && c.memberId === memberId)) {
            adjustedCells.push({ oppId: item.id, memberId })
          }
        }
      }
    }
  }
  return { allocations: allocs, adjustedCells }
}

export interface PersonSummary {
  used: number
  capacity: number
  remaining: number
  largest: { name: string; hours: number } | null
  innerHours: number
  middleHours: number
  outerHours: number
}

export function getPersonSummary(
  memberId: string,
  allocations: Record<string, { plan: Allocation; actual: Allocation }>,
  opportunities: { id: string; name: string; ring: RingType }[],
  capacity: number,
): PersonSummary {
  let used = 0, innerHours = 0, middleHours = 0, outerHours = 0
  let largest: { name: string; hours: number } | null = null
  for (const opp of opportunities) {
    const h = allocations[opp.id]?.plan[memberId] || 0
    used += h
    if (opp.ring === 'inner') innerHours += h
    if (opp.ring === 'middle') middleHours += h
    if (opp.ring === 'outer') outerHours += h
    if (!largest || h > largest.hours) largest = { name: opp.name, hours: h }
  }
  return {
    used, capacity, remaining: capacity - used,
    largest: largest && largest.hours > 0 ? largest : null,
    innerHours, middleHours, outerHours,
  }
}
