import { useMemo, useState } from 'react'
import { AdminLayout } from '../../components/AdminLayout'
import { AdminAvatar } from '../../components/admin/AdminAvatar'
import { AdminEmptyState } from '../../components/admin/AdminEmptyState'
import { BRAND, BORDER, cardStyle, tabActive, tableHeaderStyle, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from '../../components/admin/adminTheme'
import { MOCK_PAYMENTS, type AdminPayment, type PaymentStatus } from '../../data/adminMockData'

const STATUS_OPTS = ['all', 'Success', 'Pending', 'Failed', 'Refunded'] as const
const METHOD_OPTS = ['all', 'Card', 'Bank Transfer', 'Wallet'] as const

function StatusIcon({ status }: { status: PaymentStatus }) {
  const colors: Record<PaymentStatus, string> = { Success: '#22c55e', Pending: '#f59e0b', Failed: '#ef4444', Refunded: '#8b5cf6' }
  return <span style={{ color: colors[status] }}>{status === 'Success' ? '✓' : status === 'Pending' ? '⏱' : status === 'Failed' ? '✕' : '↩'}</span>
}

export default function AdminPayments() {
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTS)[number]>('all')
  const [methodFilter, setMethodFilter] = useState<(typeof METHOD_OPTS)[number]>('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null)

  const filteredPayments = useMemo(() => {
    return MOCK_PAYMENTS.filter((p) => {
      const matchStatus = statusFilter === 'all' || p.status === statusFilter
      const matchMethod = methodFilter === 'all' || p.method === methodFilter
      return matchStatus && matchMethod
    })
  }, [statusFilter, methodFilter])

  const openDrawer = (p: AdminPayment) => {
    setSelectedPayment(p)
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    window.setTimeout(() => setSelectedPayment(null), 300)
  }

  const hasFilters = statusFilter !== 'all' || methodFilter !== 'all'

  return (
    <AdminLayout activePath="/admin/payments" title="Payments">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Collected', value: 'AED 112,500' },
          { label: 'This Month', value: 'AED 38,500' },
          { label: 'Pending', value: 'AED 24,800' },
          { label: 'Refunds', value: 'AED 2,100' },
        ].map((c) => (
          <div key={c.label} style={{ ...cardStyle, padding: 20 }}>
            <div style={{ fontSize: 13, color: TEXT_SECONDARY }}>{c.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ ...cardStyle, padding: 16, marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: TEXT_SECONDARY }}>Status:</span>
        {STATUS_OPTS.map((s) => (
          <button key={s} type="button" onClick={() => setStatusFilter(s)} style={tabActive(statusFilter === s)}>{s}</button>
        ))}
        <span style={{ marginLeft: 12, fontSize: 13, color: TEXT_SECONDARY }}>Method:</span>
        {METHOD_OPTS.map((m) => (
          <button key={m} type="button" onClick={() => setMethodFilter(m)} style={tabActive(methodFilter === m)}>{m}</button>
        ))}
      </div>

      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        {filteredPayments.length === 0 ? (
          <AdminEmptyState title="No payments found" onClearFilters={hasFilters ? () => { setStatusFilter('all'); setMethodFilter('all') } : undefined} />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f8f9fc' }}>
                {['Txn ID', 'Customer', 'Amount', 'Method', 'Gateway', 'Status', 'Date', 'Invoice'].map((h) => (
                  <th key={h} style={tableHeaderStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((p) => (
                <tr key={p.id} onClick={() => openDrawer(p)} style={{ borderBottom: '1px solid #f8f9fc', cursor: 'pointer', color: TEXT_PRIMARY }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafe' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <td style={{ padding: 16, fontFamily: 'monospace', fontSize: 13 }}>#{p.txnId}</td>
                  <td style={{ padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <AdminAvatar name={p.customer} size={32} />
                      <span style={{ fontWeight: 500 }}>{p.customer}</span>
                    </div>
                  </td>
                  <td style={{ padding: 16, fontWeight: 600 }}>AED {p.amount}</td>
                  <td style={{ padding: 16, fontSize: 13, color: TEXT_SECONDARY }}>{p.methodDetail}</td>
                  <td style={{ padding: 16 }}>
                    <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 12, background: p.gateway === 'Stripe' ? 'rgba(139,92,246,0.2)' : 'rgba(59,130,246,0.2)', color: p.gateway === 'Stripe' ? '#c4b5fd' : '#93c5fd' }}>{p.gateway}</span>
                  </td>
                  <td style={{ padding: 16 }}><StatusIcon status={p.status} /> {p.status}</td>
                  <td style={{ padding: 16, color: TEXT_MUTED, fontSize: 13 }}>{p.date}</td>
                  <td style={{ padding: 16, color: '#818cf8' }}>{p.invoiceNo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {drawerOpen && (
        <div role="presentation" onClick={closeDrawer} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998 }} />
      )}
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: 420,
        background: '#fff', borderLeft: `1px solid ${BORDER}`, boxShadow: '-8px 0 32px rgba(0,0,0,0.08)',
        transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease', zIndex: 9999, padding: 32, overflowY: 'auto',
      }}>
        {selectedPayment && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Transaction Detail</h3>
              <button type="button" onClick={closeDrawer} style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer', color: TEXT_MUTED }}>×</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <AdminAvatar name={selectedPayment.customer} size={48} />
              <div>
                <div style={{ fontWeight: 600 }}>{selectedPayment.customer}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 13, color: TEXT_MUTED }}>#{selectedPayment.txnId}</div>
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: BRAND, marginBottom: 20 }}>AED {selectedPayment.amount}</div>
            <div style={{ ...cardStyle, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Breakdown</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4, color: TEXT_SECONDARY }}><span>Processing fee</span><span>AED {(selectedPayment.amount * 0.15).toFixed(0)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: TEXT_SECONDARY }}><span>Gov fee</span><span>AED {(selectedPayment.amount * 0.85).toFixed(0)}</span></div>
            </div>
            <div style={{ marginBottom: 12 }}><span style={{ fontSize: 12, color: TEXT_MUTED }}>Gateway</span><div style={{ color: TEXT_PRIMARY }}>{selectedPayment.gateway} — {selectedPayment.methodDetail}</div></div>
            <div style={{ marginBottom: 12 }}><span style={{ fontSize: 12, color: TEXT_MUTED }}>Status</span><div style={{ fontWeight: 600, color: TEXT_PRIMARY }}>{selectedPayment.status}</div></div>
            <div>
              <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 8 }}>Timeline</div>
              <div style={{ borderLeft: `2px solid ${BORDER}`, paddingLeft: 16 }}>
                {['Payment initiated', 'Gateway response received', selectedPayment.status === 'Success' ? 'Payment confirmed' : 'Awaiting confirmation'].map((step) => (
                  <div key={step} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY }}>{step}</div>
                    <div style={{ fontSize: 11, color: TEXT_MUTED }}>{selectedPayment.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
