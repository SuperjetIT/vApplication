import type { CSSProperties } from 'react'

export const BRAND = '#f93e42'
export const BRAND_BLUE = '#5057ea'
export const PAGE_BG = '#f8f9fc'
export const SIDEBAR_BG = '#ffffff'
export const CARD_BG = '#ffffff'
export const BORDER = '#f0f0f5'
export const TEXT_PRIMARY = '#1a1a2e'
export const TEXT_SECONDARY = '#6b7280'
export const TEXT_MUTED = '#9ca3af'
export const SUCCESS = '#22c55e'
export const WARNING = '#f59e0b'
export const INFO = '#3b82f6'

export const cardStyle: CSSProperties = {
  background: CARD_BG,
  borderRadius: 20,
  border: `1px solid ${BORDER}`,
  boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
  padding: 24,
}

export const inputStyle: CSSProperties = {
  background: PAGE_BG,
  border: `1.5px solid ${BORDER}`,
  borderRadius: 12,
  padding: '12px 16px',
  color: TEXT_PRIMARY,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
}

export const selectStyle: CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
}

export const primaryBtn: CSSProperties = {
  background: `linear-gradient(135deg, ${BRAND}, #ff6b6b)`,
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '10px 20px',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(249,62,66,0.25)',
}

export const secondaryBtn: CSSProperties = {
  background: PAGE_BG,
  color: TEXT_PRIMARY,
  border: `1.5px solid ${BORDER}`,
  borderRadius: 10,
  padding: '10px 20px',
  fontWeight: 500,
  fontSize: 14,
  cursor: 'pointer',
}

export const outlineBtn: CSSProperties = {
  background: '#fff',
  border: `1.5px solid ${BORDER}`,
  color: TEXT_PRIMARY,
  borderRadius: 10,
  padding: '10px 20px',
  fontWeight: 500,
  fontSize: 14,
  cursor: 'pointer',
}

export const tableHeaderStyle: CSSProperties = {
  padding: '14px 16px',
  fontWeight: 600,
  color: TEXT_SECONDARY,
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  background: PAGE_BG,
}

export const tabActive = (active: boolean): CSSProperties => ({
  border: active ? 'none' : `1px solid ${BORDER}`,
  background: active ? BRAND : PAGE_BG,
  color: active ? '#fff' : TEXT_SECONDARY,
  borderRadius: 20,
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
})

export const pillTab = (active: boolean): CSSProperties => ({
  borderRadius: 40,
  padding: '8px 20px',
  fontSize: 14,
  fontWeight: active ? 600 : 500,
  cursor: 'pointer',
  border: 'none',
  background: active ? '#fff' : 'transparent',
  color: active ? BRAND : TEXT_SECONDARY,
  boxShadow: active ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
})

export const chartTooltipStyle = {
  background: '#fff',
  border: `1px solid ${BORDER}`,
  borderRadius: 12,
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  color: TEXT_PRIMARY,
}
