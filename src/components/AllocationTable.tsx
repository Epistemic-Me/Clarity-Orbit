import { useState, useEffect, useCallback, useRef, Fragment } from 'react'
import type { Opportunity, Allocation, DemandGen, CellKey, RingType, TeamMember, AllocMode } from '../lib/types'
import { RING_COLORS, RING_META } from '../lib/data'
import { getPersonSummary } from '../lib/constraintEngine'
import { calculateROI, roiColor, formatROI, formatVPH, calculatePortfolioROI } from '../lib/roiEngine'
import { ArrowRight, Link, Unlink, Terminal, Users, Plus, Trash, X, Settings } from 'lucide-react'

interface Props {
  opportunities: Opportunity[]
  allocations: Record<string, { plan: Allocation; actual: Allocation }>
  prevAllocations: Record<string, { plan: Allocation; actual: Allocation }> | null
  weekHistory: Array<Record<string, { plan: Allocation; actual: Allocation }>>
  demandGen: DemandGen
  onUpdateAllocation: (oppId: string, memberId: string, value: number) => void
  onUpdateDemandGen: (field: keyof DemandGen, value: number) => void
  autoBalance: boolean
  onToggleAutoBalance: () => void
  flashedCells: CellKey[]
  onQuickCommand: (input: string) => string | null
  team: TeamMember[]
  onUpdateTeam: (team: TeamMember[]) => void
  mode: AllocMode
  onToggleMode: () => void
  onUpdateOpportunities: (opps: Opportunity[]) => void
  onExport: () => void
}

const RING_ORDER: RingType[] = ['inner', 'middle', 'outer']
const RS: Record<RingType, { bg: string; bgA: string; hdr: string; hov: string; brd: string }> = {
  inner:  { bg: 'bg-[#6b785e]/[0.03]', bgA: 'bg-[#6b785e]/[0.06]', hdr: 'bg-[#6b785e]/[0.08]', hov: 'hover:bg-[#6b785e]/[0.09]', brd: '#6b785e' },
  middle: { bg: 'bg-[#95a888]/[0.02]', bgA: 'bg-[#95a888]/[0.04]', hdr: 'bg-[#95a888]/[0.06]', hov: 'hover:bg-[#95a888]/[0.07]', brd: '#95a888' },
  outer:  { bg: 'bg-slate-50/30', bgA: 'bg-slate-50/60', hdr: 'bg-slate-100/70', hov: 'hover:bg-slate-100/60', brd: '#cbd5e1' },
}

function cid(o: string, m: string) { return `${o}:${m}` }
function oppH(id: string, a: Record<string, { plan: Allocation; actual: Allocation }>, mode: AllocMode): number {
  const v = a[id]?.[mode]; return v ? Object.values(v).reduce((s, n) => s + (n || 0), 0) : 0
}

function Spark({ history, oppId, mode }: { history: Array<Record<string, { plan: Allocation; actual: Allocation }>>; oppId: string; mode: AllocMode }) {
  const pts = history.slice(-4).map(w => oppH(oppId, w, mode))
  if (pts.every(p => p === 0)) return null
  const mx = Math.max(...pts, 1), w = 36, h = 14
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i / Math.max(pts.length - 1, 1)) * w} ${h - (p / mx) * (h - 2)}`).join(' ')
  return <svg width={w} height={h} className="inline-block ml-1.5 opacity-50 group-hover:opacity-80" viewBox={`0 0 ${w} ${h}`}><path d={d} fill="none" stroke="#6b785e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function MBar({ done, total }: { done: number; total: number }) {
  return <div className="inline-flex ml-1.5" title={`${done}/${total}h`}><div className="w-10 h-[3px] bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-forest rounded-full" style={{ width: `${Math.min((done / total) * 100, 100)}%`, transition: 'width 500ms ease' }} /></div></div>
}

function Delta({ cur, prev }: { cur: number; prev: number }) {
  const d = cur - prev; if (d === 0) return null
  return <span className={`text-[9px] font-bold font-mono ml-0.5 ${d > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{d > 0 ? '+' : ''}{d}</span>
}

function CapMeter({ member, current, onCap }: { member: TeamMember; current: number; onCap: (v: number) => void }) {
  const [ed, setEd] = useState(false), [val, setVal] = useState(String(member.capacity))
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (ed) ref.current?.select() }, [ed])
  const pct = (current / member.capacity) * 100
  const col = pct > 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#6b785e'
  const cls = pct > 100 ? 'text-red-500 font-bold' : pct >= 80 ? 'text-amber-500' : 'text-slate-600'
  const commit = () => { onCap(Math.max(1, parseInt(val) || member.capacity)); setEd(false) }
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-mono">
      <span className="text-slate-500">{member.name}:</span>
      <span className={cls}>{current}/</span>
      {ed ? <input ref={ref} type="text" value={val} onChange={e => setVal(e.target.value.replace(/[^0-9]/g, ''))}
        onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEd(false) }}
        className="w-8 h-5 text-center font-mono text-[11px] font-bold bg-white border border-forest rounded outline-none ring-1 ring-forest" />
      : <button onClick={() => { setVal(String(member.capacity)); setEd(true) }} className={`${cls} hover:underline hover:text-forest cursor-pointer`}>{member.capacity}</button>}
      <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: col, transition: 'width 500ms cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
      </div>
    </div>
  )
}

function TeamEditor({ team, onSave, onClose }: { team: TeamMember[]; onSave: (t: TeamMember[]) => void; onClose: () => void }) {
  const [d, setD] = useState<TeamMember[]>(team), [nn, setNN] = useState('')
  const add = () => { if (!nn.trim()) return; const id = nn.trim().toLowerCase().replace(/\s+/g, '-'); if (d.find(m => m.id === id)) return; setD([...d, { id, name: nn.trim(), capacity: 40, rate: 150 }]); setNN('') }
  return (
    <div className="absolute bottom-full mb-2 right-0 z-50 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-4">
      <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-bold text-slate-800">Team</h3><button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16} /></button></div>
      <div className="space-y-2 mb-3">{d.map(m => (
        <div key={m.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
          <input type="text" value={m.name} onChange={e => setD(d.map(x => x.id === m.id ? { ...x, name: e.target.value } : x))} className="flex-1 text-sm font-semibold bg-transparent outline-none border-b border-transparent focus:border-forest" />
          <span className="text-[10px] text-slate-400">h/wk:</span>
          <input type="text" value={m.capacity} onChange={e => setD(d.map(x => x.id === m.id ? { ...x, capacity: parseInt(e.target.value) || 0 } : x))} className="w-8 text-center font-mono text-[11px] bg-white border border-slate-200 rounded outline-none focus:border-forest" />
          <span className="text-[10px] text-slate-400">$/hr:</span>
          <input type="text" value={m.rate} onChange={e => setD(d.map(x => x.id === m.id ? { ...x, rate: parseInt(e.target.value) || 0 } : x))} className="w-10 text-center font-mono text-[11px] bg-white border border-slate-200 rounded outline-none focus:border-forest" />
          {d.length > 1 && <button onClick={() => setD(d.filter(x => x.id !== m.id))} className="text-slate-300 hover:text-red-500"><Trash size={14} /></button>}
        </div>
      ))}</div>
      <div className="flex items-center gap-2 mb-3">
        <input type="text" value={nn} onChange={e => setNN(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add() }} placeholder="Add member..." className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-forest" />
        <button onClick={add} disabled={!nn.trim()} className="p-1.5 bg-forest text-white rounded-lg disabled:opacity-30"><Plus size={14} /></button>
      </div>
      <button onClick={() => { onSave(d); onClose() }} className="w-full py-2 bg-forest text-white text-sm font-semibold rounded-lg hover:bg-forest-dark">Save Team</button>
    </div>
  )
}

function OppEditor({ opps, onSave, onClose }: { opps: Opportunity[]; onSave: (o: Opportunity[]) => void; onClose: () => void }) {
  const [d, setD] = useState<Opportunity[]>(opps)
  const [nn, setNN] = useState(''), [nr, setNR] = useState<RingType>('outer')
  const add = () => {
    if (!nn.trim()) return
    const id = `opp-${Date.now()}`
    setD([...d, { id, name: nn.trim(), ring: nr, isApi: nr !== 'outer', notes: '', confidence: 0 }])
    setNN('')
  }
  return (
    <div className="absolute bottom-full mb-2 left-0 z-50 w-96 bg-white border border-slate-200 rounded-xl shadow-xl p-4 max-h-[400px] overflow-y-auto">
      <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-bold text-slate-800">Opportunities</h3><button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16} /></button></div>
      {RING_ORDER.map(ring => {
        const ringOpps = d.filter(o => o.ring === ring)
        if (ringOpps.length === 0) return null
        return (
          <div key={ring} className="mb-3">
            <div className="flex items-center gap-1.5 mb-1.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: RING_COLORS[ring] }} /><span className="text-[10px] font-bold text-slate-500 uppercase">{RING_META[ring].label}</span></div>
            {ringOpps.map(o => (
              <div key={o.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded group">
                <div className="w-[3px] h-6 rounded-full" style={{ backgroundColor: RING_COLORS[ring] }} />
                <input type="text" value={o.name} onChange={e => setD(d.map(x => x.id === o.id ? { ...x, name: e.target.value } : x))} className="flex-1 text-sm bg-transparent outline-none border-b border-transparent focus:border-forest" />
                <select value={o.ring} onChange={e => setD(d.map(x => x.id === o.id ? { ...x, ring: e.target.value as RingType } : x))} className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1 py-0.5 outline-none">
                  <option value="inner">Inner</option><option value="middle">Middle</option><option value="outer">Outer</option>
                </select>
                <button onClick={() => setD(d.filter(x => x.id !== o.id))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash size={13} /></button>
              </div>
            ))}
          </div>
        )
      })}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
        <input type="text" value={nn} onChange={e => setNN(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add() }} placeholder="New opportunity..." className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-forest" />
        <select value={nr} onChange={e => setNR(e.target.value as RingType)} className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1.5 outline-none">
          <option value="inner">Inner</option><option value="middle">Middle</option><option value="outer">Outer</option>
        </select>
        <button onClick={add} disabled={!nn.trim()} className="p-1.5 bg-forest text-white rounded-lg disabled:opacity-30"><Plus size={14} /></button>
      </div>
      <button onClick={() => { onSave(d); onClose() }} className="w-full py-2 mt-3 bg-forest text-white text-sm font-semibold rounded-lg hover:bg-forest-dark">Save Opportunities</button>
    </div>
  )
}

export function AllocationTable({
  opportunities, allocations, prevAllocations, weekHistory, demandGen,
  onUpdateAllocation, onUpdateDemandGen, autoBalance, onToggleAutoBalance,
  flashedCells, onQuickCommand, team, onUpdateTeam, mode, onToggleMode,
  onUpdateOpportunities, onExport: _onExport,
}: Props) {
  void _onExport // available for future use
  const [ec, setEC] = useState<{ oppId: string; memberId: string } | null>(null)
  const [fSet, setFS] = useState<Set<string>>(new Set())
  const [ind, setInd] = useState<Record<string, number>>({})
  const [pop, setPop] = useState<string | null>(null)
  const [cmd, setCmd] = useState(false), [cmdIn, setCmdIn] = useState(''), [cmdErr, setCmdErr] = useState<string | null>(null)
  const [teamEd, setTeamEd] = useState(false), [oppEd, setOppEd] = useState(false)
  const popRef = useRef<HTMLDivElement>(null), cmdRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!flashedCells.length) return
    setFS(new Set(flashedCells.map(c => cid(c.oppId, c.memberId))))
    const i: Record<string, number> = {}; for (const c of flashedCells) i[cid(c.oppId, c.memberId)] = allocations[c.oppId]?.[mode][c.memberId] || 0
    setInd(i); const t1 = setTimeout(() => setFS(new Set()), 600); const t2 = setTimeout(() => setInd({}), 2000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [flashedCells, allocations, mode])

  useEffect(() => { if (!pop) return; const h = (e: MouseEvent) => { if (popRef.current && !popRef.current.contains(e.target as Node)) setPop(null) }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h) }, [pop])
  useEffect(() => { if (cmd) cmdRef.current?.focus() }, [cmd])
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === '/' && !ec && !(e.target instanceof HTMLInputElement)) { e.preventDefault(); setCmd(true) } }; document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h) }, [ec])

  const mTotals: Record<string, number> = {}; const rH: Record<RingType, number> = { inner: 0, middle: 0, outer: 0 }
  team.forEach(m => { mTotals[m.id] = 0 })
  opportunities.forEach(opp => { const a = allocations[opp.id]?.[mode] || {}; let t = 0; team.forEach(m => { const h = a[m.id] || 0; mTotals[m.id] = (mTotals[m.id] || 0) + h; t += h }); rH[opp.ring] += t })
  const totalH = rH.inner + rH.middle + rH.outer, safe = totalH || 1

  const kd = useCallback((e: React.KeyboardEvent<HTMLInputElement>, oppId: string, mid: string, val: number) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); const d = e.shiftKey ? 5 : 1; onUpdateAllocation(oppId, mid, e.key === 'ArrowUp' ? val + d : Math.max(0, val - d)) }
    else if (e.key === 'Escape') (e.target as HTMLInputElement).blur()
    else if (e.key === 'Enter') { e.preventDefault(); const i = opportunities.findIndex(o => o.id === oppId); if (i < opportunities.length - 1) { const n = opportunities[i + 1]; (document.querySelector(`[data-opp="${n.id}"][data-member="${mid}"]`) as HTMLInputElement)?.focus() } }
  }, [opportunities, onUpdateAllocation])

  const renderIn = (oppId: string, mid: string, value: number) => {
    const ed = ec?.oppId === oppId && ec?.memberId === mid, k = cid(oppId, mid), fl = fSet.has(k), iv = ind[k]
    const pv = prevAllocations?.[oppId]?.[mode][mid] || 0
    return (
      <div className="relative flex items-center" key={mid}>
        <input type="text" value={value === 0 && !ed ? '' : value} placeholder="0" data-opp={oppId} data-member={mid}
          onFocus={() => setEC({ oppId, memberId: mid })} onBlur={() => setEC(null)}
          onChange={e => onUpdateAllocation(oppId, mid, parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)}
          onKeyDown={e => kd(e, oppId, mid, value)}
          className={['w-12 h-8 text-center font-mono text-sm font-bold rounded-md outline-none transition-all duration-150',
            fl ? 'animate-cell-flash bg-amber-100 border border-amber-300' : ed ? 'bg-white border border-forest ring-1 ring-forest shadow-sm scale-[1.03]' : 'bg-transparent border border-transparent hover:border-slate-200 hover:bg-white/60',
            value > 0 ? 'text-slate-800' : 'text-slate-300'].join(' ')} />
        {prevAllocations && value > 0 && <Delta cur={value} prev={pv} />}
        {iv !== undefined && <span className="absolute -top-2.5 -right-3 text-[9px] font-bold text-amber-600 bg-amber-50 px-1 rounded animate-fade-out pointer-events-none">→{iv}</span>}
      </div>
    )
  }

  const renderMH = (m: TeamMember) => {
    const active = pop === m.id, sum = getPersonSummary(m.id, allocations, opportunities, m.capacity), over = sum.used > sum.capacity
    return (
      <div className="w-14 text-center relative" ref={active ? popRef : undefined} key={m.id}>
        <button onClick={e => { e.stopPropagation(); setPop(active ? null : m.id) }} className={`text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:text-forest ${over && !autoBalance ? 'text-red-500' : 'text-slate-400'}`}>{m.name}</button>
        {active && (
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 w-52 bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-left" onClick={e => e.stopPropagation()}>
            <div className="text-xs font-bold text-slate-800 mb-2">{m.name} <span className="font-normal text-slate-400">${m.rate}/hr</span></div>
            <div className="flex items-center gap-2 mb-2"><span className={`text-sm font-mono font-bold ${over ? 'text-red-500' : 'text-forest'}`}>{sum.used}/{sum.capacity}h</span></div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2"><div className="h-full rounded-full" style={{ width: `${Math.min((sum.used / sum.capacity) * 100, 100)}%`, backgroundColor: over ? '#ef4444' : sum.used / sum.capacity >= 0.8 ? '#f59e0b' : '#6b785e' }} /></div>
            {sum.largest && <div className="text-[10px] text-slate-500">Largest: <span className="font-semibold text-slate-700">{sum.largest.name} ({sum.largest.hours}h)</span></div>}
            <div className="flex gap-2 pt-2 mt-2 border-t border-slate-100">{[{ c: RING_COLORS.inner, h: sum.innerHours }, { c: RING_COLORS.middle, h: sum.middleHours }, { c: RING_COLORS.outer, h: sum.outerHours }].map((r, i) => <div key={i} className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: r.c }} /><span className="text-[10px] font-mono text-slate-500">{r.h}h</span></div>)}</div>
          </div>
        )}
      </div>
    )
  }

  const renderRG = (ring: RingType, first: boolean) => {
    const opps = opportunities.filter(o => o.ring === ring); if (!opps.length) return null
    const h = rH[ring], cost = opps.reduce((s, o) => s + team.reduce((ts, m) => ts + ((allocations[o.id]?.[mode][m.id] || 0) * m.rate), 0), 0)
    const s = RS[ring], meta = RING_META[ring]
    let proj = ''
    if (ring === 'inner') { const bW = oppH('opp-4', allocations, mode) > 0 ? Math.ceil(170 / oppH('opp-4', allocations, mode)) : '∞'; const gW = oppH('opp-3', allocations, mode) > 0 ? Math.ceil(120 / oppH('opp-3', allocations, mode)) : '∞'; proj = `Builder: ${bW}wk · Growth: ${gW}wk` }
    else if (ring === 'middle') { const dW = oppH('opp-1', allocations, mode) > 0 ? Math.ceil(300 / oppH('opp-1', allocations, mode)) : '∞'; proj = `Dayforce: ${dW}wk` }
    else { const m = oppH('opp-5', allocations, mode); proj = `Maint: ${m}/2h cap` }

    return (
      <Fragment key={ring}>
        {!first && <div className="h-3" />}
        <div className={`flex items-center h-10 px-4 ${s.hdr} border-y border-slate-100/80`}>
          <div className="flex-1 flex items-center gap-2.5"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RING_COLORS[ring] }} /><span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{meta.label}</span></div>
          <div className="flex items-center gap-6 text-xs font-mono"><span className="font-bold text-slate-600">{h}h</span><span className="text-slate-400">${cost.toLocaleString()}</span>{(() => { const portfolio = calculatePortfolioROI(opps); const ringR = portfolio.ringROI[ring]; return ringR ? <span className={`w-14 text-right font-bold ${roiColor(ringR.roi)}`}>{formatROI(ringR.roi)}</span> : null })()}<span className="w-48 text-right text-forest font-bold text-[12px]">{proj}</span></div>
        </div>
        {opps.map((opp, idx) => {
          const a = allocations[opp.id]?.[mode] || {}, rowT = team.reduce((ss, m) => ss + (a[m.id] || 0), 0)
          const pa = prevAllocations?.[opp.id]?.[mode] || {}, prevRT = team.reduce((ss, m) => ss + (pa[m.id] || 0), 0)
          const rowCost = team.reduce((ss, m) => ss + (a[m.id] || 0) * m.rate, 0)
          const isMaint = opp.capPerWeek !== undefined, overCap = isMaint && rowT > (opp.capPerWeek || 0)
          const isEd = ec?.oppId === opp.id, isAlt = idx % 2 === 1
          let bg = isMaint ? (overCap ? 'bg-red-50/70 hover:bg-red-50' : 'bg-amber-50/30 hover:bg-amber-50/50') : isEd ? 'bg-[#6b785e]/[0.07]' : `${isAlt ? s.bgA : s.bg} ${s.hov}`

          let rp = '—', pc = 'text-forest'
          if (opp.milestone) {
            const wk = oppH(opp.id, allocations, mode)
            if (wk > 0) { const n = Math.ceil((opp.milestone.total - opp.milestone.done) / wk); rp = `${n}wk`
              if (opp.targetDate) { const avail = Math.ceil((new Date(opp.targetDate).getTime() - new Date(2026, 2, 20).getTime()) / (7 * 864e5)); if (n <= avail) { rp = `${n}wk ✓`; pc = 'text-emerald-600' } else { rp = `${n}wk (${n - avail} late)`; pc = 'text-amber-600' } }
            } else rp = `${opp.milestone.done}/${opp.milestone.total}h`
          }
          if (opp.revenueLabel) rp = opp.revenueLabel
          if (isMaint) { rp = overCap ? 'OVER' : `${rowT}/${opp.capPerWeek}h cap`; pc = overCap ? 'text-red-600 font-bold' : 'text-amber-600' }

          return (
            <div key={opp.id} title={opp.notes} className={`flex items-center h-12 px-4 border-b border-slate-100/60 transition-colors duration-150 ${bg} group relative`}>
              <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full" style={{ backgroundColor: overCap ? '#ef4444' : s.brd }} />
              <div className="flex-1 flex items-center gap-2 pl-3 min-w-0">
                <span className={`font-medium truncate ${overCap ? 'text-red-700' : 'text-slate-800'}`} style={{ fontSize: '14px' }}>{opp.name}</span>
                {opp.isApi && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#6b785e]/10 text-forest shrink-0">API</span>}
                {isMaint && <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${overCap ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>{overCap ? 'OVER' : `${opp.capPerWeek}h cap`}</span>}
                {prevAllocations && rowT !== prevRT && <Delta cur={rowT} prev={prevRT} />}
                <Spark history={weekHistory} oppId={opp.id} mode={mode} />
              </div>
              <div className="flex items-center gap-3 pr-4">{team.map(m => renderIn(opp.id, m.id, a[m.id] || 0))}</div>
              <div className="flex items-center gap-5 text-sm font-mono">
                <span className={`w-10 text-right font-bold ${rowT > 0 ? 'text-slate-800' : 'text-slate-300'}`}>{rowT}h</span>
                <span className="w-16 text-right text-slate-400 text-xs">{rowCost > 0 ? `$${rowCost.toLocaleString()}` : '—'}</span>
                {(() => { const roi = calculateROI(opp); return (
                  <span className={`w-14 text-right text-xs font-bold ${roiColor(roi.roiMultiple)}`} title={`VPH: ${formatVPH(roi.vph)} | NPV: $${Math.round(roi.riskAdjNPV/1000)}K | Conf: ${Math.round(opp.confidence*100)}%`}>
                    {formatROI(roi.roiMultiple)}
                  </span>
                ) })()}
                <span className={`w-48 text-right text-xs flex items-center justify-end ${pc}`}>{rp}{opp.milestone && <MBar done={opp.milestone.done} total={opp.milestone.total} />}</span>
              </div>
            </div>
          )
        })}
      </Fragment>
    )
  }

  const cpl = demandGen.leads > 0 ? Math.round((4000 / 4.3 + demandGen.hours * 150) / demandGen.leads) : 0
  const iPct = Math.round((rH.inner / safe) * 100), mPct = Math.round((rH.middle / safe) * 100), oPct = 100 - iPct - mPct

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200/80 overflow-hidden" style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.03), 0 1px 2px rgba(0,0,0,0.04)' }}>
      {cmd && (
        <div className="flex items-center h-10 px-4 bg-slate-900 text-white shrink-0 gap-2">
          <Terminal size={14} className="text-forest-light" />
          <input ref={cmdRef} type="text" value={cmdIn} onChange={e => setCmdIn(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { const err = onQuickCommand(cmdIn); if (err) { setCmdErr(err); setTimeout(() => setCmdErr(null), 2000) } else { setCmdIn(''); setCmd(false) } }; if (e.key === 'Escape') { setCmd(false); setCmdIn('') } }}
            placeholder="e.g. robert +5 builder · ESC to close" className="flex-1 bg-transparent outline-none text-sm font-mono placeholder:text-slate-500" />
          {cmdErr && <span className="text-red-400 text-xs font-mono">{cmdErr}</span>}
        </div>
      )}

      <div className="flex items-center h-10 px-4 border-b border-slate-200 bg-slate-50/80 shrink-0">
        <div className="flex-1 pl-3 flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Opportunity</span>
          <div className="flex bg-slate-200/60 rounded-full p-0.5 ml-2">
            <button onClick={mode === 'plan' ? undefined : onToggleMode}
              className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full transition-all ${mode === 'plan' ? 'bg-white text-forest shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Plan</button>
            <button onClick={mode === 'actual' ? undefined : onToggleMode}
              className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full transition-all ${mode === 'actual' ? 'bg-white text-[#950952] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Actuals</button>
          </div>
          <button onClick={onToggleAutoBalance} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${autoBalance ? 'bg-[#6b785e]/10 text-forest border border-[#6b785e]/20' : 'bg-slate-100 text-slate-400'}`}>
            {autoBalance ? <Link size={10} /> : <Unlink size={10} />} Balance
          </button>
          <button onClick={() => setCmd(o => !o)} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-slate-400 hover:text-forest">
            <Terminal size={10} /> <span className="text-[9px] text-slate-300 font-mono">/</span>
          </button>
        </div>
        <div className="flex items-center gap-3 pr-4">{team.map(m => renderMH(m))}</div>
        <div className="flex items-center gap-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <div className="w-10 text-right">Total</div><div className="w-16 text-right">Cost</div><div className="w-14 text-right">ROI</div><div className="w-48 text-right">Projection</div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
        {RING_ORDER.map((r, i) => renderRG(r, i === 0))}
        <div className="flex items-center h-11 px-5 border-t border-slate-200 bg-slate-50/30">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-4">Demand Gen:</span>
          <div className="flex items-center gap-2 font-mono text-xs">
            {([{ k: 'hours' as keyof DemandGen, v: demandGen.hours, s: 'h content', w: 'w-8' }, { k: 'visitors' as keyof DemandGen, v: demandGen.visitors, s: 'visitors', w: 'w-12' }, { k: 'leads' as keyof DemandGen, v: demandGen.leads, s: 'leads', w: 'w-7' }]).map((m, i) => (
              <Fragment key={m.k}>{i > 0 && <ArrowRight size={12} className="text-slate-300 mx-1" />}
                <input type="text" value={m.v || ''} placeholder="0" onChange={e => onUpdateDemandGen(m.k, parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)}
                  className={`${m.w} text-center bg-transparent border-b border-dashed border-slate-300 focus:border-forest outline-none font-bold text-forest`} /><span className="text-slate-400">{m.s}</span></Fragment>
            ))}
            <ArrowRight size={12} className="text-slate-300 mx-1" /><span className="text-slate-400">$</span>
            <input type="text" value={demandGen.pipeline ? `${Math.round(demandGen.pipeline / 1000)}K` : ''} placeholder="0"
              onChange={e => onUpdateDemandGen('pipeline', (parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0) * 1000)}
              className="w-10 text-center bg-transparent border-b border-dashed border-slate-300 focus:border-forest outline-none font-bold text-forest" /><span className="text-slate-400">pipeline</span>
          </div>
          <div className="ml-auto text-[11px] font-mono"><span className="text-slate-400">CPL: </span><span className="font-bold text-slate-700">${cpl}</span></div>
        </div>
      </div>

      <div className="h-14 border-t border-slate-200 bg-white px-5 flex items-center justify-between shrink-0 relative">
        <div className="flex-1 max-w-sm flex flex-col justify-center gap-1">
          <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider"><span>Distribution</span><span className="font-mono text-slate-600">{totalH}h</span></div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
            {totalH > 0 && RING_ORDER.map(r => <div key={r} className="h-full" style={{ width: `${(rH[r] / totalH) * 100}%`, backgroundColor: RING_COLORS[r], transition: 'width 500ms cubic-bezier(0.34, 1.56, 0.64, 1)' }} />)}
          </div>
          <div className="flex items-center gap-3 mt-0.5">{[{ r: 'inner', p: iPct }, { r: 'middle', p: mPct }, { r: 'outer', p: oPct }].map(x => <div key={x.r} className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: RING_COLORS[x.r] }} /><span className="text-[9px] font-mono text-slate-500">{x.p}%</span></div>)}</div>
        </div>
        <div className="flex items-center gap-4 ml-6">
          {team.map(m => <CapMeter key={m.id} member={m} current={mTotals[m.id] || 0} onCap={c => onUpdateTeam(team.map(t => t.id === m.id ? { ...t, capacity: c } : t))} />)}
          <button onClick={() => setOppEd(o => !o)} className="p-1.5 text-slate-400 hover:text-forest hover:bg-[#6b785e]/5 rounded-lg" title="Edit opportunities"><Settings size={15} /></button>
          <button onClick={() => setTeamEd(o => !o)} className="p-1.5 text-slate-400 hover:text-forest hover:bg-[#6b785e]/5 rounded-lg" title="Edit team"><Users size={15} /></button>
        </div>
        {teamEd && <TeamEditor team={team} onSave={onUpdateTeam} onClose={() => setTeamEd(false)} />}
        {oppEd && <OppEditor opps={opportunities} onSave={onUpdateOpportunities} onClose={() => setOppEd(false)} />}
      </div>
    </div>
  )
}
