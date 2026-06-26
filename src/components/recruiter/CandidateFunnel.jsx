import { useEffect, useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'

function useCountUp(target, active, duration = 900) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) return
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setVal(Math.round(target * ease))
      if (t < 1) requestAnimationFrame(tick)
      else setVal(target)
    }
    requestAnimationFrame(tick)
  }, [active, target, duration])
  return val
}

const LAYER_META = {
  'L1 JD Parse':        { icon: '🧩', color: '#7C5CFF', glow: 'rgba(124,92,255,0.30)' },
  'L2 Retrieval':       { icon: '🔍', color: '#6EA8FE', glow: 'rgba(110,168,254,0.28)' },
  'L3 Graph Enrichment':{ icon: '🕸️', color: '#38BDF8', glow: 'rgba(56,189,248,0.28)' },
  'L4 Fast LLM':        { icon: '⚡', color: '#A78BFA', glow: 'rgba(167,139,250,0.28)' },
  'L4b Reasoning LLM':  { icon: '🧠', color: '#3FCF8E', glow: 'rgba(63,207,142,0.35)' },
  'L6 Agent Debate':    { icon: '⚔️', color: '#F5A623', glow: 'rgba(245,166,35,0.28)' },
  'L7 Ranked':          { icon: '⚖️', color: '#EC4899', glow: 'rgba(236,72,153,0.28)' },
  // legacy labels
  'Fast Retrieval':     { icon: '🔍', color: '#6EA8FE', glow: 'rgba(110,168,254,0.28)' },
  'Enrichment':         { icon: '🕸️', color: '#38BDF8', glow: 'rgba(56,189,248,0.28)' },
  'Deep Reasoning':     { icon: '🧠', color: '#3FCF8E', glow: 'rgba(63,207,142,0.35)' },
  'Ranked & Fairness-Checked': { icon: '⚖️', color: '#EC4899', glow: 'rgba(236,72,153,0.28)' },
}

function getLayerMeta(label) {
  return LAYER_META[label] || { icon: '▸', color: '#7C5CFF', glow: 'rgba(124,92,255,0.3)' }
}

function FunnelRow({ stage, idx, active, maxCount, total }) {
  const meta = getLayerMeta(stage.label)
  const pct = Math.max(4, Math.round((stage.count / maxCount) * 100))
  const count = useCountUp(stage.count, active, 900 + idx * 80)

  return (
    <div className="flex items-center gap-3 group">
      {/* Layer id */}
      <div className="w-8 flex-shrink-0 text-center">
        <span className="text-base">{meta.icon}</span>
      </div>

      {/* Label */}
      <div className="w-36 text-right flex-shrink-0">
        <span className={`text-xs font-medium transition-colors duration-300 ${active ? 'text-offwhite/80' : 'text-muted/25'}`}>
          {stage.label}
        </span>
      </div>

      {/* Bar */}
      <div className="flex-1 relative h-8 bg-ink-3/60 rounded-xl overflow-hidden border border-white/[0.04]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: active ? `${pct}%` : 0 }}
          transition={{ duration: 0.75, delay: idx * 0.10, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-xl flex items-center px-3 relative overflow-hidden"
          style={{ background: `linear-gradient(90deg, ${meta.color}cc, ${meta.color})`, boxShadow: active ? `0 0 14px ${meta.glow}` : 'none' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          {active && (
            <span className="font-mono-data font-bold text-xs text-white relative z-10 drop-shadow-md whitespace-nowrap">
              {count.toLocaleString()}
            </span>
          )}
        </motion.div>
      </div>

      {/* Description */}
      <div className="w-48 flex-shrink-0 hidden lg:block">
        <span className={`text-xs transition-colors duration-300 ${active ? 'text-muted/55' : 'text-muted/18'}`}>
          {stage.description}
        </span>
      </div>
    </div>
  )
}

export default function CandidateFunnel({ funnelData }) {
  const stages = funnelData || []
  const ref = useRef()
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [stagesActive, setStagesActive] = useState([])

  useEffect(() => {
    setStagesActive([])
    if (!inView) return
    stages.forEach((_, i) => {
      setTimeout(() => setStagesActive(p => [...p, i]), i * 280)
    })
  }, [inView, stages])

  const maxCount = stages[0]?.count ?? 10000
  const totalIn  = maxCount
  const totalOut = stages[stages.length - 1]?.count ?? 10

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-gradient-border rounded-2xl p-5 mb-5 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-violet-radial opacity-20 pointer-events-none" />

      <div className="flex items-center justify-between mb-5 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted/55 uppercase tracking-widest font-medium">7-layer pipeline</span>
          </div>
          <h3 className="font-display font-bold text-offwhite text-base">
            {totalIn.toLocaleString()} → {totalOut.toLocaleString()} candidates
          </h3>
        </div>
        <div className="flex items-center gap-1.5 bg-signal-green/[0.08] border border-signal-green/20 rounded-full px-3 py-1.5">
          <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-signal-green" />
          <span className="text-signal-green text-xs font-semibold">Fairness checked</span>
        </div>
      </div>

      <div className="space-y-2.5 relative z-10">
        {stages.map((stage, i) => (
          <FunnelRow
            key={i}
            stage={stage}
            idx={i}
            active={stagesActive.includes(i)}
            maxCount={maxCount}
            total={stages.length}
          />
        ))}
      </div>

      {/* Advance rates */}
      <div className="flex flex-col gap-0.5 ml-[12.5rem] mt-1 relative z-10">
        {stages.slice(0, -1).map((stage, i) => {
          const next = stages[i + 1]
          if (!next || stage.count === next.count) return null
          const pct = Math.round((next.count / stage.count) * 100)
          return (
            <div key={i} className="flex items-center gap-1.5 ml-5">
              <div className="w-px h-2.5 bg-white/[0.05]" />
              <motion.span
                initial={{ opacity: 0 }} animate={{ opacity: stagesActive.includes(i + 1) ? 1 : 0 }}
                transition={{ delay: 0.3 }}
                className="text-[10px] text-muted/35 font-mono-data"
              >
                {pct}% advance
              </motion.span>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs relative z-10">
        <span className="text-muted/50">Pool: <span className="text-violet font-mono-data font-semibold">{totalIn.toLocaleString()}</span></span>
        <span className="text-muted/30 hidden md:block">{stages.length} layers</span>
        <span className="text-muted/50">Ranked: <span className="text-signal-green font-mono-data font-semibold">{totalOut.toLocaleString()}</span></span>
      </div>
    </motion.div>
  )
}
