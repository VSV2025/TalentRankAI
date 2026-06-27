import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const statusConfig = {
  pass:    { color: 'text-signal-green', bg: 'bg-signal-green/12', border: 'border-signal-green/25', label: 'Pass' },
  pending: { color: 'text-violet',       bg: 'bg-violet/10',       border: 'border-violet/25',        label: 'Pending' },
  review:  { color: 'text-signal-amber', bg: 'bg-signal-amber/8',  border: 'border-signal-amber/25',  label: 'Review needed' },
}

function StatusIcon({ status }) {
  if (status === 'loading') return (
    <div className="w-5 h-5 rounded-full border-2 border-t-violet border-white/10 animate-spin flex-shrink-0"/>
  )
  if (status === 'pass') return (
    <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',stiffness:400,damping:20}}
      className="w-5 h-5 rounded-full bg-signal-green/15 border border-signal-green/40 flex items-center justify-center flex-shrink-0">
      <svg className="w-2.5 h-2.5 text-signal-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
      </svg>
    </motion.div>
  )
  if (status === 'pending') return (
    <div className="w-5 h-5 rounded-full bg-violet/15 border border-violet/35 flex items-center justify-center flex-shrink-0">
      <div className="w-2 h-2 rounded-full bg-violet animate-pulse-slow"/>
    </div>
  )
  if (status === 'review') return (
    <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',stiffness:400,damping:20}}
      className="w-5 h-5 rounded-full bg-signal-amber/15 border border-signal-amber/40 flex items-center justify-center flex-shrink-0">
      <svg className="w-2.5 h-2.5 text-signal-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 3h.01"/>
      </svg>
    </motion.div>
  )
  return <div className="w-5 h-5 rounded-full border border-white/10 flex-shrink-0"/>
}

function CheckItem({ check, revealed, isLoading }) {
  const cfg = revealed ? statusConfig[check.result] : null
  const isIdle = !revealed && !isLoading

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{
        opacity: isIdle ? 0.25 : 1,
        x: 0,
        borderColor: revealed
          ? (check.result === 'review' ? 'rgba(245,166,35,0.25)' : check.result === 'pass' ? 'rgba(63,207,142,0.18)' : 'rgba(124,92,255,0.25)')
          : 'rgba(255,255,255,0.07)',
      }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border px-4 py-3.5 bg-ink-3/50 transition-colors duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {isLoading ? <StatusIcon status="loading"/> : revealed ? <StatusIcon status={check.result}/> : <StatusIcon status="idle"/>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-offwhite text-sm font-medium">{check.label}</span>
            {revealed && (
              <motion.span initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}}
                className={`text-xs font-mono-data font-semibold ${cfg.color}`}
              >{cfg.label}</motion.span>
            )}
            {isLoading && <span className="text-xs text-muted animate-pulse">Checking…</span>}
          </div>
          {revealed && <p className="text-muted text-xs mt-1 leading-relaxed">{check.detail}</p>}
          {revealed && check.badge && (
            <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
              className="mt-2.5 inline-flex items-center gap-1.5 bg-signal-amber/[0.08] border border-signal-amber/20 rounded-lg px-3 py-1.5">
              <svg className="w-3 h-3 text-signal-amber flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
              <span className="text-signal-amber text-xs font-medium">{check.badge}</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Real checks from the API — reveal them with staggered animation
function RealChecks({ checks, onDone }) {
  const [revealed, setRevealed] = useState([])
  const [loadingId, setLoadingId] = useState(null)

  useEffect(() => {
    const timers = []
    checks.forEach((check, i) => {
      const baseDelay = 600 + i * 900
      timers.push(setTimeout(() => setLoadingId(check.id), baseDelay - 500))
      timers.push(setTimeout(() => {
        setRevealed(p => [...p, check.id])
        setLoadingId(null)
        if (i === checks.length - 1) setTimeout(onDone, 500)
      }, baseDelay))
    })
    return () => timers.forEach(clearTimeout)
  }, [checks, onDone])

  return (
    <div className="space-y-2.5">
      {checks.map(check => (
        <CheckItem
          key={check.id}
          check={check}
          revealed={revealed.includes(check.id)}
          isLoading={loadingId === check.id}
        />
      ))}
    </div>
  )
}


export default function Step3Verification({ data, verificationResult }) {
  const [done, setDone] = useState(false)
  const hasRealResult = verificationResult && verificationResult.checks?.length > 0
  const overallStatus = verificationResult?.overall_status ?? 'review'
  const checks = verificationResult?.checks ?? []

  // Detect hard submission failure (duplicate / server error before candidate was created)
  const isSubmitError = !verificationResult?.candidate_id &&
    checks.some(c => c.id === 'submit_error')
  const submitErrorMsg = checks.find(c => c.id === 'submit_error')?.detail ?? 'Submission failed.'

  const passCount    = checks.filter(c => c.result === 'pass').length
  const reviewCount  = checks.filter(c => c.result === 'review').length
  const pendingCount = checks.filter(c => c.result === 'pending').length

  return (
    <div>
      <p className="text-xs text-muted/60 uppercase tracking-widest font-medium mb-6">Step 3 of 3</p>
      <h2 className="font-display text-2xl font-bold text-offwhite mb-1">Consistency check</h2>
      <p className="text-muted text-sm mb-7 leading-relaxed">
        Running authenticity checks — these are informational signals for recruiters, not hard pass/fail gates.
      </p>

      {/* Hard submission error (duplicate email, server error, etc.) */}
      {isSubmitError ? (
        <motion.div
          initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }}
          transition={{ duration:0.35 }}
          className="rounded-2xl border border-signal-red/25 bg-gradient-to-b from-signal-red/[0.06] to-transparent p-6 text-center"
        >
          <div className="w-14 h-14 rounded-full mx-auto border border-signal-red/30 bg-signal-red/10 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-signal-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h3 className="font-display font-bold text-xl text-offwhite mb-2">Submission not accepted</h3>
          <p className="text-signal-red/80 text-sm max-w-xs mx-auto leading-relaxed">{submitErrorMsg}</p>
          <p className="text-muted/40 text-xs mt-4">Please go back and try again with different details.</p>
        </motion.div>
      ) : hasRealResult ? (
        <RealChecks checks={checks} onDone={() => setDone(true)} />
      ) : (
        <div className="flex items-center justify-center py-10 gap-3">
          <div className="w-5 h-5 border-2 border-t-violet border-white/10 rounded-full animate-spin flex-shrink-0" />
          <span className="text-muted/60 text-sm">Loading verification results…</span>
        </div>
      )}

      <AnimatePresence>
        {done && !isSubmitError && (
          <motion.div
            initial={{ opacity:0, y:16, scale:0.97 }}
            animate={{ opacity:1, y:0, scale:1 }}
            transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}
            className="mt-7"
          >
            {/* Submission confirmed */}
            <div className={`rounded-2xl border p-6 text-center ${
              overallStatus === 'verified'
                ? 'border-signal-green/20 bg-gradient-to-b from-signal-green/[0.06] to-transparent'
                : 'border-signal-amber/20 bg-gradient-to-b from-signal-amber/[0.06] to-transparent'
            }`}>
              <motion.div
                initial={{scale:0}} animate={{scale:1}}
                transition={{type:'spring',stiffness:300,damping:20,delay:0.1}}
                className={`w-14 h-14 rounded-full mx-auto border flex items-center justify-center mb-4 ${
                  overallStatus === 'verified'
                    ? 'bg-signal-green/15 border-signal-green/30'
                    : 'bg-signal-amber/15 border-signal-amber/30'
                }`}
              >
                <svg className={`w-6 h-6 ${overallStatus === 'verified' ? 'text-signal-green' : 'text-signal-amber'}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </motion.div>
              <h3 className="font-display font-bold text-xl text-offwhite mb-2">Submission received</h3>
              <p className="text-muted text-sm mb-4 max-w-xs mx-auto leading-relaxed">
                Your application is queued for review.
              </p>
              {overallStatus !== 'verified' && (
                <div className="inline-flex items-center gap-2 rounded-full border border-signal-amber/25 bg-signal-amber/10 px-4 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-signal-amber"/>
                  <span className="text-signal-amber text-xs font-semibold">Consistency flag — recruiter will review</span>
                </div>
              )}
              {overallStatus === 'verified' && (
                <div className="inline-flex items-center gap-2 rounded-full border border-signal-green/25 bg-signal-green/10 px-4 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-signal-green"/>
                  <span className="text-signal-green text-xs font-semibold">All checks passed</span>
                </div>
              )}
              <p className="text-muted/40 text-xs mt-4">
                Consistency checks reflect submission accuracy only — not a determination of qualifications.
              </p>
            </div>

            {/* Score summary */}
            <div className="grid grid-cols-3 gap-2.5 mt-3">
              {[
                { value: `${passCount}/${checks.length}`, label: 'Checks passed', color: 'text-signal-green' },
                { value: reviewCount,                     label: 'Flagged',        color: 'text-signal-amber' },
                { value: pendingCount,                    label: 'Pending',        color: 'text-violet' },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                  transition={{delay:0.3+i*0.08}}
                  className="bg-ink-3/60 rounded-xl border border-white/[0.06] p-3 text-center"
                >
                  <div className={`font-mono-data font-bold text-lg ${s.color}`}>{s.value}</div>
                  <div className="text-muted text-xs mt-0.5">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
