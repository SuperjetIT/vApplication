import { useMemo, useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import * as XLSX from 'xlsx'
import { AdminLayout } from '../../components/AdminLayout'
import { AdminEmptyState } from '../../components/admin/AdminEmptyState'
import { AdminToast } from '../../components/admin/AdminToast'
import {
  BRAND_BLUE,
  BORDER,
  DANGER,
  PAGE_BG,
  PURPLE,
  SUCCESS,
  WARNING,
  cardStyle,
  inputStyle,
  secondaryBtn,
  tableHeaderStyle,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from '../../components/admin/adminTheme'
import { getInvoiceStatusStyle, type AdminInvoice, type InvoiceStatus } from '../../types/adminTypes'
import {
  buildInvoiceViewUrl,
  buildWhatsAppReminderUrl,
  generateInvoiceNo,
  getEffectiveInvoiceStatus,
  getOverdueSummary,
} from '../../utils/adminInvoiceUtils'
import { Database } from '../../database/db'

const TABS = ['all', 'paid', 'unpaid', 'overdue', 'refunded'] as const
type Tab = (typeof TABS)[number]

const TAB_ACTIVE_COLORS: Record<Tab, string> = {
  all: BRAND_BLUE,
  paid: SUCCESS,
  unpaid: WARNING,
  overdue: DANGER,
  refunded: PURPLE,
}

function invoiceTabStyle(tab: Tab, active: boolean): CSSProperties {
  if (!active) {
    return {
      borderRadius: 40,
      padding: '8px 20px',
      fontSize: 13,
      fontWeight: 500,
      cursor: 'pointer',
      border: `1px solid ${BORDER}`,
      background: '#fff',
      color: TEXT_SECONDARY,
    }
  }
  return {
    borderRadius: 40,
    padding: '8px 20px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    background: TAB_ACTIVE_COLORS[tab],
    color: '#fff',
    boxShadow: `0 2px 8px ${TAB_ACTIVE_COLORS[tab]}33`,
  }
}

const STATUS_ICONS: Record<InvoiceStatus, string> = {
  PAID: '✓',
  UNPAID: '⏱',
  OVERDUE: '⚠',
  REFUNDED: '↩',
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const st = getInvoiceStatusStyle(status as InvoiceStatus)
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
        background: st.bg,
        color: st.color,
        border: `1px solid ${st.border}`,
      }}
    >
      {STATUS_ICONS[status]} {status}
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

const EMPTY_CREATE = {
  customer: '',
  destination: '',
  amount: '',
  govFee: '',
  processingFee: '',
  countryCode: 'ae',
  dueDate: '',
}

export default function AdminInvoices() {
  const mapDbInvoiceToAdmin = (inv: Record<string, unknown>): AdminInvoice => ({
    id: String(inv.id),
    invoiceNo: String(inv.invoiceNo),
    customer: String(inv.customerName ?? inv.customer ?? 'Unknown'),
    destination: String(inv.destination ?? ''),
    amount: Number(inv.amount ?? inv.total ?? 0),
    govFee: Number(inv.governmentFee ?? inv.govFee ?? 0),
    processingFee: Number(inv.processingFee ?? 0),
    status: String(inv.status ?? 'UNPAID').toUpperCase() as InvoiceStatus,
    date: String(inv.createdAt ?? inv.date ?? '').slice(0, 10),
    dueDate: String(inv.dueDate ?? '').slice(0, 10),
    countryCode: String(inv.countryCode ?? 'ae'),
    paymentMethod: String(inv.paymentMethod ?? 'Bank Transfer') as 'Card' | 'Bank Transfer',
  })
  const [invoices, setInvoices] = useState<AdminInvoice[]>(() => Database.getInvoices().map((inv) => mapDbInvoiceToAdmin(inv as Record<string, unknown>)))
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(EMPTY_CREATE)

  const persist = (next: AdminInvoice[]) => {
    setInvoices(next)
  }

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const effective = getEffectiveInvoiceStatus(inv)
      const matchTab = activeTab === 'all' || effective.toLowerCase() === activeTab
      const q = searchQuery.toLowerCase()
      const matchSearch =
        searchQuery === '' ||
        inv.invoiceNo.toLowerCase().includes(q) ||
        inv.customer.toLowerCase().includes(q)
      const matchFrom = !dateFrom || inv.date >= dateFrom
      const matchTo = !dateTo || inv.date <= dateTo
      return matchTab && matchSearch && matchFrom && matchTo
    })
  }, [invoices, activeTab, searchQuery, dateFrom, dateTo])

  const hasFilters = activeTab !== 'all' || searchQuery || dateFrom || dateTo

  const markPaid = (id: string) => {
    Database.markInvoicePaid(id, 'Bank Transfer')
    persist(invoices.map((inv) => (inv.id === id ? { ...inv, status: 'PAID' as InvoiceStatus } : inv)))
    setToast('Invoice marked as paid')
  }

  const handleCreateInvoice = () => {
    if (!createForm.customer || !createForm.destination || !createForm.amount) return
    const govFee = Number(createForm.govFee) || 0
    const processingFee = Number(createForm.processingFee) || 0
    const amount = Number(createForm.amount) || govFee + processingFee
    const today = new Date().toISOString().slice(0, 10)
    const due = createForm.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
    const newInv: AdminInvoice = {
      id: String(invoices.length + 1),
      invoiceNo: generateInvoiceNo(),
      customer: createForm.customer,
      destination: createForm.destination,
      amount,
      govFee,
      processingFee,
      status: 'UNPAID',
      date: today,
      dueDate: due,
      countryCode: createForm.countryCode,
      paymentMethod: 'Bank Transfer',
    }
    Database.createInvoice({
      invoiceNo: newInv.invoiceNo,
      customerName: newInv.customer,
      destination: newInv.destination,
      amount: newInv.amount,
      governmentFee: newInv.govFee,
      processingFee: newInv.processingFee,
      total: newInv.amount,
      status: 'unpaid',
      createdAt: today,
      dueDate: due,
      paymentMethod: 'Bank Transfer',
      type: 'b2c',
      countryCode: newInv.countryCode,
    })
    persist([newInv, ...invoices])
    setCreateOpen(false)
    setCreateForm(EMPTY_CREATE)
    setToast('Bank transfer invoice created')
  }

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredInvoices.map((i) => ({
        Invoice: i.invoiceNo,
        'B2C User': i.customer,
        Amount: i.amount,
        Status: getEffectiveInvoiceStatus(i),
        Date: i.date,
      })),
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices')
    XLSX.writeFile(wb, `SuperVisa_Invoices_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const summary = useMemo(() => {
    const withStatus = invoices.map((i) => ({ inv: i, effective: getEffectiveInvoiceStatus(i) }))
    const overdue = getOverdueSummary(invoices)
    return {
      total: { count: invoices.length, amount: invoices.reduce((s, i) => s + i.amount, 0) },
      paid: withStatus.filter((x) => x.effective === 'PAID'),
      unpaid: withStatus.filter((x) => x.effective === 'UNPAID'),
      overdue: { count: overdue.count, amount: overdue.amount },
    }
  }, [invoices])

  return (
    <AdminLayout activePath="/admin/invoices" title="Invoices">
      <AdminToast message={toast} onClose={() => setToast(null)} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button type="button" onClick={() => setCreateOpen(true)} style={{ ...secondaryBtn, background: `linear-gradient(135deg, ${BRAND_BLUE}, #818cf8)`, color: '#fff', border: 'none', fontWeight: 600 }}>
          + Create Invoice (Bank Transfer)
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {[
          {
            label: 'Total Invoices',
            count: summary.total.count,
            amount: summary.total.amount,
            color: BRAND_BLUE,
            border: BRAND_BLUE,
          },
          {
            label: 'Paid',
            count: summary.paid.length,
            amount: summary.paid.reduce((s, x) => s + x.inv.amount, 0),
            color: SUCCESS,
            border: SUCCESS,
          },
          {
            label: 'Unpaid',
            count: summary.unpaid.length,
            amount: summary.unpaid.reduce((s, x) => s + x.inv.amount, 0),
            color: WARNING,
            border: WARNING,
          },
          {
            label: 'Overdue (Bank Transfer)',
            count: summary.overdue.count,
            amount: summary.overdue.amount,
            color: DANGER,
            border: DANGER,
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{ ...cardStyle, padding: 20, borderTop: `4px solid ${s.border}` }}
          >
            <div style={{ fontSize: 13, color: TEXT_SECONDARY }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color, marginTop: 4 }}>
              {s.count}
            </div>
            <div style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 4 }}>
              AED {s.amount.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveTab(t)}
            style={invoiceTabStyle(t, activeTab === t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ ...cardStyle, padding: '16px 20px', marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Search invoice # or B2C user..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 200 }}
        />
        <span style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500 }}>From</span>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={inputStyle} />
        <span style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500 }}>To</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={inputStyle} />
        {hasFilters && (
          <button type="button" onClick={() => { setActiveTab('all'); setSearchQuery(''); setDateFrom(''); setDateTo('') }} style={{ border: 'none', background: 'none', color: '#f93e42', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Clear filters
          </button>
        )}
        <button type="button" onClick={exportExcel} style={{ ...secondaryBtn, marginLeft: 'auto' }}>
          Export Excel
        </button>
      </div>

      <div className="admin-table-wrap" style={{ ...cardStyle, padding: 0 }}>
        {filteredInvoices.length === 0 ? (
          <AdminEmptyState
            title="No invoices found"
            onClearFilters={
              hasFilters
                ? () => {
                    setActiveTab('all')
                    setSearchQuery('')
                    setDateFrom('')
                    setDateTo('')
                  }
                : undefined
            }
          />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {[
                  'Invoice #',
                  'B2C User',
                  'Destination',
                  'Amount',
                  'Gov Fee',
                  'Processing',
                  'Status',
                  'Date',
                  'Action',
                ].map((h) => (
                  <th key={h} style={tableHeaderStyle}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => {
                const effective = getEffectiveInvoiceStatus(inv)
                return (
                <tr
                  key={inv.id}
                  style={{ borderBottom: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}
                  {...rowHover}
                >
                  <td style={{ padding: 16 }}>
                    <a
                      href={buildInvoiceViewUrl(inv)}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: BRAND_BLUE,
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      {inv.invoiceNo}
                    </a>
                  </td>
                  <td style={{ padding: 16, fontWeight: 500 }}>{inv.customer}</td>
                  <td style={{ padding: 16, color: TEXT_SECONDARY }}>{inv.destination}</td>
                  <td style={{ padding: 16, fontWeight: 600 }}>AED {inv.amount}</td>
                  <td style={{ padding: 16, color: TEXT_SECONDARY }}>AED {inv.govFee}</td>
                  <td style={{ padding: 16, color: TEXT_SECONDARY }}>AED {inv.processingFee}</td>
                  <td style={{ padding: 16 }}>
                    <StatusBadge status={effective} />
                    <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>{inv.paymentMethod}</div>
                  </td>
                  <td style={{ padding: 16, color: TEXT_MUTED }}>{inv.date}</td>
                  <td style={{ padding: 16 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <a
                        href={buildInvoiceViewUrl(inv)}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: '#fff',
                          border: `1px solid ${BORDER}`,
                          color: TEXT_SECONDARY,
                          borderRadius: 8,
                          padding: '4px 10px',
                          fontSize: 12,
                          fontWeight: 500,
                          textDecoration: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        View
                      </a>
                      {(effective === 'UNPAID' || effective === 'OVERDUE') && (
                        <button
                          type="button"
                          onClick={() => markPaid(inv.id)}
                          style={{
                            background: SUCCESS,
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            padding: '4px 10px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Mark Paid
                        </button>
                      )}
                      {(effective === 'OVERDUE' || effective === 'UNPAID') && inv.paymentMethod === 'Bank Transfer' && (
                        <button
                          type="button"
                          onClick={() => window.open(buildWhatsAppReminderUrl(inv), '_blank')}
                          style={{
                            background: '#fff',
                            border: '1px solid #25d366',
                            color: '#25d366',
                            borderRadius: 8,
                            padding: '4px 10px',
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          WhatsApp reminder
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        )}
      </div>

      {createOpen && (
        <>
          <div role="presentation" onClick={() => setCreateOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', ...cardStyle, padding: 32, maxWidth: 480, width: '90%', zIndex: 2001 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>Create Bank Transfer Invoice</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: TEXT_SECONDARY }}>Manual invoice for B2B/B2C bank transfer payments</p>
            {[
              ['customer', 'B2C User Name', 'text'],
              ['destination', 'Destination', 'text'],
              ['amount', 'Total Amount (AED)', 'number'],
              ['govFee', 'Gov Fee (AED)', 'number'],
              ['processingFee', 'Processing Fee (AED)', 'number'],
              ['dueDate', 'Due Date', 'date'],
            ].map(([key, label, type]) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, color: TEXT_SECONDARY, marginBottom: 4 }}>{label}</label>
                <input
                  type={type}
                  value={createForm[key as keyof typeof createForm]}
                  onChange={(e) => setCreateForm({ ...createForm, [key]: e.target.value })}
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button type="button" onClick={() => setCreateOpen(false)} style={{ ...secondaryBtn, flex: 1 }}>Cancel</button>
              <button type="button" onClick={handleCreateInvoice} style={{ ...secondaryBtn, flex: 1, background: '#f93e42', color: '#fff', border: 'none', fontWeight: 600 }}>Create Invoice</button>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
