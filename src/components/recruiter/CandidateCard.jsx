import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ScoreBar from './ScoreBar'
import ScoreRadar from './ScoreRadar'

const EXPO = [0.22, 1, 0.36, 1]

function TierBadge({ score }) {
  if (score >= 90) return <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(63,207,142,0.15)', color: '#3FCF8E', border: '1px solid rgba(63,207,142,0.3)' }}>Elite</span>
  if (score >= 80) return <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(124,92,255,0.15)', color: '#C4B5FD', border: '1px solid rgba(124,92,255,0.3)' }}>Strong</span>
  if (score >= 70) return <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(110,168,254,0.15)', color: '#6EA8FE', border: '1px solid rgba(110,168,254,0.3)' }}>Good</span>
  if (score >= 60) return <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(245,166,35,0.15)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.3)' }}>Fair</span>
  return <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(244,91,91,0.12)', color: '#F45B5B', border: '1px solid rgba(244,91,91,0.25)' }}>Below Bar</span>
}

function ComputeBadge({ path }) {
  if (path === 'reasoning-llm') return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md" style={{ background: 'rgba(63,207,142,0.10)', color: '#3FCF8E', border: '1px solid rgba(63,207,142,0.2)' }}>
      🧠 70B
    </span>
  )
  if (path === 'heuristic') return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md" style={{ background: 'rgba(244,91,91,0.10)', color: '#F45B5B', border: '1px solid rgba(244,91,91,0.2)' }}>
      ⚠ Fallback
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md" style={{ background: 'rgba(124,92,255,0.10)', color: '#A78BFA', border: '1px solid rgba(124,92,255,0.2)' }}>
      ⚡ 8B
    </span>
  )
}

function VerificationBadge({ status }) {
  if (status === 'verified') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(63,207,142,0.12)', color: '#3FCF8E', border: '1px solid rgba(63,207,142,0.25)' }}>
      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      Verified
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(245,166,35,0.12)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.25)' }}>
      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01" /></svg>
      Review
    </span>
  )
}

function ScoreRing({ score, size = 52 }) {
  const color = score >= 90 ? '#3FCF8E' : score >= 80 ? '#7C5CFF' : score >= 70 ? '#6EA8FE' : score >= 60 ? '#F5A623' : '#F45B5B'
  const r = size * 0.4
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ}` }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${color}bb)` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono-data font-bold" style={{ color, fontSize: size * 0.22 }}>{score}</span>
      </div>
    </div>
  )
}

const rankStyle = r =>
  r === 1  ? { border: '#3FCF8E', bg: 'rgba(63,207,142,0.12)', text: '#3FCF8E' }
  : r <= 3 ? { border: '#7C5CFF', bg: 'rgba(124,92,255,0.12)', text: '#A78BFA' }
           : { border: 'rgba(255,255,255,0.14)', bg: 'transparent', text: '#8B8BAA' }

function SectionLabel({ children }) {
  return <p className="text-xs text-slate-300 uppercase tracking-widest font-semibold mb-2.5">{children}</p>
}

export default function CandidateCard({ candidate, rank, animDelay = 0 }) {
  const [expanded, setExpanded] = useState(false)
  const rs = rankStyle(rank)
  const cardRef = useRef(null)

  useEffect(() => {
    if (expanded && cardRef.current) {
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 80)
    }
  }, [expanded])

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: animDelay / 1000, ease: EXPO }}
    >
      <div
        className="relative rounded-2xl overflow-hidden cursor-pointer transition-colors duration-200"
        onClick={() => setExpanded(v => !v)}
        style={{
          background: expanded ? 'rgba(14,13,24,0.92)' : 'rgba(14,13,24,0.78)',
          backdropFilter: 'blur(12px)',
          border: expanded
            ? '1px solid rgba(124,92,255,0.32)'
            : '1px solid rgba(255,255,255,0.09)',
        }}
      >
        {/* Left accent when expanded */}
        {expanded && (
          <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-full" style={{ background: 'linear-gradient(to bottom, #7C5CFF, #3FCF8E)' }} />
        )}

        {/* ── Header row ── */}
        <div className="relative z-10 p-4 flex items-center gap-3">
          <div
            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono-data font-bold border"
            style={{ borderColor: rs.border, color: rs.text, background: rs.bg }}
          >
            {rank}
          </div>

          <ScoreRing score={candidate.overallScore} size={52} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="font-display font-semibold text-white text-base truncate">{candidate.name}</span>
              <TierBadge score={candidate.overallScore} />
              <ComputeBadge path={candidate.computePath} />
              {candidate.borderline && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,92,255,0.12)', color: '#C4B5FD', border: '1px solid rgba(124,92,255,0.25)' }}>Borderline</span>
              )}
            </div>
            <p className="text-slate-300 text-xs truncate mb-1">{candidate.title} · {candidate.location}</p>
            <div className="flex gap-4 flex-wrap">
              {[
                { key: 'skillsMatch',       label: 'Skills',   color: '#A78BFA' },
                { key: 'semanticRelevance', label: 'Semantic', color: '#3FCF8E' },
                { key: 'behavioralSignal',  label: 'Behavior', color: '#6EA8FE' },
              ].map(({ key, label, color }) => (
                <span key={key} className="text-xs font-mono-data" style={{ color }}>
                  {label} <span style={{ color: '#C4B5FD' }}>{candidate.scores?.[key]?.toFixed(1)}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <VerificationBadge status={candidate.verificationStatus} />
            <div className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-slate-300">
              <motion.svg animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.22 }}
                className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </motion.svg>
            </div>
          </div>
        </div>

        {/* Highlights strip */}
        {candidate.highlights?.length > 0 && (
          <div className="relative z-10 px-4 pb-3 flex flex-wrap gap-2">
            {candidate.highlights.slice(0, 3).map((h, i) => (
              <span key={i} className="text-xs text-slate-300 rounded-lg px-2.5 py-1 border truncate max-w-[260px]"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.10)' }}>{h}</span>
            ))}
          </div>
        )}

        {candidate.reviewNote && (
          <div className="relative z-10 mx-4 mb-3 rounded-xl px-3 py-2.5"
            style={{ background: 'rgba(245,166,35,0.07)', border: '1px solid rgba(245,166,35,0.18)' }}>
            {candidate.reviewNote.split(' | ').filter(Boolean).map((note, i) => (
              <div key={i} className="flex items-start gap-2 text-sm" style={{ color: '#F5A623', marginTop: i > 0 ? '6px' : 0 }}>
                <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                {note.trim()}
              </div>
            ))}
          </div>
        )}

        {/* ═══ FULL EXPANDED DETAIL ═══ */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: EXPO }}
              className="overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="border-t px-5 py-5 space-y-6" style={{ borderColor: 'rgba(255,255,255,0.09)' }}>

                {/* Score summary grid */}
                <div className="grid grid-cols-5 gap-2.5">
                  {[
                    { label: 'Skills Match',  value: candidate.scores?.skillsMatch,        color: '#A78BFA' },
                    { label: 'Semantic Fit',  value: candidate.scores?.semanticRelevance,   color: '#3FCF8E' },
                    { label: 'Behavioral',    value: candidate.scores?.behavioralSignal,    color: '#6EA8FE' },
                    { label: 'Career',        value: candidate.scores?.careerTrajectory,    color: '#F5A623' },
                    { label: 'Prod Evidence', value: candidate.scores?.productionEvidence,  color: '#F45B5B' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl p-3 text-center"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
                      <div className="font-mono-data font-bold text-xl" style={{ color }}>{value?.toFixed(1) ?? '–'}</div>
                      <div className="text-slate-300 text-xs mt-1.5 uppercase tracking-wider leading-tight">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Radar + bar scores */}
                <div className="flex gap-6 items-start">
                  <div className="flex-shrink-0">
                    <SectionLabel>Profile radar</SectionLabel>
                    <ScoreRadar
                      scores={candidate.scores}
                      graphFitScore={candidate.graphFitScore}
                      skillBreadthScore={candidate.skillBreadthScore}
                      size={180}
                    />
                  </div>
                  <div className="flex-1 space-y-3 pt-7">
                    <ScoreBar label="Skills match"       value={candidate.scores?.skillsMatch}         delay={0}    />
                    <ScoreBar label="Semantic relevance" value={candidate.scores?.semanticRelevance}  delay={0.03} />
                    <ScoreBar label="Behavioral signal"  value={candidate.scores?.behavioralSignal}   delay={0.06} />
                    <ScoreBar label="Career trajectory"  value={candidate.scores?.careerTrajectory}   delay={0.09} />
                    <ScoreBar label="Prod. evidence"     value={candidate.scores?.productionEvidence} delay={0.12} />
                    {candidate.graphFitScore != null && (
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs text-slate-300">Graph fit</span>
                          <span className="text-sm font-mono-data font-semibold" style={{ color: '#38BDF8' }}>{candidate.graphFitScore}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${candidate.graphFitScore}%` }}
                            transition={{ duration: 0.4, delay: 0.12, ease: EXPO }}
                            className="h-full rounded-full" style={{ background: '#38BDF8', boxShadow: '0 0 8px #38BDF866' }} />
                        </div>
                      </div>
                    )}
                    {candidate.skillBreadthScore != null && (
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs text-slate-300">Skill breadth</span>
                          <span className="text-sm font-mono-data font-semibold" style={{ color: '#EC4899' }}>{candidate.skillBreadthScore}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${candidate.skillBreadthScore}%` }}
                            transition={{ duration: 0.4, delay: 0.15, ease: EXPO }}
                            className="h-full rounded-full" style={{ background: '#EC4899', boxShadow: '0 0 8px #EC489966' }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Why rank */}
                {candidate.whyRank && (
                  <div>
                    <SectionLabel>Why this rank</SectionLabel>
                    <p className="text-sm text-white/85 leading-relaxed">{candidate.whyRank}</p>
                  </div>
                )}

                {/* Career Trajectory — always shown */}
                {(() => {
                  const text = candidate.careerTrajectoryDetail ||
                    (candidate.highlights?.length
                      ? `${candidate.name} has built their career around ${candidate.title || 'their current role'}, demonstrating expertise across ${candidate.highlights.slice(0, 2).join(' and ')}. ${candidate.highlights.length > 2 ? `Further highlights include ${candidate.highlights.slice(2).join(', ')}.` : ''} Their career trajectory score of ${candidate.scores?.careerTrajectory?.toFixed(0) ?? '—'}/100 reflects ${(candidate.scores?.careerTrajectory ?? 0) >= 80 ? 'a strong upward progression well-aligned with this role' : (candidate.scores?.careerTrajectory ?? 0) >= 65 ? 'steady growth with scope for further development in ML engineering' : 'a trajectory that requires meaningful pivoting toward ML/AI engineering for this role'}. Run a new ranking to generate a full AI-written trajectory analysis.`
                      : `Career trajectory score: ${candidate.scores?.careerTrajectory?.toFixed(0) ?? '—'}/100. Run a new ranking to generate a detailed AI-written trajectory analysis for ${candidate.name}.`)
                  return (
                    <div>
                      <SectionLabel>Career trajectory</SectionLabel>
                      <div className="rounded-xl p-4 flex gap-3 items-start"
                        style={{ background: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.14)' }}>
                        <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.25)' }}>
                          <svg className="w-3.5 h-3.5" style={{ color: '#F5A623' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        <p className="text-sm text-white/85 leading-relaxed">{text}</p>
                      </div>
                    </div>
                  )
                })()}

                {/* Limitations — always shown */}
                {(() => {
                  const items = candidate.gaps?.length > 0
                    ? candidate.gaps
                    : candidate.debate?.skeptic
                    ? [candidate.debate.skeptic]
                    : candidate.scores
                    ? [
                        ...(candidate.scores.skillsMatch < 75 ? [`Skills coverage gap: candidate meets only ${candidate.scores.skillsMatch?.toFixed(0)}% of required skills — some hard requirements from the JD are not clearly demonstrated in the resume.`] : []),
                        ...(candidate.scores.productionEvidence < 50 ? [`Limited production ML evidence: production deployment experience scores ${candidate.scores.productionEvidence?.toFixed(0)}/100, suggesting most work has been research or prototype-stage rather than shipped production systems.`] : []),
                        ...(candidate.scores.careerTrajectory < 70 ? [`Career trajectory misalignment: a trajectory score of ${candidate.scores.careerTrajectory?.toFixed(0)}/100 indicates the career arc does not strongly point toward this ML engineering role — prior experience may require significant domain adjustment.`] : []),
                      ]
                    : []
                  const noGaps = items.length === 0
                  return (
                    <div>
                      <SectionLabel>Limitations &amp; requirements gap</SectionLabel>
                      {noGaps ? (
                        <div className="rounded-xl px-4 py-3 flex items-center gap-2.5"
                          style={{ background: 'rgba(63,207,142,0.05)', border: '1px solid rgba(63,207,142,0.16)' }}>
                          <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#3FCF8E' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-white/80">No significant gaps identified — candidate meets all key requirements for this role.</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {items.map((gap, i) => (
                            <div key={i} className="flex items-start gap-2.5 rounded-xl px-3.5 py-2.5"
                              style={{ background: 'rgba(244,91,91,0.05)', border: '1px solid rgba(244,91,91,0.16)' }}>
                              <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#F45B5B' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              <span className="text-sm text-white/80">{gap}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Evidence */}
                {candidate.evidence?.length > 0 && (
                  <div>
                    <SectionLabel>Evidence from resume</SectionLabel>
                    <div className="space-y-2">
                      {candidate.evidence.map((ev, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-sm text-white/85 rounded-xl px-3.5 py-3"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#A78BFA' }} viewBox="0 0 24 24" fill="currentColor">
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
                    <SectionLabel>Agent debate — borderline evaluation</SectionLabel>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl p-4" style={{ background: 'rgba(63,207,142,0.06)', border: '1px solid rgba(63,207,142,0.18)' }}>
                        <div className="flex items-center gap-2 mb-2.5">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(63,207,142,0.15)', border: '1px solid rgba(63,207,142,0.3)' }}>
                            <svg className="w-3 h-3" style={{ color: '#3FCF8E' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-sm font-bold" style={{ color: '#3FCF8E' }}>Pro agent</span>
                        </div>
                        <p className="text-sm text-white/80 leading-relaxed">{candidate.debate.pro}</p>
                      </div>
                      <div className="rounded-xl p-4" style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.18)' }}>
                        <div className="flex items-center gap-2 mb-2.5">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)' }}>
                            <svg className="w-3 h-3" style={{ color: '#F5A623' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01" />
                            </svg>
                          </div>
                          <span className="text-sm font-bold" style={{ color: '#F5A623' }}>Skeptic agent</span>
                        </div>
                        <p className="text-sm text-white/80 leading-relaxed">{candidate.debate.skeptic}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resume snippet */}
                {candidate.resumeSnippet && (
                  <div>
                    <SectionLabel>Resume snippet</SectionLabel>
                    <div className="rounded-xl p-4 font-mono text-sm text-slate-200 leading-relaxed whitespace-pre-wrap"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {candidate.resumeSnippet}
                    </div>
                  </div>
                )}

                {/* Collapse */}
                <div className="flex justify-center pt-1">
                  <button
                    onClick={() => setExpanded(false)}
                    className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-colors duration-150 cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                    Collapse
                  </button>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
