import { useMemo, useState } from 'react'
import { AdminLayout } from '../../components/AdminLayout'
import { AdminAvatar } from '../../components/admin/AdminAvatar'
import { AdminCredentialRow } from '../../components/admin/AdminCredentialRow'
import { AdminProfilePhotoPicker } from '../../components/admin/AdminProfilePhotoPicker'
import { mergeProfileImages, setProfileImage } from '../../utils/adminProfileImages'
import { AdminEmptyState } from '../../components/admin/AdminEmptyState'
import { AdminToast } from '../../components/admin/AdminToast'
import { BRAND, BRAND_BLUE, BORDER, PAGE_BG, cardStyle, inputStyle, outlineBtn, primaryBtn, selectStyle, SUCCESS, tableHeaderStyle, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from '../../components/admin/adminTheme'
import { MOCK_CUSTOMERS, type AdminCustomer } from '../../data/adminMockData'

function randomB2CPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$'
  return `B2C@${Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')}`
}

const viewBtnStyle = {
  display: 'inline-block' as const,
  padding: '6px 14px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  background: PAGE_BG,
  border: `1px solid ${BORDER}`,
  color: TEXT_PRIMARY,
  cursor: 'pointer' as const,
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<AdminCustomer[]>(() => mergeProfileImages(MOCK_CUSTOMERS, 'b2c'))
  const [search, setSearch] = useState('')
  const [nationalityFilter, setNationalityFilter] = useState('all')
  const [profileUser, setProfileUser] = useState<AdminCustomer | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const nationalities = useMemo(() => [...new Set(customers.map((c) => c.nationality))], [customers])

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch = !search
        || c.name.toLowerCase().includes(search.toLowerCase())
        || c.email.toLowerCase().includes(search.toLowerCase())
        || c.username.toLowerCase().includes(search.toLowerCase())
      const matchNat = nationalityFilter === 'all' || c.nationality === nationalityFilter
      return matchSearch && matchNat
    })
  }, [customers, search, nationalityFilter])

  const totalSpent = customers.reduce((s, c) => s + c.totalSpent, 0)
  const hasFilters = Boolean(search || nationalityFilter !== 'all')

  const updateProfileImage = (id: string, dataUrl: string | undefined) => {
    setProfileImage('b2c', id, dataUrl)
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, profileImage: dataUrl } : c)))
    setProfileUser((p) => (p?.id === id ? { ...p, profileImage: dataUrl } : p))
    setToast(dataUrl ? 'Profile picture updated' : 'Profile picture removed')
  }

  const resetPassword = (id: string) => {
    const pwd = randomB2CPassword()
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, password: pwd } : c)))
    setProfileUser((p) => (p?.id === id ? { ...p, password: pwd } : p))
    setToast('B2C user password reset')
  }

  return (
    <AdminLayout activePath="/admin/customers" title="B2C Users">
      <AdminToast message={toast} onClose={() => setToast(null)} />

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total B2C Users', value: customers.length, color: BRAND_BLUE },
          { label: 'Applications', value: customers.reduce((s, c) => s + c.applications, 0), color: BRAND },
          { label: 'Total Spent', value: `AED ${(totalSpent / 1000).toFixed(0)}k`, color: SUCCESS },
        ].map((s) => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 40, padding: '10px 20px', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f8f9fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: s.color }}>●</div>
            <span style={{ fontWeight: 700, color: TEXT_PRIMARY }}>{s.value}</span>
            <span style={{ fontSize: 13, color: TEXT_SECONDARY }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ ...cardStyle, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input placeholder="Search by name, email, or username..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
        <select value={nationalityFilter} onChange={(e) => setNationalityFilter(e.target.value)} style={{ ...selectStyle, minWidth: 160 }}>
          <option value="all">All Nationalities</option>
          {nationalities.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        {hasFilters && <button type="button" onClick={() => { setSearch(''); setNationalityFilter('all') }} style={{ border: 'none', background: 'none', color: BRAND, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Clear filters</button>}
      </div>

      <div style={{ ...cardStyle, overflow: 'hidden', padding: 0 }}>
        {filtered.length === 0 ? (
          <AdminEmptyState title="No B2C users found" onClearFilters={hasFilters ? () => { setSearch(''); setNationalityFilter('all') } : undefined} />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f8f9fc' }}>
                {['B2C User', 'Username', 'Email', 'Phone', 'Nationality', 'Applications', 'Total Spent', 'Last Active', 'Action'].map((h) => (
                  <th key={h} style={tableHeaderStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f5f5f5', color: TEXT_PRIMARY }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <AdminAvatar name={c.name} size={36} src={c.profileImage} />
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 12, color: BRAND_BLUE }}>@{c.username}</td>
                  <td style={{ padding: '14px 16px', color: TEXT_SECONDARY, fontSize: 12 }}>{c.email}</td>
                  <td style={{ padding: '14px 16px', color: TEXT_SECONDARY }}>{c.phone}</td>
                  <td style={{ padding: '14px 16px' }}>{c.nationality}</td>
                  <td style={{ padding: '14px 16px' }}>{c.applications}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700 }}>AED {c.totalSpent.toLocaleString()}</td>
                  <td style={{ padding: '14px 16px', color: TEXT_MUTED, fontSize: 13 }}>{c.lastActive}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <button type="button" onClick={() => setProfileUser(c)} style={viewBtnStyle}
                      onMouseEnter={(e) => { e.currentTarget.style.background = BRAND; e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = PAGE_BG; e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT_PRIMARY }}
                    >View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {profileUser && (
        <>
          <div role="presentation" onClick={() => setProfileUser(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 24, maxWidth: 480, width: '90%', zIndex: 2001, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
            <div style={{ height: 4, background: `linear-gradient(90deg, ${BRAND_BLUE}, ${BRAND})` }} />
            <div style={{ padding: 32 }}>
              <AdminProfilePhotoPicker
                name={profileUser.name}
                profileImage={profileUser.profileImage}
                onChange={(dataUrl) => updateProfileImage(profileUser.id, dataUrl)}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <AdminAvatar name={profileUser.name} size={48} fontSize={18} src={profileUser.profileImage} />
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY }}>{profileUser.name}</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: TEXT_SECONDARY }}>{profileUser.email}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: TEXT_MUTED }}>{profileUser.phone} · {profileUser.nationality}</p>
                </div>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #f0f4ff, #f8f9fc)', borderRadius: 16, padding: 20, marginBottom: 20, border: `1px solid ${BORDER}` }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: TEXT_PRIMARY, marginBottom: 4 }}>🔐 B2C Login Credentials</div>
                <p style={{ margin: '0 0 16px', fontSize: 12, color: TEXT_SECONDARY }}>Super Admin can view and reset portal login for this user</p>
                <AdminCredentialRow label="User ID / Username" value={profileUser.username} />
                <AdminCredentialRow label="Password" value={profileUser.password} secret />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20, textAlign: 'center' }}>
                <div style={{ background: '#f8f9fc', borderRadius: 12, padding: 12 }}><div style={{ fontWeight: 700 }}>{profileUser.applications}</div><div style={{ fontSize: 11, color: TEXT_MUTED }}>Applications</div></div>
                <div style={{ background: '#f8f9fc', borderRadius: 12, padding: 12 }}><div style={{ fontWeight: 700 }}>AED {profileUser.totalSpent.toLocaleString()}</div><div style={{ fontSize: 11, color: TEXT_MUTED }}>Total Spent</div></div>
                <div style={{ background: '#f8f9fc', borderRadius: 12, padding: 12 }}><div style={{ fontWeight: 700, fontSize: 12 }}>{profileUser.lastActive}</div><div style={{ fontSize: 11, color: TEXT_MUTED }}>Last Active</div></div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => resetPassword(profileUser.id)} style={{ ...outlineBtn, flex: 1, fontSize: 13 }}>Reset Password</button>
                <button type="button" onClick={() => setProfileUser(null)} style={{ ...primaryBtn, flex: 1, fontSize: 13 }}>Close</button>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
