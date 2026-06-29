import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronIcon, ExploreIcon, HomeIcon, ProfileIcon } from './icons'
import { flagUrl } from '../utils/flags'
import { SiteFooter } from './SiteFooter'
import './SiteLayout.css'

export function SiteLayout({
  children,
  hideDefaultFooter = false,
}: {
  children: React.ReactNode
  hideDefaultFooter?: boolean
}) {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <Link to="/" className="logo" aria-label="Superjet Global home">
            Superjet Global
          </Link>

          <nav className="header-tabs" aria-label="Main">
            <Link to="/" className={`header-tabs__item ${isHome ? 'is-active' : ''}`}>
              <ExploreIcon />
              Explore
            </Link>
          </nav>

          <div className="header-actions">
            <button type="button" className="locale-picker" aria-label="United Arab Emirates">
              <img src={flagUrl('ae', 40)} alt="" width={24} height={16} />
              <span>AE</span>
              <ChevronIcon />
            </button>
            <Link to="/sign-in" className="signin-link">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {children}

      {!hideDefaultFooter && <SiteFooter isMobile={isMobile} />}

      <nav className="mobile-nav" aria-label="Mobile">
        <Link to="/" className={`mobile-nav__item ${isHome ? 'is-active' : ''}`}>
          <HomeIcon />
          Home
        </Link>
        <Link to="/sign-in" className="mobile-nav__item">
          <ProfileIcon />
          My Profile
        </Link>
      </nav>
    </div>
  )
}

export function PromoSection() {
  return (
    <section className="promo">
      <p>Superjet Global helps you plan, apply, and track visas seamlessly across the world.</p>
      <button type="button" className="promo__ai">
        Ask AI about Superjet Global
      </button>
    </section>
  )
}
