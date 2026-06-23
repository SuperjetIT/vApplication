import { useEffect, useState } from 'react'
import { DB_CHANGED_EVENT } from '../database/db'

export function useDatabaseListener(): number {
  const [dbVersion, setDbVersion] = useState(0)

  useEffect(() => {
    const handler = () => setDbVersion((n) => n + 1)
    window.addEventListener(DB_CHANGED_EVENT, handler)
    return () => window.removeEventListener(DB_CHANGED_EVENT, handler)
  }, [])

  return dbVersion
}
