import { useNavigate } from 'react-router-dom'
import { flagUrl } from '../utils/flags'
import {
  LAST_LOGIN_EMAIL_KEY,
  REDIRECT_AFTER_LOGIN_KEY,
  SIGNIN_PREFILL_EMAIL_KEY,
} from '../utils/authGate'

const BRAND = '#f93e42'

type AuthGateModalProps = {
  isOpen: boolean
  onClose: () => void
  destinationCountry: string
  countryFlag: string
  visaOption: string
  applyUrl: string
}

const WHY_ROWS = [
  { emoji: '📋', text: 'Track your application status anytime' },
  { emoji: '📄', text: 'Securely store your uploaded documents' },
  { emoji: '🔔', text: 'Get WhatsApp + email updates on your visa' },
] as const

function LockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="#fff" strokeWidth="1.5" />
      <path d="M8 11V7a4 4 0 118 0v4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="#fff" strokeWidth="1.5" />
      <path d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="#fff" strokeWidth="1.5" />
    </svg>
  )
}

export function AuthGateModal({
  isOpen,
  onClose,
  destinationCountry,
  countryFlag,
  visaOption,
  applyUrl,
}: AuthGateModalProps) {
  const navigate = useNavigate()

  if (!isOpen) return null

  const savedEmail = localStorage.getItem(LAST_LOGIN_EMAIL_KEY)

  const goSignIn = () => {
    localStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, applyUrl)
    navigate('/sign-in')
  }

  const continueAsUser = () => {
    if (!savedEmail) return
    localStorage.setItem(SIGNIN_PREFILL_EMAIL_KEY, savedEmail)
    localStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, applyUrl)
    navigate('/sign-in')
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-gate-title"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          background: '#fff',
          borderRadius: 24,
          padding: 0,
          maxWidth: 480,
          width: '90%',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #1a1a2e, #f93e42)',
            padding: '24px 28px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              top: -60,
              right: -60,
            }}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: 18,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <img
                  src={flagUrl(countryFlag, 80)}
                  alt=""
                  width={40}
                  height={28}
                  style={{ borderRadius: 4, objectFit: 'cover' }}
                />
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>
                  {destinationCountry} Visa
                </span>
              </div>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{visaOption}</p>
            </div>
            <LockIcon />
          </div>
        </div>

        <div style={{ padding: 28 }}>
          {savedEmail && (
            <div
              style={{
                background: '#f8f9fc',
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 20,
              }}
            >
              <p style={{ margin: '0 0 4px', fontSize: 12, color: '#64748b' }}>Welcome back!</p>
              <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#1a1a2e', fontSize: 14 }}>
                {savedEmail}
              </p>
              <button
                type="button"
                onClick={continueAsUser}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: BRAND,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Continue as this user?
              </button>
            </div>
          )}

          <h2
            id="auth-gate-title"
            style={{ margin: 0, fontWeight: 700, fontSize: 20, color: '#1a1a2e' }}
          >
            Sign in to continue your application
          </h2>
          <p
            style={{
              margin: '6px 0 0',
              color: '#64748b',
              fontSize: 14,
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            We need your details to process your visa application and keep you updated.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {WHY_ROWS.map((row) => (
              <div
                key={row.text}
                style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: '#475569' }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#f8f9fc',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 14,
                  }}
                >
                  {row.emoji}
                </span>
                {row.text}
              </div>
            ))}
          </div>

          <div style={{ height: 1, background: '#f0f0f0', margin: '20px 0' }} />

          <button
            type="button"
            onClick={() => goSignIn()}
            style={{
              background: BRAND,
              color: '#fff',
              borderRadius: 12,
              padding: '14px 24px',
              width: '100%',
              fontSize: 15,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <PersonIcon />
            Sign In to Continue
          </button>

          <p
            style={{
              margin: '16px 0 0',
              color: '#94a3b8',
              fontSize: 11,
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}
