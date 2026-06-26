import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

/* ─────────────────────────────────────────────────────
   CANVAS — Aurora orbs + Stars + 3D Neural Network + Data Flow Streams
   Single 30fps RAF loop → one compositing layer
   ───────────────────────────────────────────────────── */
function AuroraCanvas() {
  const ref = useRef()
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    let raf, frame = 0

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    /* ── Aurora orbs ── */
    const orbPalette = [
      {r:124,g:92,b:255}, {r:63,g:207,b:142}, {r:167,g:139,b:250},
      {r:56,g:189,b:248}, {r:245,g:166,b:35},
    ]
    const orbs = Array.from({length:5}, () => ({
      x: Math.random()*window.innerWidth, y: Math.random()*window.innerHeight,
      r: Math.random()*300+160,
      c: orbPalette[Math.floor(Math.random()*orbPalette.length)],
      vx: (Math.random()-0.5)*0.10, vy: (Math.random()-0.5)*0.10,
    }))

    /* ── Stars ── */
    const stars = Array.from({length:60}, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random()*1.0+0.2,
      speed: Math.random()*0.003+0.001,
      phase: Math.random()*Math.PI*2,
    }))

    /* ── 3D Neural Network — Fibonacci sphere distribution ──
       Nodes sit at fixed 3D positions on a sphere.
       Sphere rotates around Y axis → creates depth-parallax effect.
       Connections precomputed (3 nearest neighbours per node).          */
    const nodePalette = [
      {r:124,g:92,b:255}, {r:63,g:207,b:142},
      {r:167,g:139,b:250}, {r:56,g:189,b:248},
    ]
    const NN = 30
    const nnNodes = Array.from({length:NN}, (_, i) => {
      const phi   = Math.acos(1 - 2*(i+0.5)/NN)
      const theta = Math.PI*(1+Math.sqrt(5))*i
      return {
        nx: Math.sin(phi)*Math.cos(theta),
        ny: Math.sin(phi)*Math.sin(theta)*0.72, /* flatten Y axis for natural look */
        nz: Math.cos(phi),
        c:  nodePalette[Math.floor(Math.random()*nodePalette.length)],
        nr: Math.random()*1.8+1.2,
        glow: 0,
        sx:0, sy:0, sscale:0,
      }
    })

    /* Precompute unique connection pairs: each node's 3 nearest neighbours */
    const nnConns = []
    const seen = new Set()
    nnNodes.forEach((n, i) => {
      nnNodes
        .map((m, j) => {
          if (i===j) return {j, d:Infinity}
          const dx=n.nx-m.nx, dy=n.ny-m.ny, dz=n.nz-m.nz
          return {j, d:Math.sqrt(dx*dx+dy*dy+dz*dz)}
        })
        .sort((a,b)=>a.d-b.d)
        .slice(0,3)
        .forEach(({j,d}) => {
          const key = `${Math.min(i,j)},${Math.max(i,j)}`
          if (!seen.has(key) && d<0.72) { seen.add(key); nnConns.push({a:i,b:j}) }
        })
    })

    let nnRotY = 0
    const NN_FOV = 2.0 /* perspective strength */

    /* Pulses — data signals traveling along synapse connections */
    const nnPulses = []
    let nextPulse = 400

    /* ── Bezier data flow streams ──
       6 curves: 3 converging from left → center, 3 diverging center → right.
       Represents the AI pipeline: ingest → process → output.
       Stored as fraction coords [fx, fy] — resolved to pixels each frame.  */
    const FLOWS = [
      {pts:[[0,0.18],[0.28,0.12],[0.44,0.38],[0.54,0.47]], c:{r:124,g:92,b:255}},
      {pts:[[0,0.50],[0.22,0.50],[0.42,0.50],[0.54,0.50]], c:{r:63,g:207,b:142}},
      {pts:[[0,0.80],[0.28,0.76],[0.44,0.60],[0.54,0.53]], c:{r:56,g:189,b:248}},
      {pts:[[0.54,0.47],[0.64,0.26],[0.80,0.20],[1.0,0.16]], c:{r:167,g:139,b:250}},
      {pts:[[0.54,0.50],[0.70,0.50],[0.84,0.50],[1.0,0.50]], c:{r:245,g:166,b:35}},
      {pts:[[0.54,0.53],[0.64,0.72],[0.80,0.78],[1.0,0.82]], c:{r:236,g:72,b:153}},
    ]
    const flows = FLOWS.map(f => ({
      ...f,
      pars: Array.from({length:3}, () => ({t:Math.random(), spd:0.0028+Math.random()*0.003})),
    }))

    function bzPt(pts, t, W, H) {
      const [p0,p1,p2,p3] = pts
      const mt = 1-t
      return {
        x: (mt*mt*mt*p0[0]+3*mt*mt*t*p1[0]+3*mt*t*t*p2[0]+t*t*t*p3[0])*W,
        y: (mt*mt*mt*p0[1]+3*mt*mt*t*p1[1]+3*mt*t*t*p2[1]+t*t*t*p3[1])*H,
      }
    }

    const tick = ts => {
      raf = requestAnimationFrame(tick)
      frame++
      if (frame & 1) return /* 30fps — skip odd frames */

      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)
      const t = ts/1000

      /* ── Aurora orbs ── */
      orbs.forEach(o => {
        o.x += o.vx + Math.sin(t*0.0003+o.y*0.001)*0.12
        o.y += o.vy + Math.cos(t*0.00025+o.x*0.001)*0.12
        if (o.x<-o.r) o.x=W+o.r; if (o.x>W+o.r) o.x=-o.r
        if (o.y<-o.r) o.y=H+o.r; if (o.y>H+o.r) o.y=-o.r
        const g=ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,o.r)
        g.addColorStop(0,    `rgba(${o.c.r},${o.c.g},${o.c.b},0.18)`)
        g.addColorStop(0.55, `rgba(${o.c.r},${o.c.g},${o.c.b},0.06)`)
        g.addColorStop(1,    'rgba(0,0,0,0)')
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(o.x,o.y,o.r,0,Math.PI*2); ctx.fill()
      })

      /* ── Stars ── */
      stars.forEach(s => {
        const a = 0.10+0.60*Math.abs(Math.sin(t*s.speed+s.phase))
        ctx.beginPath(); ctx.arc(s.x*W, s.y*H, s.r, 0, Math.PI*2)
        ctx.fillStyle=`rgba(255,255,255,${a*0.5})`; ctx.fill()
      })

      /* ── Bezier data flow streams ── */
      flows.forEach(f => {
        /* Guide curve — very subtle */
        ctx.beginPath()
        ctx.moveTo(f.pts[0][0]*W, f.pts[0][1]*H)
        ctx.bezierCurveTo(
          f.pts[1][0]*W, f.pts[1][1]*H,
          f.pts[2][0]*W, f.pts[2][1]*H,
          f.pts[3][0]*W, f.pts[3][1]*H,
        )
        ctx.strokeStyle=`rgba(${f.c.r},${f.c.g},${f.c.b},0.07)`
        ctx.lineWidth=0.8; ctx.stroke()

        /* Flowing particle glows */
        f.pars.forEach(p => {
          p.t += p.spd; if (p.t>1) p.t=0
          const pos = bzPt(f.pts, p.t, W, H)
          const halo=ctx.createRadialGradient(pos.x,pos.y,0,pos.x,pos.y,10)
          halo.addColorStop(0, `rgba(${f.c.r},${f.c.g},${f.c.b},0.75)`)
          halo.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.fillStyle=halo; ctx.beginPath(); ctx.arc(pos.x,pos.y,10,0,Math.PI*2); ctx.fill()
          ctx.beginPath(); ctx.arc(pos.x,pos.y,2,0,Math.PI*2)
          ctx.fillStyle='rgba(255,255,255,0.95)'; ctx.fill()
        })
      })

      /* ── 3D Neural Network ── */
      nnRotY += 0.004 /* ~14° per second — elegant slow rotation */
      const cosY=Math.cos(nnRotY), sinY=Math.sin(nnRotY)
      const cosX=Math.cos(0.22),   sinX=Math.sin(0.22) /* fixed ~13° X tilt */
      const R  = Math.min(W,H)*0.38
      const cx = W*0.50, cy = H*0.50

      nnNodes.forEach(n => {
        /* Rotate Y axis */
        const rx  = n.nx*cosY + n.nz*sinY
        const ry0 = n.ny
        const rz0 = -n.nx*sinY + n.nz*cosY
        /* Apply fixed X tilt */
        const ry  = ry0*cosX - rz0*sinX
        const rz  = ry0*sinX + rz0*cosX
        /* Perspective project: divide by (1 + rz/FOV) */
        const depth  = rz + NN_FOV
        const scale  = NN_FOV / depth
        n.sx     = rx*R*scale + cx
        n.sy     = ry*R*scale + cy
        n.sscale = scale
        n.glow   = Math.max(0, n.glow-0.022)
      })

      /* Draw synapse connections */
      ctx.lineWidth = 0.5
      nnConns.forEach(({a,b}) => {
        const na=nnNodes[a], nb=nnNodes[b]
        const minScale = Math.min(na.sscale, nb.sscale)
        const breathe  = 0.65+0.35*Math.sin(t*0.5+(a+b)*0.8)
        const alpha    = 0.22*minScale*breathe
        if (alpha<0.008) return
        const r=(na.c.r+nb.c.r)>>1, g=(na.c.g+nb.c.g)>>1, b2=(na.c.b+nb.c.b)>>1
        ctx.beginPath(); ctx.moveTo(na.sx,na.sy); ctx.lineTo(nb.sx,nb.sy)
        ctx.strokeStyle=`rgba(${r},${g},${b2},${alpha})`; ctx.stroke()
      })

      /* Spawn new pulse ~every 200-450ms */
      if (ts>nextPulse && nnPulses.length<14 && nnConns.length>0) {
        const c=nnConns[Math.floor(Math.random()*nnConns.length)]
        nnPulses.push({a:c.a, b:c.b, p:0, spd:0.28+Math.random()*0.28})
        nextPulse=ts+200+Math.random()*250
      }

      /* Draw & advance pulses */
      for (let i=nnPulses.length-1; i>=0; i--) {
        const pu=nnPulses[i]
        pu.p += (1/30)*pu.spd*1.5
        if (pu.p>=1) { nnNodes[pu.b].glow=1.0; nnPulses.splice(i,1); continue }
        const na=nnNodes[pu.a], nb=nnNodes[pu.b]
        const px=na.sx+(nb.sx-na.sx)*pu.p
        const py=na.sy+(nb.sy-na.sy)*pu.p
        const pscale=na.sscale+(nb.sscale-na.sscale)*pu.p
        const pr=2.2*pscale
        const cr=(na.c.r+nb.c.r)>>1, cg=(na.c.g+nb.c.g)>>1, cb=(na.c.b+nb.c.b)>>1
        const halo=ctx.createRadialGradient(px,py,0,px,py,pr*5)
        halo.addColorStop(0, `rgba(${cr},${cg},${cb},0.82)`)
        halo.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle=halo; ctx.beginPath(); ctx.arc(px,py,pr*5,0,Math.PI*2); ctx.fill()
        ctx.beginPath(); ctx.arc(px,py,pr,0,Math.PI*2)
        ctx.fillStyle='rgba(255,255,255,0.96)'; ctx.fill()
      }

      /* Draw nodes — depth-cued: farther = smaller + dimmer */
      nnNodes.forEach(n => {
        const boost=n.glow
        const nr2=n.nr*(1+boost*0.6)*n.sscale
        /* Outer glow halo */
        const halo=ctx.createRadialGradient(n.sx,n.sy,0,n.sx,n.sy,nr2*7)
        halo.addColorStop(0, `rgba(${n.c.r},${n.c.g},${n.c.b},${(0.32+boost*0.55)*n.sscale})`)
        halo.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle=halo; ctx.beginPath(); ctx.arc(n.sx,n.sy,nr2*7,0,Math.PI*2); ctx.fill()
        /* Solid core */
        ctx.beginPath(); ctx.arc(n.sx,n.sy,nr2,0,Math.PI*2)
        ctx.fillStyle=`rgba(${n.c.r},${n.c.g},${n.c.b},${0.78+boost*0.22})`; ctx.fill()
        /* Bright pinpoint */
        if (nr2>0.5) {
          ctx.beginPath(); ctx.arc(n.sx,n.sy,nr2*0.40,0,Math.PI*2)
          ctx.fillStyle=`rgba(255,255,255,${0.62+boost*0.38})`; ctx.fill()
        }
      })
    }

    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <canvas ref={ref} className="fixed inset-0 w-full h-full pointer-events-none"
      style={{zIndex:1, willChange:'transform'}} aria-hidden="true"/>
  )
}

/* ─────────────────────────────────────────────────────
   CURSOR DOT GRID — reveals on mousemove
   ───────────────────────────────────────────────────── */
function DotGrid() {
  const dotRef = useRef()
  useEffect(() => {
    const h = e => {
      if (!dotRef.current) return
      const m = `radial-gradient(380px circle at ${e.clientX}px ${e.clientY}px, black 0%, transparent 80%)`
      dotRef.current.style.maskImage = m
      dotRef.current.style.WebkitMaskImage = m
    }
    window.addEventListener('mousemove', h, {passive:true})
    return () => window.removeEventListener('mousemove', h)
  }, [])
  return (
    <div className="fixed inset-0 pointer-events-none" style={{zIndex:4}} aria-hidden="true">
      <div ref={dotRef} style={{
        position:'absolute', inset:0,
        backgroundImage:'radial-gradient(circle, rgba(124,92,255,0.38) 1.5px, transparent 1.5px)',
        backgroundSize:'28px 28px',
        maskImage:'radial-gradient(380px circle at -1000px -1000px, black, transparent 80%)',
        WebkitMaskImage:'radial-gradient(380px circle at -1000px -1000px, black, transparent 80%)',
      }}/>
    </div>
  )
}

/* ─────────────────────────────────────────────────────
   AURORA BLOBS — pure CSS compositor thread
   ───────────────────────────────────────────────────── */
function AuroraBlobs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{zIndex:2}} aria-hidden="true">
      <div style={{ position:'absolute', width:'min(640px,46vw)', height:'min(640px,46vw)',
        top:'-18%', right:'-12%',
        background:'radial-gradient(circle,#7C5CFF 0%,#5A3FCC 38%,#2A1A8A 62%,transparent 84%)',
        filter:'blur(58px)', willChange:'transform', animation:'aurora-1 24s ease-in-out infinite alternate' }}/>
      <div style={{ position:'absolute', width:'min(580px,42vw)', height:'min(580px,42vw)',
        bottom:'-16%', left:'-10%',
        background:'radial-gradient(circle,#3FCF8E 0%,#1A8A5A 38%,#0A4535 65%,transparent 84%)',
        filter:'blur(52px)', willChange:'transform', animation:'aurora-2 30s ease-in-out infinite alternate' }}/>
      <div style={{ position:'absolute', width:'min(520px,38vw)', height:'min(380px,28vw)',
        top:'30%', left:'16%',
        background:'radial-gradient(ellipse,#A78BFA 0%,#7C5CFF 33%,#4A2FCC 58%,transparent 80%)',
        filter:'blur(62px)', willChange:'transform', animation:'aurora-3 34s ease-in-out infinite alternate' }}/>
      <div style={{ position:'absolute', width:'min(420px,30vw)', height:'min(420px,30vw)',
        top:'44%', right:'-5%',
        background:'radial-gradient(circle,#38BDF8 0%,#0EA5E9 38%,#0369A1 62%,transparent 82%)',
        filter:'blur(48px)', willChange:'transform', animation:'aurora-4 27s ease-in-out infinite alternate' }}/>
    </div>
  )
}

/* ─────────────────────────────────────────────────────
   FLOATING HEX RINGS — visual AI geometry, no text
   Three concentric hexagon outlines per ring with corner nodes.
   Represent neural processing layers / transformer attention heads.
   ───────────────────────────────────────────────────── */
const HEX_DEFS = [
  {size:165, x:'1%',  y:'5%',  color:'#7C5CFF', dur:46, dy:-15},
  {size:112, x:'84%', y:'8%',  color:'#3FCF8E', dur:38, dy: 13},
  {size:84,  x:'0%',  y:'56%', color:'#38BDF8', dur:43, dy:-11},
  {size:142, x:'81%', y:'57%', color:'#A78BFA', dur:35, dy: 15},
  {size:94,  x:'45%', y:'1%',  color:'#F5A623', dur:40, dy:-13},
  {size:74,  x:'38%', y:'85%', color:'#EC4899', dur:33, dy: 11},
  {size:60,  x:'73%', y:'80%', color:'#7C5CFF', dur:50, dy: -9},
]

/* Regular hexagon vertices (pointy-top) for a 100×100 viewBox, radius 47 */
const HEX_PTS_OUTER = '50,3 91,27 91,73 50,97 9,73 9,27'
const HEX_PTS_MID   = '50,13 83,32 83,68 50,87 17,68 17,32'
const HEX_PTS_INNER = '50,23 74,37 74,63 50,77 26,63 26,37'
const CORNER_PTS    = [[50,3],[91,27],[91,73],[50,97],[9,73],[9,27]]

function FloatingHexRings() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{zIndex:3}} aria-hidden="true">
      {HEX_DEFS.map((h, i) => (
        <motion.div key={i}
          initial={{opacity:0, scale:0.4}}
          animate={{opacity:1, scale:1}}
          transition={{delay:i*0.18+0.6, duration:2.2, ease:[0.16,1,0.3,1]}}
          style={{position:'absolute', left:h.x, top:h.y, willChange:'transform,opacity'}}>
          <motion.div
            animate={{rotate:360, y:[0, h.dy, 0]}}
            transition={{
              rotate: {duration:h.dur, repeat:Infinity, ease:'linear'},
              y:      {duration:h.dur*0.45, repeat:Infinity, ease:'easeInOut'},
            }}
            style={{willChange:'transform'}}>
            <svg width={h.size} height={h.size} viewBox="0 0 100 100" fill="none">
              {/* Three nested hex outlines — layered depth illusion */}
              <polygon points={HEX_PTS_OUTER} stroke={h.color} strokeWidth="0.9" opacity="0.32"/>
              <polygon points={HEX_PTS_MID}   stroke={h.color} strokeWidth="0.6" opacity="0.16"/>
              <polygon points={HEX_PTS_INNER}  stroke={h.color} strokeWidth="0.4" opacity="0.09"/>
              {/* Corner node dots — simulate attention heads */}
              {CORNER_PTS.map(([px,py],j) => (
                <circle key={j} cx={px} cy={py} r="1.8" fill={h.color} opacity="0.55"/>
              ))}
            </svg>
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────────
   ELEGANT PILL SHAPES
   ───────────────────────────────────────────────────── */
function ElegantShape({ width, height, rotate, gradient, className, delay=0, floatDur=20, floatAmp=9 }) {
  return (
    <motion.div
      initial={{opacity:0, y:-130, rotate:rotate-15}}
      animate={{opacity:1, y:0, rotate}}
      transition={{duration:2.8, delay, ease:[0.16,1,0.3,1], opacity:{duration:1.4}}}
      className={`absolute pointer-events-none ${className}`}
      style={{willChange:'transform,opacity'}}>
      <motion.div
        animate={{y:[0,-floatAmp,0]}}
        transition={{duration:floatDur, repeat:Infinity, ease:'easeInOut', delay}}
        style={{width, height, willChange:'transform'}}>
        <div style={{ width:'100%', height:'100%', borderRadius:9999,
          background:`linear-gradient(135deg,${gradient},transparent)`,
          border:'1.5px solid rgba(255,255,255,0.11)',
          boxShadow:`0 6px 30px 0 ${gradient}34` }}/>
      </motion.div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────
   VIGNETTE
   ───────────────────────────────────────────────────── */
function Vignette() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{zIndex:5}} aria-hidden="true">
      <div style={{ position:'absolute', inset:0,
        background:'radial-gradient(ellipse 85% 85% at 50% 50%, transparent 28%, rgba(11,11,20,0.72) 100%)' }}/>
    </div>
  )
}

/* ─────────────────────────────────────────────────────
   EXPORT
   ───────────────────────────────────────────────────── */
export default function AnimatedBackground() {
  return (
    <>
      <div style={{position:'fixed', inset:0, background:'#0B0B14', zIndex:-1}} aria-hidden="true"/>

      <AuroraCanvas/>
      <AuroraBlobs/>

      {/* Pill shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{zIndex:3}} aria-hidden="true">
        <ElegantShape delay={0.2}  width={820} height={160} rotate={12}  floatDur={22} floatAmp={8}  gradient="rgba(124,92,255,0.52)" className="left-[-12%] top-[12%]"/>
        <ElegantShape delay={0.4}  width={600} height={130} rotate={-14} floatDur={26} floatAmp={7}  gradient="rgba(63,207,142,0.43)"  className="right-[-6%] top-[62%]"/>
        <ElegantShape delay={0.3}  width={420} height={98}  rotate={-8}  floatDur={20} floatAmp={9}  gradient="rgba(167,139,250,0.40)" className="left-[4%] bottom-[8%]"/>
        <ElegantShape delay={0.55} width={280} height={70}  rotate={22}  floatDur={18} floatAmp={6}  gradient="rgba(245,166,35,0.36)"  className="right-[16%] top-[4%]"/>
        <ElegantShape delay={0.7}  width={200} height={52}  rotate={-28} floatDur={24} floatAmp={7}  gradient="rgba(124,92,255,0.36)"  className="left-[18%] top-[0%]"/>
        <ElegantShape delay={0.85} width={340} height={80}  rotate={9}   floatDur={21} floatAmp={8}  gradient="rgba(56,189,248,0.32)"  className="right-[2%] top-[32%]"/>
        <ElegantShape delay={1.0}  width={180} height={46}  rotate={-18} floatDur={19} floatAmp={6}  gradient="rgba(236,72,153,0.30)"  className="left-[38%] bottom-[3%]"/>
      </div>

      {/* Visual AI geometry — hexagonal rings (no text) */}
      <FloatingHexRings/>

      <DotGrid/>
      <Vignette/>

      {/* Subtle grid overlay */}
      <div style={{ position:'fixed', inset:0, zIndex:4, pointerEvents:'none', opacity:0.28,
        backgroundImage:'linear-gradient(rgba(124,92,255,0.038) 1px,transparent 1px),linear-gradient(90deg,rgba(124,92,255,0.038) 1px,transparent 1px)',
        backgroundSize:'44px 44px' }} aria-hidden="true"/>
    </>
  )
}
