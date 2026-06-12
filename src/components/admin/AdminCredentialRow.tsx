import { useState } from 'react'
import { BRAND_BLUE, BORDER, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from './adminTheme'

export function AdminCredentialRow({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const [visible, setVisible] = useState(false)
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8f9fc', borderRadius: 10, padding: '12px 14px', border: `1px solid ${BORDER}` }}>
        <span style={{ fontFamily: 'monospace', flex: 1, fontSize: 13, color: TEXT_PRIMARY, wordBreak: 'break-all' }}>
          {secret && !visible ? '••••••••••' : value}
        </span>
        {secret && (
          <button type="button" onClick={() => setVisible((v) => !v)} style={{ border: 'none', background: 'none', color: TEXT_SECONDARY, cursor: 'pointer', fontSize: 12 }}>
            {visible ? 'Hide' : 'Show'}
          </button>
        )}
        <button type="button" onClick={() => navigator.clipboard.writeText(value)} style={{ border: 'none', background: 'none', color: BRAND_BLUE, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
          Copy
        </button>
      </div>
    </div>
  )
}
