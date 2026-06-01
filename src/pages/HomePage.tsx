import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { countries, type Country } from '../data/countries'
import { SiteLayout, PromoSection } from '../components/SiteLayout'
import { ChevronIcon, EventsIcon, ExploreIcon, SearchIcon } from '../components/icons'
import { flagUrl } from '../utils/flags'
import './HomePage.css'

const visaTypeOptions = ['All Visa Types', 'e-Visa', 'Sticker', 'No Visa Required'] as const

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

export default function HomePage() {
  const [search, setSearch] = useState('')
  const [visaType, setVisaType] = useState<(typeof visaTypeOptions)[number]>('All Visa Types')
  const [activeTab, setActiveTab] = useState<'explore' | 'events'>('explore')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return countries.filter((c) => {
      const matchesSearch = !q || c.name.toLowerCase().includes(q)
      const matchesType = visaType === 'All Visa Types' || c.type === visaType
      return matchesSearch && matchesType
    })
  }, [search, visaType])

  return (
    <SiteLayout>
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

        <section className="home-guide-banner">
          <Link to="/visa/schengen" className="home-guide-banner__link">
            <span className="home-guide-banner__flags" aria-hidden>🇪🇺</span>
            <div>
              <strong>Schengen Visa</strong>
              <p>Get your Schengen visa easily — explore all 29 countries</p>
            </div>
            <span className="home-guide-banner__arrow">→</span>
          </Link>
        </section>

        <PromoSection />
      </main>
    </SiteLayout>
  )
}
