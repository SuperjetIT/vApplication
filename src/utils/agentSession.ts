import { Database } from '../database/db'

export const AGENT_LOGGED_IN_KEY = 'agent_logged_in'
export const AGENT_PARTNER_ID_KEY = 'agent_partner_id'

export function isAgentLoggedIn(): boolean {
  return localStorage.getItem(AGENT_LOGGED_IN_KEY) === 'true'
}

export function getAgentPartnerId(): string | null {
  return localStorage.getItem(AGENT_PARTNER_ID_KEY)
}

export function getCurrentPartner() {
  const id = getAgentPartnerId()
  if (!id) return null
  return Database.getPartnerById(id) ?? null
}

export function setAgentSession(partnerId: string) {
  localStorage.setItem(AGENT_LOGGED_IN_KEY, 'true')
  localStorage.setItem(AGENT_PARTNER_ID_KEY, partnerId)
}

export function clearAgentSession() {
  localStorage.removeItem(AGENT_LOGGED_IN_KEY)
  localStorage.removeItem(AGENT_PARTNER_ID_KEY)
}

export function getPartnerWalletBalance(partnerId: string): number {
  const partner = Database.getPartnerById(partnerId)
  return Number(partner?.walletBalance ?? 2400)
}

export function parseFeeAed(fee: string): number {
  const match = fee.match(/[\d,]+/)
  if (!match) return 0
  return Number(match[0].replace(/,/g, '')) || 0
}
