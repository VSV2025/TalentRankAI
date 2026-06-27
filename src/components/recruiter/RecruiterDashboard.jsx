import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../../api/client'
import { mockJobDescription } from '../../data/mockCandidates'
import CandidateFunnel from './CandidateFunnel'
import CandidateCard from './CandidateCard'
import PipelineProgress from './PipelineProgress'
import CandidateManifest from './CandidateManifest'

const EXPO = [0.22, 1, 0.36, 1]
const JOB_ID = 1

function friendlyError(msg) {
  if (!msg) return 'Something went wrong.'
  const m = msg.toLowerCase()
  if (m.includes('failed to fetch') || m.includes('networkerror') || m.includes('econnrefused') || m.includes('network request failed')) {
    return 'Cannot reach the backend server. Make sure it is running on port 8000.'
  }
  if (m.includes('no candidates')) return 'No candidates in the database. Add candidates first.'
  if (m.includes('job not found')) return 'Job not found. Ensure Job #1 exists in the database.'
  if (m.includes('task not found')) return 'Ranking task expired. Please try again.'
  return msg
}

/* ── Compute per-candidate flags ── */
function computeFlags(c) {
  const flags = []
  if (!c.resume_snippet) flags.push({ text: 'Resume unreadable', type: 'error' })
  if (!c.skills?.length) flags.push({ text: 'No skills detected', type: 'error' })
  if (!c.phone) flags.push({ text: 'No phone number', type: 'warn' })
  if (!c.title) flags.push({ text: 'No title parsed', type: 'warn' })
  if (!c.location) flags.push({ text: 'No location', type: 'warn' })
  if (!c.experience_years) flags.push({ text: 'No experience data', type: 'warn' })
  // Surface each distinct authenticity/mismatch issue as its own flag
  if (c.verification_status === 'review' && c.review_note) {
    c.review_note.split(' | ').forEach(note => {
      if (note.trim()) flags.push({ text: note.trim(), type: 'error' })
    })
  } else if (c.verification_status === 'review') {
    flags.push({ text: 'Needs review — authenticity concern', type: 'error' })
  }
  return flags
}

/* ── Pre-rank candidate review table ── */
function CandidateReviewTable({ candidates, onRank, isRanking, jdEmpty }) {
  const flaggedCount = candidates.filter(c => computeFlags(c).length > 0).length

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total entries',  value: candidates.length,                      color: '#A78BFA' },
          { label: 'Flagged',        value: flaggedCount,                            color: '#F5A623' },
          { label: 'Clean entries',  value: candidates.length - flaggedCount,        color: '#3FCF8E' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4 text-center"
            style={{ background: 'rgba(14,13,24,0.80)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <div className="font-mono-data font-bold text-2xl" style={{ color, textShadow: `0 0 14px ${color}66` }}>{value}</div>
            <div className="text-slate-400 text-xs mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(14,13,24,0.80)', border: '1px solid rgba(255,255,255,0.09)' }}>

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between gap-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <h2 className="font-display font-bold text-white text-base">Pre-rank candidate review</h2>
            <p className="text-slate-300 text-sm mt-0.5">
              Review all entries below before running the ranking pipeline. Flags highlight missing or mismatched data.
            </p>
          </div>
          <button
            onClick={onRank}
            disabled={isRanking || jdEmpty}
            className="flex-shrink-0 flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 cursor-pointer"
            style={{
              background: '#7C5CFF',
              opacity: (isRanking || jdEmpty) ? 0.5 : 1,
              boxShadow: '0 0 16px rgba(124,92,255,0.35)',
            }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Rank All
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['#', 'Candidate', 'Title / Role', 'Location', 'Phone', 'Exp (yrs)', 'Skills', 'Status', 'Flags'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-300">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {candidates.map((c, i) => {
                const flags = computeFlags(c)
                const hasFlags = flags.length > 0
                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: hasFlags ? 'rgba(245,166,35,0.025)' : 'transparent',
                    }}
                  >
                    <td className="px-4 py-3 text-slate-500 text-xs font-mono-data w-8">{i + 1}</td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-white text-sm">{c.name}</div>
                      <div className="text-slate-300 text-xs mt-0.5">{c.email}</div>
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {c.title
                        ? <span className="text-slate-200">{c.title}</span>
                        : <span className="text-slate-600 italic text-xs">Not parsed</span>}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {c.location
                        ? <span className="text-slate-200">{c.location}</span>
                        : <span className="text-slate-600 italic text-xs">Not detected</span>}
                    </td>

                    <td className="px-4 py-3">
                      {c.phone
                        ? <span className="text-xs text-slate-300 font-mono-data">{c.phone}</span>
                        : <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                            style={{ background: 'rgba(245,166,35,0.10)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.22)' }}>
                            No phone number
                          </span>
                      }
                    </td>

                    <td className="px-4 py-3 text-sm font-mono-data">
                      {c.experience_years
                        ? <span className="text-slate-200">{c.experience_years.toFixed(1)}</span>
                        : <span className="text-slate-600">–</span>}
                    </td>

                    <td className="px-4 py-3 text-sm font-mono-data">
                      {(c.skills?.length ?? 0) > 0
                        ? <span className="text-slate-200">{c.skills.length}</span>
                        : <span className="text-slate-600">0</span>}
                    </td>

                    <td className="px-4 py-3">
                      {c.verification_status === 'verified'
                        ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(63,207,142,0.12)', color: '#3FCF8E', border: '1px solid rgba(63,207,142,0.25)' }}>
                            Verified
                          </span>
                        : c.verification_status === 'review'
                        ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(245,166,35,0.12)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.25)' }}>
                            Review
                          </span>
                        : <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(124,92,255,0.12)', color: '#A78BFA', border: '1px solid rgba(124,92,255,0.25)' }}>
                            Pending
                          </span>
                      }
                    </td>

                    <td className="px-4 py-3">
                      {flags.length === 0
                        ? <span className="text-xs text-slate-600">None</span>
                        : <div className="flex flex-wrap gap-1">
                            {flags.map((f, fi) => (
                              <span key={fi} className="text-xs px-2 py-0.5 rounded-md font-medium"
                                style={{
                                  background: f.type === 'error' ? 'rgba(244,91,91,0.10)' : 'rgba(245,166,35,0.10)',
                                  color: f.type === 'error' ? '#F45B5B' : '#F5A623',
                                  border: `1px solid ${f.type === 'error' ? 'rgba(244,91,91,0.20)' : 'rgba(245,166,35,0.20)'}`,
                                }}
                              >
                                {f.text}
                              </span>
                            ))}
                          </div>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer note */}
        {flaggedCount > 0 && (
          <div className="px-5 py-3 flex items-center gap-2"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#F5A623' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-xs text-slate-400">
              <span style={{ color: '#F5A623' }}>{flaggedCount} {flaggedCount === 1 ? 'entry has' : 'entries have'} flags</span> — these will still be ranked, but consider reviewing them first.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

/* ── Dashboard stats header ── */
function StatsHeader({ candidates }) {
  const avg = candidates.length
    ? Math.round(candidates.reduce((s, c) => s + c.overallScore, 0) / candidates.length * 10) / 10
    : 0
  const deep     = candidates.filter(c => c.computePath === 'reasoning-llm').length
  const verified = candidates.filter(c => c.verificationStatus === 'verified').length

  return (
    <div className="grid grid-cols-4 gap-3 mb-5">
      {[
        { label: 'Candidates', value: candidates.length, color: '#7C5CFF', suffix: '' },
        { label: 'Avg score',  value: avg,               color: '#3FCF8E', suffix: '' },
        { label: 'Deep eval',  value: deep,              color: '#A78BFA', suffix: ` of ${candidates.length}` },
        { label: 'Verified',   value: verified,          color: '#38BDF8', suffix: '' },
      ].map(({ label, value, color, suffix }) => (
        <div key={label} className="rounded-xl p-3 text-center"
          style={{ background: 'rgba(14,13,24,0.80)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <div className="font-mono-data font-bold text-xl" style={{ color, textShadow: `0 0 14px ${color}88` }}>
            {value}{suffix}
          </div>
          <div className="text-slate-300 text-xs mt-1 uppercase tracking-widest">{label}</div>
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
        <p className="text-xs text-slate-300 uppercase tracking-widest font-semibold mb-3">Sort by</p>
        <div className="space-y-1">
          {[
            { key: 'overall',  label: 'Overall score' },
            { key: 'skills',   label: 'Skills match' },
            { key: 'semantic', label: 'Semantic fit' },
            { key: 'graph',    label: 'Graph fit' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setSortBy(key)}
              className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-150 cursor-pointer"
              style={{
                background: sortBy === key ? 'rgba(124,92,255,0.12)' : 'transparent',
                color: sortBy === key ? '#C4B5FD' : '#CBD5E1',
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
        <p className="text-xs text-slate-300 uppercase tracking-widest font-semibold mb-2">
          Min score: <span className="text-violet font-mono-data">{minScore}</span>
        </p>
        <input type="range" min={0} max={100} value={minScore}
          onChange={e => setMinScore(Number(e.target.value))}
          className="w-full cursor-pointer" style={{ accentColor: '#7C5CFF' }}
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>0</span><span>50</span><span>100</span>
        </div>
      </div>

      <div>
        <p className="text-xs text-slate-300 uppercase tracking-widest font-semibold mb-2">Verification</p>
        <div className="space-y-1">
          {[
            { key: 'all',      label: 'All candidates' },
            { key: 'verified', label: 'Verified only' },
            { key: 'review',   label: 'Needs review' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilterVerification(key)}
              className="w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer"
              style={{
                background: filterVerification === key ? 'rgba(124,92,255,0.10)' : 'transparent',
                color: filterVerification === key ? '#C4B5FD' : '#CBD5E1',
              }}
            >{label}</button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-slate-300 uppercase tracking-widest font-semibold mb-2">Compute path</p>
        <div className="space-y-1">
          {[
            { key: 'all',           label: 'All' },
            { key: 'fast-llm',      label: '⚡ Fast (8B)' },
            { key: 'reasoning-llm', label: '🧠 Reasoning (70B)' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilterCompute(key)}
              className="w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer"
              style={{
                background: filterCompute === key ? 'rgba(124,92,255,0.10)' : 'transparent',
                color: filterCompute === key ? '#C4B5FD' : '#CBD5E1',
              }}
            >{label}</button>
          ))}
        </div>
      </div>

      <div className="pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-center">
          <span className="text-xs text-slate-300 font-medium">{count} matching</span>
        </div>
      </div>
    </div>
  )
}

export default function RecruiterDashboard({ onLock }) {
  const [jd, setJd]                       = useState(mockJobDescription)
  const [candidates, setCandidates]       = useState([])
  const [rawCandidates, setRawCandidates] = useState([])
  const [funnelData, setFunnelData]       = useState([])
  const [isRanking, setIsRanking]         = useState(false)
  const [showResults, setShowResults]     = useState(false)
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)
  const [funnelKey, setFunnelKey]         = useState(0)
  const [pipelineLayer, setPipelineLayer] = useState('Starting pipeline…')
  const [pipelineProgress, setPipelineProgress] = useState(0)
  const [backendOnline, setBackendOnline] = useState(null)
  const [jdExpanded, setJdExpanded]       = useState(false)
  const [lastRankedIds, setLastRankedIds] = useState(new Set())
  const [isRefreshingManifest, setIsRefreshingManifest] = useState(false)
  const isRankingRef = useRef(false)

  /* Filters */
  const [sortBy, setSortBy]                       = useState('overall')
  const [minScore, setMinScore]                   = useState(0)
  const [filterVerification, setFilterVerification] = useState('all')
  const [filterCompute, setFilterCompute]         = useState('all')

  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(null), 8000)
    return () => clearTimeout(t)
  }, [error])

  useEffect(() => {
    async function loadInitial() {
      try {
        await api.health()
        setBackendOnline(true)
      } catch {
        setBackendOnline(false)
        setLoading(false)
        return
      }

      try {
        const [ranked, funnel, raw] = await Promise.all([
          api.getRanked(JOB_ID),
          api.getFunnel(JOB_ID),
          api.getCandidates(),
        ])
        setCandidates(ranked)
        setFunnelData(funnel)
        setRawCandidates(raw)
        if (ranked.length > 0) {
          setLastRankedIds(new Set(ranked.map(c => c.id)))
        }
        setShowResults(ranked.length > 0)
      } catch {
        setCandidates([])
        setFunnelData([])
        setRawCandidates([])
      } finally {
        setLoading(false)
      }
    }
    loadInitial()
  }, [])

  /* Auto-refresh candidates every 15s when backend is online and not ranking */
  useEffect(() => {
    if (!backendOnline) return
    const interval = setInterval(async () => {
      if (isRankingRef.current) return
      try {
        const raw = await api.getCandidates()
        setRawCandidates(raw)
      } catch { /* silent */ }
    }, 15000)
    return () => clearInterval(interval)
  }, [backendOnline])

  const handleManifestRefresh = async () => {
    setIsRefreshingManifest(true)
    try {
      const raw = await api.getCandidates()
      setRawCandidates(raw)
    } catch { /* silent */ }
    finally { setIsRefreshingManifest(false) }
  }

  const handleClear = async () => {
    try {
      await api.clearCandidates()
    } catch (e) {
      setError(friendlyError(e.message))
      return
    }
    setRawCandidates([])
    setCandidates([])
    setFunnelData([])
    setShowResults(false)
    setLastRankedIds(new Set())
  }

  const handleRank = async () => {
    const idsAtRankTime = new Set(rawCandidates.map(c => c.id))
    isRankingRef.current = true
    setIsRanking(true)
    setShowResults(false)
    setFunnelKey(k => k + 1)
    setError(null)
    setPipelineLayer('Starting pipeline…')
    setPipelineProgress(0)

    try {
      const { task_id } = await api.startRank(JOB_ID, jd)

      await new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
          try {
            const status = await api.getRankStatus(JOB_ID, task_id)
            setPipelineLayer(status.layer || 'Running…')
            setPipelineProgress(status.progress || 0)
            if (status.status === 'done') { clearInterval(interval); resolve() }
            else if (status.status === 'error') { clearInterval(interval); reject(new Error(status.error || 'Pipeline failed')) }
          } catch (e) { clearInterval(interval); reject(e) }
        }, 1000)
      })

      const [ranked, funnel] = await Promise.all([
        api.getRanked(JOB_ID),
        api.getFunnel(JOB_ID),
      ])
      setCandidates(ranked)
      setFunnelData(funnel)
      setLastRankedIds(idsAtRankTime)
      setBackendOnline(true)
    } catch (e) {
      setError(friendlyError(e.message))
      if (e.message?.toLowerCase().includes('failed to fetch')) setBackendOnline(false)
    } finally {
      isRankingRef.current = false
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

  const rankOf = id => [...candidates].sort((a, b) => b.overallScore - a.overallScore).findIndex(s => s.id === id) + 1

  return (
    <div className="min-h-screen pt-24 pb-8 px-4 relative">
      <div className="relative z-10 max-w-[1300px] mx-auto">

        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'rgba(124,92,255,0.15)', border: '1px solid rgba(124,92,255,0.25)' }}>
                  <svg className="w-2.5 h-2.5" style={{ color: '#A78BFA' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-xs text-slate-500 uppercase tracking-widest font-medium">Recruiter Intelligence</span>
              </div>
              <h1 className="font-display font-bold text-3xl text-white leading-tight">Ranked Shortlist</h1>
            </div>
            {onLock && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onLock}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-red-400 transition-all duration-200 cursor-pointer"
                style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(14,13,24,0.60)' }}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Lock
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Backend offline banner */}
        <AnimatePresence>
          {backendOnline === false && (
            <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }} transition={{ duration: 0.3 }} className="mb-4 overflow-hidden">
              <div className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.22)' }}>
                <svg className="w-4 h-4 text-yellow-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-yellow-400">Backend server is offline</p>
                  <p className="text-[11px] text-yellow-400/70 mt-0.5">
                    Start it with: <span className="font-mono-data text-yellow-300">uvicorn app.main:app --reload --port 8000</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }} transition={{ duration: 0.25 }} className="mb-4 overflow-hidden">
              <div className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: 'rgba(244,91,91,0.08)', border: '1px solid rgba(244,91,91,0.22)' }}>
                <svg className="w-4 h-4 text-red-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="flex-1 text-xs text-red-300">{error}</p>
                <button onClick={() => setError(null)} className="text-red-400/60 hover:text-red-400 cursor-pointer">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* JD Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
          className="rounded-2xl mb-5"
          style={{ background: 'rgba(14,13,24,0.80)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setJdExpanded(v => !v)}>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-300 font-medium">Job description</span>
              <span className="text-xs font-mono-data text-slate-600">{jd.split(/\s+/).filter(Boolean).length}w</span>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={e => { e.stopPropagation(); handleRank() }}
                disabled={isRanking || !jd.trim() || backendOnline === false}
                title={backendOnline === false ? 'Backend is offline' : 'Run 7-layer pipeline'}
                className="flex items-center gap-2 text-white font-semibold px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: '#7C5CFF', boxShadow: '0 0 12px rgba(124,92,255,0.35)' }}
              >
                {isRanking
                  ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Ranking…</>
                  : <><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>Rank</>
                }
              </motion.button>
              <motion.div animate={{ rotate: jdExpanded ? 180 : 0 }} transition={{ duration: 0.22 }}>
                <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
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
                    className="w-full rounded-xl px-4 py-3 text-sm text-slate-200 outline-none resize-none transition-all duration-200 leading-relaxed"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.09)',
                    }}
                    placeholder="Paste the full job description here…"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Candidate Manifest — always visible when backend is online */}
        {backendOnline === true && !loading && (
          <CandidateManifest
            candidates={rawCandidates}
            onRefresh={handleManifestRefresh}
            onClear={handleClear}
            isRefreshing={isRefreshingManifest}
            lastRankedIds={lastRankedIds}
          />
        )}

        {/* Pipeline progress */}
        <AnimatePresence>
          {isRanking && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="rounded-2xl mb-5"
              style={{ background: 'rgba(14,13,24,0.80)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <PipelineProgress layer={pipelineLayer} progress={pipelineProgress} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading spinner */}
        {loading && !isRanking && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-t-violet border-white/10 rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state — no candidates at all */}
        {!loading && !isRanking && !showResults && backendOnline === true && rawCandidates.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-12 text-center"
            style={{ background: 'rgba(14,13,24,0.80)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(124,92,255,0.10)', border: '1px solid rgba(124,92,255,0.20)' }}>
              <svg className="w-6 h-6" style={{ color: 'rgba(124,92,255,0.60)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-display font-bold text-white text-base mb-2">No candidates yet</h3>
            <p className="text-slate-300 text-base">
              Use the candidate intake form to add candidates, then come back here to rank them.
            </p>
          </motion.div>
        )}

        {/* Pre-rank review table */}
        {!loading && !isRanking && !showResults && backendOnline === true && rawCandidates.length > 0 && (
          <CandidateReviewTable
            candidates={rawCandidates}
            onRank={handleRank}
            isRanking={isRanking}
            jdEmpty={!jd.trim()}
          />
        )}

        {/* Ranked results */}
        <AnimatePresence>
          {showResults && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

              <StatsHeader candidates={candidates} />
              <CandidateFunnel key={funnelKey} funnelData={funnelData} />

              {/* 2-column layout: filters + cards */}
              <div className="flex gap-4 items-start">

                {/* Left: Filters */}
                <motion.div
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="w-44 flex-shrink-0 rounded-2xl p-4 sticky top-24"
                  style={{ background: 'rgba(14,13,24,0.80)', border: '1px solid rgba(255,255,255,0.09)' }}
                >
                  <p className="text-xs text-slate-300 uppercase tracking-widest font-semibold mb-4">Filters</p>
                  <FilterPanel
                    minScore={minScore} setMinScore={setMinScore}
                    sortBy={sortBy} setSortBy={setSortBy}
                    filterVerification={filterVerification} setFilterVerification={setFilterVerification}
                    filterCompute={filterCompute} setFilterCompute={setFilterCompute}
                    count={displayed.length}
                  />
                </motion.div>

                {/* Center: Candidate cards */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <h2 className="font-display font-bold text-white text-lg">{displayed.length} candidates</h2>
                      <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                        style={{ background: 'rgba(63,207,142,0.07)', border: '1px solid rgba(63,207,142,0.20)' }}>
                        <div className="w-1.5 h-1.5 rounded-full bg-signal-green" />
                        <span className="text-[10px] font-semibold" style={{ color: '#3FCF8E' }}>Fairness checked</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-300 font-mono-data">
                      Sort: {sortBy === 'overall' ? 'Overall' : sortBy === 'skills' ? 'Skills' : sortBy === 'semantic' ? 'Semantic' : 'Graph fit'}
                    </span>
                  </div>

                  {displayed.map((c, i) => (
                    <CandidateCard
                      key={c.id}
                      candidate={c}
                      rank={rankOf(c.id)}
                      animDelay={i * 30}
                    />
                  ))}

                  {displayed.length === 0 && candidates.length > 0 && (
                    <div className="rounded-2xl p-8 text-center"
                      style={{ background: 'rgba(14,13,24,0.80)', border: '1px solid rgba(255,255,255,0.09)' }}>
                      <p className="text-slate-300 text-base">No candidates match current filters.</p>
                      <button onClick={() => { setMinScore(0); setFilterVerification('all'); setFilterCompute('all') }}
                        className="mt-3 text-violet text-xs underline cursor-pointer">Reset filters</button>
                    </div>
                  )}

                  {candidates.length === 0 && (
                    <div className="rounded-2xl p-8 text-center"
                      style={{ background: 'rgba(14,13,24,0.80)', border: '1px solid rgba(255,255,255,0.09)' }}>
                      <p className="text-slate-300 text-base">No candidates in the database yet.</p>
                      <p className="text-slate-400 text-sm mt-1">Use the candidate intake form to add candidates, then click Rank.</p>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
