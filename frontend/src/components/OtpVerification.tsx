import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

const OTP_LENGTH = 6
const COUNTDOWN_START = 59

function MailPulseIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2 7l10 7 10-7" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

function CountdownRing({ seconds, total }: { seconds: number; total: number }) {
  const r = 14
  const c = 2 * Math.PI * r
  const progress = seconds / total
  const offset = c * (1 - progress)
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden>
      <circle cx="18" cy="18" r={r} fill="none" stroke="#f3f4f6" strokeWidth="3" />
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke="#f93e42"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1s linear' }}
      />
    </svg>
  )
}

export type OtpVerificationProps = {
  maskedEmail: string
  loading?: boolean
  resendLoading?: boolean
  message?: { type: 'success' | 'error'; text: string } | null
  onVerify: (code: string) => void | Promise<void>
  onResend: () => void | Promise<void>
  footer?: ReactNode
  autoSubmit?: boolean
}

export function OtpVerification({
  maskedEmail,
  loading = false,
  resendLoading = false,
  message,
  onVerify,
  onResend,
  footer,
  autoSubmit = true,
}: OtpVerificationProps) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [countdown, setCountdown] = useState(COUNTDOWN_START)
  const [canResend, setCanResend] = useState(false)
  const [shake, setShake] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const prevErrorRef = useRef<string | null>(null)
  const autoSubmittedRef = useRef(false)

  const otpCode = digits.join('')

  useEffect(() => {
    if (canResend) return
    if (countdown <= 0) {
      setCanResend(true)
      return
    }
    const t = window.setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, canResend])

  useEffect(() => {
    if (message?.type === 'error' && message.text !== prevErrorRef.current) {
      prevErrorRef.current = message.text
      autoSubmittedRef.current = false
      setShake(true)
      const t = window.setTimeout(() => setShake(false), 500)
      return () => clearTimeout(t)
    }
    if (message?.type === 'success') {
      prevErrorRef.current = null
    }
  }, [message])

  const submit = useCallback(() => {
    if (otpCode.length === OTP_LENGTH && !loading) {
      void onVerify(otpCode)
    }
  }, [otpCode, loading, onVerify])

  useEffect(() => {
    if (!autoSubmit) return
    if (otpCode.length === OTP_LENGTH && !loading && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true
      submit()
    }
    if (otpCode.length < OTP_LENGTH) {
      autoSubmittedRef.current = false
    }
  }, [autoSubmit, otpCode, loading, submit])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    submit()
  }

  const handleResend = async () => {
    await onResend()
    setDigits(Array(OTP_LENGTH).fill(''))
    inputRefs.current[0]?.focus()
    setCountdown(COUNTDOWN_START)
    setCanResend(false)
    prevErrorRef.current = null
    autoSubmittedRef.current = false
  }

  const setDigit = (index: number, value: string) => {
    const v = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = v
    setDigits(next)
    if (v && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'Enter') {
      submit()
    }
  }

  const handlePaste = (e: ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    e.preventDefault()
    const next = Array(OTP_LENGTH).fill('')
    pasted.split('').forEach((ch, i) => {
      next[i] = ch
    })
    setDigits(next)
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1)
    inputRefs.current[focusIdx]?.focus()
  }

  return (
    <div className="otp-v2-card">
      <header className="otp-v2-header">
        <div className="otp-v2-icon-wrap">
          <span className="otp-v2-icon-ring" />
          <span className="otp-v2-icon-ring otp-v2-icon-ring--2" />
          <div className="otp-v2-icon">
            <MailPulseIcon />
          </div>
        </div>
        <p className="otp-v2-kicker">Secure verification</p>
        <h1 className="otp-v2-title">Enter your code</h1>
        <p className="otp-v2-subtitle">
          We sent a 6-digit code to <strong>{maskedEmail}</strong>
        </p>
      </header>

      {message && (
        <div
          className={`otp-v2-alert otp-v2-alert--${message.type}`}
          role="alert"
          aria-live="polite"
        >
          {message.text}
        </div>
      )}

      <form className="otp-v2-form" onSubmit={handleSubmit}>
        <div
          className={`otp-v2-digits${shake ? ' otp-v2-digits--shake' : ''}`}
          onPaste={handlePaste}
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el
              }}
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              value={d}
              aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
              className={`otp-v2-digit${d ? ' otp-v2-digit--filled' : ''}`}
              disabled={loading}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
              autoFocus={i === 0}
            />
          ))}
        </div>

        <div className="otp-v2-resend-row">
          {canResend ? (
            <button
              type="button"
              className="otp-v2-resend-btn"
              onClick={() => void handleResend()}
              disabled={resendLoading || loading}
            >
              {resendLoading ? 'Sending new code…' : 'Resend code'}
            </button>
          ) : (
            <div className="otp-v2-timer" aria-live="polite">
              <CountdownRing seconds={countdown} total={COUNTDOWN_START} />
              <span>
                Resend in <strong>{countdown}s</strong>
              </span>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="otp-v2-submit"
          disabled={loading || otpCode.length !== OTP_LENGTH}
        >
          {loading ? (
            <span className="otp-v2-submit__inner">
              <span className="otp-v2-spinner" aria-hidden />
              Verifying…
            </span>
          ) : (
            'Verify & continue'
          )}
        </button>
      </form>

      {footer && <div className="otp-v2-footer">{footer}</div>}

      <p className="otp-v2-secure">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        Your code expires in 10 minutes
      </p>
    </div>
  )
}
