import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { SiteFooter } from '../components/SiteFooter'
import { useAuth } from '../context/AuthContext'
import { useCitizenship } from '../context/CitizenshipContext'
import { ALL_CITIZENSHIPS, getPopularCitizenships } from '../data/citizenships'
import { countries } from '../data/countries'

const BRAND = '#f93e42'
const ACCENT = '#5057ea'
const WHATSAPP = '971559641020'

const UAE_VISA_TYPES = [
  'UAE Resident (Employment)',
  'UAE Resident (Golden / Investor)',
  'UAE Visit / Tourist Visa',
  'UAE Student Visa',
  'No UAE visa / Outside UAE',
  'Other',
] as const

const TRAVEL_PURPOSES = [
  'Tourism',
  'Business',
  'Family visit',
  'Medical',
  'Transit',
  'Study',
  'Other',
] as const

const TRAVELER_TYPES = ['Individual', 'Family / Group'] as const

const labelStyle: CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontSize: 13,
  fontWeight: 600,
  color: '#444',
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 12,
  border: '1px solid #e5e5e5',
  fontSize: 15,
  background: '#fafafa',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const fieldWrap: CSSProperties = { marginBottom: 16 }

function CheckCircleIcon() {
  return (
    <svg width={56} height={56} viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="32" cy="32" r="28" fill="rgba(249,62,66,0.1)" />
      <path
        d="M22 32l8 8 14-14"
        stroke={BRAND}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function VisaCheckerPage() {
  const { isLoggedIn, avatarInitials, avatarColor, user } = useAuth()
  const { countryCode } = useCitizenship()
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState('')
  const [nationality, setNationality] = useState(countryCode || 'in')
  const [residence, setResidence] = useState('ae')
  const [uaeVisaType, setUaeVisaType] = useState<string>(UAE_VISA_TYPES[0])
  const [destination, setDestination] = useState('united-states')
  const [travelPurpose, setTravelPurpose] = useState<string>(TRAVEL_PURPOSES[0])
  const [travelDate, setTravelDate] = useState('')
  const [travelerType, setTravelerType] = useState<string>(TRAVELER_TYPES[0])
  const [previousRejection, setPreviousRejection] = useState<'yes' | 'no'>('no')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    if (countryCode) setNationality(countryCode)
  }, [countryCode])

  useEffect(() => {
    if (user?.email) setEmail(user.email)
    if (user?.fullName) setFullName(user.fullName)
  }, [user])

  const nationalityName = ALL_CITIZENSHIPS.find((c) => c.code === nationality)?.name ?? nationality
  const residenceName = ALL_CITIZENSHIPS.find((c) => c.code === residence)?.name ?? residence
  const destinationName = countries.find((c) => c.slug === destination)?.name ?? destination

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/visa-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          nationality,
          nationalityName,
          residence,
          residenceName,
          uaeVisaType,
          destination,
          destinationName,
          travelPurpose,
          travelDate,
          travelerType,
          previousRejection,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Could not submit your check. Please try again.')
        return
      }
      setSubmitted(true)
    } catch {
      setError('Could not reach the server. Run npm run dev and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const pad = isMobile ? '0 16px' : '0 32px'

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #fff8f8 0%, #fff 45%, #f8f8ff 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <Navbar
        activeTab="explore"
        setActiveTab={() => {}}
        isMobile={isMobile}
        isLoggedIn={isLoggedIn}
        avatarInitials={avatarInitials}
        avatarColor={avatarColor}
        showEvents={false}
      />

      <header
        style={{
          textAlign: 'center',
          padding: isMobile ? '32px 16px 24px' : '48px 32px 32px',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            marginBottom: 12,
            padding: '6px 14px',
            borderRadius: 40,
            background: '#fff8f8',
            border: '1px solid rgba(249,62,66,0.2)',
            color: BRAND,
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Pre-check · Not legal advice
        </span>
        <h1
          style={{
            margin: '0 0 12px',
            fontSize: isMobile ? '1.75rem' : 'clamp(2rem, 4vw, 2.5rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#111',
          }}
        >
          Visa Checker
        </h1>
        <p
          style={{
            margin: '0 auto',
            maxWidth: 560,
            fontSize: isMobile ? 15 : 17,
            lineHeight: 1.65,
            color: '#666',
          }}
        >
          Tell us about your trip. Our team will review your details and send the correct document
          checklist — no automated legal decisions in this version.
        </p>
      </header>

      <main style={{ padding: `${isMobile ? 0 : 8}px ${pad} 64px` }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {submitted ? (
            <div
              style={{
                padding: isMobile ? 28 : 40,
                borderRadius: 24,
                background: '#fff',
                border: '1px solid rgba(249,62,66,0.12)',
                boxShadow: '0 12px 48px rgba(249,62,66,0.08)',
                textAlign: 'center',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <CheckCircleIcon />
              </div>
              <h2 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 800, color: '#111' }}>
                You may require a visa.
              </h2>
              <p
                style={{
                  margin: '0 0 8px',
                  fontSize: 16,
                  lineHeight: 1.65,
                  color: '#555',
                  maxWidth: 480,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              >
                Our team will review your case and send the correct checklist to{' '}
                <strong style={{ color: '#111' }}>{email}</strong>.
              </p>
              <p style={{ margin: '0 0 28px', fontSize: 13, color: '#999', lineHeight: 1.6 }}>
                This is a preliminary pre-check only — not final immigration advice. A visa specialist
                will confirm requirements based on your nationality, UAE status, and destination.
              </p>

              <div
                style={{
                  textAlign: 'left',
                  padding: 20,
                  borderRadius: 16,
                  background: '#fafafa',
                  border: '1px solid #eee',
                  marginBottom: 28,
                  fontSize: 14,
                  color: '#555',
                  lineHeight: 1.8,
                }}
              >
                <strong style={{ color: '#111' }}>Summary submitted</strong>
                <br />
                {nationalityName} passport · Resident in {residenceName}
                <br />
                {uaeVisaType} · Traveling to {destinationName}
                <br />
                {travelPurpose} · {travelerType} · {travelDate || 'Date TBC'}
                <br />
                Previous rejection: {previousRejection === 'yes' ? 'Yes' : 'No'}
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 12,
                  justifyContent: 'center',
                }}
              >
                <a
                  href={`https://wa.me/${WHATSAPP}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '14px 24px',
                    borderRadius: 12,
                    background: BRAND,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 15,
                    textDecoration: 'none',
                  }}
                >
                  Chat on WhatsApp
                </a>
                <Link
                  to="/"
                  style={{
                    padding: '14px 24px',
                    borderRadius: 12,
                    border: '1.5px solid #ddd',
                    background: '#fff',
                    color: '#333',
                    fontWeight: 700,
                    fontSize: 15,
                    textDecoration: 'none',
                  }}
                >
                  Back to home
                </Link>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{
                padding: isMobile ? 24 : 36,
                borderRadius: 24,
                background: '#fff',
                border: '1px solid rgba(249,62,66,0.1)',
                boxShadow: '0 12px 48px rgba(249,62,66,0.06)',
              }}
            >
              <p
                style={{
                  margin: '0 0 24px',
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: '#f8f8ff',
                  border: '1px solid rgba(80,87,234,0.15)',
                  fontSize: 13,
                  color: ACCENT,
                  lineHeight: 1.5,
                }}
              >
                Version 1 captures your details for expert review. We do not issue automatic visa
                decisions or legal advice on this page.
              </p>

              <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700, color: '#111' }}>
                Your contact details
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: 16,
                }}
              >
                <div style={fieldWrap}>
                  <label style={labelStyle}>
                    Full name <span style={{ color: BRAND }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    style={inputStyle}
                  />
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>
                    Email <span style={{ color: BRAND }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Phone / WhatsApp</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+971 50 000 0000"
                  style={inputStyle}
                />
              </div>

              <h2
                style={{
                  margin: '32px 0 16px',
                  paddingTop: 24,
                  borderTop: '1px solid #f0f0f0',
                  fontSize: 17,
                  fontWeight: 700,
                  color: '#111',
                }}
              >
                Trip & visa details
              </h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: 16,
                }}
              >
                <div style={fieldWrap}>
                  <label style={labelStyle}>
                    Nationality (passport) <span style={{ color: BRAND }}>*</span>
                  </label>
                  <select
                    required
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    style={inputStyle}
                  >
                    <optgroup label="Popular">
                      {getPopularCitizenships().map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="All">
                      {ALL_CITIZENSHIPS.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>
                    Current residence country <span style={{ color: BRAND }}>*</span>
                  </label>
                  <select
                    required
                    value={residence}
                    onChange={(e) => setResidence(e.target.value)}
                    style={inputStyle}
                  >
                    {ALL_CITIZENSHIPS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>
                  UAE visa type <span style={{ color: BRAND }}>*</span>
                </label>
                <select
                  required
                  value={uaeVisaType}
                  onChange={(e) => setUaeVisaType(e.target.value)}
                  style={inputStyle}
                >
                  {UAE_VISA_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: 16,
                }}
              >
                <div style={fieldWrap}>
                  <label style={labelStyle}>
                    Destination country <span style={{ color: BRAND }}>*</span>
                  </label>
                  <select
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    style={inputStyle}
                  >
                    {countries.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>
                    Travel purpose <span style={{ color: BRAND }}>*</span>
                  </label>
                  <select
                    required
                    value={travelPurpose}
                    onChange={(e) => setTravelPurpose(e.target.value)}
                    style={inputStyle}
                  >
                    {TRAVEL_PURPOSES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: 16,
                }}
              >
                <div style={fieldWrap}>
                  <label style={labelStyle}>
                    Planned travel date <span style={{ color: BRAND }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={travelDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setTravelDate(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>
                    Traveling as <span style={{ color: BRAND }}>*</span>
                  </label>
                  <select
                    required
                    value={travelerType}
                    onChange={(e) => setTravelerType(e.target.value)}
                    style={inputStyle}
                  >
                    {TRAVELER_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <fieldset style={{ border: 'none', margin: '0 0 24px', padding: 0 }}>
                <legend style={{ ...labelStyle, marginBottom: 10 }}>
                  Previous visa rejection? <span style={{ color: BRAND }}>*</span>
                </legend>
                <div style={{ display: 'flex', gap: 12 }}>
                  {(['no', 'yes'] as const).map((v) => (
                    <label
                      key={v}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        padding: '14px 16px',
                        borderRadius: 12,
                        border: `2px solid ${previousRejection === v ? BRAND : '#e5e5e5'}`,
                        background: previousRejection === v ? '#fff8f8' : '#fafafa',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: 15,
                        color: previousRejection === v ? BRAND : '#555',
                      }}
                    >
                      <input
                        type="radio"
                        name="previousRejection"
                        value={v}
                        checked={previousRejection === v}
                        onChange={() => setPreviousRejection(v)}
                        style={{ accentColor: BRAND }}
                      />
                      {v === 'yes' ? 'Yes' : 'No'}
                    </label>
                  ))}
                </div>
              </fieldset>

              {error && (
                <p
                  role="alert"
                  style={{
                    margin: '0 0 16px',
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    fontSize: 14,
                  }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: 16,
                  borderRadius: 14,
                  border: 'none',
                  background: submitting ? '#fca5a5' : `linear-gradient(135deg, ${BRAND}, #ff6b6b)`,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: submitting ? 'wait' : 'pointer',
                  boxShadow: '0 8px 28px rgba(249,62,66,0.25)',
                  fontFamily: 'inherit',
                }}
              >
                {submitting ? 'Submitting…' : 'Submit for review →'}
              </button>
            </form>
          )}
        </div>
      </main>

      <SiteFooter isMobile={isMobile} />
    </div>
  )
}
