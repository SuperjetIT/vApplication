import { type AdminAgent } from '../data/adminMockData'

const STORAGE_KEY = 'sv_b2b_agents_v1'
const DEFAULT_WALLET = 15000

export type StoredAgent = AdminAgent & { password: string }

/** No demo partners — B2B signup / admin create only. */
export function loadAgents(): StoredAgent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as StoredAgent[]
      if (Array.isArray(parsed)) {
        const result = parsed.map((p) => ({
          ...p,
          password: p.password ?? '',
          walletBalance: p.walletBalance ?? DEFAULT_WALLET,
        }))
        saveAgents(result)
        return result
      }
    }
  } catch {
    /* fall through */
  }
  saveAgents([])
  return []
}

export function saveAgents(agents: StoredAgent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(agents))
}

export function getAgentById(agentId: string): StoredAgent | undefined {
  return loadAgents().find((a) => a.id === agentId)
}

export function authenticateAgent(
  emailOrUsername: string,
  password: string,
): { ok: true; agent: StoredAgent } | { ok: false; reason: 'invalid' | 'inactive' } {
  const input = emailOrUsername.trim().toLowerCase()
  const pwd = password.trim()
  if (!input || !pwd) return { ok: false, reason: 'invalid' }

  const agents = loadAgents()
  const agent = agents.find(
    (a) => a.email.toLowerCase() === input || a.username.toLowerCase() === input,
  )

  if (!agent || agent.password !== pwd) return { ok: false, reason: 'invalid' }
  if (agent.status !== 'Active') return { ok: false, reason: 'inactive' }

  return { ok: true, agent }
}

export function updateAgentPassword(agentId: string, password: string) {
  const agents = loadAgents()
  saveAgents(agents.map((a) => (a.id === agentId ? { ...a, password } : a)))
}

export function getAgentWalletBalance(agentId: string): number {
  return getAgentById(agentId)?.walletBalance ?? DEFAULT_WALLET
}

export function updateAgentWallet(agentId: string, delta: number): StoredAgent | undefined {
  const agents = loadAgents()
  const agent = agents.find((a) => a.id === agentId)
  if (!agent) return undefined
  const updated = { ...agent, walletBalance: Math.max(0, (agent.walletBalance ?? DEFAULT_WALLET) + delta) }
  saveAgents(agents.map((a) => (a.id === agentId ? updated : a)))
  return updated
}

export function deductAgentWallet(agentId: string, amount: number): boolean {
  const balance = getAgentWalletBalance(agentId)
  if (balance < amount) return false
  updateAgentWallet(agentId, -amount)
  return true
}

export function creditAgentCommission(agentId: string, amount: number) {
  updateAgentWallet(agentId, amount)
  const agents = loadAgents()
  const agent = agents.find((a) => a.id === agentId)
  if (!agent) return
  saveAgents(
    agents.map((a) =>
      a.id === agentId
        ? { ...a, commission: a.commission + amount, revenue: a.revenue + (a.revenue > 0 ? 0 : 0) }
        : a,
    ),
  )
}

export function incrementAgentLeadCount(agentId: string) {
  const agents = loadAgents()
  saveAgents(agents.map((a) => (a.id === agentId ? { ...a, leads: a.leads + 1 } : a)))
}
