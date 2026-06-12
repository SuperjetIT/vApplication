import type { CSSProperties, MouseEvent } from 'react'

export const BRAND = '#f93e42'
export const BRAND_BLUE = '#5057ea'
export const PAGE_BG = '#f8f9fc'
export const SIDEBAR_BG = '#ffffff'
export const CARD_BG = '#ffffff'
export const BORDER = '#e8ecf0'
export const TEXT_PRIMARY = '#1a1a2e'
export const TEXT_SECONDARY = '#64748b'
export const TEXT_MUTED = '#94a3b8'
export const SUCCESS = '#22c55e'
export const WARNING = '#f59e0b'
export const DANGER = '#ef4444'
export const PURPLE = '#8b5cf6'

export const cardStyle: CSSProperties = {
  background: CARD_BG,
  borderRadius: 16,
  border: `1px solid ${BORDER}`,
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  padding: 20,
}

export const hoverCardProps = {
  onMouseEnter: (e: MouseEvent<HTMLElement>) => {
    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'
    e.currentTarget.style.transform = 'translateY(-2px)'
  },
  onMouseLeave: (e: MouseEvent<HTMLElement>) => {
    e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'
    e.currentTarget.style.transform = 'none'
  },
  style: { transition: 'all 0.2s ease' as const },
}

export const inputStyle: CSSProperties = {
  background: PAGE_BG,
  border: `1px solid ${BORDER}`,
  borderRadius: 10,
  padding: '10px 14px',
  color: TEXT_PRIMARY,
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
}

export const selectStyle: CSSProperties = { ...inputStyle, cursor: 'pointer' }

export const primaryBtn: CSSProperties = {
  background: `linear-gradient(135deg, ${BRAND}, #ff6b6b)`,
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '9px 16px',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(249,62,66,0.25)',
}

export const secondaryBtn: CSSProperties = {
  background: '#fff',
  color: TEXT_SECONDARY,
  border: `1px solid ${BORDER}`,
  borderRadius: 10,
  padding: '9px 16px',
  fontWeight: 500,
  fontSize: 13,
  cursor: 'pointer',
}

export const outlineBtn: CSSProperties = {
  background: '#fff',
  border: `1px solid ${BORDER}`,
  color: TEXT_PRIMARY,
  borderRadius: 10,
  padding: '9px 16px',
  fontWeight: 500,
  fontSize: 13,
  cursor: 'pointer',
}

export const tableHeaderStyle: CSSProperties = {
  padding: '12px 14px',
  fontWeight: 600,
  color: TEXT_SECONDARY,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  background: PAGE_BG,
}

export const tabActive = (active: boolean): CSSProperties => ({
  border: active ? 'none' : `1px solid ${BORDER}`,
  background: active ? BRAND : '#fff',
  color: active ? '#fff' : TEXT_SECONDARY,
  borderRadius: 8,
  padding: '4px 10px',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
})

export const pillTab = (active: boolean): CSSProperties => ({
  borderRadius: 40,
  padding: '7px 16px',
  fontSize: 12,
  fontWeight: active ? 600 : 500,
  cursor: 'pointer',
  border: active ? 'none' : `1px solid ${BORDER}`,
  background: active ? BRAND : '#fff',
  color: active ? '#fff' : TEXT_SECONDARY,
})

export const chartTooltipStyle = {
  background: '#fff',
  border: `1px solid ${BORDER}`,
  borderRadius: 12,
  padding: '12px 16px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  color: TEXT_PRIMARY,
}

export function pageHeaderAccent(): CSSProperties {
  return {
    width: 40,
    height: 3,
    background: `linear-gradient(90deg, ${BRAND}, ${BRAND_BLUE})`,
    borderRadius: 40,
    marginTop: 4,
  }
}
