import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AgentPageShell, groupCommissionsByMonth } from '../../components/agent/AgentUI'
import { AgentLayout } from '../../components/AgentLayout'
import { Database } from '../../database/db'
import { useDatabaseListener } from '../../hooks/useDatabase'
import { AGENT_ACCENT, AGENT_CARD, AGENT_MUTED, AGENT_PRIMARY } from '../../theme/agentTheme'
import { getAgentPartnerId } from '../../utils/agentSession'
import { buildInvoiceViewUrl } from '../../utils/adminInvoiceUtils'
import { dbInvoiceToAdmin } from '../../utils/dbMappers'

export default function AgentCommissionsPage() {
  const navigate = useNavigate()
  const partnerId = getAgentPartnerId() ?? ''
  const dbVersion = useDatabaseListener()
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  const commissions = useMemo(
    () => Database.getCommissions({ partnerId }),
    [partnerId, dbVersion],
  )

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return commissions
    return commissions.filter((c) => String(c.status).toLowerCase() === statusFilter)
  }, [commissions, statusFilter])

  const stats = useMemo(() => {
    const paid = commissions.filter((c) => String(c.status).toLowerCase() === 'paid')
    const pending = commissions.filter((c) => String(c.status).toLowerCase() === 'pending')
    const thisMonth = commissions.filter((c) => String(c.createdAt).slice(0, 7) === new Date().toISOString().slice(0, 7))
    return {
      earned: commissions.reduce((s, c) => s + Number(c.commissionAmount ?? 0), 0),
      paidOut: paid.reduce((s, c) => s + Number(c.commissionAmount ?? 0), 0),
      pending: pending.reduce((s, c) => s + Number(c.commissionAmount ?? 0), 0),
      thisMonth: thisMonth.reduce((s, c) => s + Number(c.commissionAmount ?? 0), 0),
    }
  }, [commissions])

  const chartData = useMemo(() => groupCommissionsByMonth(commissions).slice(-6), [commissions])

  const downloadInvoice = (applicationId: string) => {
    const invoice = Database.getInvoices().find((inv) => String(inv.applicationId) === applicationId)
    if (invoice) {
      window.open(buildInvoiceViewUrl(dbInvoiceToAdmin(invoice as Record<string, unknown>), applicationId), '_blank')
      return
    }
    const app = Database.getApplicationById(applicationId)
    if (app) {
      navigate(`/invoice?applicationId=${applicationId}&name=${encodeURIComponent(String((app.travelers as { firstName?: string }[])?.[0]?.firstName ?? 'Customer'))}`)
    }
  }

  return (
    <AgentLayout>
      <AgentPageShell loading={loading}>
        <h1 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700, color: AGENT_PRIMARY }}>Commissions</h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Earned', value: `AED ${stats.earned.toLocaleString()}`, color: '#166534' },
            { label: 'Paid Out', value: `AED ${stats.paidOut.toLocaleString()}`, color: AGENT_ACCENT },
            { label: 'Pending', value: `AED ${stats.pending.toLocaleString()}`, color: '#a16207' },
            { label: 'This Month', value: `AED ${stats.thisMonth.toLocaleString()}`, color: AGENT_PRIMARY },
          ].map((c) => (
            <div key={c.label} style={{ background: AGENT_CARD, borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(37,99,235,0.06)', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: AGENT_MUTED }}>{c.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: c.color, marginTop: 4 }}>{c.value}</div>
            </div>
          ))}
        </div>

        {chartData.length > 0 && (
          <div style={{ background: AGENT_CARD, borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 2px 12px rgba(37,99,235,0.06)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: AGENT_PRIMARY }}>Monthly Commission Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 'auto']} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    borderRadius: 10,
                    padding: 10,
                    border: '1px solid #e2e8f0',
                  }}
                />
                <Bar dataKey="amount" fill={AGENT_ACCENT} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14, marginBottom: 16 }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
        </select>

        <div style={{ background: AGENT_CARD, borderRadius: 16, overflow: 'auto', boxShadow: '0 2px 12px rgba(37,99,235,0.06)', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 720 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Customer', 'Destination', 'Visa Fee', 'Commission AED', 'Status', 'Date', ''].map((h) => (
                  <th key={h || 'action'} style={{ textAlign: 'left', padding: '12px 16px', color: AGENT_MUTED, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 24, color: AGENT_MUTED, textAlign: 'center' }}>No commissions yet</td>
                </tr>
              ) : filtered.map((c) => {
                const isPaid = String(c.status).toLowerCase() === 'paid'
                return (
                  <tr key={String(c.id)} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: AGENT_PRIMARY }}>{String(c.customerName || '—')}</td>
                    <td style={{ padding: '12px 16px' }}>{String(c.destinationName || '—')}</td>
                    <td style={{ padding: '12px 16px' }}>AED {Number(c.visaFee ?? 0)}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#166534' }}>AED {Number(c.commissionAmount ?? 0)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: isPaid ? '#dcfce7' : '#fef3c7', color: isPaid ? '#166534' : '#a16207' }}>{String(c.status)}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: AGENT_MUTED }}>{String(c.createdAt).slice(0, 10)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        type="button"
                        onClick={() => downloadInvoice(String(c.applicationId))}
                        title="Download Invoice"
                        style={{ border: 'none', background: '#eff6ff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 14 }}
                      >
                        📄
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </AgentPageShell>
    </AgentLayout>
  )
}
