const ATTEMPTS_KEY = 'admin_login_attempts'
const LOCKED_UNTIL_KEY = 'admin_login_locked_until'

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000

export function getLoginLockState(): { locked: boolean; remainingMs: number; attempts: number } {
  const lockedUntil = Number(sessionStorage.getItem(LOCKED_UNTIL_KEY) || 0)
  const now = Date.now()
  if (lockedUntil > now) {
    return { locked: true, remainingMs: lockedUntil - now, attempts: MAX_ATTEMPTS }
  }
  if (lockedUntil > 0 && lockedUntil <= now) {
    sessionStorage.removeItem(LOCKED_UNTIL_KEY)
    sessionStorage.removeItem(ATTEMPTS_KEY)
  }
  const attempts = Number(sessionStorage.getItem(ATTEMPTS_KEY) || 0)
  return { locked: false, remainingMs: 0, attempts }
}

export function recordFailedLogin(): { locked: boolean; remainingMs: number; attemptsLeft: number } {
  const attempts = Number(sessionStorage.getItem(ATTEMPTS_KEY) || 0) + 1
  sessionStorage.setItem(ATTEMPTS_KEY, String(attempts))
  if (attempts >= MAX_ATTEMPTS) {
    const until = Date.now() + LOCKOUT_MS
    sessionStorage.setItem(LOCKED_UNTIL_KEY, String(until))
    return { locked: true, remainingMs: LOCKOUT_MS, attemptsLeft: 0 }
  }
  return { locked: false, remainingMs: 0, attemptsLeft: MAX_ATTEMPTS - attempts }
}

export function clearLoginAttempts() {
  sessionStorage.removeItem(ATTEMPTS_KEY)
  sessionStorage.removeItem(LOCKED_UNTIL_KEY)
}

export function formatLockoutRemaining(ms: number): string {
  const mins = Math.ceil(ms / 60000)
  return mins <= 1 ? '1 minute' : `${mins} minutes`
}
