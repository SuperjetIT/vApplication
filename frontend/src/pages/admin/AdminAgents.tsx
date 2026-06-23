import { useMemo, useState } from 'react'
import { AdminLayout } from '../../components/AdminLayout'
import { AdminAvatar } from '../../components/admin/AdminAvatar'
import { AdminCredentialRow } from '../../components/admin/AdminCredentialRow'
import { AdminEmptyState } from '../../components/admin/AdminEmptyState'
import { AdminToast } from '../../components/admin/AdminToast'
import { BRAND, BRAND_BLUE, BORDER, cardStyle, hoverCardProps, inputStyle, outlineBtn, primaryBtn, selectStyle, SUCCESS, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from '../../components/admin/adminTheme'
import { AGENT_LOGIN_PATH } from '../../config/portalRoutes'
import { Database } from '../../database/db'
import { usePortalBase } from '../../hooks/usePortalBase'
import { useDatabaseListener } from '../../hooks/useDatabase'

function randomPassword(len = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#'
  return `Partner@${Array.from({ length: len - 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')}`
}

type Partner = ReturnType<typeof Database.getPartners>[number]

export default function AdminAgents() {
  const { isOperations } = usePortalBase()
  useDatabaseListener()
  const partners = Database.getPartners()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [profilePartner, setProfilePartner] = useState<Partner | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null)
  const [form, setForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    tradeLicence: '',
    password: '',
    commissionRate: 15,
    status: 'active' as 'active' | 'pending',
  })
  const [toast, setToast] = useState<string | null>(null)

  const refresh = () => {
    if (profilePartner) {
      const updated = Database.getPartnerById(String(profilePartner.id))
      if (updated) setProfilePartner(updated)
    }
  }

  const filtered = useMemo(() => {
    return partners.filter((p) => {
      const matchSearch = !search
        || String(p.companyName).toLowerCase().includes(search.toLowerCase())
        || String(p.email).toLowerCase().includes(search.toLowerCase())
        || String(p.contactPerson).toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || String(p.status).toLowerCase() === statusFilter
      return matchSearch && matchStatus
    })
  }, [partners, search, statusFilter])

  const totalRevenue = partners.reduce((s, p) => s + Number(p.totalRevenue ?? 0), 0)
  const activeCount = partners.filter((p) => String(p.status).toLowerCase() === 'active').length
  const hasFilters = Boolean(search || statusFilter !== 'all')

  const approvePartner = (id: string) => {
    Database.updatePartner(id, { status: 'active' })
    setToast('Partner approved — they can now log in')
  }

  const resetPassword = (id: string) => {
    const pwd = randomPassword()
    Database.updatePartnerPassword(id, pwd)
    refresh()
    setProfilePartner((p) => (p && String(p.id) === id ? { ...p, password: pwd } : p))
    setToast('Partner password reset')
  }

  const handleCreate = () => {
    if (!form.companyName || !form.email || !form.contactPerson) return
    const password = form.password.trim() || randomPassword()
    const created = Database.createPartner({
      companyName: form.companyName,
      contactPerson: form.contactPerson,
      email: form.email,
      phone: form.phone,
      tradeLicence: form.tradeLicence,
      password,
      commissionRate: form.commissionRate,
      countriesSold: [],
      status: form.status,
      walletBalance: 2400,
    }) as Record<string, unknown>
    refresh()
    setCreatedCreds({ email: String(created.email), password })
    setForm({ companyName: '', contactPerson: '', email: '', phone: '', tradeLicence: '', password: '', commissionRate: 15, status: 'active' })
    setToast('B2B Partner created — share credentials below')
  }

  return (
    <AdminLayout activePath="/admin/agents" title="B2B Partners">
      <AdminToast message={toast} onClose={() => setToast(null)} />

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total B2B Partners', value: partners.length, color: BRAND, bg: 'linear-gradient(135deg,#fff0f0,#ffe4e4)' },
          { label: 'Active', value: activeCount, color: SUCCESS, bg: 'linear-gradient(135deg,#f0fff4,#dcfce7)' },
          { label: 'Total Revenue', value: `AED ${(totalRevenue / 1000).toFixed(0)}k`, color: BRAND_BLUE, bg: 'linear-gradient(135deg,#f0f0ff,#e4e4ff)' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 40, padding: '10px 20px', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: s.color }}>●</div>
            <span style={{ fontWeight: 700, color: TEXT_PRIMARY }}>{s.value}</span>
            <span style={{ fontSize: 13, color: TEXT_SECONDARY }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="admin-toolbar" style={{ ...cardStyle, padding: '14px 16px', marginBottom: 16 }}>
        <input placeholder="Search by company, contact, or email..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...selectStyle, minWidth: 140 }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
        </select>
        {hasFilters && <button type="button" onClick={() => { setSearch(''); setStatusFilter('all') }} style={{ border: 'none', background: 'none', color: BRAND, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Clear filters</button>}
        {!isOperations && (
          <button type="button" onClick={() => { setCreateOpen(true); setCreatedCreds(null) }} style={{ ...primaryBtn, marginLeft: 'auto' }}>+ Add B2B Partner</button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={cardStyle}><AdminEmptyState title="No B2B partners found" onClearFilters={hasFilters ? () => { setSearch(''); setStatusFilter('all') } : undefined} /></div>
      ) : (
        <div className="admin-grid-cards">
          {filtered.map((p) => (
            <div key={String(p.id)} {...hoverCardProps} style={{ ...cardStyle, textAlign: 'center', ...hoverCardProps.style }}>
              <AdminAvatar name={String(p.companyName)} size={56} fontSize={20} />
              <div style={{ fontWeight: 700, fontSize: 16, color: TEXT_PRIMARY, marginTop: 12 }}>{String(p.companyName)}</div>
              <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 2 }}>{String(p.email)}</div>
              <div style={{ fontSize: 12, color: BRAND_BLUE, marginTop: 6 }}>{String(p.contactPerson)}</div>
              <span style={{ display: 'inline-block', marginTop: 10, padding: '4px 12px', borderRadius: 20, fontSize: 12, background: String(p.status).toLowerCase() === 'active' ? '#f0fff4' : '#f5f5f5', color: String(p.status).toLowerCase() === 'active' ? '#166534' : TEXT_MUTED, border: `1px solid ${String(p.status).toLowerCase() === 'active' ? '#bbf7d0' : BORDER}` }}>{String(p.status)}</span>
              <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #f5f5f5', marginTop: 16, paddingTop: 16 }}>
                <div><div style={{ fontWeight: 700, color: TEXT_PRIMARY }}>{Number(p.totalApplications ?? 0)}</div><div style={{ fontSize: 11, color: TEXT_SECONDARY }}>Applications</div></div>
                <div><div style={{ fontWeight: 700, color: TEXT_PRIMARY }}>AED {Number(p.totalRevenue ?? 0).toLocaleString()}</div><div style={{ fontSize: 11, color: TEXT_SECONDARY }}>Revenue</div></div>
                <div><div style={{ fontWeight: 700, color: SUCCESS }}>{Number(p.commissionRate ?? 0)}%</div><div style={{ fontSize: 11, color: TEXT_SECONDARY }}>Rate</div></div>
              </div>
              <button type="button" onClick={() => setProfilePartner(p)} style={{ marginTop: 16, width: '100%', background: '#f8f9fc', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 14px', fontSize: 13, color: TEXT_SECONDARY, cursor: 'pointer', fontWeight: 500 }}>View Profile</button>
              {!isOperations && String(p.status).toLowerCase() === 'pending' && (
                <button type="button" onClick={() => approvePartner(String(p.id))} style={{ marginTop: 8, width: '100%', background: SUCCESS, border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Approve Partner</button>
              )}
            </div>
          ))}
        </div>
      )}

      {profilePartner && (
        <>
          <div role="presentation" onClick={() => setProfilePartner(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 24, maxWidth: 480, width: '90%', zIndex: 2001, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
            <div style={{ height: 4, background: `linear-gradient(90deg, ${BRAND}, ${BRAND_BLUE})` }} />
            <div style={{ padding: 32 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>{String(profilePartner.companyName)}</h3>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: TEXT_SECONDARY }}>{String(profilePartner.contactPerson)} · {String(profilePartner.email)}</p>
              {!isOperations && (
                <div style={{ background: 'linear-gradient(135deg, #f0f0ff, #f8f9fc)', borderRadius: 16, padding: 20, marginBottom: 20, border: `1px solid ${BORDER}` }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Partner Login Credentials</div>
                  <AdminCredentialRow label="Login URL" value={`${window.location.origin}${AGENT_LOGIN_PATH}`} />
                  <AdminCredentialRow label="Email" value={String(profilePartner.email)} />
                  <AdminCredentialRow label="Password" value={String(profilePartner.password ?? '—')} secret />
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                {!isOperations && <button type="button" onClick={() => resetPassword(String(profilePartner.id))} style={{ ...outlineBtn, flex: 1, fontSize: 13 }}>Reset Password</button>}
                <button type="button" onClick={() => setProfilePartner(null)} style={{ ...primaryBtn, flex: 1, fontSize: 13 }}>Close</button>
              </div>
            </div>
          </div>
        </>
      )}

      {!isOperations && createOpen && (
        <>
          <div role="presentation" onClick={() => setCreateOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 24, maxWidth: 480, width: '90%', zIndex: 2001, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
            <div style={{ height: 4, background: `linear-gradient(90deg, ${BRAND}, ${BRAND_BLUE})` }} />
            <div style={{ padding: 32 }}>
              {!createdCreds ? (
                <>
                  <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>Add B2B Partner</h3>
                  <p style={{ margin: '0 0 20px', fontSize: 13, color: TEXT_SECONDARY }}>Create partner login for the B2B portal</p>
                  {[['companyName', 'Company Name *'], ['contactPerson', 'Contact Person *'], ['email', 'Email *'], ['phone', 'Phone'], ['tradeLicence', 'Trade Licence']].map(([key, label]) => (
                    <div key={key} style={{ marginBottom: 12 }}>
                      <label style={{ display: 'block', fontSize: 13, color: TEXT_SECONDARY, marginBottom: 4 }}>{label}</label>
                      <input value={form[key as keyof typeof form] as string} onChange={(e) => setForm({ ...form, [key]: e.target.value })} style={{ ...inputStyle, width: '100%' }} />
                    </div>
                  ))}
                  <label style={{ display: 'block', fontSize: 13, color: TEXT_SECONDARY, marginBottom: 4 }}>Password (auto-generated if empty)</label>
                  <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={{ ...inputStyle, width: '100%', marginBottom: 12 }} placeholder="Leave blank to auto-generate" />
                  <label style={{ display: 'block', fontSize: 13, color: TEXT_SECONDARY, marginBottom: 4 }}>Commission Rate %</label>
                  <input type="number" min={1} max={50} value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: Number(e.target.value) })} style={{ ...inputStyle, width: '100%', marginBottom: 12 }} />
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'pending' })} style={{ ...selectStyle, width: '100%', marginBottom: 20 }}>
                    <option value="active">Active</option>
                    <option value="pending">Pending Approval</option>
                  </select>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => setCreateOpen(false)} style={{ ...outlineBtn, flex: 1 }}>Cancel</button>
                    <button type="button" onClick={handleCreate} style={{ ...primaryBtn, flex: 1 }}>Create Partner</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ background: 'linear-gradient(135deg, #f0fff4, #dcfce7)', border: '1px solid #bbf7d0', borderRadius: 16, padding: 20, marginBottom: 20 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#166534', marginBottom: 4 }}>Partner account created!</div>
                    <AdminCredentialRow label="Login URL" value={`${window.location.origin}${AGENT_LOGIN_PATH}`} />
                    <AdminCredentialRow label="Email" value={createdCreds.email} />
                    <AdminCredentialRow label="Password" value={createdCreds.password} secret />
                    <p style={{ margin: '12px 0 0', fontSize: 12, color: '#15803d' }}>Share these credentials with the partner securely</p>
                  </div>
                  <button type="button" onClick={() => setCreateOpen(false)} style={{ ...primaryBtn, width: '100%' }}>Done</button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
