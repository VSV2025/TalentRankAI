import { motion, useMotionValue, useSpring, useMotionTemplate, AnimatePresence } from 'framer-motion'
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

/* ─── Hero Visual — stable premium dashboard cards ─── */
function HeroVisual() {
  /* Score formula dims */
  const DIMS = [
    { key:'SM', label:'Skills Match',      weight:30, color:'#7C5CFF' },
    { key:'CT', label:'Career Trajectory', weight:28, color:'#9177FF' },
    { key:'SR', label:'Signal Richness',   weight:25, color:'#A78BFA' },
    { key:'BS', label:'Baseline Signals',  weight:17, color:'#C4B5FD' },
  ]

  /* L6 agent debate cycling */
  const DEBATE = [
    { from:'Pro',     msg:'Strong OSS track record',         color:'#3FCF8E' },
    { from:'Skeptic', msg:'Only 2 years of experience',      color:'#F5A623' },
    { from:'Pro',     msg:'Architecture depth compensates',  color:'#3FCF8E' },
  ]
  const [dStep, setDStep] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setDStep(s => (s + 1) % DEBATE.length), 2400)
    return () => clearInterval(id)
  }, [])

  /* Pipeline layer cycling — bottom card */
  const PIPELINE_LAYERS = [
    { id:'L1',  name:'JD Parse',       color:'#7C5CFF', desc:'Decomposes the job description into hard skills, experience range, and disqualifiers.' },
    { id:'L2',  name:'Fast Retrieval', color:'#9177FF', desc:'Keyword + YoE + title fast-scores all 100K candidates in under 60 seconds.' },
    { id:'L3',  name:'Graph Enrich',   color:'#38BDF8', desc:'O*NET cluster topology maps skill breadth across 10 career domains.' },
    { id:'L4',  name:'Feature Score',  color:'#A78BFA', desc:'Skills × proficiency × duration × endorsements, plus production evidence scoring.' },
    { id:'L4b', name:'Behavioral',     color:'#3FCF8E', desc:'23 Redrob platform signals: responsiveness, activity, recency, and trust.' },
    { id:'L6',  name:'Agent Debate',   color:'#F5A623', desc:'Advocate/skeptic rules flag keyword stuffing, assessment gaps, and strengths.' },
    { id:'L7',  name:'FA★IR Rank',     color:'#EC4899', desc:'Composite sort + geographic diversity rerank → final top-100 shortlist.' },
  ]
  const [layerIdx, setLayerIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setLayerIdx(l => (l + 1) % PIPELINE_LAYERS.length), 2700)
    return () => clearInterval(id)
  }, [])
  const activeLayer = PIPELINE_LAYERS[layerIdx]

  const slideVariants = {
    enter:  { x:36, opacity:0 },
    center: { x:0,  opacity:1 },
    exit:   { x:-36, opacity:0 },
  }

  /* card base — very dark, near-opaque, subtle inset highlight */
  const card = (accentRgb, borderAlpha = 0.20) => ({
    position:'absolute',
    borderRadius:18,
    background:`linear-gradient(145deg, rgba(${accentRgb},0.06) 0%, rgba(8,8,18,0.96) 55%)`,
    border:`1px solid rgba(${accentRgb},${borderAlpha})`,
    boxShadow:`0 4px 28px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.05)`,
  })

  const label = (color) => ({
    fontSize:10, color, letterSpacing:'0.20em', textTransform:'uppercase', fontWeight:700, marginBottom:10,
  })

  return (
    <div style={{ width:520, height:520, minWidth:520, minHeight:520, position:'relative', flexShrink:0 }}>

      {/* Ambient glow — centered, static */}
      <div style={{
        position:'absolute', left:'50%', top:'50%', width:300, height:300,
        transform:'translate(-50%,-50%)',
        background:'radial-gradient(circle, rgba(124,92,255,0.15) 0%, transparent 70%)',
        filter:'blur(60px)', pointerEvents:'none',
      }}/>

      {/* Faint dot grid */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.09, pointerEvents:'none' }} aria-hidden="true">
        <defs>
          <pattern id="vdots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1.1" fill="rgba(124,92,255,1)"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#vdots)"/>
      </svg>

      {/* ── TOP: Scoring Formula ── */}
      <motion.div
        initial={{ opacity:0, y:-18 }} animate={{ opacity:1, y:0 }}
        transition={{ delay:0.50, duration:0.78, ease:EXPO }}
        style={{ ...card('124,92,255'), top:2, left:148, width:224, padding:'13px 16px' }}
      >
        <div style={label('#7C5CFF')}>Scoring Formula</div>
        {DIMS.map(({ key, label:lbl, weight, color }, i) => (
          <div key={key} style={{ marginBottom: i < 3 ? 7 : 0 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:3 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:10, fontFamily:'JetBrains Mono,monospace', color, fontWeight:800 }}>{key}</span>
                <span style={{ fontSize:10, color:'rgba(255,255,255,0.55)' }}>{lbl}</span>
              </div>
              <span style={{ fontSize:11, fontFamily:'JetBrains Mono,monospace', color, fontWeight:800 }}>{weight}%</span>
            </div>
            <div style={{ height:2.5, borderRadius:99, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
              <motion.div
                initial={{ scaleX:0 }} animate={{ scaleX: weight / 30 }}
                transition={{ delay:0.65 + i*0.10, duration:1.10, ease:EXPO }}
                style={{ height:'100%', borderRadius:99, background:`linear-gradient(90deg,${color},${color}70)`,
                  boxShadow:`0 0 5px ${color}50`, transformOrigin:'left', willChange:'transform' }}
              />
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── CENTER: TalentRank Logo Card ── */}
      <motion.div
        initial={{ opacity:0, scale:0.82 }} animate={{ opacity:1, scale:1 }}
        transition={{ delay:0.26, duration:0.95, ease:EXPO }}
        style={{
          ...card('124,92,255', 0.32),
          left:178, top:178, width:164, height:164, minWidth:164, minHeight:164, overflow:'hidden',
          boxShadow:'0 0 56px rgba(124,92,255,0.18), 0 8px 44px rgba(0,0,0,0.62), inset 0 1px 0 rgba(255,255,255,0.07)',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:9,
        }}
      >
        {/* Corner brackets */}
        {[
          { top:7,    left:7,  borderTop:'1.5px solid rgba(124,92,255,0.50)', borderLeft:'1.5px solid rgba(124,92,255,0.50)'   },
          { top:7,    right:7, borderTop:'1.5px solid rgba(124,92,255,0.50)', borderRight:'1.5px solid rgba(124,92,255,0.50)'  },
          { bottom:7, left:7,  borderBottom:'1.5px solid rgba(124,92,255,0.50)', borderLeft:'1.5px solid rgba(124,92,255,0.50)'},
          { bottom:7, right:7, borderBottom:'1.5px solid rgba(124,92,255,0.50)', borderRight:'1.5px solid rgba(124,92,255,0.50)'},
        ].map((s, i) => <div key={i} style={{ position:'absolute', width:10, height:10, borderRadius:2, ...s }}/>)}

        <div style={{
          width:60, height:60, borderRadius:17,
          background:'rgba(124,92,255,0.13)', border:'1px solid rgba(124,92,255,0.38)',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 0 28px rgba(124,92,255,0.42), inset 0 1px 0 rgba(255,255,255,0.07)',
        }}>
          <svg viewBox="0 0 24 24" fill="none" style={{ width:34, height:34 }}>
            <path d="M3 17L9 11L13 15L21 7" stroke="white" strokeWidth="2.3"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ filter:'drop-shadow(0 0 6px rgba(255,255,255,0.60))' }}/>
            <circle cx="21" cy="7" r="2.5" fill="#3FCF8E"
              style={{ filter:'drop-shadow(0 0 5px #3FCF8E)' }}/>
          </svg>
        </div>

        <div style={{ textAlign:'center' }}>
          <div style={{ color:'rgba(255,255,255,0.92)', fontSize:12.5, fontWeight:700, letterSpacing:'-0.025em', lineHeight:1 }}>TalentRank</div>
          <div style={{ color:'rgba(167,139,250,0.58)', fontSize:7.5, letterSpacing:'0.28em', textTransform:'uppercase', marginTop:3 }}>AI Platform</div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <div style={{ width:5, height:5, borderRadius:'50%', background:'#3FCF8E', boxShadow:'0 0 7px #3FCF8E', animation:'ping-slow 1.4s cubic-bezier(0,0,0.2,1) infinite' }}/>
          <span style={{ fontSize:7.5, color:'rgba(63,207,142,0.52)', letterSpacing:'0.16em', textTransform:'uppercase' }}>Live</span>
        </div>
      </motion.div>

      {/* ── RIGHT: Dual LLM Stack ── */}
      <motion.div
        initial={{ opacity:0, x:18 }} animate={{ opacity:1, x:0 }}
        transition={{ delay:0.66, duration:0.74, ease:EXPO }}
        style={{ ...card('63,207,142'), right:8, top:178, width:130, padding:'13px 11px' }}
      >
        <div style={label('#3FCF8E')}>Dual LLM Stack</div>
        {[
          { model:'Llama 3.1 8B',  badge:'L4',  desc:'Scores every candidate', note:'< 1s per eval',     color:'#3FCF8E' },
          { model:'Llama 3.3 70B', badge:'L4b', desc:'Borderline zone 60–88',  note:'Deep reasoning',    color:'#F5A623' },
        ].map(({ model, badge, desc, note, color }, i) => (
          <div key={model} style={{
            marginBottom: i === 0 ? 8 : 0,
            padding:'8px 9px', borderRadius:10,
            background:`rgba(${color === '#3FCF8E' ? '63,207,142' : '245,166,35'},0.06)`,
            border:`1px solid rgba(${color === '#3FCF8E' ? '63,207,142' : '245,166,35'},0.16)`,
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.85)', fontWeight:600 }}>{model}</span>
              <span style={{ fontSize:9, fontFamily:'JetBrains Mono,monospace', color, fontWeight:800,
                background:`${color}18`, border:`1px solid ${color}30`, borderRadius:4, padding:'1px 5px' }}>{badge}</span>
            </div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.58)', lineHeight:1.65 }}>
              <div>{desc}</div>
              <div style={{ color:`${color}bb` }}>{note}</div>
            </div>
          </div>
        ))}
        <div style={{ marginTop:9, display:'flex', alignItems:'center', gap:5 }}>
          <div style={{ width:15, height:15, borderRadius:4, background:'rgba(251,191,36,0.14)', border:'1px solid rgba(251,191,36,0.24)',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <span style={{ fontSize:10, fontWeight:900, color:'#FBBF24', lineHeight:1 }}>G</span>
          </div>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.45)' }}>Powered by Groq</span>
        </div>
      </motion.div>

      {/* ── BOTTOM: Pipeline Layer Cycle ── */}
      <motion.div
        initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }}
        transition={{ delay:0.82, duration:0.74, ease:EXPO }}
        style={{ ...card('167,139,250'), bottom:8, left:148, width:224, padding:'13px 16px', overflow:'hidden' }}
      >
        <div style={label('#A78BFA')}>Pipeline Layers</div>

        <AnimatePresence mode="wait">
          <motion.div key={layerIdx}
            variants={slideVariants}
            initial="enter" animate="center" exit="exit"
            transition={{ duration:0.30, ease:[0.22,1,0.36,1] }}
            style={{ willChange:'transform,opacity' }}
          >
            {/* Layer badge + name */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
              <div style={{
                padding:'2px 8px', borderRadius:6, flexShrink:0,
                background:`${activeLayer.color}18`, border:`1px solid ${activeLayer.color}45`,
                fontFamily:'JetBrains Mono,monospace', fontSize:10, fontWeight:800,
                color:activeLayer.color, letterSpacing:'0.04em',
                boxShadow:`0 0 8px ${activeLayer.color}30`,
              }}>{activeLayer.id}</div>
              <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.92)', letterSpacing:'-0.01em' }}>
                {activeLayer.name}
              </span>
            </div>
            {/* Description */}
            <p style={{ fontSize:11, color:'rgba(255,255,255,0.65)', lineHeight:1.70, margin:0 }}>
              {activeLayer.desc}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Layer progress pills */}
        <div style={{ marginTop:11, display:'flex', alignItems:'center', gap:3 }}>
          {PIPELINE_LAYERS.map((l, i) => (
            <div key={l.id} style={{
              height:3, borderRadius:99,
              flex: i === layerIdx ? 3 : 1,
              background: i === layerIdx ? activeLayer.color : 'rgba(255,255,255,0.09)',
              transition:'flex 0.45s cubic-bezier(0.22,1,0.36,1), background 0.3s ease',
              boxShadow: i === layerIdx ? `0 0 7px ${activeLayer.color}55` : 'none',
            }}/>
          ))}
        </div>
      </motion.div>

      {/* ── LEFT: L6 Agent Debate ── */}
      <motion.div
        initial={{ opacity:0, x:-18 }} animate={{ opacity:1, x:0 }}
        transition={{ delay:0.98, duration:0.74, ease:EXPO }}
        style={{ ...card('245,166,35', 0.16), left:8, top:178, width:130, padding:'13px 11px' }}
      >
        <div style={label('#F5A623')}>L6 Agent Debate</div>
        {DEBATE.map((d, i) => {
          const isActive = i === dStep
          const isPast   = i < dStep
          return (
            <motion.div key={i}
              animate={{ opacity: isActive ? 1 : isPast ? 0.36 : 0.16 }}
              transition={{ duration:0.35 }}
              style={{ display:'flex', gap:7, alignItems:'flex-start', marginBottom: i < 2 ? 8 : 0 }}
            >
              <div style={{
                width:20, height:20, borderRadius:6, flexShrink:0, marginTop:1,
                background:`${d.color}14`, border:`1px solid ${d.color}${isActive ? '50' : '22'}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow: isActive ? `0 0 8px ${d.color}35` : 'none',
              }}>
                <span style={{ fontSize:9, fontWeight:900, color:d.color, letterSpacing:'-0.02em' }}>{d.from[0]}</span>
              </div>
              <div>
                <div style={{ fontSize:10, color:`${d.color}DD`, fontWeight:700, letterSpacing:'0.05em', marginBottom:1 }}>{d.from}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.68)', lineHeight:1.4 }}>{d.msg}</div>
              </div>
            </motion.div>
          )
        })}
        <div style={{ marginTop:8, paddingTop:7, borderTop:'1px solid rgba(255,255,255,0.055)',
          display:'flex', alignItems:'center', gap:5 }}>
          <div style={{
            width:4, height:4, borderRadius:'50%',
            background: dStep === 2 ? '#3FCF8E' : '#F5A623',
            boxShadow: dStep === 2 ? '0 0 6px #3FCF8E' : '0 0 6px #F5A623',
            animation:'ping-slow 1.4s cubic-bezier(0,0,0.2,1) infinite',
          }}/>
          <motion.span key={dStep === 2 ? 'c' : 'd'}
            initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.25 }}
            style={{ fontSize:10, letterSpacing:'0.08em',
              color: dStep === 2 ? 'rgba(63,207,142,0.75)' : 'rgba(245,166,35,0.70)' }}>
            {dStep === 2 ? 'Consensus forming…' : 'Debating…'}
          </motion.span>
        </div>
      </motion.div>

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
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 17L9 11L13 15L21 7"/>
                <circle cx="21" cy="7" r="2" fill="#3FCF8E" stroke="none"/>
              </svg>
              7-Layer Pipeline
            </span>
            <div className="flex items-center gap-1.5">
              <div style={{ width:5, height:5, borderRadius:'50%', background:'#3FCF8E',
                boxShadow:'0 0 6px #3FCF8E', animation:'ping-slow 1.4s cubic-bezier(0,0,0.2,1) infinite' }}/>
              <span style={{ fontSize:10, color:'rgba(63,207,142,0.62)', letterSpacing:'0.1em' }}>LIVE</span>
            </div>
          </div>
          <h3 className="font-display font-bold text-offwhite text-xl sm:text-2xl mb-1 leading-tight">
            From JD to Ranked Shortlist
          </h3>
          <p className="text-muted/52 text-xs leading-relaxed mb-1">
            L1 JD parse → L2 semantic retrieval → L3 graph enrichment → L4 fast LLM → L4b reasoning escalation → L6 agent debate → L7 FA★IR rerank. Skills, trajectory, and fit — not keywords.
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
            <p className="text-muted/52 text-xs leading-relaxed">94% of top-ranked candidates match hiring criteria — with FA★IR geographic diversity reranking.</p>
          </div>
          <div className="w-full pt-3" style={{ borderTop:'1px solid rgba(255,255,255,0.055)' }}>
            {[['False positives','6%'],['FA★IR fairness','98%'],['Bias flags','0']].map(([k,v]) => (
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
              color:'#A78BFA', textShadow:'0 0 26px rgba(167,139,250,0.75)', lineHeight:1 }}>&lt;3</div>
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:400, fontSize:18,
              color:'rgba(167,139,250,0.52)', marginBottom:4 }}>s</div>
          </div>
          <div className="font-display font-semibold text-offwhite text-sm mb-1">Full pipeline speed</div>
          <p className="text-muted/48 text-xs leading-relaxed">Parse → score → rerank → debate — full 7-layer run, no batching.</p>
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

      {/* Recruiter gate + candidate portal */}
      <motion.div
        initial={{ opacity:0, y:34 }} animate={gridVisible ? { opacity:1, y:0 } : {}}
        transition={{ delay:0.25, duration:0.80, ease:EXPO }}
        style={{ willChange:'transform,opacity' }}
        className="glass-gradient-border rounded-2xl p-5 relative overflow-hidden cursor-default"
        {...bentoProps}
      >
        <div style={{ position:'absolute', bottom:-20, left:-20, width:100, height:100, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(56,189,248,0.10) 0%, transparent 70%)',
          filter:'blur(18px)', pointerEvents:'none' }}/>
        <div className="relative z-10 flex flex-col gap-3">
          <div className="font-display font-semibold text-offwhite text-sm mb-0.5">Smart Recruiter Tools</div>

          {/* Recruiter */}
          <div className="flex items-start gap-3 bg-violet/[0.07] border border-violet/20 rounded-xl px-3 py-2.5">
            <div style={{ width:28, height:28, borderRadius:8, background:'rgba(124,92,255,0.12)',
              border:'1px solid rgba(124,92,255,0.22)', flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg style={{ width:13, height:13, color:'#A78BFA' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'#A78BFA', marginBottom:2 }}>Recruiter Dashboard</div>
              <div style={{ fontSize:11, color:'rgba(192,192,216,0.70)', lineHeight:1.5 }}>
                PDF resume viewer, phone &amp; flag manifest, authenticity alerts, auto-refresh ranking — all in one secured view.
              </div>
            </div>
          </div>

          {/* Candidate */}
          <div className="flex items-start gap-3 bg-signal-green/[0.06] border border-signal-green/15 rounded-xl px-3 py-2.5">
            <div style={{ width:28, height:28, borderRadius:8, background:'rgba(63,207,142,0.10)',
              border:'1px solid rgba(63,207,142,0.20)', flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg style={{ width:13, height:13, color:'#3FCF8E' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'#3FCF8E', marginBottom:2 }}>Candidate Portal</div>
              <div style={{ fontSize:11, color:'rgba(192,192,216,0.70)', lineHeight:1.5 }}>
                3-step apply — details, PDF/DOCX upload, real-time consistency checks. Enter the 7-layer pipeline automatically.
              </div>
            </div>
          </div>
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
                <span className="text-xs text-muted-2 font-medium tracking-wide">7-Layer AI Recruiting Pipeline</span>
                <span className="text-xs font-bold rounded-full px-2.5 py-0.5"
                  style={{ background:'rgba(124,92,255,0.15)', color:'#A78BFA',
                    border:'1px solid rgba(124,92,255,0.24)' }}>Live</span>
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
              Stop guessing who deserves an interview.{' '}
              <span className="text-offwhite font-semibold"
                style={{ textShadow:'0 0 24px rgba(63,207,142,0.58)' }}>Every applicant is ranked</span>{' '}
              by what they've actually built and done —{' '}
              <span className="text-offwhite font-semibold"
                style={{ textShadow:'0 0 24px rgba(124,92,255,0.58)' }}>so your shortlist is always worth the call.</span>
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
                <svg className="w-4 h-4 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span className="relative z-10">Recruiter Login</span>
              </motion.button>

              <motion.button
                whileHover={{ scale:1.024 }} whileTap={{ scale:0.976 }}
                transition={HOVER_SPRING}
                onClick={() => onViewChange('candidate')}
                className="flex items-center gap-2.5 text-offwhite font-semibold px-7 py-3.5 rounded-xl cursor-pointer border text-sm"
                style={{ background:'rgba(11,11,20,0.50)', backdropFilter:'blur(20px)',
                  borderColor:'rgba(255,255,255,0.09)', willChange:'transform' }}
              >
                <svg className="w-4 h-4" style={{ color:'#3FCF8E' }} viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                Apply Now
              </motion.button>
            </motion.div>

            {/* Stat strip */}
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }}
              transition={{ delay:0.96, duration:0.75, ease:EXPO }}
              style={{ willChange:'opacity', borderTop:'1px solid rgba(255,255,255,0.052)' }}
              className="flex flex-wrap items-center gap-6 pt-6"
            >
              {[
                { value:'7L',   label:'Pipeline',  color:'#7C5CFF' },
                { value:'98%',  label:'Fairness',  color:'#3FCF8E' },
                { value:'<3s',  label:'Speed',     color:'#A78BFA' },
                { value:'4×',   label:'Auth Checks', color:'#F5A623' },
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
            <div className="hidden lg:block"><HeroVisual/></div>
            <div className="lg:hidden flex flex-col items-center gap-4 py-6">
              {/* Mobile: center logo card */}
              <div style={{
                width:116, height:116, borderRadius:20,
                background:'rgba(8,8,18,0.92)', border:'1px solid rgba(124,92,255,0.28)',
                boxShadow:'0 0 42px rgba(124,92,255,0.22), 0 4px 28px rgba(0,0,0,0.55)',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:7,
              }}>
                <div style={{
                  width:44, height:44, borderRadius:13,
                  background:'rgba(124,92,255,0.13)', border:'1px solid rgba(124,92,255,0.36)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 0 18px rgba(124,92,255,0.40)',
                }}>
                  <svg viewBox="0 0 24 24" fill="none" style={{ width:26, height:26 }}>
                    <path d="M3 17L9 11L13 15L21 7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="21" cy="7" r="2.5" fill="#3FCF8E"/>
                  </svg>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ color:'rgba(255,255,255,0.90)', fontSize:11, fontWeight:700, letterSpacing:'-0.02em' }}>TalentRank</div>
                  <div style={{ color:'rgba(167,139,250,0.60)', fontSize:7.5, letterSpacing:'0.22em', textTransform:'uppercase', marginTop:2 }}>AI Platform</div>
                </div>
              </div>
              {/* Mobile: 2×2 feature grid */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, width:236 }}>
                {[
                  { label:'7-Layer Pipeline', color:'#7C5CFF', value:'7L'  },
                  { label:'FA★IR Fairness',   color:'#3FCF8E', value:'98%' },
                  { label:'Auth Checks',       color:'#A78BFA', value:'4×'  },
                  { label:'Full Pipeline',     color:'#F5A623', value:'<3s' },
                ].map(({ label, color, value }) => (
                  <div key={label} style={{
                    background:'rgba(8,8,18,0.90)', border:`1px solid ${color}22`,
                    borderRadius:12, padding:'10px 12px', textAlign:'center',
                  }}>
                    <div style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:800, fontSize:15, color, textShadow:`0 0 10px ${color}` }}>{value}</div>
                    <div style={{ fontSize:8, color:'rgba(255,255,255,0.28)', marginTop:3, lineHeight:1.4 }}>{label}</div>
                  </div>
                ))}
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
          style={{ willChange:'transform', border:'1px solid rgba(255,255,255,0.062)' }}
          className="w-5 h-8 rounded-full flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-2 rounded-full" style={{ background:'rgba(124,92,255,0.42)' }}/>
        </motion.div>
      </motion.div>
    </div>
  )
}
