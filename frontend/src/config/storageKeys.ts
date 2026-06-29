/** Obfuscated localStorage keys — migrate legacy names on startup. */
export const STORAGE_KEY = 'sv_store_v1'
export const ADMIN_AUTH_KEY = 'sv_adm_auth'
export const ADMIN_REF_KEY = 'sv_adm_ref'
export const ADMIN_EXP_KEY = 'sv_adm_exp'
export const OPS_EXP_KEY = 'sv_ops_exp'
export const AGENT_AUTH_KEY = 'sv_ptn_auth'
export const AGENT_REF_KEY = 'sv_ptn_ref'
export const AGENT_EXP_KEY = 'sv_ptn_exp'
export const USER_AUTH_KEY = 'sv_usr_auth'
export const USER_REF_KEY = 'sv_usr_ref'
export const USER_SESSION_KEY = 'sv_session'
export const USER_EXP_KEY = 'sv_usr_exp'
export const REDIRECT_KEY = 'sv_rdr'
export const HINT_KEY = 'sv_hint'
export const ATTEMPT_KEY = 'sv_attempts'
export const LOCKOUT_KEY = 'sv_lockout'

export const SESSION_MS = 8 * 60 * 60 * 1000
export const IDLE_SESSION_MS = 10 * 60 * 1000
export const ADMIN_IDLE_KEY = 'sv_adm_idle'
export const OPS_IDLE_KEY = 'sv_ops_idle'

const LEGACY_MIGRATIONS: [string, string][] = [
  ['super_visa_db', STORAGE_KEY],
  ['admin_logged_in', ADMIN_AUTH_KEY],
  ['admin_user', ADMIN_REF_KEY],
  ['agent_logged_in', AGENT_AUTH_KEY],
  ['agent_partner_id', AGENT_REF_KEY],
  ['user_logged_in', USER_AUTH_KEY],
  ['current_user_id', USER_REF_KEY],
  ['redirect_after_login', REDIRECT_KEY],
  ['supervisa_user', USER_SESSION_KEY],
  ['last_login_email', HINT_KEY],
  ['admin_login_attempts', ATTEMPT_KEY],
  ['admin_login_locked_until', LOCKOUT_KEY],
]

export function migrateLegacyStorageKeys(): void {
  if (typeof window === 'undefined') return
  for (const [oldKey, newKey] of LEGACY_MIGRATIONS) {
    const val = localStorage.getItem(oldKey)
    if (val !== null && localStorage.getItem(newKey) === null) {
      localStorage.setItem(newKey, val)
    }
    if (val !== null) localStorage.removeItem(oldKey)
  }
  // portal_user mirrors admin ref for admin sessions
  const portalUser = localStorage.getItem('portal_user')
  if (portalUser && !localStorage.getItem(ADMIN_REF_KEY)) {
    localStorage.setItem(ADMIN_REF_KEY, portalUser)
  }
  // Backfill session expiry for active sessions migrated without expiry keys
  if (localStorage.getItem(ADMIN_AUTH_KEY) === 'true' && !localStorage.getItem(ADMIN_EXP_KEY)) {
    setSessionExpiry(ADMIN_EXP_KEY)
  }
  if (localStorage.getItem('portal_role') === 'operations' && !localStorage.getItem(OPS_EXP_KEY)) {
    setSessionExpiry(OPS_EXP_KEY)
  }
  if (localStorage.getItem(AGENT_AUTH_KEY) === 'true' && !localStorage.getItem(AGENT_EXP_KEY)) {
    setSessionExpiry(AGENT_EXP_KEY)
  }
  if (localStorage.getItem(USER_AUTH_KEY) === 'true' && !localStorage.getItem(USER_EXP_KEY)) {
    setSessionExpiry(USER_EXP_KEY)
  }
  if (localStorage.getItem(ADMIN_AUTH_KEY) === 'true' && !localStorage.getItem(ADMIN_IDLE_KEY)) {
    touchIdleActivity(ADMIN_IDLE_KEY)
  }
  if (localStorage.getItem('portal_role') === 'operations' && !localStorage.getItem(OPS_IDLE_KEY)) {
    touchIdleActivity(OPS_IDLE_KEY)
  }
}

export function touchIdleActivity(idleKey: string): void {
  localStorage.setItem(idleKey, String(Date.now()))
}

export function isIdleExpired(idleKey: string): boolean {
  const last = localStorage.getItem(idleKey)
  if (!last) return true
  const ts = Number.parseInt(last, 10)
  return Number.isNaN(ts) || Date.now() - ts > IDLE_SESSION_MS
}

export function setSessionExpiry(expKey: string): void {
  localStorage.setItem(expKey, String(Date.now() + SESSION_MS))
}

export function isSessionExpired(expKey: string): boolean {
  const expiry = localStorage.getItem(expKey)
  if (!expiry) return true
  const ts = Number.parseInt(expiry, 10)
  return Number.isNaN(ts) || Date.now() > ts
}

export function refreshSessionExpiry(expKey: string): void {
  setSessionExpiry(expKey)
}

export function clearSessionKeys(authKey: string, expKey: string, refKey?: string): void {
  localStorage.removeItem(authKey)
  localStorage.removeItem(expKey)
  if (refKey) localStorage.removeItem(refKey)
}
