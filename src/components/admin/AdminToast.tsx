import { useEffect } from 'react'
import { TEXT_PRIMARY } from './adminTheme'

export function AdminToast({
  message,
  onClose,
}: {
  message: string | null
  onClose: () => void
}) {
  useEffect(() => {
    if (!message) return
    const t = window.setTimeout(onClose, 3000)
    return () => window.clearTimeout(t)
  }, [message, onClose])

  if (!message) return null

  return (
    <>
      <style>{`@keyframes toastIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 99999,
          background: '#fff',
          border: '1px solid #f0f0f5',
          borderRadius: 12,
          padding: '14px 20px',
          color: TEXT_PRIMARY,
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          animation: 'toastIn 0.25s ease',
        }}
      >
        <span style={{ color: '#22c55e', fontSize: 16 }}>✓</span>
        {message}
      </div>
    </>
  )
}
