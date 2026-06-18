import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AgentLayout } from '../../components/AgentLayout'
import { Database } from '../../database/db'
import { getAgentPartnerId } from '../../utils/agentSession'

const BRAND = '#f93e42'

export default function AgentCommissionsPage() {
  const partnerId = getAgentPartnerId() ?? ''
  const [statusFilter, setStatusFilter] = useState('all')
  const commissions = Database.getCommissions({ partnerId })
  const applications = Database.getApplications({ partnerId, type: 'b2b' })

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

  const chartData = useMemo(() => {
    const months: Record<string, number> = {}
    commissions.forEach((c) => {
      const m = String(c.createdAt).slice(0, 7)
      months[m] = (months[m] ?? 0) + Number(c.commissionAmount ?? 0)
    })
    return Object.entries(months).sort().slice(-6).map(([month, amount]) => ({ month, amount }))
  }, [commissions])

  const getCustomerName = (appId: string) => {
    const app = applications.find((a) => String(a.id) === appId)
    const t = app?.travelers as { firstName?: string; lastName?: string }[] | undefined
    return t?.[0] ? `${t[0].firstName ?? ''} ${t[0].lastName ?? ''}`.trim() : 'Customer'
  }

  const getDestination = (appId: string) => {
    const app = applications.find((a) => String(a.id) === appId)
    return String(app?.destinationName ?? app?.destination ?? '—')
  }

  return (
    <AgentLayout>
      <h1 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700 }}>Commissions</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Earned', value: `AED ${stats.earned.toLocaleString()}`, color: '#166534' },
          { label: 'Paid Out', value: `AED ${stats.paidOut.toLocaleString()}`, color: '#5057ea' },
          { label: 'Pending', value: `AED ${stats.pending.toLocaleString()}`, color: '#a16207' },
          { label: 'This Month', value: `AED ${stats.thisMonth.toLocaleString()}`, color: BRAND },
        ].map((c) => (
          <div key={c.label} style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 12, color: '#888' }}>{c.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: c.color, marginTop: 4 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {chartData.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Monthly Commission Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="amount" fill={BRAND} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 14, marginBottom: 16 }}>
        <option value="all">All Status</option>
        <option value="pending">Pending</option>
        <option value="paid">Paid</option>
      </select>

      <div style={{ background: '#fff', borderRadius: 16, overflow: 'auto', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 700 }}>
          <thead>
            <tr style={{ background: '#f8f9fc', borderBottom: '1px solid #eee' }}>
              {['Customer', 'Destination', 'Visa Fee', 'Rate %', 'Commission', 'Status', 'Date'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#888', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const isPaid = String(c.status).toLowerCase() === 'paid'
              return (
                <tr key={String(c.id)} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '12px 16px' }}>{getCustomerName(String(c.applicationId))}</td>
                  <td style={{ padding: '12px 16px' }}>{getDestination(String(c.applicationId))}</td>
                  <td style={{ padding: '12px 16px' }}>AED {Number(c.visaFee ?? 0)}</td>
                  <td style={{ padding: '12px 16px' }}>{Number(c.commissionRate ?? 0)}%</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>AED {Number(c.commissionAmount ?? 0)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: isPaid ? '#dcfce7' : '#fef3c7', color: isPaid ? '#166534' : '#a16207' }}>{String(c.status)}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#888' }}>{String(c.createdAt).slice(0, 10)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </AgentLayout>
  )
}
