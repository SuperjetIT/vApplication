import { useEffect, useMemo, useRef, useState } from 'react'
import { AgentPageShell, contactInitials } from '../../components/agent/AgentUI'
import { AgentLayout } from '../../components/AgentLayout'
import { Database } from '../../database/db'
import { useDatabaseListener } from '../../hooks/useDatabase'
import { AGENT_ACCENT, AGENT_CARD, AGENT_ERROR, AGENT_MUTED, AGENT_PRIMARY } from '../../theme/agentTheme'
import { getAgentPartnerId } from '../../utils/agentSession'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box',
}

const COUNTRY_OPTIONS = ['UK', 'Schengen', 'USA', 'Kenya', 'Thailand', 'UAE', 'India', 'Australia']
const MAX_PHOTO_BYTES = 5 * 1024 * 1024

export default function AgentProfilePage() {
  const partnerId = getAgentPartnerId() ?? ''
  const dbVersion = useDatabaseListener()
  const partner = useMemo(() => Database.getPartnerById(partnerId), [partnerId, dbVersion])
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [pwdMsg, setPwdMsg] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [form, setForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    tradeLicence: '',
    countriesSold: [] as string[],
  })
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' })

  useEffect(() => {
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!partner) return
    setForm({
      companyName: String(partner.companyName ?? ''),
      contactPerson: String(partner.contactPerson ?? ''),
      email: String(partner.email ?? ''),
      phone: String(partner.phone ?? ''),
      tradeLicence: String(partner.tradeLicence ?? ''),
      countriesSold: (partner.countriesSold as string[] | undefined) ?? [],
    })
    setPhotoPreview((partner.profilePhoto as string | undefined) ?? null)
  }, [partner])

  if (!partner && !loading) {
    return <AgentLayout><p>Partner not found.</p></AgentLayout>
  }

  const toggleCountry = (c: string) => {
    setForm((f) => ({
      ...f,
      countriesSold: f.countriesSold.includes(c) ? f.countriesSold.filter((x) => x !== c) : [...f.countriesSold, c],
    }))
  }

  const handlePhotoSelect = (file: File) => {
    if (file.size > MAX_PHOTO_BYTES) {
      alert('Image must be under 5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = String(reader.result)
      setPhotoPreview(base64)
      Database.updatePartner(partnerId, { profilePhoto: base64 })
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    Database.updatePartner(partnerId, form)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 3000)
  }

  const handlePasswordChange = () => {
    if (String(partner?.password) !== pwd.current) {
      setPwdMsg('Current password is incorrect.')
      return
    }
    if (pwd.next.length < 6) {
      setPwdMsg('New password must be at least 6 characters.')
      return
    }
    if (pwd.next !== pwd.confirm) {
      setPwdMsg('Passwords do not match.')
      return
    }
    Database.updatePartnerPassword(partnerId, pwd.next)
    setPwdMsg('Password updated successfully.')
    setPwd({ current: '', next: '', confirm: '' })
  }

  const initials = contactInitials(form.contactPerson || form.companyName)

  return (
    <AgentLayout>
      <AgentPageShell loading={loading}>
        <h1 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700, color: AGENT_PRIMARY }}>Partner Profile</h1>

        {saved && <div style={{ background: '#f0fff4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 12, marginBottom: 16, color: '#166534', fontSize: 13 }}>Profile saved successfully.</div>}

        <div style={{ background: AGENT_CARD, borderRadius: 16, padding: 28, maxWidth: 560, marginBottom: 24, boxShadow: '0 2px 12px rgba(37,99,235,0.06)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
            {photoPreview ? (
              <img src={photoPreview} alt="" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${AGENT_ACCENT}` }} />
            ) : (
              <div style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                fontWeight: 700,
              }}>
                {initials}
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handlePhotoSelect(f)
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{ marginTop: 12, border: 'none', background: 'none', color: AGENT_ACCENT, fontWeight: 600, fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Upload Company Logo
            </button>
          </div>

          {[
            ['companyName', 'Company Name'],
            ['contactPerson', 'Contact Person'],
            ['email', 'Email'],
            ['phone', 'Phone'],
            ['tradeLicence', 'Trade Licence'],
          ].map(([key, label]) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, color: AGENT_MUTED, marginBottom: 4 }}>{label}</label>
              <input value={form[key as keyof typeof form] as string} onChange={(e) => setForm({ ...form, [key]: e.target.value })} style={inputStyle} />
            </div>
          ))}

          <label style={{ display: 'block', fontSize: 13, color: AGENT_MUTED, marginBottom: 8 }}>Countries you sell</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {COUNTRY_OPTIONS.map((c) => (
              <button key={c} type="button" onClick={() => toggleCountry(c)} style={{ padding: '6px 12px', borderRadius: 20, border: form.countriesSold.includes(c) ? 'none' : '1px solid #e2e8f0', background: form.countriesSold.includes(c) ? AGENT_ACCENT : '#fff', color: form.countriesSold.includes(c) ? '#fff' : AGENT_PRIMARY, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{c}</button>
            ))}
          </div>

          <div style={{ background: '#f8fafc', borderRadius: 12, padding: 14, marginBottom: 20, fontSize: 13, color: AGENT_MUTED, lineHeight: 1.6 }}>
            Commission terms set by Superjet Global. Contact your account manager for details.
          </div>

          <button type="button" onClick={handleSave} style={{ background: AGENT_ACCENT, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 700, cursor: 'pointer' }}>Save Changes</button>
        </div>

        <div style={{ background: AGENT_CARD, borderRadius: 16, padding: 28, maxWidth: 560, boxShadow: '0 2px 12px rgba(37,99,235,0.06)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: AGENT_PRIMARY }}>Change Password</h3>
          {pwdMsg && <p style={{ fontSize: 13, color: pwdMsg.includes('success') ? '#166534' : AGENT_ERROR, marginBottom: 12 }}>{pwdMsg}</p>}
          {[['current', 'Current Password'], ['next', 'New Password'], ['confirm', 'Confirm Password']].map(([key, label]) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, color: AGENT_MUTED, marginBottom: 4 }}>{label}</label>
              <input type="password" value={pwd[key as keyof typeof pwd]} onChange={(e) => setPwd({ ...pwd, [key]: e.target.value })} style={inputStyle} />
            </div>
          ))}
          <button type="button" onClick={handlePasswordChange} style={{ background: '#fff', color: AGENT_ACCENT, border: `1px solid ${AGENT_ACCENT}`, borderRadius: 12, padding: '12px 24px', fontWeight: 600, cursor: 'pointer' }}>Update Password</button>
        </div>
      </AgentPageShell>
    </AgentLayout>
  )
}
