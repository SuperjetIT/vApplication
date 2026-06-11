import { useState } from 'react'
import * as XLSX from 'xlsx'
import { AdminLayout } from '../../components/AdminLayout'
import { AdminToast } from '../../components/admin/AdminToast'
import { BRAND, BRAND_BLUE, cardStyle, inputStyle, TEXT_PRIMARY, TEXT_SECONDARY } from '../../components/admin/adminTheme'
import { MOCK_AGENTS, MOCK_CUSTOMERS, MOCK_LEADS, MOCK_PAYMENTS } from '../../data/adminMockData'

const REPORTS = [
  { id: 'leads', title: 'All Leads Report', desc: 'Complete lead pipeline with status and source', color: BRAND },
  { id: 'payments', title: 'Payment Report', desc: 'All transactions with gateway details', color: BRAND_BLUE },
  { id: 'commission', title: 'Agent Commission Report', desc: 'Agent performance and commission breakdown', color: '#22c55e' },
  { id: 'customers', title: 'Customer Report', desc: 'Customer profiles and spending history', color: '#f59e0b' },
  { id: 'demand', title: 'Country Demand Report', desc: 'Visa applications by destination', color: '#8b5cf6' },
  { id: 'staff', title: 'Staff Performance Report', desc: 'Operations team metrics', color: '#06b6d4' },
]

function generateReport(reportId: string) {
  const date = new Date().toISOString().slice(0, 10)
  let data: Record<string, unknown>[] = []
  switch (reportId) {
    case 'leads': data = MOCK_LEADS.map((l) => ({ Name: l.name, Email: l.email, Destination: l.destination, Status: l.status, Source: l.source })); break
    case 'payments': data = MOCK_PAYMENTS.map((p) => ({ TxnID: p.txnId, Customer: p.customer, Amount: p.amount, Status: p.status, Date: p.date })); break
    case 'commission': data = MOCK_AGENTS.map((a) => ({ Agent: a.name, Leads: a.leads, Revenue: a.revenue, Commission: a.commission })); break
    case 'customers': data = MOCK_CUSTOMERS.map((c) => ({ Name: c.name, Email: c.email, Applications: c.applications, TotalSpent: c.totalSpent })); break
    case 'demand': data = [{ Country: 'Schengen', Applications: 89 }, { Country: 'UK', Applications: 67 }, { Country: 'USA', Applications: 54 }]; break
    case 'staff': data = [{ Staff: 'Sara M.', CasesHandled: 45, Approved: 38 }, { Staff: 'John D.', CasesHandled: 52, Approved: 41 }]; break
  }
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Report')
  XLSX.writeFile(wb, `SuperVisa_${reportId}_${date}.xlsx`)
}

export default function AdminReports() {
  const [toast, setToast] = useState<string | null>(null)

  return (
    <AdminLayout activePath="/admin/reports" title="Reports">
      <AdminToast message={toast} onClose={() => setToast(null)} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {REPORTS.map((r) => (
          <div key={r.id} style={{ ...cardStyle, padding: 28, borderLeft: `4px solid ${r.color}` }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY }}>{r.title}</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: TEXT_SECONDARY }}>{r.desc}</p>
            <input type="date" style={{ ...inputStyle, marginBottom: 12, width: '100%' }} />
            <button type="button" onClick={() => { generateReport(r.id); setToast(`${r.title} downloaded`) }} style={{ background: r.color, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer', width: '100%' }}>Generate Excel</button>
          </div>
        ))}
      </div>
    </AdminLayout>
  )
}
