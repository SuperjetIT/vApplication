import { useState } from 'react'
import { AdminLayout } from '../../components/AdminLayout'
import { AdminAvatar } from '../../components/admin/AdminAvatar'
import { AdminToast } from '../../components/admin/AdminToast'
import { BRAND, BRAND_BLUE, BORDER, cardStyle, hoverCardProps, inputStyle, outlineBtn, PAGE_BG, primaryBtn, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from '../../components/admin/adminTheme'
import { MOCK_USERS, type AdminUser } from '../../data/adminMockData'
import {
  loadOperationUsers,
  saveOperationUsers,
  updateOperationUserPassword,
  type OperationStaffUser,
} from '../../utils/operationsAuth'

function randomPassword(len = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$'
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function randomUsername(name: string): string {
  const first = name.split(' ')[0]?.toLowerCase().replace(/[^a-z]/g, '') || 'user'
  return `${first}${String(Math.floor(Math.random() * 900) + 100)}`
}

export default function AdminUsers() {
  const [users, setUsers] = useState<OperationStaffUser[]>(() => {
    const stored = loadOperationUsers()
    const admin = MOCK_USERS.find((u) => u.email === 'admin@superjetglobal.com')
    return admin ? [admin as OperationStaffUser, ...stored] : stored
  })
  const [showCreate, setShowCreate] = useState(false)
  const [showReset, setShowReset] = useState<AdminUser | null>(null)
  const [created, setCreated] = useState<{ username: string; password: string } | null>(null)
  const [showPwd, setShowPwd] = useState(false)
  const [resetPwd, setResetPwd] = useState('')
  const [showResetPwd, setShowResetPwd] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [toast, setToast] = useState<string | null>(null)

  const persistOpsUsers = (next: OperationStaffUser[]) => {
    saveOperationUsers(next.filter((u) => u.email !== 'admin@superjetglobal.com'))
  }

  const toggleStatus = (id: string) => {
    setUsers((u) => {
      const next = u.map((user) => {
        if (user.id !== id) return user
        const status: AdminUser['status'] = user.status === 'Active' ? 'Inactive' : 'Active'
        return { ...user, status }
      })
      persistOpsUsers(next.filter((x) => x.email !== 'admin@superjetglobal.com'))
      return next
    })
    setToast('User status updated')
  }

  const handleCreate = () => {
    if (!form.name || !form.email) return
    const username = randomUsername(form.name)
    const password = randomPassword()
    const newUser: OperationStaffUser = {
      id: String(Date.now()),
      name: form.name,
      email: form.email,
      username,
      password,
      role: 'Operations',
      status: 'Active',
      created: new Date().toISOString().slice(0, 10),
      lastLogin: '—',
    }
    setCreated({ username, password })
    setUsers((u) => {
      const admin = u.find((x) => x.email === 'admin@superjetglobal.com')
      const nextOps = [newUser, ...u.filter((x) => x.email !== 'admin@superjetglobal.com')]
      persistOpsUsers(nextOps)
      return admin ? [admin, ...nextOps] : nextOps
    })
  }

  return (
    <AdminLayout activePath="/admin/users" title="Operation Users">
      <AdminToast message={toast} onClose={() => setToast(null)} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <p style={{ margin: 0, fontSize: 14, color: TEXT_SECONDARY }}>{users.length} operation users</p>
        <button type="button" onClick={() => { setShowCreate(true); setCreated(null); setForm({ name: '', email: '', phone: '' }) }} style={primaryBtn}>+ Create User</button>
      </div>

      <div className="admin-grid-3">
        {users.map((u) => (
          <div
            key={u.id}
            style={{
              ...cardStyle,
              padding: 0,
              overflow: 'hidden',
              ...hoverCardProps.style,
            }}
            onMouseEnter={hoverCardProps.onMouseEnter}
            onMouseLeave={hoverCardProps.onMouseLeave}
          >
            <div style={{ height: 4, background: `linear-gradient(90deg, ${BRAND}, ${BRAND_BLUE})` }} />
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <AdminAvatar name={u.name} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: TEXT_PRIMARY }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>{u.role}</div>
                  </div>
                </div>
                <button type="button" onClick={() => toggleStatus(u.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    background: u.status === 'Active' ? '#f0fff4' : PAGE_BG,
                    color: u.status === 'Active' ? '#22c55e' : TEXT_MUTED,
                    border: `1px solid ${u.status === 'Active' ? '#bbf7d0' : BORDER}`,
                  }}>
                    {u.status}
                  </span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: TEXT_SECONDARY }}>
                  <span style={{ fontSize: 14 }}>✉</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span style={{ fontSize: 14 }}>👤</span>
                  <span style={{ fontFamily: 'monospace', color: TEXT_SECONDARY, fontSize: 12 }}>{u.username}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: TEXT_MUTED, marginTop: 4 }}>
                  <span>Created {u.created}</span>
                  <span>Login {u.lastLogin}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, borderTop: `1px solid ${BORDER}`, paddingTop: 16 }}>
                <button type="button" style={{ flex: 1, border: `1px solid ${BORDER}`, background: '#fff', color: BRAND, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Edit</button>
                <button type="button" onClick={() => { setShowReset(u); setResetPwd(''); setShowResetPwd(false) }} style={{ flex: 1, border: `1px solid ${BORDER}`, background: '#fff', color: TEXT_SECONDARY, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Reset</button>
                <button type="button" onClick={() => toggleStatus(u.id)} style={{ flex: 1, border: `1px solid #fecaca`, background: '#fff5f5', color: '#ef4444', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <>
          <div role="presentation" onClick={() => setShowCreate(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 20, border: `1px solid ${BORDER}`, boxShadow: '0 24px 48px rgba(0,0,0,0.12)', maxWidth: 480, width: '90%', zIndex: 2001, overflow: 'hidden' }}>
            <div style={{ height: 6, background: `linear-gradient(90deg, ${BRAND}, ${BRAND_BLUE})` }} />
            <div style={{ padding: 32 }}>
              {!created ? (
                <>
                  <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY }}>Create User</h3>
                  <p style={{ margin: '0 0 24px', fontSize: 13, color: TEXT_SECONDARY }}>Add a new operations team member</p>
                  <label style={{ display: 'block', fontSize: 13, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>Full Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ ...inputStyle, width: '100%', marginBottom: 16 }} />
                  <label style={{ display: 'block', fontSize: 13, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ ...inputStyle, width: '100%', marginBottom: 16 }} />
                  <label style={{ display: 'block', fontSize: 13, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+971 50 000 0000" style={{ ...inputStyle, width: '100%', marginBottom: 12 }} />
                  <p style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 24 }}>B2B Partners and B2C users have separate registration</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => setShowCreate(false)} style={{ ...outlineBtn, flex: 1 }}>Cancel</button>
                    <button type="button" onClick={handleCreate} style={{ ...primaryBtn, flex: 1 }}>Create</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{
                    background: 'linear-gradient(135deg, #f0fff4 0%, #ecfdf5 50%, #d1fae5 100%)',
                    border: '1px solid #bbf7d0',
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 24,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 }}>✓</div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#16a34a', fontSize: 15 }}>User Created Successfully</div>
                        <div style={{ fontSize: 12, color: '#15803d', marginTop: 2 }}>Share credentials securely with the user</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Username</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, background: '#fff', borderRadius: 12, padding: 14, border: `1px solid ${BORDER}` }}>
                      <span style={{ fontFamily: 'monospace', flex: 1, color: TEXT_PRIMARY }}>{created.username}</span>
                      <button type="button" onClick={() => navigator.clipboard.writeText(created.username)} style={{ border: 'none', background: 'none', color: BRAND_BLUE, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Copy</button>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Password</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, background: '#fff', borderRadius: 12, padding: 14, border: `1px solid ${BORDER}` }}>
                      <span style={{ fontFamily: 'monospace', flex: 1, color: TEXT_PRIMARY }}>{showPwd ? created.password : '••••••••••'}</span>
                      <button type="button" onClick={() => setShowPwd((s) => !s)} style={{ border: 'none', background: 'none', color: TEXT_SECONDARY, cursor: 'pointer', fontSize: 12 }}>{showPwd ? 'Hide' : 'Show'}</button>
                      <button type="button" onClick={() => navigator.clipboard.writeText(created.password)} style={{ border: 'none', background: 'none', color: BRAND_BLUE, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Copy</button>
                    </div>
                  </div>
                  <button type="button" onClick={() => setShowCreate(false)} style={{ ...primaryBtn, width: '100%' }}>Done</button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {showReset && (
        <>
          <div role="presentation" onClick={() => setShowReset(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', ...cardStyle, padding: 32, maxWidth: 400, width: '90%', zIndex: 2001 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY }}>Reset Password</h3>
            <p style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 20 }}>{showReset.name}</p>
            <button type="button" onClick={() => setResetPwd(randomPassword())} style={{ ...outlineBtn, width: '100%', marginBottom: 12 }}>Generate New Password</button>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <input type={showResetPwd ? 'text' : 'password'} value={resetPwd} onChange={(e) => setResetPwd(e.target.value)} placeholder="Or type custom password" style={{ ...inputStyle, width: '100%', paddingRight: 44 }} />
              <button type="button" onClick={() => setShowResetPwd((s) => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: TEXT_SECONDARY, cursor: 'pointer' }}>{showResetPwd ? '🙈' : '👁'}</button>
            </div>
            {resetPwd && <button type="button" onClick={() => navigator.clipboard.writeText(resetPwd)} style={{ ...outlineBtn, width: '100%', marginBottom: 12 }}>Copy Password</button>}
            <button type="button" onClick={() => {
              if (!resetPwd.trim() || !showReset) return
              updateOperationUserPassword(showReset.id, resetPwd.trim())
              setShowReset(null)
              setToast('Password reset successfully')
            }} style={{ ...primaryBtn, width: '100%' }}>Confirm Reset</button>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
