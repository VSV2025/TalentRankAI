import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../../api/client'

// Gate is in-memory only — refreshing the page always requires the password again
export function isRecruiterUnlocked() { return false }
export function lockRecruiter() { /* state lives in App.jsx, no persistence to clear */ }

export default function RecruiterGate({ onUnlock }) {
  const [pw, setPw]             = useState('')
  const [show, setShow]         = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [shake, setShake]       = useState(false)
  const [checking, setChecking] = useState(false)

  const triggerError = (msg) => {
    setErrorMsg(msg)
    setShake(true)
    setPw('')
    setTimeout(() => setShake(false), 600)
    setTimeout(() => setErrorMsg(''), 3500)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const entered = pw.trim()
    if (!entered || checking) return

    setChecking(true)
    try {
      await api.checkRecruiterPassword(entered)
      onUnlock()
    } catch (err) {
      const msg = err.message?.toLowerCase() || ''
      if (msg.includes('incorrect') || msg.includes('401') || msg.includes('unauthorized')) {
        triggerError('Incorrect password. Please try again.')
      } else if (msg.includes('fetch') || msg.includes('network') || msg.includes('econnrefused')) {
        triggerError('Cannot reach server. It may be waking up — please wait and retry.')
      } else {
        triggerError('Authentication failed. Please try again.')
      }
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="min-h-screen pt-16 pb-16 px-4 flex items-center justify-center">
      <motion.div
        animate={shake ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
        transition={{ duration: 0.55, ease: 'easeInOut' }}
        className="w-full max-w-sm"
      >
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass-gradient-border rounded-2xl p-8 shadow-[0_8px_48px_rgba(0,0,0,0.55)]"
        >
          {/* Lock icon */}
          <div className="flex justify-center mb-7">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-violet/10 border border-violet/20 flex items-center justify-center shadow-violet-sm">
                <svg className="w-8 h-8 text-violet" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-violet border-2 border-ink flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4"/>
                </svg>
              </div>
            </div>
          </div>

          <h1 className="font-display font-bold text-2xl text-offwhite text-center mb-2 tracking-tight">
            Recruiter Access
          </h1>
          <p className="text-sm text-muted text-center mb-8 leading-relaxed">
            This dashboard is restricted to authorized recruiters.<br/>
            Enter the access password to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password field */}
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={pw}
                onChange={e => { setPw(e.target.value); if (errorMsg) setErrorMsg('') }}
                placeholder="Enter recruiter password"
                autoFocus
                autoComplete="current-password"
                className={`w-full bg-ink-3/60 border rounded-xl px-4 py-3 text-sm text-offwhite placeholder:text-muted/50 outline-none transition-all duration-200 pr-11 ${
                  errorMsg
                    ? 'border-signal-red/50 shadow-[0_0_0_3px_rgba(244,91,91,0.10)]'
                    : 'border-white/[0.10] hover:border-white/[0.18] focus:border-violet/60 focus:shadow-[0_0_0_3px_rgba(124,92,255,0.14)]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShow(v => !v)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/50 hover:text-muted transition-colors cursor-pointer p-1"
              >
                {show ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {errorMsg && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs text-signal-red flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {errorMsg}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={!pw.trim() || checking}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              className="w-full bg-violet hover:bg-violet-dim disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-violet-sm hover:shadow-violet-glow text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {checking ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Unlock Dashboard
                </>
              )}
            </motion.button>
          </form>

          <p className="text-center text-muted/40 text-[11px] mt-7">
            TalentRank AI · Recruiter Intelligence Platform
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
