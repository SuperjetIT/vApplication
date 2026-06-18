import type { Country } from '../data/countries'
import type { AdminLead, LeadStatus } from '../data/adminMockData'
import {
  createAgentApplication,
  getAgentApplicationByLeadId,
  syncAgentApplicationFromLead,
  updateAgentApplication,
} from './agentApplications'
import {
  creditAgentCommission,
  deductAgentWallet,
  incrementAgentLeadCount,
  loadAgents,
  saveAgents,
} from './agentAuth'
import { loadLeads, saveLeads } from './leadsStore'

export const B2B_COMMISSION_RATE = 0.1

export function parseFeeAed(fee: string): number {
  const match = fee.match(/[\d,]+/)
  if (!match) return 0
  return Number(match[0].replace(/,/g, '')) || 0
}

export type B2BSubmitInput = {
  agentId: string
  agentName: string
  customerName: string
  customerEmail: string
  passportNationality: string
  passportCode: string
  country: Country
  visaType: string
  travelers: number
  totalAed: number
  govFee: number
  processingFee: number
  documentsComplete: boolean
  documentNames: string[]
}

function resolveLeadStatus(input: B2BSubmitInput): LeadStatus {
  if (!input.documentsComplete) return 'Docs Pending'
  return 'Under Review'
}

export function submitB2BApplication(
  input: B2BSubmitInput,
):
  | { ok: true; lead: AdminLead; agentApplicationId: string }
  | { ok: false; reason: 'insufficient_wallet' } {
  if (!deductAgentWallet(input.agentId, input.totalAed)) {
    return { ok: false, reason: 'insufficient_wallet' }
  }

  const commissionAed = Math.round(input.totalAed * B2B_COMMISSION_RATE)
  const leadStatus = resolveLeadStatus(input)
  const leadId = `b2b-${Date.now()}`

  const agentApp = createAgentApplication({
    agentId: input.agentId,
    leadId,
    customerName: input.customerName,
    customerEmail: input.customerEmail.trim().toLowerCase(),
    destination: input.country.name,
    destCode: input.country.countryCode,
    countrySlug: input.country.slug,
    visaType: input.visaType,
    status: leadStatus === 'Docs Pending' ? 'Docs Pending' : 'In Progress',
    totalAed: input.totalAed,
    commissionAed,
    documentsComplete: input.documentsComplete,
    documentNames: input.documentNames,
    paymentMethod: 'Partner Wallet',
  })

  const lead: AdminLead = {
    id: leadId,
    name: input.customerName,
    email: input.customerEmail.trim().toLowerCase(),
    passport: input.passportNationality,
    passportCode: input.passportCode,
    destination: input.country.name,
    destCode: input.country.countryCode,
    source: 'B2B',
    status: leadStatus,
    assigned: input.agentName,
    created: 'Just now',
    visaType: input.visaType,
    amount: input.totalAed,
    documentsComplete: input.documentsComplete,
    paymentMethod: undefined,
    agentId: input.agentId,
    agentName: input.agentName,
    agentApplicationId: agentApp.id,
    commissionAed,
    commissionPaid: false,
  }

  saveLeads([lead, ...loadLeads()])
  incrementAgentLeadCount(input.agentId)

  return { ok: true, lead, agentApplicationId: agentApp.id }
}

export function applyCommissionOnApproval(lead: AdminLead) {
  if (lead.commissionPaid || !lead.agentId || !lead.commissionAed) return

  creditAgentCommission(lead.agentId, lead.commissionAed)

  const agents = loadAgents()
  saveAgents(
    agents.map((a) =>
      a.id === lead.agentId ? { ...a, revenue: a.revenue + (lead.amount ?? 0) } : a,
    ),
  )

  const leads = loadLeads()
  saveLeads(
    leads.map((l) =>
      l.id === lead.id ? { ...l, commissionPaid: true } : l,
    ),
  )

  if (lead.agentApplicationId) {
    updateAgentApplication(lead.agentApplicationId, { commissionPaid: true })
  }
}

export function syncB2BLeadStatus(lead: AdminLead, status: LeadStatus): AdminLead {
  if (lead.agentApplicationId) {
    syncAgentApplicationFromLead({ ...lead, status })
  }
  if (status === 'Approved' && lead.agentId && !lead.commissionPaid) {
    applyCommissionOnApproval({ ...lead, status })
  }
  return lead
}

export function buildAgentNotifyMessage(lead: AdminLead): string {
  const partner = lead.agentName ?? 'Partner'
  const customer = lead.name

  if (lead.status === 'Docs Pending') {
    return `Hello ${partner}, the ${lead.destination} visa application for your customer ${customer} requires additional documents. Please sign in to your B2B partner portal and re-upload the missing documents. Do not contact the customer directly — we will notify you when action is needed.`
  }
  if (lead.status === 'Approved') {
    return `Hello ${partner}, great news! The ${lead.destination} visa application for your customer ${customer} has been approved. Please inform your customer. Commission of AED ${lead.commissionAed ?? 0} has been credited to your partner wallet.`
  }
  if (lead.status === 'Rejected') {
    return `Hello ${partner}, we have an update on the ${lead.destination} visa application for your customer ${customer}. The application was not approved. Please check your B2B partner portal for details and inform your customer.`
  }
  if (lead.status === 'Submitted') {
    return `Hello ${partner}, the ${lead.destination} visa application for your customer ${customer} has been submitted to the embassy. We will update you when there is a decision.`
  }
  return `Hello ${partner}, update on the ${lead.destination} visa application for your customer ${customer}: status is now "${lead.status}". Check your B2B partner portal for details.`
}

export function getAgentPhoneForLead(lead: AdminLead): string | undefined {
  if (!lead.agentId) return undefined
  const agent = loadAgents().find((a) => a.id === lead.agentId)
  return agent?.email
}

export function rehydrateAgentApplication(leadId: string) {
  return getAgentApplicationByLeadId(leadId)
}
