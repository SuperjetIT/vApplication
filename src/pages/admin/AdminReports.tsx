import { useState } from 'react'
import * as XLSX from 'xlsx'
import { AdminLayout } from '../../components/AdminLayout'
import { AdminToast } from '../../components/admin/AdminToast'
import { BRAND, BRAND_BLUE, BORDER, cardStyle, hoverCardProps, inputStyle, PAGE_BG, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from '../../components/admin/adminTheme'
import { MOCK_AGENTS, MOCK_CUSTOMERS, MOCK_LEADS, MOCK_PAYMENTS } from '../../data/adminMockData'

const REPORTS = [
  { id: 'leads', title: 'All Applications Report', desc: 'Complete application pipeline with status and source', gradient: `linear-gradient(90deg, ${BRAND}, #ff6b6b)`, icon: '📋', iconBg: 'linear-gradient(135deg,#fff0f0,#ffe4e4)' },
  { id: 'payments', title: 'Payment Report', desc: 'All transactions with gateway details', gradient: `linear-gradient(90deg, ${BRAND_BLUE}, #818cf8)`, icon: '💳', iconBg: 'linear-gradient(135deg,#f0f0ff,#e4e4ff)' },
  { id: 'commission', title: 'Partner Commission Report', desc: 'B2B Partner performance and commission breakdown', gradient: 'linear-gradient(90deg, #22c55e, #4ade80)', icon: '🤝', iconBg: 'linear-gradient(135deg,#f0fff4,#dcfce7)' },
  { id: 'customers', title: 'B2C User Report', desc: 'B2C User profiles and spending history', gradient: 'linear-gradient(90deg, #f59e0b, #fbbf24)', icon: '👥', iconBg: 'linear-gradient(135deg,#fff8e1,#fff3c4)' },
  { id: 'demand', title: 'Country Demand Report', desc: 'Visa applications by destination', gradient: 'linear-gradient(90deg, #8b5cf6, #a78bfa)', icon: '🌍', iconBg: 'linear-gradient(135deg,#f5f0ff,#ede9fe)' },
  { id: 'staff', title: 'Staff Performance Report', desc: 'Operations team metrics', gradient: 'linear-gradient(90deg, #06b6d4, #22d3ee)', icon: '📊', iconBg: 'linear-gradient(135deg,#ecfeff,#cffafe)' },
]

const GREEN_BTN: React.CSSProperties = {
  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '12px 20px',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  width: '100%',
  boxShadow: '0 4px 12px rgba(34,197,94,0.25)',
}

function generateReport(reportId: string) {
  const date = new Date().toISOString().slice(0, 10)
  let data: Record<string, unknown>[] = []
  switch (reportId) {
    case 'leads': data = MOCK_LEADS.map((l) => ({ Name: l.name, Email: l.email, Destination: l.destination, Status: l.status, Source: l.source })); break
    case 'payments': data = MOCK_PAYMENTS.map((p) => ({ TxnID: p.txnId, 'B2C User': p.customer, Amount: p.amount, Status: p.status, Date: p.date })); break
    case 'commission': data = MOCK_AGENTS.map((a) => ({ 'B2B Partner': a.name, Applications: a.leads, Revenue: a.revenue, 'Partner Commission': a.commission })); break
    case 'customers': data = MOCK_CUSTOMERS.map((c) => ({ Name: c.name, Email: c.email, Applications: c.applications, TotalSpent: c.totalSpent })); break
    case 'demand': data = [{ Country: 'Schengen', Applications: 89 }, { Country: 'UK', Applications: 67 }, { Country: 'USA', Applications: 54 }]; break
    case 'staff': data = [{ Staff: 'Sara M.', 'Applications Handled': 45, Approved: 38 }, { Staff: 'John D.', 'Applications Handled': 52, Approved: 41 }]; break
  }
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Report')
  XLSX.writeFile(wb, `SuperVisa_${reportId}_${date}.xlsx`)
}

export default function AdminReports() {
  const [toast, setToast] = useState<string | null>(null)
  const [dateRanges, setDateRanges] = useState<Record<string, { from: string; to: string }>>({})
  const [lastGenerated, setLastGenerated] = useState<Record<string, string>>({})

  const getRange = (id: string) => dateRanges[id] ?? { from: '', to: '' }

  const updateRange = (id: string, field: 'from' | 'to', value: string) => {
    setDateRanges((prev) => ({
      ...prev,
      [id]: { ...getRange(id), [field]: value },
    }))
  }

  const handleGenerate = (reportId: string, title: string) => {
    generateReport(reportId)
    const now = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    setLastGenerated((prev) => ({ ...prev, [reportId]: now }))
    setToast(`${title} downloaded`)
  }

  return (
    <AdminLayout activePath="/admin/reports" title="Reports">
      <AdminToast message={toast} onClose={() => setToast(null)} />

      <p style={{ margin: '0 0 24px', fontSize: 14, color: TEXT_SECONDARY }}>Export data to Excel with custom date ranges</p>

      <div className="admin-grid-3">
        {REPORTS.map((r) => {
          const range = getRange(r.id)
          return (
            <div
              key={r.id}
              style={{
                ...cardStyle,
                padding: 0,
                overflow: 'hidden',
                ...hoverCardProps.style,
              }}
              onMouseEnter={hoverCardProps.onMouseEnter}
              onMouseLeave={hoverCardProps.onMouseLeave}
            >
              <div style={{ height: 4, background: r.gradient }} />
              <div style={{ padding: 28 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: r.iconBg,
                    border: `1px solid ${BORDER}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    flexShrink: 0,
                  }}>
                    {r.icon}
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY }}>{r.title}</h3>
                    <p style={{ margin: 0, fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.5 }}>{r.desc}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: TEXT_MUTED, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>From</label>
                    <input type="date" value={range.from} onChange={(e) => updateRange(r.id, 'from', e.target.value)} style={{ ...inputStyle, width: '100%', padding: '10px 12px', fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: TEXT_MUTED, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>To</label>
                    <input type="date" value={range.to} onChange={(e) => updateRange(r.id, 'to', e.target.value)} style={{ ...inputStyle, width: '100%', padding: '10px 12px', fontSize: 13 }} />
                  </div>
                </div>

                {lastGenerated[r.id] && (
                  <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 12, padding: '8px 12px', background: PAGE_BG, borderRadius: 8, border: `1px solid ${BORDER}` }}>
                    Last generated: <span style={{ color: TEXT_SECONDARY, fontWeight: 500 }}>{lastGenerated[r.id]}</span>
                  </div>
                )}

                <button type="button" onClick={() => handleGenerate(r.id, r.title)} style={GREEN_BTN}>
                  Generate Excel
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </AdminLayout>
  )
}
