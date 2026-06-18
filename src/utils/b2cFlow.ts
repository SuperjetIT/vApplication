import { Database } from '../database/db'
import type { AdminLead, LeadStatus } from '../types/adminTypes'
import { getLeadById, loadLeads } from './leadsStore'
import { leadStatusToDbStatus } from './dbMappers'

export { getLeadById, loadLeads }

export function updateLeadStatus(leadId: string, status: LeadStatus, operatorId?: string): AdminLead | undefined {
  const dbStatus = leadStatusToDbStatus(status)
  Database.updateApplicationStatus(leadId, dbStatus, `Status changed to ${status}`, operatorId)

  if (status === 'Approved') {
    const app = Database.getApplicationById(leadId)
    if (app && String(app.type) === 'b2b' && app.partnerId) {
      const commissions = Database.getCommissions({ partnerId: String(app.partnerId) })
      const comm = commissions.find((c) => String(c.applicationId) === leadId)
      if (comm && String(comm.status).toLowerCase() !== 'paid') {
        Database.markCommissionPaid(String(comm.id))
        const amount = Number(comm.commissionAmount ?? 0)
        if (amount > 0) Database.creditPartnerWallet(String(app.partnerId), amount)
      }
    }
  }

  return getLeadById(leadId)
}

export function requestDocumentReupload(leadId: string, operatorId?: string): AdminLead | undefined {
  return updateLeadStatus(leadId, 'Docs Pending', operatorId)
}

export function buildCustomerNotifyMessage(lead: AdminLead): string {
  if (lead.status === 'Docs Pending') {
    return `Hello ${lead.name}, this is Superjet Global regarding your ${lead.destination} visa application. Some documents are missing or need to be re-uploaded. Please sign in to your account and complete your document upload, or reply here for assistance.`
  }
  if (lead.status === 'Approved') {
    return `Hello ${lead.name}, great news! Your ${lead.destination} visa application has been approved. Log in to your Superjet Global account to view details.`
  }
  if (lead.status === 'Rejected') {
    return `Hello ${lead.name}, we have an update on your ${lead.destination} visa application. Please check your Superjet Global account or contact us for details.`
  }
  return `Hello ${lead.name}, this is Superjet Global regarding your ${lead.destination} visa application (${lead.status}). Please check your email or account for next steps.`
}

export function buildAgentNotifyMessage(lead: AdminLead): string {
  const partner = lead.agentName ?? 'Partner'
  const customer = lead.name

  if (lead.status === 'Docs Pending') {
    return `Hello ${partner}, the ${lead.destination} visa application for your customer ${customer} requires additional documents. Please sign in to your B2B partner portal and re-upload the missing documents.`
  }
  if (lead.status === 'Approved') {
    return `Hello ${partner}, great news! The ${lead.destination} visa application for your customer ${customer} has been approved. Commission of AED ${lead.commissionAed ?? 0} has been credited to your partner wallet.`
  }
  if (lead.status === 'Rejected') {
    return `Hello ${partner}, we have an update on the ${lead.destination} visa application for your customer ${customer}. Please check your B2B partner portal for details.`
  }
  return `Hello ${partner}, update on the ${lead.destination} visa application for your customer ${customer}: status is now "${lead.status}". Check your B2B partner portal for details.`
}
