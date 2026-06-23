import { MOCK_USERS, type AdminUser } from '../data/adminMockData'
import { SUPER_ADMIN_EMAIL } from './adminAuth'
import { clearPortalSession, getPortalRole, getPortalUser } from './portalAuth'

const STORAGE_KEY = 'admin_operation_users'
const DELETED_KEY = 'admin_operation_users_deleted'

export type OperationStaffUser = AdminUser & { password: string }

function loadDeletedKeys(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.map((v) => String(v).toLowerCase()))
  } catch {
    return new Set()
  }
}

function saveDeletedKeys(keys: Set<string>) {
  localStorage.setItem(DELETED_KEY, JSON.stringify([...keys]))
}

function isDeletedUser(user: OperationStaffUser, deleted: Set<string>): boolean {
  return deleted.has(user.id) || deleted.has(user.email.toLowerCase()) || deleted.has(user.username.toLowerCase())
}

const DEFAULT_OPS = (): OperationStaffUser[] =>
  MOCK_USERS.filter((u) => u.email !== SUPER_ADMIN_EMAIL).map((u) => ({
    ...u,
    password: u.password ?? u.username,
  }))

export function loadOperationUsers(): OperationStaffUser[] {
  const deleted = loadDeletedKeys()
  const defaults = DEFAULT_OPS().filter((u) => !isDeletedUser(u, deleted))
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as OperationStaffUser[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        const merged = defaults.map((def) => {
          const stored = parsed.find((p) => p.id === def.id || p.email.toLowerCase() === def.email.toLowerCase())
          if (!stored) return def
          return {
            ...def,
            ...stored,
            password: stored.password || def.password,
          }
        })
        const extras = parsed
          .filter((p) => !defaults.some((d) => d.id === p.id || d.email.toLowerCase() === p.email.toLowerCase()))
          .map((p) => ({ ...p, password: p.password || p.username }))
        const result = [...merged, ...extras].filter((u) => !isDeletedUser(u, deleted))
        saveOperationUsers(result)
        return result
      }
    }
  } catch {
    /* fall through to defaults */
  }
  saveOperationUsers(defaults)
  return defaults
}

export function saveOperationUsers(users: OperationStaffUser[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
}

export function authenticateOperationsUser(
  emailOrUsername: string,
  password: string,
): { ok: true; user: OperationStaffUser } | { ok: false; reason: 'invalid' | 'inactive' } {
  const input = emailOrUsername.trim().toLowerCase()
  const pwd = password.trim()
  if (!input || !pwd) return { ok: false, reason: 'invalid' }

  const users = loadOperationUsers()
  const user = users.find(
    (u) => u.email.toLowerCase() === input || u.username.toLowerCase() === input,
  )

  if (!user || user.password !== pwd) return { ok: false, reason: 'invalid' }
  if (user.status !== 'Active') return { ok: false, reason: 'inactive' }

  return { ok: true, user }
}

export function updateOperationUserPassword(userId: string, password: string) {
  const users = loadOperationUsers()
  saveOperationUsers(users.map((u) => (u.id === userId ? { ...u, password } : u)))
}

export function setOperationUserStatus(userId: string, status: AdminUser['status']) {
  const users = loadOperationUsers()
  saveOperationUsers(users.map((u) => (u.id === userId ? { ...u, status } : u)))
}

export function deleteOperationUser(userId: string): { ok: true } | { ok: false; reason: 'not_found' | 'protected' } {
  const users = loadOperationUsers()
  const target = users.find((u) => u.id === userId)
  if (!target) return { ok: false, reason: 'not_found' }
  if (target.email.toLowerCase() === SUPER_ADMIN_EMAIL) return { ok: false, reason: 'protected' }

  const next = users.filter((u) => u.id !== userId)
  saveOperationUsers(next)

  const deleted = loadDeletedKeys()
  deleted.add(target.id)
  deleted.add(target.email.toLowerCase())
  deleted.add(target.username.toLowerCase())
  saveDeletedKeys(deleted)

  const portalUser = getPortalUser()
  const portalRole = getPortalRole()
  if (
    portalRole === 'operations'
    && portalUser?.email?.toLowerCase() === target.email.toLowerCase()
  ) {
    clearPortalSession()
  }

  return { ok: true }
}
