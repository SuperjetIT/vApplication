import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { SiteFooter } from '../components/SiteFooter'
import { useAuth } from '../context/AuthContext'
import './SignInPage.css'

const OTP_LENGTH = 6
const COUNTDOWN_START = 59

function maskEmail(email: string) {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  const visible = local.length <= 2 ? local[0] : `${local.slice(0, 2)}***`
  return `${visible}@${domain}`
}

export default function OtpVerifyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { verifyOtp, loginWithEmail, sendOtp, getPendingOtpEmail } = useAuth()

  const emailFromState = (location.state as { email?: string } | null)?.email
  const [email] = useState(() => emailFromState ?? getPendingOtpEmail() ?? '')
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [countdown, setCountdown] = useState(COUNTDOWN_START)
  const [canResend, setCanResend] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    if (!email) {
      navigate('/sign-in', { replace: true })
    }
  }, [email, navigate])

  useEffect(() => {
    if (canResend) return
    if (countdown <= 0) {
      setCanResend(true)
      return
    }
    const t = window.setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, canResend])

  const otpCode = digits.join('')

  const handleVerify = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault()
      setMessage(null)
      if (otpCode.length !== OTP_LENGTH) {
        setMessage({ type: 'error', text: 'Please enter the full 6-digit code.' })
        return
      }
      setLoading(true)
      try {
        const result = await verifyOtp(email, otpCode)
        if (!result.ok) {
          setMessage({
            type: 'error',
            text: result.error ?? 'Invalid or expired code. Try again or resend OTP.',
          })
          return
        }
        await loginWithEmail(email, result.user)
        setMessage({ type: 'success', text: 'Signed in successfully. Redirecting…' })
        window.setTimeout(() => navigate('/', { replace: true }), 600)
      } catch (err) {
        setMessage({
          type: 'error',
          text: err instanceof Error ? err.message : 'Could not load your profile.',
        })
      } finally {
        setLoading(false)
      }
    },
    [otpCode, email, verifyOtp, loginWithEmail, navigate],
  )

  const handleResend = async () => {
    setMessage(null)
    setResendLoading(true)
    try {
      await sendOtp(email)
      setDigits(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
      setCountdown(COUNTDOWN_START)
      setCanResend(false)
      setMessage({ type: 'success', text: 'A new 6-digit code has been sent to your email.' })
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not resend OTP. Please try again.',
      })
    } finally {
      setResendLoading(false)
    }
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
    if (e.key === 'Enter' && otpCode.length === OTP_LENGTH) {
      void handleVerify()
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

  if (!email) return null

  return (
    <div className="signin-shell signin-verify-shell">
      <Navbar
        activeTab="explore"
        setActiveTab={() => {}}
        isMobile={isMobile}
        showEvents={false}
      />

      <main className="signin-page signin-page--gradient">
        <div className="signin-layout">
          <section className="signin-card" aria-labelledby="otp-title">
          <div className="signin-card__mobile-brand">
            <span className="signin-brand__logo">supervisa</span>
          </div>
          <p className="signin-kicker">Verify your email</p>
          <h1 id="otp-title">Enter OTP</h1>
          <p className="signin-subtitle">
            We sent a 6-digit code to <strong>{maskEmail(email)}</strong>
          </p>

          {message && (
            <div
              className={`signin-alert signin-alert--${message.type}`}
              role="alert"
              aria-live="polite"
            >
              {message.text}
            </div>
          )}

          <form className="signin-form" onSubmit={handleVerify}>
            <div className="otp-inputs" onPaste={handlePaste}>
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
                  aria-label={`Digit ${i + 1}`}
                  className="otp-input"
                  disabled={loading}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <p className="otp-countdown" aria-live="polite">
              {canResend ? (
                <button
                  type="button"
                  className="otp-resend"
                  onClick={handleResend}
                  disabled={resendLoading}
                >
                  {resendLoading ? 'Sending…' : 'Resend OTP'}
                </button>
              ) : (
                <>
                  Resend available in <strong>{countdown}</strong>s
                </>
              )}
            </p>

            <button type="submit" className="signin-submit" disabled={loading || otpCode.length !== OTP_LENGTH}>
              {loading ? (
                <span className="signin-submit__inner">
                  <span className="signin-spinner" aria-hidden />
                  Verifying…
                </span>
              ) : (
                'Verify & Sign In'
              )}
            </button>
          </form>

          <p className="signin-footer-link">
            <Link to="/sign-in">← Use a different email</Link>
          </p>
        </section>
        </div>
      </main>
      <SiteFooter isMobile={isMobile} />
    </div>
  )
}
