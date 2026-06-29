import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CountryFlag } from '../CountryFlag'
import { AdminAvatar } from './AdminAvatar'
import {
  BRAND,
  BORDER,
  PAGE_BG,
  tableHeaderStyle,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from './adminTheme'
import {
  LEAD_STATUSES,
  getStatusColor,
  type AdminLead,
  type LeadStatus,
} from '../../types/adminTypes'
import { updateLeadStatus } from '../../utils/b2cFlow'

const viewBtnStyle = {
  display: 'inline-block' as const,
  padding: '6px 14px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  textDecoration: 'none' as const,
  background: PAGE_BG,
  border: `1px solid ${BORDER}`,
  color: TEXT_PRIMARY,
  transition: 'all 0.15s ease',
}

function paymentPill(status?: string): { bg: string; color: string; border: string; label: string } {
  const s = String(status ?? 'pending').toLowerCase()
  if (s === 'paid') return { bg: '#f0fff4', color: '#16a34a', border: '#bbf7d0', label: 'Paid' }
  if (s === 'failed') return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'Failed' }
  return { bg: '#fffbeb', color: '#b45309', border: '#fde68a', label: 'Pending' }
}

type AdminApplicationsTableProps = {
  leads: AdminLead[]
  casePath: (id: string) => string
  showSourceColumn?: boolean
  showPartnerColumn?: boolean
  onStatusUpdated?: (status: LeadStatus) => void
}

export function AdminApplicationsTable({
  leads,
  casePath,
  showSourceColumn = false,
  showPartnerColumn = false,
  onStatusUpdated,
}: AdminApplicationsTableProps) {
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null)

  const updateStatus = (id: string, status: LeadStatus) => {
    updateLeadStatus(id, status)
    setStatusMenuId(null)
    onStatusUpdated?.(status)
  }

  const headers = [
    'Customer',
    'Destination',
    ...(showSourceColumn ? ['Source'] : []),
    ...(showPartnerColumn ? ['Partner'] : []),
    'Payment',
    'Pay status',
    'Status',
    'Created',
    'Action',
  ]

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
          {headers.map((h) => (
            <th key={h} style={{ ...tableHeaderStyle, background: '#f8f9fc' }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {leads.map((lead) => {
          const sc = getStatusColor(lead.status)
          const pay = paymentPill(lead.paymentStatus)
          return (
            <tr
              key={lead.id}
              style={{ borderBottom: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fafafa'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <td style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AdminAvatar name={lead.name} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{lead.name}</div>
                    <div style={{ fontSize: 12, color: TEXT_SECONDARY }}>{lead.email}</div>
                  </div>
                </div>
              </td>
              <td style={{ padding: 16 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {lead.passport !== '—' && (
                    <CountryFlag code={lead.passportCode} countryName={lead.passport} size="sm" />
                  )}
                  {lead.destination}
                </span>
              </td>
              {showSourceColumn && (
                <td style={{ padding: 16 }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 20,
                      fontSize: 12,
                      background: lead.source === 'B2C' ? '#eef4ff' : '#fff0f0',
                      color: lead.source === 'B2C' ? '#5057ea' : BRAND,
                      border: `1px solid ${lead.source === 'B2C' ? '#bfdbfe' : '#fce7e7'}`,
                    }}
                  >
                    {lead.source}
                  </span>
                </td>
              )}
              {showPartnerColumn && (
                <td style={{ padding: 16, color: TEXT_SECONDARY, fontSize: 13 }}>
                  {lead.agentName ?? '—'}
                </td>
              )}
              <td style={{ padding: 16, fontWeight: 700 }}>
                AED {(lead.amount ?? 0).toLocaleString()}
              </td>
              <td style={{ padding: 16 }}>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    background: pay.bg,
                    color: pay.color,
                    border: `1px solid ${pay.border}`,
                  }}
                >
                  {pay.label}
                </span>
              </td>
              <td style={{ padding: 16, position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setStatusMenuId(statusMenuId === lead.id ? null : lead.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 20,
                    fontSize: 12,
                    background: sc.bg,
                    color: sc.color,
                    border: `1px solid ${sc.border}`,
                    cursor: 'pointer',
                  }}
                >
                  {lead.status}
                </button>
                {statusMenuId === lead.id && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 48,
                      left: 16,
                      background: '#fff',
                      border: `1px solid ${BORDER}`,
                      borderRadius: 12,
                      zIndex: 50,
                      minWidth: 160,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    }}
                  >
                    {LEAD_STATUSES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => updateStatus(lead.id, s)}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '10px 14px',
                          border: 'none',
                          background: 'none',
                          color: TEXT_PRIMARY,
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = PAGE_BG
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'none'
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </td>
              <td style={{ padding: 16, color: TEXT_MUTED, fontSize: 13 }}>{lead.created}</td>
              <td style={{ padding: 16 }}>
                <Link
                  to={casePath(lead.id)}
                  style={viewBtnStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = BRAND
                    e.currentTarget.style.borderColor = BRAND
                    e.currentTarget.style.color = '#fff'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = PAGE_BG
                    e.currentTarget.style.borderColor = BORDER
                    e.currentTarget.style.color = TEXT_PRIMARY
                  }}
                >
                  Open
                </Link>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
