interface RingHealthGaugeProps {
  innerHours: number
  middleHours: number
  outerHours: number
  totalHours: number
}

export function RingHealthGauge({ innerHours, middleHours, outerHours, totalHours }: RingHealthGaugeProps) {
  const safe = totalHours || 1
  const innerPct = Math.round((innerHours / safe) * 100)
  const middlePct = Math.round((middleHours / safe) * 100)
  const outerPct = 100 - innerPct - middlePct

  const innerW = Math.max(2, (innerHours / safe) * 10)
  const middleW = Math.max(2, (middleHours / safe) * 10)
  const outerW = Math.max(2, (outerHours / safe) * 10)

  const platformHeavy = (innerHours + middleHours) / safe > 0.6

  const cx = 80, cy = 34
  const arc = (r: number) => `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`

  return (
    <div className="flex flex-col items-center gap-0.5 mx-3">
      <svg
        width="160"
        height="38"
        viewBox="0 0 160 38"
        className="overflow-visible"
        style={{
          filter: platformHeavy ? 'drop-shadow(0 0 4px rgba(107,120,94,0.35))' : 'none',
          transition: 'filter 600ms ease',
        }}
      >
        <path d={arc(30)} fill="none" stroke="#6b7280" strokeWidth={outerW} strokeLinecap="round" opacity={0.6}
          style={{ transition: 'stroke-width 500ms ease' }} />
        <path d={arc(22)} fill="none" stroke="#95a888" strokeWidth={middleW} strokeLinecap="round" opacity={0.8}
          style={{ transition: 'stroke-width 500ms ease' }} />
        <path d={arc(14)} fill="none" stroke="#6b785e" strokeWidth={innerW} strokeLinecap="round"
          style={{ transition: 'stroke-width 500ms ease' }} />
      </svg>
      <span className="text-[9px] font-mono text-slate-400 tracking-tight whitespace-nowrap">
        {innerPct}% inner · {middlePct}% mid · {outerPct}% outer
      </span>
    </div>
  )
}
