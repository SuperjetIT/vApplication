import { useState } from 'react'
import { AdminLayout } from '../../components/AdminLayout'
import { AdminAvatar } from '../../components/admin/AdminAvatar'
import { AdminToast } from '../../components/admin/AdminToast'
import { BRAND, BRAND_BLUE, BORDER, cardStyle, inputStyle, outlineBtn, PAGE_BG, primaryBtn, tableHeaderStyle, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from '../../components/admin/adminTheme'
import { MOCK_USERS, type AdminUser } from '../../data/adminMockData'

function randomPassword(len = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$'
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function randomUsername(name: string): string {
  const first = name.split(' ')[0]?.toLowerCase().replace(/[^a-z]/g, '') || 'user'
  return `${first}${String(Math.floor(Math.random() * 900) + 100)}`
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>(MOCK_USERS)
  const [showCreate, setShowCreate] = useState(false)
  const [showReset, setShowReset] = useState<AdminUser | null>(null)
  const [created, setCreated] = useState<{ username: string; password: string } | null>(null)
  const [showPwd, setShowPwd] = useState(false)
  const [resetPwd, setResetPwd] = useState('')
  const [showResetPwd, setShowResetPwd] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [toast, setToast] = useState<string | null>(null)

  const toggleStatus = (id: string) => {
    setUsers((u) => u.map((user) => user.id === id ? { ...user, status: user.status === 'Active' ? 'Inactive' : 'Active' } : user))
    setToast('User status updated')
  }

  const handleCreate = () => {
    if (!form.name || !form.email) return
    const username = randomUsername(form.name)
    const password = randomPassword()
    setCreated({ username, password })
    setUsers((u) => [...u, { id: String(u.length + 1), name: form.name, email: form.email, username, role: 'Operations', status: 'Active', created: new Date().toISOString().slice(0, 10), lastLogin: '—' }])
  }

  return (
    <AdminLayout activePath="/admin/users" title="Operation Users">
      <AdminToast message={toast} onClose={() => setToast(null)} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button type="button" onClick={() => { setShowCreate(true); setCreated(null); setForm({ name: '', email: '', phone: '' }) }} style={primaryBtn}>+ Create User</button>
      </div>

      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f8f9fc' }}>
              {['User', 'Email', 'Username', 'Role', 'Status', 'Created', 'Last Login', 'Actions'].map((h) => (
                <th key={h} style={tableHeaderStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f8f9fc', color: TEXT_PRIMARY }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafe' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <td style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AdminAvatar name={u.name} />
                    <span style={{ fontWeight: 600 }}>{u.name}</span>
                  </div>
                </td>
                <td style={{ padding: 16, color: TEXT_SECONDARY }}>{u.email}</td>
                <td style={{ padding: 16, fontFamily: 'monospace', fontSize: 13, color: TEXT_SECONDARY }}>{u.username}</td>
                <td style={{ padding: 16 }}>{u.role}</td>
                <td style={{ padding: 16 }}>
                  <button type="button" onClick={() => toggleStatus(u.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, background: u.status === 'Active' ? '#f0fff4' : PAGE_BG, color: u.status === 'Active' ? '#22c55e' : TEXT_MUTED, border: `1px solid ${u.status === 'Active' ? '#bbf7d0' : BORDER}` }}>{u.status}</span>
                  </button>
                </td>
                <td style={{ padding: 16, color: TEXT_MUTED }}>{u.created}</td>
                <td style={{ padding: 16, color: TEXT_MUTED }}>{u.lastLogin}</td>
                <td style={{ padding: 16 }}>
                  <button type="button" style={{ border: 'none', background: 'none', color: BRAND, cursor: 'pointer', marginRight: 8, fontSize: 13 }}>Edit</button>
                  <button type="button" onClick={() => { setShowReset(u); setResetPwd(''); setShowResetPwd(false) }} style={{ border: 'none', background: 'none', color: TEXT_SECONDARY, cursor: 'pointer', marginRight: 8, fontSize: 13 }}>Reset Password</button>
                  <button type="button" onClick={() => toggleStatus(u.id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13 }}>Deactivate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <>
          <div role="presentation" onClick={() => setShowCreate(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', ...cardStyle, padding: 32, maxWidth: 480, width: '90%', zIndex: 2001 }}>
            {!created ? (
              <>
                <h3 style={{ margin: '0 0 20px' }}>Create User</h3>
                <label style={{ display: 'block', fontSize: 13, color: TEXT_SECONDARY, marginBottom: 4 }}>Full Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ ...inputStyle, width: '100%', marginBottom: 12 }} />
                <label style={{ display: 'block', fontSize: 13, color: TEXT_SECONDARY, marginBottom: 4 }}>Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ ...inputStyle, width: '100%', marginBottom: 12 }} />
                <label style={{ display: 'block', fontSize: 13, color: TEXT_SECONDARY, marginBottom: 4 }}>Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+971 50 000 0000" style={{ ...inputStyle, width: '100%', marginBottom: 12 }} />
                <p style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 20 }}>Agents and customers have separate registration</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setShowCreate(false)} style={{ ...outlineBtn, flex: 1 }}>Cancel</button>
                  <button type="button" onClick={handleCreate} style={{ ...primaryBtn, flex: 1 }}>Create</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ background: 'linear-gradient(135deg, #f0fff4, #ecfdf5)', border: '1px solid #bbf7d0', borderRadius: 16, padding: 16, marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, color: '#22c55e', marginBottom: 12 }}>User Created Successfully</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13, background: '#fff', borderRadius: 12, padding: 14, border: `1px solid ${BORDER}` }}>
                    <span style={{ fontFamily: 'monospace', flex: 1 }}>{created.username}</span>
                    <button type="button" onClick={() => navigator.clipboard.writeText(created.username)} style={{ border: 'none', background: 'none', color: BRAND_BLUE, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Copy</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, background: '#fff', borderRadius: 12, padding: 14, border: `1px solid ${BORDER}` }}>
                    <span style={{ fontFamily: 'monospace', flex: 1 }}>{showPwd ? created.password : '••••••••••'}</span>
                    <button type="button" onClick={() => setShowPwd((s) => !s)} style={{ border: 'none', background: 'none', color: TEXT_SECONDARY, cursor: 'pointer', fontSize: 12 }}>{showPwd ? 'Hide' : 'Show'}</button>
                    <button type="button" onClick={() => navigator.clipboard.writeText(created.password)} style={{ border: 'none', background: 'none', color: BRAND_BLUE, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Copy</button>
                  </div>
                </div>
                <button type="button" onClick={() => setShowCreate(false)} style={{ ...primaryBtn, width: '100%' }}>Done</button>
              </>
            )}
          </div>
        </>
      )}

      {showReset && (
        <>
          <div role="presentation" onClick={() => setShowReset(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', ...cardStyle, padding: 32, maxWidth: 400, width: '90%', zIndex: 2001 }}>
            <h3 style={{ margin: '0 0 8px' }}>Reset Password</h3>
            <p style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 20 }}>{showReset.name}</p>
            <button type="button" onClick={() => setResetPwd(randomPassword())} style={{ ...outlineBtn, width: '100%', marginBottom: 12 }}>Generate New Password</button>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <input type={showResetPwd ? 'text' : 'password'} value={resetPwd} onChange={(e) => setResetPwd(e.target.value)} placeholder="Or type custom password" style={{ ...inputStyle, width: '100%', paddingRight: 44 }} />
              <button type="button" onClick={() => setShowResetPwd((s) => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: TEXT_SECONDARY, cursor: 'pointer' }}>{showResetPwd ? '🙈' : '👁'}</button>
            </div>
            {resetPwd && <button type="button" onClick={() => navigator.clipboard.writeText(resetPwd)} style={{ ...outlineBtn, width: '100%', marginBottom: 12 }}>Copy Password</button>}
            <button type="button" onClick={() => { setShowReset(null); setToast('Password reset successfully') }} style={{ ...primaryBtn, width: '100%' }}>Confirm Reset</button>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
