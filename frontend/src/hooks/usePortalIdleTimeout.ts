import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ADMIN_IDLE_KEY, isIdleExpired, OPS_IDLE_KEY, touchIdleActivity } from '../config/storageKeys'
import { clearPortalSession } from '../utils/portalAuth'

const IDLE_CHECK_MS = 30_000
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const

export function usePortalIdleTimeout(isOperations: boolean, loginPath: string) {
  const navigate = useNavigate()
  const idleKey = isOperations ? OPS_IDLE_KEY : ADMIN_IDLE_KEY

  useEffect(() => {
    touchIdleActivity(idleKey)

    const onActivity = () => touchIdleActivity(idleKey)
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true })
    }

    const interval = window.setInterval(() => {
      if (!isIdleExpired(idleKey)) return
      clearPortalSession()
      navigate(loginPath, { replace: true })
    }, IDLE_CHECK_MS)

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity)
      }
      window.clearInterval(interval)
    }
  }, [idleKey, loginPath, navigate])
}
