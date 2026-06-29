import { useMemo, useState } from 'react'
import { useDatabaseListener } from '../../hooks/useDatabase'
import { AdminLayout } from '../../components/AdminLayout'
import { AdminAvatar } from '../../components/admin/AdminAvatar'
import { AdminEmptyState } from '../../components/admin/AdminEmptyState'
import { AdminToast } from '../../components/admin/AdminToast'
import {
  BORDER,
  cardStyle,
  inputStyle,
  outlineBtn,
  selectStyle,
  tableHeaderStyle,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from '../../components/admin/adminTheme'
import { usePortalBase } from '../../hooks/usePortalBase'
import { Database } from '../../database/db'
import { deleteUserOnServer } from '../../utils/userSync'
import { isB2cApplicationCustomer } from '../../utils/adminUserFilters'

type UserRecord = Record<string, unknown>

export default function AdminCustomers() {
  const { basePath, isOperations } = usePortalBase()
  const dbVersion = useDatabaseListener()
  const users = useMemo(
    () => Database.getUsers().filter(isB2cApplicationCustomer),
    [dbVersion],
  )

  const [search, setSearch] = useState('')
  const [verifiedFilter, setVerifiedFilter] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      const matchSearch =
        !q ||
        String(u.fullName ?? '').toLowerCase().includes(q) ||
        String(u.email ?? '').toLowerCase().includes(q) ||
        String(u.phone ?? '').toLowerCase().includes(q)
      const verified = u.isVerified !== false
      const matchVerified =
        verifiedFilter === 'all' ||
        (verifiedFilter === 'verified' && verified) ||
        (verifiedFilter === 'unverified' && !verified)
      return matchSearch && matchVerified
    })
  }, [users, search, verifiedFilter])

  const hasFilters = Boolean(search || verifiedFilter !== 'all')

  const deleteAppCount = deleteTarget
    ? Database.getApplications({ userId: String(deleteTarget.id) }).length
    : 0

  const handleDelete = () => {
    if (!deleteTarget) return
    const id = String(deleteTarget.id)
    const name = String(deleteTarget.fullName ?? '').trim() || String(deleteTarget.email ?? 'User')
    const removed = Database.deleteUser(id)
    if (!removed) {
      setToast('User not found')
      setDeleteTarget(null)
      return
    }
    void deleteUserOnServer(id)
    Database.logActivity('b2c_user_deleted', `B2C user deleted: ${name}`, undefined, 'admin', 'admin')
    setDeleteTarget(null)
    setToast(`${name} has been deleted`)
  }

  const columns = isOperations
    ? ['User', 'Email', 'Phone', 'Registration', 'Status', 'Last login']
    : ['User', 'Email', 'Phone', 'Registration', 'Status', 'Last login', 'Actions']

  return (
    <AdminLayout activePath={`${basePath}/customers`} title="B2C Users">
      <AdminToast message={toast} onClose={() => setToast(null)} />

      <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b', maxWidth: 720 }}>
        B2C customers who have submitted visa applications. For passwordless sign-in registrations, see Register → Registrations.
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'With applications', value: users.length },
          { label: 'Verified', value: users.filter((u) => u.isVerified !== false).length },
          {
            label: 'Incomplete profiles',
            value: users.filter((u) => !String(u.fullName ?? '').trim()).length,
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: '#fff',
              borderRadius: 40,
              padding: '10px 20px',
              border: `1px solid ${BORDER}`,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontWeight: 700, color: TEXT_PRIMARY }}>{s.value}</span>
            <span style={{ fontSize: 13, color: TEXT_SECONDARY }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="admin-toolbar" style={{ ...cardStyle, padding: '14px 16px', marginBottom: 16 }}>
        <input
          placeholder="Search name, email, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 200 }}
        />
        <select
          value={verifiedFilter}
          onChange={(e) => setVerifiedFilter(e.target.value)}
          style={{ ...selectStyle, minWidth: 160 }}
        >
          <option value="all">All users</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setVerifiedFilter('all')
            }}
            style={{
              border: 'none',
              background: 'none',
              color: '#f93e42',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="admin-table-wrap" style={{ ...cardStyle, padding: 0 }}>
        {filtered.length === 0 ? (
          <AdminEmptyState
            title="No B2C customers with applications yet"
            subtitle="Customers appear here after they submit a visa application. Sign-in registrations are under Register → Registrations."
            onClearFilters={hasFilters ? () => { setSearch(''); setVerifiedFilter('all') } : undefined}
          />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fc' }}>
                {columns.map((h) => (
                  <th key={h} style={tableHeaderStyle}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const name = String(u.fullName ?? '').trim() || String(u.email ?? 'User')
                const isPasswordless =
                  String(u.registrationMethod ?? 'passwordless') === 'passwordless' ||
                  String(u.registrationSource ?? '') === 'sign_in'
                return (
                  <tr key={String(u.id)} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <AdminAvatar name={name} size={36} />
                        <span style={{ fontWeight: 600 }}>{name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: TEXT_SECONDARY, fontSize: 13 }}>
                      {String(u.email ?? '—')}
                    </td>
                    <td style={{ padding: '14px 16px', color: TEXT_SECONDARY }}>
                      {String(u.phone ?? '—')}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          borderRadius: 20,
                          padding: '3px 10px',
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {isPasswordless ? 'Passwordless' : 'Email'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {u.isVerified !== false && (
                          <span
                            style={{
                              background: '#f0fff4',
                              color: '#166534',
                              borderRadius: 20,
                              padding: '3px 10px',
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            ✓ Verified
                          </span>
                        )}
                        {!String(u.fullName ?? '').trim() && (
                          <span
                            style={{
                              background: '#fff8e1',
                              color: '#92400e',
                              borderRadius: 20,
                              padding: '3px 10px',
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            Profile Incomplete
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: TEXT_MUTED, fontSize: 13 }}>
                      {String(u.lastLogin ?? u.createdAt ?? '—').slice(0, 16).replace('T', ' ')}
                    </td>
                    {!isOperations && (
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(u as UserRecord)}
                          style={{
                            background: '#fff',
                            border: '1px solid #fecaca',
                            color: '#b91c1c',
                            borderRadius: 8,
                            padding: '6px 14px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {deleteTarget && (
        <>
          <div
            role="presentation"
            onClick={() => setDeleteTarget(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000 }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              ...cardStyle,
              padding: 28,
              maxWidth: 420,
              width: '90%',
              zIndex: 2001,
            }}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY }}>
              Delete B2C user?
            </h3>
            <p style={{ margin: '0 0 12px', fontSize: 14, color: TEXT_SECONDARY, lineHeight: 1.5 }}>
              You are about to permanently remove{' '}
              <strong>
                {String(deleteTarget.fullName ?? '').trim() || String(deleteTarget.email ?? 'this user')}
              </strong>{' '}
              ({String(deleteTarget.email ?? '—')}).
            </p>
            {deleteAppCount > 0 && (
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#b45309', lineHeight: 1.5 }}>
                This user has {deleteAppCount} application{deleteAppCount === 1 ? '' : 's'} on record. The user
                profile will be removed; applications will remain in the system.
              </p>
            )}
            <p style={{ margin: '0 0 20px', fontSize: 13, color: TEXT_MUTED }}>
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setDeleteTarget(null)} style={{ ...outlineBtn, flex: 1 }}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                style={{
                  flex: 1,
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '12px 16px',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Delete user
              </button>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
