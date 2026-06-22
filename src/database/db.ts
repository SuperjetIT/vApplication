import usersData from './users.json'
import partnersData from './partners.json'
import applicationsData from './applications.json'
import operationsData from './operations.json'
import adminsData from './admins.json'
import invoicesData from './invoices.json'
import paymentsData from './payments.json'
import commissionsData from './commissions.json'
import expensesData from './expenses.json'
import documentsData from './documents.json'
import notificationsData from './notifications.json'
import activityLogData from './activityLog.json'
import settingsData from './settings.json'
import walletTransactionsData from './walletTransactions.json'

type GenericRecord = Record<string, unknown>

type DbShape = {
  users: GenericRecord[]
  partners: GenericRecord[]
  applications: GenericRecord[]
  operators: GenericRecord[]
  admins: GenericRecord[]
  invoices: GenericRecord[]
  payments: GenericRecord[]
  commissions: GenericRecord[]
  expenses: GenericRecord[]
  documents: GenericRecord[]
  notifications: GenericRecord[]
  activities: GenericRecord[]
  settings: GenericRecord
  walletTransactions: GenericRecord[]
}

const defaultDb: DbShape = {
  users: [...usersData.users],
  partners: [...partnersData.partners],
  applications: [...applicationsData.applications],
  operators: [...operationsData.operators],
  admins: [...adminsData.admins],
  invoices: [...invoicesData.invoices],
  payments: [...paymentsData.payments],
  commissions: [...commissionsData.commissions],
  expenses: [...expensesData.expenses],
  documents: [...documentsData.documents],
  notifications: [...notificationsData.notifications],
  activities: [...activityLogData.activities],
  settings: { ...settingsData },
  walletTransactions: [...walletTransactionsData.walletTransactions],
}

let db: DbShape = { ...defaultDb }

export const STORAGE_KEY = 'super_visa_db'
export const DB_CHANGED_EVENT = 'superVisaDbChanged'

function ensureAdminsSeeded() {
  const defaultAdmin = adminsData.admins[0]
  if (!defaultAdmin) return
  if (!Array.isArray(db.admins)) db.admins = []
  const email = String(defaultAdmin.email).toLowerCase()
  const idx = db.admins.findIndex((a) => String(a.email ?? '').toLowerCase() === email)
  if (idx === -1) {
    db.admins.unshift({ ...defaultAdmin })
    saveToStorage()
    return
  }
  const current = db.admins[idx]
  if (!current.username || !current.password) {
    db.admins[idx] = { ...defaultAdmin, ...current, username: current.username ?? defaultAdmin.username, password: current.password ?? defaultAdmin.password }
    saveToStorage()
  }
}

function loadFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      db = JSON.parse(saved) as DbShape
    }
  } catch {
    console.warn('Could not load DB from storage, using default JSON data')
  }
  ensureAdminsSeeded()
  if (!Array.isArray(db.walletTransactions)) db.walletTransactions = []
}

function notifyDbChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DB_CHANGED_EVENT))
  }
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
    notifyDbChanged()
  } catch (e) {
    console.error('Could not save DB to storage', e)
  }
}

loadFromStorage()

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        db = JSON.parse(e.newValue) as DbShape
        notifyDbChanged()
      } catch {
        console.warn('Could not sync DB from another tab')
      }
    }
  })
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function toNum(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value) || 0
  return 0
}

// TEMPORARY JSON-based database — replace internals with real API calls when migrating to AWS/PostgreSQL. Function signatures should stay the same.
export const Database = {
  getUsers: () => db.users,
  getUserById: (id: string) => db.users.find((u) => String(u.id) === id),
  getUserByEmail: (email: string) => db.users.find((u) => String(u.email) === email),
  createUser: (data: GenericRecord) => {
    const newUser = { id: generateId('usr'), createdAt: new Date().toISOString(), walletBalance: 0, ...data }
    db.users.push(newUser)
    saveToStorage()
    return newUser
  },
  updateUser: (id: string, updates: GenericRecord) => {
    const idx = db.users.findIndex((u) => String(u.id) === id)
    if (idx === -1) return null
    db.users[idx] = { ...db.users[idx], ...updates }
    saveToStorage()
    return db.users[idx]
  },

  getPartners: () => db.partners,
  getPartnerById: (id: string) => db.partners.find((p) => String(p.id) === id),
  getPartnerByCredentials: (email: string, password: string) =>
    db.partners.find(
      (p) =>
        (String(p.email).toLowerCase() === email.trim().toLowerCase()
          || String(p.username ?? '').toLowerCase() === email.trim().toLowerCase())
        && String(p.password) === password,
    ) ?? null,
  createPartner: (data: GenericRecord) => {
    const newPartner = {
      id: generateId('ptn'),
      createdAt: new Date().toISOString(),
      totalApplications: 0,
      totalRevenue: 0,
      totalCommission: 0,
      walletBalance: 0,
      status: 'pending',
      ...data,
    }
    db.partners.push(newPartner)
    saveToStorage()
    return newPartner
  },
  updatePartner: (id: string, updates: GenericRecord) => {
    const idx = db.partners.findIndex((p) => String(p.id) === id)
    if (idx === -1) return null
    db.partners[idx] = { ...db.partners[idx], ...updates }
    saveToStorage()
    return db.partners[idx]
  },
  updatePartnerPassword: (id: string, password: string) => Database.updatePartner(id, { password }),
  getPartnerWalletBalance: (partnerId: string) => {
    const partner = db.partners.find((p) => String(p.id) === partnerId)
    return toNum(partner?.walletBalance ?? 0)
  },
  topUpPartnerWallet: (partnerId: string, amount: number, addedBy: string, note?: string) => {
    const idx = db.partners.findIndex((p) => String(p.id) === partnerId)
    if (idx === -1) return null
    const prevBalance = toNum(db.partners[idx].walletBalance ?? 0)
    const nextBalance = prevBalance + amount
    db.partners[idx] = { ...db.partners[idx], walletBalance: nextBalance }
    const txn = {
      id: generateId('wtxn'),
      walletType: 'b2b',
      ownerId: partnerId,
      type: 'credit',
      amount,
      balanceBefore: prevBalance,
      balanceAfter: nextBalance,
      note: note || 'Top-up by admin',
      addedBy,
      createdAt: new Date().toISOString(),
    }
    db.walletTransactions.push(txn)
    saveToStorage()
    Database.logActivity('wallet_topup', `Wallet top-up AED ${amount} for partner ${partnerId}`, undefined, addedBy, 'admin')
    return txn
  },
  deductPartnerWallet: (partnerId: string, amount: number, applicationId?: string) => {
    const idx = db.partners.findIndex((p) => String(p.id) === partnerId)
    if (idx === -1) return { success: false as const, error: 'Partner not found' }
    const prevBalance = toNum(db.partners[idx].walletBalance ?? 0)
    if (prevBalance < amount) return { success: false as const, error: 'Insufficient balance' }
    const nextBalance = prevBalance - amount
    db.partners[idx] = { ...db.partners[idx], walletBalance: nextBalance }
    const txn = {
      id: generateId('wtxn'),
      walletType: 'b2b',
      ownerId: partnerId,
      type: 'debit',
      amount,
      balanceBefore: prevBalance,
      balanceAfter: nextBalance,
      note: applicationId ? `Payment for application ${applicationId}` : 'Wallet payment',
      applicationId,
      createdAt: new Date().toISOString(),
    }
    db.walletTransactions.push(txn)
    saveToStorage()
    return { success: true as const, newBalance: nextBalance, txn }
  },
  creditPartnerWallet: (partnerId: string, amount: number) =>
    Database.topUpPartnerWallet(partnerId, amount, 'system', 'Commission credit'),

  getUserWalletBalance: (userId: string) => {
    const user = db.users.find((u) => String(u.id) === userId)
    return toNum(user?.walletBalance ?? 0)
  },
  topUpUserWallet: (userId: string, amount: number, paymentId?: string) => {
    const idx = db.users.findIndex((u) => String(u.id) === userId)
    if (idx === -1) return null
    const prevBalance = toNum(db.users[idx].walletBalance ?? 0)
    const nextBalance = prevBalance + amount
    db.users[idx] = { ...db.users[idx], walletBalance: nextBalance }
    const txn = {
      id: generateId('wtxn'),
      walletType: 'b2c',
      ownerId: userId,
      type: 'credit',
      amount,
      balanceBefore: prevBalance,
      balanceAfter: nextBalance,
      note: paymentId ? `Top-up via card (${paymentId})` : 'Refund credited',
      paymentId,
      createdAt: new Date().toISOString(),
    }
    db.walletTransactions.push(txn)
    saveToStorage()
    return txn
  },
  deductUserWallet: (userId: string, amount: number, applicationId: string) => {
    const idx = db.users.findIndex((u) => String(u.id) === userId)
    if (idx === -1) return { success: false as const, error: 'User not found' }
    const prevBalance = toNum(db.users[idx].walletBalance ?? 0)
    if (prevBalance < amount) return { success: false as const, error: 'Insufficient balance' }
    const nextBalance = prevBalance - amount
    db.users[idx] = { ...db.users[idx], walletBalance: nextBalance }
    const txn = {
      id: generateId('wtxn'),
      walletType: 'b2c',
      ownerId: userId,
      type: 'debit',
      amount,
      balanceBefore: prevBalance,
      balanceAfter: nextBalance,
      note: `Payment for application ${applicationId}`,
      applicationId,
      createdAt: new Date().toISOString(),
    }
    db.walletTransactions.push(txn)
    saveToStorage()
    return { success: true as const, newBalance: nextBalance, txn }
  },
  refundToWallet: (ownerId: string, ownerType: 'b2c' | 'b2b', amount: number, _applicationId: string, reason: string) => {
    if (ownerType === 'b2c') {
      return Database.topUpUserWallet(ownerId, amount)
    }
    return Database.topUpPartnerWallet(ownerId, amount, 'system', `Refund: ${reason}`)
  },
  getWalletTransactions: (ownerId: string) =>
    db.walletTransactions
      .filter((t) => String(t.ownerId) === ownerId)
      .sort((a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime()),
  getAllWalletTransactions: () =>
    [...db.walletTransactions].sort(
      (a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime(),
    ),
  getAllWalletBalances: () => ({
    b2bWallets: db.partners.map((p) => ({
      id: String(p.id),
      name: String(p.companyName ?? ''),
      type: 'b2b' as const,
      balance: toNum(p.walletBalance ?? 0),
      email: String(p.email ?? ''),
      contactPerson: String(p.contactPerson ?? ''),
    })),
    b2cWallets: db.users.map((u) => ({
      id: String(u.id),
      name: String(u.fullName ?? ''),
      type: 'b2c' as const,
      balance: toNum(u.walletBalance ?? 0),
      email: String(u.email ?? ''),
    })),
  }),

  getApplications: (filters?: { type?: string; status?: string; userId?: string; partnerId?: string }) => {
    let result = db.applications
    if (filters?.type) result = result.filter((a) => String(a.type) === filters.type)
    if (filters?.status) result = result.filter((a) => String(a.status) === filters.status)
    if (filters?.userId) result = result.filter((a) => String(a.userId) === filters.userId)
    if (filters?.partnerId) result = result.filter((a) => String(a.partnerId) === filters.partnerId)
    return result
  },
  getApplicationById: (id: string) => db.applications.find((a) => String(a.id) === id),
  createApplication: (data: GenericRecord) => {
    const now = new Date().toISOString()
    const newApp = {
      id: generateId('app'),
      createdAt: now,
      updatedAt: now,
      timeline: [{ status: 'submitted', timestamp: now, note: 'Application submitted' }],
      ...data,
    }
    db.applications.push(newApp)
    saveToStorage()
    Database.logActivity(
      'application_created',
      `New application — ${String((data.travelers as GenericRecord[] | undefined)?.[0]?.firstName ?? 'Unknown')} — ${String(data.destinationName ?? '')}`,
      String(newApp.id),
      String(data.userId ?? data.partnerId ?? ''),
      String(data.type ?? ''),
    )
    return newApp
  },
  updateApplicationStatus: (id: string, status: string, note: string, updatedBy?: string) => {
    const idx = db.applications.findIndex((a) => String(a.id) === id)
    if (idx === -1) return null
    const now = new Date().toISOString()
    const timeline = Array.isArray(db.applications[idx].timeline) ? (db.applications[idx].timeline as GenericRecord[]) : []
    db.applications[idx] = {
      ...db.applications[idx],
      status,
      updatedAt: now,
      timeline: [...timeline, { status, timestamp: now, note, updatedBy }],
    }
    saveToStorage()
    Database.logActivity('status_updated', `Application ${id} status changed to ${status}`, id, updatedBy, 'operations')
    const app = db.applications[idx]
    if (String(app.type) === 'b2b' && app.partnerId) {
      Database.createNotification({
        userId: String(app.partnerId),
        userType: 'partner',
        title: 'Application Status Updated',
        message: `Your application for ${String(app.destinationName ?? app.destination)} is now ${status}`,
        applicationId: id,
      })
    }
    return app
  },
  updateApplication: (id: string, updates: GenericRecord) => {
    const idx = db.applications.findIndex((a) => String(a.id) === id)
    if (idx === -1) return null
    db.applications[idx] = { ...db.applications[idx], ...updates, updatedAt: new Date().toISOString() }
    saveToStorage()
    return db.applications[idx]
  },

  getDocumentsByApplication: (applicationId: string) =>
    db.documents.filter((d) => String(d.applicationId) === applicationId),
  addDocument: (data: GenericRecord) => {
    const newDoc = { id: generateId('doc'), uploadedAt: new Date().toISOString(), status: 'pending_review', ...data }
    db.documents.push(newDoc)
    saveToStorage()
    return newDoc
  },
  updateDocumentStatus: (id: string, status: string, reviewNote: string, reviewedBy: string) => {
    const idx = db.documents.findIndex((d) => String(d.id) === id)
    if (idx === -1) return null
    db.documents[idx] = { ...db.documents[idx], status, reviewNote, reviewedBy, reviewedAt: new Date().toISOString() }
    saveToStorage()
    return db.documents[idx]
  },

  getInvoices: (filters?: { status?: string; type?: string }) => {
    let result = db.invoices
    if (filters?.status) result = result.filter((i) => String(i.status) === filters.status)
    if (filters?.type) result = result.filter((i) => String(i.type) === filters.type)
    return result
  },
  getInvoiceById: (id: string) => db.invoices.find((i) => String(i.id) === id),
  getInvoiceByNo: (invoiceNo: string) => db.invoices.find((i) => String(i.invoiceNo) === invoiceNo),
  createInvoice: (data: GenericRecord) => {
    const newInvoice = {
      id: generateId('inv'),
      invoiceNo: `ATL${Date.now().toString().slice(-8)}`,
      createdAt: new Date().toISOString(),
      status: 'unpaid',
      ...data,
    }
    db.invoices.push(newInvoice)
    saveToStorage()
    return newInvoice
  },
  markInvoicePaid: (id: string, paymentMethod: string) => {
    const idx = db.invoices.findIndex((i) => String(i.id) === id)
    if (idx === -1) return null
    db.invoices[idx] = { ...db.invoices[idx], status: 'paid', paymentMethod, paidAt: new Date().toISOString() }
    saveToStorage()
    return db.invoices[idx]
  },

  getPayments: (filters?: { status?: string; method?: string }) => {
    let result = db.payments
    if (filters?.status) result = result.filter((p) => String(p.status) === filters.status)
    if (filters?.method) result = result.filter((p) => String(p.method) === filters.method)
    return result
  },
  createPayment: (data: GenericRecord) => {
    const newPayment = {
      id: generateId('pay'),
      txnId: `TXN${Date.now().toString().slice(-8)}`,
      createdAt: new Date().toISOString(),
      ...data,
    }
    db.payments.push(newPayment)
    saveToStorage()
    return newPayment
  },

  getCommissions: (filters?: { partnerId?: string; status?: string }) => {
    let result = db.commissions
    if (filters?.partnerId) result = result.filter((c) => String(c.partnerId) === filters.partnerId)
    if (filters?.status) result = result.filter((c) => String(c.status) === filters.status)
    return result
  },
  createCommission: (data: GenericRecord) => {
    const newComm = { id: generateId('com'), createdAt: new Date().toISOString(), status: 'pending', ...data }
    db.commissions.push(newComm)
    saveToStorage()
    return newComm
  },
  markCommissionPaid: (id: string) => {
    const idx = db.commissions.findIndex((c) => String(c.id) === id)
    if (idx === -1) return null
    db.commissions[idx] = { ...db.commissions[idx], status: 'paid', paidAt: new Date().toISOString() }
    saveToStorage()
    return db.commissions[idx]
  },

  getExpenses: (filters?: { category?: string }) => {
    let result = db.expenses
    if (filters?.category) result = result.filter((e) => String(e.category) === filters.category)
    return result
  },
  createExpense: (data: GenericRecord) => {
    const newExpense = { id: generateId('exp'), createdAt: new Date().toISOString(), ...data }
    db.expenses.push(newExpense)
    saveToStorage()
    return newExpense
  },

  getOperators: () => db.operators,
  getOperatorByUsername: (username: string) => db.operators.find((o) => String(o.username) === username),
  createOperator: (data: GenericRecord) => {
    const newOp = { id: generateId('op'), createdAt: new Date().toISOString(), status: 'active', casesHandled: 0, ...data }
    db.operators.push(newOp)
    saveToStorage()
    return newOp
  },
  updateOperatorStatus: (id: string, status: string) => {
    const idx = db.operators.findIndex((o) => String(o.id) === id)
    if (idx === -1) return null
    db.operators[idx] = { ...db.operators[idx], status }
    saveToStorage()
    return db.operators[idx]
  },

  validateAdminLogin: (emailOrUsername: string, password: string) => {
    const input = emailOrUsername.trim().toLowerCase()
    const pwd = password.trim()
    if (!input || !pwd) return null
    return (
      db.admins.find((a) => {
        const email = String(a.email ?? '').toLowerCase()
        const username = String(a.username ?? 'superadmin').toLowerCase()
        return (email === input || username === input) && String(a.password) === pwd
      }) ?? null
    )
  },
  updateAdminPassword: (email: string, password: string) => {
    const normalized = email.trim().toLowerCase()
    const idx = db.admins.findIndex((a) => String(a.email ?? '').toLowerCase() === normalized)
    if (idx === -1) return null
    db.admins[idx] = { ...db.admins[idx], password: password.trim() }
    saveToStorage()
    return db.admins[idx]
  },
  validateOperatorLogin: (username: string, password: string) =>
    db.operators.find((o) => String(o.username) === username && String(o.password) === password) ?? null,

  getNotifications: (userId: string) => db.notifications.filter((n) => String(n.userId) === userId),
  createNotification: (data: GenericRecord) => {
    const newNotif = { id: generateId('notif'), createdAt: new Date().toISOString(), read: false, ...data }
    db.notifications.push(newNotif)
    saveToStorage()
    return newNotif
  },
  markNotificationRead: (id: string) => {
    const idx = db.notifications.findIndex((n) => String(n.id) === id)
    if (idx === -1) return null
    db.notifications[idx] = { ...db.notifications[idx], read: true }
    saveToStorage()
    return db.notifications[idx]
  },

  logActivity: (type: string, description: string, applicationId?: string, actor?: string, actorType?: string) => {
    const newActivity = {
      id: generateId('act'),
      type,
      description,
      applicationId,
      actor,
      actorType,
      timestamp: new Date().toISOString(),
    }
    db.activities.unshift(newActivity)
    if (db.activities.length > 200) db.activities = db.activities.slice(0, 200)
    saveToStorage()
    return newActivity
  },
  getRecentActivity: (limit = 20) => db.activities.slice(0, limit),

  getSettings: () => db.settings,
  updateIntegrationSettings: (integration: string, updates: GenericRecord) => {
    const integrations = (db.settings.integrations as GenericRecord | undefined) ?? {}
    const current = (integrations[integration] as GenericRecord | undefined) ?? {}
    integrations[integration] = { ...current, ...updates }
    db.settings = { ...db.settings, integrations }
    saveToStorage()
    return integrations[integration]
  },

  getDashboardStats: () => {
    const apps = db.applications
    const b2cApps = apps.filter((a) => String(a.type) === 'b2c')
    const b2bApps = apps.filter((a) => String(a.type) === 'b2b')
    const paidInvoices = db.invoices.filter((i) => String(i.status).toLowerCase() === 'paid')
    const unpaidInvoices = db.invoices.filter((i) => String(i.status).toLowerCase() === 'unpaid')
    const overdueInvoices = db.invoices.filter((i) => {
      const statusUnpaid = String(i.status).toLowerCase() === 'unpaid'
      return statusUnpaid && i.dueDate && new Date(String(i.dueDate)) < new Date()
    })

    return {
      totalApplications: apps.length,
      b2cApplications: b2cApps.length,
      b2bApplications: b2bApps.length,
      activeApplications: apps.filter((a) => !['approved', 'rejected', 'closed'].includes(String(a.status).toLowerCase())).length,
      approvedApplications: apps.filter((a) => String(a.status).toLowerCase() === 'approved').length,
      totalRevenue: paidInvoices.reduce((sum, i) => sum + toNum(i.total ?? i.amount), 0),
      pendingPayments: unpaidInvoices.reduce((sum, i) => sum + toNum(i.total ?? i.amount), 0),
      overdueAmount: overdueInvoices.reduce((sum, i) => sum + toNum(i.total ?? i.amount), 0),
      overdueCount: overdueInvoices.length,
      totalCommissionPending: db.commissions
        .filter((c) => String(c.status).toLowerCase() === 'pending')
        .reduce((sum, c) => sum + toNum(c.commissionAmount), 0),
      totalCommissionPaid: db.commissions
        .filter((c) => String(c.status).toLowerCase() === 'paid')
        .reduce((sum, c) => sum + toNum(c.commissionAmount), 0),
      b2bWalletTotal: db.partners.reduce((sum, p) => sum + toNum(p.walletBalance ?? 0), 0),
      b2cWalletTotal: db.users.reduce((sum, u) => sum + toNum(u.walletBalance ?? 0), 0),
      totalWalletBalance:
        db.partners.reduce((sum, p) => sum + toNum(p.walletBalance ?? 0), 0)
        + db.users.reduce((sum, u) => sum + toNum(u.walletBalance ?? 0), 0),
    }
  },

  resetDatabase: () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      console.error('Could not reset storage', e)
    }
    db = { ...defaultDb }
    window.location.reload()
  },

  exportDatabase: () => JSON.stringify(db, null, 2),
}
