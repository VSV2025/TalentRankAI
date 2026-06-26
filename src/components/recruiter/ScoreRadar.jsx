import { motion } from 'framer-motion'

const EXPO = [0.16, 1, 0.3, 1]

const AXES = [
  { key: 'skillsMatch',       label: 'Skills',    color: '#7C5CFF' },
  { key: 'semanticRelevance', label: 'Semantic',  color: '#3FCF8E' },
  { key: 'behavioralSignal',  label: 'Behavior',  color: '#A78BFA' },
  { key: 'careerTrajectory',  label: 'Career',    color: '#F5A623' },
  { key: 'graphFit',          label: 'Graph Fit', color: '#38BDF8' },
  { key: 'skillBreadth',      label: 'Breadth',   color: '#EC4899' },
]

function polarToXY(angleDeg, r, cx, cy) {
  const rad = (angleDeg - 90) * (Math.PI / 180)
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

export default function ScoreRadar({ scores, graphFitScore, skillBreadthScore, size = 200, animated = true }) {
  const cx = size / 2
  const cy = size / 2
  const maxR = size * 0.38
  const n = AXES.length
  const angleStep = 360 / n

  const values = {
    skillsMatch:       (scores?.skillsMatch       ?? 50) / 100,
    semanticRelevance: (scores?.semanticRelevance ?? 50) / 100,
    behavioralSignal:  (scores?.behavioralSignal  ?? 50) / 100,
    careerTrajectory:  (scores?.careerTrajectory  ?? 50) / 100,
    graphFit:          (graphFitScore ?? 50) / 100,
    skillBreadth:      (skillBreadthScore ?? 50) / 100,
  }

  const dataPoints = AXES.map((ax, i) => {
    const angle = i * angleStep
    const r = values[ax.key] * maxR
    return polarToXY(angle, r, cx, cy)
  })

  const gridLevels = [0.25, 0.5, 0.75, 1.0]

  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

  const axisEndPoints = AXES.map((_, i) => polarToXY(i * angleStep, maxR, cx, cy))

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      {/* Grid rings */}
      {gridLevels.map((level, li) => {
        const pts = AXES.map((_, i) => polarToXY(i * angleStep, level * maxR, cx, cy))
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
        return (
          <path
            key={li}
            d={d}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={0.8}
          />
        )
      })}

      {/* Axis lines */}
      {axisEndPoints.map((pt, i) => (
        <line
          key={i}
          x1={cx} y1={cy}
          x2={pt.x} y2={pt.y}
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={0.8}
        />
      ))}

      {/* Data polygon fill */}
      <motion.path
        d={dataPath}
        fill="rgba(124,92,255,0.12)"
        stroke="rgba(124,92,255,0.5)"
        strokeWidth={1.5}
        initial={animated ? { opacity: 0, scale: 0.3 } : undefined}
        animate={animated ? { opacity: 1, scale: 1 } : undefined}
        transition={{ duration: 0.8, ease: EXPO, delay: 0.1 }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />

      {/* Data points */}
      {dataPoints.map((pt, i) => (
        <motion.circle
          key={i}
          cx={pt.x} cy={pt.y} r={2.8}
          fill={AXES[i].color}
          initial={animated ? { opacity: 0, scale: 0 } : undefined}
          animate={animated ? { opacity: 1, scale: 1 } : undefined}
          transition={{ delay: 0.4 + i * 0.06, type: 'spring', stiffness: 280, damping: 22 }}
          style={{ filter: `drop-shadow(0 0 4px ${AXES[i].color})` }}
        />
      ))}

      {/* Axis labels */}
      {AXES.map((ax, i) => {
        const labelPt = polarToXY(i * angleStep, maxR + 18, cx, cy)
        const textAnchor =
          labelPt.x < cx - 2 ? 'end' :
          labelPt.x > cx + 2 ? 'start' : 'middle'
        return (
          <text
            key={i}
            x={labelPt.x}
            y={labelPt.y}
            textAnchor={textAnchor}
            dominantBaseline="middle"
            fill={AXES[i].color}
            fontSize={9}
            fontFamily="JetBrains Mono, monospace"
            fontWeight={600}
            opacity={0.82}
          >
            {ax.label}
          </text>
        )
      })}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={2} fill="rgba(255,255,255,0.15)" />
    </svg>
  )
}
