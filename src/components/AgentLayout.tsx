import { useState, type CSSProperties, type ReactNode } from 'react'
import { Link, Navigate, NavLink, useNavigate } from 'react-router-dom'
import { AGENT_BASE_PATH, AGENT_LOGIN_PATH } from '../config/portalRoutes'
import { Database } from '../database/db'
import { clearAgentSession, getAgentPartnerId, getPartnerWalletBalance, isAgentLoggedIn } from '../utils/agentSession'

const BRAND = '#f93e42'

const NAV = [
  { path: AGENT_BASE_PATH, label: 'Dashboard', end: true },
  { path: `${AGENT_BASE_PATH}/apply`, label: 'Apply New Visa' },
  { path: `${AGENT_BASE_PATH}/applications`, label: 'My Applications' },
  { path: `${AGENT_BASE_PATH}/commissions`, label: 'Commissions' },
]

function companyInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return (parts[0]?.slice(0, 2) ?? 'SV').toUpperCase()
}

export function AgentGuard({ children }: { children: ReactNode }) {
  if (!isAgentLoggedIn()) return <Navigate to={AGENT_LOGIN_PATH} replace />
  return children
}

const navLinkStyle = (active: boolean): CSSProperties => ({
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: active ? 600 : 500,
  color: active ? BRAND : '#666',
  padding: '8px 0',
  borderBottom: active ? `2px solid ${BRAND}` : '2px solid transparent',
})

export function AgentLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const partnerId = getAgentPartnerId()
  const partner = partnerId ? Database.getPartnerById(partnerId) : null
  const wallet = partnerId ? getPartnerWalletBalance(partnerId) : 0
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const logout = () => {
    clearAgentSession()
    navigate(AGENT_LOGIN_PATH)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fc' }}>
      <style>{`
        @media (max-width: 900px) {
          .agent-nav-desktop { display: none !important; }
          .agent-hamburger { display: block !important; }
        }
        @media (min-width: 901px) {
          .agent-mobile-nav { display: none !important; }
        }
      `}</style>

      <header style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', height: 64, padding: '0 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" className="agent-hamburger" onClick={() => setMobileOpen((o) => !o)} style={{ display: 'none', border: 'none', background: 'none', fontSize: 22, cursor: 'pointer' }}>☰</button>
          <Link to={AGENT_BASE_PATH} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontStyle: 'italic', fontWeight: 800, color: BRAND, fontSize: 18 }}>Super Visa</span>
            <span style={{ background: '#fff0f0', color: BRAND, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>B2B Partner</span>
          </Link>
        </div>

        <nav className="agent-nav-desktop" style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          {NAV.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.end} style={({ isActive }) => navLinkStyle(isActive)}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ background: '#f0fff4', color: '#166534', borderRadius: 40, padding: '6px 14px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
            💰 AED {wallet.toLocaleString()} Balance
          </span>
          <button type="button" style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer' }} aria-label="Notifications">🔔</button>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${BRAND}, #ff6b6b)`, color: '#fff', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
            >
              {companyInitials(String(partner?.companyName ?? 'SV'))}
            </button>
            {menuOpen && (
              <div style={{ position: 'absolute', right: 0, top: 44, background: '#fff', border: '1px solid #eee', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', minWidth: 160, overflow: 'hidden', zIndex: 200 }}>
                <Link to={`${AGENT_BASE_PATH}/profile`} onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#333', fontSize: 13 }}>Profile</Link>
                <button type="button" onClick={logout} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', background: 'none', color: BRAND, fontSize: 13, cursor: 'pointer' }}>Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="agent-mobile-nav" style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '12px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {NAV.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.end} onClick={() => setMobileOpen(false)} style={({ isActive }) => ({ ...navLinkStyle(isActive), padding: '10px 0' })}>
              {item.label}
            </NavLink>
          ))}
        </div>
      )}

      <main style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>{children}</main>
    </div>
  )
}
