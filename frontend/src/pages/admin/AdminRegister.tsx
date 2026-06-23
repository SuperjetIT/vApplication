import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { AdminLayout } from '../../components/AdminLayout'
import { AdminAvatar } from '../../components/admin/AdminAvatar'
import { AdminEmptyState } from '../../components/admin/AdminEmptyState'
import {
  BRAND,
  BORDER,
  PAGE_BG,
  cardStyle,
  inputStyle,
  selectStyle,
  tableHeaderStyle,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from '../../components/admin/adminTheme'
import { usePortalBase } from '../../hooks/usePortalBase'
import { useDatabaseListener } from '../../hooks/useDatabase'
import { Database } from '../../database/db'

type RegisterChannel = 'b2b' | 'b2c'

function formatRegisteredAt(value: unknown): string {
  const raw = String(value ?? '').trim()
  if (!raw || raw === '—') return '—'
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw.slice(0, 10)
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusPill(status: string): { bg: string; color: string; border: string } {
  const s = status.toLowerCase()
  if (s === 'active' || s === 'verified') return { bg: '#f0fff4', color: '#16a34a', border: '#bbf7d0' }
  if (s === 'pending') return { bg: '#fffbeb', color: '#b45309', border: '#fde68a' }
  if (s === 'inactive') return { bg: PAGE_BG, color: TEXT_MUTED, border: BORDER }
  return { bg: '#eef4ff', color: '#5057ea', border: '#bfdbfe' }
}

export default function AdminRegister() {
  const { channel } = useParams<{ channel?: string }>()
  const { basePath } = usePortalBase()
  const dbVersion = useDatabaseListener()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const tab: RegisterChannel = channel === 'b2b' ? 'b2b' : channel === 'b2c' ? 'b2c' : 'b2c'

  if (channel !== 'b2b' && channel !== 'b2c') {
    return <Navigate to={`${basePath}/register/b2c`} replace />
  }

  const b2cRows = useMemo(() => {
    const apps = Database.getApplications({ type: 'b2c' })
    return Database.getUsers()
      .map((u) => {
        const userId = String(u.id)
        const myApps = apps.filter((a) => String(a.userId) === userId)
        return {
          id: userId,
          name: String(u.fullName ?? '—').trim() || String(u.email ?? 'User'),
          email: String(u.email ?? '—'),
          phone: String(u.phone ?? '—'),
          nationality: String(u.passportCountry ?? '—'),
          registeredAt: String(u.createdAt ?? '—'),
          status: u.isVerified === false ? 'Unverified' : 'Verified',
          applications: myApps.length,
        }
      })
      .sort((a, b) => String(b.registeredAt).localeCompare(String(a.registeredAt)))
  }, [dbVersion])

  const b2bRows = useMemo(() => {
    return Database.getPartners()
      .map((p) => ({
        id: String(p.id),
        company: String(p.companyName ?? '—'),
        contact: String(p.contactPerson ?? '—'),
        email: String(p.email ?? '—'),
        phone: String(p.phone ?? '—'),
        tradeLicence: String(p.tradeLicence ?? '—'),
        registeredAt: String(p.createdAt ?? '—'),
        status: String(p.status ?? 'pending'),
        applications: Number(p.totalApplications ?? 0),
      }))
      .sort((a, b) => String(b.registeredAt).localeCompare(String(a.registeredAt)))
  }, [dbVersion])

  const rows = tab === 'b2b' ? b2bRows : b2cRows

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesSearch =
        !q ||
        Object.values(row).some((v) => String(v).toLowerCase().includes(q))
      const matchesStatus =
        statusFilter === 'all' || String(row.status).toLowerCase() === statusFilter.toLowerCase()
      return matchesSearch && matchesStatus
    })
  }, [rows, search, statusFilter, tab])

  const thisMonth = new Date().toISOString().slice(0, 7)
  const registeredThisMonth = rows.filter((r) => String(r.registeredAt).startsWith(thisMonth)).length
  const activePath = `${basePath}/register/${tab}`

  const tabBtn = (key: RegisterChannel, label: string) => (
    <Link
      to={`${basePath}/register/${key}`}
      style={{
        padding: '12px 0',
        border: 'none',
        background: 'none',
        fontWeight: 700,
        fontSize: 14,
        color: tab === key ? TEXT_PRIMARY : TEXT_MUTED,
        borderBottom: tab === key ? `2px solid ${BRAND}` : '2px solid transparent',
        textDecoration: 'none',
      }}
    >
      {label}
    </Link>
  )

  return (
    <AdminLayout activePath={activePath} title="Registrations">
      <div style={{ display: 'flex', gap: 24, borderBottom: `1px solid ${BORDER}`, marginBottom: 24 }}>
        {tabBtn('b2c', 'B2C Users')}
        {tabBtn('b2b', 'B2B Partners')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: tab === 'b2b' ? 'Total B2B registrations' : 'Total B2C registrations', value: rows.length },
          { label: 'Registered this month', value: registeredThisMonth },
          {
            label: tab === 'b2b' ? 'Pending approval' : 'Verified users',
            value:
              tab === 'b2b'
                ? b2bRows.filter((r) => r.status.toLowerCase() === 'pending').length
                : b2cRows.filter((r) => r.status.toLowerCase() === 'verified').length,
          },
        ].map((stat) => (
          <div key={stat.label} style={{ ...cardStyle, padding: 20 }}>
            <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 6 }}>{stat.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: TEXT_PRIMARY }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tab === 'b2b' ? 'Search company, contact, email…' : 'Search name, email, phone…'}
          style={{ ...inputStyle, minWidth: 240, flex: 1 }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...selectStyle, minWidth: 160 }}>
          <option value="all">All statuses</option>
          {tab === 'b2b' ? (
            <>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </>
          ) : (
            <>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </>
          )}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={cardStyle}>
          <AdminEmptyState
            title={tab === 'b2b' ? 'No B2B registrations found' : 'No B2C registrations found'}
            onClearFilters={search || statusFilter !== 'all' ? () => { setSearch(''); setStatusFilter('all') } : undefined}
          />
        </div>
      ) : (
        <div style={{ ...cardStyle, padding: 0, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={tableHeaderStyle}>
                {tab === 'b2b' ? (
                  <>
                    <th style={{ padding: 14, textAlign: 'left' }}>Company</th>
                    <th style={{ padding: 14, textAlign: 'left' }}>Contact</th>
                    <th style={{ padding: 14, textAlign: 'left' }}>Email</th>
                    <th style={{ padding: 14, textAlign: 'left' }}>Phone</th>
                    <th style={{ padding: 14, textAlign: 'left' }}>Trade licence</th>
                  </>
                ) : (
                  <>
                    <th style={{ padding: 14, textAlign: 'left' }}>User</th>
                    <th style={{ padding: 14, textAlign: 'left' }}>Email</th>
                    <th style={{ padding: 14, textAlign: 'left' }}>Phone</th>
                    <th style={{ padding: 14, textAlign: 'left' }}>Nationality</th>
                    <th style={{ padding: 14, textAlign: 'left' }}>Applications</th>
                  </>
                )}
                <th style={{ padding: 14, textAlign: 'left' }}>Registered</th>
                <th style={{ padding: 14, textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {tab === 'b2b'
                ? (filtered as typeof b2bRows).map((row) => {
                    const pill = statusPill(row.status)
                    return (
                      <tr key={row.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                        <td style={{ padding: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{row.company}</td>
                        <td style={{ padding: 14, color: TEXT_SECONDARY }}>{row.contact}</td>
                        <td style={{ padding: 14, color: TEXT_SECONDARY }}>{row.email}</td>
                        <td style={{ padding: 14, color: TEXT_SECONDARY }}>{row.phone}</td>
                        <td style={{ padding: 14, color: TEXT_SECONDARY }}>{row.tradeLicence}</td>
                        <td style={{ padding: 14, color: TEXT_SECONDARY, whiteSpace: 'nowrap' }}>
                          {formatRegisteredAt(row.registeredAt)}
                        </td>
                        <td style={{ padding: 14 }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 600,
                              background: pill.bg,
                              color: pill.color,
                              border: `1px solid ${pill.border}`,
                              textTransform: 'capitalize',
                            }}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                : (filtered as typeof b2cRows).map((row) => {
                    const pill = statusPill(row.status)
                    return (
                      <tr key={row.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                        <td style={{ padding: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <AdminAvatar name={row.name} size={32} />
                            <span style={{ fontWeight: 600, color: TEXT_PRIMARY }}>{row.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: 14, color: TEXT_SECONDARY }}>{row.email}</td>
                        <td style={{ padding: 14, color: TEXT_SECONDARY }}>{row.phone}</td>
                        <td style={{ padding: 14, color: TEXT_SECONDARY }}>{row.nationality}</td>
                        <td style={{ padding: 14, color: TEXT_SECONDARY }}>{row.applications}</td>
                        <td style={{ padding: 14, color: TEXT_SECONDARY, whiteSpace: 'nowrap' }}>
                          {formatRegisteredAt(row.registeredAt)}
                        </td>
                        <td style={{ padding: 14 }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 600,
                              background: pill.bg,
                              color: pill.color,
                              border: `1px solid ${pill.border}`,
                              textTransform: 'capitalize',
                            }}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
