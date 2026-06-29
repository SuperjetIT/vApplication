import {
  ADMIN_AUTH_KEY,
  ADMIN_EXP_KEY,
  ADMIN_IDLE_KEY,
  ADMIN_REF_KEY,
  AGENT_AUTH_KEY,
  AGENT_EXP_KEY,
  AGENT_REF_KEY,
  clearSessionKeys,
  isIdleExpired,
  isSessionExpired,
  OPS_EXP_KEY,
  OPS_IDLE_KEY,
  refreshSessionExpiry,
  USER_AUTH_KEY,
  USER_EXP_KEY,
  USER_REF_KEY,
} from '../config/storageKeys'
import { clearPortalSession, getPortalRole } from './portalAuth'
import { clearAgentSession } from './agentSession'

export function validateAdminSession(): boolean {
  const role = getPortalRole()
  if (role === 'operations') {
    if (isSessionExpired(OPS_EXP_KEY) || isIdleExpired(OPS_IDLE_KEY)) {
      clearPortalSession()
      return false
    }
    return true
  }
  if (role !== 'admin') return false
  const authed = localStorage.getItem(ADMIN_AUTH_KEY) === 'true'
  if (!authed || isSessionExpired(ADMIN_EXP_KEY) || isIdleExpired(ADMIN_IDLE_KEY)) {
    clearPortalSession()
    clearSessionKeys(ADMIN_AUTH_KEY, ADMIN_EXP_KEY, ADMIN_REF_KEY)
    return false
  }
  return true
}

export function validateAgentSession(): boolean {
  if (localStorage.getItem(AGENT_AUTH_KEY) !== 'true') return false
  if (isSessionExpired(AGENT_EXP_KEY)) {
    clearAgentSession()
    clearSessionKeys(AGENT_AUTH_KEY, AGENT_EXP_KEY, AGENT_REF_KEY)
    return false
  }
  refreshSessionExpiry(AGENT_EXP_KEY)
  return true
}

export function validateUserSession(): boolean {
  if (localStorage.getItem(USER_AUTH_KEY) !== 'true') return false
  if (isSessionExpired(USER_EXP_KEY)) {
    clearSessionKeys(USER_AUTH_KEY, USER_EXP_KEY, USER_REF_KEY)
    localStorage.removeItem('sv_session')
    return false
  }
  refreshSessionExpiry(USER_EXP_KEY)
  return true
}
