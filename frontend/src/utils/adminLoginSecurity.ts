import { ATTEMPT_KEY, LOCKOUT_KEY } from '../config/storageKeys'

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000

export function getLoginLockState(): { locked: boolean; remainingMs: number; attempts: number } {
  const lockedUntil = Number(localStorage.getItem(LOCKOUT_KEY) || 0)
  const now = Date.now()
  if (lockedUntil > now) {
    return { locked: true, remainingMs: lockedUntil - now, attempts: MAX_ATTEMPTS }
  }
  if (lockedUntil > 0 && lockedUntil <= now) {
    localStorage.removeItem(LOCKOUT_KEY)
    localStorage.removeItem(ATTEMPT_KEY)
  }
  const attempts = Number(localStorage.getItem(ATTEMPT_KEY) || 0)
  return { locked: false, remainingMs: 0, attempts }
}

export function recordFailedLogin(): { locked: boolean; remainingMs: number; attemptsLeft: number } {
  const attempts = Number(localStorage.getItem(ATTEMPT_KEY) || 0) + 1
  localStorage.setItem(ATTEMPT_KEY, String(attempts))
  if (attempts >= MAX_ATTEMPTS) {
    const until = Date.now() + LOCKOUT_MS
    localStorage.setItem(LOCKOUT_KEY, String(until))
    return { locked: true, remainingMs: LOCKOUT_MS, attemptsLeft: 0 }
  }
  return { locked: false, remainingMs: 0, attemptsLeft: MAX_ATTEMPTS - attempts }
}

export function clearLoginAttempts() {
  localStorage.removeItem(ATTEMPT_KEY)
  localStorage.removeItem(LOCKOUT_KEY)
}

export function formatLockoutRemaining(ms: number): string {
  const mins = Math.ceil(ms / 60000)
  return mins <= 1 ? '1 minute' : `${mins} minutes`
}
