import { Database } from '../database/db'
import { notifyAdminNewUser } from './adminNotifications'

function hasUserRegistrationNotification(userId: string): boolean {
  return Database.getAdminNotifications().some(
    (n) => String(n.category) === 'b2c_user_registered' && String(n.userId) === userId,
  )
}

/** Pull B2C user registrations/logins from the API into local Database (shared across hosts/tabs). */
export async function syncUsersFromServer(): Promise<number> {
  try {
    const res = await fetch('/api/users')
    if (!res.ok) return 0
    const payload = (await res.json()) as { users?: Record<string, unknown>[] }
    const remote = Array.isArray(payload.users) ? payload.users : []
    let added = 0

    for (const user of remote) {
      const email = String(user.email ?? '').trim().toLowerCase()
      if (!email) continue

      const existing = Database.getUserByEmail(email)
      if (!existing) {
        Database.mergeUser(user)
        added += 1
        const userId = String(user.id ?? '')
        if (userId && !hasUserRegistrationNotification(userId)) {
          notifyAdminNewUser({
            userId,
            fullName: String(user.fullName ?? ''),
            email,
            phone: String(user.phone ?? '') || undefined,
            source: user.registrationSource === 'application' ? 'application' : 'sign_in',
          })
        }
      } else {
        Database.mergeUser(user)
      }
    }

    return added
  } catch {
    return 0
  }
}

export async function deleteUserOnServer(id: string): Promise<void> {
  try {
    await fetch(`/api/users/${encodeURIComponent(id)}`, { method: 'DELETE' })
  } catch {
    /* best-effort — local Database already updated */
  }
}

export async function syncUserToServer(data: Record<string, unknown>): Promise<void> {
  try {
    await fetch('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  } catch {
    /* best-effort — local Database already updated */
  }
}
