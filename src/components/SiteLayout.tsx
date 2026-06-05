import { Link, useLocation } from 'react-router-dom'
import { ChevronIcon, ExploreIcon, EventsIcon, HomeIcon, ProfileIcon } from './icons'
import { flagUrl } from '../utils/flags'
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

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <Link to="/" className="logo" aria-label="vApplication home">
            vApplication
          </Link>

          <nav className="header-tabs" aria-label="Main">
            <Link to="/" className={`header-tabs__item ${isHome ? 'is-active' : ''}`}>
              <ExploreIcon />
              Explore
            </Link>
            <span className="header-tabs__divider" aria-hidden />
            <button type="button" className="header-tabs__item">
              <EventsIcon />
              Events
            </button>
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

      {!hideDefaultFooter && (
      <footer className="site-footer">
        <div className="site-footer__grid">
          <div>
            <h4>Company</h4>
            <ul>
              <li><a href="#careers">Careers</a></li>
              <li><a href="#newsroom">Newsroom</a></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><a href="#partners">Partners</a></li>
            </ul>
          </div>
          <div>
            <h4>Products</h4>
            <ul>
              <li><a href="#requirements">Visa Requirements</a></li>
              <li><a href="#photo">Visa Photo Creator</a></li>
              <li><a href="#helpline">Emergency Helpline</a></li>
              <li><a href="#student">Student Visa</a></li>
            </ul>
          </div>
          <div>
            <h4>Guides</h4>
            <ul>
              <li><Link to="/visa/schengen">Schengen Visa</Link></li>
              <li><a href="#us">US Visa</a></li>
              <li><a href="#uk">UK Visa</a></li>
              <li><a href="#japan">Japan Visa</a></li>
            </ul>
          </div>
          <div>
            <h4>Offices</h4>
            <ul className="offices">
              <li>447 Broadway STE 851, New York, USA</li>
              <li>M16, Al Quoz 3, Sheikh Zayed Rd, Dubai, UAE</li>
              <li>7 Khullar Farms, New Delhi, India</li>
            </ul>
          </div>
        </div>
        <div className="site-footer__bottom">
          <span>© vApplication, All rights reserved</span>
          <span className="site-footer__links">
            <a href="#privacy">Privacy</a>
            <span aria-hidden>•</span>
            <a href="#terms">Terms</a>
          </span>
        </div>
      </footer>
      )}

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
      <p>vApplication helps you plan, apply, and track visas seamlessly across the world.</p>
      <button type="button" className="promo__ai">
        Ask AI about vApplication
      </button>
    </section>
  )
}
