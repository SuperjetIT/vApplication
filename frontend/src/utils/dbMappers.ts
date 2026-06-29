import { Database } from '../database/db'
import { resolvePassportFromSources } from './nationality'
import type {
  AdminExpense,
  AdminInvoice,
  AdminLead,
  AdminPayment,
  InvoiceStatus,
  LeadStatus,
  PaymentStatus,
} from '../types/adminTypes'
import type { ApplicationStatus, UserApplication } from './applications'

type GenericRecord = Record<string, unknown>

function travelerName(travelers: unknown): string {
  if (!Array.isArray(travelers) || travelers.length === 0) return 'Unknown'
  const t = travelers[0] as GenericRecord
  const first = String(t.firstName ?? '').trim()
  const last = String(t.lastName ?? '').trim()
  return `${first} ${last}`.trim() || 'Unknown'
}

export function formatRelativeTime(iso: string): string {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return iso
  const diffMs = Date.now() - then
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function dbStatusToLeadStatus(status: string): LeadStatus {
  const s = status.toLowerCase().replace(/\s+/g, '_')
  const map: Record<string, LeadStatus> = {
    new: 'New Application',
    new_application: 'New Application',
    contacted: 'Contacted',
    qualified: 'Qualified',
    payment_pending: 'Payment Pending',
    payment_failed: 'Payment Pending',
    docs_pending: 'Docs Pending',
    pending_docs: 'Docs Pending',
    under_review: 'Under Review',
    in_progress: 'Under Review',
    submitted: 'Submitted',
    approved: 'Approved',
    rejected: 'Rejected',
    closed: 'Closed',
  }
  return map[s] ?? 'Under Review'
}

export function leadStatusToDbStatus(status: LeadStatus): string {
  const map: Record<LeadStatus, string> = {
    'New Application': 'new_application',
    Contacted: 'contacted',
    Qualified: 'qualified',
    'Payment Pending': 'payment_pending',
    'Docs Pending': 'pending_docs',
    'Under Review': 'under_review',
    Submitted: 'submitted',
    Approved: 'approved',
    Rejected: 'rejected',
    Closed: 'closed',
  }
  return map[status]
}

export function dbStatusToUserApplicationStatus(status: string): ApplicationStatus {
  const lead = dbStatusToLeadStatus(status)
  switch (lead) {
    case 'Approved':
      return 'Approved'
    case 'Rejected':
      return 'Rejected'
    case 'Submitted':
      return 'Submitted'
    case 'Docs Pending':
      return 'Docs Pending'
    case 'Payment Pending':
      return 'Payment Pending'
    default:
      return 'In Progress'
  }
}

export function applicationToLead(app: GenericRecord): AdminLead {
  const type = String(app.type ?? 'b2c')
  const source: 'B2C' | 'B2B' = type === 'b2b' ? 'B2B' : 'B2C'
  const travelers = app.travelers
  let name = travelerName(travelers)
  let email = ''
  let userPassportCountry = ''

  if (app.userId) {
    const user = Database.getUserById(String(app.userId))
    if (user) {
      email = String(user.email ?? '')
      if (String(user.fullName ?? '').trim()) name = String(user.fullName)
      userPassportCountry = String(user.passportCountry ?? '').trim()
    }
  } else if (Array.isArray(travelers) && travelers[0]) {
    const t = travelers[0] as GenericRecord
    email = String(t.email ?? '')
  }

  const travelerNationalityRaw =
    Array.isArray(travelers) && travelers[0]
      ? String((travelers[0] as GenericRecord).nationality ?? '').trim()
      : ''
  const appPassportCountry = String(app.passportCountry ?? '').trim()
  const { name: passport, code: passportCode } = resolvePassportFromSources(
    travelerNationalityRaw,
    appPassportCountry,
    userPassportCountry,
  )

  let agentName: string | undefined
  let agentId: string | undefined
  if (app.partnerId) {
    agentId = String(app.partnerId)
    const partner = Database.getPartnerById(agentId)
    agentName = partner ? String(partner.companyName ?? partner.contactPerson ?? 'Partner') : 'Partner'
  }

  const amountObj = app.amount as GenericRecord | undefined
  const total = Number(amountObj?.total ?? 0)
  const destName = String(app.destinationName ?? app.destination ?? '')
  const destSlug = String(app.destination ?? '')

  const invoices = Database.getInvoices().filter((i) => String(i.applicationId) === String(app.id))
  const invoiceNo = invoices[0] ? String(invoices[0].invoiceNo) : undefined

  const commissions = agentId
    ? Database.getCommissions({ partnerId: agentId }).filter((c) => String(c.applicationId) === String(app.id))
    : []
  const commission = commissions[0]

  const paymentMethodRaw = String(app.paymentMethod ?? '')
  let paymentMethod: 'Card' | 'Bank Transfer' | undefined
  if (paymentMethodRaw.includes('card')) paymentMethod = 'Card'
  else if (paymentMethodRaw.includes('bank')) paymentMethod = 'Bank Transfer'

  const paymentStatusRaw = String(app.paymentStatus ?? 'pending').toLowerCase()
  let paymentStatus: 'paid' | 'pending' | 'failed' = 'pending'
  if (paymentStatusRaw === 'paid') paymentStatus = 'paid'
  else if (paymentStatusRaw === 'failed') paymentStatus = 'failed'

  return {
    id: String(app.id),
    applicationId: String(app.id),
    name,
    email,
    passport,
    passportCode: passportCode !== 'un' ? passportCode : destSlug.slice(0, 2) || 'ae',
    destination: destName,
    destCode: destSlug,
    source,
    status: dbStatusToLeadStatus(String(app.status ?? 'under_review')),
    assigned: app.assignedOperator ? String(app.assignedOperator) : agentName ?? 'Unassigned',
    created: formatRelativeTime(String(app.createdAt ?? '')),
    visaType: String(app.visaOption ?? 'Tourist'),
    invoiceNo,
    paymentMethod,
    paymentStatus,
    amount: total,
    documentsComplete: !String(app.status).toLowerCase().includes('pending_docs'),
    agentId,
    agentName,
    agentApplicationId: source === 'B2B' ? String(app.id) : undefined,
    commissionAed: commission ? Number(commission.commissionAmount ?? 0) : undefined,
    commissionPaid: commission ? String(commission.status).toLowerCase() === 'paid' : false,
  }
}

export function dbAppToUserApplication(app: GenericRecord, userEmail: string): UserApplication {
  const amountObj = app.amount as GenericRecord | undefined
  const travelers = app.travelers
  const destSlug = String(app.destination ?? '')
  const destName = String(app.destinationName ?? destSlug)
  const invoices = Database.getInvoices().filter((i) => String(i.applicationId) === String(app.id))

  return {
    id: String(app.id),
    userEmail,
    countrySlug: destSlug,
    countryName: destName,
    countryCode: String(app.countryCode ?? destSlug).slice(0, 2) || 'ae',
    status: dbStatusToUserApplicationStatus(String(app.status ?? '')),
    appliedOn: formatRelativeTime(String(app.createdAt ?? '')),
    travelers: Array.isArray(travelers) ? travelers.length : Number(travelers ?? 1),
    totalAed: Number(amountObj?.total ?? 0),
    invoiceNo: invoices[0] ? String(invoices[0].invoiceNo) : undefined,
    visaType: String(app.visaOption ?? ''),
  }
}

export function dbInvoiceToAdmin(inv: GenericRecord): AdminInvoice {
  const statusRaw = String(inv.status ?? 'unpaid').toUpperCase()
  let status: InvoiceStatus = 'UNPAID'
  if (statusRaw === 'PAID') status = 'PAID'
  else if (statusRaw === 'REFUNDED') status = 'REFUNDED'
  else if (statusRaw === 'OVERDUE') status = 'OVERDUE'

  const methodRaw = String(inv.paymentMethod ?? '').toLowerCase()
  const paymentMethod: 'Card' | 'Bank Transfer' =
    methodRaw.includes('card') || methodRaw === 'stripe' ? 'Card' : 'Bank Transfer'

  return {
    id: String(inv.id),
    invoiceNo: String(inv.invoiceNo),
    customer: String(inv.customerName ?? inv.customer ?? 'Unknown'),
    destination: String(inv.destination ?? ''),
    amount: Number(inv.total ?? inv.amount ?? 0),
    govFee: Number(inv.governmentFee ?? inv.govFee ?? 0),
    processingFee: Number(inv.processingFee ?? 0),
    status,
    date: String(inv.createdAt ?? inv.date ?? '').slice(0, 10),
    dueDate: String(inv.dueDate ?? '').slice(0, 10),
    countryCode: String(inv.countryCode ?? 'ae'),
    paymentMethod,
  }
}

export function dbPaymentToAdmin(pay: GenericRecord): AdminPayment {
  const invoice = pay.invoiceId ? Database.getInvoiceById(String(pay.invoiceId)) : undefined
  const app = pay.applicationId ? Database.getApplicationById(String(pay.applicationId)) : undefined
  let customer = 'Unknown'
  if (invoice) customer = String(invoice.customerName ?? 'Unknown')
  else if (app) customer = travelerName(app.travelers)

  const methodRaw = String(pay.method ?? 'card').toLowerCase()
  let method: AdminPayment['method'] = 'Card'
  if (methodRaw.includes('bank')) method = 'Bank Transfer'
  else if (methodRaw.includes('wallet')) method = 'Wallet'

  const gatewayRaw = String(pay.gateway ?? 'stripe').toLowerCase()
  const gateway: AdminPayment['gateway'] = gatewayRaw === 'bank' || gatewayRaw === 'wallet' ? 'Bank' : 'Stripe'

  const statusRaw = String(pay.status ?? 'pending').toLowerCase()
  let status: PaymentStatus = 'Pending'
  if (statusRaw === 'success' || statusRaw === 'paid') status = 'Success'
  else if (statusRaw === 'failed') status = 'Failed'
  else if (statusRaw === 'refunded') status = 'Refunded'

  const created = String(pay.createdAt ?? '')
  const date = created
    ? new Date(created).toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '—'

  return {
    id: String(pay.id),
    txnId: String(pay.txnId ?? pay.id),
    customer,
    amount: Number(pay.amount ?? 0),
    method,
    methodDetail: method === 'Card' ? 'Card' : method === 'Wallet' ? 'Wallet Balance' : 'Bank Transfer',
    gateway,
    status,
    date,
    invoiceNo: invoice ? String(invoice.invoiceNo) : '—',
  }
}

export function dbExpenseToAdmin(exp: GenericRecord): AdminExpense {
  return {
    id: String(exp.id),
    category: String(exp.category ?? 'Other'),
    description: String(exp.description ?? ''),
    amount: Number(exp.amount ?? 0),
    date: String(exp.date ?? exp.createdAt ?? '').slice(0, 10),
    addedBy: String(exp.addedBy ?? 'Admin'),
    hasReceipt: Boolean(exp.receiptUrl ?? exp.receiptName),
    receiptName: exp.receiptName ? String(exp.receiptName) : undefined,
  }
}

export function loadLeadsFromDatabase(): AdminLead[] {
  return Database.getApplications()
    .filter((app) => {
      const t = String((app as GenericRecord).type ?? 'b2c').toLowerCase()
      return t === 'b2c' || t === 'b2b'
    })
    .map((app) => applicationToLead(app as GenericRecord))
    .sort((a, b) => {
      const appA = Database.getApplicationById(a.id)
      const appB = Database.getApplicationById(b.id)
      return String(appB?.createdAt ?? '').localeCompare(String(appA?.createdAt ?? ''))
    })
}

export function getApplicationsForUserFromDb(email: string): UserApplication[] {
  const normalized = email.trim().toLowerCase()
  const user = Database.getUserByEmail(normalized)
  if (!user) return []
  return Database.getApplications({ userId: String(user.id), type: 'b2c' })
    .map((app) => dbAppToUserApplication(app as GenericRecord, normalized))
    .sort((a, b) => b.id.localeCompare(a.id))
}

export function getApplicationForUserFromDb(email: string, applicationId: string): UserApplication | undefined {
  const normalized = email.trim().toLowerCase()
  const user = Database.getUserByEmail(normalized)
  if (!user) return undefined
  const app = Database.getApplicationById(applicationId)
  if (!app || String(app.userId) !== String(user.id)) return undefined
  return dbAppToUserApplication(app as GenericRecord, normalized)
}
