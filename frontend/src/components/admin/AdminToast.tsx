import { useEffect } from 'react'
import { TEXT_PRIMARY } from './adminTheme'

const TOAST_DURATION_S = 3

export function AdminToast({
  message,
  onClose,
  durationMs = TOAST_DURATION_S * 1000,
}: {
  message: string | null
  onClose: () => void
  durationMs?: number
}) {
  useEffect(() => {
    if (!message) return
    const t = window.setTimeout(onClose, durationMs)
    return () => window.clearTimeout(t)
  }, [message, onClose, durationMs])

  if (!message) return null

  const durationS = durationMs / 1000

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 99999,
          background: '#fff',
          border: '1px solid #f0f0f5',
          borderRadius: 12,
          padding: '14px 20px 0',
          color: TEXT_PRIMARY,
          fontSize: 13,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          animation: 'slideInRight 0.3s ease',
          overflow: 'hidden',
          minWidth: 220,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14 }}>
          <span style={{ color: '#22c55e', fontSize: 16 }}>✓</span>
          {message}
        </div>
        <div
          style={{
            height: 3,
            background: '#f93e42',
            animation: `shrink ${durationS}s linear forwards`,
          }}
        />
      </div>
    </>
  )
}
