import type { AdminLead } from '../types/adminTypes'
import { applicationToLead, loadLeadsFromDatabase } from './dbMappers'
import { Database } from '../database/db'

export function loadLeads(): AdminLead[] {
  return loadLeadsFromDatabase()
}

export function getLeadById(id: string): AdminLead | undefined {
  const app = Database.getApplicationById(id)
  if (app) return applicationToLead(app as Record<string, unknown>)
  return loadLeads().find((l) => l.id === id || l.applicationId === id)
}

/** @deprecated Applications are persisted via Database — kept for legacy b2bFlow compatibility */
export function saveLeads(_leads: AdminLead[]) {
  /* no-op */
}
