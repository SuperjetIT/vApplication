import { Database } from '../database/db'
import {
  AGENT_AUTH_KEY,
  AGENT_EXP_KEY,
  AGENT_REF_KEY,
  setSessionExpiry,
} from '../config/storageKeys'

export const AGENT_LOGGED_IN_KEY = AGENT_AUTH_KEY
export const AGENT_PARTNER_ID_KEY = AGENT_REF_KEY

export function isAgentLoggedIn(): boolean {
  return localStorage.getItem(AGENT_AUTH_KEY) === 'true'
}

export function getAgentPartnerId(): string | null {
  return localStorage.getItem(AGENT_REF_KEY)
}

export function getCurrentPartner() {
  const id = getAgentPartnerId()
  if (!id) return null
  return Database.getPartnerById(id) ?? null
}

export function setAgentSession(partnerId: string) {
  localStorage.setItem(AGENT_AUTH_KEY, 'true')
  localStorage.setItem(AGENT_REF_KEY, partnerId)
  setSessionExpiry(AGENT_EXP_KEY)
}

export function clearAgentSession() {
  localStorage.removeItem(AGENT_AUTH_KEY)
  localStorage.removeItem(AGENT_REF_KEY)
  localStorage.removeItem(AGENT_EXP_KEY)
}

export function getPartnerWalletBalance(partnerId: string): number {
  return Database.getPartnerWalletBalance(partnerId)
}

export function parseFeeAed(fee: string): number {
  const match = fee.match(/[\d,]+/)
  if (!match) return 0
  return Number(match[0].replace(/,/g, '')) || 0
}
