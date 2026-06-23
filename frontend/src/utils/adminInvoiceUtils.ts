import { Database } from '../database/db'
import type { AdminInvoice, InvoiceStatus } from '../types/adminTypes'
import { dbInvoiceToAdmin } from './dbMappers'

export function loadInvoices(): AdminInvoice[] {
  return Database.getInvoices().map((inv) => dbInvoiceToAdmin(inv as Record<string, unknown>))
}

export function findInvoiceById(id: string): AdminInvoice | undefined {
  const inv = Database.getInvoiceById(id)
  return inv ? dbInvoiceToAdmin(inv as Record<string, unknown>) : undefined
}

export function findInvoiceByNo(invoiceNo: string): AdminInvoice | undefined {
  const inv = Database.getInvoiceByNo(invoiceNo)
  return inv ? dbInvoiceToAdmin(inv as Record<string, unknown>) : undefined
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

export function buildInvoiceViewUrl(inv: AdminInvoice, applicationId?: string): string {
  const status = getEffectiveInvoiceStatus(inv)
  const params = new URLSearchParams({
    invoiceId: inv.id,
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
    invoiceNo: inv.invoiceNo,
  })
  if (applicationId) params.set('applicationId', applicationId)
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
