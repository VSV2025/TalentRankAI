import { useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import ScoreBar from './ScoreBar'
import ScoreRadar from './ScoreRadar'

const EXPO = [0.22, 1, 0.36, 1]

/* ── Tier badge ── */
function TierBadge({ score }) {
  if (score >= 90) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(63,207,142,0.12)', color: '#3FCF8E', border: '1px solid rgba(63,207,142,0.25)' }}>Elite</span>
  if (score >= 80) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,92,255,0.12)', color: '#A78BFA', border: '1px solid rgba(124,92,255,0.25)' }}>Strong</span>
  if (score >= 70) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(110,168,254,0.12)', color: '#6EA8FE', border: '1px solid rgba(110,168,254,0.25)' }}>Good</span>
  if (score >= 60) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,166,35,0.12)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.25)' }}>Fair</span>
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(244,91,91,0.10)', color: '#F45B5B', border: '1px solid rgba(244,91,91,0.2)' }}>Below Bar</span>
}

/* ── Compute path badge ── */
function ComputeBadge({ path }) {
  if (path === 'reasoning-llm') return (
    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(63,207,142,0.08)', color: '#3FCF8E', border: '1px solid rgba(63,207,142,0.15)' }}>
      <span>🧠</span> 70B
    </span>
  )
  if (path === 'heuristic') return (
    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(244,91,91,0.08)', color: '#F45B5B', border: '1px solid rgba(244,91,91,0.15)' }}>
      <span>⚠️</span> Fallback
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(124,92,255,0.08)', color: '#A78BFA', border: '1px solid rgba(124,92,255,0.15)' }}>
      <span>⚡</span> 8B
    </span>
  )
}

/* ── Verification badge ── */
function VerificationBadge({ status }) {
  if (status === 'verified') return (
    <span className="inline-flex items-center gap-1 text-xs bg-signal-green/[0.1] border border-signal-green/25 text-signal-green rounded-full px-2 py-0.5 font-medium">
      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      Verified
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-signal-amber/[0.1] border border-signal-amber/25 text-signal-amber rounded-full px-2 py-0.5 font-medium">
      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01" /></svg>
      Review
    </span>
  )
}

/* ── Score ring ── */
function ScoreRing({ score, size = 52 }) {
  const color = score >= 90 ? '#3FCF8E' : score >= 80 ? '#7C5CFF' : score >= 70 ? '#6EA8FE' : score >= 60 ? '#F5A623' : '#F45B5B'
  const r = size * 0.4
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ}` }}
          transition={{ duration: 1.1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${color}bb)` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono-data font-bold" style={{ color, fontSize: size * 0.22 }}>{score}</span>
      </div>
    </div>
  )
}

/* ── Mini graph bar ── */
function MiniBar({ label, value, color }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] text-muted/40 w-14 text-right flex-shrink-0">{label}</span>
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, ease: EXPO }}
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 6px ${color}55` }}
        />
      </div>
      <span className="text-[9px] font-mono-data w-6 text-right flex-shrink-0" style={{ color }}>{value}</span>
    </div>
  )
}

const rankStyle = r =>
  r === 1  ? { border: '#3FCF8E', bg: 'rgba(63,207,142,0.10)', text: '#3FCF8E' }
  : r <= 3 ? { border: '#7C5CFF', bg: 'rgba(124,92,255,0.10)', text: '#7C5CFF' }
           : { border: 'rgba(255,255,255,0.08)', bg: 'transparent', text: '#6B6B8A' }

export default function CandidateCard({ candidate, rank, animDelay = 0, selected, onSelect }) {
  const [expanded, setExpanded] = useState(false)
  const rs = rankStyle(rank)

  /* 3D tilt */
  const mx = useMotionValue(0); const my = useMotionValue(0)
  const rx = useTransform(my, [-50, 50], [2.5, -2.5])
  const ry = useTransform(mx, [-50, 50], [-3, 3])
  const srx = useSpring(rx, { stiffness: 220, damping: 22 })
  const sry = useSpring(ry, { stiffness: 220, damping: 22 })
  const gloss = useTransform(mx, [-50, 50], ['rgba(255,255,255,0.03)', 'rgba(124,92,255,0.05)'])

  const handleMouse = e => {
    const r = e.currentTarget.getBoundingClientRect()
    mx.set(e.clientX - r.left - r.width / 2)
    my.set(e.clientY - r.top - r.height / 2)
  }
  const reset = () => { mx.set(0); my.set(0) }

  const isSelected = selected === candidate.id

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: animDelay / 1000, ease: EXPO }}
      style={{ perspective: 900 }}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
    >
      <motion.div
        style={{ rotateX: srx, rotateY: sry, transformStyle: 'preserve-3d' }}
        className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200"
        onClick={() => onSelect?.(isSelected ? null : candidate.id)}
        style={{
          background: isSelected
            ? 'rgba(124,92,255,0.08)'
            : 'rgba(11,11,20,0.48)',
          backdropFilter: 'blur(28px)',
          border: isSelected
            ? '1px solid rgba(124,92,255,0.35)'
            : '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Gloss */}
        <motion.div style={{ background: gloss }} className="absolute inset-0 pointer-events-none z-10" />

        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-full" style={{ background: 'linear-gradient(to bottom, #7C5CFF, #3FCF8E)' }} />
        )}

        {/* Main row */}
        <div className="relative z-20 p-4 flex items-center gap-3">
          {/* Rank */}
          <div
            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono-data font-bold border"
            style={{ borderColor: rs.border, color: rs.text, background: rs.bg }}
          >
            {rank}
          </div>

          <ScoreRing score={candidate.overallScore} size={48} />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              <span className="font-display font-semibold text-offwhite text-sm truncate">{candidate.name}</span>
              <TierBadge score={candidate.overallScore} />
              <ComputeBadge path={candidate.computePath} />
              {candidate.borderline && (
                <span className="text-[10px] bg-violet/[0.1] border border-violet/20 text-violet-light rounded-full px-1.5 py-0.5">Borderline</span>
              )}
            </div>
            <p className="text-muted/60 text-[11px] truncate">{candidate.title} · {candidate.location}</p>

            {/* Mini sub-scores */}
            <div className="flex gap-3 mt-1.5 flex-wrap">
              {[
                { key: 'skillsMatch', label: 'Skills', color: '#7C5CFF' },
                { key: 'semanticRelevance', label: 'Semantic', color: '#3FCF8E' },
                { key: 'behavioralSignal', label: 'Behavior', color: '#A78BFA' },
              ].map(({ key, label, color }) => (
                <span key={key} className="text-[10px] font-mono-data" style={{ color }}>
                  {label} <span style={{ opacity: 0.6 }}>{candidate.scores?.[key]?.toFixed(1)}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Verification + expand */}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <VerificationBadge status={candidate.verificationStatus} />
            <motion.button
              whileHover={{ backgroundColor: 'rgba(124,92,255,0.12)' }}
              whileTap={{ scale: 0.9 }}
              onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
              className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-muted hover:text-violet transition-colors duration-150"
            >
              <motion.svg animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.22 }}
                className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </motion.svg>
            </motion.button>
          </div>
        </div>

        {/* Highlights strip */}
        {candidate.highlights?.length > 0 && (
          <div className="relative z-20 px-4 pb-3 flex flex-wrap gap-1.5">
            {candidate.highlights.slice(0, 3).map((h, i) => (
              <span key={i} className="text-[10px] bg-ink-4/50 text-muted/60 rounded-lg px-2 py-0.5 border border-white/[0.05] truncate max-w-[260px]">{h}</span>
            ))}
          </div>
        )}

        {candidate.reviewNote && (
          <div className="relative z-20 mx-4 mb-3 flex items-start gap-2 text-xs text-signal-amber bg-signal-amber/[0.06] border border-signal-amber/15 rounded-xl px-3 py-2">
            <svg className="w-3 h-3 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
            {candidate.reviewNote}
          </div>
        )}

        {/* Expanded detail */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: EXPO }}
              className="overflow-hidden relative z-20"
            >
              <div className="border-t border-white/[0.06] px-4 py-4 space-y-5">
                {/* Radar + sub-score bars side by side */}
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0">
                    <ScoreRadar
                      scores={candidate.scores}
                      graphFitScore={candidate.graphFitScore}
                      skillBreadthScore={candidate.skillBreadthScore}
                      size={160}
                    />
                  </div>
                  <div className="flex-1 space-y-2 pt-2">
                    <p className="text-[10px] text-muted/40 uppercase tracking-widest font-semibold mb-2">Sub-scores</p>
                    <ScoreBar label="Skills match"       value={candidate.scores?.skillsMatch}       delay={0}    />
                    <ScoreBar label="Semantic relevance" value={candidate.scores?.semanticRelevance} delay={0.05} />
                    <ScoreBar label="Behavioral signal"  value={candidate.scores?.behavioralSignal}  delay={0.10} />
                    <ScoreBar label="Career trajectory"  value={candidate.scores?.careerTrajectory}  delay={0.15} />
                    {candidate.graphFitScore != null && (
                      <MiniBar label="Graph fit"    value={candidate.graphFitScore?.toFixed(1)}    color="#38BDF8" />
                    )}
                    {candidate.skillBreadthScore != null && (
                      <MiniBar label="Skill breadth" value={candidate.skillBreadthScore?.toFixed(1)} color="#EC4899" />
                    )}
                  </div>
                </div>

                {/* Why rank */}
                <div>
                  <p className="text-[10px] text-muted/40 uppercase tracking-widest font-semibold mb-2">Why this rank</p>
                  <p className="text-xs text-muted/80 leading-relaxed">{candidate.whyRank}</p>
                </div>

                {/* Evidence */}
                {candidate.evidence?.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted/40 uppercase tracking-widest font-semibold mb-2">Evidence</p>
                    <div className="space-y-1.5">
                      {candidate.evidence.map((ev, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-muted/70 bg-ink-3/50 rounded-xl px-3 py-2 border border-white/[0.05]">
                          <svg className="w-2.5 h-2.5 text-violet/50 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                          </svg>
                          {ev}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Agent debate */}
                {candidate.debate && (
                  <div>
                    <p className="text-[10px] text-muted/40 uppercase tracking-widest font-semibold mb-2">Agent debate — borderline</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-signal-green/[0.05] border border-signal-green/15 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-4 h-4 rounded-full bg-signal-green/15 border border-signal-green/30 flex items-center justify-center">
                            <svg className="w-2 h-2 text-signal-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          </div>
                          <span className="text-[10px] font-bold text-signal-green">Pro</span>
                        </div>
                        <p className="text-[11px] text-muted/70 leading-relaxed">{candidate.debate.pro}</p>
                      </div>
                      <div className="bg-signal-amber/[0.05] border border-signal-amber/15 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-4 h-4 rounded-full bg-signal-amber/15 border border-signal-amber/30 flex items-center justify-center">
                            <svg className="w-2 h-2 text-signal-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01" /></svg>
                          </div>
                          <span className="text-[10px] font-bold text-signal-amber">Skeptic</span>
                        </div>
                        <p className="text-[11px] text-muted/70 leading-relaxed">{candidate.debate.skeptic}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
