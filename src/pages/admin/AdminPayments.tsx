import { useMemo, useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import { AdminLayout } from '../../components/AdminLayout'
import { AdminAvatar } from '../../components/admin/AdminAvatar'
import { AdminEmptyState } from '../../components/admin/AdminEmptyState'
import { AdminToast } from '../../components/admin/AdminToast'
import {
  BRAND,
  BRAND_BLUE,
  BORDER,
  DANGER,
  PAGE_BG,
  PURPLE,
  SUCCESS,
  WARNING,
  cardStyle,
  pillTab,
  tableHeaderStyle,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from '../../components/admin/adminTheme'
import { MOCK_PAYMENTS, type AdminPayment, type PaymentStatus } from '../../data/adminMockData'

const STATUS_OPTS = ['all', 'Success', 'Pending', 'Failed', 'Refunded'] as const
const METHOD_OPTS = ['all', 'Card', 'Bank Transfer', 'Wallet'] as const

const STATUS_ACTIVE_COLORS: Record<(typeof STATUS_OPTS)[number], string> = {
  all: BRAND_BLUE,
  Success: SUCCESS,
  Pending: WARNING,
  Failed: DANGER,
  Refunded: PURPLE,
}

function statusFilterPill(opt: (typeof STATUS_OPTS)[number], active: boolean): CSSProperties {
  if (!active) return pillTab(false)
  const bg = STATUS_ACTIVE_COLORS[opt]
  return {
    ...pillTab(true),
    background: bg,
    boxShadow: `0 2px 8px ${bg}33`,
  }
}

function gatewayPill(gateway: 'Stripe' | 'Bank'): CSSProperties {
  if (gateway === 'Stripe') {
    return {
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 500,
      background: '#f5f3ff',
      color: '#7c3aed',
      border: '1px solid #e9d5ff',
    }
  }
  return {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
    background: '#eff6ff',
    color: '#2563eb',
    border: '1px solid #bfdbfe',
  }
}

function methodPill(_method: string): CSSProperties {
  return {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
    background: PAGE_BG,
    color: TEXT_SECONDARY,
    border: `1px solid ${BORDER}`,
  }
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const config: Record<PaymentStatus, { icon: string; bg: string; color: string; border: string }> = {
    Success: { icon: '✓', bg: '#f0fff4', color: '#16a34a', border: '#bbf7d0' },
    Pending: { icon: '⏱', bg: '#fffbeb', color: '#92400e', border: '#fcd34d' },
    Failed: { icon: '✕', bg: '#fff0f0', color: '#b91c1c', border: '#fca5a5' },
    Refunded: { icon: '↩', bg: '#f5f3ff', color: '#6d28d9', border: '#c4b5fd' },
  }
  const c = config[status]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
      }}
    >
      {c.icon} {status}
    </span>
  )
}

const rowHover = {
  onMouseEnter: (e: MouseEvent<HTMLTableRowElement>) => {
    e.currentTarget.style.background = PAGE_BG
  },
  onMouseLeave: (e: MouseEvent<HTMLTableRowElement>) => {
    e.currentTarget.style.background = 'transparent'
  },
}

export default function AdminPayments() {
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTS)[number]>('all')
  const [methodFilter, setMethodFilter] = useState<(typeof METHOD_OPTS)[number]>('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null)
  const [toast, setToast] = useState<string | null>(null)

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

  const copyTxnId = (txnId: string, e: MouseEvent) => {
    e.stopPropagation()
    void navigator.clipboard.writeText(txnId)
    setToast('Transaction ID copied')
  }

  const hasFilters = statusFilter !== 'all' || methodFilter !== 'all'

  return (
    <AdminLayout activePath="/admin/payments" title="Payments">
      <AdminToast message={toast} onClose={() => setToast(null)} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {[
          { label: 'Total Collected', value: 'AED 112,500', color: BRAND_BLUE },
          { label: 'This Month', value: 'AED 38,500', color: SUCCESS },
          { label: 'Pending', value: 'AED 24,800', color: WARNING },
          { label: 'Refunds', value: 'AED 2,100', color: PURPLE },
        ].map((c) => (
          <div key={c.label} style={{ ...cardStyle, padding: 20 }}>
            <div style={{ fontSize: 13, color: TEXT_SECONDARY }}>{c.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4, color: c.color }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          ...cardStyle,
          padding: 16,
          marginBottom: 16,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
          background: '#fff',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY }}>Status:</span>
        {STATUS_OPTS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            style={statusFilterPill(s, statusFilter === s)}
          >
            {s}
          </button>
        ))}
        <span
          style={{
            marginLeft: 12,
            fontSize: 13,
            fontWeight: 600,
            color: TEXT_SECONDARY,
          }}
        >
          Method:
        </span>
        {METHOD_OPTS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethodFilter(m)}
            style={pillTab(methodFilter === m)}
          >
            {m}
          </button>
        ))}
      </div>

      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        {filteredPayments.length === 0 ? (
          <AdminEmptyState
            title="No payments found"
            onClearFilters={
              hasFilters
                ? () => {
                    setStatusFilter('all')
                    setMethodFilter('all')
                  }
                : undefined
            }
          />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {['Txn ID', 'B2C User', 'Amount', 'Method', 'Gateway', 'Status', 'Date', 'Invoice'].map(
                  (h) => (
                    <th key={h} style={tableHeaderStyle}>
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => openDrawer(p)}
                  style={{
                    borderBottom: `1px solid ${BORDER}`,
                    cursor: 'pointer',
                    color: TEXT_PRIMARY,
                  }}
                  {...rowHover}
                >
                  <td style={{ padding: 16 }}>
                    <button
                      type="button"
                      onClick={(e) => copyTxnId(p.txnId, e)}
                      title="Click to copy"
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 13,
                        color: BRAND_BLUE,
                        fontWeight: 600,
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                      }}
                    >
                      #{p.txnId}
                    </button>
                  </td>
                  <td style={{ padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <AdminAvatar name={p.customer} size={32} />
                      <span style={{ fontWeight: 500 }}>{p.customer}</span>
                    </div>
                  </td>
                  <td style={{ padding: 16, fontWeight: 600 }}>AED {p.amount}</td>
                  <td style={{ padding: 16 }}>
                    <span style={methodPill(p.methodDetail)}>{p.methodDetail}</span>
                  </td>
                  <td style={{ padding: 16 }}>
                    <span style={gatewayPill(p.gateway)}>{p.gateway}</span>
                  </td>
                  <td style={{ padding: 16 }}>
                    <StatusBadge status={p.status} />
                  </td>
                  <td style={{ padding: 16, color: TEXT_MUTED, fontSize: 13 }}>{p.date}</td>
                  <td style={{ padding: 16, color: BRAND_BLUE, fontWeight: 500 }}>{p.invoiceNo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {drawerOpen && (
        <div
          role="presentation"
          onClick={closeDrawer}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 9998 }}
        />
      )}
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: 420,
          background: '#fff',
          borderLeft: `1px solid ${BORDER}`,
          boxShadow: '-8px 0 40px rgba(0,0,0,0.08)',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
          zIndex: 9999,
          padding: 32,
          overflowY: 'auto',
        }}
      >
        {selectedPayment && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY }}>
                Transaction Detail
              </h3>
              <button
                type="button"
                onClick={closeDrawer}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: TEXT_MUTED,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <AdminAvatar name={selectedPayment.customer} size={48} />
              <div>
                <div style={{ fontWeight: 600, color: TEXT_PRIMARY }}>{selectedPayment.customer}</div>
                <button
                  type="button"
                  onClick={(e) => copyTxnId(selectedPayment.txnId, e)}
                  title="Click to copy"
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 13,
                    color: BRAND_BLUE,
                    fontWeight: 600,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                  }}
                >
                  #{selectedPayment.txnId}
                </button>
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: BRAND, marginBottom: 20 }}>
              AED {selectedPayment.amount}
            </div>
            <div style={{ ...cardStyle, padding: 16, marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: TEXT_PRIMARY,
                }}
              >
                Breakdown
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  marginBottom: 4,
                  color: TEXT_SECONDARY,
                }}
              >
                <span>Processing fee</span>
                <span>AED {(selectedPayment.amount * 0.15).toFixed(0)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  color: TEXT_SECONDARY,
                }}
              >
                <span>Gov fee</span>
                <span>AED {(selectedPayment.amount * 0.85).toFixed(0)}</span>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: TEXT_MUTED }}>Gateway</span>
              <div
                style={{
                  marginTop: 4,
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <span style={gatewayPill(selectedPayment.gateway)}>{selectedPayment.gateway}</span>
                <span style={methodPill(selectedPayment.methodDetail)}>
                  {selectedPayment.methodDetail}
                </span>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: TEXT_MUTED }}>Status</span>
              <div style={{ marginTop: 4 }}>
                <StatusBadge status={selectedPayment.status} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 8 }}>Timeline</div>
              <div style={{ borderLeft: `2px solid ${BORDER}`, paddingLeft: 16 }}>
                {[
                  'Payment initiated',
                  'Gateway response received',
                  selectedPayment.status === 'Success'
                    ? 'Payment confirmed'
                    : 'Awaiting confirmation',
                ].map((step) => (
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
