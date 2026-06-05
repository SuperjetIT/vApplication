import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { SiteFooter } from '../components/SiteFooter'
import { useAuth } from '../context/AuthContext'
import { getApplicationForUser, getCountryForApplication } from '../utils/applications'
import './UserMePage.css'

const BRAND = '#f93e42'

export default function UserApplicationPage() {
  const { applicationId } = useParams<{ applicationId: string }>()
  const navigate = useNavigate()
  const { user, isLoggedIn, avatarInitials, avatarColor } = useAuth()
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  if (!isLoggedIn || !user) {
    return <Navigate to="/sign-in" replace />
  }

  if (!applicationId) {
    return <Navigate to="/user/me" replace />
  }

  const application = getApplicationForUser(user.email, applicationId)

  if (!application) {
    return <Navigate to="/user/me" replace state={{ section: 'applications' }} />
  }

  const country = getCountryForApplication(application)

  return (
    <div className="user-me-page">
      <Navbar
        isMobile={isMobile}
        isLoggedIn
        avatarInitials={avatarInitials}
        avatarColor={avatarColor}
        showTabs={false}
      />

      <div className="user-me-wrap">
        <div className="user-me-card" style={{ maxWidth: 640, margin: '0 auto' }}>
          <Link
            to="/user/me"
            state={{ section: 'applications' }}
            style={{ color: BRAND, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
          >
            ← Back to My Applications
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 24, marginBottom: 24 }}>
            <img
              src={`https://flagcdn.com/w80/${application.countryCode}.png`}
              alt=""
              width={56}
              height={40}
              style={{ borderRadius: 6, objectFit: 'cover' }}
            />
            <div>
              <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: '#111827' }}>
                {application.countryName} Visa
              </h1>
              <span
                className={`user-me-status user-me-status--${
                  application.status === 'Approved' ? 'approved' : 'progress'
                }`}
              >
                {application.status}
              </span>
            </div>
          </div>

          <div className="user-me-accent" />

          <dl style={{ margin: 0, display: 'grid', gap: 14, fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <dt style={{ color: '#6b7280', margin: 0 }}>Applied on</dt>
              <dd style={{ margin: 0, fontWeight: 600, color: '#111827' }}>{application.appliedOn}</dd>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <dt style={{ color: '#6b7280', margin: 0 }}>Travelers</dt>
              <dd style={{ margin: 0, fontWeight: 600, color: '#111827' }}>{application.travelers}</dd>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <dt style={{ color: '#6b7280', margin: 0 }}>Total paid</dt>
              <dd style={{ margin: 0, fontWeight: 700, color: BRAND }}>AED {application.totalAed}</dd>
            </div>
            {country && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                <dt style={{ color: '#6b7280', margin: 0 }}>Processing time</dt>
                <dd style={{ margin: 0, fontWeight: 600, color: '#111827' }}>{country.processingTime}</dd>
              </div>
            )}
          </dl>

          <p style={{ margin: '24px 0 0', fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
            This application belongs to your account ({user.email}). Track updates here or contact
            support if you need help.
          </p>

          <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <button type="button" className="user-me-btn" onClick={() => navigate('/user/me')}>
              My account
            </button>
            <Link to={`/visa/${application.countrySlug}`} className="user-me-btn user-me-btn--outline">
              View country requirements
            </Link>
          </div>
        </div>
      </div>
      <SiteFooter isMobile={isMobile} />
    </div>
  )
}
