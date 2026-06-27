import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../../api/client'

const EXPO = [0.22, 1, 0.36, 1]

function computeFlags(c) {
  const flags = []
  if (!c.resume_snippet) flags.push({ text: 'Resume unreadable', type: 'error' })
  if (!c.skills?.length) flags.push({ text: 'No skills detected', type: 'error' })
  if (!c.phone) flags.push({ text: 'No phone number', type: 'warn' })
  if (!c.title) flags.push({ text: 'No title parsed', type: 'warn' })
  if (!c.location) flags.push({ text: 'No location', type: 'warn' })
  if (!c.experience_years) flags.push({ text: 'No experience data', type: 'warn' })
  if (c.verification_status === 'review' && c.review_note) {
    c.review_note.split(' | ').forEach(note => {
      if (note.trim()) flags.push({ text: note.trim(), type: 'error' })
    })
  } else if (c.verification_status === 'review') {
    flags.push({ text: 'Needs review — authenticity concern', type: 'error' })
  }
  return flags
}

function VerBadge({ status }) {
  if (status === 'verified') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: 'rgba(63,207,142,0.12)', color: '#3FCF8E', border: '1px solid rgba(63,207,142,0.25)' }}>
      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
      Verified
    </span>
  )
  if (status === 'review') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: 'rgba(245,166,35,0.12)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.25)' }}>
      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01"/></svg>
      Review
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: 'rgba(124,92,255,0.12)', color: '#A78BFA', border: '1px solid rgba(124,92,255,0.25)' }}>
      <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      Pending
    </span>
  )
}

function ResumeModal({ candidate, onClose }) {
  const [activeTab, setActiveTab] = useState('pdf')
  const flags = computeFlags(candidate)
  const pdfUrl = api.getResumeFileUrl(candidate.id)

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.28, ease: EXPO }}
        className="relative w-full flex flex-col rounded-2xl overflow-hidden"
        style={{
          maxWidth: activeTab === 'pdf' ? '900px' : '700px',
          height: '90vh',
          background: 'rgba(10,9,20,0.97)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.65)',
          transition: 'max-width 0.25s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Modal header ── */}
        <div className="flex-shrink-0 p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-display font-bold text-white text-xl">{candidate.name}</h3>
                <VerBadge status={candidate.verification_status} />
              </div>
              <p className="text-slate-300 text-sm">
                {[candidate.title, candidate.location].filter(Boolean).join(' · ') || (
                  <span className="text-slate-500 italic">No title or location parsed</span>
                )}
              </p>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-slate-300 text-xs">{candidate.email}</span>
                {candidate.phone
                  ? <span className="text-slate-300 text-xs font-mono-data">{candidate.phone}</span>
                  : <span className="text-xs px-2 py-0.5 rounded-md font-medium"
                      style={{ background: 'rgba(245,166,35,0.10)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.22)' }}>
                      No phone number
                    </span>
                }
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer"
                style={{ background: 'rgba(124,92,255,0.10)', color: '#C4B5FD', border: '1px solid rgba(124,92,255,0.22)', textDecoration: 'none' }}
                title="Open resume file in new tab">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
                Open
              </a>
              <a href={pdfUrl} download
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer"
                style={{ background: 'rgba(63,207,142,0.08)', color: '#3FCF8E', border: '1px solid rgba(63,207,142,0.20)', textDecoration: 'none' }}
                title="Download resume file">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Download
              </a>
              <button onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-5 mt-3">
            {[
              { label: 'Experience', value: candidate.experience_years ? `${candidate.experience_years.toFixed(1)} yrs` : '—' },
              { label: 'Skills', value: `${candidate.skills?.length ?? 0} detected` },
              { label: 'Submitted', value: new Date(candidate.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) },
            ].map(({ label, value }) => (
              <div key={label} className="text-sm">
                <span className="text-slate-400">{label}: </span>
                <span className="text-slate-100 font-mono-data">{value}</span>
              </div>
            ))}
          </div>

          {/* Skills chips */}
          {candidate.skills?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {candidate.skills.slice(0, 14).map((s, i) => (
                <span key={i} className="text-xs text-slate-300 px-2.5 py-0.5 rounded-md"
                  style={{ background: 'rgba(124,92,255,0.08)', border: '1px solid rgba(124,92,255,0.15)' }}>
                  {s}
                </span>
              ))}
              {candidate.skills.length > 14 && (
                <span className="text-xs text-slate-400 self-center">+{candidate.skills.length - 14} more</span>
              )}
            </div>
          )}

          {/* Flags */}
          {flags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {flags.map((f, i) => (
                <span key={i} className="text-xs px-2.5 py-0.5 rounded-md font-medium"
                  style={{
                    background: f.type === 'error' ? 'rgba(244,91,91,0.10)' : 'rgba(245,166,35,0.10)',
                    color: f.type === 'error' ? '#F45B5B' : '#F5A623',
                    border: `1px solid ${f.type === 'error' ? 'rgba(244,91,91,0.22)' : 'rgba(245,166,35,0.22)'}`,
                  }}>
                  {f.text}
                </span>
              ))}
            </div>
          )}

          {/* Tab switcher */}
          <div className="flex gap-1.5 mt-4">
            {[
              { id: 'pdf',  label: 'PDF Resume', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
              { id: 'text', label: 'Parsed Text', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-all duration-150 cursor-pointer"
                style={{
                  background: activeTab === tab.id ? 'rgba(124,92,255,0.16)' : 'rgba(255,255,255,0.04)',
                  color: activeTab === tab.id ? '#C4B5FD' : '#94A3B8',
                  border: activeTab === tab.id ? '1px solid rgba(124,92,255,0.30)' : '1px solid rgba(255,255,255,0.06)',
                }}>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon}/>
                </svg>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab body ── */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'pdf' && (
            <div className="w-full h-full flex flex-col">
              <iframe
                src={pdfUrl}
                title={`${candidate.name} resume`}
                className="flex-1 w-full border-0"
                style={{ background: '#1a1a2e' }}
              />
              <div className="flex-shrink-0 px-5 py-2.5 flex items-center gap-2"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.20)' }}>
                <svg className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01"/>
                </svg>
                <span className="text-xs text-slate-400">
                  PDFs display inline. If this is a DOCX file, use the Download button above to view it.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="h-full overflow-y-auto p-5">
              {candidate.resume_text ? (
                <pre
                  className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap break-words rounded-xl p-5"
                  style={{
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                  }}
                >
                  {candidate.resume_text}
                </pre>
              ) : candidate.resume_snippet ? (
                <div>
                  <div className="mb-3 flex items-center gap-2 rounded-lg px-3 py-2"
                    style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.16)' }}>
                    <svg className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    </svg>
                    <span className="text-sm text-yellow-400/90">Showing resume preview — full text not extracted</span>
                  </div>
                  <pre className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap break-words rounded-xl p-5"
                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', fontFamily: '"JetBrains Mono", monospace' }}>
                    {candidate.resume_snippet}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col items-center py-12 gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(244,91,91,0.08)', border: '1px solid rgba(244,91,91,0.18)' }}>
                    <svg className="w-5 h-5" style={{ color: '#F45B5B' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <p className="text-slate-300 text-base font-medium">Resume not readable</p>
                  <p className="text-slate-400 text-sm text-center max-w-xs">The uploaded file could not be parsed. Try downloading the original file above.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default function CandidateManifest({ candidates, onRefresh, onClear, isRefreshing, lastRankedIds }) {
  const [expanded, setExpanded] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [clearConfirm, setClearConfirm] = useState(false)

  const flaggedCount = candidates.filter(c => computeFlags(c).length > 0).length
  const newCount = lastRankedIds.size > 0
    ? candidates.filter(c => !lastRankedIds.has(c.id)).length
    : 0

  const openResume = useCallback((c) => { setSelectedCandidate(c) }, [])
  const closeResume = useCallback(() => { setSelectedCandidate(null) }, [])

  const handleClearConfirmed = async () => {
    setClearConfirm(false)
    await onClear()
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="rounded-2xl mb-5"
        style={{ background: 'rgba(14,13,24,0.82)', border: '1px solid rgba(255,255,255,0.09)' }}
      >
        {/* ── Header ── */}
        <div className="p-4 flex items-center gap-3">
          <div className="flex items-center gap-3 cursor-pointer flex-1 min-w-0" onClick={() => setExpanded(v => !v)}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(124,92,255,0.12)', border: '1px solid rgba(124,92,255,0.22)' }}>
              <svg className="w-4.5 h-4.5" style={{ color: '#A78BFA', width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
              </svg>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display font-semibold text-white text-base">Candidate Manifest</span>
                <span className="text-xs font-mono-data px-2 py-0.5 rounded-md"
                  style={{ background: 'rgba(124,92,255,0.12)', color: '#A78BFA', border: '1px solid rgba(124,92,255,0.20)' }}>
                  {candidates.length} {candidates.length === 1 ? 'entry' : 'entries'}
                </span>
                {flaggedCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: 'rgba(245,166,35,0.10)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.22)' }}>
                    {flaggedCount} flagged
                  </span>
                )}
                {newCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: 'rgba(63,207,142,0.10)', color: '#3FCF8E', border: '1px solid rgba(63,207,142,0.22)' }}>
                    {newCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Full registry — manual review, PDF resume viewer &amp; data quality flags</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onRefresh() }}
              disabled={isRefreshing}
              title="Refresh candidate list"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 cursor-pointer disabled:opacity-40"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <svg className={`w-3.5 h-3.5 text-slate-300 ${isRefreshing ? 'animate-spin' : ''}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </button>

            {candidates.length > 0 && !clearConfirm && (
              <button
                onClick={(e) => { e.stopPropagation(); setClearConfirm(true) }}
                title="Delete all candidates"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer"
                style={{ background: 'rgba(244,91,91,0.07)', color: '#F87171', border: '1px solid rgba(244,91,91,0.18)' }}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Clear All
              </button>
            )}

            {clearConfirm && (
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <span className="text-sm text-slate-300">Delete {candidates.length}?</span>
                <button
                  onClick={handleClearConfirmed}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold cursor-pointer"
                  style={{ background: 'rgba(244,91,91,0.16)', color: '#F87171', border: '1px solid rgba(244,91,91,0.32)' }}
                >
                  Confirm
                </button>
                <button
                  onClick={() => setClearConfirm(false)}
                  className="px-3 py-1.5 rounded-lg text-sm cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  Cancel
                </button>
              </div>
            )}

            <button
              onClick={() => setExpanded(v => !v)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <motion.svg
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.22 }}
                className="w-3.5 h-3.5 text-slate-300"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
              </motion.svg>
            </button>
          </div>
        </div>

        {/* ── Expanded table ── */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.32, ease: EXPO }}
              className="overflow-hidden"
            >
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {candidates.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: 'rgba(124,92,255,0.08)', border: '1px solid rgba(124,92,255,0.16)' }}>
                      <svg className="w-5 h-5" style={{ color: 'rgba(124,92,255,0.50)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                      </svg>
                    </div>
                    <p className="text-slate-300 text-base font-medium">No candidates yet</p>
                    <p className="text-slate-400 text-sm mt-1">Applications will appear here as candidates submit.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          {['#', 'Candidate', 'Title', 'Location', 'Phone', 'Exp', 'Skills', 'Status', 'Flags', ''].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-slate-300">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {candidates.map((c, i) => {
                          const flags = computeFlags(c)
                          const isNew = lastRankedIds.size > 0 && !lastRankedIds.has(c.id)
                          const hasError = flags.some(f => f.type === 'error')
                          const hasWarn = flags.some(f => f.type === 'warn') && !hasError

                          return (
                            <tr key={c.id} style={{
                              borderBottom: '1px solid rgba(255,255,255,0.03)',
                              background: isNew
                                ? 'rgba(63,207,142,0.022)'
                                : hasError
                                ? 'rgba(244,91,91,0.018)'
                                : hasWarn
                                ? 'rgba(245,166,35,0.016)'
                                : 'transparent',
                              transition: 'background 0.2s',
                            }}>
                              <td className="px-4 py-3 text-slate-400 text-xs font-mono-data">{i + 1}</td>

                              <td className="px-4 py-3">
                                <div className="flex items-start gap-1 flex-col">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-white text-sm leading-tight">{c.name}</span>
                                    {isNew && (
                                      <span className="text-xs px-1.5 py-0.5 rounded font-bold uppercase tracking-wide"
                                        style={{ background: 'rgba(63,207,142,0.16)', color: '#3FCF8E', border: '1px solid rgba(63,207,142,0.30)' }}>
                                        NEW
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-slate-300 text-xs leading-tight">{c.email}</span>
                                </div>
                              </td>

                              <td className="px-4 py-3 max-w-[130px]">
                                {c.title
                                  ? <span className="text-sm text-slate-200 truncate block">{c.title}</span>
                                  : <span className="text-xs text-slate-500 italic">Not parsed</span>}
                              </td>

                              <td className="px-4 py-3 max-w-[110px]">
                                {c.location
                                  ? <span className="text-sm text-slate-300 truncate block">{c.location}</span>
                                  : <span className="text-slate-500 text-xs">—</span>}
                              </td>

                              <td className="px-4 py-3 min-w-[110px]">
                                {c.phone
                                  ? <span className="text-xs text-slate-300 font-mono-data">{c.phone}</span>
                                  : <span className="text-xs px-2 py-0.5 rounded-md font-medium"
                                      style={{ background: 'rgba(245,166,35,0.10)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.22)' }}>
                                      No phone number
                                    </span>
                                }
                              </td>

                              <td className="px-4 py-3 text-sm font-mono-data">
                                {c.experience_years
                                  ? <span className="text-slate-200">{c.experience_years.toFixed(1)}</span>
                                  : <span className="text-slate-500">—</span>}
                              </td>

                              <td className="px-4 py-3 text-sm font-mono-data">
                                {(c.skills?.length ?? 0) > 0
                                  ? <span className="text-slate-200">{c.skills.length}</span>
                                  : <span className="text-slate-500">0</span>}
                              </td>

                              <td className="px-4 py-3">
                                <VerBadge status={c.verification_status} />
                              </td>

                              <td className="px-4 py-3 max-w-[220px]">
                                {flags.length === 0
                                  ? <span className="text-xs text-slate-500">None</span>
                                  : (
                                    <div className="flex flex-wrap gap-1.5">
                                      {flags.map((f, fi) => {
                                        const short = f.text.length > 52 ? f.text.slice(0, 49) + '…' : f.text
                                        return (
                                          <span key={fi}
                                            title={f.text}
                                            className="text-xs px-2 py-0.5 rounded-md font-medium max-w-[200px] truncate block"
                                            style={{
                                              background: f.type === 'error' ? 'rgba(244,91,91,0.10)' : 'rgba(245,166,35,0.10)',
                                              color: f.type === 'error' ? '#F45B5B' : '#F5A623',
                                              border: `1px solid ${f.type === 'error' ? 'rgba(244,91,91,0.22)' : 'rgba(245,166,35,0.22)'}`,
                                            }}>
                                            {short}
                                          </span>
                                        )
                                      })}
                                    </div>
                                  )
                                }
                              </td>

                              <td className="px-4 py-3">
                                <button
                                  onClick={() => openResume(c)}
                                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap"
                                  style={{ background: 'rgba(124,92,255,0.10)', color: '#C4B5FD', border: '1px solid rgba(124,92,255,0.22)' }}
                                >
                                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                                  </svg>
                                  View
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>

                    <div className="px-4 py-3 flex items-center gap-2"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <div className="w-1.5 h-1.5 rounded-full bg-signal-green animate-pulse" />
                      <span className="text-xs text-slate-400">Auto-refreshes every 15 s — new applications appear automatically</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Resume modal ── */}
      <AnimatePresence>
        {selectedCandidate && (
          <ResumeModal candidate={selectedCandidate} onClose={closeResume} />
        )}
      </AnimatePresence>
    </>
  )
}
