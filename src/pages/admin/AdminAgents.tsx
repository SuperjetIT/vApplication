import { useMemo, useState } from 'react'
import { AdminLayout } from '../../components/AdminLayout'
import { AdminAvatar } from '../../components/admin/AdminAvatar'
import { AdminCredentialRow } from '../../components/admin/AdminCredentialRow'
import { AdminProfilePhotoPicker } from '../../components/admin/AdminProfilePhotoPicker'
import { mergeProfileImages, setProfileImage } from '../../utils/adminProfileImages'
import { AdminEmptyState } from '../../components/admin/AdminEmptyState'
import { AdminToast } from '../../components/admin/AdminToast'
import { BRAND, BRAND_BLUE, BORDER, cardStyle, hoverCardProps, inputStyle, outlineBtn, primaryBtn, selectStyle, SUCCESS, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from '../../components/admin/adminTheme'
import { MOCK_AGENTS, type AdminAgent } from '../../data/adminMockData'

function randomPassword(len = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$'
  return `B2B@${Array.from({ length: len - 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')}`
}

function randomUsername(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || 'partner'
  return `${base}${Math.floor(Math.random() * 900) + 100}`
}

export default function AdminAgents() {
  const [agents, setAgents] = useState<AdminAgent[]>(() => mergeProfileImages(MOCK_AGENTS, 'b2b'))
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [profileAgent, setProfileAgent] = useState<AdminAgent | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createdCreds, setCreatedCreds] = useState<{ username: string; password: string } | null>(null)
  const [form, setForm] = useState({ name: '', email: '' })
  const [toast, setToast] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return agents.filter((a) => {
      const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()) || a.username.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || a.status.toLowerCase() === statusFilter
      return matchSearch && matchStatus
    })
  }, [agents, search, statusFilter])

  const totalRevenue = agents.reduce((s, a) => s + a.revenue, 0)
  const activeCount = agents.filter((a) => a.status === 'Active').length
  const hasFilters = Boolean(search || statusFilter !== 'all')

  const updateProfileImage = (id: string, dataUrl: string | undefined) => {
    setProfileImage('b2b', id, dataUrl)
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, profileImage: dataUrl } : a)))
    setProfileAgent((p) => (p?.id === id ? { ...p, profileImage: dataUrl } : p))
    setToast(dataUrl ? 'Profile picture updated' : 'Profile picture removed')
  }

  const resetPassword = (id: string) => {
    const pwd = randomPassword()
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, password: pwd } : a)))
    setProfileAgent((p) => (p?.id === id ? { ...p, password: pwd } : p))
    setToast('Partner password reset')
  }

  const handleCreate = () => {
    if (!form.name || !form.email) return
    const username = randomUsername(form.name)
    const password = randomPassword()
    const newAgent: AdminAgent = {
      id: String(agents.length + 1),
      name: form.name,
      email: form.email,
      username,
      password,
      leads: 0,
      revenue: 0,
      commission: 0,
      status: 'Active',
    }
    setAgents((prev) => [newAgent, ...prev])
    setCreatedCreds({ username, password })
    setForm({ name: '', email: '' })
    setToast('B2B Partner created — share credentials below')
  }

  return (
    <AdminLayout activePath="/admin/agents" title="B2B Partners">
      <AdminToast message={toast} onClose={() => setToast(null)} />

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total B2B Partners', value: agents.length, color: BRAND, bg: 'linear-gradient(135deg,#fff0f0,#ffe4e4)' },
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

      <div style={{ ...cardStyle, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input placeholder="Search by name, email, or username..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...selectStyle, minWidth: 140 }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {hasFilters && <button type="button" onClick={() => { setSearch(''); setStatusFilter('all') }} style={{ border: 'none', background: 'none', color: BRAND, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Clear filters</button>}
        <button type="button" onClick={() => { setCreateOpen(true); setCreatedCreds(null); setForm({ name: '', email: '' }) }} style={{ ...primaryBtn, marginLeft: 'auto' }}>+ Add B2B Partner</button>
      </div>

      {filtered.length === 0 ? (
        <div style={cardStyle}><AdminEmptyState title="No B2B partners found" onClearFilters={hasFilters ? () => { setSearch(''); setStatusFilter('all') } : undefined} /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {filtered.map((a) => (
            <div key={a.id} {...hoverCardProps} style={{ ...cardStyle, textAlign: 'center', ...hoverCardProps.style }}>
              <AdminAvatar name={a.name} size={56} fontSize={20} src={a.profileImage} />
              <div style={{ fontWeight: 700, fontSize: 16, color: TEXT_PRIMARY, marginTop: 12 }}>{a.name}</div>
              <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 2 }}>{a.email}</div>
              <div style={{ fontSize: 12, color: BRAND_BLUE, marginTop: 6, fontFamily: 'monospace' }}>@{a.username}</div>
              <span style={{ display: 'inline-block', marginTop: 10, padding: '4px 12px', borderRadius: 20, fontSize: 12, background: a.status === 'Active' ? '#f0fff4' : '#f5f5f5', color: a.status === 'Active' ? '#166534' : TEXT_MUTED, border: `1px solid ${a.status === 'Active' ? '#bbf7d0' : BORDER}` }}>{a.status}</span>
              <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #f5f5f5', marginTop: 16, paddingTop: 16 }}>
                <div><div style={{ fontWeight: 700, color: TEXT_PRIMARY }}>{a.leads}</div><div style={{ fontSize: 11, color: TEXT_SECONDARY }}>Applications</div></div>
                <div><div style={{ fontWeight: 700, color: TEXT_PRIMARY }}>AED {(a.revenue / 1000).toFixed(0)}k</div><div style={{ fontSize: 11, color: TEXT_SECONDARY }}>Revenue</div></div>
                <div><div style={{ fontWeight: 700, color: SUCCESS }}>AED {a.commission}</div><div style={{ fontSize: 11, color: TEXT_SECONDARY }}>Partner Commission</div></div>
              </div>
              <button type="button" onClick={() => setProfileAgent(a)} style={{ marginTop: 16, width: '100%', background: '#f8f9fc', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 14px', fontSize: 13, color: TEXT_SECONDARY, cursor: 'pointer', fontWeight: 500 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = BRAND; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = BRAND }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f8f9fc'; e.currentTarget.style.color = TEXT_SECONDARY; e.currentTarget.style.borderColor = BORDER }}
              >View Profile</button>
            </div>
          ))}
        </div>
      )}

      {/* Profile modal */}
      {profileAgent && (
        <>
          <div role="presentation" onClick={() => setProfileAgent(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 24, maxWidth: 480, width: '90%', zIndex: 2001, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
            <div style={{ height: 4, background: `linear-gradient(90deg, ${BRAND}, ${BRAND_BLUE})` }} />
            <div style={{ padding: 32 }}>
              <AdminProfilePhotoPicker
                name={profileAgent.name}
                profileImage={profileAgent.profileImage}
                onChange={(dataUrl) => updateProfileImage(profileAgent.id, dataUrl)}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <AdminAvatar name={profileAgent.name} size={48} fontSize={18} src={profileAgent.profileImage} />
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY }}>{profileAgent.name}</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: TEXT_SECONDARY }}>{profileAgent.email}</p>
                  <span style={{ display: 'inline-block', marginTop: 6, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: profileAgent.status === 'Active' ? '#f0fff4' : '#f5f5f5', color: profileAgent.status === 'Active' ? '#166534' : TEXT_MUTED }}>{profileAgent.status}</span>
                </div>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #f0f0ff, #f8f9fc)', borderRadius: 16, padding: 20, marginBottom: 20, border: `1px solid ${BORDER}` }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: TEXT_PRIMARY, marginBottom: 4 }}>🔐 Partner Login Credentials</div>
                <p style={{ margin: '0 0 16px', fontSize: 12, color: TEXT_SECONDARY }}>Share these with the B2B partner for portal access</p>
                <AdminCredentialRow label="User ID / Username" value={profileAgent.username} />
                <AdminCredentialRow label="Password" value={profileAgent.password} secret />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20, textAlign: 'center' }}>
                <div style={{ background: '#f8f9fc', borderRadius: 12, padding: 12 }}><div style={{ fontWeight: 700 }}>{profileAgent.leads}</div><div style={{ fontSize: 11, color: TEXT_MUTED }}>Applications</div></div>
                <div style={{ background: '#f8f9fc', borderRadius: 12, padding: 12 }}><div style={{ fontWeight: 700 }}>AED {profileAgent.revenue.toLocaleString()}</div><div style={{ fontSize: 11, color: TEXT_MUTED }}>Revenue</div></div>
                <div style={{ background: '#f8f9fc', borderRadius: 12, padding: 12 }}><div style={{ fontWeight: 700, color: SUCCESS }}>AED {profileAgent.commission}</div><div style={{ fontSize: 11, color: TEXT_MUTED }}>Commission</div></div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => resetPassword(profileAgent.id)} style={{ ...outlineBtn, flex: 1, fontSize: 13 }}>Reset Password</button>
                <button type="button" onClick={() => setProfileAgent(null)} style={{ ...primaryBtn, flex: 1, fontSize: 13 }}>Close</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Create partner modal */}
      {createOpen && (
        <>
          <div role="presentation" onClick={() => setCreateOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 24, maxWidth: 480, width: '90%', zIndex: 2001, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
            <div style={{ height: 4, background: `linear-gradient(90deg, ${BRAND}, ${BRAND_BLUE})` }} />
            <div style={{ padding: 32 }}>
              {!createdCreds ? (
                <>
                  <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>Add B2B Partner</h3>
                  <p style={{ margin: '0 0 20px', fontSize: 13, color: TEXT_SECONDARY }}>A User ID and password will be auto-generated</p>
                  <label style={{ display: 'block', fontSize: 13, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>Agency Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ ...inputStyle, width: '100%', marginBottom: 12 }} />
                  <label style={{ display: 'block', fontSize: 13, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ ...inputStyle, width: '100%', marginBottom: 20 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => setCreateOpen(false)} style={{ ...outlineBtn, flex: 1 }}>Cancel</button>
                    <button type="button" onClick={handleCreate} style={{ ...primaryBtn, flex: 1 }}>Create & Generate Credentials</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ background: 'linear-gradient(135deg, #f0fff4, #dcfce7)', border: '1px solid #bbf7d0', borderRadius: 16, padding: 20, marginBottom: 20 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#166534', marginBottom: 4 }}>🎉 Partner Created!</div>
                    <p style={{ margin: '0 0 16px', fontSize: 13, color: '#15803d' }}>Share these login credentials securely</p>
                    <AdminCredentialRow label="User ID / Username" value={createdCreds.username} />
                    <AdminCredentialRow label="Password" value={createdCreds.password} secret />
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
