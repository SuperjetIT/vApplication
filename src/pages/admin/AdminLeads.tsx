import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminLayout } from '../../components/AdminLayout'
import { AdminAvatar } from '../../components/admin/AdminAvatar'
import { AdminEmptyState } from '../../components/admin/AdminEmptyState'
import { AdminToast } from '../../components/admin/AdminToast'
import { BRAND, BORDER, inputStyle, selectStyle, cardStyle, outlineBtn, PAGE_BG, primaryBtn, tableHeaderStyle, tabActive, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from '../../components/admin/adminTheme'
import {
  LEAD_STATUSES,
  MOCK_LEADS,
  getStatusColor,
  getUniqueDestinations,
  type AdminLead,
  type LeadStatus,
} from '../../data/adminMockData'

const PER_PAGE = 10

export default function AdminLeads() {
  const [leads, setLeads] = useState<AdminLead[]>(MOCK_LEADS)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')
  const [page, setPage] = useState(1)
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

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
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)))
    setStatusMenuId(null)
    setToast(`Status updated to ${status}`)
  }

  return (
    <AdminLayout activePath="/admin/leads" title="Leads">
      <AdminToast message={toast} onClose={() => setToast(null)} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 18, color: TEXT_PRIMARY }}>{filteredLeads.length} Leads</span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input placeholder="Search by name, email, destination..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }} style={{ ...inputStyle, minWidth: 220 }} />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} style={selectStyle}>
            <option value="all">All Status</option>
            {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={countryFilter} onChange={(e) => { setCountryFilter(e.target.value); setPage(1) }} style={selectStyle}>
            <option value="all">All Countries</option>
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setPage(1) }} style={selectStyle}>
            <option value="all">All Sources</option>
            <option value="B2C">B2C</option>
            <option value="B2B">B2B</option>
          </select>
          <button type="button" style={primaryBtn}>+ New Lead</button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 12 }}>
        <button type="button" onClick={() => setViewMode('kanban')} style={{ ...outlineBtn, padding: 8, border: viewMode === 'kanban' ? `2px solid ${BRAND}` : outlineBtn.border }}>▦</button>
        <button type="button" onClick={() => setViewMode('table')} style={{ ...outlineBtn, padding: 8, border: viewMode === 'table' ? `2px solid ${BRAND}` : outlineBtn.border }}>☰</button>
      </div>

      {filteredLeads.length === 0 ? (
        <div style={cardStyle}>
          <AdminEmptyState title="No leads match your filters" onClearFilters={hasFilters ? clearFilters : undefined} addLabel="+ New Lead" onAdd={!hasFilters ? () => {} : undefined} />
        </div>
      ) : viewMode === 'table' ? (
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {['#', 'Customer', 'Passport', 'Destination', 'Source', 'Status', 'Assigned', 'Created', 'Action'].map((h) => (
                  <th key={h} style={tableHeaderStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((lead, i) => {
                const sc = getStatusColor(lead.status)
                return (
                  <tr key={lead.id} style={{ borderBottom: `1px solid ${PAGE_BG}`, color: TEXT_PRIMARY }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafe' }}
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
                    <td style={{ padding: 16, color: TEXT_SECONDARY }}>{lead.passport}</td>
                    <td style={{ padding: 16 }}>{lead.destination}</td>
                    <td style={{ padding: 16 }}>
                      <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, background: lead.source === 'B2C' ? '#eef4ff' : '#fff0f0', color: lead.source === 'B2C' ? '#5057ea' : BRAND, border: `1px solid ${lead.source === 'B2C' ? '#bfdbfe' : '#fce7e7'}` }}>{lead.source}</span>
                    </td>
                    <td style={{ padding: 16, position: 'relative' }}>
                      <button type="button" onClick={() => setStatusMenuId(statusMenuId === lead.id ? null : lead.id)} style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, cursor: 'pointer' }}>{lead.status}</button>
                      {statusMenuId === lead.id && (
                        <div style={{ position: 'absolute', top: 48, left: 16, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, zIndex: 50, minWidth: 160, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
                          {LEAD_STATUSES.map((s) => (
                            <button key={s} type="button" onClick={() => updateStatus(lead.id, s)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', background: 'none', color: TEXT_PRIMARY, fontSize: 13, cursor: 'pointer' }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = PAGE_BG }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
                            >{s}</button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: 16, color: TEXT_SECONDARY }}>{lead.assigned}</td>
                    <td style={{ padding: 16, color: TEXT_MUTED, fontSize: 13 }}>{lead.created}</td>
                    <td style={{ padding: 16 }}>
                      <Link to={`/admin/cases/${lead.id}`} style={{ color: BRAND, fontWeight: 600, textDecoration: 'none' }}>View</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} type="button" onClick={() => setPage(p)} style={tabActive(page === p)}>{p}</button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
          {LEAD_STATUSES.map((status) => {
            const col = filteredLeads.filter((l) => l.status === status)
            return (
              <div key={status} style={{ minWidth: 280, background: PAGE_BG, borderRadius: 16, padding: 16, border: `1px solid ${BORDER}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: TEXT_PRIMARY }}>{status}</span>
                  <span style={{ background: '#fff', borderRadius: 20, padding: '2px 8px', fontSize: 12, border: `1px solid ${BORDER}` }}>{col.length}</span>
                </div>
                {col.map((lead) => (
                  <div key={lead.id} style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 8, border: `1px solid ${BORDER}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'transform 0.15s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <AdminAvatar name={lead.name} size={32} />
                      <div style={{ fontWeight: 700, fontSize: 14, color: TEXT_PRIMARY }}>{lead.name}</div>
                    </div>
                    <div style={{ fontSize: 12, color: TEXT_SECONDARY }}>{lead.destination} · {lead.visaType}</div>
                    <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>{lead.created}</div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </AdminLayout>
  )
}
