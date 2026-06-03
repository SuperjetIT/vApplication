import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'

const BRAND = '#f93e42'

function ShieldSvg() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0 }}>
      <path
        d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"
        stroke={BRAND}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke={BRAND} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function PassportSvg({ active }: { active?: boolean }) {
  const c = active ? BRAND : '#9ca3af'
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="3" width="14" height="18" rx="2" stroke={c} strokeWidth="1.5" />
      <circle cx="12" cy="10" r="3" stroke={c} strokeWidth="1.5" />
    </svg>
  )
}

function TicketSvg({ active }: { active?: boolean }) {
  const c = active ? BRAND : '#9ca3af'
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 9a2 2 0 012-2h1v2H6v2h1a2 2 0 01-2 2v1H4V9zm16 0v5h-1v-1a2 2 0 00-2-2h-1v-2h1a2 2 0 012-2h1V9zM8 7h8v10H8V7z"
        stroke={c}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SearchSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="#666" strokeWidth="1.5" />
      <path d="M20 20l-3.5-3.5" stroke="#666" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function WhatsAppSvg() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function PersonSvg() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="#666" strokeWidth="1.5" />
      <path
        d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7"
        stroke="#666"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

const iconCircle: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: '50%',
  border: '1px solid #eee',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  background: '#fff',
  padding: 0,
  flexShrink: 0,
}

export function Navbar({
  activeTab,
  setActiveTab,
  isMobile,
  isLoggedIn = false,
  profilePhotoUrl,
  onSearchClick,
}: {
  activeTab: 'explore' | 'events'
  setActiveTab: (tab: 'explore' | 'events') => void
  isMobile: boolean
  isLoggedIn?: boolean
  profilePhotoUrl?: string
  onSearchClick?: () => void
}) {
  const tabStyle = (active: boolean): CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    color: active ? '#111827' : '#9ca3af',
    padding: '8px 4px 10px',
    position: 'relative',
    borderBottom: active ? `3px solid ${BRAND}` : '3px solid transparent',
  })

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: isMobile ? '12px 16px' : '12px 32px',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr auto' : '1fr auto 1fr',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontStyle: 'italic',
              fontWeight: 700,
              fontSize: isMobile ? 20 : 22,
              color: BRAND,
              letterSpacing: '-0.02em',
            }}
          >
            supervisa
          </span>
          <ShieldSvg />
        </div>
        {!isMobile && (
          <span
            style={{
              display: 'block',
              marginTop: 2,
              fontSize: 11,
              color: '#666',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}
          >
            Visas On Time Guaranteed
          </span>
        )}
      </Link>

      {!isMobile && (
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
          <button type="button" onClick={() => setActiveTab('explore')} style={tabStyle(activeTab === 'explore')}>
            <PassportSvg active={activeTab === 'explore'} />
            Explore
          </button>
          <button type="button" onClick={() => setActiveTab('events')} style={tabStyle(activeTab === 'events')}>
            <TicketSvg active={activeTab === 'events'} />
            Events
          </button>
        </nav>
      )}

      <div
        style={{
          justifySelf: 'end',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {!isMobile && (
          <button type="button" onClick={onSearchClick} style={iconCircle} aria-label="Search">
            <SearchSvg />
          </button>
        )}

        <a
          href="https://wa.me/971559641020"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            ...iconCircle,
            border: 'none',
            background: 'linear-gradient(135deg, #25d366, #128c7e)',
            boxShadow: '0 4px 12px rgba(37,211,102,0.35)',
            textDecoration: 'none',
          }}
          aria-label="WhatsApp"
        >
          <WhatsAppSvg />
        </a>

        <Link
          to="/sign-in"
          style={{
            ...iconCircle,
            overflow: 'hidden',
            textDecoration: 'none',
          }}
          aria-label={isLoggedIn ? 'Profile' : 'Sign in'}
        >
          {isLoggedIn && profilePhotoUrl ? (
            <img
              src={profilePhotoUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <PersonSvg />
          )}
        </Link>
      </div>
    </header>
  )
}
