import { Database } from '../database/db'

export const SUPER_ADMIN_EMAIL = 'admin@superjetglobal.com'
export const SUPER_ADMIN_USERNAME = 'superadmin'

export type AdminSessionUser = {
  name: string
  email: string
  role: 'admin'
}

export function authenticateAdminUser(
  emailOrUsername: string,
  password: string,
): { ok: true; user: AdminSessionUser } | { ok: false; reason: 'invalid' } {
  const input = emailOrUsername.trim().toLowerCase()
  const pwd = password.trim()
  if (!input || !pwd) return { ok: false, reason: 'invalid' }

  const admin = Database.validateAdminLogin(input, pwd)
  if (admin) {
    return {
      ok: true,
      user: {
        name: String(admin.fullName ?? 'Super Admin'),
        email: String(admin.email),
        role: 'admin',
      },
    }
  }

  return { ok: false, reason: 'invalid' }
}

export function updateSuperAdminPassword(password: string): boolean {
  const trimmed = password.trim()
  if (!trimmed) return false
  return Boolean(Database.updateAdminPassword(SUPER_ADMIN_EMAIL, trimmed))
}

export function isSuperAdminUser(user: { email?: string; id?: string; role?: string }): boolean {
  return (
    user.email?.toLowerCase() === SUPER_ADMIN_EMAIL
    || user.id === 'adm_001'
    || user.id === '1'
    || user.role === 'Admin'
    || user.role === 'super_admin'
  )
}
