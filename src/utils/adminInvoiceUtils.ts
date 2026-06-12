import { MOCK_INVOICES, type AdminInvoice, type InvoiceStatus } from '../data/adminMockData'

const STORAGE_KEY = 'admin_invoices'

export function loadInvoices(): AdminInvoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AdminInvoice[]
  } catch {
    /* ignore */
  }
  return MOCK_INVOICES.map((inv) => ({ ...inv }))
}

export function saveInvoices(invoices: AdminInvoice[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices))
}

export function findInvoiceByNo(invoiceNo: string): AdminInvoice | undefined {
  return loadInvoices().find((i) => i.invoiceNo === invoiceNo)
}

/** Only bank-transfer invoices can be overdue (past due date + not paid). */
export function getEffectiveInvoiceStatus(inv: AdminInvoice): InvoiceStatus {
  if (inv.status === 'PAID' || inv.status === 'REFUNDED') return inv.status
  if (inv.paymentMethod !== 'Bank Transfer') return 'UNPAID'
  const due = new Date(inv.dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (due < today) return 'OVERDUE'
  return 'UNPAID'
}

export function withEffectiveStatus(inv: AdminInvoice): AdminInvoice & { effectiveStatus: InvoiceStatus } {
  return { ...inv, effectiveStatus: getEffectiveInvoiceStatus(inv) }
}

export function buildInvoiceViewUrl(inv: AdminInvoice): string {
  const status = getEffectiveInvoiceStatus(inv)
  const params = new URLSearchParams({
    no: inv.invoiceNo,
    invoiceNo: inv.invoiceNo,
    status: status === 'PAID' ? 'paid' : status === 'REFUNDED' ? 'refunded' : status === 'OVERDUE' ? 'overdue' : 'unpaid',
    name: inv.customer,
    amount: String(inv.amount),
    country: inv.destination,
    option: 'Visa',
    date: inv.date,
    govFee: String(inv.govFee),
    processingFee: String(inv.processingFee),
    countryCode: inv.countryCode,
    travelers: '1',
    paymentMethod: inv.paymentMethod,
    dueDate: inv.dueDate,
  })
  return `/invoice?${params.toString()}`
}

export function buildWhatsAppReminderUrl(inv: AdminInvoice): string {
  const status = getEffectiveInvoiceStatus(inv)
  const msg = `Hello ${inv.customer}, this is Super Visa. Your invoice ${inv.invoiceNo} for ${inv.destination} visa is ${status === 'OVERDUE' ? 'overdue' : 'pending'}. Amount due: AED ${inv.amount.toLocaleString()}. Please complete your bank transfer at your earliest convenience. Thank you!`
  return `https://wa.me/971559641020?text=${encodeURIComponent(msg)}`
}

export function generateInvoiceNo(): string {
  return `ATL${Date.now().toString().slice(-8)}`
}

export function getOverdueSummary(invoices: AdminInvoice[]) {
  const overdue = invoices.filter((i) => getEffectiveInvoiceStatus(i) === 'OVERDUE')
  return {
    count: overdue.length,
    amount: overdue.reduce((s, i) => s + i.amount, 0),
  }
}
