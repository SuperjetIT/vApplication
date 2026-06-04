import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import './SignInPage.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function ShieldBrand() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"
        stroke="#f93e42"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke="#f93e42" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="signin-field__icon">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="#9ca3af" strokeWidth="1.5" />
      <path d="M3 7l9 6 9-6" stroke="#9ca3af" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

export default function SignInPage() {
  const navigate = useNavigate()
  const { sendOtp, isLoggedIn } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (isLoggedIn) navigate('/', { replace: true })
  }, [isLoggedIn, navigate])

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

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
    } catch (err) {
      setMessage({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'Something went wrong. Please try again.',
      })
      setLoading(false)
    }
  }

  return (
    <div className="signin-shell">
      <Navbar
        activeTab="explore"
        setActiveTab={() => {}}
        isMobile={isMobile}
        showEvents={false}
      />

      <main className="signin-page signin-page--gradient">
        <div className="signin-layout">
          <aside className="signin-hero" aria-hidden={isMobile}>
            <div className="signin-hero__blob signin-hero__blob--1" />
            <div className="signin-hero__blob signin-hero__blob--2" />
            <div className="signin-hero__content">
              <div className="signin-hero__brand">
                <span className="signin-hero__logo">supervisa</span>
                <ShieldBrand />
              </div>
              <h2 className="signin-hero__title">
                Visas. Delivered <span>On Time</span>.
              </h2>
              <p className="signin-hero__text">
                120+ destinations for UAE residents. Sign in with a secure one-time code — no
                password required.
              </p>
              <ul className="signin-hero__list">
                <li>Instant OTP to your inbox</li>
                <li>Visa guaranteed on time</li>
                <li>Track applications in one place</li>
              </ul>
            </div>
          </aside>

          <section className="signin-card" aria-labelledby="signin-title">
            <div className="signin-card__mobile-brand">
              <span className="signin-brand__logo">supervisa</span>
              <ShieldBrand />
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
                <div className="signin-field__wrap">
                  <MailIcon />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
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

            <p className="signin-footer-link">
              <Link to="/">← Back to home</Link>
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
