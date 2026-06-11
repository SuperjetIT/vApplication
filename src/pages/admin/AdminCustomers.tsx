import { useMemo, useState } from 'react'
import { AdminLayout } from '../../components/AdminLayout'
import { AdminAvatar } from '../../components/admin/AdminAvatar'
import { AdminEmptyState } from '../../components/admin/AdminEmptyState'
import { inputStyle, cardStyle, tableHeaderStyle, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from '../../components/admin/adminTheme'
import { MOCK_CUSTOMERS } from '../../data/adminMockData'

export default function AdminCustomers() {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return MOCK_CUSTOMERS.filter(
      (c) =>
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()),
    )
  }, [search])

  return (
    <AdminLayout activePath="/admin/customers" title="Customers">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 18 }}>{filtered.length} Customers</span>
        <input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, minWidth: 240 }} />
      </div>
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <AdminEmptyState title="No customers found" onClearFilters={search ? () => setSearch('') : undefined} />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f8f9fc' }}>
                {['Customer', 'Email', 'Phone', 'Nationality', 'Applications', 'Total Spent', 'Last Active'].map((h) => (
                  <th key={h} style={tableHeaderStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f8f9fc', color: TEXT_PRIMARY }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafe' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <td style={{ padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <AdminAvatar name={c.name} />
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: 16, color: TEXT_SECONDARY }}>{c.email}</td>
                  <td style={{ padding: 16, color: TEXT_SECONDARY }}>{c.phone}</td>
                  <td style={{ padding: 16 }}>{c.nationality}</td>
                  <td style={{ padding: 16 }}>{c.applications}</td>
                  <td style={{ padding: 16, fontWeight: 600 }}>AED {c.totalSpent.toLocaleString()}</td>
                  <td style={{ padding: 16, color: TEXT_MUTED, fontSize: 13 }}>{c.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  )
}
