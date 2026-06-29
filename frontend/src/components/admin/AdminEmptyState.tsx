import { TEXT_PRIMARY, TEXT_SECONDARY } from './adminTheme'

type EntityType = 'applications' | 'users' | 'partners' | 'payments' | 'documents' | 'default'

const ENTITY_COPY: Record<EntityType, { title: string; sub: string }> = {
  applications: {
    title: 'Applications will appear here once added',
    sub: 'Use filters above or add new applications',
  },
  users: {
    title: 'Users will appear here once added',
    sub: 'Use filters above or add new users',
  },
  partners: {
    title: 'Partners will appear here once added',
    sub: 'Use filters above or add new partners',
  },
  payments: {
    title: 'Payments will appear here once added',
    sub: 'Use filters above or add new payments',
  },
  documents: {
    title: 'Documents will appear here once added',
    sub: 'Use filters above or upload new documents',
  },
  default: {
    title: 'No results found',
    sub: 'Use filters above to refine your search',
  },
}

function EntityIcon({ entity }: { entity: EntityType }) {
  const props = { width: 80, height: 80, fill: 'none', stroke: '#cbd5e1', strokeWidth: 1.5 }
  if (entity === 'applications' || entity === 'documents') {
    return (
      <svg {...props} viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    )
  }
  if (entity === 'users') {
    return (
      <svg {...props} viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    )
  }
  if (entity === 'partners') {
    return (
      <svg {...props} viewBox="0 0 24 24">
        <path d="M11 12h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 14" />
        <path d="M7 18h1a2 2 0 0 0 0-4H5c-.6 0-1.1.2-1.4.6L3 17" />
        <path d="M13 18h1a2 2 0 0 1 0-4h-3c-.6 0-1.1.2-1.4.6L9 17" />
        <path d="M17 14l2-2a2 2 0 0 0 0-2.8l-2-2" />
      </svg>
    )
  }
  if (entity === 'payments') {
    return (
      <svg {...props} viewBox="0 0 24 24">
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    )
  }
  return (
    <svg {...props} viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  )
}

export function AdminEmptyState({
  title,
  subtitle,
  entity = 'default',
  onClearFilters,
  onAdd,
  addLabel,
}: {
  title?: string
  subtitle?: string
  entity?: EntityType
  onClearFilters?: () => void
  onAdd?: () => void
  addLabel?: string
}) {
  const copy = ENTITY_COPY[entity]
  const displayTitle = title ?? copy.title
  const displaySub = subtitle ?? copy.sub

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '48px 24px',
        background: '#fafafa',
        borderRadius: 16,
        border: '1px dashed #e2e8f0',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <EntityIcon entity={entity} />
      </div>
      <div style={{ color: TEXT_PRIMARY, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{displayTitle}</div>
      <div style={{ color: TEXT_SECONDARY, fontSize: 13, marginBottom: 20 }}>{displaySub}</div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            style={{
              background: '#fff',
              border: '1px solid #e8ecf0',
              color: TEXT_PRIMARY,
              borderRadius: 10,
              padding: '9px 16px',
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Clear filters
          </button>
        )}
        {onAdd && addLabel && (
          <button
            type="button"
            onClick={onAdd}
            style={{
              background: 'linear-gradient(135deg, #f93e42, #ff6b6b)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '9px 16px',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {addLabel}
          </button>
        )}
      </div>
    </div>
  )
}

export function AdminTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      <style>{`@keyframes skeletonPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }`}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16 }}>
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            style={{
              background: '#f0f0f0',
              borderRadius: 8,
              height: 20,
              animation: 'skeletonPulse 1.5s ease infinite',
            }}
          />
        ))}
      </div>
    </>
  )
}
