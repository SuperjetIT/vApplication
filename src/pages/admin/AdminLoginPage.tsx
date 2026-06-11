import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND, BORDER, inputStyle, PAGE_BG, TEXT_MUTED, TEXT_PRIMARY } from '../../components/admin/adminTheme'

const ADMIN_EMAIL = 'admin@superjetglobal.com'
const ADMIN_PASSWORD = 'demoadminsjt'

function LogoMark() {
  return (
    <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #f93e42, #ff8c69)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
      </svg>
    </div>
  )
}

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem('admin_logged_in', 'true')
      localStorage.setItem('admin_user', JSON.stringify({ name: 'Super Admin', email: ADMIN_EMAIL, role: 'admin' }))
      navigate('/admin')
    } else {
      setError(true)
      setShake(true)
      window.setTimeout(() => setShake(false), 500)
    }
  }

  const fieldStyle = (hasError: boolean): React.CSSProperties => ({
    ...inputStyle,
    width: '100%',
    border: `1.5px solid ${hasError ? '#fca5a5' : BORDER}`,
    background: hasError ? '#fff8f8' : PAGE_BG,
  })

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #fff8f8 0%, #ffffff 50%, #f8f8ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }`}</style>

      <svg aria-hidden style={{ position: 'absolute', top: 40, right: 40, width: 200, height: 200, opacity: 0.04, color: BRAND }} viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16v16H4z" /></svg>
      <svg aria-hidden style={{ position: 'absolute', bottom: 60, left: 40, width: 150, height: 150, opacity: 0.04, color: '#5057ea' }} viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" /></svg>
      <svg aria-hidden style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 300, height: 300, opacity: 0.03, color: '#5057ea' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>

      <div style={{ position: 'relative', zIndex: 1, background: '#fff', borderRadius: 24, padding: 48, maxWidth: 420, width: '100%', boxShadow: '0 8px 48px rgba(0,0,0,0.10)', border: `1px solid ${BORDER}`, animation: shake ? 'shake 0.5s' : 'none', textAlign: 'center' }}>
        <LogoMark />
        <div style={{ fontWeight: 800, fontSize: 24, color: TEXT_PRIMARY }}>Super Visa</div>
        <p style={{ margin: '4px 0 32px', color: TEXT_MUTED, fontSize: 14 }}>Admin Portal</p>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <label style={{ display: 'block', fontSize: 13, color: TEXT_MUTED, marginBottom: 6, fontWeight: 500 }}>Email Address</label>
          <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(false) }} style={fieldStyle(error)} placeholder="admin@superjetglobal.com" />

          <label style={{ display: 'block', fontSize: 13, color: TEXT_MUTED, marginBottom: 6, marginTop: 16, fontWeight: 500 }}>Password</label>
          <div style={{ position: 'relative' }}>
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); setError(false) }} style={{ ...fieldStyle(error), paddingRight: 44 }} />
            <button type="button" onClick={() => setShowPassword((s) => !s)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: TEXT_MUTED, padding: 4 }} aria-label="Toggle password">
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>

          {error && <p style={{ margin: '8px 0 0', color: '#dc2626', fontSize: 13 }}>Invalid credentials</p>}

          <button type="submit" style={{ width: '100%', background: 'linear-gradient(135deg, #f93e42, #ff6b6b)', color: '#fff', border: 'none', borderRadius: 12, padding: 16, fontWeight: 700, fontSize: 16, marginTop: 24, cursor: 'pointer', boxShadow: '0 8px 24px rgba(249,62,66,0.35)' }}>
            Sign In
          </button>
        </form>

        <p style={{ color: TEXT_MUTED, fontSize: 12, textAlign: 'center', marginTop: 32, marginBottom: 0 }}>© 2026 Superjet Visa · Secure Admin Access</p>
      </div>
    </div>
  )
}
