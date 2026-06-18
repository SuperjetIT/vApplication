import { getCountry, type Country } from '../data/countries'
import type { LeadStatus } from '../types/adminTypes'
import {
  getApplicationForUserFromDb,
  getApplicationsForUserFromDb,
} from './dbMappers'

export type ApplicationStatus =
  | 'In Progress'
  | 'Payment Pending'
  | 'Docs Pending'
  | 'Submitted'
  | 'Approved'
  | 'Rejected'

export type UserApplication = {
  id: string
  userEmail: string
  countrySlug: string
  countryName: string
  countryCode: string
  status: ApplicationStatus
  appliedOn: string
  travelers: number
  totalAed: number
  leadId?: string
  invoiceNo?: string
  paymentMethod?: 'Card' | 'Bank Transfer'
  visaType?: string
}

export function mapLeadStatusToApplicationStatus(status: LeadStatus): ApplicationStatus {
  switch (status) {
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

export function getApplicationsForUser(email: string): UserApplication[] {
  return getApplicationsForUserFromDb(email)
}

export function getApplicationForUser(
  email: string,
  applicationId: string,
): UserApplication | undefined {
  return getApplicationForUserFromDb(email, applicationId)
}

export function getCountryForApplication(app: UserApplication) {
  return getCountry(app.countrySlug)
}

/** @deprecated B2C applications are created via Database.createApplication in ApplyPage */
export function createApplication(
  _email: string,
  _country: Country,
  _travelers: number,
  _totalAed: number,
): UserApplication {
  throw new Error('createApplication is deprecated — use Database.createApplication')
}

/** @deprecated Status updates flow through Database.updateApplicationStatus */
export function updateApplicationMeta() {
  /* no-op — legacy localStorage path removed */
}
