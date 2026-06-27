import { motion } from 'framer-motion'

export default function ScoreBar({ label, value, delay = 0 }) {
  const color = value >= 90 ? '#3FCF8E' : value >= 80 ? '#7C5CFF' : value >= 70 ? '#6EA8FE' : '#F5A623'
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-slate-300">{label}</span>
        <span className="text-sm font-mono-data font-semibold" style={{ color }}>{value}</span>
      </div>
      <div className="h-1.5 bg-ink-4/80 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}66` }}
        />
      </div>
    </div>
  )
}
