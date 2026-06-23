import {
  ADMIN_BASE_PATH,
  ADMIN_LOGIN_PATH,
  AGENT_BASE_PATH,
  AGENT_LOGIN_PATH,
  OPERATIONS_BASE_PATH,
  OPERATIONS_LOGIN_PATH,
} from '../config/portalRoutes'

export type PortalRole = 'admin' | 'operations' | 'agent'

export type PortalUser = {
  name: string
  email: string
  role: PortalRole
  agentId?: string
}

export function getPortalRole(): PortalRole | null {
  const role = localStorage.getItem('portal_role')
  if (role === 'operations') return 'operations'
  if (role === 'agent') return 'agent'
  if (role === 'admin' || localStorage.getItem('admin_logged_in') === 'true') return 'admin'
  return null
}

export function getPortalUser(): PortalUser | null {
  try {
    const raw = localStorage.getItem('portal_user') ?? localStorage.getItem('admin_user')
    if (!raw) return null
    const user = JSON.parse(raw) as PortalUser
    return user?.name ? user : null
  } catch {
    return null
  }
}

export function setPortalSession(role: PortalRole, user: PortalUser) {
  localStorage.setItem('portal_logged_in', 'true')
  localStorage.setItem('portal_role', role)
  localStorage.setItem('portal_user', JSON.stringify(user))
  if (role === 'admin') {
    localStorage.setItem('admin_logged_in', 'true')
    localStorage.setItem('admin_user', JSON.stringify(user))
  } else {
    localStorage.removeItem('admin_logged_in')
    localStorage.removeItem('admin_user')
  }
}

export function clearPortalSession() {
  localStorage.removeItem('portal_logged_in')
  localStorage.removeItem('portal_role')
  localStorage.removeItem('portal_user')
  localStorage.removeItem('admin_logged_in')
  localStorage.removeItem('admin_user')
}

export function getLoginPathForRole(role: PortalRole | null): string {
  if (role === 'operations') return OPERATIONS_LOGIN_PATH
  if (role === 'agent') return AGENT_LOGIN_PATH
  return ADMIN_LOGIN_PATH
}

export function getBasePathForRole(role: PortalRole): string {
  if (role === 'operations') return OPERATIONS_BASE_PATH
  if (role === 'agent') return AGENT_BASE_PATH
  return ADMIN_BASE_PATH
}

export function resolvePortalBasePath(pathname: string): string {
  if (pathname.startsWith(OPERATIONS_BASE_PATH)) return OPERATIONS_BASE_PATH
  if (pathname.startsWith(AGENT_BASE_PATH)) return AGENT_BASE_PATH
  return ADMIN_BASE_PATH
}

export function isOperationsPath(pathname: string): boolean {
  return pathname.startsWith(OPERATIONS_BASE_PATH)
}

export function isAgentPath(pathname: string): boolean {
  return pathname.startsWith(AGENT_BASE_PATH)
}
