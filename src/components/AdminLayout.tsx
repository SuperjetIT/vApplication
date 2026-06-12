import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { BRAND, BRAND_BLUE, PAGE_BG, SIDEBAR_BG, BORDER, SUCCESS, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, cardStyle, inputStyle, primaryBtn, outlineBtn } from './admin/adminTheme'
import { ADMIN_LOGIN_PATH, OPERATIONS_BASE_PATH, OPERATIONS_LOGIN_PATH } from '../config/portalRoutes'
import { clearPortalSession, getPortalRole, getPortalUser, isOperationsPath } from '../utils/portalAuth'
import './admin/adminResponsive.css'
import {
  loadCalendarEvents,
  loadNotes,
  loadWalletBalances,
  playNotificationSound,
  saveCalendarEvents,
  saveNotes,
  type AdminCalendarEvent,
  type AdminNote,
} from '../utils/adminStorage'

const SIDEBAR_W = 260

const NOTIFICATIONS = [
  { title: 'New application received', desc: 'Fatima Al Mansouri — Schengen visa', time: '2 min ago', gradient: 'linear-gradient(135deg,#5057ea,#818cf8)', unread: true },
  { title: 'Payment received', desc: 'AED 462 from Ravi Kumar', time: '15 min ago', gradient: 'linear-gradient(135deg,#22c55e,#86efac)', unread: true },
  { title: 'Document rejected', desc: 'Passport unclear — Priya Sharma', time: '32 min ago', gradient: 'linear-gradient(135deg,#f93e42,#ff6b6b)', unread: false },
  { title: 'New B2B partner registered', desc: 'Dubai Travel Co.', time: '1 hr ago', gradient: 'linear-gradient(135deg,#8b5cf6,#c4b5fd)', unread: false },
]

const NAV_ICONS: Record<string, ReactNode> = {
  Dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
  Leads: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  Customers: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>,
  Agents: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2z" /></svg>,
  Cases: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>,
  Invoices: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>,
  Payments: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>,
  Expenses: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
  Reports: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  Users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  Settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" /></svg>,
}

const NAV_DISPLAY: Record<string, string> = {
  Leads: 'Applications',
  Customers: 'B2C Users',
  Agents: 'B2B Partners',
}

function buildNavSections(basePath: string, isOperations: boolean) {
  const sections = [
    { label: 'Overview', items: [{ path: basePath, label: 'Dashboard' }] },
    { label: 'CRM', items: [{ path: `${basePath}/leads`, label: 'Leads' }, { path: `${basePath}/customers`, label: 'Customers' }, { path: `${basePath}/agents`, label: 'Agents' }] },
    { label: 'Finance', items: [{ path: `${basePath}/invoices`, label: 'Invoices' }, { path: `${basePath}/payments`, label: 'Payments' }, { path: `${basePath}/expenses`, label: 'Expenses' }, { path: `${basePath}/reports`, label: 'Reports' }] },
  ]
  if (!isOperations) {
    sections.push({
      label: 'System',
      items: [{ path: `${basePath}/users`, label: 'Users' }, { path: `${basePath}/settings`, label: 'Settings' }],
    })
  }
  return sections
}

function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return (parts[0]?.slice(0, 2) ?? 'U').toUpperCase()
}

export function AdminLayout({ activePath, title, children }: { activePath: string; title: string; children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isOperations = isOperationsPath(location.pathname)
  const basePath = isOperations ? OPERATIONS_BASE_PATH : '/admin'
  const loginPath = isOperations ? OPERATIONS_LOGIN_PATH : ADMIN_LOGIN_PATH
  const portalUser = getPortalUser()
  const displayName = portalUser?.name ?? (isOperations ? 'Operations User' : 'Super Admin')
  const displayRole = isOperations ? 'Operations' : 'Administrator'
  const userInitials = nameInitials(displayName)
  const navSections = buildNavSections(basePath, isOperations)
  const portalLabel = isOperations ? 'Operations' : 'Admin'
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [headerSearch, setHeaderSearch] = useState('')
  const [plannerOpen, setPlannerOpen] = useState(false)
  const [notes, setNotes] = useState<AdminNote[]>(() => loadNotes())
  const [events, setEvents] = useState<AdminCalendarEvent[]>(() => loadCalendarEvents())
  const [newNote, setNewNote] = useState('')
  const [newEvent, setNewEvent] = useState({ date: new Date().toISOString().slice(0, 10), title: '', time: '' })
  const [wallet] = useState(() => loadWalletBalances())
  const [soundOn, setSoundOn] = useState(true)

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  const handleLogout = () => { clearPortalSession(); navigate(loginPath) }

  useEffect(() => {
    saveNotes(notes)
  }, [notes])

  useEffect(() => {
    saveCalendarEvents(events)
  }, [events])

  const handleHeaderSearch = (e: FormEvent) => {
    e.preventDefault()
    const q = headerSearch.trim()
    if (!q) return
    navigate(`${basePath}/leads?search=${encodeURIComponent(q)}`)
  }

  const toggleNotifications = () => {
    setNotifOpen((o) => {
      if (!o && soundOn) playNotificationSound()
      return !o
    })
    setProfileOpen(false)
  }

  const addNote = () => {
    if (!newNote.trim()) return
    setNotes((prev) => [{ id: String(Date.now()), date: new Date().toISOString().slice(0, 10), text: newNote.trim(), createdAt: new Date().toISOString() }, ...prev])
    setNewNote('')
  }

  const addEvent = () => {
    if (!newEvent.title.trim()) return
    setEvents((prev) => [...prev, { id: String(Date.now()), ...newEvent }].sort((a, b) => a.date.localeCompare(b.date)))
    setNewEvent({ date: new Date().toISOString().slice(0, 10), title: '', time: '' })
  }

  const normalizedActive = activePath.replace(/^\/admin/, basePath)

  const isActive = (path: string, label: string) => {
    if (path === basePath) return normalizedActive === basePath
    if (label === 'Leads') return normalizedActive === `${basePath}/leads` || normalizedActive.startsWith(`${basePath}/cases`)
    return normalizedActive === path || normalizedActive.startsWith(path + '/')
  }

  const navStyle = (active: boolean): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 16px',
    borderRadius: 12,
    margin: '2px 8px',
    fontSize: 13,
    fontWeight: active ? 600 : 500,
    color: active ? BRAND : TEXT_SECONDARY,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.15s',
    background: active ? 'linear-gradient(135deg, #fff0f0, #fff5f5)' : 'transparent',
    boxShadow: active ? '0 2px 8px rgba(249,62,66,0.1)' : 'none',
    position: 'relative',
  })

  return (
    <div className="admin-root" style={{ minHeight: '100vh', background: PAGE_BG, color: TEXT_PRIMARY }}>

      {mobileOpen && <div role="presentation" onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 999 }} />}

      <div className={`admin-sidebar-wrap${mobileOpen ? ' open' : ''}`} style={{ position: 'fixed', zIndex: 1000, left: 0, top: 0 }}>
        <aside style={{ width: SIDEBAR_W, height: '100vh', background: SIDEBAR_BG, borderRight: `1px solid ${BORDER}`, boxShadow: '2px 0 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #f93e42, #ff6b6b)', boxShadow: '0 4px 12px rgba(249,62,66,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>SG</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: TEXT_PRIMARY, lineHeight: 1.2 }}>Superjet Global</div>
                <span style={{ background: isOperations ? '#f0f0ff' : '#fff0f0', color: isOperations ? BRAND_BLUE : BRAND, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{portalLabel}</span>
              </div>
            </div>
          </div>
          <div style={{ height: 1, background: '#f0f0f0', margin: '0 16px 16px' }} />

          <nav style={{ flex: 1, overflowY: 'auto' }}>
            {navSections.map((section) => (
              <div key={section.label} style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: TEXT_MUTED, padding: '0 16px', margin: '0 0 4px', textTransform: 'uppercase' }}>{section.label}</p>
                {section.items.map((item) => {
                  const active = isActive(item.path, item.label)
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)} style={navStyle(active)}
                      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = PAGE_BG; e.currentTarget.style.color = TEXT_PRIMARY } }}
                      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = TEXT_SECONDARY } }}
                    >
                      {active && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, background: BRAND, borderRadius: '0 3px 3px 0' }} />}
                      <span style={{ color: 'currentColor' }}>{NAV_ICONS[item.label]}</span>
                      {NAV_DISPLAY[item.label] ?? item.label}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>

          <div style={{ padding: '0 16px 8px', opacity: 0.06, textAlign: 'center' }}>
            <svg width="80" height="40" viewBox="0 0 24 24" fill={TEXT_PRIMARY}><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" /></svg>
          </div>

          <div style={{ margin: 16, borderRadius: 16, background: 'linear-gradient(135deg, #f8f9fc, #f0f4ff)', border: `1px solid ${BORDER}`, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: isOperations ? 'linear-gradient(135deg, #5057ea, #818cf8)' : 'linear-gradient(135deg, #f93e42, #ff6b6b)', color: '#fff', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isOperations ? '0 4px 12px rgba(80,87,234,0.3)' : '0 4px 12px rgba(249,62,66,0.3)' }}>{userInitials}</div>
                <span style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, background: SUCCESS, border: '2px solid white', borderRadius: '50%' }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: TEXT_PRIMARY }}>{displayName}</div>
                <div style={{ color: TEXT_SECONDARY, fontSize: 12 }}>{displayRole}</div>
              </div>
            </div>
            <button type="button" onClick={handleLogout} style={{ width: '100%', marginTop: 10, background: '#fff', border: `1px solid ${BORDER}`, color: TEXT_SECONDARY, borderRadius: 10, padding: 8, fontSize: 13, cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#fff0f0'; e.currentTarget.style.color = BRAND }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = TEXT_SECONDARY }}
            >Sign Out</button>
          </div>
        </aside>
      </div>

      <div className="admin-main" style={{ marginLeft: SIDEBAR_W, minHeight: '100vh' }}>
        <header className="admin-header" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button type="button" className="admin-hamburger" onClick={() => setMobileOpen((o) => !o)} style={{ display: 'none', border: 'none', background: PAGE_BG, borderRadius: 10, cursor: 'pointer', padding: 8, flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={TEXT_PRIMARY} strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="admin-header-title" style={{ minWidth: 0 }}>
              <div className="admin-header-breadcrumb" style={{ fontSize: 12, color: TEXT_MUTED }}>{portalLabel} / {title}</div>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY }}>{title}</h1>
            </div>
          </div>
          <div className="admin-header-actions">
            <div style={{ display: 'flex', gap: 8 }} className="admin-wallet-pills">
              <div style={{ background: '#f0f0ff', border: `1px solid #e0e7ff`, borderRadius: 40, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: BRAND_BLUE }}>
                B2B Wallet: AED {wallet.b2b.toLocaleString()}
              </div>
              <div style={{ background: '#fff0f0', border: `1px solid #fce7e7`, borderRadius: 40, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: BRAND }}>
                B2C Wallet: AED {wallet.b2c.toLocaleString()}
              </div>
            </div>
            <form onSubmit={handleHeaderSearch} className="admin-header-search" style={{ background: PAGE_BG, border: `1px solid ${BORDER}`, borderRadius: 40, padding: '8px 16px', width: 220, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="1.8"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              <input value={headerSearch} onChange={(e) => setHeaderSearch(e.target.value)} placeholder="Search applications..." style={{ background: 'none', border: 'none', fontSize: 13, color: TEXT_PRIMARY, outline: 'none', width: '100%' }} />
            </form>
            <button type="button" onClick={() => { setPlannerOpen(true); setNotifOpen(false); setProfileOpen(false) }} title="Calendar & Notes" style={{ width: 40, height: 40, borderRadius: '50%', background: PAGE_BG, border: `1px solid ${BORDER}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
              📅
            </button>
            <div style={{ position: 'relative' }}>
              <button type="button" onClick={toggleNotifications} style={{ width: 40, height: 40, borderRadius: '50%', background: PAGE_BG, border: `1px solid ${BORDER}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={TEXT_SECONDARY} strokeWidth="1.8"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /></svg>
                <span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', background: BRAND, border: '2px solid white' }} />
              </button>
              {notifOpen && (
                <div className="admin-notif-panel" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#fff', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.12)', border: `1px solid ${BORDER}`, width: 340, zIndex: 9999, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${BORDER}` }}>
                    <span style={{ fontWeight: 700, color: TEXT_PRIMARY }}>Notifications</span>
                    <button type="button" style={{ border: 'none', background: 'none', color: BRAND, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Mark all read</button>
                  </div>
                  {NOTIFICATIONS.map((n) => (
                    <div key={n.title} style={{ display: 'flex', gap: 12, padding: 16, borderBottom: '1px solid #f5f5f5', alignItems: 'flex-start' }}>
                      {n.unread && <span style={{ width: 6, height: 6, borderRadius: '50%', background: BRAND_BLUE, marginTop: 8, flexShrink: 0 }} />}
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: n.gradient, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="4" /></svg>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: TEXT_PRIMARY }}>{n.title}</div>
                        <div style={{ fontSize: 12, color: TEXT_SECONDARY }}>{n.desc}</div>
                        <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span className="admin-header-date" style={{ color: TEXT_SECONDARY, fontSize: 12 }}>{today}</span>
            <div style={{ position: 'relative' }}>
              <button type="button" className="admin-header-profile-btn" onClick={() => { setProfileOpen((o) => !o); setNotifOpen(false) }} style={{ display: 'flex', alignItems: 'center', gap: 8, background: PAGE_BG, border: `1px solid ${BORDER}`, borderRadius: 40, padding: '6px 14px 6px 6px', cursor: 'pointer' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: isOperations ? 'linear-gradient(135deg, #5057ea, #818cf8)' : 'linear-gradient(135deg, #f93e42, #ff6b6b)', color: '#fff', fontWeight: 700, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{userInitials}</div>
                <span className="admin-header-profile-name" style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY }}>{displayName}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {profileOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, minWidth: 160, zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                  {[
                    { label: 'My Profile', action: () => {} },
                    ...(!isOperations ? [{ label: 'Settings', action: () => navigate(`${basePath}/settings`) }] : []),
                    { label: 'Logout', action: handleLogout },
                  ].map((item) => (
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
        <main className="admin-main-content">{children}</main>
      </div>

      {plannerOpen && (
        <>
          <div role="presentation" onClick={() => setPlannerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 3000 }} />
          <div style={{ position: 'fixed', top: 0, right: 0, width: 400, maxWidth: '100%', height: '100vh', background: '#fff', boxShadow: '-8px 0 40px rgba(0,0,0,0.1)', zIndex: 3001, overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Calendar & Notes</h2>
              <button type="button" onClick={() => setPlannerOpen(false)} style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer', color: TEXT_MUTED }}>×</button>
            </div>
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>📅 Upcoming Events</h3>
              {events.map((ev) => (
                <div key={ev.id} style={{ ...cardStyle, padding: 12, marginBottom: 8, fontSize: 13 }}>
                  <div style={{ fontWeight: 600 }}>{ev.title}</div>
                  <div style={{ color: TEXT_MUTED, fontSize: 12, marginTop: 2 }}>{ev.date}{ev.time ? ` · ${ev.time}` : ''}</div>
                </div>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                <input type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} style={inputStyle} />
                <input placeholder="Event title" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} style={inputStyle} />
                <input placeholder="Time (optional)" value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} style={inputStyle} />
                <button type="button" onClick={addEvent} style={{ ...outlineBtn, fontSize: 13 }}>+ Add Event</button>
              </div>
            </div>
            <div>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>📝 Notes</h3>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input placeholder="Add a note..." value={newNote} onChange={(e) => setNewNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addNote()} style={{ ...inputStyle, flex: 1 }} />
                <button type="button" onClick={addNote} style={{ ...primaryBtn, padding: '10px 16px' }}>Add</button>
              </div>
              {notes.map((n) => (
                <div key={n.id} style={{ padding: 12, borderBottom: `1px solid ${BORDER}`, fontSize: 13 }}>
                  <div style={{ color: TEXT_MUTED, fontSize: 11, marginBottom: 4 }}>{n.date}</div>
                  <div style={{ color: TEXT_PRIMARY }}>{n.text}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: TEXT_SECONDARY, cursor: 'pointer' }}>
                <input type="checkbox" checked={soundOn} onChange={(e) => setSoundOn(e.target.checked)} />
                Notification sound
              </label>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export function AdminGuard({ children }: { children: ReactNode }) {
  const role = getPortalRole()
  if (role === 'operations') return <Navigate to={OPERATIONS_BASE_PATH} replace />
  if (role !== 'admin') return <Navigate to={ADMIN_LOGIN_PATH} replace />
  return children
}

export function OperationsGuard({ children }: { children: ReactNode }) {
  if (getPortalRole() !== 'operations') return <Navigate to={OPERATIONS_LOGIN_PATH} replace />
  return children
}
