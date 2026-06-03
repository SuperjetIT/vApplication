import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { SiteLayout } from '../components/SiteLayout'
import { useAuth } from '../context/AuthContext'
import './SignInPage.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function SignInPage() {
  const navigate = useNavigate()
  const { sendOtp, isLoggedIn } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (isLoggedIn) navigate('/', { replace: true })
  }, [isLoggedIn, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setMessage(null)
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) {
      setMessage({ type: 'error', text: 'Please enter your email address.' })
      return
    }
    if (!EMAIL_RE.test(trimmed)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' })
      return
    }
    setLoading(true)
    try {
      await sendOtp(trimmed)
      setMessage({ type: 'success', text: '6-digit OTP sent! Check your inbox.' })
      window.setTimeout(() => {
        navigate('/sign-in/verify', { state: { email: trimmed } })
      }, 400)
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' })
      setLoading(false)
    }
  }

  return (
    <SiteLayout>
      <main className="signin-page signin-page--gradient">
        <section className="signin-card" aria-labelledby="signin-title">
          <div className="signin-brand">
            <span className="signin-brand__logo">supervisa</span>
          </div>
          <p className="signin-kicker">Passwordless sign in</p>
          <h1 id="signin-title">Continue with email</h1>
          <p className="signin-subtitle">
            We&apos;ll send a one-time code to verify your identity. No password needed.
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

          <form className="signin-form" onSubmit={handleSubmit} noValidate>
            <label className="signin-field">
              <span>Email Address</span>
              <input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </label>

            <button type="submit" className="signin-submit" disabled={loading}>
              {loading ? (
                <span className="signin-submit__inner">
                  <span className="signin-spinner" aria-hidden />
                  Sending OTP…
                </span>
              ) : (
                'Continue'
              )}
            </button>
          </form>
        </section>
      </main>
    </SiteLayout>
  )
}
