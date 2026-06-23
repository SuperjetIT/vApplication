import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AGENT_BASE_PATH } from '../../config/portalRoutes'
import {
  AGENT_ACCENT,
  AGENT_BORDER,
  AGENT_ERROR,
  AGENT_GRADIENTS,
  AGENT_LOGO_RED,
  AGENT_MUTED,
} from '../../theme/agentTheme'
import { Database } from '../../database/db'
import {
  clearLoginAttempts,
  formatLockoutRemaining,
  getLoginLockState,
  recordFailedLogin,
} from '../../utils/adminLoginSecurity'
import { setAgentSession } from '../../utils/agentSession'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: `1px solid ${AGENT_BORDER}`,
  fontSize: 14,
  boxSizing: 'border-box',
}

export default function AgentLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [locked, setLocked] = useState(false)
  const [lockRemaining, setLockRemaining] = useState(0)
  const [attemptsLeft, setAttemptsLeft] = useState(5)

  const refreshLockState = () => {
    const state = getLoginLockState()
    setLocked(state.locked)
    setLockRemaining(state.remainingMs)
    setAttemptsLeft(5 - state.attempts)
  }

  useEffect(() => {
    refreshLockState()
    if (!locked) return
    const t = window.setInterval(refreshLockState, 1000)
    return () => window.clearInterval(t)
  }, [locked])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    refreshLockState()
    const lockState = getLoginLockState()
    if (lockState.locked) {
      setError(`Too many attempts. Try again in ${formatLockoutRemaining(lockState.remainingMs)}.`)
      return
    }

    const partner = Database.getPartnerByCredentials(email.trim(), password)
    if (partner && String(partner.status).toLowerCase() === 'active') {
      clearLoginAttempts()
      setAgentSession(String(partner.id))
      navigate(AGENT_BASE_PATH)
      return
    }

    const attempt = recordFailedLogin()
    setLocked(attempt.locked)
    setLockRemaining(attempt.remainingMs)
    setAttemptsLeft(attempt.attemptsLeft)
    setShake(true)
    window.setTimeout(() => setShake(false), 500)

    if (partner && String(partner.status).toLowerCase() !== 'active') {
      setError('Your account is pending approval. Contact your administrator.')
    } else if (attempt.locked) {
      setError(`Account locked for ${formatLockoutRemaining(attempt.remainingMs)} after too many failed attempts.`)
    } else {
      setError(`Invalid credentials. ${attempt.attemptsLeft} attempt${attempt.attemptsLeft === 1 ? '' : 's'} remaining.`)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4f8 0%, #eff6ff 50%, #f8fafc 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
      <div aria-hidden style={{ position: 'absolute', width: 400, height: 400, top: -100, left: -100, borderRadius: '50%', background: 'rgba(37,99,235,0.06)', filter: 'blur(60px)' }} />
      <div aria-hidden style={{ position: 'absolute', width: 300, height: 300, bottom: -50, right: -50, borderRadius: '50%', background: 'rgba(249,62,66,0.05)', filter: 'blur(60px)' }} />

      <div style={{ position: 'relative', zIndex: 1, background: '#fff', borderRadius: 28, maxWidth: 420, width: '100%', boxShadow: '0 24px 64px rgba(37,99,235,0.08)', border: `1px solid ${AGENT_BORDER}`, overflow: 'hidden', animation: shake ? 'shake 0.5s' : 'none' }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${AGENT_LOGO_RED}, ${AGENT_ACCENT})` }} />
        <div style={{ padding: '36px 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: AGENT_GRADIENTS.logo, boxShadow: '0 4px 12px rgba(249,62,66,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14, margin: '0 auto 12px' }}>SJ</div>
            <div style={{ fontWeight: 800, fontSize: 20, color: AGENT_LOGO_RED, fontStyle: 'italic' }}>Superjet Global</div>
            <p style={{ margin: '4px 0 0', color: AGENT_MUTED, fontSize: 14 }}>B2B Partner Portal</p>
          </div>

          {locked && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 13, color: AGENT_ERROR, textAlign: 'center' }}>
              🔒 Locked — try again in {formatLockoutRemaining(lockRemaining)}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label style={{ display: 'block', fontSize: 13, color: AGENT_MUTED, marginBottom: 6, fontWeight: 500 }}>Email or Username</label>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={AGENT_MUTED} strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
              <input type="text" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} disabled={locked} autoComplete="username" style={{ ...inputStyle, paddingLeft: 44, border: error ? '1px solid #fca5a5' : inputStyle.border, opacity: locked ? 0.6 : 1 }} placeholder="Enter email or username" />
            </div>
            <label style={{ display: 'block', fontSize: 13, color: AGENT_MUTED, marginBottom: 6, fontWeight: 500 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={AGENT_MUTED} strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); setError('') }} disabled={locked} autoComplete="current-password" placeholder="Enter your password" style={{ ...inputStyle, paddingLeft: 44, paddingRight: 44, border: error ? '1px solid #fca5a5' : inputStyle.border, opacity: locked ? 0.6 : 1 }} />
              <button type="button" onClick={() => setShowPassword((s) => !s)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: AGENT_MUTED }}>{showPassword ? '🙈' : '👁'}</button>
            </div>
            {error && <p style={{ margin: '8px 0 0', color: AGENT_ERROR, fontSize: 13 }}>{error}</p>}
            {!locked && !error && attemptsLeft < 5 && (
              <p style={{ margin: '8px 0 0', color: AGENT_MUTED, fontSize: 12 }}>{attemptsLeft} attempt{attemptsLeft === 1 ? '' : 's'} remaining before lockout</p>
            )}
            <button type="submit" disabled={locked} style={{ width: '100%', background: locked ? '#e8ecf0' : AGENT_GRADIENTS.welcomeShimmer, backgroundSize: '200% 200%', color: locked ? AGENT_MUTED : '#fff', border: 'none', borderRadius: 12, padding: 14, fontWeight: 700, fontSize: 14, marginTop: 20, cursor: locked ? 'not-allowed' : 'pointer', boxShadow: locked ? 'none' : '0 8px 24px rgba(37,99,235,0.35)' }}>Sign In</button>
          </form>

          <p style={{ color: AGENT_MUTED, fontSize: 12, textAlign: 'center', marginTop: 20, marginBottom: 0 }}>
            Don&apos;t have an account?{' '}
            <Link to="/agent/register" style={{ color: AGENT_ACCENT, fontWeight: 600, textDecoration: 'none' }}>Apply to become a partner</Link>
          </p>
          <p style={{ color: AGENT_MUTED, fontSize: 12, textAlign: 'center', marginTop: 16, marginBottom: 0 }}>🔒 Secure partner access</p>
        </div>
      </div>
    </div>
  )
}
