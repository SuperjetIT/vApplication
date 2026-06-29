import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AdminLayout } from '../../components/AdminLayout'
import { AdminAvatar } from '../../components/admin/AdminAvatar'
import { AdminEmptyState } from '../../components/admin/AdminEmptyState'
import { AdminToast } from '../../components/admin/AdminToast'
import {
  BRAND,
  BRAND_BLUE,
  BORDER,
  PAGE_BG,
  SUCCESS,
  cardStyle,
  inputStyle,
  outlineBtn,
  primaryBtn,
  selectStyle,
  tableHeaderStyle,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from '../../components/admin/adminTheme'
import { AGENT_LOGIN_PATH } from '../../config/portalRoutes'
import { AdminCredentialRow } from '../../components/admin/AdminCredentialRow'
import { usePortalBase } from '../../hooks/usePortalBase'
import { useDatabaseListener } from '../../hooks/useDatabase'
import { Database } from '../../database/db'
import { syncApplicationsFromServer } from '../../utils/applicationSync'
import { approvePartnerOnServer, createAdminPartnerOnServer, syncPartnersFromServer } from '../../utils/partnerSync'
import { syncUsersFromServer } from '../../utils/userSync'
import { sanitizeInput } from '../../utils/sanitizeInput'
import { countUserApplications, isB2cRegistrationRow } from '../../utils/adminUserFilters'

type RegisterChannel = 'b2b' | 'b2c'

function randomPassword(len = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#'
  return `Partner@${Array.from({ length: len - 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')}`
}

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

export default function AdminRegistrationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { basePath, isOperations } = usePortalBase()
  const dbVersion = useDatabaseListener()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [toast, setToast] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null)
  const [approveTarget, setApproveTarget] = useState<{ id: string; company: string; email: string } | null>(null)
  const [approveCommissionRate, setApproveCommissionRate] = useState(15)
  const [approvePassword, setApprovePassword] = useState('')
  const [approveNote, setApproveNote] = useState('')
  const [approvedPartnerCreds, setApprovedPartnerCreds] = useState<{ email: string; password: string } | null>(null)
  const [partnerForm, setPartnerForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    tradeLicence: '',
    password: '',
    commissionRate: 15,
    status: 'active' as 'active' | 'pending',
  })

  const tab: RegisterChannel = searchParams.get('tab') === 'b2b' ? 'b2b' : 'b2c'

  useEffect(() => {
    void syncPartnersFromServer()
    void syncUsersFromServer()
    void syncApplicationsFromServer()
    const pull = () => {
      void syncPartnersFromServer()
      void syncUsersFromServer()
    }
    const interval = window.setInterval(pull, 15_000)
    return () => window.clearInterval(interval)
  }, [])

  const setTab = (key: RegisterChannel) => {
    setSearchParams({ tab: key })
    setStatusFilter('all')
  }

  const b2cRows = useMemo(() => {
    const apps = Database.getApplications({ type: 'b2c' })
    return Database.getUsers()
      .filter(isB2cRegistrationRow)
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
          lastLogin: String(u.lastLogin ?? '—'),
          loginCount: Number(u.loginCount ?? 0) || 0,
          source: u.registrationSource === 'application' ? 'Application' : 'Sign-in',
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
  const loggedInUsers = b2cRows.filter((r) => r.lastLogin && r.lastLogin !== '—').length
  const pendingB2b = b2bRows.filter((r) => r.status.toLowerCase() === 'pending').length
  const activePath = `${basePath}/registrations`

  const openApproveModal = (row: { id: string; company: string; email: string }) => {
    const partner = Database.getPartnerById(row.id)
    setApproveTarget(row)
    setApproveCommissionRate(Number(partner?.commissionRate ?? 15) || 15)
    setApprovePassword(randomPassword())
    setApproveNote('')
    setApprovedPartnerCreds(null)
  }

  const confirmApprove = () => {
    if (!approveTarget) return
    const password = approvePassword.trim() || randomPassword()
    const approvedAt = new Date().toISOString()
    const approvedBy = isOperations ? 'operations' : 'admin'
    Database.updatePartner(approveTarget.id, {
      status: 'active',
      commissionRate: approveCommissionRate,
      password,
      approvedAt,
      approvedBy,
      approvalNote: approveNote.trim() || undefined,
    })
    void approvePartnerOnServer(approveTarget.id, {
      status: 'active',
      commissionRate: approveCommissionRate,
      password,
      approvedAt,
      approvedBy,
      approvalNote: approveNote.trim() || undefined,
    })
    setApprovedPartnerCreds({ email: approveTarget.email, password })
    setToast(`Partner approved with ${approveCommissionRate}% commission markup`)
  }

  const handleCreatePartner = async () => {
    const email = partnerForm.email.trim().toLowerCase()
    if (!partnerForm.companyName.trim() || !partnerForm.contactPerson.trim() || !email) {
      setToast('Please fill in company name, contact person, and email')
      return
    }
    const password = partnerForm.password.trim() || randomPassword()
    const result = await createAdminPartnerOnServer({
      companyName: partnerForm.companyName.trim(),
      contactPerson: partnerForm.contactPerson.trim(),
      email,
      phone: partnerForm.phone.trim(),
      tradeLicence: partnerForm.tradeLicence.trim(),
      password,
      commissionRate: partnerForm.commissionRate,
      status: partnerForm.status,
    })
    if (!result.ok) {
      setToast(result.error)
      return
    }
    setCreatedCreds({ email: String(result.partner.email), password })
    setToast('B2B partner added')
  }

  const tabBtn = (key: RegisterChannel, label: string) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      style={{
        padding: '10px 0',
        border: 'none',
        background: 'none',
        fontWeight: 700,
        fontSize: 13,
        color: tab === key ? BRAND : TEXT_SECONDARY,
        borderBottom: tab === key ? `2px solid ${BRAND}` : '2px solid transparent',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )

  return (
    <AdminLayout activePath={activePath} title="Registrations">
      <AdminToast message={toast} onClose={() => setToast(null)} />

      <div style={{ display: 'flex', gap: 20, borderBottom: `1px solid ${BORDER}`, marginBottom: 16 }}>
        {tabBtn('b2c', 'B2C Sign-ins')}
        {tabBtn('b2b', 'B2B Registrations')}
      </div>

      {tab === 'b2b' ? (
        <div style={{ background: '#fff8e1', borderRadius: 12, padding: '14px 20px', marginBottom: 16, borderLeft: '4px solid #f59e0b', fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
          ⚡ B2B Approval Flow: Partner registers → Pending → Admin approves + sets commission + creates login → Partner can now log in and submit visa applications
        </div>
      ) : (
        <div style={{ background: '#f0fff4', borderRadius: 12, padding: '14px 20px', marginBottom: 16, borderLeft: '4px solid #22c55e', fontSize: 12, color: '#166534', lineHeight: 1.5 }}>
          ✓ B2C Auto-approval: Customers sign in via passwordless OTP — auto-registered and immediately active. No manual approval needed.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
        {[
          { label: tab === 'b2b' ? 'Total B2B registrations' : 'Total B2C registrations', value: rows.length },
          { label: 'Registered this month', value: registeredThisMonth },
          {
            label: tab === 'b2b' ? 'Pending approval' : 'Users who logged in',
            value: tab === 'b2b' ? pendingB2b : loggedInUsers,
          },
        ].map((stat, i) => (
          <div key={stat.label} style={{ ...cardStyle, padding: 16, animation: `countUp 0.4s ease both`, animationDelay: `${i * 0.08}s` }}>
            <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 4 }}>{stat.label}</div>
            <div className="admin-stat-value" style={{ fontSize: 26, fontWeight: 800, color: TEXT_PRIMARY }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <input
          value={search}
          onChange={(e) => setSearch(sanitizeInput(e.target.value))}
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
        {tab === 'b2b' && !isOperations && (
          <button type="button" onClick={() => { setCreateOpen(true); setCreatedCreds(null) }} style={{ ...primaryBtn, marginLeft: 'auto' }}>
            + Add B2B Partner
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={cardStyle}>
          <AdminEmptyState
            entity={tab === 'b2b' ? 'partners' : 'users'}
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
                {tab === 'b2b' && !isOperations && <th style={{ padding: 14, textAlign: 'left' }}>Action</th>}
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
                              padding: '3px 8px',
                              borderRadius: 20,
                              fontSize: 11,
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
                        {!isOperations && (
                          <td style={{ padding: 14 }}>
                            {row.status.toLowerCase() === 'pending' ? (
                              <button type="button" onClick={() => openApproveModal(row)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: SUCCESS, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                Approve
                              </button>
                            ) : (
                              <span style={{ fontSize: 12, color: TEXT_MUTED }}>—</span>
                            )}
                          </td>
                        )}
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

      {tab === 'b2b' && !isOperations && approveTarget && (
        <>
          <div role="presentation" onClick={() => setApproveTarget(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 20, maxWidth: 440, width: '90%', zIndex: 2001, padding: 24 }}>
            {!approvedPartnerCreds ? (
              <>
                <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700 }}>Approve {approveTarget.company}</h3>
                <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4 }}>Commission markup (%)</label>
                <input type="number" value={approveCommissionRate} onChange={(e) => setApproveCommissionRate(Number(e.target.value) || 0)} style={{ ...inputStyle, width: '100%', marginBottom: 10 }} />
                <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4 }}>Login password</label>
                <input value={approvePassword} onChange={(e) => setApprovePassword(sanitizeInput(e.target.value))} style={{ ...inputStyle, width: '100%', marginBottom: 10 }} />
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button type="button" onClick={() => setApproveTarget(null)} style={{ ...outlineBtn, flex: 1 }}>Cancel</button>
                  <button type="button" onClick={confirmApprove} style={{ ...primaryBtn, flex: 1 }}>Approve</button>
                </div>
              </>
            ) : (
              <>
                <AdminCredentialRow label="Email" value={approvedPartnerCreds.email} />
                <AdminCredentialRow label="Password" value={approvedPartnerCreds.password} secret />
                <button type="button" onClick={() => setApproveTarget(null)} style={{ ...primaryBtn, width: '100%', marginTop: 12 }}>Done</button>
              </>
            )}
          </div>
        </>
      )}

      {tab === 'b2b' && !isOperations && createOpen && (
        <>
          <div role="presentation" onClick={() => setCreateOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 20, maxWidth: 440, width: '90%', zIndex: 2001, padding: 24 }}>
            {!createdCreds ? (
              <>
                <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700 }}>Add B2B Partner</h3>
                {(['companyName', 'contactPerson', 'email', 'phone', 'tradeLicence'] as const).map((key) => (
                  <input key={key} placeholder={key} value={partnerForm[key]} onChange={(e) => setPartnerForm({ ...partnerForm, [key]: sanitizeInput(e.target.value) })} style={{ ...inputStyle, width: '100%', marginBottom: 8 }} />
                ))}
                <button type="button" onClick={() => void handleCreatePartner()} style={{ ...primaryBtn, width: '100%' }}>Add partner</button>
              </>
            ) : (
              <>
                <AdminCredentialRow label="Email" value={createdCreds.email} />
                <AdminCredentialRow label="Password" value={createdCreds.password} secret />
                <button type="button" onClick={() => setCreateOpen(false)} style={{ ...primaryBtn, width: '100%', marginTop: 12 }}>Done</button>
              </>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  )
}
