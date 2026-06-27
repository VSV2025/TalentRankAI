import { motion, AnimatePresence } from 'framer-motion'

const EXPO = [0.16, 1, 0.3, 1]

const LAYERS = [
  { id: 'L1',  label: 'JD Understanding',  icon: '🧩', color: '#7C5CFF', desc: 'Parsing requirements...' },
  { id: 'L2',  label: 'Retrieval',          icon: '🔍', color: '#6EA8FE', desc: 'Embedding search...' },
  { id: 'L3',  label: 'Graph Enrichment',   icon: '🕸️', color: '#38BDF8', desc: 'PPR skill graph...' },
  { id: 'L4',  label: 'Fast Scoring',       icon: '⚡', color: '#A78BFA', desc: '8B model scoring...' },
  { id: 'L4b', label: 'Deep Reasoning',     icon: '🧠', color: '#3FCF8E', desc: '70B deep eval...' },
  { id: 'L6',  label: 'Agent Debate',       icon: '⚔️', color: '#F5A623', desc: 'Pro vs Skeptic...' },
  { id: 'L7',  label: 'Rank & Fairness',    icon: '⚖️', color: '#EC4899', desc: 'FA*IR reranking...' },
]

function progressToActive(pct) {
  if (pct >= 100) return 7
  if (pct >= 85)  return 6
  if (pct >= 71)  return 5
  if (pct >= 57)  return 4
  if (pct >= 42)  return 3
  if (pct >= 28)  return 2
  if (pct >= 14)  return 1
  return 0
}

export default function PipelineProgress({ layer = 'Starting pipeline…', progress = 0 }) {
  const activeLayer = progressToActive(progress)

  return (
    <div className="flex flex-col items-center py-12 gap-6 w-full max-w-sm mx-auto">
      {/* Spinning orb */}
      <div className="relative w-20 h-20 mb-2">
        <div className="absolute inset-0 rounded-full border border-violet/10" />
        <div className="absolute inset-0 rounded-full border-2 border-t-violet border-transparent animate-spin" />
        <div className="absolute inset-2 rounded-full border border-t-violet/40 border-transparent" style={{ animation: 'spin 0.7s linear infinite reverse' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-violet animate-pulse-slow" />
        </div>
      </div>

      {/* Title + current layer */}
      <div className="text-center">
        <p className="text-offwhite font-display font-semibold text-xl">Running 7-layer pipeline</p>
        <p className="text-muted text-sm mt-1.5">{layer}</p>
        {/* Progress bar */}
        <div className="mt-3 w-56 mx-auto h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-violet rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: EXPO }}
          />
        </div>
        <p className="text-muted/55 text-xs mt-2 font-mono-data">{progress}%</p>
      </div>

      {/* Layer timeline */}
      <div className="w-full space-y-3">
        {LAYERS.map((lyr, i) => {
          const isDone   = activeLayer > i
          const isActive = activeLayer === i
          return (
            <motion.div
              key={lyr.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4, ease: EXPO }}
              className="flex items-center gap-3"
            >
              {/* Status dot */}
              <div className="relative w-6 h-6 flex-shrink-0 flex items-center justify-center">
                {isDone ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: `${lyr.color}22`, border: `1px solid ${lyr.color}` }}
                  >
                    <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke={lyr.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.div>
                ) : isActive ? (
                  <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: `${lyr.color} ${lyr.color}55 ${lyr.color}55 ${lyr.color}55` }} />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-white/8 border border-white/10" />
                )}
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <span
                  className="text-sm font-medium transition-colors duration-300 truncate block"
                  style={{ color: isDone ? lyr.color : isActive ? '#E8E8F0' : 'rgba(107,107,138,0.5)' }}
                >
                  <span className="mr-2 text-base">{lyr.icon}</span>
                  {lyr.id} — {lyr.label}
                </span>
                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs block mt-0.5"
                      style={{ color: `${lyr.color}bb` }}
                    >
                      {lyr.desc}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {isDone && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs font-mono-data font-semibold flex-shrink-0"
                  style={{ color: `${lyr.color}cc` }}
                >
                  done
                </motion.span>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
