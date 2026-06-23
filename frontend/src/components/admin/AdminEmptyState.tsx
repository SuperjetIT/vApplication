import { outlineBtn, primaryBtn, TEXT_MUTED, TEXT_PRIMARY } from './adminTheme'

export function AdminEmptyState({
  title,
  subtitle = 'Try adjusting your filters',
  onClearFilters,
  onAdd,
  addLabel,
}: {
  title: string
  subtitle?: string
  onClearFilters?: () => void
  onAdd?: () => void
  addLabel?: string
}) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#e5e7eb" strokeWidth="1.5" style={{ marginBottom: 16 }}>
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <div style={{ color: TEXT_PRIMARY, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{title}</div>
      <div style={{ color: TEXT_MUTED, fontSize: 14, marginBottom: 20 }}>{subtitle}</div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        {onClearFilters && <button type="button" onClick={onClearFilters} style={outlineBtn}>Clear filters</button>}
        {onAdd && addLabel && <button type="button" onClick={onAdd} style={primaryBtn}>{addLabel}</button>}
      </div>
    </div>
  )
}
