import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND, BORDER, DANGER, inputStyle, TEXT_MUTED, TEXT_PRIMARY } from '../../components/admin/adminTheme'
import {
  clearLoginAttempts,
  formatLockoutRemaining,
  getLoginLockState,
  recordFailedLogin,
} from '../../utils/adminLoginSecurity'

const ADMIN_EMAIL = 'admin@superjetglobal.com'
const ADMIN_PASSWORD = 'demoadminsjt'

export default function AdminLoginPage() {
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

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      clearLoginAttempts()
      localStorage.setItem('admin_logged_in', 'true')
      localStorage.setItem('admin_user', JSON.stringify({ name: 'Super Admin', email: ADMIN_EMAIL, role: 'admin' }))
      navigate('/admin')
      return
    }

    const result = recordFailedLogin()
    setLocked(result.locked)
    setLockRemaining(result.remainingMs)
    setAttemptsLeft(result.attemptsLeft)
    setShake(true)
    window.setTimeout(() => setShake(false), 500)

    if (result.locked) {
      setError(`Account locked for ${formatLockoutRemaining(result.remainingMs)} after too many failed attempts.`)
    } else {
      setError(`Invalid credentials. ${result.attemptsLeft} attempt${result.attemptsLeft === 1 ? '' : 's'} remaining.`)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8f9fc 0%, #f0f4ff 50%, #fff5f5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
      <div aria-hidden style={{ position: 'absolute', width: 400, height: 400, top: -100, left: -100, borderRadius: '50%', background: 'rgba(249,62,66,0.06)', filter: 'blur(60px)' }} />
      <div aria-hidden style={{ position: 'absolute', width: 300, height: 300, bottom: -50, right: -50, borderRadius: '50%', background: 'rgba(80,87,234,0.05)', filter: 'blur(60px)' }} />
      <div aria-hidden style={{ position: 'absolute', width: 350, height: 350, top: '40%', left: '60%', borderRadius: '50%', background: 'rgba(34,197,94,0.04)', filter: 'blur(60px)' }} />

      <div style={{ position: 'relative', zIndex: 1, background: '#fff', borderRadius: 28, maxWidth: 420, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.08)', border: `1px solid ${BORDER}`, overflow: 'hidden', animation: shake ? 'shake 0.5s' : 'none' }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${BRAND}, #5057ea)` }} />
        <div style={{ padding: 48 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #f93e42, #ff6b6b)', boxShadow: '0 4px 12px rgba(249,62,66,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18, margin: '0 auto 12px' }}>SV</div>
            <div style={{ fontWeight: 800, fontSize: 24, color: TEXT_PRIMARY }}>Super Visa</div>
            <p style={{ margin: '4px 0 0', color: TEXT_MUTED, fontSize: 14 }}>Admin Portal</p>
          </div>

          {locked && (
            <div style={{ background: '#fff0f0', border: '1px solid #fca5a5', borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 13, color: DANGER, textAlign: 'center' }}>
              🔒 Locked — try again in {formatLockoutRemaining(lockRemaining)}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label style={{ display: 'block', fontSize: 13, color: TEXT_MUTED, marginBottom: 6, fontWeight: 500 }}>Email Address</label>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
              <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} disabled={locked} style={{ ...inputStyle, width: '100%', paddingLeft: 44, border: error ? '1px solid #fca5a5' : inputStyle.border, opacity: locked ? 0.6 : 1 }} placeholder="admin@superjetglobal.com" />
            </div>
            <label style={{ display: 'block', fontSize: 13, color: TEXT_MUTED, marginBottom: 6, fontWeight: 500 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); setError('') }} disabled={locked} style={{ ...inputStyle, width: '100%', paddingLeft: 44, paddingRight: 44, border: error ? '1px solid #fca5a5' : inputStyle.border, opacity: locked ? 0.6 : 1 }} />
              <button type="button" onClick={() => setShowPassword((s) => !s)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: TEXT_MUTED }}>{showPassword ? '🙈' : '👁'}</button>
            </div>
            {error && <p style={{ margin: '8px 0 0', color: DANGER, fontSize: 13 }}>{error}</p>}
            {!locked && !error && attemptsLeft < 5 && (
              <p style={{ margin: '8px 0 0', color: TEXT_MUTED, fontSize: 12 }}>{attemptsLeft} attempt{attemptsLeft === 1 ? '' : 's'} remaining before lockout</p>
            )}
            <button type="submit" disabled={locked} style={{ width: '100%', background: locked ? '#e8ecf0' : 'linear-gradient(135deg, #f93e42, #ff6b6b)', color: locked ? TEXT_MUTED : '#fff', border: 'none', borderRadius: 12, padding: 16, fontWeight: 700, fontSize: 16, marginTop: 24, cursor: locked ? 'not-allowed' : 'pointer', boxShadow: locked ? 'none' : '0 8px 24px rgba(249,62,66,0.35)' }}>Sign In</button>
          </form>
          <p style={{ color: TEXT_MUTED, fontSize: 12, textAlign: 'center', marginTop: 24, marginBottom: 0 }}>🔒 Secure admin access · AES-256 encrypted</p>
        </div>
      </div>
    </div>
  )
}
