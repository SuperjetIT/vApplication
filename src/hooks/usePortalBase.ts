import { useLocation } from 'react-router-dom'
import { ADMIN_LOGIN_PATH, OPERATIONS_LOGIN_PATH } from '../config/portalRoutes'
import { isOperationsPath, resolvePortalBasePath } from '../utils/portalAuth'

export function usePortalBase() {
  const { pathname } = useLocation()
  const isOperations = isOperationsPath(pathname)
  const basePath = resolvePortalBasePath(pathname)
  const loginPath = isOperations ? OPERATIONS_LOGIN_PATH : ADMIN_LOGIN_PATH

  const path = (suffix: string) => `${basePath}${suffix.startsWith('/') ? suffix : `/${suffix}`}`

  return { basePath, isOperations, loginPath, path }
}
