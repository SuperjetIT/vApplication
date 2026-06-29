import { Database } from '../database/db'

type UserRecord = Record<string, unknown>

/** B2C user registered via passwordless OTP / sign-in (not via apply checkout). */
export function isB2cSignInRegistration(user: UserRecord): boolean {
  const source = String(user.registrationSource ?? '').toLowerCase()
  if (source === 'application') return false
  const method = String(user.registrationMethod ?? '').toLowerCase()
  if (method === 'passwordless' || source === 'sign_in') return true
  // Legacy rows: treat as sign-in when they have no visa applications yet
  return countUserApplications(user) === 0
}

export function countUserApplications(user: UserRecord): number {
  const id = String(user.id ?? '')
  if (!id) return 0
  return Database.getApplications({ userId: id }).length
}

/** B2C Users page — customers who have submitted at least one visa application. */
export function isB2cApplicationCustomer(user: UserRecord): boolean {
  return countUserApplications(user) > 0
}

/** Registrations → B2C tab — sign-in / OTP registrations only. */
export function isB2cRegistrationRow(user: UserRecord): boolean {
  return isB2cSignInRegistration(user)
}
