import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, Navigate, NavLink, useNavigate } from 'react-router-dom'
import { AgentAvatar, AgentKeyframes, SupportWhatsAppButton, contactInitials } from './agent/AgentUI'
import { AGENT_ACCENT, AGENT_BG, AGENT_BORDER, AGENT_GRADIENTS, AGENT_LOGO_RED, AGENT_MUTED, AGENT_PRIMARY } from '../theme/agentTheme'
import { AGENT_BASE_PATH, AGENT_LOGIN_PATH } from '../config/portalRoutes'
import { Database } from '../database/db'
import { useDatabaseListener } from '../hooks/useDatabase'
import { validateAgentSession } from '../utils/sessionGuard'
import { clearAgentSession, getAgentPartnerId } from '../utils/agentSession'
import { getWalletHealthStyle } from '../utils/walletUtils'

const NAV = [
  { path: AGENT_BASE_PATH, label: 'Dashboard', end: true },
  { path: `${AGENT_BASE_PATH}/apply`, label: 'Apply New Visa' },
  { path: `${AGENT_BASE_PATH}/applications`, label: 'My Applications' },
  { path: `${AGENT_BASE_PATH}/commissions`, label: 'Commissions' },
  { path: `${AGENT_BASE_PATH}/wallet`, label: 'Wallet' },
]

export function AgentGuard({ children }: { children: ReactNode }) {
  if (!validateAgentSession()) return <Navigate to={AGENT_LOGIN_PATH} replace />
  return children
}

const navLinkStyle = (active: boolean): CSSProperties => ({
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: active ? 600 : 500,
  color: active ? AGENT_ACCENT : AGENT_MUTED,
  padding: '8px 0',
  borderBottom: active ? `2px solid ${AGENT_ACCENT}` : '2px solid transparent',
})

export function AgentLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const dbVersion = useDatabaseListener()
  const partnerId = getAgentPartnerId()
  const partner = useMemo(
    () => (partnerId ? Database.getPartnerById(partnerId) : null),
    [partnerId, dbVersion],
  )
  const wallet = useMemo(
    () => (partnerId ? Database.getPartnerWalletBalance(partnerId) : 0),
    [partnerId, dbVersion],
  )
  const walletStyle = getWalletHealthStyle(wallet)
  const notifications = useMemo(
    () => (partnerId ? Database.getNotifications(partnerId) : []),
    [partnerId, dbVersion],
  )
  const unreadCount = notifications.filter((n) => !n.read).length

  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const logout = () => {
    clearAgentSession()
    navigate(AGENT_LOGIN_PATH)
  }

  const profilePhoto = partner?.profilePhoto as string | undefined

  return (
    <div style={{ minHeight: '100vh', background: AGENT_BG }}>
      <AgentKeyframes />
      <style>{`
        @media (max-width: 900px) {
          .agent-nav-desktop { display: none !important; }
          .agent-hamburger { display: block !important; }
          .agent-nav-right { gap: 8px !important; }
          .agent-agent-info { display: none !important; }
        }
        @media (min-width: 901px) {
          .agent-mobile-nav { display: none !important; }
        }
      `}</style>

      <header style={{
        background: '#fff',
        borderBottom: `1px solid ${AGENT_BORDER}`,
        minHeight: 64,
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <button
            type="button"
            className="agent-hamburger"
            onClick={() => setMobileOpen((o) => !o)}
            style={{ display: 'none', border: 'none', background: 'none', fontSize: 22, cursor: 'pointer' }}
          >
            ☰
          </button>
          <Link to={AGENT_BASE_PATH} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: AGENT_GRADIENTS.logo,
              color: '#fff',
              fontWeight: 800,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              SJ
            </span>
            <span style={{ fontStyle: 'italic', fontWeight: 800, color: AGENT_LOGO_RED, fontSize: 18, whiteSpace: 'nowrap' }}>
              Superjet Global
            </span>
            <span style={{
              background: '#eff6ff',
              color: AGENT_ACCENT,
              borderRadius: 20,
              padding: '3px 10px',
              fontSize: 11,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}>
              B2B Partner Portal
            </span>
          </Link>
        </div>

        <nav className="agent-nav-desktop" style={{ display: 'flex', gap: 24, alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          {NAV.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.end} style={({ isActive }) => navLinkStyle(isActive)}>
              {item.label}
            </NavLink>
          ))}
          <SupportWhatsAppButton />
        </nav>

        <div className="agent-nav-right" style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => navigate(`${AGENT_BASE_PATH}/wallet`)}
            style={{
              background: walletStyle.background,
              color: walletStyle.color,
              borderRadius: 40,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {wallet < 500 ? '⚠ ' : ''}💰 AED {wallet.toLocaleString()}
          </button>

          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => { setNotifOpen((o) => !o); setMenuOpen(false) }}
              style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', position: 'relative', padding: 4 }}
              aria-label="Notifications"
            >
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  background: AGENT_LOGO_RED,
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: '50%',
                  width: 16,
                  height: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: 36,
                background: '#fff',
                border: `1px solid ${AGENT_BORDER}`,
                borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                minWidth: 280,
                maxWidth: 320,
                maxHeight: 360,
                overflowY: 'auto',
                zIndex: 200,
              }}>
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${AGENT_BORDER}`, fontWeight: 700, fontSize: 13, color: AGENT_PRIMARY }}>
                  Notifications
                </div>
                {notifications.length === 0 ? (
                  <p style={{ padding: '16px', margin: 0, color: AGENT_MUTED, fontSize: 13 }}>No new notifications</p>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <button
                      key={String(n.id)}
                      type="button"
                      onClick={() => {
                        Database.markNotificationRead(String(n.id))
                        if (n.applicationId) navigate(`${AGENT_BASE_PATH}/applications/${n.applicationId}`)
                        setNotifOpen(false)
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '12px 16px',
                        border: 'none',
                        borderBottom: `1px solid ${AGENT_BORDER}`,
                        background: n.read ? '#fff' : '#eff6ff',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 12, color: AGENT_PRIMARY }}>{String(n.title)}</div>
                      <div style={{ fontSize: 11, color: AGENT_MUTED, marginTop: 2 }}>{String(n.message)}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{String(n.createdAt).slice(0, 10)}</div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => { setMenuOpen((o) => !o); setNotifOpen(false) }}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: 0,
              }}
            >
              <AgentAvatar
                photo={profilePhoto}
                initials={contactInitials(String(partner?.contactPerson ?? partner?.companyName ?? 'AG'))}
                size={40}
              />
              <div className="agent-agent-info" style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: AGENT_PRIMARY, lineHeight: 1.2 }}>
                  {String(partner?.contactPerson ?? 'Agent')}
                </div>
                <div style={{ fontSize: 11, color: AGENT_MUTED }}>{String(partner?.companyName ?? '')}</div>
              </div>
              <span style={{ color: AGENT_MUTED, fontSize: 12 }}>▾</span>
            </button>
            {menuOpen && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: 48,
                background: '#fff',
                border: `1px solid ${AGENT_BORDER}`,
                borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                minWidth: 180,
                overflow: 'hidden',
                zIndex: 200,
              }}>
                <Link
                  to={`${AGENT_BASE_PATH}/profile`}
                  onClick={() => setMenuOpen(false)}
                  style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: AGENT_PRIMARY, fontSize: 13 }}
                >
                  Profile
                </Link>
                <Link
                  to={`${AGENT_BASE_PATH}/profile`}
                  onClick={() => setMenuOpen(false)}
                  style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: AGENT_PRIMARY, fontSize: 13 }}
                >
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 16px',
                    border: 'none',
                    background: 'none',
                    color: AGENT_LOGO_RED,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="agent-mobile-nav" style={{
          background: '#fff',
          borderBottom: `1px solid ${AGENT_BORDER}`,
          padding: '12px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          {NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              style={({ isActive }) => ({ ...navLinkStyle(isActive), padding: '10px 0' })}
            >
              {item.label}
            </NavLink>
          ))}
          <SupportWhatsAppButton style={{ alignSelf: 'flex-start', marginTop: 4 }} />
        </div>
      )}

      <main style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>{children}</main>
    </div>
  )
}
