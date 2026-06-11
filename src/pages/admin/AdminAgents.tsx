import { AdminLayout } from '../../components/AdminLayout'
import { AdminAvatar } from '../../components/admin/AdminAvatar'
import { BRAND, cardStyle, primaryBtn, tableHeaderStyle, TEXT_PRIMARY, TEXT_SECONDARY } from '../../components/admin/adminTheme'
import { MOCK_AGENTS } from '../../data/adminMockData'

export default function AdminAgents() {
  return (
    <AdminLayout activePath="/admin/agents" title="Agents">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <span style={{ fontWeight: 700, fontSize: 18 }}>{MOCK_AGENTS.length} Agents</span>
        <button type="button" style={primaryBtn}>+ Add Agent</button>
      </div>
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f8f9fc' }}>
              {['Agent', 'Email', 'Leads', 'Revenue', 'Commission', 'Status', 'Actions'].map((h) => (
                <th key={h} style={tableHeaderStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_AGENTS.map((a) => (
              <tr key={a.id} style={{ borderBottom: '1px solid #f8f9fc', color: TEXT_PRIMARY }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafe' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <td style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AdminAvatar name={a.name} />
                    <span style={{ fontWeight: 600 }}>{a.name}</span>
                  </div>
                </td>
                <td style={{ padding: 16, color: TEXT_SECONDARY }}>{a.email}</td>
                <td style={{ padding: 16 }}>{a.leads}</td>
                <td style={{ padding: 16, fontWeight: 600 }}>AED {a.revenue.toLocaleString()}</td>
                <td style={{ padding: 16, color: '#22c55e', fontWeight: 600 }}>AED {a.commission}</td>
                <td style={{ padding: 16 }}>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, background: a.status === 'Active' ? '#f0fff4' : '#f8f9fc', color: a.status === 'Active' ? '#22c55e' : '#9ca3af', border: `1px solid ${a.status === 'Active' ? '#bbf7d0' : '#e5e7eb'}` }}>{a.status}</span>
                </td>
                <td style={{ padding: 16 }}>
                  <button type="button" style={{ border: 'none', background: 'none', color: BRAND, cursor: 'pointer', fontWeight: 600 }}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  )
}
