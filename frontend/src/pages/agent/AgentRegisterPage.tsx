import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AGENT_LOGIN_PATH } from '../../config/portalRoutes'
import { BRAND, BORDER, DANGER, SUCCESS, inputStyle, TEXT_MUTED, TEXT_PRIMARY } from '../../components/admin/adminTheme'
import { Database } from '../../database/db'
import { notifyAdminNewPartner } from '../../utils/adminNotifications'

export default function AgentRegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    tradeLicence: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const email = form.email.trim().toLowerCase()
    if (!form.companyName.trim() || !form.contactPerson.trim() || !email || !form.password) {
      setError('Please fill in all required fields.')
      return
    }
    if (Database.getPartners().some((p) => String(p.email).toLowerCase() === email)) {
      setError('A partner with this email already exists.')
      return
    }
    const partner = Database.createPartner({
      companyName: form.companyName.trim(),
      contactPerson: form.contactPerson.trim(),
      email,
      username: email,
      phone: form.phone.trim(),
      tradeLicence: form.tradeLicence.trim(),
      password: form.password,
      commissionRate: 15,
      walletBalance: 0,
      status: 'pending',
    })
    notifyAdminNewPartner({
      partnerId: String(partner.id),
      companyName: form.companyName.trim(),
      contactPerson: form.contactPerson.trim(),
      email,
      phone: form.phone.trim() || undefined,
      status: 'pending',
    })
    Database.logActivity('partner_registered', `New B2B partner registration — ${form.companyName.trim()}`, undefined, email, 'b2b')
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8f9fc 0%, #f0f4ff 50%, #fff5f5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 28, maxWidth: 440, width: '100%', padding: '40px 32px', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.08)', border: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
          <h1 style={{ margin: '0 0 8px', fontSize: 22, color: TEXT_PRIMARY }}>Application received</h1>
          <p style={{ margin: '0 0 24px', color: TEXT_MUTED, fontSize: 14, lineHeight: 1.6 }}>
            Your B2B partner application is under review. We will email you at <strong>{form.email}</strong> once your account is approved.
          </p>
          <Link to={AGENT_LOGIN_PATH} style={{ display: 'inline-block', background: BRAND, color: '#fff', textDecoration: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 700 }}>Back to login</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8f9fc 0%, #f0f4ff 50%, #fff5f5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 28, maxWidth: 480, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.08)', border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${BRAND}, #5057ea)` }} />
        <div style={{ padding: '32px 28px' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontWeight: 800, fontSize: 20, color: TEXT_PRIMARY }}>Become a B2B Partner</div>
            <p style={{ margin: '6px 0 0', color: TEXT_MUTED, fontSize: 14 }}>Register your travel agency with Superjet Global</p>
          </div>

          {error && (
            <div style={{ background: '#fff0f0', border: '1px solid #fca5a5', borderRadius: 12, padding: 12, marginBottom: 16, fontSize: 13, color: DANGER }}>{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            {[
              ['companyName', 'Company name *', 'text'],
              ['contactPerson', 'Contact person *', 'text'],
              ['email', 'Business email *', 'email'],
              ['phone', 'Phone', 'tel'],
              ['tradeLicence', 'Trade licence no.', 'text'],
              ['password', 'Password *', 'password'],
            ].map(([field, label, type]) => (
              <div key={field} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, color: TEXT_MUTED, marginBottom: 6 }}>{label}</label>
                <input
                  type={type}
                  value={form[field as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  style={{ ...inputStyle, width: '100%' }}
                  required={label.includes('*')}
                />
              </div>
            ))}
            <button type="submit" style={{ width: '100%', background: BRAND, color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 8 }}>
              Submit application
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: TEXT_MUTED }}>
            Already a partner? <Link to={AGENT_LOGIN_PATH} style={{ color: SUCCESS, fontWeight: 600 }}>Sign in</Link>
          </p>
          <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13 }}>
            <button type="button" onClick={() => navigate('/')} style={{ border: 'none', background: 'none', color: TEXT_MUTED, cursor: 'pointer' }}>← Back to website</button>
          </p>
        </div>
      </div>
    </div>
  )
}
