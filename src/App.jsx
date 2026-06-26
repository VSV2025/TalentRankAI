import { useState, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Header from './components/shared/Header'
import HeroPage from './components/shared/HeroPage'
import CandidateIntake from './components/candidate/CandidateIntake'
import RecruiterDashboard from './components/recruiter/RecruiterDashboard'
import AnimatedBackground from './components/shared/AnimatedBackground'

const VIEW_ORDER = ['home', 'candidate', 'recruiter']

const SPRING = { type: 'spring', stiffness: 340, damping: 26, mass: 0.9 }

const variants = {
  initial: (dir) => ({
    opacity: 0,
    y: dir * 44,
    scale: 0.93,
    rotateX: dir * 3,
    transformPerspective: 1100,
  }),
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transformPerspective: 1100,
    transition: {
      opacity: { duration: 0.16, ease: 'linear' },
      y:       SPRING,
      scale:   SPRING,
      rotateX: SPRING,
    },
  },
  exit: (dir) => ({
    opacity: 0,
    y: dir * -28,
    scale: 0.93,
    rotateX: dir * -3,
    transformPerspective: 1100,
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
  }),
}

const variantsReduced = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.15 } },
  exit:    { opacity: 0, transition: { duration: 0.10 } },
}

export default function App() {
  const [view, setView] = useState('home')
  const dirRef = useRef(0)

  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const handleViewChange = useCallback((next) => {
    setView((prev) => {
      if (prev === next) return prev
      dirRef.current =
        VIEW_ORDER.indexOf(prev) < VIEW_ORDER.indexOf(next) ? 1 : -1
      return next
    })
  }, [])

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      <Header view={view} onViewChange={handleViewChange} />

      <AnimatePresence mode="wait" custom={dirRef.current}>
        <motion.main
          key={view}
          custom={dirRef.current}
          variants={prefersReduced ? variantsReduced : variants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ position: 'relative', zIndex: 10, transformOrigin: 'center top', willChange: 'transform, opacity' }}
        >
          {view === 'home'      && <HeroPage      onViewChange={handleViewChange} />}
          {view === 'candidate' && <CandidateIntake />}
          {view === 'recruiter' && <RecruiterDashboard />}
        </motion.main>
      </AnimatePresence>
    </div>
  )
}
