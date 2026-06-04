import { getCountry, type Country } from '../data/countries'

export type ApplicationStatus = 'In Progress' | 'Approved' | 'Submitted'

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
}

const STORAGE_PREFIX = 'supervisa_applications_'

function storageKey(email: string) {
  return `${STORAGE_PREFIX}${email.trim().toLowerCase()}`
}

function formatAppliedDate(date: Date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function getApplicationsForUser(email: string): UserApplication[] {
  const normalized = email.trim().toLowerCase()
  try {
    const raw = localStorage.getItem(storageKey(normalized))
    if (!raw) return []
    const parsed = JSON.parse(raw) as UserApplication[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter((app) => app.userEmail?.toLowerCase() === normalized)
  } catch {
    return []
  }
}

export function getApplicationForUser(
  email: string,
  applicationId: string,
): UserApplication | undefined {
  return getApplicationsForUser(email).find((app) => app.id === applicationId)
}

export function createApplication(
  email: string,
  country: Country,
  travelers: number,
  totalAed: number,
): UserApplication {
  const normalized = email.trim().toLowerCase()
  const application: UserApplication = {
    id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    userEmail: normalized,
    countrySlug: country.slug,
    countryName: country.name,
    countryCode: country.countryCode,
    status: 'In Progress',
    appliedOn: formatAppliedDate(new Date()),
    travelers,
    totalAed,
  }

  const existing = getApplicationsForUser(normalized)
  localStorage.setItem(storageKey(normalized), JSON.stringify([application, ...existing]))
  return application
}

export function getCountryForApplication(app: UserApplication) {
  return getCountry(app.countrySlug)
}
