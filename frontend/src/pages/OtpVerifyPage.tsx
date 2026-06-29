import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { OtpVerification } from '../components/OtpVerification'
import { SiteFooter } from '../components/SiteFooter'
import { useAuth } from '../context/AuthContext'
import { useCitizenship } from '../context/CitizenshipContext'
import { Database } from '../database/db'
import { consumeRedirectUrl, peekRedirectUrl } from '../utils/authGate'
import {
  clearLoginAttempts,
  formatLockoutRemaining,
  getLoginLockState,
  recordFailedLogin,
} from '../utils/adminLoginSecurity'
import './SignInPage.css'
import './OtpVerifyPage.css'

function maskEmail(email: string) {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  const visible = local.length <= 2 ? local[0] : `${local.slice(0, 2)}***`
  return `${visible}@${domain}`
}

export default function OtpVerifyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { verifyOtp, sendOtp, getPendingOtpEmail, loginWithEmail } = useAuth()
  const { citizenship, residenceCountry, residencyStatus } = useCitizenship()

  const locationState = location.state as { email?: string; fullName?: string } | null
  const emailFromState = locationState?.email
  const fullNameFromState = locationState?.fullName
  const [email] = useState(() => emailFromState ?? getPendingOtpEmail() ?? '')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

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
    const lock = getLoginLockState()
    if (lock.locked) {
      setMessage({
        type: 'error',
        text: `Account locked. Try again in ${formatLockoutRemaining(lock.remainingMs)}.`,
      })
    }
  }, [])

  const handleVerify = useCallback(
    async (otpCode: string) => {
      setMessage(null)
      const lockState = getLoginLockState()
      if (lockState.locked) {
        setMessage({
          type: 'error',
          text: `Account locked. Try again in ${formatLockoutRemaining(lockState.remainingMs)}.`,
        })
        return
      }
      setLoading(true)
      try {
        const result = await verifyOtp(email, otpCode)
        if (!result.ok) {
          const attempt = recordFailedLogin()
          if (attempt.locked) {
            setMessage({
              type: 'error',
              text: `Too many failed attempts. Please wait ${formatLockoutRemaining(attempt.remainingMs)}.`,
            })
          } else {
            setMessage({
              type: 'error',
              text: result.error ?? 'Invalid or expired code. Try again or resend.',
            })
          }
          return
        }

        clearLoginAttempts()
        const normalizedEmail = email.trim().toLowerCase()
        const existingUser = Database.getUserByEmail(normalizedEmail)

        if (!existingUser) {
          Database.createUser({
            fullName: fullNameFromState?.trim() || result.user?.fullName || '',
            email: normalizedEmail,
            phone: '',
            phoneCode: '+971',
            passportCountry: citizenship || '',
            residenceCountry: residenceCountry || '',
            residencyStatus: residencyStatus || 'Resident',
            isVerified: true,
            registrationMethod: 'passwordless',
            registrationSource: 'sign_in',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            walletBalance: 0,
          })
          Database.logActivity(
            'b2c_user_registered',
            `New B2C user registered (passwordless) — ${normalizedEmail}`,
            undefined,
            String(Database.getUserByEmail(normalizedEmail)?.id ?? ''),
            'customer',
          )
        } else {
          Database.updateUser(String(existingUser.id), {
            lastLogin: new Date().toISOString(),
            isVerified: true,
            ...(fullNameFromState?.trim() ? { fullName: fullNameFromState.trim() } : {}),
          })
        }

        await loginWithEmail(normalizedEmail, result.user, result.serverMeta)

        setMessage({ type: 'success', text: 'Verified! Taking you to your account…' })
        const redirectUrl = peekRedirectUrl()
        window.setTimeout(() => {
          navigate(redirectUrl ? consumeRedirectUrl()! : '/user/me', { replace: true })
        }, 700)
      } catch (err) {
        setMessage({
          type: 'error',
          text: err instanceof Error ? err.message : 'Could not load your profile.',
        })
      } finally {
        setLoading(false)
      }
    },
    [email, verifyOtp, loginWithEmail, fullNameFromState, navigate, citizenship, residenceCountry, residencyStatus],
  )

  const handleResend = useCallback(async () => {
    setMessage(null)
    setResendLoading(true)
    try {
      await sendOtp(email)
      setMessage({ type: 'success', text: 'A fresh 6-digit code was sent to your email.' })
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not resend code. Please try again.',
      })
    } finally {
      setResendLoading(false)
    }
  }, [email, sendOtp])

  if (!email) return null

  return (
    <div className="signin-shell signin-verify-shell">
      <Navbar activeTab="explore" setActiveTab={() => {}} isMobile={isMobile} />

      <main className="signin-page signin-page--gradient otp-v2-page">
        <div className="otp-v2-blob otp-v2-blob--1" aria-hidden />
        <div className="otp-v2-blob otp-v2-blob--2" aria-hidden />

        <div className="otp-v2-layout">
          <div className="signin-card__mobile-brand" style={{ justifyContent: 'center', marginBottom: 20 }}>
            <span className="signin-brand__logo">Superjet Global</span>
          </div>

          <OtpVerification
            maskedEmail={maskEmail(email)}
            loading={loading}
            resendLoading={resendLoading}
            message={message}
            onVerify={handleVerify}
            onResend={handleResend}
            autoSubmit
            footer={<Link to="/sign-in">← Use a different email</Link>}
          />
        </div>
      </main>

      <SiteFooter isMobile={isMobile} />
    </div>
  )
}
