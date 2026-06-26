import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../../api/client'
import { mockCandidates, mockJobDescription, funnelStages as mockFunnel } from '../../data/mockCandidates'
import CandidateFunnel from './CandidateFunnel'
import CandidateCard from './CandidateCard'
import PipelineProgress from './PipelineProgress'
import ScoreRadar from './ScoreRadar'
import ScoreBar from './ScoreBar'

const EXPO = [0.22, 1, 0.36, 1]
const JOB_ID = 1

/* ── Dashboard stats header ── */
function StatsHeader({ candidates, timings }) {
  const avg = candidates.length
    ? Math.round(candidates.reduce((s, c) => s + c.overallScore, 0) / candidates.length * 10) / 10
    : 0
  const top = candidates[0]
  const deep = candidates.filter(c => c.computePath === 'reasoning-llm').length
  const verified = candidates.filter(c => c.verificationStatus === 'verified').length

  const stats = [
    { label: 'Candidates', value: candidates.length, color: '#7C5CFF', suffix: '' },
    { label: 'Avg score', value: avg, color: '#3FCF8E', suffix: '' },
    { label: 'Deep eval', value: deep, color: '#A78BFA', suffix: ' of ' + candidates.length },
    { label: 'Verified', value: verified, color: '#38BDF8', suffix: '' },
  ]

  return (
    <div className="grid grid-cols-4 gap-3 mb-5">
      {stats.map(({ label, value, color, suffix }) => (
        <div key={label} className="glass-gradient-border rounded-xl p-3 text-center">
          <div className="font-mono-data font-bold text-xl" style={{ color, textShadow: `0 0 14px ${color}88` }}>
            {value}{suffix}
          </div>
          <div className="text-[10px] text-muted/50 mt-0.5 uppercase tracking-widest">{label}</div>
        </div>
      ))}
    </div>
  )
}

/* ── Filters sidebar ── */
function FilterPanel({ minScore, setMinScore, sortBy, setSortBy, filterVerification, setFilterVerification, filterCompute, setFilterCompute, count }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] text-muted/40 uppercase tracking-widest font-semibold mb-3">Sort by</p>
        <div className="space-y-1">
          {[
            { key: 'overall', label: 'Overall score' },
            { key: 'skills', label: 'Skills match' },
            { key: 'semantic', label: 'Semantic fit' },
            { key: 'graph', label: 'Graph fit' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-150 cursor-pointer"
              style={{
                background: sortBy === key ? 'rgba(124,92,255,0.12)' : 'transparent',
                color: sortBy === key ? '#A78BFA' : 'rgba(107,107,138,0.7)',
                border: sortBy === key ? '1px solid rgba(124,92,255,0.25)' : '1px solid transparent',
              }}
            >
              {sortBy === key && <div className="w-1 h-1 rounded-full bg-violet flex-shrink-0" />}
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] text-muted/40 uppercase tracking-widest font-semibold mb-2">Min score: <span className="text-violet font-mono-data">{minScore}</span></p>
        <input
          type="range" min={0} max={100} value={minScore}
          onChange={e => setMinScore(Number(e.target.value))}
          className="w-full accent-violet cursor-pointer"
          style={{ accentColor: '#7C5CFF' }}
        />
        <div className="flex justify-between text-[9px] text-muted/30 mt-1">
          <span>0</span><span>50</span><span>100</span>
        </div>
      </div>

      <div>
        <p className="text-[10px] text-muted/40 uppercase tracking-widest font-semibold mb-2">Verification</p>
        <div className="space-y-1">
          {[
            { key: 'all', label: 'All candidates' },
            { key: 'verified', label: 'Verified only' },
            { key: 'review', label: 'Needs review' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilterVerification(key)}
              className="w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer"
              style={{
                background: filterVerification === key ? 'rgba(124,92,255,0.10)' : 'transparent',
                color: filterVerification === key ? '#A78BFA' : 'rgba(107,107,138,0.7)',
              }}
            >{label}</button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] text-muted/40 uppercase tracking-widest font-semibold mb-2">Compute path</p>
        <div className="space-y-1">
          {[
            { key: 'all', label: 'All' },
            { key: 'fast-llm', label: '⚡ Fast (8B)' },
            { key: 'reasoning-llm', label: '🧠 Reasoning (70B)' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilterCompute(key)}
              className="w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer"
              style={{
                background: filterCompute === key ? 'rgba(124,92,255,0.10)' : 'transparent',
                color: filterCompute === key ? '#A78BFA' : 'rgba(107,107,138,0.7)',
              }}
            >{label}</button>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-white/[0.05]">
        <div className="text-center">
          <span className="text-xs text-muted/50">{count} matching</span>
        </div>
      </div>
    </div>
  )
}

/* ── Detail panel (right side) ── */
function DetailPanel({ candidate, onClose }) {
  if (!candidate) return null

  const tierColor = candidate.overallScore >= 90 ? '#3FCF8E'
    : candidate.overallScore >= 80 ? '#7C5CFF'
    : candidate.overallScore >= 70 ? '#6EA8FE'
    : candidate.overallScore >= 60 ? '#F5A623' : '#F45B5B'

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.35, ease: EXPO }}
      className="h-full overflow-y-auto"
      style={{ scrollbarWidth: 'thin' }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 glass-strong rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-bold text-offwhite text-sm truncate">{candidate.name}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: `${tierColor}15`, color: tierColor, border: `1px solid ${tierColor}30` }}>
              {candidate.overallScore}
            </span>
          </div>
          <p className="text-muted/60 text-[11px] truncate">{candidate.title} · {candidate.location}</p>
        </div>
        <button onClick={onClose} className="flex-shrink-0 w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-muted hover:text-offwhite transition-colors cursor-pointer">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Radar chart */}
      <div className="glass-gradient-border rounded-2xl p-4 mb-4 flex flex-col items-center">
        <p className="text-[10px] text-muted/40 uppercase tracking-widest font-semibold mb-3 self-start">6-axis profile</p>
        <ScoreRadar
          scores={candidate.scores}
          graphFitScore={candidate.graphFitScore}
          skillBreadthScore={candidate.skillBreadthScore}
          size={200}
        />
      </div>

      {/* Sub-scores */}
      <div className="glass-gradient-border rounded-2xl p-4 mb-4 space-y-2.5">
        <p className="text-[10px] text-muted/40 uppercase tracking-widest font-semibold mb-3">Sub-scores</p>
        <ScoreBar label="Skills match"       value={candidate.scores?.skillsMatch}       delay={0}    />
        <ScoreBar label="Semantic relevance" value={candidate.scores?.semanticRelevance} delay={0.05} />
        <ScoreBar label="Behavioral signal"  value={candidate.scores?.behavioralSignal}  delay={0.10} />
        <ScoreBar label="Career trajectory"  value={candidate.scores?.careerTrajectory}  delay={0.15} />
        {candidate.graphFitScore != null && (
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-muted/70">Graph fit</span>
              <span className="text-xs font-mono-data font-semibold" style={{ color: '#38BDF8' }}>{candidate.graphFitScore}</span>
            </div>
            <div className="h-1.5 bg-ink-4/80 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${candidate.graphFitScore}%` }}
                transition={{ duration: 0.7, delay: 0.20, ease: EXPO }}
                className="h-full rounded-full" style={{ background: '#38BDF8', boxShadow: '0 0 8px #38BDF866' }} />
            </div>
          </div>
        )}
        {candidate.skillBreadthScore != null && (
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-muted/70">Skill breadth</span>
              <span className="text-xs font-mono-data font-semibold" style={{ color: '#EC4899' }}>{candidate.skillBreadthScore}</span>
            </div>
            <div className="h-1.5 bg-ink-4/80 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${candidate.skillBreadthScore}%` }}
                transition={{ duration: 0.7, delay: 0.25, ease: EXPO }}
                className="h-full rounded-full" style={{ background: '#EC4899', boxShadow: '0 0 8px #EC489966' }} />
            </div>
          </div>
        )}
      </div>

      {/* Why rank */}
      <div className="glass-gradient-border rounded-2xl p-4 mb-4">
        <p className="text-[10px] text-muted/40 uppercase tracking-widest font-semibold mb-2">Why this rank</p>
        <p className="text-xs text-muted/80 leading-relaxed">{candidate.whyRank}</p>
      </div>

      {/* Evidence */}
      {candidate.evidence?.length > 0 && (
        <div className="glass-gradient-border rounded-2xl p-4 mb-4">
          <p className="text-[10px] text-muted/40 uppercase tracking-widest font-semibold mb-3">Quoted evidence</p>
          <div className="space-y-2">
            {candidate.evidence.map((ev, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-muted/70 bg-ink-3/50 rounded-xl px-3 py-2.5 border border-white/[0.05]">
                <svg className="w-2.5 h-2.5 text-violet/50 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                {ev}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debate */}
      {candidate.debate && (
        <div className="glass-gradient-border rounded-2xl p-4 mb-4">
          <p className="text-[10px] text-muted/40 uppercase tracking-widest font-semibold mb-3">Agent debate — borderline candidate</p>
          <div className="space-y-3">
            <div className="bg-signal-green/[0.05] border border-signal-green/15 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-4 h-4 rounded-full bg-signal-green/15 border border-signal-green/30 flex items-center justify-center">
                  <svg className="w-2 h-2 text-signal-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="text-[10px] font-bold text-signal-green">Pro agent</span>
              </div>
              <p className="text-xs text-muted/75 leading-relaxed">{candidate.debate.pro}</p>
            </div>
            <div className="bg-signal-amber/[0.05] border border-signal-amber/15 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-4 h-4 rounded-full bg-signal-amber/15 border border-signal-amber/30 flex items-center justify-center">
                  <svg className="w-2 h-2 text-signal-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01" /></svg>
                </div>
                <span className="text-[10px] font-bold text-signal-amber">Skeptic agent</span>
              </div>
              <p className="text-xs text-muted/75 leading-relaxed">{candidate.debate.skeptic}</p>
            </div>
          </div>
        </div>
      )}

      {/* Review note */}
      {candidate.reviewNote && (
        <div className="mb-4 flex items-start gap-2 text-xs text-signal-amber bg-signal-amber/[0.06] border border-signal-amber/15 rounded-xl px-3 py-2">
          <svg className="w-3 h-3 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01" /></svg>
          {candidate.reviewNote}
        </div>
      )}
    </motion.div>
  )
}

export default function RecruiterDashboard() {
  const [jd, setJd] = useState(mockJobDescription)
  const [candidates, setCandidates] = useState([])
  const [funnelData, setFunnelData] = useState(mockFunnel)
  const [isRanking, setIsRanking] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [funnelKey, setFunnelKey] = useState(0)
  const [selectedId, setSelectedId] = useState(null)

  /* Filters */
  const [sortBy, setSortBy] = useState('overall')
  const [minScore, setMinScore] = useState(0)
  const [filterVerification, setFilterVerification] = useState('all')
  const [filterCompute, setFilterCompute] = useState('all')

  const [jdExpanded, setJdExpanded] = useState(false)

  useEffect(() => {
    async function loadInitial() {
      try {
        const [ranked, funnel] = await Promise.all([
          api.getRanked(JOB_ID),
          api.getFunnel(JOB_ID),
        ])
        setCandidates(ranked)
        setFunnelData(funnel)
        setShowResults(true)
      } catch {
        const sorted = [...mockCandidates].sort((a, b) => b.overallScore - a.overallScore)
        setCandidates(sorted)
        setFunnelData(mockFunnel)
        setShowResults(true)
      } finally {
        setLoading(false)
      }
    }
    loadInitial()
  }, [])

  const handleRank = async () => {
    setIsRanking(true)
    setShowResults(false)
    setSelectedId(null)
    setFunnelKey(k => k + 1)
    setError(null)
    try {
      const ranked = await api.runRank(JOB_ID, jd)
      const funnel = await api.getFunnel(JOB_ID)
      setCandidates(ranked)
      setFunnelData(funnel)
    } catch (e) {
      setError(e.message)
    } finally {
      setIsRanking(false)
      setShowResults(true)
    }
  }

  const getSortValue = c => {
    if (sortBy === 'skills')   return c.scores?.skillsMatch ?? 0
    if (sortBy === 'semantic') return c.scores?.semanticRelevance ?? 0
    if (sortBy === 'graph')    return c.graphFitScore ?? 0
    return c.overallScore
  }

  const displayed = useMemo(() => {
    return candidates
      .filter(c => c.overallScore >= minScore)
      .filter(c => filterVerification === 'all' || c.verificationStatus === filterVerification)
      .filter(c => filterCompute === 'all' || c.computePath === filterCompute)
      .sort((a, b) => getSortValue(b) - getSortValue(a))
  }, [candidates, minScore, sortBy, filterVerification, filterCompute])

  const selectedCandidate = candidates.find(c => c.id === selectedId)

  return (
    <div className="min-h-screen pt-24 pb-8 px-4 relative">
      <div className="relative z-10 max-w-[1400px] mx-auto">

        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-md bg-violet/15 border border-violet/25 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-violet" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-xs text-muted/50 uppercase tracking-widest font-medium">Recruiter Intelligence</span>
              </div>
              <h1 className="font-display font-bold text-3xl text-offwhite leading-tight">Ranked Shortlist</h1>
            </div>
          </div>
        </motion.div>

        {/* JD Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
          className="glass-gradient-border rounded-2xl mb-5">
          <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setJdExpanded(v => !v)}>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted/50 uppercase tracking-widest font-medium">Job description</span>
              <span className="text-xs font-mono-data text-muted/30">{jd.split(/\s+/).filter(Boolean).length}w</span>
            </div>
            <div className="flex items-center gap-2">
              {error && <span className="text-xs text-signal-red bg-signal-red/[0.08] border border-signal-red/20 rounded-lg px-2.5 py-1">{error}</span>}
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={e => { e.stopPropagation(); handleRank() }}
                disabled={isRanking || !jd.trim()}
                className="flex items-center gap-2 bg-violet hover:bg-violet-dim disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer shadow-violet-sm hover:shadow-violet-glow text-xs"
              >
                {isRanking ? (
                  <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Ranking…</>
                ) : (
                  <><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>Rank</>
                )}
              </motion.button>
              <motion.div animate={{ rotate: jdExpanded ? 180 : 0 }} transition={{ duration: 0.22 }}>
                <svg className="w-4 h-4 text-muted/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </motion.div>
            </div>
          </div>
          <AnimatePresence>
            {jdExpanded && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                transition={{ duration: 0.3, ease: EXPO }} className="overflow-hidden">
                <div className="px-4 pb-4">
                  <textarea
                    value={jd} onChange={e => setJd(e.target.value)} rows={6}
                    className="w-full bg-ink-3/50 border border-white/[0.07] hover:border-white/[0.12] focus:border-violet/50 focus:shadow-[0_0_0_3px_rgba(124,92,255,0.12)] rounded-xl px-4 py-3 text-xs text-muted/90 outline-none resize-none transition-all duration-200 leading-relaxed"
                    placeholder="Paste the full job description here…"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Ranking animation */}
        <AnimatePresence>
          {isRanking && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="glass-gradient-border rounded-2xl mb-5">
              <PipelineProgress />
            </motion.div>
          )}
        </AnimatePresence>

        {loading && !isRanking && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-t-violet border-white/10 rounded-full animate-spin" />
          </div>
        )}

        <AnimatePresence>
          {showResults && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

              {/* Stats */}
              <StatsHeader candidates={candidates} />

              {/* Funnel */}
              <CandidateFunnel key={funnelKey} funnelData={funnelData} />

              {/* 3-column layout */}
              <div className="flex gap-4 items-start">

                {/* Left: Filters */}
                <motion.div
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="w-44 flex-shrink-0 glass-gradient-border rounded-2xl p-4 sticky top-24"
                >
                  <p className="text-[10px] text-muted/40 uppercase tracking-widest font-semibold mb-4">Filters</p>
                  <FilterPanel
                    minScore={minScore} setMinScore={setMinScore}
                    sortBy={sortBy} setSortBy={setSortBy}
                    filterVerification={filterVerification} setFilterVerification={setFilterVerification}
                    filterCompute={filterCompute} setFilterCompute={setFilterCompute}
                    count={displayed.length}
                  />
                </motion.div>

                {/* Center: Candidate list */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <h2 className="font-display font-bold text-offwhite text-lg">{displayed.length} candidates</h2>
                      <div className="flex items-center gap-1.5 bg-signal-green/[0.07] border border-signal-green/20 rounded-full px-2.5 py-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-signal-green" />
                        <span className="text-signal-green text-[10px] font-semibold">Fairness checked</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted/40 font-mono-data">
                      Sort: {sortBy === 'overall' ? 'Overall' : sortBy === 'skills' ? 'Skills' : sortBy === 'semantic' ? 'Semantic' : 'Graph fit'}
                    </span>
                  </div>

                  {displayed.map((c, i) => (
                    <CandidateCard
                      key={c.id}
                      candidate={c}
                      rank={candidates.sort((a, b) => b.overallScore - a.overallScore).findIndex(s => s.id === c.id) + 1}
                      animDelay={i * 50}
                      selected={selectedId}
                      onSelect={setSelectedId}
                    />
                  ))}

                  {displayed.length === 0 && (
                    <div className="glass-gradient-border rounded-2xl p-8 text-center">
                      <p className="text-muted/50 text-sm">No candidates match current filters.</p>
                      <button onClick={() => { setMinScore(0); setFilterVerification('all'); setFilterCompute('all') }}
                        className="mt-3 text-violet text-xs underline cursor-pointer">Reset filters</button>
                    </div>
                  )}
                </div>

                {/* Right: Detail panel */}
                <AnimatePresence>
                  {selectedCandidate && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 320 }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.35, ease: EXPO }}
                      className="flex-shrink-0 overflow-hidden"
                      style={{ maxHeight: 'calc(100vh - 7rem)', position: 'sticky', top: '6rem' }}
                    >
                      <div className="w-80 glass-gradient-border rounded-2xl p-4 max-h-full overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                        <DetailPanel candidate={selectedCandidate} onClose={() => setSelectedId(null)} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
