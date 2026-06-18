export type LeadStatus =
  | 'New Application'
  | 'Contacted'
  | 'Qualified'
  | 'Payment Pending'
  | 'Docs Pending'
  | 'Under Review'
  | 'Submitted'
  | 'Approved'
  | 'Rejected'
  | 'Closed'

export type InvoiceStatus = 'PAID' | 'UNPAID' | 'OVERDUE' | 'REFUNDED'
export type PaymentStatus = 'Success' | 'Pending' | 'Failed' | 'Refunded'

export interface AdminLead {
  id: string
  name: string
  email: string
  passport: string
  passportCode: string
  destination: string
  destCode: string
  source: 'B2C' | 'B2B'
  status: LeadStatus
  assigned: string
  created: string
  visaType: string
  applicationId?: string
  invoiceNo?: string
  paymentMethod?: 'Card' | 'Bank Transfer'
  amount?: number
  documentsComplete?: boolean
  agentId?: string
  agentName?: string
  agentApplicationId?: string
  commissionAed?: number
  commissionPaid?: boolean
}

export interface AdminCustomer {
  id: string
  name: string
  email: string
  username: string
  password: string
  phone: string
  nationality: string
  applications: number
  totalSpent: number
  lastActive: string
  profileImage?: string
}

export interface AdminAgent {
  id: string
  name: string
  email: string
  username: string
  password: string
  leads: number
  revenue: number
  commission: number
  status: 'Active' | 'Inactive'
  profileImage?: string
  walletBalance?: number
}

export interface AdminInvoice {
  id: string
  invoiceNo: string
  customer: string
  destination: string
  amount: number
  govFee: number
  processingFee: number
  status: InvoiceStatus
  date: string
  dueDate: string
  countryCode: string
  paymentMethod: 'Card' | 'Bank Transfer'
}

export interface AdminPayment {
  id: string
  txnId: string
  customer: string
  amount: number
  method: 'Card' | 'Bank Transfer' | 'Wallet'
  methodDetail: string
  gateway: 'Stripe' | 'Bank'
  status: PaymentStatus
  date: string
  invoiceNo: string
}

export interface AdminExpense {
  id: string
  category: string
  description: string
  amount: number
  date: string
  addedBy: string
  hasReceipt: boolean
  receiptName?: string
}

export interface AdminActivity {
  id: string
  type: 'approved' | 'rejected' | 'lead' | 'payment' | 'doc' | 'agent'
  text: string
  time: string
}

export interface AdminUser {
  id: string
  name: string
  email: string
  username: string
  password?: string
  role: string
  status: 'Active' | 'Inactive'
  created: string
  lastLogin: string
}

export interface AdminCase {
  id: string
  customer: string
  destination: string
  status: LeadStatus
  assigned: string
  created: string
  passportCode: string
}

export const LEAD_STATUSES: LeadStatus[] = [
  'New Application',
  'Contacted',
  'Qualified',
  'Payment Pending',
  'Docs Pending',
  'Under Review',
  'Submitted',
  'Approved',
  'Rejected',
  'Closed',
]

export function getStatusColor(status: LeadStatus): { bg: string; color: string; border: string } {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    'New Application': { bg: '#f8f9fc', color: '#6b7280', border: '#e5e7eb' },
    Contacted: { bg: '#eff6ff', color: '#3b82f6', border: '#bfdbfe' },
    Qualified: { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
    'Payment Pending': { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
    'Docs Pending': { bg: '#fefce8', color: '#a16207', border: '#fde68a' },
    'Under Review': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    Submitted: { bg: '#f5f3ff', color: '#6d28d9', border: '#c4b5fd' },
    Approved: { bg: '#f0fff4', color: '#15803d', border: '#bbf7d0' },
    Rejected: { bg: '#fff0f0', color: '#b91c1c', border: '#fca5a5' },
    Closed: { bg: '#f9fafb', color: '#374151', border: '#e5e7eb' },
  }
  return map[status] ?? { bg: '#f8f9fc', color: '#6b7280', border: '#e5e7eb' }
}

export function getInvoiceStatusStyle(status: InvoiceStatus) {
  const map: Record<InvoiceStatus, { bg: string; color: string; border: string }> = {
    PAID: { bg: '#f0fff4', color: '#16a34a', border: '#bbf7d0' },
    UNPAID: { bg: '#fffbeb', color: '#92400e', border: '#fcd34d' },
    OVERDUE: { bg: '#fff0f0', color: '#b91c1c', border: '#fca5a5' },
    REFUNDED: { bg: '#f5f3ff', color: '#6d28d9', border: '#c4b5fd' },
  }
  return map[status]
}

export const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #f93e42, #ff6b6b)',
  'linear-gradient(135deg, #5057ea, #818cf8)',
  'linear-gradient(135deg, #22c55e, #86efac)',
  'linear-gradient(135deg, #f59e0b, #fcd34d)',
  'linear-gradient(135deg, #8b5cf6, #c4b5fd)',
  'linear-gradient(135deg, #ec4899, #f9a8d4)',
  'linear-gradient(135deg, #06b6d4, #67e8f9)',
]

export function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function getAvatarGradient(name: string): string {
  return AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length]
}

export function getUniqueDestinations(leads: AdminLead[]): string[] {
  return [...new Set(leads.map((l) => l.destination))].sort()
}
