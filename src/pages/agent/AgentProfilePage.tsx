import { useState } from 'react'
import { AgentLayout } from '../../components/AgentLayout'
import { Database } from '../../database/db'
import { getAgentPartnerId } from '../../utils/agentSession'

const BRAND = '#f93e42'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box',
}

const COUNTRY_OPTIONS = ['UK', 'Schengen', 'USA', 'Kenya', 'Thailand', 'UAE', 'India', 'Australia']

export default function AgentProfilePage() {
  const partnerId = getAgentPartnerId() ?? ''
  const partner = Database.getPartnerById(partnerId)
  const [saved, setSaved] = useState(false)
  const [pwdMsg, setPwdMsg] = useState('')
  const [form, setForm] = useState({
    companyName: String(partner?.companyName ?? ''),
    contactPerson: String(partner?.contactPerson ?? ''),
    email: String(partner?.email ?? ''),
    phone: String(partner?.phone ?? ''),
    tradeLicence: String(partner?.tradeLicence ?? ''),
    countriesSold: (partner?.countriesSold as string[] | undefined) ?? [],
  })
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' })

  if (!partner) {
    return <AgentLayout><p>Partner not found.</p></AgentLayout>
  }

  const toggleCountry = (c: string) => {
    setForm((f) => ({
      ...f,
      countriesSold: f.countriesSold.includes(c) ? f.countriesSold.filter((x) => x !== c) : [...f.countriesSold, c],
    }))
  }

  const handleSave = () => {
    Database.updatePartner(partnerId, form)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 3000)
  }

  const handlePasswordChange = () => {
    if (String(partner.password) !== pwd.current) {
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

  return (
    <AgentLayout>
      <h1 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700 }}>Partner Profile</h1>

      {saved && <div style={{ background: '#f0fff4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 12, marginBottom: 16, color: '#166534', fontSize: 13 }}>Profile saved successfully.</div>}

      <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 560, marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        {[
          ['companyName', 'Company Name'],
          ['contactPerson', 'Contact Person'],
          ['email', 'Email'],
          ['phone', 'Phone'],
          ['tradeLicence', 'Trade Licence'],
        ].map(([key, label]) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 4 }}>{label}</label>
            <input value={form[key as keyof typeof form] as string} onChange={(e) => setForm({ ...form, [key]: e.target.value })} style={inputStyle} />
          </div>
        ))}

        <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 8 }}>Countries you sell</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {COUNTRY_OPTIONS.map((c) => (
            <button key={c} type="button" onClick={() => toggleCountry(c)} style={{ padding: '6px 12px', borderRadius: 20, border: form.countriesSold.includes(c) ? 'none' : '1px solid #ddd', background: form.countriesSold.includes(c) ? BRAND : '#fff', color: form.countriesSold.includes(c) ? '#fff' : '#333', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{c}</button>
          ))}
        </div>

        <div style={{ background: '#f8f9fc', borderRadius: 12, padding: 14, marginBottom: 20, fontSize: 13 }}>
          Your commission rate: <strong>{Number(partner.commissionRate ?? 15)}%</strong> (set by admin)
        </div>

        <button type="button" onClick={handleSave} style={{ background: BRAND, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 700, cursor: 'pointer' }}>Save Changes</button>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 560, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Change Password</h3>
        {pwdMsg && <p style={{ fontSize: 13, color: pwdMsg.includes('success') ? '#166534' : BRAND, marginBottom: 12 }}>{pwdMsg}</p>}
        {[['current', 'Current Password'], ['next', 'New Password'], ['confirm', 'Confirm Password']].map(([key, label]) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 4 }}>{label}</label>
            <input type="password" value={pwd[key as keyof typeof pwd]} onChange={(e) => setPwd({ ...pwd, [key]: e.target.value })} style={inputStyle} />
          </div>
        ))}
        <button type="button" onClick={handlePasswordChange} style={{ background: '#fff', color: BRAND, border: `1px solid ${BRAND}`, borderRadius: 12, padding: '12px 24px', fontWeight: 600, cursor: 'pointer' }}>Update Password</button>
      </div>
    </AgentLayout>
  )
}
