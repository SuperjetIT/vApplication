import type { CSSProperties, ReactNode } from 'react'
import { AGENT_ACCENT, AGENT_BORDER, AGENT_GRADIENTS, AGENT_MUTED, AGENT_PRIMARY } from '../../theme/agentTheme'

export function companyInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return (parts[0]?.slice(0, 2) ?? 'SV').toUpperCase()
}

export function contactInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return (parts[0]?.slice(0, 2) ?? 'AG').toUpperCase()
}

export function FlagImage({ countryCode, countryName, width = 28, height = 20, style }: {
  countryCode: string
  countryName: string
  width?: number
  height?: number
  style?: CSSProperties
}) {
  const code = countryCode.toLowerCase()
  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      alt={countryName}
      loading="lazy"
      style={{ width, height, objectFit: 'cover', borderRadius: 3, ...style }}
      onError={(e) => { e.currentTarget.style.display = 'none' }}
    />
  )
}

export function AgentLoading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
      <div style={{
        width: 40, height: 40, border: `3px solid ${AGENT_BORDER}`,
        borderTop: `3px solid ${AGENT_ACCENT}`, borderRadius: '50%',
        animation: 'agentSpin 1s linear infinite',
      }} />
    </div>
  )
}

export function AgentKeyframes() {
  return (
    <style>{`
      @keyframes agentSpin { to { transform: rotate(360deg); } }
      @keyframes float3d {
        0% { transform: perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px); }
        25% { transform: perspective(1000px) rotateX(2deg) rotateY(3deg) translateY(-8px); }
        50% { transform: perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(-12px); }
        75% { transform: perspective(1000px) rotateX(-2deg) rotateY(-3deg) translateY(-8px); }
        100% { transform: perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px); }
      }
      @keyframes shimmer {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
      }
      @keyframes countUp {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes slideInLeft {
        from { opacity: 0; transform: translateX(-30px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes pulseGlow {
        0%,100% { box-shadow: 0 0 0 0 rgba(37,99,235,0.3); }
        50% { box-shadow: 0 0 0 12px rgba(37,99,235,0); }
      }
    `}</style>
  )
}

const STATUS_STEPS = ['Submitted', 'Review', 'Processing', 'Approved', 'Rejected']

function statusStepIndex(status: string): number {
  const s = status.toLowerCase()
  if (s === 'approved') return 3
  if (s === 'rejected') return 4
  if (s.includes('processing') || s === 'submitted') return 2
  if (s.includes('review')) return 1
  return 0
}

export function StatusProgressBar({ status }: { status: string }) {
  const current = statusStepIndex(status)
  const isRejected = status.toLowerCase() === 'rejected'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} title={STATUS_STEPS.join(' → ')}>
      {STATUS_STEPS.map((label, i) => {
        const active = i === current
        const passed = i < current || (i <= 3 && current === 4 && !isRejected && i <= 3)
        let color = AGENT_BORDER
        if (active) color = isRejected && i === 4 ? '#dc2626' : AGENT_ACCENT
        else if (passed) color = AGENT_ACCENT

        return (
          <div
            key={label}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: color,
              opacity: active ? 1 : passed ? 0.7 : 0.35,
              flexShrink: 0,
            }}
          />
        )
      })}
    </div>
  )
}

export function MonthProgressRing({ current, target }: { current: number; target: number }) {
  const pct = Math.min(current / target, 1)
  const r = 36
  const circ = 2 * Math.PI * r
  const dash = circ * pct

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width={88} height={88} viewBox="0 0 88 88">
        <circle cx={44} cy={44} r={r} fill="none" stroke={AGENT_BORDER} strokeWidth={8} />
        <circle
          cx={44}
          cy={44}
          r={r}
          fill="none"
          stroke={AGENT_ACCENT}
          strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 44 44)"
        />
        <text x={44} y={48} textAnchor="middle" fontSize={14} fontWeight={700} fill={AGENT_PRIMARY}>
          {current}
        </text>
      </svg>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: AGENT_PRIMARY }}>Applications this month</div>
        <div style={{ fontSize: 13, color: AGENT_MUTED, marginTop: 2 }}>{current} / Target: {target}</div>
      </div>
    </div>
  )
}

export function groupCommissionsByMonth(commissions: { createdAt?: unknown; commissionAmount?: unknown }[]) {
  const groups: Record<string, number> = {}
  commissions.forEach((c) => {
    const month = String(c.createdAt ?? '').slice(0, 7)
    if (!month) return
    groups[month] = (groups[month] || 0) + Number(c.commissionAmount ?? 0)
  })
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }))
}

export function AgentAvatar({ photo, initials, size = 40 }: { photo?: string | null; initials: string; size?: number }) {
  if (photo) {
    return (
      <img
        src={photo}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          border: `2px solid ${AGENT_ACCENT}`,
        }}
      />
    )
  }
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: AGENT_GRADIENTS.avatar,
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: size * 0.32,
      border: `2px solid ${AGENT_ACCENT}`,
    }}>
      {initials}
    </div>
  )
}

export function SupportWhatsAppButton({ style }: { style?: CSSProperties }) {
  const open = () => {
    window.open('https://wa.me/971559641020?text=Hi Superjet Global, I need assistance with my B2B account', '_blank')
  }
  return (
    <button
      type="button"
      onClick={open}
      style={{
        background: '#f0fff4',
        color: '#16a34a',
        border: 'none',
        borderRadius: 20,
        padding: '6px 14px',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      💬 Support
    </button>
  )
}

export function AgentPageShell({ loading, children }: { loading: boolean; children: ReactNode }) {
  if (loading) return <AgentLoading />
  return <>{children}</>
}
