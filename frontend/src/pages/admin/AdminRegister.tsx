import { Navigate, useParams } from 'react-router-dom'
import { usePortalBase } from '../../hooks/usePortalBase'

/** Legacy routes redirect to unified registrations page. */
export default function AdminRegister() {
  const { channel } = useParams<{ channel?: string }>()
  const { basePath } = usePortalBase()
  const tab = channel === 'b2b' ? 'b2b' : 'b2c'
  return <Navigate to={`${basePath}/registrations?tab=${tab}`} replace />
}
