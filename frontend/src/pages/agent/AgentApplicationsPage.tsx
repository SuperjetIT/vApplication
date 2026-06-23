import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AgentPageShell, StatusProgressBar } from '../../components/agent/AgentUI'
import { AgentLayout } from '../../components/AgentLayout'
import { AGENT_BASE_PATH } from '../../config/portalRoutes'
import { Database } from '../../database/db'
import { useDatabaseListener } from '../../hooks/useDatabase'
import { AGENT_ACCENT, AGENT_CARD, AGENT_MUTED, AGENT_PRIMARY } from '../../theme/agentTheme'
import { getAgentPartnerId } from '../../utils/agentSession'

function statusStyle(status: string) {
  const s = status.toLowerCase()
  if (s === 'approved') return { bg: '#dcfce7', color: '#166534' }
  if (s === 'rejected') return { bg: '#fee2e2', color: '#dc2626' }
  if (s.includes('pending')) return { bg: '#fef3c7', color: '#a16207' }
  return { bg: '#eff6ff', color: AGENT_ACCENT }
}

export default function AgentApplicationsPage() {
  const navigate = useNavigate()
  const partnerId = getAgentPartnerId() ?? ''
  const dbVersion = useDatabaseListener()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [destFilter, setDestFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(t)
  }, [search])

  const myApps = useMemo(
    () => Database.getApplications({ partnerId, type: 'b2b' }),
    [partnerId, dbVersion],
  )
  const commissions = useMemo(
    () => Database.getCommissions({ partnerId }),
    [partnerId, dbVersion],
  )

  const destinations = useMemo(
    () => [...new Set(myApps.map((a) => String(a.destinationName ?? a.destination)))],
    [myApps],
  )

  const filtered = useMemo(() => {
    return myApps.filter((app) => {
      const travelers = app.travelers as { firstName?: string; lastName?: string }[] | undefined
      const name = travelers?.[0] ? `${travelers[0].firstName ?? ''} ${travelers[0].lastName ?? ''}`.trim().toLowerCase() : ''
      const matchSearch = !debouncedSearch || name.includes(debouncedSearch.toLowerCase())
      const matchStatus = statusFilter === 'all' || String(app.status).toLowerCase() === statusFilter
      const matchDest = destFilter === 'all' || String(app.destinationName ?? app.destination) === destFilter
      return matchSearch && matchStatus && matchDest
    })
  }, [myApps, debouncedSearch, statusFilter, destFilter])

  return (
    <AgentLayout>
      <AgentPageShell loading={loading}>
        <h1 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700, color: AGENT_PRIMARY }}>My Applications</h1>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <input
            placeholder="Search by customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: '10px 14px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14 }}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14 }}>
            <option value="all">All Status</option>
            <option value="pending_docs">Pending Docs</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={destFilter} onChange={(e) => setDestFilter(e.target.value)} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14 }}>
            <option value="all">All Destinations</option>
            {destinations.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div style={{ background: AGENT_CARD, borderRadius: 16, padding: 48, textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <p style={{ color: AGENT_MUTED, margin: '0 0 16px' }}>No applications yet</p>
            <button type="button" onClick={() => navigate(`${AGENT_BASE_PATH}/apply`)} style={{ background: AGENT_ACCENT, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 700, cursor: 'pointer' }}>Submit your first application →</button>
          </div>
        ) : (
          <div style={{ background: AGENT_CARD, borderRadius: 16, overflow: 'auto', boxShadow: '0 2px 12px rgba(37,99,235,0.06)', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 800 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Customer', 'Destination', 'Progress', 'Status', 'Your Cost', 'Commission', 'Applied', ''].map((h) => (
                    <th key={h || 'action'} style={{ textAlign: 'left', padding: '12px 16px', color: AGENT_MUTED, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => {
                  const travelers = app.travelers as { firstName?: string; lastName?: string }[] | undefined
                  const name = travelers?.[0] ? `${travelers[0].firstName ?? ''} ${travelers[0].lastName ?? ''}`.trim() : 'Customer'
                  const amt = (app.amount as { total?: number })?.total ?? 0
                  const comm = commissions.find((c) => String(c.applicationId) === String(app.id))
                  const sc = statusStyle(String(app.status))
                  return (
                    <tr key={String(app.id)} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: AGENT_PRIMARY }}>{name}</td>
                      <td style={{ padding: '12px 16px' }}>{String(app.destinationName ?? app.destination)}</td>
                      <td style={{ padding: '12px 16px' }}><StatusProgressBar status={String(app.status)} /></td>
                      <td style={{ padding: '12px 16px' }}><span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>{String(app.status)}</span></td>
                      <td style={{ padding: '12px 16px' }}>AED {Number(amt).toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', color: '#166534', fontWeight: 600 }}>AED {Number(comm?.commissionAmount ?? 0).toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', color: AGENT_MUTED }}>{String(app.createdAt).slice(0, 10)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <Link to={`${AGENT_BASE_PATH}/applications/${app.id}`} style={{ color: AGENT_ACCENT, fontWeight: 600, textDecoration: 'none' }}>View</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </AgentPageShell>
    </AgentLayout>
  )
}
