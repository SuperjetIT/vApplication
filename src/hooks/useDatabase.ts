import { useEffect, useState } from 'react'
import { DB_CHANGED_EVENT } from '../database/db'

export function useDatabaseListener() {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const handler = () => forceUpdate((n) => n + 1)
    window.addEventListener(DB_CHANGED_EVENT, handler)
    return () => window.removeEventListener(DB_CHANGED_EVENT, handler)
  }, [])
}
