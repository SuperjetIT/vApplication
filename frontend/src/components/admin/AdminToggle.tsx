import { BRAND } from './adminTheme'

export function AdminToggle({
  enabled,
  onChange,
  color,
}: {
  enabled: boolean
  onChange: (v: boolean) => void
  color?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      style={{
        width: 48,
        height: 26,
        borderRadius: 40,
        border: 'none',
        background: enabled ? color ?? BRAND : '#e5e7eb',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: 2,
          left: enabled ? 24 : 2,
          transition: 'left 0.2s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
        }}
      />
    </button>
  )
}
