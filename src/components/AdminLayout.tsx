import { useState, type CSSProperties, type ReactNode } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { BRAND, PAGE_BG, SIDEBAR_BG, BORDER, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from './admin/adminTheme'

const SIDEBAR_W = 260

function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, background: 'linear-gradient(135deg, #f93e42, #ff8c69)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="white">
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
      </svg>
    </div>
  )
}

const NAV_ICONS: Record<string, ReactNode> = {
  Dashboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
  Leads: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  Customers: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>,
  Agents: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2z" /></svg>,
  Cases: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>,
  Invoices: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>,
  Payments: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>,
  Expenses: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
  Reports: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  Users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  Settings: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" /></svg>,
}

const NAV_SECTIONS: { label: string; items: { path: string; label: string }[] }[] = [
  { label: 'Overview', items: [{ path: '/admin', label: 'Dashboard' }] },
  { label: 'CRM', items: [{ path: '/admin/leads', label: 'Leads' }, { path: '/admin/customers', label: 'Customers' }, { path: '/admin/agents', label: 'Agents' }, { path: '/admin/cases', label: 'Cases' }] },
  { label: 'Finance', items: [{ path: '/admin/invoices', label: 'Invoices' }, { path: '/admin/payments', label: 'Payments' }, { path: '/admin/expenses', label: 'Expenses' }, { path: '/admin/reports', label: 'Reports' }] },
  { label: 'System', items: [{ path: '/admin/users', label: 'Users' }, { path: '/admin/settings', label: 'Settings' }] },
]

function logout() {
  localStorage.removeItem('admin_logged_in')
  localStorage.removeItem('admin_user')
}

function OnlineAvatar({ size = 40 }: { size?: number }) {
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #f93e42, #ff6b6b)', color: '#fff', fontWeight: 700, fontSize: size * 0.35, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>SA</div>
      <span style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: '#22c55e', border: '2px solid white' }} />
    </div>
  )
}

export function AdminLayout({ activePath, title, children }: { activePath: string; title: string; children: ReactNode }) {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarSearch, setSidebarSearch] = useState('')
  const [headerSearch, setHeaderSearch] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

  const handleLogout = () => { logout(); navigate('/admin/login') }

  const isActive = (path: string, label: string) => {
    if (path === '/admin') return activePath === '/admin'
    if (label === 'Leads') return activePath === '/admin/leads'
    if (label === 'Cases') return activePath.startsWith('/admin/cases')
    return activePath === path || activePath.startsWith(path + '/')
  }

  const navItemStyle = (active: boolean): CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', margin: '2px 8px', borderRadius: 12, fontSize: 14, fontWeight: 500,
    color: active ? BRAND : TEXT_SECONDARY, cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s',
    background: active ? 'linear-gradient(135deg, rgba(249,62,66,0.08), rgba(249,62,66,0.04))' : 'transparent',
    border: active ? '1px solid rgba(249,62,66,0.15)' : '1px solid transparent',
  })

  const filteredSections = NAV_SECTIONS.map((s) => ({
    ...s,
    items: s.items.filter((i) => !sidebarSearch || i.label.toLowerCase().includes(sidebarSearch.toLowerCase())),
  })).filter((s) => s.items.length > 0)

  return (
    <div style={{ minHeight: '100vh', background: PAGE_BG, color: TEXT_PRIMARY }}>
      <style>{`
        @media (max-width: 768px) {
          .admin-hamburger { display: flex !important; }
          .admin-sidebar-wrap { transform: translateX(-100%); transition: transform 0.25s; }
          .admin-sidebar-wrap.open { transform: translateX(0) !important; }
          .admin-main { margin-left: 0 !important; }
          .admin-header-search { display: none !important; }
        }
        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.2)} }
      `}</style>

      <div aria-hidden style={{ position: 'fixed', width: 400, height: 400, top: -100, left: -100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,62,66,0.04), transparent)', pointerEvents: 'none', zIndex: 0 }} />
      <div aria-hidden style={{ position: 'fixed', width: 300, height: 300, bottom: 100, right: -50, borderRadius: '50%', background: 'radial-gradient(circle, rgba(80,87,234,0.04), transparent)', pointerEvents: 'none', zIndex: 0 }} />

      {mobileOpen && <div role="presentation" onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 999 }} />}

      <div className={`admin-sidebar-wrap${mobileOpen ? ' open' : ''}`} style={{ position: 'fixed', zIndex: 1000, left: 0, top: 0 }}>
        <aside style={{ width: SIDEBAR_W, height: '100vh', background: SIDEBAR_BG, borderRight: `1px solid ${BORDER}`, boxShadow: '4px 0 24px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <LogoMark />
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, color: TEXT_PRIMARY, lineHeight: 1.2 }}>Superjet Global</div>
              <span style={{ background: '#fff0f0', color: BRAND, fontSize: 10, borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>Admin</span>
            </div>
          </div>

          <div style={{ margin: '0 16px 8px', background: PAGE_BG, border: `1.5px solid ${BORDER}`, borderRadius: 12, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            <input value={sidebarSearch} onChange={(e) => setSidebarSearch(e.target.value)} placeholder="Search..." style={{ background: 'none', border: 'none', fontSize: 13, color: TEXT_PRIMARY, outline: 'none', width: '100%' }} />
          </div>

          <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
            {filteredSections.map((section) => (
              <div key={section.label}>
                <p style={{ fontSize: 10, letterSpacing: '0.1em', color: TEXT_MUTED, padding: '12px 20px 4px', textTransform: 'uppercase', fontWeight: 600, margin: 0 }}>{section.label}</p>
                {section.items.map((item) => {
                  const active = isActive(item.path, item.label)
                  return (
                    <Link key={item.label} to={item.path === '/admin/cases' ? '/admin/leads' : item.path} onClick={() => setMobileOpen(false)} style={navItemStyle(active)}
                      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = PAGE_BG; e.currentTarget.style.color = TEXT_PRIMARY } }}
                      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = TEXT_SECONDARY } }}
                    >
                      <span style={{ width: 32, height: 32, borderRadius: 8, background: active ? 'rgba(249,62,66,0.1)' : PAGE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? BRAND : TEXT_SECONDARY, flexShrink: 0 }}>
                        {NAV_ICONS[item.label]}
                      </span>
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>

          <div style={{ margin: 16, padding: 16, background: 'linear-gradient(135deg, #fff8f8, #fff0f0)', border: '1px solid rgba(249,62,66,0.1)', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <OnlineAvatar size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: TEXT_PRIMARY, fontWeight: 700, fontSize: 14 }}>Super Admin</div>
              <div style={{ color: TEXT_SECONDARY, fontSize: 11 }}>Administrator</div>
            </div>
            <button type="button" onClick={handleLogout} aria-label="Logout" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            </button>
          </div>
        </aside>
      </div>

      <div className="admin-main" style={{ marginLeft: SIDEBAR_W, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        <header style={{ background: '#fff', borderBottom: `1px solid ${BORDER}`, height: 68, padding: '0 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="button" className="admin-hamburger" onClick={() => setMobileOpen((o) => !o)} style={{ display: 'none', border: 'none', background: PAGE_BG, borderRadius: 10, cursor: 'pointer', padding: 8, alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={TEXT_PRIMARY} strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: TEXT_MUTED }}>Admin</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
              <span style={{ color: TEXT_PRIMARY, fontWeight: 600 }}>{title}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="admin-header-search" style={{ background: PAGE_BG, border: `1.5px solid ${BORDER}`, borderRadius: 40, padding: '8px 16px', width: 220, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              <input value={headerSearch} onChange={(e) => setHeaderSearch(e.target.value)} placeholder="Search..." style={{ background: 'none', border: 'none', fontSize: 13, color: TEXT_PRIMARY, outline: 'none', width: '100%' }} />
            </div>
            <div style={{ position: 'relative' }}>
              <button type="button" onClick={() => { setNotifOpen((o) => !o); setProfileOpen(false) }} style={{ width: 40, height: 40, background: PAGE_BG, border: `1.5px solid ${BORDER}`, borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={TEXT_SECONDARY} strokeWidth="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /></svg>
                <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: BRAND, border: '2px solid white' }} />
              </button>
              {notifOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#fff', borderRadius: 16, width: 320, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: `1px solid ${BORDER}`, zIndex: 200, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${BORDER}` }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span>
                    <button type="button" style={{ border: 'none', background: 'none', color: BRAND, fontSize: 12, cursor: 'pointer' }}>Mark all read</button>
                  </div>
                  {['New lead received', 'Payment failed', 'Visa approved'].map((t, i) => (
                    <div key={t} style={{ padding: 14, borderBottom: `1px solid ${BORDER}`, fontSize: 13 }}>
                      <div style={{ fontWeight: 600 }}>{t}</div>
                      <div style={{ color: TEXT_MUTED, fontSize: 11, marginTop: 2 }}>{i + 1} min ago</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ background: PAGE_BG, border: `1.5px solid ${BORDER}`, borderRadius: 40, padding: '8px 16px', fontSize: 13, color: TEXT_SECONDARY }}>{today}</div>
            <div style={{ position: 'relative' }}>
              <button type="button" onClick={() => { setProfileOpen((o) => !o); setNotifOpen(false) }} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
                <OnlineAvatar size={40} />
              </button>
              {profileOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, minWidth: 160, zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                  {[{ label: 'My Profile', action: () => {} }, { label: 'Settings', action: () => navigate('/admin/settings') }, { label: 'Logout', action: handleLogout }].map((item) => (
                    <button key={item.label} type="button" onClick={() => { item.action(); setProfileOpen(false) }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', background: 'none', color: TEXT_PRIMARY, fontSize: 13, cursor: 'pointer' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = PAGE_BG }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
                    >{item.label}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>
        <main style={{ padding: 32, position: 'relative' }}>
          <svg aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.4, width: '100%', height: '100%' }}>
            <defs><pattern id="adminGrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f0f0f5" strokeWidth="1" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#adminGrid)" />
          </svg>
          <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
        </main>
      </div>
    </div>
  )
}

export function AdminGuard({ children }: { children: ReactNode }) {
  const loggedIn = localStorage.getItem('admin_logged_in') === 'true'
  if (!loggedIn) return <Navigate to="/admin/login" replace />
  return children
}
