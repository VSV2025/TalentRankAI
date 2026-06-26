import { useState } from 'react'
import { motion } from 'framer-motion'

export default function Step1Personal({ onNext }) {
  const [form, setForm] = useState({ name: '', email: '' })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Full name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onNext({ name: form.name.trim(), email: form.email.trim() })
  }

  return (
    <div>
      <p className="text-xs text-muted/60 uppercase tracking-widest font-medium mb-6">Step 1 of 3</p>
      <h2 className="font-display text-2xl font-bold text-offwhite mb-1">Who are you?</h2>
      <p className="text-muted text-sm mb-7">We use this to match your profile and send you status updates.</p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {[
          { id: 'name', label: 'Full name', type: 'text', placeholder: 'Ada Lovelace', autoComplete: 'name' },
          { id: 'email', label: 'Email address', type: 'email', placeholder: 'ada@example.com', autoComplete: 'email' },
        ].map(field => (
          <div key={field.id}>
            <label htmlFor={field.id} className="block text-sm font-medium text-offwhite/80 mb-1.5">{field.label}</label>
            <input
              id={field.id}
              type={field.type}
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              value={form[field.id]}
              onChange={e => { setForm(f => ({ ...f, [field.id]: e.target.value })); setErrors(er => ({ ...er, [field.id]: '' })) }}
              className={`w-full bg-ink-3/60 border rounded-xl px-4 py-3 text-offwhite placeholder:text-muted/50 outline-none transition-all duration-200 text-sm
                focus:bg-ink-3 focus:border-violet/60 focus:shadow-[0_0_0_3px_rgba(124,92,255,0.15),0_0_16px_rgba(124,92,255,0.1)]
                ${errors[field.id] ? 'border-signal-red/60 bg-signal-red/5' : 'border-white/[0.08] hover:border-white/[0.15]'}`}
            />
            {errors[field.id] && (
              <motion.p initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} className="mt-1.5 text-xs text-signal-red flex items-center gap-1.5">
                <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 8v4m0 4h.01"/>
                </svg>
                {errors[field.id]}
              </motion.p>
            )}
          </div>
        ))}

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full mt-2 bg-violet hover:bg-violet-dim text-white font-semibold py-3.5 rounded-xl transition-all duration-200 cursor-pointer shadow-violet-sm hover:shadow-violet-glow text-sm"
        >
          Continue
          <svg className="w-4 h-4 inline ml-2 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </motion.button>
      </form>
    </div>
  )
}
