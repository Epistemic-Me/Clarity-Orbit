import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEFAULT_OPPORTUNITIES, DEFAULT_TEAM, makeWeeks, autoFillWeek, generateLockSummary, parseQuickCommand, addMemberToWeeks, removeMemberFromWeeks, addOppToWeeks, removeOppFromWeeks, exportWeekCSV } from './lib/data'
import type { DemandGen, CellKey, TeamMember, Opportunity, AllocMode } from './lib/types'
import { redistributeAllocations } from './lib/constraintEngine'
import { useAnimatedNumber, usePersistedState } from './lib/hooks'
import { AllocationTable } from './components/AllocationTable'
import { RingHealthGauge } from './components/RingHealthGauge'
import { ChevronLeft, ChevronRight, Copy, ClipboardCopy, Star, Lock, CheckCircle2 } from 'lucide-react'

export function App() {
  const [team, setTeam] = usePersistedState<TeamMember[]>('team', DEFAULT_TEAM)
  const [opportunities, setOpportunities] = usePersistedState<Opportunity[]>('opportunities', DEFAULT_OPPORTUNITIES)
  const [weeks, setWeeks] = usePersistedState('weeks', () => makeWeeks(DEFAULT_TEAM, DEFAULT_OPPORTUNITIES))
  const [weekId, setWeekId] = usePersistedState('weekId', 'w-0')
  const [autoBalance, setAutoBalance] = usePersistedState('autoBalance', true)
  const [mode, setMode] = usePersistedState<AllocMode>('mode', 'plan')
  const [flashedCells, setFlashedCells] = useState<CellKey[]>([])
  const [toast, setToast] = useState<string | null>(null)

  const weekIdx = weeks.findIndex(w => w.id === weekId)
  const currentWeek = weeks[weekIdx] || weeks[0]
  const prevWeek = weekIdx > 0 ? weeks[weekIdx - 1] : null

  useEffect(() => { if (weekIdx > 0) setWeeks(prev => autoFillWeek(prev, weekIdx)) }, [weekIdx])

  const weekHistory = useMemo(() => weeks.slice(Math.max(0, weekIdx - 3), weekIdx + 1).map(w => w.allocations), [weeks, weekIdx])

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const handleUpdateTeam = useCallback((newTeam: TeamMember[]) => {
    const oldIds = new Set(team.map(m => m.id)), newIds = new Set(newTeam.map(m => m.id))
    let w = weeks
    for (const m of newTeam.filter(m => !oldIds.has(m.id))) w = addMemberToWeeks(w, m.id)
    for (const m of team.filter(m => !newIds.has(m.id))) w = removeMemberFromWeeks(w, m.id)
    setWeeks(w); setTeam(newTeam)
    flash(`Team: ${newTeam.map(m => m.name).join(', ')}`)
  }, [team, weeks, setWeeks, setTeam])

  const handleUpdateOpportunities = useCallback((newOpps: Opportunity[]) => {
    const oldIds = new Set(opportunities.map(o => o.id)), newIds = new Set(newOpps.map(o => o.id))
    let w = weeks
    for (const o of newOpps.filter(o => !oldIds.has(o.id))) w = addOppToWeeks(w, o.id, team)
    for (const o of opportunities.filter(o => !newIds.has(o.id))) w = removeOppFromWeeks(w, o.id)
    setWeeks(w); setOpportunities(newOpps)
    flash('Opportunities updated')
  }, [opportunities, weeks, team, setWeeks, setOpportunities])

  const handleUpdateAllocation = useCallback((oppId: string, memberId: string, value: number) => {
    const member = team.find(m => m.id === memberId)
    if (!member) return
    if (autoBalance && mode === 'plan') {
      setWeeks(prev => prev.map(w => {
        if (w.id !== weekId) return w
        const result = redistributeAllocations(w.allocations, { oppId, memberId }, value, opportunities.map(o => ({ id: o.id, ring: o.ring })), member.capacity)
        if (result.adjustedCells.length > 0) setTimeout(() => setFlashedCells(result.adjustedCells), 0)
        const na = { ...w.allocations }
        for (const k of Object.keys(result.allocations)) na[k] = { ...w.allocations[k], [mode]: result.allocations[k].plan }
        return { ...w, allocations: na }
      }))
    } else {
      setWeeks(prev => prev.map(w => {
        if (w.id !== weekId) return w
        const cur = w.allocations[oppId]?.[mode] || {}
        return { ...w, allocations: { ...w.allocations, [oppId]: { ...w.allocations[oppId], [mode]: { ...cur, [memberId]: Math.max(0, value) } } } }
      }))
    }
  }, [autoBalance, weekId, team, mode, opportunities, setWeeks])

  const handleUpdateDemandGen = useCallback((field: keyof DemandGen, value: number) => {
    setWeeks(prev => prev.map(w => w.id !== weekId ? w : { ...w, demandGen: { ...w.demandGen, [field]: value } }))
  }, [weekId, setWeeks])

  const handleCopyLastWeek = () => {
    if (weekIdx > 0) {
      setWeeks(prev => prev.map(w => w.id !== weekId ? w : { ...w, allocations: JSON.parse(JSON.stringify(prev[weekIdx - 1].allocations)) }))
      flash("Copied last week's plan")
    }
  }

  const handleLockIn = () => {
    const summary = generateLockSummary(currentWeek, prevWeek, opportunities, team)
    setWeeks(prev => prev.map(w => w.id !== weekId ? w : { ...w, lockedIn: true, lockSummary: summary }))
    navigator.clipboard.writeText(summary).then(() => flash('Locked & copied to clipboard!')).catch(() => flash('Week locked in!'))
  }

  const handleExport = () => {
    const csv = exportWeekCSV(currentWeek, opportunities, team)
    const summary = currentWeek.lockSummary || generateLockSummary(currentWeek, prevWeek, opportunities, team)
    const text = `${summary}\n\n${csv}`
    navigator.clipboard.writeText(text).then(() => flash('Exported to clipboard!')).catch(() => {
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `orbit-${currentWeek.label.replace('/', '-')}.csv`; a.click()
      flash('Downloaded CSV!')
    })
  }

  const handleQuickCommand = useCallback((input: string): string | null => {
    const cmd = parseQuickCommand(input, team)
    if (!cmd) return 'Could not parse. Try: robert +5 builder'
    const cur = currentWeek.allocations[cmd.oppId]?.[mode][cmd.memberId] || 0
    handleUpdateAllocation(cmd.oppId, cmd.memberId, Math.max(0, cur + cmd.delta))
    if (cmd.targetOppId) {
      const src = currentWeek.allocations[cmd.targetOppId]?.[mode][cmd.memberId] || 0
      handleUpdateAllocation(cmd.targetOppId, cmd.memberId, Math.max(0, src - Math.abs(cmd.delta)))
    }
    return null
  }, [currentWeek, handleUpdateAllocation, team, mode])

  const stats = useMemo(() => {
    let total = 0, platform = 0, inner = 0, middle = 0, outer = 0
    opportunities.forEach(opp => {
      const a = currentWeek.allocations[opp.id]?.[mode] || {}
      const t = team.reduce((s, m) => s + (a[m.id] || 0), 0)
      total += t
      if (opp.ring === 'inner') { platform += t; inner += t }
      else if (opp.ring === 'middle') { platform += t; middle += t }
      else outer += t
    })
    const pct = total > 0 ? Math.round((platform / total) * 100) : 0
    return { total, pct, inner, middle, outer, profile: pct > 60 ? 'Growth' : pct > 30 ? 'Balanced' : 'Cash' }
  }, [currentWeek, team, opportunities, mode])

  const animTotal = useAnimatedNumber(stats.total)
  const animPct = useAnimatedNumber(stats.pct)

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden" style={{ background: 'linear-gradient(135deg, #fdfcf9 0%, #f8f7f4 50%, #f4f3ef 100%)' }}>
      <header className="h-14 bg-white/90 backdrop-blur-sm border-b border-slate-200 px-6 flex items-center justify-between shrink-0 relative">
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(107,120,94,0.15) 30%, rgba(107,120,94,0.15) 70%, transparent)' }} />
        <div className="flex items-center gap-3 min-w-[140px]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-forest to-forest-light flex items-center justify-center shadow-sm"><Star className="w-4 h-4 text-white" /></div>
          <h1 className="text-base font-bold text-slate-800 tracking-tight">Clarity Orbit</h1>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => weekIdx > 0 && setWeekId(weeks[weekIdx - 1].id)} disabled={weekIdx === 0} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronLeft size={18} /></button>
          <div className="flex gap-1 overflow-x-auto max-w-[400px] hide-scrollbar px-1">
            {weeks.map(w => (
              <div key={w.id} className="flex flex-col items-center gap-0.5">
                <button onClick={() => setWeekId(w.id)} className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-all ${w.id === weekId ? 'bg-forest text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>{w.label}</button>
                {w.lockedIn && <div className="w-1 h-1 rounded-full bg-forest" />}
              </div>
            ))}
          </div>
          <button onClick={() => weekIdx < weeks.length - 1 && setWeekId(weeks[weekIdx + 1].id)} disabled={weekIdx === weeks.length - 1} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronRight size={18} /></button>
        </div>
        <RingHealthGauge innerHours={stats.inner} middleHours={stats.middle} outerHours={stats.outer} totalHours={stats.total} />
        <div className="flex items-center gap-4 min-w-[140px] justify-end">
          <div className="flex items-center gap-3 text-sm font-mono font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200" style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)' }}>
            <span>{animTotal}h</span><span className="text-slate-200">|</span>
            <span className={mode === 'plan' ? 'text-forest' : 'text-[#950952]'}>{animPct}%</span><span className="text-slate-200">|</span>
            <span className={stats.profile === 'Growth' ? 'text-forest' : 'text-slate-500'}>{stats.profile}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={handleCopyLastWeek} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded active:scale-95"><Copy size={13} /> Copy</button>
            <button onClick={handleExport} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded active:scale-95"><ClipboardCopy size={13} /> Export</button>
            <button onClick={handleLockIn} disabled={currentWeek.lockedIn}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded shadow-sm transition-all active:scale-95 ${currentWeek.lockedIn ? 'bg-forest/20 text-forest cursor-default' : 'bg-forest hover:bg-forest-dark text-white'}`}>
              <Lock size={13} /> {currentWeek.lockedIn ? 'Locked' : 'Lock In'}
            </button>
          </div>
        </div>
      </header>

      {currentWeek.lockedIn && currentWeek.lockSummary && (
        <div className="px-6 py-2.5 bg-[#6b785e]/5 border-b border-[#6b785e]/10 flex items-center gap-2 cursor-pointer hover:bg-[#6b785e]/[0.07] transition-colors"
          onClick={() => navigator.clipboard.writeText(currentWeek.lockSummary || '').then(() => flash('Summary copied!'))}>
          <CheckCircle2 size={14} className="text-forest shrink-0" />
          <span className="font-mono text-xs text-forest flex-1">{currentWeek.lockSummary}</span>
          <ClipboardCopy size={12} className="text-forest/50" />
        </div>
      )}

      <main className="flex-1 p-6 max-w-[1280px] mx-auto w-full min-h-0">
        <AllocationTable
          opportunities={opportunities}
          allocations={currentWeek.allocations}
          prevAllocations={prevWeek?.allocations || null}
          weekHistory={weekHistory}
          demandGen={currentWeek.demandGen}
          onUpdateAllocation={handleUpdateAllocation}
          onUpdateDemandGen={handleUpdateDemandGen}
          autoBalance={autoBalance}
          onToggleAutoBalance={() => setAutoBalance((p: boolean) => !p)}
          flashedCells={flashedCells}
          onQuickCommand={handleQuickCommand}
          team={team}
          onUpdateTeam={handleUpdateTeam}
          mode={mode}
          onToggleMode={() => setMode((m: AllocMode) => m === 'plan' ? 'actual' : 'plan')}
          onUpdateOpportunities={handleUpdateOpportunities}
          onExport={handleExport}
        />
      </main>

      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border-l-4 border-forest shadow-lg rounded-r-lg px-5 py-3 flex items-center gap-2 transition-all duration-500 z-50 ${toast ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
        <CheckCircle2 className="text-forest" size={16} />
        <span className="font-semibold text-slate-700 text-sm">{toast}</span>
      </div>
    </div>
  )
}
