import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../../api/client'
import Step1Personal from './Step1Personal'
import Step2Resume from './Step2Resume'
import Step3Verification from './Step3Verification'

const STEPS = ['Personal', 'Resume', 'Verify']

const slideVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 28 : -28 }),
  center: { opacity: 1, x: 0 },
  exit:  (dir) => ({ opacity: 0, x: dir > 0 ? -28 : 28 }),
}

export default function CandidateIntake() {
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [data, setData] = useState({})
  const [verificationResult, setVerificationResult] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const goNext = async (newData) => {
    const merged = { ...data, ...newData }
    setData(merged)

    // Step 2 → 3: submit to API
    if (step === 1) {
      setIsSubmitting(true)
      setSubmitError(null)
      try {
        const formData = new FormData()
        formData.append('name', merged.name)
        formData.append('email', merged.email)
        formData.append('resume', merged.file)

        const result = await api.submitCandidate(formData)
        setVerificationResult(result)
      } catch (e) {
        // If duplicate or other error, still go to step 3 with a synthetic result
        setVerificationResult({
          candidate_id: null,
          overall_status: 'review',
          checks: [
            { id: 'submit_error', label: 'Submission', result: 'review', detail: e.message, badge: e.message },
          ],
        })
      } finally {
        setIsSubmitting(false)
      }
    }

    setDir(1)
    setStep(s => s + 1)
  }

  const goBack = () => { setDir(-1); setStep(s => s - 1) }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 flex flex-col items-center">
      <div className="relative z-10 w-full max-w-md">

        {/* Progress stepper */}
        <div className="flex items-center mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <motion.div
                  animate={{
                    backgroundColor: i < step ? '#3FCF8E' : i === step ? '#7C5CFF' : 'transparent',
                    borderColor:      i < step ? '#3FCF8E' : i === step ? '#7C5CFF' : 'rgba(255,255,255,0.15)',
                    scale: i === step ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-mono-data font-bold"
                >
                  {i < step ? (
                    <svg className="w-3.5 h-3.5 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  ) : (
                    <span className={i === step ? 'text-white' : 'text-muted/50'}>{i + 1}</span>
                  )}
                </motion.div>
                <span className={`text-xs font-medium hidden sm:block transition-colors duration-200 ${i === step ? 'text-offwhite' : i < step ? 'text-signal-green' : 'text-muted/40'}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <motion.div
                  animate={{ backgroundColor: i < step ? '#3FCF8E' : 'rgba(255,255,255,0.07)' }}
                  transition={{ duration: 0.4 }}
                  className="flex-1 h-px mx-2"
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <motion.div
          className="glass-gradient-border rounded-2xl p-7 shadow-[0_8px_48px_rgba(0,0,0,0.5)]"
          layout
        >
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 0 && <Step1Personal onNext={goNext}/>}
              {step === 1 && (
                <Step2Resume
                  onNext={goNext}
                  onBack={goBack}
                  isSubmitting={isSubmitting}
                />
              )}
              {step === 2 && (
                <Step3Verification
                  data={data}
                  verificationResult={verificationResult}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <p className="text-center text-muted/30 text-xs mt-6">
          TalentRank AI · Consistency checks reflect submission accuracy, not candidate quality
        </p>
      </div>
    </div>
  )
}
