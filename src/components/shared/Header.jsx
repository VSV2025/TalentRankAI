import { motion } from 'framer-motion'

export default function Header({ view, onViewChange }) {
  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl"
    >
      <div className="glass-gradient-border rounded-2xl px-4 py-3 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        {/* Logo */}
        <button
          onClick={() => onViewChange('home')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-lg bg-violet flex items-center justify-center shadow-violet-sm transition-shadow duration-300 group-hover:shadow-violet-glow">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
              <path d="M3 17L9 11L13 15L21 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="21" cy="7" r="2" fill="#3FCF8E"/>
            </svg>
          </div>
          <span className="font-display font-semibold text-offwhite text-sm tracking-tight">
            TalentRank<span className="text-gradient-violet"> AI</span>
          </span>
        </button>

        {/* Nav toggle */}
        <nav className="flex items-center bg-ink-3/80 rounded-xl p-1 border border-white/[0.06]" role="tablist">
          {[
            { key: 'home', label: 'Home' },
            { key: 'candidate', label: 'Apply' },
            { key: 'recruiter', label: 'Recruiter' },
            { key: 'hackathon', label: 'Hackathon' },
          ].map(({ key, label }) => (
            <motion.button
              key={key}
              role="tab"
              aria-selected={view === key}
              onClick={() => onViewChange(key)}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`relative px-4 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${
                view === key ? 'text-white' : 'text-muted hover:text-offwhite'
              }`}
            >
              {view === key && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-violet rounded-lg shadow-violet-sm"
                  transition={{ type: 'spring', stiffness: 420, damping: 36, mass: 0.7 }}
                />
              )}
              <span className="relative z-10">{label}</span>
            </motion.button>
          ))}
        </nav>

        {/* Status */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono-data text-muted hidden sm:block tracking-widest">v1.0</span>
          <div className="relative w-2 h-2">
            <div className="w-2 h-2 rounded-full bg-signal-green"/>
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-signal-green animate-ping opacity-60"/>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
