import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { SiteFooter } from '../components/SiteFooter'
import { useAuth } from '../context/AuthContext'
import { Database } from '../database/db'
import {
  getApplicationsForUser,
  getCountryForApplication,
} from '../utils/applications'
import { useDatabaseListener } from '../hooks/useDatabase'
import { clearRedirectUrl, peekRedirectUrl } from '../utils/authGate'
import { readProfileImageFile } from '../utils/profilePhoto'
import './UserMePage.css'

const BRAND = '#f93e42'

type Section = 'profile' | 'applications' | 'support'

function ShieldSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
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

function NavIcon({ type }: { type: Section | 'logout' }) {
  const c = '#6b7280'
  if (type === 'profile') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="8" r="4" stroke={c} strokeWidth="1.5" />
        <path d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke={c} strokeWidth="1.5" />
      </svg>
    )
  }
  if (type === 'applications') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="5" y="3" width="14" height="18" rx="2" stroke={c} strokeWidth="1.5" />
        <path d="M9 8h6M9 12h6M9 16h4" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }
  if (type === 'support') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.5" />
        <path d="M12 11v5M12 8h.01" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
        stroke="#b91c1c"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function EditPhotoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 20h4l10.5-10.5a2.12 2.12 0 00-3-3L5 17v3z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M13.5 6.5l3 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function ProfileAvatarPicker({
  profilePhotoUrl,
  avatarInitials,
  avatarColor,
  onPhotoChange,
  onUploadError,
}: {
  profilePhotoUrl: string | null
  avatarInitials: string
  avatarColor: string
  onPhotoChange: (dataUrl: string) => Promise<void>
  onUploadError: (message: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file: File) => {
    setUploading(true)
    onUploadError('')
    try {
      const dataUrl = await readProfileImageFile(file)
      await onPhotoChange(dataUrl)
    } catch (err) {
      onUploadError(err instanceof Error ? err.message : 'Could not upload photo.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="user-me-avatar-wrap">
      <div
        className="user-me-avatar"
        style={profilePhotoUrl ? undefined : { background: avatarColor }}
      >
        {profilePhotoUrl ? (
          <img src={profilePhotoUrl} alt="" className="user-me-avatar__img" />
        ) : (
          avatarInitials
        )}
      </div>
      <button
        type="button"
        className="user-me-avatar__edit"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        aria-label="Change profile picture"
        title="Upload profile picture"
      >
        <EditPhotoIcon />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) void handleFile(file)
        }}
      />
    </div>
  )
}

function SidebarNav({
  section,
  setSection,
  onLogout,
}: {
  section: Section
  setSection: (s: Section) => void
  onLogout: () => void
}) {
  const items: { id: Section; label: string }[] = [
    { id: 'profile', label: 'My Profile' },
    { id: 'applications', label: 'My Applications' },
    { id: 'support', label: 'Help & Support' },
  ]

  return (
    <nav className="user-me-nav" aria-label="Account">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`user-me-nav__item${section === item.id ? ' is-active' : ''}`}
          onClick={() => setSection(item.id)}
        >
          <NavIcon type={item.id} />
          {item.label}
        </button>
      ))}
      <button type="button" className="user-me-nav__item user-me-nav__item--logout" onClick={onLogout}>
        <NavIcon type="logout" />
        Sign out
      </button>
    </nav>
  )
}

export default function UserMePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isLoggedIn, logout, displayName, avatarInitials, avatarColor, profilePhotoUrl, updateProfile, updateProfilePhoto } =
    useAuth()
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [section, setSection] = useState<Section>(() => {
    const fromState = (location.state as { section?: Section } | null)?.section
    return fromState === 'applications' || fromState === 'support' ? fromState : 'profile'
  })
  const [name, setName] = useState(user?.fullName ?? displayName)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [photoSaved, setPhotoSaved] = useState(false)
  const [resumeUrl, setResumeUrl] = useState<string | null>(null)
  const isLoggingOutRef = useRef(false)
  const dbVersion = useDatabaseListener()
  const applications = user?.email ? getApplicationsForUser(user.email) : []
  const userId = user?.email
    ? (localStorage.getItem('current_user_id') ?? Database.getUserByEmail(user.email.trim().toLowerCase())?.id)
    : null
  const walletBalance = useMemo(
    () => (userId ? Database.getUserWalletBalance(String(userId)) : 0),
    [userId, dbVersion],
  )

  useEffect(() => {
    const redirectUrl = peekRedirectUrl()
    if (redirectUrl && redirectUrl.includes('/apply')) {
      setResumeUrl(redirectUrl)
    }
  }, [])

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    setName(user?.fullName ?? displayName)
  }, [user?.fullName, displayName])

  useEffect(() => {
    const fromState = (location.state as { section?: Section } | null)?.section
    if (fromState === 'applications' || fromState === 'support' || fromState === 'profile') {
      setSection(fromState)
    }
  }, [location.state])

  if (!isLoggedIn || !user) {
    if (isLoggingOutRef.current) {
      return <Navigate to="/" replace />
    }
    return <Navigate to="/sign-in" replace />
  }

  const handleLogout = () => {
    isLoggingOutRef.current = true
    logout()
    navigate('/', { replace: true })
  }

  const handleSaveProfile = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setProfileError(null)
    try {
      await updateProfile(trimmed)
      setSaved(true)
      window.setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Could not save profile.')
    }
  }

  const handlePhotoChange = async (dataUrl: string) => {
    setPhotoError(null)
    try {
      await updateProfilePhoto(dataUrl)
      setPhotoSaved(true)
      window.setTimeout(() => setPhotoSaved(false), 3000)
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Could not save profile picture.')
    }
  }

  const handlePhotoUploadError = (message: string) => {
    setPhotoError(message || null)
    setPhotoSaved(false)
  }

  return (
    <div className="user-me-page">
      <Navbar
        isMobile={isMobile}
        isLoggedIn
        avatarInitials={avatarInitials}
        avatarColor={avatarColor}
        profilePhotoUrl={profilePhotoUrl ?? undefined}
        showTabs={false}
        walletBalance={walletBalance}
      />

      <div className="user-me-wrap">
        <div className="user-me-mobile-nav">
          <SidebarNav section={section} setSection={setSection} onLogout={handleLogout} />
        </div>

        <div className="user-me-layout">
          <aside className="user-me-sidebar">
            <div className="user-me-sidebar__brand">
              <Link to="/" className="user-me-sidebar__logo">
                Superjet Global
              </Link>
              <ShieldSmall />
            </div>
            <SidebarNav section={section} setSection={setSection} onLogout={handleLogout} />
          </aside>

          <div className="user-me-main">
            {resumeUrl && (
              <div
                style={{
                  background: '#fff8f8',
                  border: '1px solid #fca5a5',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 20,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <p style={{ margin: 0, fontSize: 14, color: '#1a1a2e', fontWeight: 500 }}>
                  ↩ You were applying for a visa. Continue where you left off?
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => {
                      const url = resumeUrl
                      clearRedirectUrl()
                      setResumeUrl(null)
                      navigate(url)
                    }}
                    style={{
                      background: BRAND,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      padding: '8px 20px',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Continue Application →
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearRedirectUrl()
                      setResumeUrl(null)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      fontSize: 13,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {section === 'profile' && (
              <>
                <div className="user-me-card">
                  <div className="user-me-profile-head">
                    <ProfileAvatarPicker
                      profilePhotoUrl={profilePhotoUrl}
                      avatarInitials={avatarInitials}
                      avatarColor={avatarColor}
                      onPhotoChange={handlePhotoChange}
                      onUploadError={handlePhotoUploadError}
                    />
                    <div>
                      <h1>Hi, {displayName}</h1>
                      <p>Manage your Superjet Global account and travel profile</p>
                      <span className="user-me-badge">
                        <ShieldSmall /> Visas On Time Guaranteed
                      </span>
                    </div>
                  </div>

                  {photoSaved && (
                    <div className="user-me-alert" role="status">
                      Profile picture updated.
                    </div>
                  )}
                  {photoError && (
                    <div className="user-me-alert user-me-alert--error" role="alert">
                      {photoError}
                    </div>
                  )}

                  {saved && (
                    <div className="user-me-alert" role="status">
                      Profile updated successfully.
                    </div>
                  )}
                  {profileError && (
                    <div className="user-me-alert user-me-alert--error" role="alert">
                      {profileError}
                    </div>
                  )}

                  <h2 className="user-me-section-title">My Wallet</h2>
                  <div className="user-me-accent" />
                  <div style={{ background: 'linear-gradient(135deg, #5057ea, #818cf8)', borderRadius: 16, padding: 24, color: '#fff', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 13, opacity: 0.85 }}>Available Balance</div>
                      <div style={{ fontSize: 32, fontWeight: 800, marginTop: 4 }}>AED {walletBalance.toLocaleString()}</div>
                    </div>
                    <Link to="/user/me/wallet" style={{ background: '#fff', color: '#5057ea', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                      Recharge Wallet →
                    </Link>
                  </div>

                  <h2 className="user-me-section-title">Account details</h2>
                  <div className="user-me-accent" />

                  <div className="user-me-field">
                    <label htmlFor="profile-name">Full name</label>
                    <input
                      id="profile-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="user-me-field">
                    <label htmlFor="profile-email">Email address</label>
                    <input id="profile-email" type="email" value={user.email} disabled />
                  </div>

                  <button type="button" className="user-me-btn" onClick={handleSaveProfile}>
                    Save changes
                  </button>
                </div>

                <div className="user-me-protect">
                  <h3>Superjet Global Protect</h3>
                  <p>If your visa is delayed — we follow up with the embassy and keep you updated</p>
                  <p>If Rejected — 100% Refund on processing fees</p>
                </div>
              </>
            )}

            {section === 'applications' && (
              <div className="user-me-card">
                <h2 className="user-me-section-title">My Applications</h2>
                <div className="user-me-accent" />
                <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: 14 }}>
                  Track visa applications submitted through Superjet Global
                </p>

                {applications.length > 0 ? (
                  <div className="user-me-app-list">
                    {applications.map((app) => {
                      const country = getCountryForApplication(app)
                      return (
                        <Link
                          key={app.id}
                          to={`/user/me/applications/${app.id}`}
                          className="user-me-app"
                        >
                          <img
                            className="user-me-app__flag"
                            src={`https://flagcdn.com/w80/${app.countryCode}.png`}
                            alt=""
                          />
                          <div className="user-me-app__body">
                            <h3>{app.countryName} Visa</h3>
                            <p>
                              {app.travelers} traveler{app.travelers > 1 ? 's' : ''} · Applied{' '}
                              {app.appliedOn}
                              {country ? ` · ${country.processingTime}` : ''}
                            </p>
                          </div>
                          <span
                            className={`user-me-status user-me-status--${
                              app.status === 'Approved'
                                ? 'approved'
                                : app.status === 'Rejected'
                                  ? 'rejected'
                                  : app.status === 'Payment Pending' || app.status === 'Docs Pending'
                                    ? 'pending'
                                    : 'progress'
                            }`}
                          >
                            {app.status}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <div className="user-me-empty">
                    <p>No applications yet. Start your first visa with Superjet Global.</p>
                    <Link to="/" className="user-me-btn">
                      Explore destinations
                    </Link>
                  </div>
                )}

                {applications.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <Link to="/" className="user-me-btn user-me-btn--outline">
                      Apply for another visa
                    </Link>
                  </div>
                )}
              </div>
            )}

            {section === 'support' && (
              <div className="user-me-card">
                <h2 className="user-me-section-title">Help & Support</h2>
                <div className="user-me-accent" />
                <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: 14, lineHeight: 1.6 }}>
                  Our visa experts are available for documents, processing times, pricing, and
                  application status.
                </p>

                <div className="user-me-quick">
                  <a href="https://wa.me/971559641020" target="_blank" rel="noopener noreferrer">
                    <span style={{ fontSize: 20 }}>💬</span>
                    WhatsApp Support
                  </a>
                  <Link to="/contact">
                    <span style={{ fontSize: 20 }}>✉️</span>
                    Contact us
                  </Link>
                  <Link to="/">
                    <span style={{ fontSize: 20 }}>🌍</span>
                    Browse visas
                  </Link>
                </div>

                <div
                  style={{
                    marginTop: 24,
                    padding: 16,
                    background: '#f9fafb',
                    borderRadius: 12,
                    fontSize: 13,
                    color: '#6b7280',
                  }}
                >
                  <strong style={{ color: '#111827' }}>UAE residents</strong> — Highest-rated visa
                  platform with guaranteed on-time delivery.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <SiteFooter isMobile={isMobile} />
    </div>
  )
}
