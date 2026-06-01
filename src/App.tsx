import { useMemo, useState } from 'react'
import { countries, type Country } from './data/countries'
import './App.css'

const visaTypeOptions = ['All Visa Types', 'e-Visa', 'Sticker', 'No Visa Required'] as const

function flagUrl(code: string) {
  return `https://flagcdn.com/w80/${code}.png`
}

function CountryCard({ country }: { country: Country }) {
  const noVisa = country.type === 'No Visa Required'

  return (
    <article className={`country-card ${noVisa ? 'country-card--no-visa' : ''}`}>
      <div className="country-card__top">
        <img
          src={flagUrl(country.code)}
          alt=""
          className="country-card__flag"
          width={40}
          height={28}
          loading="lazy"
        />
        <h3 className="country-card__name">{country.name}</h3>
      </div>

      <dl className="country-card__meta">
        <div className="country-card__row">
          <dt>Type</dt>
          <dd>{country.type}</dd>
        </div>
        {country.valid && (
          <div className="country-card__row">
            <dt>Valid</dt>
            <dd>{country.valid}</dd>
          </div>
        )}
        {country.hasFees && (
          <div className="country-card__row country-card__row--fees">
            <dt>Fees</dt>
            <dd />
          </div>
        )}
        {country.documents && country.documents.length > 0 && (
          <div className="country-card__row country-card__row--docs">
            <dt>Documents Needed:</dt>
            <dd>{country.documents.join(', ')}</dd>
          </div>
        )}
      </dl>

      {!noVisa && (
        <button type="button" className="country-card__cta">
          Get emergency assistance
        </button>
      )}
    </article>
  )
}

function App() {
  const [search, setSearch] = useState('')
  const [visaType, setVisaType] = useState<(typeof visaTypeOptions)[number]>('All Visa Types')
  const [activeTab, setActiveTab] = useState<'explore' | 'events'>('explore')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return countries.filter((c) => {
      const matchesSearch = !q || c.name.toLowerCase().includes(q)
      const matchesType =
        visaType === 'All Visa Types' || c.type === visaType
      return matchesSearch && matchesType
    })
  }, [search, visaType])

  return (
    <div className="atlys">
      <header className="site-header">
        <div className="site-header__inner">
          <a href="/" className="logo" aria-label="vApplication home">
            vApplication
          </a>

          <nav className="header-tabs" aria-label="Main">
            <button
              type="button"
              className={`header-tabs__item ${activeTab === 'explore' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('explore')}
            >
              <ExploreIcon />
              Explore
            </button>
            <span className="header-tabs__divider" aria-hidden />
            <button
              type="button"
              className={`header-tabs__item ${activeTab === 'events' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('events')}
            >
              <EventsIcon />
              Events
            </button>
          </nav>

          <button type="button" className="locale-picker" aria-label="United Arab Emirates">
            <img src={flagUrl('ae')} alt="" width={24} height={16} />
            <span>AE</span>
            <ChevronIcon />
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero__badge">
            <span className="hero__badge-dot" aria-hidden />
            Visas On Time&nbsp;&nbsp;Guaranteed
          </div>
          <h1 className="hero__title">
            Apply for Visas Online to 120+ Countries — Guaranteed On-Time Delivery
          </h1>
        </section>

        <section className="toolbar">
          <nav className="toolbar-tabs" aria-label="Section">
            <button
              type="button"
              className={`toolbar-tabs__item ${activeTab === 'explore' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('explore')}
            >
              <ExploreIcon />
              Explore
            </button>
            <span className="toolbar-tabs__divider" aria-hidden />
            <button
              type="button"
              className={`toolbar-tabs__item ${activeTab === 'events' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('events')}
            >
              <EventsIcon />
              Events
            </button>
          </nav>

          <div className="filters">
            <FilterChip label="Visa delivery:" value="Any Time" />
            <FilterChip
              label="Type:"
              value={visaType}
              options={[...visaTypeOptions]}
              onChange={(v) => setVisaType(v as (typeof visaTypeOptions)[number])}
            />
            <FilterChip label="Documents:" value="Any Documents" />
            <FilterChip label="Holidays:" value="Select Dates" />
          </div>

          <div className="search-wrap">
            <SearchIcon />
            <input
              type="search"
              className="search-input"
              placeholder="Search Country"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search country"
            />
          </div>
        </section>

        <section className="country-grid-section" aria-label="Destinations">
          <div className="country-grid">
            {filtered.map((country) => (
              <CountryCard key={country.code + country.name} country={country} />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="empty-state">No countries match your search.</p>
          )}
        </section>

        <section className="promo">
          <p>
            vApplication helps you plan, apply, and track visas seamlessly across the world.
          </p>
          <button type="button" className="promo__ai">
            Ask AI about vApplication
          </button>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-footer__grid">
          <div>
            <h4>Company</h4>
            <ul>
              <li><a href="#careers">Careers</a></li>
              <li><a href="#newsroom">Newsroom</a></li>
              <li><a href="#contact">Contact</a></li>
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
              <li><a href="#schengen">Schengen Visa</a></li>
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

      <nav className="mobile-nav" aria-label="Mobile">
        <a href="/" className="mobile-nav__item is-active">
          <HomeIcon />
          Home
        </a>
        <a href="#profile" className="mobile-nav__item">
          <ProfileIcon />
          My Profile
        </a>
      </nav>
    </div>
  )
}

function FilterChip({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options?: string[]
  onChange?: (value: string) => void
}) {
  if (options && onChange) {
    return (
      <label className="filter-chip">
        <span className="filter-chip__label">{label}</span>
        <select
          className="filter-chip__select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronIcon />
      </label>
    )
  }

  return (
    <button type="button" className="filter-chip">
      <span className="filter-chip__label">{label}</span>
      <span className="filter-chip__value">{value}</span>
      <ChevronIcon />
    </button>
  )
}

function ExploreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function EventsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 3v4M16 3v4M4 10h16" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default App
