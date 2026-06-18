import type { ApplicationStatus } from './applications'
import { mapLeadStatusToApplicationStatus } from './applications'
import type { AdminLead, LeadStatus } from '../data/adminMockData'

const STORAGE_KEY = 'agent_applications'

export type AgentApplication = {
  id: string
  agentId: string
  leadId: string
  customerName: string
  customerEmail: string
  destination: string
  destCode: string
  countrySlug: string
  visaType: string
  status: ApplicationStatus
  submittedOn: string
  totalAed: number
  commissionAed: number
  commissionPaid: boolean
  documentsComplete: boolean
  documentNames: string[]
  paymentMethod: 'Partner Wallet'
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function loadAgentApplications(): AgentApplication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AgentApplication[]
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    /* empty */
  }
  return []
}

export function saveAgentApplications(apps: AgentApplication[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps))
}

export function getApplicationsForAgent(agentId: string): AgentApplication[] {
  return loadAgentApplications().filter((a) => a.agentId === agentId)
}

export function getAgentApplicationById(agentId: string, applicationId: string): AgentApplication | undefined {
  return getApplicationsForAgent(agentId).find((a) => a.id === applicationId)
}

export function getAgentApplicationByLeadId(leadId: string): AgentApplication | undefined {
  return loadAgentApplications().find((a) => a.leadId === leadId)
}

export function createAgentApplication(
  input: Omit<AgentApplication, 'id' | 'submittedOn' | 'commissionPaid'>,
): AgentApplication {
  const application: AgentApplication = {
    ...input,
    id: `ag-app-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    submittedOn: formatDate(new Date()),
    commissionPaid: false,
  }
  saveAgentApplications([application, ...loadAgentApplications()])
  return application
}

export function updateAgentApplication(
  applicationId: string,
  patch: Partial<Pick<AgentApplication, 'status' | 'commissionPaid' | 'documentsComplete'>>,
): AgentApplication | undefined {
  const apps = loadAgentApplications()
  const app = apps.find((a) => a.id === applicationId)
  if (!app) return undefined
  const updated = { ...app, ...patch }
  saveAgentApplications(apps.map((a) => (a.id === applicationId ? updated : a)))
  return updated
}

export function syncAgentApplicationFromLead(lead: AdminLead): AgentApplication | undefined {
  if (!lead.agentApplicationId) return undefined
  const status = mapLeadStatusToApplicationStatus(lead.status)
  return updateAgentApplication(lead.agentApplicationId, {
    status,
    documentsComplete: lead.documentsComplete ?? false,
  })
}

export function mapLeadStatusForAgent(status: LeadStatus): ApplicationStatus {
  return mapLeadStatusToApplicationStatus(status)
}
