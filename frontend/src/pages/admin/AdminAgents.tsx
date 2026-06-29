import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminLayout } from '../../components/AdminLayout'
import { AdminAvatar } from '../../components/admin/AdminAvatar'
import { AdminCredentialRow } from '../../components/admin/AdminCredentialRow'
import { AdminEmptyState } from '../../components/admin/AdminEmptyState'
import { AdminToast } from '../../components/admin/AdminToast'
import {
  BRAND,
  BORDER,
  cardStyle,
  inputStyle,
  outlineBtn,
  primaryBtn,
  SUCCESS,
  tableHeaderStyle,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from '../../components/admin/adminTheme'
import { usePortalBase } from '../../hooks/usePortalBase'
import { useDatabaseListener } from '../../hooks/useDatabase'
import { Database } from '../../database/db'
import { approvePartnerOnServer, deletePartnerOnServer } from '../../utils/partnerSync'

function randomPassword(len = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#'
  return `Partner@${Array.from({ length: len - 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')}`
}

type PartnerTab = 'all' | 'active' | 'rejected'

export default function AdminAgents() {
  const { basePath, isOperations } = usePortalBase()
  useDatabaseListener()
  const allPartners = Database.getPartners()
  const partners = allPartners.filter(
    (p) => String(p.status ?? 'pending').toLowerCase() !== 'pending',
  )

  const [tab, setTab] = useState<PartnerTab>('all')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [approvePartner, setApprovePartner] = useState<Record<string, unknown> | null>(null)
  const [commissionRate, setCommissionRate] = useState(15)
  const [approvePassword, setApprovePassword] = useState('')
  const [approveNote, setApproveNote] = useState('')
  const [approvedCreds, setApprovedCreds] = useState<{ email: string; password: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Record<string, unknown> | null>(null)

  const pendingCount = allPartners.filter((p) => String(p.status).toLowerCase() === 'pending').length

  const deleteAppCount = deleteTarget
    ? Database.getApplications({ partnerId: String(deleteTarget.id) }).length
    : 0

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return partners.filter((p) => {
      const status = String(p.status ?? 'pending').toLowerCase()
      const matchTab = tab === 'all' || status === tab
      const matchSearch =
        !q ||
        String(p.companyName ?? '').toLowerCase().includes(q) ||
        String(p.email ?? '').toLowerCase().includes(q) ||
        String(p.contactPerson ?? '').toLowerCase().includes(q)
      return matchTab && matchSearch
    })
  }, [partners, tab, search])

  const tableRows = filtered

  const handleReject = (id: string, companyName: string) => {
    if (!window.confirm(`Reject registration for ${companyName}?`)) return
    Database.updatePartner(id, { status: 'rejected' })
    setToast('Partner registration rejected')
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    const id = String(deleteTarget.id)
    const name = String(deleteTarget.companyName ?? 'Partner')
    const removed = Database.deletePartner(id)
    if (!removed) {
      setToast('Partner not found')
      setDeleteTarget(null)
      return
    }
    void deletePartnerOnServer(id)
    Database.logActivity('partner_deleted', `B2B partner deleted: ${name}`, undefined, 'admin', 'admin')
    setDeleteTarget(null)
    setToast(`${name} has been deleted`)
  }

  const deleteBtnStyle = {
    background: '#fff',
    border: '1px solid #fecaca',
    color: '#b91c1c',
    borderRadius: 8,
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  } as const

  const openApprove = (partner: Record<string, unknown>) => {
    setApprovePartner(partner)
    setCommissionRate(Number(partner.commissionRate ?? 15) || 15)
    setApprovePassword(randomPassword())
    setApproveNote('')
    setApprovedCreds(null)
  }

  const confirmApprove = async () => {
    if (!approvePartner) return
    const id = String(approvePartner.id)
    const password = approvePassword.trim() || randomPassword()
    Database.updatePartner(id, {
      status: 'active',
      commissionRate,
      password,
      approvedAt: new Date().toISOString(),
      approvedBy: isOperations ? 'operations' : 'admin',
      approvalNote: approveNote.trim() || undefined,
    })
    void approvePartnerOnServer(id, {
      status: 'active',
      commissionRate,
      password,
      approvedAt: new Date().toISOString(),
      approvedBy: isOperations ? 'operations' : 'admin',
      approvalNote: approveNote.trim() || undefined,
    })
    Database.logActivity(
      'partner_approved',
      `B2B partner approved: ${String(approvePartner.companyName ?? '')}`,
      undefined,
      'admin',
      'admin',
    )
    setApprovedCreds({ email: String(approvePartner.email ?? ''), password })
    setToast('Partner approved! Credentials set. Share with partner securely.')
  }

  const tabBtn = (key: PartnerTab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      style={{
        padding: '8px 16px',
        borderRadius: 20,
        border: `1px solid ${tab === key ? BRAND : BORDER}`,
        background: tab === key ? '#fff0f0' : '#fff',
        color: tab === key ? BRAND : TEXT_SECONDARY,
        fontWeight: 600,
        fontSize: 13,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )

  const renderRow = (p: Record<string, unknown>, showActions: boolean) => {
    const status = String(p.status ?? 'pending').toLowerCase()
    const statusLabel =
      status === 'active'
        ? 'Active'
        : status === 'rejected'
          ? 'Rejected'
          : 'Pending Approval'
    const statusStyle =
      status === 'active'
        ? { bg: '#f0fff4', color: '#166534' }
        : status === 'rejected'
          ? { bg: '#fff0f0', color: '#b91c1c' }
          : { bg: '#fff8e1', color: '#b45309' }

    return (
      <tr key={String(p.id)} style={{ borderBottom: `1px solid ${BORDER}` }}>
        <td style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AdminAvatar name={String(p.companyName ?? 'Partner')} size={36} />
            <div>
              <div style={{ fontWeight: 600 }}>{String(p.companyName ?? '—')}</div>
              <div style={{ fontSize: 12, color: TEXT_MUTED }}>{String(p.contactPerson ?? '—')}</div>
            </div>
          </div>
        </td>
        <td style={{ padding: 14, color: TEXT_SECONDARY, fontSize: 13 }}>{String(p.email ?? '—')}</td>
        <td style={{ padding: 14, color: TEXT_SECONDARY }}>{String(p.phone ?? '—')}</td>
        <td style={{ padding: 14, color: TEXT_SECONDARY }}>{String(p.tradeLicence ?? '—')}</td>
        <td style={{ padding: 14, color: TEXT_SECONDARY, fontSize: 13 }}>
          {Array.isArray(p.countriesSold) && p.countriesSold.length
            ? (p.countriesSold as string[]).join(', ')
            : '—'}
        </td>
        <td style={{ padding: 14, color: TEXT_MUTED, fontSize: 13 }}>
          {String(p.createdAt ?? '—').slice(0, 10)}
        </td>
        <td style={{ padding: 14 }}>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              background: statusStyle.bg,
              color: statusStyle.color,
            }}
          >
            {statusLabel}
          </span>
        </td>
        {showActions && !isOperations && (
          <td style={{ padding: 14 }}>
            {status === 'pending' ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => openApprove(p)}
                  style={{
                    background: SUCCESS,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(String(p.id), String(p.companyName ?? ''))}
                  style={{
                    background: '#fff',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    borderRadius: 8,
                    padding: '6px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Reject
                </button>
                <button type="button" onClick={() => setDeleteTarget(p)} style={deleteBtnStyle}>
                  Delete
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {status === 'active' && (
                  <span style={{ fontSize: 12, color: TEXT_MUTED }}>
                    {Number(p.commissionRate ?? 0)}% commission
                  </span>
                )}
                <button type="button" onClick={() => setDeleteTarget(p)} style={deleteBtnStyle}>
                  Delete
                </button>
              </div>
            )}
          </td>
        )}
      </tr>
    )
  }

  return (
    <AdminLayout activePath={`${basePath}/agents`} title="B2B Partners">
      <AdminToast message={toast} onClose={() => setToast(null)} />

      <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b', maxWidth: 720 }}>
        Approved B2B partners who can submit visa applications. Pending partner registrations are under Register → Registrations.
      </p>

      {pendingCount > 0 && (
        <div
          style={{
            background: '#fff8e1',
            border: '1px solid #fcd34d',
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <span style={{ fontWeight: 600, color: '#92400e' }}>
            ⏳ {pendingCount} partner registration(s) awaiting approval
          </span>
          <Link
            to={`${basePath}/registrations?tab=b2b`}
            style={{
              color: BRAND,
              fontWeight: 700,
              fontSize: 14,
              textDecoration: 'none',
            }}
          >
            Review in Registrations →
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {tabBtn('all', 'All')}
        {tabBtn('active', 'Active')}
        {tabBtn('rejected', 'Rejected')}
      </div>

      <div className="admin-toolbar" style={{ ...cardStyle, padding: '14px 16px', marginBottom: 16 }}>
        <input
          placeholder="Search company, contact, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 200 }}
        />
      </div>

      <div className="admin-table-wrap" style={{ ...cardStyle, padding: 0 }}>
        {filtered.length === 0 ? (
          <AdminEmptyState title="No B2B partners found" />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fc' }}>
                {[
                  'Partner',
                  'Email',
                  'Phone',
                  'Trade licence',
                  'Countries',
                  'Registered',
                  'Status',
                  ...(isOperations ? [] : ['Actions']),
                ].map((h) => (
                  <th key={h} style={tableHeaderStyle}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((p) => renderRow(p as Record<string, unknown>, true))}
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
              Delete B2B partner?
            </h3>
            <p style={{ margin: '0 0 12px', fontSize: 14, color: TEXT_SECONDARY, lineHeight: 1.5 }}>
              You are about to permanently remove{' '}
              <strong>{String(deleteTarget.companyName ?? 'this partner')}</strong> (
              {String(deleteTarget.email ?? '—')}).
            </p>
            {deleteAppCount > 0 && (
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#b45309', lineHeight: 1.5 }}>
                This partner has {deleteAppCount} application{deleteAppCount === 1 ? '' : 's'} on record. The
                partner profile will be removed; applications will remain in the system.
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
                Delete partner
              </button>
            </div>
          </div>
        </>
      )}

      {approvePartner && (
        <>
          <div
            role="presentation"
            onClick={() => setApprovePartner(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000 }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              background: '#fff',
              borderRadius: 24,
              maxWidth: 480,
              width: '90%',
              zIndex: 2001,
              padding: 32,
              boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
            }}
          >
            {!approvedCreds ? (
              <>
                <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>
                  Approve {String(approvePartner.companyName ?? 'Partner')}
                </h3>
                <p style={{ margin: '0 0 20px', fontSize: 13, color: TEXT_SECONDARY }}>
                  Set commission and login credentials for this partner.
                </p>
                <label style={{ display: 'block', fontSize: 13, color: TEXT_SECONDARY, marginBottom: 4 }}>
                  Commission rate (%)
                </label>
                <input
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value) || 0)}
                  style={{ ...inputStyle, width: '100%', marginBottom: 12 }}
                />
                <label style={{ display: 'block', fontSize: 13, color: TEXT_SECONDARY, marginBottom: 4 }}>
                  Password
                </label>
                <input
                  value={approvePassword}
                  onChange={(e) => setApprovePassword(e.target.value)}
                  style={{ ...inputStyle, width: '100%', marginBottom: 12 }}
                />
                <label style={{ display: 'block', fontSize: 13, color: TEXT_SECONDARY, marginBottom: 4 }}>
                  Note to partner (optional)
                </label>
                <textarea
                  value={approveNote}
                  onChange={(e) => setApproveNote(e.target.value)}
                  rows={3}
                  style={{ ...inputStyle, width: '100%', marginBottom: 20, resize: 'vertical' }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setApprovePartner(null)} style={{ ...outlineBtn, flex: 1 }}>
                    Cancel
                  </button>
                  <button type="button" onClick={() => void confirmApprove()} style={{ ...primaryBtn, flex: 1 }}>
                    Approve & Send Credentials
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>Credentials ready</h3>
                <AdminCredentialRow label="Email" value={approvedCreds.email} />
                <AdminCredentialRow label="Password" value={approvedCreds.password} secret />
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(
                      `Email: ${approvedCreds.email}\nPassword: ${approvedCreds.password}`,
                    )
                    setToast('Credentials copied')
                  }}
                  style={{ ...outlineBtn, width: '100%', marginBottom: 8 }}
                >
                  Copy credentials
                </button>
                <button type="button" onClick={() => setApprovePartner(null)} style={{ ...primaryBtn, width: '100%' }}>
                  Done
                </button>
              </>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  )
}
