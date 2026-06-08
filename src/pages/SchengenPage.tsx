import { useEffect, useState } from 'react'
import { SiteLayout, PromoSection } from '../components/SiteLayout'
import { CheckIcon, XIcon } from '../components/icons'
import { flagUrl } from '../utils/flags'
import { otherSchengen, popularSchengen } from '../data/schengenCountries'
import './SchengenPage.css'

const sectionNav = [
  { id: 'visa-info', label: 'Visa Info' },
  { id: 'documents', label: 'Documents' },
  { id: 'fees', label: 'Fees' },
  { id: 'why-atlys', label: 'Why Superjet Global' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'countries', label: 'Countries' },
  { id: 'faqs', label: 'FAQs' },
] as const

const heroStats = [
  { title: 'Fastest Appointments', subtitle: 'in the industry' },
  { title: '#1 Trusted By', subtitle: '10 lakh travelers' },
  { title: 'End-To-End', subtitle: 'visa handling' },
]

const travelReasons = [
  'Tourism & holidays in Europe',
  'Visiting family or friends',
  'Business travel and meetings',
  'Attending events or conferences',
]

const requirements = [
  { title: 'Passport', desc: 'Must be valid for next 6 months' },
  { title: 'Visa Photo', desc: 'Crops and edits for you', tag: 'Superjet Global' },
  { title: 'Travel Itinerary', desc: 'Generates', tag: 'Generates' },
  { title: 'Financial Proof', desc: 'Verifies', tag: 'Verifies' },
  { title: 'Application Form', desc: 'Fills', tag: 'Fills' },
  { title: 'Travel Insurance', desc: 'Superjet Global offers the best price', tag: 'Superjet Global' },
]

const withAtlys = [
  'Fastest visa appointment booking',
  '100% document support & verification',
  'All Itineraries included for free - Flight reservations, hotel bookings & cover letters',
  'Real-time status tracking on our app',
  'Dedicated visa experts providing support throughout the process',
]

const diy = [
  'Depends on agent availability and manual coordination',
  'Fill documents yourself. Limited means of verification',
  'Book cancellable flights & hotels on your own. Major loss if rejected',
  'Manual updates shared, only when asked',
  'Coordinate with multiple vendors throughout the process',
]

const validityStats = [
  { label: 'Maximum stay', value: '90 Days' },
  { label: 'Valid Upto', value: '90 Days' },
  { label: 'Access to', value: '29 Countries' },
  { label: 'No. of entries', value: 'Single' },
  { label: 'Processing Time', value: '15-30 working days' },
]

const faqs = [
  {
    q: 'Do UAE residents need a visa for Schengen countries?',
    a: 'Yes. UAE passport holders may have visa-free access to some Schengen states, but most residents need a Schengen visa for short stays up to 90 days.',
  },
  {
    q: 'What are the Schengen visa requirements from UAE?',
    a: 'You typically need a valid passport, photos, travel itinerary, financial proof, application form, and travel insurance. Superjet Global prepares and verifies these for you.',
  },
  {
    q: 'How to apply for a Schengen visa from UAE?',
    a: 'Choose your main destination country, book an appointment, submit documents, and attend your biometrics interview. Superjet Global handles the full process end-to-end.',
  },
]

function SchengenCountryChip({ name, code }: { name: string; code: string }) {
  return (
    <button type="button" className="schengen-chip">
      <img src={flagUrl(code, 40)} alt="" width={28} height={20} loading="lazy" />
      <span>{name}</span>
    </button>
  )
}

export default function SchengenPage() {
  const [activeSection, setActiveSection] = useState<string>('visa-info')
  const [statIndex, setStatIndex] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStatIndex((i) => (i + 1) % heroStats.length)
    }, 3500)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const ids = sectionNav.map((s) => s.id)
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target.id) {
          setActiveSection(visible[0].target.id)
        }
      },
      { rootMargin: '-120px 0px -60% 0px', threshold: [0, 0.25, 0.5] },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <SiteLayout>
      <div className="schengen-page">
        <section className="schengen-hero">
          <div className="schengen-hero__visual" aria-hidden />
          <div className="schengen-hero__content">
            <div className="schengen-hero__badge">
              <span>100%</span>
              Approval, guaranteed
            </div>
            <h1>Get your Schengen visa easily with Superjet Global</h1>
            <div className="schengen-hero__carousel" aria-live="polite">
              <div key={statIndex} className="schengen-hero__stat">
                <strong>{heroStats[statIndex].title}</strong>
                <span>{heroStats[statIndex].subtitle}</span>
              </div>
            </div>
            <a href="#countries" className="schengen-hero__cta" onClick={(e) => { e.preventDefault(); scrollTo('countries') }}>
              Explore all 29 Schengen Countries
            </a>
          </div>
        </section>

        <nav className="schengen-nav" aria-label="Page sections">
          <div className="schengen-nav__inner">
            {sectionNav.map((item) => (
              <button
                key={item.id}
                type="button"
                className={activeSection === item.id ? 'is-active' : ''}
                onClick={() => scrollTo(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        <main className="schengen-main">
          <section id="visa-info" className="schengen-section">
            <div className="schengen-section__inner">
              <p className="schengen-kicker">On Time Guaranteed</p>
              <h2>What is a Schengen visa?</h2>
              <p className="schengen-lead">
                A Schengen visa allows you to travel across <strong>29 European countries</strong> with a
                single visa for short stays of <strong>up to 90 days</strong> within a{' '}
                <strong>180-day period</strong>.
              </p>

              <h3 className="schengen-subtitle">Reasons to travel on a Schengen Visa</h3>
              <ul className="schengen-list">
                {travelReasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <button type="button" className="schengen-outline-btn" onClick={() => scrollTo('countries')}>
                Explore Schengen Destinations
              </button>
            </div>
          </section>

          <section className="schengen-section schengen-section--alt">
            <div className="schengen-section__inner">
              <h2>Schengen Visa Validity, Stay Duration, Processing Time</h2>
              <div className="validity-grid">
                {validityStats.map((s) => (
                  <div key={s.label} className="validity-card">
                    <span className="validity-card__label">{s.label}</span>
                    <strong className="validity-card__value">{s.value}</strong>
                  </div>
                ))}
              </div>
              <p className="schengen-note">
                Get the fastest appointment slots · Avoid incomplete document delays
              </p>
            </div>
          </section>

          <section id="documents" className="schengen-section">
            <div className="schengen-section__inner">
              <h2>Schengen Visa Requirements</h2>
              <p className="schengen-lead">Here are the basic documents required:</p>
              <div className="requirements-grid">
                {requirements.map((doc) => (
                  <article key={doc.title} className="requirement-card">
                    <h3>{doc.title}</h3>
                    <p>
                      {doc.tag && <span className="requirement-card__tag">{doc.tag}</span>}
                      {doc.desc}
                    </p>
                  </article>
                ))}
              </div>
              <p className="schengen-note schengen-note--center">
                Superjet Global prepares and verifies all required documents for you.
              </p>
            </div>
          </section>

          <section id="fees" className="schengen-section schengen-section--alt">
            <div className="schengen-section__inner schengen-section__inner--narrow">
              <h2>
                Schengen Government
                <br />
                Fee Structure
              </h2>
              <p className="schengen-lead">This fee is entirely paid to the embassy</p>
              <div className="fee-cards">
                <div className="fee-card">
                  <span className="fee-card__when">Pay when booking appt.</span>
                  <hr />
                  <h3>Appointment fee</h3>
                  <p className="fee-card__amount">$0</p>
                  <p className="fee-card__note">
                    The fee mentioned here is for France. Check below cards for individual country prices.
                  </p>
                </div>
                <div className="fee-card fee-card--highlight">
                  <span className="fee-card__when">Pay at embassy</span>
                  <hr />
                  <h3>Visa Fee</h3>
                  <p className="fee-card__amount">$105</p>
                  <p className="fee-card__note">
                    Paid in person directly to the embassy official (subject to currency conversion)
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section id="why-atlys" className="schengen-section">
            <div className="schengen-section__inner">
              <h2>Why Apply with Superjet Global?</h2>
              <p className="schengen-lead">
                Superjet Global handles your entire Schengen visa process in one place, end-to-end.
              </p>
              <div className="compare-table">
                <div className="compare-table__head">
                  <span />
                  <span>With Superjet Global</span>
                  <span>Doing it Yourself</span>
                </div>
                {withAtlys.map((item, i) => (
                  <div key={item} className="compare-table__row">
                    <span className="compare-table__index">{i + 1}</span>
                    <span className="compare-table__yes">
                      <CheckIcon />
                      {item}
                    </span>
                    <span className="compare-table__no">
                      <XIcon />
                      {diy[i]}
                    </span>
                  </div>
                ))}
              </div>
              <button type="button" className="schengen-primary-btn">
                Apply with Superjet Global
              </button>
            </div>
          </section>

          <section id="reviews" className="schengen-section schengen-section--alt">
            <div className="schengen-section__inner schengen-section__inner--narrow">
              <h2>What Happens if Your Visa Gets Rejected?</h2>
              <p className="schengen-lead">
                Visa approvals depend on documentation quality and application accuracy.
              </p>
              <div className="guarantee-box">
                <p className="guarantee-box__title">
                  Superjet Global offers a <strong>100% approval guarantee</strong>, or all your money back!
                </p>
                <ul className="schengen-list">
                  <li>Expert guidance ensures error-free applications</li>
                  <li>Expert verification reduces risk of rejection</li>
                  <li>Full support throughout the process</li>
                </ul>
              </div>
            </div>
          </section>

          <section id="countries" className="schengen-section">
            <div className="schengen-section__inner">
              <h2>You can go to all of these Schengen countries</h2>
              <p className="schengen-lead">
                Select your destination to check visa timelines, requirements, and start your application:
              </p>
              <h3 className="schengen-subtitle">Most popular amongst tourists</h3>
              <div className="schengen-chips">
                {popularSchengen.map((c) => (
                  <SchengenCountryChip key={c.code} name={c.name} code={c.code} />
                ))}
              </div>
              <h3 className="schengen-subtitle">All Schengen countries</h3>
              <div className="schengen-chips">
                {otherSchengen.map((c) => (
                  <SchengenCountryChip key={c.code} name={c.name} code={c.code} />
                ))}
              </div>
            </div>
          </section>

          <section className="schengen-cta-section">
            <div className="schengen-cta">
              <h2>Start Your Schengen Visa Application Today</h2>
              <p>Apply in minutes. Everything handled for you.</p>
              <button type="button" className="schengen-primary-btn schengen-primary-btn--light">
                Apply with Superjet Global
              </button>
            </div>
          </section>

          <section id="faqs" className="schengen-section schengen-section--alt">
            <div className="schengen-section__inner schengen-section__inner--narrow">
              <h2>Frequently Asked Questions</h2>
              <p className="schengen-subtitle schengen-subtitle--inline">Denmark</p>
              <div className="faq-list">
                {faqs.map((faq, i) => (
                  <div key={faq.q} className={`faq-item ${openFaq === i ? 'is-open' : ''}`}>
                    <button
                      type="button"
                      className="faq-item__question"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      aria-expanded={openFaq === i}
                    >
                      {faq.q}
                      <span className="faq-item__icon" aria-hidden />
                    </button>
                    {openFaq === i && <p className="faq-item__answer">{faq.a}</p>}
                  </div>
                ))}
              </div>
              <button type="button" className="schengen-outline-btn">
                View More
              </button>
            </div>
          </section>

          <PromoSection />
        </main>

        <div className="schengen-floating-badge" aria-hidden>
          On Time Guaranteed
        </div>
      </div>
    </SiteLayout>
  )
}
