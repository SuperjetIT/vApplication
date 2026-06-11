import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { AdminLayout } from '../../components/AdminLayout'
import { AdminEmptyState } from '../../components/admin/AdminEmptyState'
import { AdminToast } from '../../components/admin/AdminToast'
import { BRAND, BRAND_BLUE, inputStyle, cardStyle, PAGE_BG, secondaryBtn, tableHeaderStyle, tabActive, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from '../../components/admin/adminTheme'
import { MOCK_INVOICES, getInvoiceStatusStyle, type AdminInvoice, type InvoiceStatus } from '../../data/adminMockData'

const TABS = ['all', 'paid', 'unpaid', 'overdue', 'refunded'] as const

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<AdminInvoice[]>(MOCK_INVOICES)
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchTab = activeTab === 'all' || inv.status.toLowerCase() === activeTab
      const q = searchQuery.toLowerCase()
      const matchSearch = searchQuery === '' || inv.invoiceNo.toLowerCase().includes(q) || inv.customer.toLowerCase().includes(q)
      const matchFrom = !dateFrom || inv.date >= dateFrom
      const matchTo = !dateTo || inv.date <= dateTo
      return matchTab && matchSearch && matchFrom && matchTo
    })
  }, [invoices, activeTab, searchQuery, dateFrom, dateTo])

  const hasFilters = activeTab !== 'all' || searchQuery || dateFrom || dateTo

  const markPaid = (id: string) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status: 'PAID' as InvoiceStatus } : inv)))
    setToast('Invoice marked as paid')
  }

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredInvoices.map((i) => ({ Invoice: i.invoiceNo, Customer: i.customer, Amount: i.amount, Status: i.status, Date: i.date })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices')
    XLSX.writeFile(wb, `SuperVisa_Invoices_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const summary = {
    total: { count: invoices.length, amount: invoices.reduce((s, i) => s + i.amount, 0) },
    paid: invoices.filter((i) => i.status === 'PAID'),
    unpaid: invoices.filter((i) => i.status === 'UNPAID'),
    overdue: invoices.filter((i) => i.status === 'OVERDUE'),
  }

  return (
    <AdminLayout activePath="/admin/invoices" title="Invoices">
      <AdminToast message={toast} onClose={() => setToast(null)} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Invoices', count: summary.total.count, amount: summary.total.amount, color: BRAND_BLUE, border: BRAND_BLUE },
          { label: 'Paid', count: summary.paid.length, amount: summary.paid.reduce((s, i) => s + i.amount, 0), color: '#22c55e', border: '#22c55e' },
          { label: 'Unpaid', count: summary.unpaid.length, amount: summary.unpaid.reduce((s, i) => s + i.amount, 0), color: '#f59e0b', border: '#f59e0b' },
          { label: 'Overdue', count: summary.overdue.length, amount: summary.overdue.reduce((s, i) => s + i.amount, 0), color: '#ef4444', border: '#ef4444' },
        ].map((s) => (
          <div key={s.label} style={{ ...cardStyle, padding: 20, borderTop: `4px solid ${s.border}` }}>
            <div style={{ fontSize: 13, color: TEXT_SECONDARY }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.count}</div>
            <div style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 4 }}>AED {s.amount.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setActiveTab(t)} style={tabActive(activeTab === t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input placeholder="Search invoice # or customer..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={inputStyle} />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={inputStyle} />
        <button type="button" onClick={exportExcel} style={secondaryBtn}>Export Excel</button>
      </div>

      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        {filteredInvoices.length === 0 ? (
          <AdminEmptyState title="No invoices found" onClearFilters={hasFilters ? () => { setActiveTab('all'); setSearchQuery(''); setDateFrom(''); setDateTo('') } : undefined} />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${PAGE_BG}` }}>
                {['Invoice #', 'Customer', 'Destination', 'Amount', 'Gov Fee', 'Processing', 'Status', 'Date', 'Action'].map((h) => (
                  <th key={h} style={tableHeaderStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => {
                const st = getInvoiceStatusStyle(inv.status)
                return (
                  <tr key={inv.id} style={{ borderBottom: `1px solid ${PAGE_BG}`, color: TEXT_PRIMARY }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafe' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <td style={{ padding: 16 }}>
                      <a href={`/invoice?no=${inv.invoiceNo}`} target="_blank" rel="noreferrer" style={{ color: BRAND_BLUE, fontWeight: 600, textDecoration: 'none' }}>{inv.invoiceNo}</a>
                    </td>
                    <td style={{ padding: 16, fontWeight: 500 }}>{inv.customer}</td>
                    <td style={{ padding: 16 }}>{inv.destination}</td>
                    <td style={{ padding: 16, fontWeight: 600 }}>AED {inv.amount}</td>
                    <td style={{ padding: 16, color: TEXT_SECONDARY }}>AED {inv.govFee}</td>
                    <td style={{ padding: 16, color: TEXT_SECONDARY }}>AED {inv.processingFee}</td>
                    <td style={{ padding: 16 }}>
                      <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{inv.status}</span>
                    </td>
                    <td style={{ padding: 16, color: TEXT_MUTED }}>{inv.date}</td>
                    <td style={{ padding: 16 }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <a href={`/invoice?no=${inv.invoiceNo}`} target="_blank" rel="noreferrer" style={{ color: BRAND, fontWeight: 600, textDecoration: 'none', fontSize: 13 }}>View</a>
                        {(inv.status === 'UNPAID' || inv.status === 'OVERDUE') && (
                          <button type="button" onClick={() => markPaid(inv.id)} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>Mark Paid</button>
                        )}
                        {inv.status === 'OVERDUE' && (
                          <button type="button" onClick={() => window.open('https://wa.me/971559641020', '_blank')} style={{ background: 'transparent', border: '1px solid #25d366', color: '#25d366', borderRadius: 8, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>Reminder</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  )
}
