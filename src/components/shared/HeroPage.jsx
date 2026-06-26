import { motion, useMotionValue, useTransform, useSpring, useMotionTemplate, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'

/* Premium easing — expo-out (Vercel / Linear) */
const EXPO = [0.16, 1, 0.3, 1]
/* Silky hover spring — zero bounce */
const HOVER_SPRING = { type:'spring', stiffness:180, damping:28 }

/* ─── Cursor spotlight — spring lag for "glow trails behind cursor" ─── */
function CursorSpotlight() {
  const rx = useMotionValue(-1000)
  const ry = useMotionValue(-1000)
  const x  = useSpring(rx, { stiffness:70, damping:24, restDelta:0.5 })
  const y  = useSpring(ry, { stiffness:70, damping:24, restDelta:0.5 })
  useEffect(() => {
    const h = e => { rx.set(e.clientX); ry.set(e.clientY) }
    window.addEventListener('mousemove', h, { passive:true })
    return () => window.removeEventListener('mousemove', h)
  }, [])
  const bg = useMotionTemplate`radial-gradient(700px circle at ${x}px ${y}px, rgba(124,92,255,0.085), transparent 50%)`
  return (
    <motion.div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex:6, background:bg, willChange:'background' }}
    />
  )
}

/* ─── Count-up — throttled setState (max 24fps to avoid 60 re-renders/s) ─── */
function useCountUp(target, duration = 2400, startDelay = 900) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let raf
    const t = setTimeout(() => {
      const start = performance.now()
      let lastSet = 0
      const tick = now => {
        const p = Math.min((now - start) / duration, 1)
        const cur = Math.round(target * (1 - Math.pow(1 - p, 5)))
        if (now - lastSet > 42) { /* ~24fps ceiling — still looks smooth */
          setVal(cur)
          lastSet = now
        }
        if (p < 1) raf = requestAnimationFrame(tick)
        else setVal(target)
      }
      raf = requestAnimationFrame(tick)
    }, startDelay)
    return () => { clearTimeout(t); cancelAnimationFrame(raf) }
  }, [target, duration, startDelay])
  return val
}

/* ─── IntersectionObserver hook ─── */
function useInView(threshold = 0.18) {
  const ref = useRef()
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

/* ─── Blur-reveal headline ─── */
function BlurRevealHeadline() {
  const lines = [
    { words: ['Find', 'talent.'],      cls: 'text-gradient-hero' },
    { words: ['Rank', 'by', 'fit.'],   cls: 'shimmer-text'       },
    { words: ['Hire', 'the', 'best.'], cls: 'text-gradient-hero' },
  ]
  return (
    <h1 className="font-display font-extrabold leading-[1.04] tracking-tight text-5xl sm:text-6xl md:text-[4.4rem] lg:text-[5.2rem]">
      {lines.map((line, li) => (
        <div key={li} className="block">
          {line.words.map((word, wi) => (
            <motion.span
              key={wi}
              initial={{ opacity:0, filter:'blur(10px)', y:22, scale:0.94 }}
              animate={{ opacity:1, filter:'blur(0px)', y:0, scale:1 }}
              transition={{ delay:0.10 + li*0.20 + wi*0.09, duration:0.90, ease:EXPO }}
              className={`inline-block mr-[0.2em] ${line.cls}`}
              style={{ willChange:'filter,transform,opacity', backfaceVisibility:'hidden' }}
            >
              {word}
            </motion.span>
          ))}
        </div>
      ))}
    </h1>
  )
}

/* ─── Live candidate ranking ─── */
const CANDIDATES = [
  { name:'Sarah K.',  role:'Full Stack',  score:94, color:'#7C5CFF' },
  { name:'Marcus T.', role:'DevOps',       score:87, color:'#3FCF8E' },
  { name:'Priya M.',  role:'ML Engineer',  score:82, color:'#A78BFA' },
  { name:'James W.',  role:'Backend',      score:76, color:'#F5A623' },
  { name:'Aiko R.',   role:'Frontend',     score:71, color:'#38BDF8' },
]

function LiveRankingDemo() {
  const [ref, visible] = useInView(0.25)
  return (
    <div ref={ref} className="space-y-2.5 mt-3">
      {CANDIDATES.map((c, i) => (
        <motion.div
          key={c.name}
          initial={{ opacity:0, x:-14 }}
          animate={visible ? { opacity:1, x:0 } : {}}
          transition={{ delay:0.12 + i*0.08, duration:0.70, ease:EXPO }}
          style={{ willChange:'transform,opacity' }}
          className="flex items-center gap-2.5"
        >
          <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11,
            color:'rgba(255,255,255,0.18)', minWidth:12 }}>{i+1}</span>

          {/* scaleX instead of width — GPU-composited, zero layout reflow */}
          <div className="flex-1 h-1.5 rounded-full overflow-hidden relative"
            style={{ background:'rgba(255,255,255,0.05)' }}>
            <motion.div
              initial={{ scaleX:0 }}
              animate={visible ? { scaleX: c.score / 100 } : {}}
              transition={{ delay:0.30 + i*0.08, duration:1.4, ease:EXPO }}
              style={{
                position:'absolute', inset:0, borderRadius:9999,
                transformOrigin:'left center',
                background:`linear-gradient(to right, ${c.color}, ${c.color}50)`,
                boxShadow:`0 0 7px ${c.color}44`,
                willChange:'transform',
              }}
            />
          </div>

          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs text-offwhite/75 font-medium truncate w-16">{c.name}</span>
            <span className="text-[10px] text-muted/32 hidden sm:block w-20 truncate">{c.role}</span>
          </div>

          <AnimatePresence>
            {visible && (
              <motion.span
                key={`s-${c.name}`}
                initial={{ opacity:0, scale:0.65 }}
                animate={{ opacity:1, scale:1 }}
                exit={{ opacity:0 }}
                transition={{ delay:0.65 + i*0.08, type:'spring', stiffness:180, damping:28 }}
                style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, fontSize:13,
                  color:c.color, textShadow:`0 0 12px ${c.color}`, minWidth:24, textAlign:'right',
                  willChange:'transform,opacity' }}
              >
                {c.score}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity:0 }} animate={visible ? { opacity:1 } : {}}
        transition={{ delay:1.3, duration:0.6, ease:EXPO }}
        className="flex items-center gap-1.5 pt-1">
        <div style={{ width:6, height:6, borderRadius:'50%', background:'#3FCF8E',
          boxShadow:'0 0 8px #3FCF8E', animation:'ping-slow 1.4s cubic-bezier(0,0,0.2,1) infinite' }}/>
        <span className="text-[10px] text-muted/38 tracking-widest uppercase">Ranking in real-time</span>
      </motion.div>
    </div>
  )
}

/* ─── Agent debate ─── */
function AgentDebateVisual() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % 3), 2600)
    return () => clearInterval(id)
  }, [])
  const messages = [
    { from:'Pro',     text:'Strong system design background', color:'#3FCF8E' },
    { from:'Skeptic', text:'Only 2 years experience',         color:'#F5A623' },
    { from:'Pro',     text:'OSS contributions compensate',    color:'#3FCF8E' },
  ]
  return (
    <div className="space-y-2 mt-3">
      {messages.slice(0, step + 1).map((m, i) => (
        <motion.div
          key={i}
          initial={{ opacity:0, y:10, scale:0.96 }}
          animate={{ opacity:1, y:0, scale:1 }}
          transition={{ duration:0.50, ease:EXPO }}
          style={{ willChange:'transform,opacity' }}
          className={`flex gap-2 ${m.from === 'Skeptic' ? 'flex-row-reverse' : ''}`}
        >
          <div style={{ width:22, height:22, borderRadius:'50%', flexShrink:0,
            background:`rgba(${m.color === '#3FCF8E' ? '63,207,142' : '245,166,35'},0.11)`,
            border:`1px solid ${m.color}25`,
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:9, color:m.color, fontWeight:700 }}>{m.from[0]}</span>
          </div>
          <div style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${m.color}14`,
            borderRadius:10, padding:'5px 9px', maxWidth:'75%' }}>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.65)' }}>{m.text}</span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

/* ─── Hero Orb — liquid spring tilt, solid stat pills (no backdropFilter) ─── */
function HeroOrb() {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  useEffect(() => {
    const h = e => {
      mx.set(e.clientX - window.innerWidth / 2)
      my.set(e.clientY - window.innerHeight / 2)
    }
    window.addEventListener('mousemove', h, { passive:true })
    return () => window.removeEventListener('mousemove', h)
  }, [])
  /* stiffness:20 = liquid slow follow, no snapping */
  const rotX = useSpring(useTransform(my, [-600,600], [10,-10]), { stiffness:20, damping:20, restDelta:0.001 })
  const rotY = useSpring(useTransform(mx, [-600,600], [-12,12]), { stiffness:20, damping:20, restDelta:0.001 })

  const STATS = [
    { label:'Candidates', value:'10K+', color:'#7C5CFF', pos:{ top:8,    left:'50%'  }, tf:'translateX(-50%)', delay:1.30, dy:-6 },
    { label:'Accuracy',   value:'94%',  color:'#3FCF8E', pos:{ right:8,  top:'50%'   }, tf:'translateY(-50%)', delay:1.42, dy:-5 },
    { label:'AI Agents',  value:'Dual', color:'#A78BFA', pos:{ bottom:8, left:'50%'  }, tf:'translateX(-50%)', delay:1.54, dy:-7 },
    { label:'Speed',      value:'3 s',  color:'#F5A623', pos:{ left:8,   top:'50%'   }, tf:'translateY(-50%)', delay:1.66, dy:-5 },
  ]

  return (
    <div className="relative flex items-center justify-center"
      style={{ width:520, height:520, flexShrink:0 }}>

      {/* Ambient breathe */}
      <motion.div
        animate={{ scale:[1, 1.09, 1], opacity:[0.12, 0.38, 0.12] }}
        transition={{ duration:10, repeat:Infinity, ease:'easeInOut' }}
        style={{ position:'absolute', inset:80, borderRadius:'50%', pointerEvents:'none',
          background:'radial-gradient(circle, rgba(124,92,255,0.36) 0%, transparent 70%)',
          filter:'blur(48px)', willChange:'transform,opacity' }}
      />

      {/* Orbit rings — compositor-only rotation */}
      <motion.div
        animate={{ rotate:360 }}
        transition={{ duration:40, repeat:Infinity, ease:'linear' }}
        style={{ position:'absolute', inset:55, borderRadius:'50%', pointerEvents:'none',
          border:'1px dashed rgba(124,92,255,0.13)', willChange:'transform' }}
      />
      <motion.div
        animate={{ rotate:-360 }}
        transition={{ duration:30, repeat:Infinity, ease:'linear' }}
        style={{ position:'absolute', inset:36, borderRadius:'50%', pointerEvents:'none',
          border:'1px dashed rgba(63,207,142,0.07)', willChange:'transform' }}
      />

      {/* Sphere */}
      <div style={{ perspective:1000, width:280, height:280, flexShrink:0, willChange:'transform' }}>
        <motion.div
          style={{ rotateX:rotX, rotateY:rotY, width:280, height:280, willChange:'transform' }}>
          <div style={{ width:280, height:280, borderRadius:'50%', overflow:'hidden',
            position:'relative', border:'1px solid rgba(124,92,255,0.28)',
            boxShadow:'0 0 78px rgba(124,92,255,0.38),0 0 155px rgba(124,92,255,0.10),inset 0 0 48px rgba(124,92,255,0.09)' }}>
            <motion.div
              animate={{ rotate:360 }}
              transition={{ duration:11, repeat:Infinity, ease:'linear' }}
              style={{ position:'absolute', inset:-70, borderRadius:'50%',
                background:'conic-gradient(from 0deg,#7C5CFF 0deg,#3FCF8E 95deg,#F5A623 180deg,#38BDF8 255deg,#EC4899 315deg,#7C5CFF 360deg)',
                filter:'blur(22px)', opacity:0.88, willChange:'transform' }}
            />
            <motion.div
              animate={{ rotate:-360 }}
              transition={{ duration:18, repeat:Infinity, ease:'linear' }}
              style={{ position:'absolute', inset:14, borderRadius:'50%',
                background:'conic-gradient(from 180deg,#A78BFA 0deg,#EC4899 75deg,#7C5CFF 185deg,#3FCF8E 285deg,#A78BFA 360deg)',
                filter:'blur(17px)', opacity:0.52, willChange:'transform' }}
            />
            <div style={{ position:'absolute', inset:0,
              background:'radial-gradient(circle, rgba(11,11,20,0.06) 0%, rgba(11,11,20,0.36) 44%, rgba(11,11,20,0.92) 100%)' }}/>
            <div style={{ position:'absolute', inset:0,
              background:'radial-gradient(ellipse 62% 52% at 30% 20%, rgba(255,255,255,0.19) 0%, transparent 52%)' }}/>
            <div style={{ position:'absolute', inset:22, borderRadius:'50%',
              border:'1px solid rgba(255,255,255,0.06)' }}/>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center' }}>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:52,
                lineHeight:1, color:'#fff', letterSpacing:'-0.04em',
                textShadow:'0 0 40px rgba(124,92,255,1),0 0 80px rgba(124,92,255,0.55)' }}>AI</div>
              <div style={{ color:'rgba(167,139,250,0.80)', fontSize:11,
                letterSpacing:'0.26em', textTransform:'uppercase', marginTop:5 }}>TalentRank</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Stat pills — solid bg (no backdropFilter = no expensive compositing) */}
      {STATS.map(({ label, value, color, pos, tf, delay, dy }, i) => (
        <motion.div
          key={label}
          initial={{ opacity:0, scale:0.72 }}
          animate={{ opacity:1, scale:1 }}
          transition={{ delay, type:'spring', stiffness:160, damping:26 }}
          style={{ position:'absolute', ...pos, transform:tf, willChange:'transform,opacity' }}
        >
          <motion.div
            animate={{ y:[0, dy, 0] }}
            transition={{ duration:4.6 + i * 1.2, repeat:Infinity, ease:'easeInOut', delay: i * 0.55 }}
            style={{ willChange:'transform',
              background:'rgba(10,10,20,0.90)', /* solid — no backdropFilter */
              border:`1px solid ${color}1c`, borderRadius:13,
              padding:'10px 18px', textAlign:'center', minWidth:84,
              boxShadow:`0 2px 22px ${color}0a, inset 0 1px 0 rgba(255,255,255,0.04)` }}
          >
            <div style={{ color, fontFamily:'JetBrains Mono,monospace', fontWeight:700,
              fontSize:19, lineHeight:1.25, textShadow:`0 0 14px ${color}` }}>{value}</div>
            <div style={{ color:'#4E4E66', fontSize:10, marginTop:3, letterSpacing:'0.04em' }}>{label}</div>
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
}

/* ─── Bento grid ─── */
function BentoGrid() {
  const accuracy = useCountUp(94, 2400, 900)
  const [gridRef, gridVisible] = useInView(0.10)

  const bentoProps = {
    whileHover:{ y:-5, scale:1.012 },
    transition: HOVER_SPRING,
  }

  return (
    <div ref={gridRef}
      className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 px-4 mb-16">

      {/* Wide — ranking */}
      <motion.div
        initial={{ opacity:0, y:34 }} animate={gridVisible ? { opacity:1, y:0 } : {}}
        transition={{ delay:0.04, duration:0.80, ease:EXPO }}
        style={{ willChange:'transform,opacity' }}
        className="lg:col-span-2 glass-gradient-border rounded-2xl p-6 relative overflow-hidden cursor-default"
        {...bentoProps}
      >
        <div style={{ position:'absolute', inset:0, pointerEvents:'none',
          background:'radial-gradient(ellipse 80% 60% at 0% 100%, rgba(124,92,255,0.09), transparent 65%)' }}/>
        <div style={{ position:'absolute', top:-40, right:-40, width:200, height:200, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(124,92,255,0.10) 0%, transparent 70%)',
          filter:'blur(28px)', pointerEvents:'none' }}/>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest"
              style={{ color:'#7C5CFF' }}>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
              Semantic Engine
            </span>
            <div className="flex items-center gap-1.5">
              <div style={{ width:5, height:5, borderRadius:'50%', background:'#3FCF8E',
                boxShadow:'0 0 6px #3FCF8E', animation:'ping-slow 1.4s cubic-bezier(0,0,0.2,1) infinite' }}/>
              <span style={{ fontSize:10, color:'rgba(63,207,142,0.62)', letterSpacing:'0.1em' }}>LIVE</span>
            </div>
          </div>
          <h3 className="font-display font-bold text-offwhite text-xl sm:text-2xl mb-1 leading-tight">
            AI Candidate Ranking
          </h3>
          <p className="text-muted/52 text-xs leading-relaxed mb-1">
            Beyond keywords — inferred skills, career signals, ranked in real-time.
          </p>
          <LiveRankingDemo/>
        </div>
      </motion.div>

      {/* Tall — accuracy */}
      <motion.div
        initial={{ opacity:0, y:34 }} animate={gridVisible ? { opacity:1, y:0 } : {}}
        transition={{ delay:0.11, duration:0.80, ease:EXPO }}
        style={{ willChange:'transform,opacity' }}
        className="lg:row-span-2 glass-gradient-border rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-center text-center cursor-default"
        {...bentoProps}
      >
        <div style={{ position:'absolute', inset:0, pointerEvents:'none',
          background:'radial-gradient(ellipse 90% 70% at 50% 50%, rgba(63,207,142,0.06), transparent 70%)' }}/>
        <div className="relative z-10 flex flex-col items-center gap-4 w-full">
          <div className="relative" style={{ width:120, height:120 }}>
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(63,207,142,0.08)" strokeWidth="8"/>
              <motion.circle cx="60" cy="60" r="52" fill="none" stroke="#3FCF8E" strokeWidth="8"
                strokeLinecap="round"
                initial={{ strokeDasharray:'0 327' }}
                animate={gridVisible ? { strokeDasharray:`${accuracy * 3.27} 327` } : {}}
                transition={{ duration:2.8, ease:EXPO, delay:0.6 }}
                style={{ filter:'drop-shadow(0 0 9px #3FCF8E)' }}
              />
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex',
              alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
              <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:800, fontSize:26,
                color:'#3FCF8E', textShadow:'0 0 20px rgba(63,207,142,0.75)', lineHeight:1 }}>{accuracy}%</span>
              <span style={{ color:'#55556A', fontSize:11, marginTop:3 }}>Accuracy</span>
            </div>
          </div>
          <div>
            <h3 className="font-display font-bold text-offwhite text-lg mb-1">Fit Accuracy</h3>
            <p className="text-muted/52 text-xs leading-relaxed">94% of top-ranked candidates match hiring criteria</p>
          </div>
          <div className="w-full pt-3" style={{ borderTop:'1px solid rgba(255,255,255,0.055)' }}>
            {[['False positives','6%'],['Fairness score','98%'],['Bias flags','0']].map(([k,v]) => (
              <div key={k} className="flex justify-between items-center text-xs text-muted/45 mb-1.5">
                <span>{k}</span>
                <span className="font-mono-data text-signal-green">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Speed */}
      <motion.div
        initial={{ opacity:0, y:34 }} animate={gridVisible ? { opacity:1, y:0 } : {}}
        transition={{ delay:0.18, duration:0.80, ease:EXPO }}
        style={{ willChange:'transform,opacity' }}
        className="glass-gradient-border rounded-2xl p-5 relative overflow-hidden cursor-default"
        {...bentoProps}
      >
        <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(167,139,250,0.14) 0%, transparent 70%)',
          filter:'blur(18px)', pointerEvents:'none' }}/>
        <div className="relative z-10">
          <div className="flex items-end gap-1 mb-1">
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:800, fontSize:38,
              color:'#A78BFA', textShadow:'0 0 26px rgba(167,139,250,0.75)', lineHeight:1 }}>3</div>
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:400, fontSize:18,
              color:'rgba(167,139,250,0.52)', marginBottom:4 }}>s</div>
          </div>
          <div className="font-display font-semibold text-offwhite text-sm mb-1">Ranking speed</div>
          <p className="text-muted/48 text-xs leading-relaxed">10K-candidate pool to sorted shortlist, no batching.</p>
          <div className="mt-3 flex gap-1">
            {Array.from({ length: 12 }, (_, i) => (
              <motion.div key={i}
                animate={{ scaleY:[0.25, 1, 0.25] }}
                transition={{ duration:1.1, repeat:Infinity, delay:i * 0.07, ease:[0.37, 0, 0.63, 1] }}
                style={{ width:3, height:16, borderRadius:2, background:'rgba(167,139,250,0.30)',
                  transformOrigin:'bottom', flexShrink:0, willChange:'transform' }}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Dual agent */}
      <motion.div
        initial={{ opacity:0, y:34 }} animate={gridVisible ? { opacity:1, y:0 } : {}}
        transition={{ delay:0.25, duration:0.80, ease:EXPO }}
        style={{ willChange:'transform,opacity' }}
        className="glass-gradient-border rounded-2xl p-5 relative overflow-hidden cursor-default"
        {...bentoProps}
      >
        <div style={{ position:'absolute', bottom:-20, left:-20, width:100, height:100, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(245,166,35,0.11) 0%, transparent 70%)',
          filter:'blur(18px)', pointerEvents:'none' }}/>
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex gap-1.5">
              {[['P','#3FCF8E','rgba(63,207,142,0.09)'],['S','#F5A623','rgba(245,166,35,0.09)']].map(([l,c,bg]) => (
                <div key={l} style={{ width:22, height:22, borderRadius:'50%', background:bg,
                  border:`1px solid ${c}24`,
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:9, color:c, fontWeight:700 }}>{l}</span>
                </div>
              ))}
            </div>
            <div className="font-display font-semibold text-offwhite text-sm">Dual-Agent Debate</div>
          </div>
          <p className="text-muted/45 text-xs mb-1">Borderline picks argued from both sides before ranking.</p>
          <AgentDebateVisual/>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── Marquee ─── */
const COMPANIES = ['Anthropic','Stripe','Vercel','Linear','Notion','Figma','Supabase','Resend','Loom','Raycast']
function Marquee() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 mb-14">
      <p className="text-center text-muted/20 text-xs uppercase tracking-[0.22em] mb-4">Trusted by teams at</p>
      <div className="relative overflow-hidden" style={{
        maskImage:'linear-gradient(to right,transparent,black 14%,black 86%,transparent)',
        WebkitMaskImage:'linear-gradient(to right,transparent,black 14%,black 86%,transparent)',
      }}>
        <div className="flex" style={{ animation:'marquee 34s linear infinite', willChange:'transform' }}>
          {[...COMPANIES, ...COMPANIES].map((c, i) => (
            <div key={i} className="flex items-center gap-1.5 px-4 py-2 rounded-full border mr-3 flex-shrink-0"
              style={{ background:'rgba(255,255,255,0.016)', borderColor:'rgba(255,255,255,0.062)' }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:'rgba(124,92,255,0.48)' }}/>
              <span className="text-xs text-muted/30 font-medium whitespace-nowrap tracking-wide">{c}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Main ─── */
export default function HeroPage({ onViewChange }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden pt-20">
      <CursorSpotlight/>

      {/* Top accent line */}
      <motion.div
        initial={{ scaleX:0, opacity:0 }} animate={{ scaleX:1, opacity:1 }}
        transition={{ duration:2.2, ease:EXPO }}
        style={{ position:'fixed', top:0, left:0, right:0, height:1, zIndex:60,
          transformOrigin:'left', willChange:'transform,opacity',
          background:'linear-gradient(to right,transparent 0%,rgba(124,92,255,0.52) 30%,rgba(167,139,250,0.72) 50%,rgba(63,207,142,0.42) 70%,transparent 100%)' }}
      />

      {/* Hero split */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[82vh]">

          {/* LEFT */}
          <div className="flex flex-col justify-center order-2 lg:order-1">

            {/* Badge */}
            <motion.div
              initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.72, ease:EXPO }}
              style={{ willChange:'transform,opacity' }}
              className="flex mb-7"
            >
              <div className="relative inline-flex items-center gap-2.5 rounded-full px-5 py-2.5 cursor-default"
                style={{ background:'rgba(11,11,20,0.60)', backdropFilter:'blur(24px)',
                  border:'1px solid rgba(255,255,255,0.09)' }}>
                <div className="absolute inset-0 rounded-full iridescent-border"
                  style={{ opacity:0.38, pointerEvents:'none' }}/>
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-signal-green opacity-68"
                    style={{ animation:'ping-slow 1.4s cubic-bezier(0,0,0.2,1) infinite' }}/>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-signal-green"/>
                </span>
                <span className="text-xs text-muted-2 font-medium tracking-wide">Hackathon 2025 · AI Recruiting</span>
                <span className="text-xs font-bold rounded-full px-2.5 py-0.5"
                  style={{ background:'rgba(124,92,255,0.15)', color:'#A78BFA',
                    border:'1px solid rgba(124,92,255,0.24)' }}>Live Demo</span>
              </div>
            </motion.div>

            {/* Headline */}
            <div className="mb-6"><BlurRevealHeadline/></div>

            {/* Sub copy */}
            <motion.p
              initial={{ opacity:0, filter:'blur(10px)', y:16 }}
              animate={{ opacity:1, filter:'blur(0px)', y:0 }}
              transition={{ delay:0.66, duration:0.82, ease:EXPO }}
              style={{ willChange:'filter,transform,opacity' }}
              className="text-muted-2 text-lg leading-relaxed mb-9 max-w-xl"
            >
              Narrows{' '}
              <span className="text-offwhite font-semibold"
                style={{ textShadow:'0 0 24px rgba(124,92,255,0.58)' }}>10,000 candidates</span>{' '}
              to a precision shortlist in seconds — semantic scoring, behavioural signals, fairness audit.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:0.78, duration:0.72, ease:EXPO }}
              style={{ willChange:'transform,opacity' }}
              className="flex flex-wrap gap-3 mb-10"
            >
              <motion.button
                whileHover={{ scale:1.024 }} whileTap={{ scale:0.976 }}
                transition={HOVER_SPRING}
                onClick={() => onViewChange('recruiter')}
                className="relative group flex items-center gap-2.5 text-white font-semibold px-7 py-3.5 rounded-xl cursor-pointer overflow-hidden text-sm"
                style={{ background:'linear-gradient(135deg,#7C5CFF 0%,#5A3FCC 100%)',
                  boxShadow:'0 0 26px rgba(124,92,255,0.48),0 0 52px rgba(124,92,255,0.12),inset 0 1px 0 rgba(255,255,255,0.12)',
                  willChange:'transform' }}
              >
                <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                  <div className="-skew-x-12 absolute inset-y-0 bg-gradient-to-r from-transparent via-white/16 to-transparent"
                    style={{ left:'-100%', width:'60%', animation:'beam-sweep 3.2s ease-in-out infinite' }}/>
                </div>
                <svg className="w-4 h-4 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <span className="relative z-10">Open Dashboard</span>
              </motion.button>

              <motion.button
                whileHover={{ scale:1.024 }} whileTap={{ scale:0.976 }}
                transition={HOVER_SPRING}
                onClick={() => onViewChange('candidate')}
                className="flex items-center gap-2.5 text-offwhite font-semibold px-7 py-3.5 rounded-xl cursor-pointer border text-sm"
                style={{ background:'rgba(11,11,20,0.50)', backdropFilter:'blur(20px)',
                  borderColor:'rgba(255,255,255,0.09)', willChange:'transform' }}
              >
                <svg className="w-4 h-4" style={{ color:'#7C5CFF' }} viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                Apply as Candidate
              </motion.button>
            </motion.div>

            {/* Stat strip */}
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }}
              transition={{ delay:0.96, duration:0.75, ease:EXPO }}
              style={{ willChange:'opacity' }}
              className="flex flex-wrap items-center gap-6 pt-6"
              style={{ borderTop:'1px solid rgba(255,255,255,0.052)' }}
            >
              {[
                { value:'10K+', label:'Ranked',   color:'#7C5CFF' },
                { value:'94%',  label:'Accuracy', color:'#3FCF8E' },
                { value:'3 s',  label:'Speed',    color:'#A78BFA' },
                { value:'Dual', label:'Agents',   color:'#F5A623' },
              ].map(({ value, label, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:800, fontSize:19,
                    color, textShadow:`0 0 13px ${color}` }}>{value}</span>
                  <span className="text-muted/38 text-xs tracking-wide">{label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT — orb */}
          <motion.div
            initial={{ opacity:0, scale:0.90 }} animate={{ opacity:1, scale:1 }}
            transition={{ delay:0.24, duration:1.05, ease:EXPO }}
            style={{ willChange:'transform,opacity' }}
            className="flex items-center justify-center order-1 lg:order-2"
          >
            <div className="hidden lg:block"><HeroOrb/></div>
            <div className="lg:hidden flex items-center justify-center" style={{ width:200, height:200 }}>
              <div style={{ width:180, height:180, borderRadius:'50%', overflow:'hidden', position:'relative',
                border:'1px solid rgba(124,92,255,0.32)',
                boxShadow:'0 0 58px rgba(124,92,255,0.40)' }}>
                <motion.div animate={{ rotate:360 }}
                  transition={{ duration:11, repeat:Infinity, ease:'linear' }}
                  style={{ position:'absolute', inset:-40, borderRadius:'50%',
                    background:'conic-gradient(from 0deg,#7C5CFF,#3FCF8E,#F5A623,#38BDF8,#7C5CFF)',
                    filter:'blur(17px)', opacity:0.86, willChange:'transform' }}/>
                <div style={{ position:'absolute', inset:0,
                  background:'radial-gradient(circle, rgba(11,11,20,0.06) 0%, rgba(11,11,20,0.83) 100%)' }}/>
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:36,
                    color:'#fff', textShadow:'0 0 28px rgba(124,92,255,1)' }}>AI</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Divider */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 mb-10">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px"
            style={{ background:'linear-gradient(to right,transparent,rgba(124,92,255,0.18),transparent)' }}/>
          <span className="text-xs text-muted/20 uppercase tracking-[0.22em] font-medium">How it works</span>
          <div className="flex-1 h-px"
            style={{ background:'linear-gradient(to right,transparent,rgba(124,92,255,0.18),transparent)' }}/>
        </div>
      </div>

      <div className="relative z-10"><BentoGrid/></div>
      <div className="relative z-10"><Marquee/></div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity:0 }} animate={{ opacity:1 }}
        transition={{ delay:2.5, duration:1.0, ease:EXPO }}
        className="relative z-10 flex flex-col items-center gap-2 pb-10"
      >
        <span className="text-muted/16 text-xs tracking-[0.22em] uppercase">Scroll</span>
        <motion.div
          animate={{ y:[0, 8, 0] }}
          transition={{ duration:2.8, repeat:Infinity, ease:'easeInOut' }}
          style={{ willChange:'transform' }}
          className="w-5 h-8 rounded-full flex items-start justify-center pt-1.5"
          style={{ border:'1px solid rgba(255,255,255,0.062)' }}
        >
          <div className="w-1 h-2 rounded-full" style={{ background:'rgba(124,92,255,0.42)' }}/>
        </motion.div>
      </motion.div>
    </div>
  )
}
