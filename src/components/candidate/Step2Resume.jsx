import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/octet-stream', // some OSes report this for .docx
])
const ALLOWED_EXT = new Set(['.pdf', '.docx', '.doc'])
const MAX_MB = 10

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Step2Resume({ onNext, onBack, isSubmitting = false }) {
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef()

  const validate = (f) => {
    const ext = '.' + (f.name.split('.').pop() || '').toLowerCase()
    const mimeOk = ALLOWED_MIME.has(f.type)
    const extOk  = ALLOWED_EXT.has(ext)
    if (!mimeOk && !extOk) return 'Only PDF or DOCX files are accepted.'
    if (f.size > MAX_MB * 1024 * 1024) return `File must be under ${MAX_MB} MB.`
    return ''
  }

  const handleFile = (f) => {
    const err = validate(f)
    if (err) { setError(err); return }
    setError(''); setFile(f)
  }

  const ext = file ? file.name.split('.').pop().toUpperCase() : ''

  return (
    <div>
      <p className="text-xs text-muted/60 uppercase tracking-widest font-medium mb-6">Step 2 of 3</p>
      <h2 className="font-display text-2xl font-bold text-offwhite mb-1">Upload your resume</h2>
      <p className="text-muted text-sm mb-7">PDF or DOCX only · max 10 MB · We extract skills and career history automatically.</p>

      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            onClick={() => inputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-250 overflow-hidden
              ${dragOver ? 'border-violet bg-violet/[0.07] shadow-[0_0_0_3px_rgba(124,92,255,0.15),inset_0_0_32px_rgba(124,92,255,0.05)]' : 'border-white/10 bg-ink-3/40 hover:border-violet/40 hover:bg-ink-3/70'}`}
          >
            <input ref={inputRef} type="file" accept=".pdf,.docx" className="sr-only" onChange={e => { const f = e.target.files[0]; if (f) handleFile(f) }} aria-label="Upload resume"/>

            {/* Animated upload icon */}
            <motion.div
              animate={dragOver ? { scale: 1.15, rotate: [-2, 2, -2, 0] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200 ${dragOver ? 'bg-violet/20 shadow-violet-sm' : 'bg-ink-4'}`}
            >
              <svg className={`w-7 h-7 transition-colors duration-200 ${dragOver ? 'text-violet' : 'text-muted'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4l4 4"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h16" opacity="0.5"/>
              </svg>
            </motion.div>

            <div className="text-center">
              <p className="text-offwhite font-semibold">
                {dragOver ? 'Drop to upload' : 'Drag & drop your resume'}
              </p>
              <p className="text-muted text-sm mt-1">
                or <span className="text-violet font-medium underline underline-offset-2">browse files</span>
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted/50">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
                PDF
              </span>
              <span className="w-px h-3 bg-white/10"/>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
                DOCX
              </span>
              <span className="w-px h-3 bg-white/10"/>
              <span>max 10 MB</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="file-uploaded"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22,1,0.36,1] }}
            className="bg-ink-3/60 border border-signal-green/20 rounded-2xl p-5 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-violet/10 border border-violet/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-mono-data font-bold text-violet">{ext}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-offwhite font-semibold text-sm truncate">{file.name}</p>
              <p className="text-muted text-xs mt-0.5">{formatSize(file.size)}</p>
            </div>
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="w-7 h-7 rounded-full bg-signal-green/15 border border-signal-green/30 flex items-center justify-center"
              >
                <svg className="w-3.5 h-3.5 text-signal-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </motion.div>
              <button
                onClick={() => setFile(null)}
                className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center text-muted hover:text-signal-red hover:border-signal-red/30 transition-all duration-150 cursor-pointer"
                aria-label="Remove file"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
            className="mt-3 flex items-center gap-2 text-signal-red text-sm bg-signal-red/[0.08] border border-signal-red/20 rounded-xl px-4 py-3"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 8v4m0 4h.01"/>
            </svg>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3 mt-7">
        <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
          onClick={onBack}
          className="flex-1 border border-white/10 hover:border-white/20 text-muted hover:text-offwhite font-medium py-3 rounded-xl transition-all duration-200 cursor-pointer text-sm"
        >
          <svg className="w-4 h-4 inline mr-1.5 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Back
        </motion.button>
        <motion.button whileHover={{ scale: file && !isSubmitting ? 1.01 : 1 }} whileTap={{ scale: file && !isSubmitting ? 0.98 : 1 }}
          onClick={() => file && !isSubmitting && onNext({ file })}
          disabled={!file || isSubmitting}
          className="flex-[2] bg-violet hover:bg-violet-dim disabled:opacity-35 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 cursor-pointer shadow-violet-sm hover:shadow-violet-glow text-sm"
        >
          {isSubmitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-2"/>
              Uploading…
            </>
          ) : (
            <>
              Continue
              <svg className="w-4 h-4 inline ml-2 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </>
          )}
        </motion.button>
      </div>
    </div>
  )
}
