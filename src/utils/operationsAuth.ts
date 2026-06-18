import { MOCK_USERS, type AdminUser } from '../data/adminMockData'

const STORAGE_KEY = 'admin_operation_users'

export type OperationStaffUser = AdminUser & { password: string }

const DEFAULT_OPS = (): OperationStaffUser[] =>
  MOCK_USERS.filter((u) => u.email !== 'admin@superjetglobal.com').map((u) => ({
    ...u,
    password: u.password ?? u.username,
  }))

export function loadOperationUsers(): OperationStaffUser[] {
  const defaults = DEFAULT_OPS()
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
        const result = [...merged, ...extras]
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
