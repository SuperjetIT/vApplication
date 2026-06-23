import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AdminLayout } from '../../components/AdminLayout'
import { AdminAvatar } from '../../components/admin/AdminAvatar'
import { AdminEmptyState } from '../../components/admin/AdminEmptyState'
import { AdminToast } from '../../components/admin/AdminToast'
import {
  BRAND,
  BORDER,
  PAGE_BG,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  cardStyle,
  inputStyle,
  selectStyle,
  outlineBtn,
  primaryBtn,
  tableHeaderStyle,
  tabActive,
  hoverCardProps,
} from '../../components/admin/adminTheme'
import { usePortalBase } from '../../hooks/usePortalBase'
import { CountryFlag } from '../../components/CountryFlag'
import { useDatabaseListener } from '../../hooks/useDatabase'
import { Database } from '../../database/db'
import {
  LEAD_STATUSES,
  getStatusColor,
  getUniqueDestinations,
  type LeadStatus,
} from '../../types/adminTypes'
import { loadLeads, updateLeadStatus } from '../../utils/b2cFlow'

const PER_PAGE = 10

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
  cursor: 'pointer' as const,
}

export default function AdminLeads() {
  const { path, basePath } = usePortalBase()
  useDatabaseListener()
  const leads = loadLeads()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')
  const [page, setPage] = useState(1)
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [newApp, setNewApp] = useState({ name: '', email: '', destination: '', source: 'B2C' as 'B2C' | 'B2B' })
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const q = searchParams.get('search')
    if (q) setSearchQuery(q)
  }, [searchParams])

  const countries = useMemo(() => getUniqueDestinations(leads), [leads])

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const q = searchQuery.toLowerCase()
      const matchSearch =
        searchQuery === '' ||
        lead.name.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        lead.destination.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || lead.status === statusFilter
      const matchCountry = countryFilter === 'all' || lead.destination === countryFilter
      const matchSource = sourceFilter === 'all' || lead.source === sourceFilter
      return matchSearch && matchStatus && matchCountry && matchSource
    })
  }, [leads, searchQuery, statusFilter, countryFilter, sourceFilter])

  const statPills = useMemo(
    () => [
      { label: 'Total Applications', value: leads.length },
      { label: 'New Applications', value: leads.filter((l) => l.status === 'New Application').length },
      { label: 'Qualified', value: leads.filter((l) => l.status === 'Qualified').length },
      { label: 'Approved', value: leads.filter((l) => l.status === 'Approved').length },
    ],
    [leads],
  )

  const hasFilters = searchQuery || statusFilter !== 'all' || countryFilter !== 'all' || sourceFilter !== 'all'
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PER_PAGE))
  const paged = filteredLeads.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setCountryFilter('all')
    setSourceFilter('all')
    setPage(1)
  }

  const updateStatus = (id: string, status: LeadStatus) => {
    updateLeadStatus(id, status)
    setStatusMenuId(null)
    setToast(`Status updated to ${status}`)
  }

  const handleCreateApplication = () => {
    if (!newApp.name || !newApp.email || !newApp.destination) return
    const normalizedEmail = newApp.email.trim().toLowerCase()
    const dbUser =
      Database.getUserByEmail(normalizedEmail)
      ?? Database.createUser({
        fullName: newApp.name.trim(),
        email: normalizedEmail,
        phone: '',
        phoneCode: '+971',
        passportCountry: 'Unknown',
        residenceCountry: 'UAE',
        residencyStatus: 'Resident',
        isVerified: false,
        profilePhoto: null,
        lastLogin: null,
      })

    const appType = newApp.source === 'B2B' ? 'b2b' : 'b2c'
    Database.createApplication({
      type: appType,
      userId: appType === 'b2c' ? String(dbUser.id) : null,
      partnerId: null,
      destination: newApp.destination.toLowerCase().replace(/\s+/g, '-'),
      destinationName: newApp.destination,
      visaOption: 'Tourist',
      travelers: [{ firstName: newApp.name.split(' ')[0] ?? newApp.name, lastName: newApp.name.split(' ').slice(1).join(' ') || '—', email: normalizedEmail }],
      travelDates: { departure: null, return: null },
      documents: [],
      status: 'new_application',
      evisaSupported: false,
      submissionMethod: 'manual',
      assignedOperator: null,
      amount: { governmentFee: 0, processingFee: 0, discount: 0, total: 0 },
      paymentStatus: 'pending',
    })
    setCreateOpen(false)
    setNewApp({ name: '', email: '', destination: '', source: 'B2C' })
    setToast('New application created')
  }

  return (
    <AdminLayout activePath={`${basePath}/leads`} title="Applications">
      <AdminToast message={toast} onClose={() => setToast(null)} />

      {/* Top 4 mini stat pills */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {statPills.map((pill) => (
          <div
            key={pill.label}
            style={{
              background: '#fff',
              borderRadius: 40,
              border: `1px solid ${BORDER}`,
              padding: '10px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            <span style={{ fontSize: 17, fontWeight: 800, color: TEXT_PRIMARY }}>{pill.value}</span>
            <span style={{ fontSize: 12, color: TEXT_SECONDARY, fontWeight: 500 }}>{pill.label}</span>
          </div>
        ))}
      </div>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 16, color: TEXT_PRIMARY }}>{filteredLeads.length} Applications</span>
          {hasFilters && (
            <span style={{ marginLeft: 8, fontSize: 13, color: TEXT_MUTED }}>(filtered)</span>
          )}
        </div>
        <button type="button" onClick={() => setCreateOpen(true)} style={primaryBtn}>+ New Application</button>
      </div>

      {/* Filter bar */}
      <div
        className="admin-toolbar"
        style={{
          ...cardStyle,
          padding: 14,
          marginBottom: 16,
        }}
      >
        <input
          placeholder="Search by name, email, destination..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setPage(1)
          }}
          style={{ ...inputStyle, flex: '1 1 220px', minWidth: 220 }}
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          style={selectStyle}
        >
          <option value="all">All Status</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={countryFilter}
          onChange={(e) => {
            setCountryFilter(e.target.value)
            setPage(1)
          }}
          style={selectStyle}
        >
          <option value="all">All Countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => {
            setSourceFilter(e.target.value)
            setPage(1)
          }}
          style={selectStyle}
        >
          <option value="all">All Sources</option>
          <option value="B2C">B2C</option>
          <option value="B2B">B2B</option>
        </select>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            style={{
              border: 'none',
              background: 'none',
              color: BRAND,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '8px 4px',
              whiteSpace: 'nowrap',
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* View toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <div
          style={{
            background: PAGE_BG,
            borderRadius: 40,
            padding: 4,
            display: 'inline-flex',
            gap: 4,
            border: `1px solid ${BORDER}`,
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode('table')}
            style={{
              border: 'none',
              borderRadius: 40,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              background: viewMode === 'table' ? '#fff' : 'transparent',
              color: viewMode === 'table' ? TEXT_PRIMARY : TEXT_SECONDARY,
              boxShadow: viewMode === 'table' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            ☰ Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            style={{
              border: 'none',
              borderRadius: 40,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              background: viewMode === 'kanban' ? '#fff' : 'transparent',
              color: viewMode === 'kanban' ? TEXT_PRIMARY : TEXT_SECONDARY,
              boxShadow: viewMode === 'kanban' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            ▦ Kanban
          </button>
        </div>
      </div>

      {filteredLeads.length === 0 ? (
        <div style={cardStyle}>
          <AdminEmptyState
            title="No applications match your filters"
            onClearFilters={hasFilters ? clearFilters : undefined}
            addLabel="+ New Application"
            onAdd={!hasFilters ? () => setCreateOpen(true) : undefined}
          />
        </div>
      ) : viewMode === 'table' ? (
        <div className="admin-table-wrap" style={{ ...cardStyle, padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {['#', 'Customer', 'Passport', 'Destination', 'Source', 'Partner', 'Status', 'Assigned', 'Created', 'Action'].map((h) => (
                  <th key={h} style={{ ...tableHeaderStyle, background: '#f8f9fc' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((lead, i) => {
                const sc = getStatusColor(lead.status)
                return (
                  <tr
                    key={lead.id}
                    style={{ borderBottom: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <td style={{ padding: 16, color: TEXT_MUTED }}>{(page - 1) * PER_PAGE + i + 1}</td>
                    <td style={{ padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <AdminAvatar name={lead.name} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{lead.name}</div>
                          <div style={{ fontSize: 12, color: TEXT_SECONDARY }}>{lead.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: 16, color: TEXT_SECONDARY }}>
                      {lead.passport !== '—' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <CountryFlag code={lead.passportCode} countryName={lead.passport} size="sm" />
                          {lead.passport}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ padding: 16 }}>{lead.destination}</td>
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
                    <td style={{ padding: 16, color: TEXT_SECONDARY, fontSize: 13 }}>
                      {lead.source === 'B2B' ? (lead.agentName ?? '—') : '—'}
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
                              onMouseEnter={(e) => { e.currentTarget.style.background = PAGE_BG }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: 16, color: TEXT_SECONDARY }}>{lead.assigned}</td>
                    <td style={{ padding: 16, color: TEXT_MUTED, fontSize: 13 }}>{lead.created}</td>
                    <td style={{ padding: 16 }}>
                      <Link
                        to={path(`/cases/${lead.id}`)}
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
                        View
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} type="button" onClick={() => setPage(p)} style={tabActive(page === p)}>
                {p}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
          {LEAD_STATUSES.map((status) => {
            const col = filteredLeads.filter((l) => l.status === status)
            const sc = getStatusColor(status)
            return (
              <div
                key={status}
                style={{
                  minWidth: 280,
                  background: '#f8f9fc',
                  borderRadius: 16,
                  padding: 16,
                  border: `1px solid ${BORDER}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: sc.color,
                      padding: '4px 10px',
                      borderRadius: 20,
                      background: sc.bg,
                      border: `1px solid ${sc.border}`,
                    }}
                  >
                    {status}
                  </span>
                  <span
                    style={{
                      background: '#fff',
                      borderRadius: 20,
                      padding: '2px 8px',
                      fontSize: 12,
                      fontWeight: 600,
                      color: TEXT_SECONDARY,
                      border: `1px solid ${BORDER}`,
                    }}
                  >
                    {col.length}
                  </span>
                </div>
                {col.map((lead) => (
                  <div
                    key={lead.id}
                    style={{
                      background: '#fff',
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 8,
                      border: `1px solid ${BORDER}`,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                      ...hoverCardProps.style,
                    }}
                    onMouseEnter={hoverCardProps.onMouseEnter}
                    onMouseLeave={hoverCardProps.onMouseLeave}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <AdminAvatar name={lead.name} size={32} />
                      <div style={{ fontWeight: 700, fontSize: 14, color: TEXT_PRIMARY }}>{lead.name}</div>
                    </div>
                    <div style={{ fontSize: 12, color: TEXT_SECONDARY }}>
                      {lead.destination} · {lead.visaType}
                    </div>
                    <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>{lead.created}</div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {createOpen && (
        <>
          <div role="presentation" onClick={() => setCreateOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', ...cardStyle, padding: 32, maxWidth: 440, width: '90%', zIndex: 2001 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>New Application</h3>
            {[
              ['name', 'Full Name', 'text'],
              ['email', 'Email', 'email'],
              ['destination', 'Destination', 'text'],
            ].map(([key, label, type]) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, color: TEXT_SECONDARY, marginBottom: 4 }}>{label}</label>
                <input type={type} value={newApp[key as keyof typeof newApp] as string} onChange={(e) => setNewApp({ ...newApp, [key]: e.target.value })} style={{ ...inputStyle, width: '100%' }} />
              </div>
            ))}
            <label style={{ display: 'block', fontSize: 13, color: TEXT_SECONDARY, marginBottom: 4 }}>Source</label>
            <select value={newApp.source} onChange={(e) => setNewApp({ ...newApp, source: e.target.value as 'B2C' | 'B2B' })} style={{ ...selectStyle, width: '100%', marginBottom: 20 }}>
              <option value="B2C">B2C</option>
              <option value="B2B">B2B</option>
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setCreateOpen(false)} style={{ ...outlineBtn, flex: 1, border: `1px solid ${BORDER}`, background: '#fff' } as typeof outlineBtn}>Cancel</button>
              <button type="button" onClick={handleCreateApplication} style={{ ...primaryBtn, flex: 1 }}>Create</button>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
