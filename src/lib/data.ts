import type { Opportunity, WeekData, Allocation, TeamMember } from './types'

export const RING_COLORS: Record<string, string> = { inner: '#6b785e', middle: '#95a888', outer: '#6b7280' }
export const RING_META: Record<string, { label: string; sub: string }> = {
  inner: { label: 'Repeatable Product', sub: 'Core platform growth' },
  middle: { label: 'Platform Services', sub: 'Services building platform features' },
  outer: { label: 'Pure Services & Demand Gen', sub: 'Trust building & maintenance' },
}

export const DEFAULT_TEAM: TeamMember[] = [
  { id: 'robert', name: 'Robert', capacity: 50, rate: 150 },
  { id: 'jonathan', name: 'Jonathan', capacity: 50, rate: 150 },
  { id: 'qa', name: 'QA', capacity: 15, rate: 75 },
]

export const DEFAULT_OPPORTUNITIES: Opportunity[] = [
  { id: 'opp-3', name: 'Clarity Growth', ring: 'inner', isApi: true, notes: 'Target MRR $5K, 6mo to revenue.', milestone: { done: 30, total: 150 }, targetDate: '2026-06-30' },
  { id: 'opp-4', name: 'Clarity Builder', ring: 'inner', isApi: true, notes: 'Target MRR $8K, 5mo to revenue.', milestone: { done: 30, total: 200 }, targetDate: '2026-05-15' },
  { id: 'opp-1', name: 'Dayforce / Surveys+', ring: 'middle', isApi: true, notes: '$25K/mo contract, PEPM $37,500.', milestone: { done: 40, total: 340 }, revenueLabel: '$25K/mo', targetDate: '2026-07-01' },
  { id: 'opp-2', name: 'Mystica — Clarity Features', ring: 'middle', isApi: true, notes: '$13K/mo retainer.', milestone: { done: 30, total: 200 }, revenueLabel: '$13K/mo', targetDate: '2026-06-01' },
  { id: 'opp-5', name: 'Mystica — Maintenance', ring: 'outer', isApi: false, notes: 'CAP at 2h/week!', capPerWeek: 2 },
  { id: 'opp-6', name: 'Intapp', ring: 'outer', isApi: false, notes: 'Discovery. 2,700 firms. 35% prob.' },
  { id: 'opp-7', name: 'SEO / Blog Engine', ring: 'outer', isApi: false, notes: 'Auto-generated daily.' },
  { id: 'opp-8', name: 'Weekly Newsletter', ring: 'outer', isApi: false, notes: 'Nurture sequence.' },
  { id: 'opp-9', name: 'Weekly Podcast', ring: 'outer', isApi: false, notes: 'AI founder interviews.' },
  { id: 'opp-10', name: 'Shorts / Social Media', ring: 'outer', isApi: false, notes: '$4K/mo agency.' },
]

function emptyAlloc(team: TeamMember[]): Allocation {
  const a: Allocation = {}
  team.forEach(m => { a[m.id] = 0 })
  return a
}

export function makeWeeks(team: TeamMember[], opportunities: Opportunity[]): WeekData[] {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(2026, 2, 16 + i * 7)
    const isFirst = i === 0
    const allocations: Record<string, { plan: Allocation; actual: Allocation }> = {}
    opportunities.forEach(opp => {
      const plan = emptyAlloc(team)
      if (isFirst) {
        if (opp.id === 'opp-1' && plan['robert'] !== undefined) { plan['robert'] = 10; plan['jonathan'] = 15; plan['qa'] = 5 }
        if (opp.id === 'opp-2' && plan['robert'] !== undefined) { plan['robert'] = 5; plan['jonathan'] = 10; plan['qa'] = 2 }
        if (opp.id === 'opp-3' && plan['robert'] !== undefined) { plan['robert'] = 15; plan['jonathan'] = 5; plan['qa'] = 5 }
        if (opp.id === 'opp-4' && plan['robert'] !== undefined) { plan['robert'] = 10; plan['jonathan'] = 10; plan['qa'] = 3 }
        if (opp.id === 'opp-5' && plan['robert'] !== undefined) { plan['robert'] = 1; plan['jonathan'] = 1 }
        if (opp.id === 'opp-6' && plan['robert'] !== undefined) { plan['robert'] = 4 }
        if (opp.id === 'opp-7' && plan['robert'] !== undefined) { plan['robert'] = 2 }
        if (opp.id === 'opp-9' && plan['robert'] !== undefined) { plan['robert'] = 3 }
      }
      allocations[opp.id] = { plan, actual: { ...plan } }
    })
    return {
      id: `w-${i}`, label: `${d.getMonth() + 1}/${d.getDate()}`, fullDate: d.toISOString(),
      allocations, demandGen: { hours: isFirst ? 5 : 0, visitors: isFirst ? 1240 : 0, leads: isFirst ? 14 : 0, pipeline: isFirst ? 45000 : 0 },
      lockedIn: false,
    }
  })
}

export function autoFillWeek(weeks: WeekData[], weekIndex: number): WeekData[] {
  if (weekIndex <= 0) return weeks
  const current = weeks[weekIndex]
  const hasData = Object.values(current.allocations).some(a => Object.values(a.plan).some(v => v > 0))
  if (hasData) return weeks
  return weeks.map((w, i) => i !== weekIndex ? w : { ...w, allocations: JSON.parse(JSON.stringify(weeks[weekIndex - 1].allocations)) })
}

export function generateLockSummary(cur: WeekData, prev: WeekData | null, opps: Opportunity[], team: TeamMember[]): string {
  const changes: string[] = []
  let totalH = 0, platformH = 0
  opps.forEach(opp => {
    const c = cur.allocations[opp.id]?.plan || {}
    const p = prev?.allocations[opp.id]?.plan || {}
    const cT = Object.values(c).reduce((s, v) => s + (v || 0), 0)
    const pT = Object.values(p).reduce((s, v) => s + (v || 0), 0)
    totalH += cT
    if (opp.ring !== 'outer') platformH += cT
    const delta = cT - pT
    if (delta !== 0) changes.push(`${delta > 0 ? '+' : ''}${delta}h ${opp.name}`)
  })
  const pct = totalH > 0 ? Math.round((platformH / totalH) * 100) : 0
  const teamSummary = team.map(m => {
    const used = opps.reduce((s, o) => s + (cur.allocations[o.id]?.plan[m.id] || 0), 0)
    return `${m.name}: ${used}/${m.capacity}h`
  }).join(' · ')
  return `Week of ${cur.label}: ${changes.length > 0 ? changes.join(', ') : 'No changes'}. Platform ${pct}%. ${teamSummary}.`
}

export function parseQuickCommand(input: string, team: TeamMember[]): { memberId: string; oppId: string; delta: number; targetOppId?: string } | null {
  const lower = input.toLowerCase().trim()
  const personMap: Record<string, string> = {}
  team.forEach(m => { personMap[m.id] = m.id; personMap[m.name.toLowerCase()] = m.id; if (m.name.length > 2) personMap[m.name.substring(0, 1).toLowerCase()] = m.id })
  const oppMap: Record<string, string> = {
    growth: 'opp-3', builder: 'opp-4', cb: 'opp-4', cg: 'opp-3', dayforce: 'opp-1', df: 'opp-1', surveys: 'opp-1',
    mystica: 'opp-2', mc: 'opp-2', maintenance: 'opp-5', maint: 'opp-5', mm: 'opp-5',
    intapp: 'opp-6', seo: 'opp-7', blog: 'opp-7', newsletter: 'opp-8', podcast: 'opp-9', pod: 'opp-9', shorts: 'opp-10', social: 'opp-10',
  }
  const m1 = lower.match(/^(\w+)\s+([+-]?\d+)\s+(.+)$/)
  if (m1) { const p = personMap[m1[1]]; const d = parseInt(m1[2]); const o = oppMap[m1[3]]; if (p && o && !isNaN(d)) return { memberId: p, oppId: o, delta: d } }
  const m2 = lower.match(/^(?:shift|move)\s+(\d+)\s+(\w+)\s*[→>]\s*(\w+)\s+(\w+)$/)
  if (m2) { const a = parseInt(m2[1]); const f = oppMap[m2[2]]; const t = oppMap[m2[3]]; const p = personMap[m2[4]]; if (p && f && t) return { memberId: p, oppId: t, delta: a, targetOppId: f } }
  return null
}

export function addMemberToWeeks(weeks: WeekData[], memberId: string): WeekData[] {
  return weeks.map(w => {
    const a = { ...w.allocations }
    for (const k of Object.keys(a)) a[k] = { plan: { ...a[k].plan, [memberId]: 0 }, actual: { ...a[k].actual, [memberId]: 0 } }
    return { ...w, allocations: a }
  })
}

export function removeMemberFromWeeks(weeks: WeekData[], memberId: string): WeekData[] {
  return weeks.map(w => {
    const a = { ...w.allocations }
    for (const k of Object.keys(a)) {
      const { [memberId]: _p, ...rp } = a[k].plan
      const { [memberId]: _a, ...ra } = a[k].actual
      a[k] = { plan: rp, actual: ra }
    }
    return { ...w, allocations: a }
  })
}

export function addOppToWeeks(weeks: WeekData[], oppId: string, team: TeamMember[]): WeekData[] {
  return weeks.map(w => ({
    ...w,
    allocations: { ...w.allocations, [oppId]: { plan: emptyAlloc(team), actual: emptyAlloc(team) } }
  }))
}

export function removeOppFromWeeks(weeks: WeekData[], oppId: string): WeekData[] {
  return weeks.map(w => {
    const { [oppId]: _, ...rest } = w.allocations
    return { ...w, allocations: rest }
  })
}

export function exportWeekCSV(week: WeekData, opps: Opportunity[], team: TeamMember[]): string {
  const headers = ['Opportunity', 'Ring', ...team.map(m => `${m.name} (Plan)`), ...team.map(m => `${m.name} (Actual)`), 'Total Plan', 'Total Actual', 'Cost']
  const rows = opps.map(opp => {
    const plan = week.allocations[opp.id]?.plan || {}
    const actual = week.allocations[opp.id]?.actual || {}
    const planTotal = team.reduce((s, m) => s + (plan[m.id] || 0), 0)
    const actualTotal = team.reduce((s, m) => s + (actual[m.id] || 0), 0)
    const cost = team.reduce((s, m) => s + (plan[m.id] || 0) * m.rate, 0)
    return [opp.name, opp.ring, ...team.map(m => plan[m.id] || 0), ...team.map(m => actual[m.id] || 0), planTotal, actualTotal, `$${cost}`]
  })
  return [headers, ...rows].map(r => r.join(',')).join('\n')
}
