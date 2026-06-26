import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const API = 'http://localhost:8000/api/hackathon'

// ─── Layer meta ────────────────────────────────────────────────────────────
const LAYERS = [
  { id: 'L1 JD Parse',        icon: '🧩', color: '#7C5CFF', label: 'L1  JD Parse',        desc: 'Decompose JD into hard reqs, key skills, disqualifiers' },
  { id: 'L2 Retrieval',       icon: '🔍', color: '#6EA8FE', label: 'L2  Retrieval',        desc: 'Keyword + YoE + title fast-score all candidates' },
  { id: 'L3 Graph Enrichment',icon: '🕸️', color: '#38BDF8', label: 'L3  Graph Enrichment', desc: 'O*NET cluster topology — graph_fit + skill_breadth' },
  { id: 'L4 Feature Scoring', icon: '⚡', color: '#A78BFA', label: 'L4  Feature Scoring',  desc: 'Skills × proficiency × duration, career, education' },
  { id: 'L4b Behavioral',     icon: '📡', color: '#3FCF8E', label: 'L4b Behavioral',       desc: '23 Redrob platform signals — engagement multiplier' },
  { id: 'L6 Agent Debate',    icon: '⚔️', color: '#F5A623', label: 'L6  Debate',            desc: 'Advocate/skeptic rules + honeypot stuffer detection' },
  { id: 'L7 Ranked',          icon: '⚖️', color: '#EC4899', label: 'L7  Ranked',            desc: 'Composite sort + FA*IR fairness rerank → top 100' },
]

const JD_SPECS = [
  { label: 'Role',       value: 'Senior AI Engineer — Founding Team' },
  { label: 'Company',    value: 'Redrob AI  (Series A)' },
  { label: 'Location',   value: 'Pune / Noida, India  (Hybrid)' },
  { label: 'Experience', value: '5 – 9 years' },
  { label: 'Mandate',    value: 'Own intelligence layer: ranking, retrieval, matching' },
]

const JD_REQUIREMENTS = [
  'Embeddings, vector search, retrieval & ranking',
  'Production LLM experience (fine-tuning, serving, RLHF)',
  'Shipping mindset over pure-research',
  'India-based or willing to relocate to Pune/Noida',
]

const JD_DISQUALIFIERS = [
  'Pure research background with zero production deployments',
  'AI experience = only recent LangChain/OpenAI projects',
]

// ─── Helpers ────────────────────────────────────────────────────────────────
function scoreColor(s) {
  if (s >= 0.85) return '#3FCF8E'
  if (s >= 0.70) return '#7C5CFF'
  if (s >= 0.55) return '#F5A623'
  return '#6B7280'
}

function tierLabel(s) {
  if (s >= 0.85) return { text: 'Elite',  bg: 'rgba(63,207,142,0.12)', border: 'rgba(63,207,142,0.3)',  fg: '#3FCF8E' }
  if (s >= 0.72) return { text: 'Strong', bg: 'rgba(124,92,255,0.12)', border: 'rgba(124,92,255,0.3)',  fg: '#A78BFA' }
  if (s >= 0.55) return { text: 'Good',   bg: 'rgba(245,166,35,0.10)', border: 'rgba(245,166,35,0.3)',  fg: '#F5A623' }
  return               { text: 'Fair',   bg: 'rgba(107,114,128,0.10)', border: 'rgba(107,114,128,0.25)', fg: '#9CA3AF' }
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function JDCard() {
  return (
    <div className="glass-gradient-border rounded-2xl p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">📋</span>
        <span className="text-xs text-muted/55 uppercase tracking-widest font-medium">Job Description</span>
      </div>

      <div className="space-y-2.5 mb-5">
        {JD_SPECS.map(({ label, value }) => (
          <div key={label}>
            <p className="text-[10px] text-muted/40 uppercase tracking-widest mb-0.5">{label}</p>
            <p className="text-offwhite/90 text-xs font-medium leading-snug">{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <p className="text-[10px] text-muted/40 uppercase tracking-widest mb-2">Key Requirements</p>
        <ul className="space-y-1.5">
          {JD_REQUIREMENTS.map((r, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="text-signal-green text-xs mt-0.5 flex-shrink-0">✓</span>
              <span className="text-offwhite/70 text-xs leading-snug">{r}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-[10px] text-muted/40 uppercase tracking-widest mb-2">Disqualifiers</p>
        <ul className="space-y-1.5">
          {JD_DISQUALIFIERS.map((d, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="text-red-400 text-xs mt-0.5 flex-shrink-0">✗</span>
              <span className="text-red-300/70 text-xs leading-snug">{d}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 pt-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-1.5 bg-violet/[0.08] border border-violet/20 rounded-full px-3 py-1.5 w-fit">
          <span className="text-[10px] text-violet font-semibold uppercase tracking-widest">Hackathon Submission</span>
        </div>
      </div>
    </div>
  )
}

function UploadZone({ onFile, onSample, disabled }) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef()

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }, [onFile])

  const handleChange = useCallback((e) => {
    const f = e.target.files[0]
    if (f) onFile(f)
  }, [onFile])

  return (
    <div className="space-y-3">
      <motion.div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        animate={{ borderColor: dragOver ? '#7C5CFF' : 'rgba(255,255,255,0.08)' }}
        className={`relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors duration-200
          ${dragOver ? 'bg-violet/[0.06]' : 'bg-ink-3/40 hover:bg-ink-3/60'}
          ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
      >
        <input ref={inputRef} type="file" accept=".jsonl,.json" className="hidden" onChange={handleChange} />
        <div className="text-2xl mb-2">📂</div>
        <p className="text-offwhite/80 text-sm font-medium mb-1">Drop candidates file here</p>
        <p className="text-muted/50 text-xs">Accepts .jsonl or .json  (hackathon schema)</p>
        {dragOver && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 rounded-xl bg-violet/10 border-2 border-violet pointer-events-none"
          />
        )}
      </motion.div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-muted/35 text-xs">or</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      <button
        onClick={onSample}
        disabled={disabled}
        className="w-full py-2.5 rounded-xl text-sm font-medium text-violet border border-violet/25 bg-violet/[0.06]
          hover:bg-violet/[0.12] transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        Use 50-candidate sample dataset
      </button>
    </div>
  )
}

function PipelineStatus({ status, progress, layersComplete }) {
  const activeIdx = LAYERS.findIndex(l => l.id === progress?.current_layer) ?? -1

  return (
    <div className="glass-gradient-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted/55 uppercase tracking-widest font-medium">7-Layer Pipeline</span>
        </div>
        {status === 'running' && (
          <div className="flex items-center gap-1.5">
            <motion.div animate={{ scale: [1,1.4,1] }} transition={{ duration:1.2, repeat:Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-signal-green" />
            <span className="text-signal-green text-xs font-semibold">Running</span>
          </div>
        )}
        {status === 'complete' && (
          <div className="flex items-center gap-1.5">
            <span className="text-signal-green text-xs font-semibold">✓ Complete</span>
          </div>
        )}
        {status === 'idle' && (
          <span className="text-muted/35 text-xs">Ready</span>
        )}
      </div>

      <div className="space-y-2">
        {LAYERS.map((layer, i) => {
          const isDone    = status === 'complete' || layersComplete?.includes(layer.id) || (status === 'running' && i < activeIdx)
          const isActive  = status === 'running' && i === activeIdx
          const isPending = !isDone && !isActive

          return (
            <motion.div
              key={layer.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 py-1.5"
            >
              {/* Status dot */}
              <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                {isDone ? (
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: layer.color + '22', border: `1px solid ${layer.color}55` }}
                  >
                    <svg className="w-2.5 h-2.5" viewBox="0 0 10 10">
                      <path d="M1.5 5l2.5 2.5 4.5-5" stroke={layer.color} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                    </svg>
                  </motion.div>
                ) : isActive ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 rounded-full border-2 border-transparent"
                    style={{ borderTopColor: layer.color, borderRightColor: layer.color + '44' }}
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-white/[0.08] bg-white/[0.02]" />
                )}
              </div>

              {/* Icon + label */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{layer.icon}</span>
                  <span className={`text-xs font-medium transition-colors duration-300 ${
                    isDone || isActive ? 'text-offwhite/90' : 'text-muted/30'
                  }`}>{layer.label}</span>
                </div>
                {(isActive || isDone) && (
                  <p className="text-[10px] text-muted/45 mt-0.5 truncate">
                    {isActive && progress?.message ? progress.message : layer.desc}
                  </p>
                )}
              </div>

              {/* Active progress bar */}
              {isActive && progress?.total > 0 && (
                <div className="w-20 flex-shrink-0">
                  <div className="h-1 bg-ink-3/60 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: layer.color }}
                      animate={{ width: `${Math.min((progress.processed / progress.total) * 100, 100)}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  <p className="text-[9px] text-muted/35 text-right mt-0.5 font-mono-data">
                    {progress.processed.toLocaleString()}
                  </p>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Progress message */}
      {status === 'running' && progress?.message && (
        <div className="mt-3 pt-3 border-t border-white/[0.05]">
          <p className="text-xs text-muted/50 truncate">{progress.message}</p>
        </div>
      )}
    </div>
  )
}

function FunnelBar({ label, count, maxCount, color, icon, active }) {
  const pct = Math.max(4, Math.round((count / maxCount) * 100))
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-5 flex-shrink-0">{icon}</span>
      <div className="w-28 text-right flex-shrink-0">
        <span className={`text-xs font-medium ${active ? 'text-offwhite/80' : 'text-muted/30'}`}>{label}</span>
      </div>
      <div className="flex-1 h-6 bg-ink-3/50 rounded-lg overflow-hidden border border-white/[0.04]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: active ? `${pct}%` : 0 }}
          transition={{ duration: 0.6, ease: [0.22,1,0.36,1] }}
          className="h-full rounded-lg flex items-center px-2"
          style={{ background: `linear-gradient(90deg, ${color}cc, ${color})` }}
        >
          <span className="font-mono-data text-xs text-white font-bold whitespace-nowrap">
            {count.toLocaleString()}
          </span>
        </motion.div>
      </div>
    </div>
  )
}

function ResultsTable({ results, jobId }) {
  const [expanded, setExpanded] = useState(null)

  const handleDownload = async () => {
    const res = await fetch(`${API}/download/${jobId}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'submission.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="glass-gradient-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-white/[0.05]">
        <div>
          <h3 className="text-offwhite font-display font-bold text-base">Top 100 Candidates</h3>
          <p className="text-muted/50 text-xs mt-0.5">Ranked by 7-layer composite score</p>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-signal-green/10 border border-signal-green/25
            text-signal-green text-sm font-semibold hover:bg-signal-green/20 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v8m0 0l-3-3m3 3l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Download CSV
        </button>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[3rem_1fr_5rem_5rem_6rem] gap-3 px-5 py-2 border-b border-white/[0.04]">
        {['Rank', 'Candidate', 'Score', 'Skills', 'Signals'].map(h => (
          <span key={h} className="text-[10px] text-muted/40 uppercase tracking-widest font-medium">{h}</span>
        ))}
      </div>

      {/* Rows */}
      <div className="max-h-[600px] overflow-y-auto divide-y divide-white/[0.03]">
        {results.map((r) => {
          const tier = tierLabel(r.score)
          const isOpen = expanded === r.candidate_id
          return (
            <div key={r.candidate_id}>
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(r.rank * 0.015, 0.5) }}
                className="grid grid-cols-[3rem_1fr_5rem_5rem_6rem] gap-3 px-5 py-3 items-center
                  hover:bg-white/[0.025] transition-colors cursor-pointer"
                onClick={() => setExpanded(isOpen ? null : r.candidate_id)}
              >
                {/* Rank */}
                <div className="flex items-center justify-center">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold
                    ${r.rank <= 3 ? 'bg-violet/20 text-violet border border-violet/30' : 'bg-white/[0.04] text-muted/60 border border-white/[0.06]'}`}>
                    {r.rank}
                  </span>
                </div>

                {/* Candidate info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-offwhite/90 text-xs font-semibold font-mono-data truncate">{r.candidate_id}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold border whitespace-nowrap"
                      style={{ background: tier.bg, borderColor: tier.border, color: tier.fg }}>
                      {tier.text}
                    </span>
                  </div>
                  <p className="text-muted/55 text-[11px] truncate">{r.title} · {r.location}</p>
                </div>

                {/* Score */}
                <div className="text-right">
                  <span className="font-mono-data text-sm font-bold" style={{ color: scoreColor(r.score) }}>
                    {r.score.toFixed(3)}
                  </span>
                  <p className="text-muted/40 text-[10px]">{r.years_of_experience?.toFixed(1)} yrs</p>
                </div>

                {/* Skills match */}
                <div>
                  <div className="h-1.5 bg-ink-3/60 rounded-full overflow-hidden mb-1">
                    <div className="h-full rounded-full bg-violet"
                      style={{ width: `${r.subscores?.skills_match ?? 0}%` }} />
                  </div>
                  <p className="text-[10px] text-muted/45 text-right">{r.subscores?.skills_match?.toFixed(0)}/100</p>
                </div>

                {/* Signals */}
                <div className="flex items-center gap-1.5 justify-end">
                  {r.open_to_work && (
                    <span title="Open to work" className="text-signal-green text-xs">●</span>
                  )}
                  {r.github_score >= 0 && (
                    <span className="text-[10px] text-muted/50 font-mono-data">gh:{r.github_score?.toFixed(0)}</span>
                  )}
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    className="text-muted/30 text-xs ml-1"
                  >▾</motion.span>
                </div>
              </motion.div>

              {/* Expanded detail */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden border-t border-white/[0.04]"
                  >
                    <div className="px-5 py-4 bg-white/[0.015]">
                      {/* Sub-scores */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        {Object.entries(r.subscores ?? {}).map(([key, val]) => (
                          <div key={key} className="bg-ink-3/40 rounded-xl p-2.5 border border-white/[0.04]">
                            <p className="text-[10px] text-muted/45 capitalize mb-1">
                              {key.replace(/_/g, ' ')}
                            </p>
                            <div className="h-1 bg-ink-3/80 rounded-full overflow-hidden mb-1">
                              <div className="h-full rounded-full bg-violet"
                                style={{ width: `${val}%` }} />
                            </div>
                            <p className="text-xs text-offwhite/80 font-mono-data text-right">{val}/100</p>
                          </div>
                        ))}
                        <div className="bg-ink-3/40 rounded-xl p-2.5 border border-white/[0.04]">
                          <p className="text-[10px] text-muted/45 mb-1">Graph Fit</p>
                          <div className="h-1 bg-ink-3/80 rounded-full overflow-hidden mb-1">
                            <div className="h-full rounded-full bg-sky-400"
                              style={{ width: `${r.graph_fit}%` }} />
                          </div>
                          <p className="text-xs text-offwhite/80 font-mono-data text-right">{r.graph_fit}/100</p>
                        </div>
                        <div className="bg-ink-3/40 rounded-xl p-2.5 border border-white/[0.04]">
                          <p className="text-[10px] text-muted/45 mb-1">Skill Breadth</p>
                          <div className="h-1 bg-ink-3/80 rounded-full overflow-hidden mb-1">
                            <div className="h-full rounded-full bg-pink-400"
                              style={{ width: `${r.skill_breadth}%` }} />
                          </div>
                          <p className="text-xs text-offwhite/80 font-mono-data text-right">{r.skill_breadth}/100</p>
                        </div>
                      </div>

                      {/* Top skills */}
                      {r.top_skills?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-[10px] text-muted/40 uppercase tracking-widest mb-1.5">Top Skills</p>
                          <div className="flex flex-wrap gap-1.5">
                            {r.top_skills.map(s => (
                              <span key={s} className="px-2 py-0.5 rounded-md text-[11px] font-medium
                                bg-violet/[0.08] border border-violet/20 text-violet/90">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* L6 notes */}
                      {r.l6_notes?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-[10px] text-muted/40 uppercase tracking-widest mb-1.5">Debate Notes</p>
                          <div className="space-y-1">
                            {r.l6_notes.map((n, i) => (
                              <p key={i} className={`text-xs ${n.startsWith('advocate') ? 'text-signal-green/70' : 'text-red-400/70'}`}>
                                {n.startsWith('advocate') ? '+ ' : '− '}{n}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Reasoning */}
                      <div className="bg-ink-3/40 rounded-xl p-3 border border-white/[0.04]">
                        <p className="text-[10px] text-muted/40 uppercase tracking-widest mb-1">Submission Reasoning</p>
                        <p className="text-xs text-offwhite/75 leading-relaxed">{r.reasoning}</p>
                      </div>

                      {/* Signals strip */}
                      <div className="flex items-center gap-4 mt-3 text-[10px] text-muted/45">
                        <span>Response rate: <span className="text-offwhite/60 font-mono-data">{(r.response_rate * 100).toFixed(0)}%</span></span>
                        <span>Notice: <span className="text-offwhite/60 font-mono-data">{r.notice_days}d</span></span>
                        {r.github_score >= 0 && (
                          <span>GitHub: <span className="text-offwhite/60 font-mono-data">{r.github_score}/100</span></span>
                        )}
                        <span>L6 adj: <span className={`font-mono-data ${r.l6_adj >= 0 ? 'text-signal-green/70' : 'text-red-400/70'}`}>
                          {r.l6_adj >= 0 ? '+' : ''}{r.l6_adj}
                        </span></span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function HackathonPage() {
  const [mode, setMode]             = useState('idle')   // idle | running | complete | error
  const [jobId, setJobId]           = useState(null)
  const [progress, setProgress]     = useState(null)
  const [layersDone, setLayersDone] = useState([])
  const [results, setResults]       = useState(null)
  const [funnelData, setFunnelData] = useState([])
  const [errorMsg, setErrorMsg]     = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const pollRef = useRef(null)

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  const startPolling = useCallback((jid) => {
    stopPolling()
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API}/status/${jid}`)
        const data = await res.json()
        setProgress(data.progress)

        // Track which layers are complete
        const currentIdx = LAYERS.findIndex(l => l.id === data.progress?.current_layer)
        setLayersDone(LAYERS.slice(0, currentIdx).map(l => l.id))

        if (data.status === 'complete') {
          stopPolling()
          setLayersDone(LAYERS.map(l => l.id))
          // Fetch results
          const rRes = await fetch(`${API}/results/${jid}`)
          const rData = await rRes.json()
          setResults(rData.results)
          setFunnelData(rData.funnel_counts ?? [])
          setMode('complete')
        } else if (data.status === 'error') {
          stopPolling()
          setErrorMsg(data.error ?? 'Pipeline failed')
          setMode('error')
        }
      } catch (e) {
        stopPolling()
        setErrorMsg(e.message)
        setMode('error')
      }
    }, 1000)
  }, [])

  useEffect(() => () => stopPolling(), [])

  const runPipeline = async (useSample = false) => {
    setMode('running')
    setResults(null)
    setLayersDone([])
    setProgress(null)
    setErrorMsg('')

    try {
      let res
      if (useSample || !selectedFile) {
        const fd = new FormData()
        fd.append('use_sample', 'true')
        res = await fetch(`${API}/rank`, { method: 'POST', body: fd })
      } else {
        const fd = new FormData()
        fd.append('file', selectedFile)
        res = await fetch(`${API}/rank`, { method: 'POST', body: fd })
      }

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail ?? 'Server error')
      }
      const data = await res.json()
      setJobId(data.job_id)
      startPolling(data.job_id)
    } catch (e) {
      setErrorMsg(e.message)
      setMode('error')
    }
  }

  const reset = () => {
    stopPolling()
    setMode('idle')
    setJobId(null)
    setResults(null)
    setFunnelData([])
    setProgress(null)
    setLayersDone([])
    setErrorMsg('')
    setSelectedFile(null)
  }

  const funnelMax = funnelData[0]?.count ?? 1

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22,1,0.36,1] }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-violet/20 border border-violet/30 flex items-center justify-center">
              <span className="text-base">🏆</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-offwhite text-xl tracking-tight">
                Hackathon Submission Mode
              </h1>
              <p className="text-muted/50 text-xs">
                India Runs Data &amp; AI Challenge · Redrob AI · 7-Layer Offline Pipeline
              </p>
            </div>
          </div>

          {/* Constraint badges */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {[
              { icon: '🚫', label: 'No LLM API calls' },
              { icon: '💻', label: 'CPU-only' },
              { icon: '⏱️', label: '< 5 min / 100K candidates' },
              { icon: '📦', label: '< 16 GB RAM' },
              { icon: '📴', label: 'No network during ranking' },
            ].map(({ icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full
                bg-ink-3/60 border border-white/[0.07] text-xs text-muted/60">
                <span>{icon}</span><span>{label}</span>
              </span>
            ))}
          </div>
        </motion.div>

        {/* Main layout: JD card + pipeline + upload */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 mb-6">

          {/* Left: JD card */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
          >
            <JDCard />
          </motion.div>

          {/* Right: Upload + Pipeline status */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="space-y-5"
          >
            {/* Upload zone — hidden after start */}
            <AnimatePresence>
              {mode === 'idle' && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}
                  className="glass-gradient-border rounded-2xl p-5"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs text-muted/55 uppercase tracking-widest font-medium">Dataset Input</span>
                  </div>
                  <UploadZone
                    onFile={(f) => setSelectedFile(f)}
                    onSample={() => runPipeline(true)}
                    disabled={mode !== 'idle'}
                  />
                  {selectedFile && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      className="mt-4 flex items-center justify-between p-3 rounded-xl bg-ink-3/40
                        border border-white/[0.07]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">📄</span>
                        <div>
                          <p className="text-xs text-offwhite/80 font-medium">{selectedFile.name}</p>
                          <p className="text-[10px] text-muted/45">
                            {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => runPipeline(false)}
                        className="px-4 py-2 rounded-xl bg-violet text-white text-sm font-semibold
                          hover:bg-violet/80 transition-colors cursor-pointer shadow-violet-sm"
                      >
                        Run Pipeline ▶
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pipeline status */}
            <PipelineStatus
              status={mode === 'idle' ? 'idle' : mode === 'error' ? 'error' : mode}
              progress={progress}
              layersComplete={layersDone}
            />

            {/* Error state */}
            {mode === 'error' && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass-gradient-border rounded-2xl p-4 border-red-500/20"
              >
                <p className="text-red-400 text-sm font-semibold mb-1">Pipeline error</p>
                <p className="text-red-300/60 text-xs">{errorMsg}</p>
                <button onClick={reset}
                  className="mt-3 px-4 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20
                    text-red-400 text-xs hover:bg-red-500/20 transition-colors cursor-pointer">
                  Reset
                </button>
              </motion.div>
            )}

            {/* Reset button after complete */}
            {mode === 'complete' && (
              <div className="flex justify-end">
                <button onClick={reset}
                  className="px-4 py-2 rounded-xl text-xs text-muted/60 border border-white/[0.07]
                    hover:text-offwhite/80 hover:border-white/[0.15] transition-colors cursor-pointer">
                  ← Run Again
                </button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Funnel visualization (shown after complete) */}
        <AnimatePresence>
          {funnelData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="glass-gradient-border rounded-2xl p-5 mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-bold text-offwhite text-base">Pipeline Funnel</h3>
                  <p className="text-muted/45 text-xs">
                    {funnelData[0]?.count?.toLocaleString()} candidates →{' '}
                    {funnelData[funnelData.length - 1]?.count?.toLocaleString()} ranked
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-signal-green/[0.08] border border-signal-green/20
                  rounded-full px-3 py-1.5">
                  <motion.div animate={{ scale:[1,1.4,1] }} transition={{ duration:2, repeat:Infinity }}
                    className="w-1.5 h-1.5 rounded-full bg-signal-green" />
                  <span className="text-signal-green text-xs font-semibold">Fairness checked</span>
                </div>
              </div>
              <div className="space-y-2.5">
                {funnelData.map((stage, i) => {
                  const meta = LAYERS[i] ?? LAYERS[LAYERS.length - 1]
                  return (
                    <FunnelBar
                      key={i}
                      label={stage.label}
                      count={stage.count}
                      maxCount={funnelMax}
                      color={meta.color}
                      icon={meta.icon}
                      active
                    />
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results table */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <ResultsTable results={results} jobId={jobId} />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
