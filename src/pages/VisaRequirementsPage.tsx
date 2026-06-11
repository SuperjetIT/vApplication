import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { SiteFooter } from '../components/SiteFooter'
import { useAuth } from '../context/AuthContext'
import { useCitizenship } from '../context/CitizenshipContext'
import { ALL_CITIZENSHIPS, getPopularCitizenships } from '../data/citizenships'
import { countries } from '../data/countries'
import {
  buildFaqs,
  getDestinationTableRows,
  getRequirementDestinations,
  getVisaRequirement,
  normalizeDestinationSlug,
  type VisaPurpose,
  type VisaRequirementResult,
} from '../data/visaRequirements'
import { flagUrl } from '../utils/flags'

const BRAND = '#f93e42'
const ACCENT = '#5057ea'

const STATS = [
  { value: '200+', label: 'Countries covered' },
  { value: 'Daily', label: 'Refreshed from official sources' },
  { value: 'Free', label: 'No signup, no card' },
  { value: '5 sec', label: 'Answer time' },
]

const VISA_RULE_TYPES = [
  {
    title: 'Visa-free',
    subtitle: 'Show your passport. Walk in.',
    apply: 'No application',
    processing: 'Instant at border',
    fee: 'Free',
    where: 'No paperwork',
    examples: 'Schengen for US/UK/JP passports, Singapore for Indians',
    color: '#22c55e',
  },
  {
    title: 'Visa on arrival',
    subtitle: 'Get the visa at the airport or border.',
    apply: 'No advance application',
    processing: 'Same day',
    fee: '$25 – $100',
    where: 'Airport / land border',
    examples: 'Thailand, Indonesia, Egypt, Cambodia',
    color: '#3b82f6',
  },
  {
    title: 'e-Visa',
    subtitle: 'Apply online before you go.',
    apply: 'Online, 1 – 7 days ahead',
    processing: '1 – 7 days',
    fee: '$20 – $160',
    where: 'Government portal',
    examples: 'India, Turkey, Kenya, Sri Lanka, Vietnam',
    color: BRAND,
  },
  {
    title: 'Embassy visa',
    subtitle: 'Full application, in-person interview likely.',
    apply: '2 – 8 weeks ahead',
    processing: '2 – 8 weeks',
    fee: '$80 – $250+',
    where: 'Consulate / VFS centre',
    examples: 'USA, UK, Schengen, Canada, Australia',
    color: ACCENT,
  },
]

const TRENDING = [
  { slug: 'japan', label: 'Japan', type: 'e-Visa' },
  { slug: 'thailand', label: 'Thailand', type: 'VOA' },
  { slug: 'singapore', label: 'Singapore', type: 'Visa-free' },
  { slug: 'dubai-visa', label: 'United Arab Emirates', type: 'e-Visa' },
  { slug: 'united-states', label: 'United States', type: 'Embassy visa' },
  { slug: 'uk', label: 'United Kingdom', type: 'Embassy visa' },
  { slug: 'india', label: 'India', type: 'e-Visa' },
  { slug: 'indonesia', label: 'Indonesia', type: 'VOA' },
  { slug: 'vietnam', label: 'Vietnam', type: 'e-Visa' },
  { slug: 'australia', label: 'Australia', type: 'Embassy visa' },
  { slug: 'france', label: 'France', type: 'Embassy visa' },
  { slug: 'canada', label: 'Canada', type: 'Embassy visa' },
]

const MISTAKES = [
  {
    title: 'Passport expires within six months',
    body: 'Most destinations require at least six months of remaining passport validity from the day you enter. Check your expiry first — renewals can take weeks.',
  },
  {
    title: 'Forgetting the transit visa',
    body: 'A short layover can still need a transit visa — especially in the UK, US, China, and Schengen. Long airport waits or changing terminals often counts as entry.',
  },
  {
    title: 'Confusing residence with nationality',
    body: 'Some destinations grant visa-on-arrival or e-visa based on where you live, not the passport you hold. Set both fields above to avoid a wrong answer.',
  },
  {
    title: 'Wrong photo specs',
    body: 'Visa photo rules vary by country — background colour, ear visibility, glasses, head coverage. A rejected photo means a re-shot and a delayed application.',
  },
]

function ShieldBadge() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px',
        borderRadius: 40,
        background: '#fff8f8',
        border: '1px solid rgba(249,62,66,0.2)',
        color: BRAND,
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      On Time Guaranteed
    </span>
  )
}

function ResultBanner({ result }: { result: VisaRequirementResult }) {
  const needed = result.visaNeeded
  return (
    <div
      style={{
        marginTop: 24,
        padding: 24,
        borderRadius: 20,
        background: needed
          ? 'linear-gradient(135deg, #fff8f8, #fff)'
          : 'linear-gradient(135deg, #f0fdf4, #fff)',
        border: `1.5px solid ${needed ? 'rgba(249,62,66,0.2)' : 'rgba(34,197,94,0.25)'}`,
      }}
    >
      <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#888', textTransform: 'uppercase' }}>
        Your result
      </p>
      <h3 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 800, color: '#111' }}>
        {needed ? `Yes — visa required for ${result.destinationName}` : `No visa needed for ${result.destinationName}`}
      </h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 14, color: '#555' }}>
        <span>
          <strong>Type:</strong> {result.type}
        </span>
        <span>
          <strong>Max stay:</strong> {result.maxStay}
        </span>
        <span>
          <strong>Processing:</strong> {result.processing}
        </span>
      </div>
      {needed && (
        <Link
          to={`/visa/${result.destinationSlug === 'uae' ? 'uae' : result.destinationSlug}`}
          style={{
            display: 'inline-block',
            marginTop: 16,
            padding: '12px 24px',
            borderRadius: 40,
            background: BRAND,
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            textDecoration: 'none',
          }}
        >
          Start application →
        </Link>
      )}
    </div>
  )
}

export default function VisaRequirementsPage() {
  const { destinationSlug: routeSlug } = useParams<{ destinationSlug?: string }>()
  const navigate = useNavigate()
  const { isLoggedIn, avatarInitials, avatarColor } = useAuth()
  const { countryCode, openCitizenshipModal } = useCitizenship()
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [activeTab, setActiveTab] = useState<'explore' | 'events'>('explore')
  const [purpose, setPurpose] = useState<VisaPurpose>('tourism')
  const [passportCode, setPassportCode] = useState(countryCode || 'in')
  const [destinationSlug, setDestinationSlug] = useState(() => normalizeDestinationSlug(routeSlug))
  const [checked, setChecked] = useState(false)
  const [result, setResult] = useState<VisaRequirementResult | null>(null)

  const destinations = useMemo(() => getRequirementDestinations(), [])
  const destination = destinations.find((d) => d.slug === destinationSlug) ?? destinations.find((d) => d.slug === 'uae')!
  const tableRows = useMemo(
    () => getDestinationTableRows(destinationSlug, purpose),
    [destinationSlug, purpose],
  )
  const faqs = useMemo(() => buildFaqs(destination.name, destinationSlug), [destination.name, destinationSlug])

  const visaFreeCount = tableRows.filter((r) => !r.visaNeeded).length

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    setDestinationSlug(normalizeDestinationSlug(routeSlug))
    setChecked(false)
    setResult(null)
  }, [routeSlug])

  useEffect(() => {
    if (countryCode) setPassportCode(countryCode)
  }, [countryCode])

  const handleCheck = () => {
    const r = getVisaRequirement(passportCode, destinationSlug, purpose)
    setResult(r)
    setChecked(true)
  }

  const handleDestinationChange = (slug: string) => {
    setDestinationSlug(slug)
    setChecked(false)
    setResult(null)
    const dest = destinations.find((d) => d.slug === slug)
    const pathSlug = dest?.routeSlug ?? slug
    navigate(`/tools/visa-requirements/${pathSlug}`, { replace: true })
  }

  const sectionPad = isMobile ? '0 16px' : '0 32px'
  const maxW = 1100

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #fff8f8 0%, #fff 40%, #f8f8ff 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobile={isMobile}
        isLoggedIn={isLoggedIn}
        avatarInitials={avatarInitials}
        avatarColor={avatarColor}
      />

      {/* Hero + Tool */}
      <section style={{ padding: isMobile ? '32px 16px 40px' : '48px 32px 56px', textAlign: 'center' }}>
        <div style={{ maxWidth: maxW, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
            <ShieldBadge />
            <span style={{ fontSize: 13, color: '#888', alignSelf: 'center' }}>
              Visa checker · 200+ countries · Updated daily
            </span>
          </div>

          <h1
            style={{
              margin: '0 0 16px',
              fontSize: isMobile ? '1.75rem' : 'clamp(2rem, 4vw, 2.75rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#111',
              lineHeight: 1.15,
            }}
          >
            Do I need a visa for {destination.name}?
          </h1>
          <p
            style={{
              margin: '0 auto 28px',
              maxWidth: 640,
              fontSize: isMobile ? 15 : 17,
              lineHeight: 1.65,
              color: '#666',
            }}
          >
            Tell us which passport you hold — we&apos;ll show whether you need a visa, what type, how long it
            takes, and what it costs. Updated daily from official immigration sources.
          </p>

          <ul
            style={{
              listStyle: 'none',
              margin: '0 0 32px',
              padding: 0,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: isMobile ? 16 : 32,
            }}
          >
            {STATS.map((s) => (
              <li key={s.label} style={{ textAlign: 'center' }}>
                <strong style={{ display: 'block', fontSize: 18, color: BRAND }}>{s.value}</strong>
                <span style={{ fontSize: 12, color: '#888' }}>{s.label}</span>
              </li>
            ))}
          </ul>

          {/* Steps */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 28,
              fontSize: 13,
              color: '#888',
            }}
          >
            {['1 Pick passport', '2 Pick destination', '3 See requirement'].map((step, i) => (
              <span key={step}>
                {i > 0 && <span style={{ margin: '0 8px', color: '#ddd' }}>·</span>}
                <span style={{ fontWeight: i === 2 && checked ? 700 : 500, color: i === 2 && checked ? BRAND : undefined }}>
                  {step}
                </span>
              </span>
            ))}
          </div>

          {/* Tool card */}
          <div
            style={{
              maxWidth: 720,
              margin: '0 auto',
              padding: isMobile ? 20 : 28,
              background: '#fff',
              borderRadius: 24,
              border: '1px solid rgba(249,62,66,0.1)',
              boxShadow: '0 12px 48px rgba(249,62,66,0.08)',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {(['tourism', 'business'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setPurpose(p)
                    setChecked(false)
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: 12,
                    border: purpose === p ? `2px solid ${BRAND}` : '1px solid #eee',
                    background: purpose === p ? '#fff8f8' : '#fafafa',
                    color: purpose === p ? BRAND : '#666',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    fontFamily: 'inherit',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            <label style={{ display: 'block', marginBottom: 16 }}>
              <span style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#444' }}>
                Passport nationality
              </span>
              <select
                value={passportCode}
                onChange={(e) => {
                  setPassportCode(e.target.value)
                  setChecked(false)
                }}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: '1px solid #e5e5e5',
                  fontSize: 15,
                  background: '#fafafa',
                  fontFamily: 'inherit',
                }}
              >
                <optgroup label="Popular">
                  {getPopularCitizenships().map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="All passports">
                  {ALL_CITIZENSHIPS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>

            <label style={{ display: 'block', marginBottom: 20 }}>
              <span style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#444' }}>
                Destination
              </span>
              <select
                value={destinationSlug}
                onChange={(e) => handleDestinationChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: '1px solid #e5e5e5',
                  fontSize: 15,
                  background: '#fafafa',
                  fontFamily: 'inherit',
                }}
              >
                {destinations.map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={handleCheck}
              style={{
                width: '100%',
                padding: 16,
                borderRadius: 14,
                border: 'none',
                background: `linear-gradient(135deg, ${BRAND}, #ff6b6b)`,
                color: '#fff',
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
                boxShadow: '0 8px 28px rgba(249,62,66,0.3)',
                fontFamily: 'inherit',
              }}
            >
              Check Requirements
            </button>

            <button
              type="button"
              onClick={openCitizenshipModal}
              style={{
                marginTop: 14,
                border: 'none',
                background: 'none',
                color: ACCENT,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
                fontFamily: 'inherit',
                padding: 0,
              }}
            >
              Residence different from your nationality?
            </button>

            {checked && result && <ResultBanner result={result} />}
          </div>
        </div>
      </section>

      {/* Requirements table */}
      <section style={{ padding: `0 ${sectionPad} 56px` }}>
        <div style={{ maxWidth: maxW, margin: '0 auto' }}>
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: BRAND, textTransform: 'uppercase' }}>
            Requirements at a glance
          </p>
          <h2 style={{ margin: '0 0 12px', fontSize: isMobile ? 22 : 26, fontWeight: 800, color: '#111' }}>
            {destination.name} visa requirements by passport
          </h2>
          <p style={{ margin: '0 0 24px', fontSize: 15, lineHeight: 1.65, color: '#666', maxWidth: 720 }}>
            Visa requirements for {destination.name} vary by passport. Of the 20 most-searched passports below,{' '}
            {visaFreeCount} can enter {destination.name} without a visa; others need an e-visa, visa on arrival,
            or embassy application. Use the tool above to confirm your exact path.
          </p>

          {!isMobile ? (
            <div
              style={{
                overflow: 'hidden',
                borderRadius: 16,
                border: '1px solid #eee',
                background: '#fff',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#fafafa', borderBottom: '1px solid #eee' }}>
                    {['Passport', 'Visa needed', 'Type', 'Max stay', 'Processing'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '14px 16px',
                          textAlign: 'left',
                          fontWeight: 700,
                          color: '#444',
                          fontSize: 13,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row) => (
                    <tr key={row.passportCode} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src={flagUrl(row.passportCode, 40)} alt="" width={24} height={16} style={{ borderRadius: 2 }} />
                          {row.passportName}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: row.visaNeeded ? BRAND : '#22c55e' }}>
                        {row.visaNeeded ? 'Yes' : 'No'}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#555' }}>{row.type}</td>
                      <td style={{ padding: '14px 16px', color: '#555' }}>{row.maxStay}</td>
                      <td style={{ padding: '14px 16px', color: '#555' }}>{row.processing}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tableRows.map((row) => (
                <div
                  key={row.passportCode}
                  style={{
                    padding: 16,
                    borderRadius: 14,
                    background: '#fff',
                    border: '1px solid #eee',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <img src={flagUrl(row.passportCode, 40)} alt="" width={24} height={16} />
                    <strong style={{ fontSize: 15 }}>{row.passportName}</strong>
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: 12,
                        fontWeight: 700,
                        color: row.visaNeeded ? BRAND : '#22c55e',
                      }}
                    >
                      {row.visaNeeded ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
                    {row.type} · {row.maxStay} · {row.processing}
                  </p>
                </div>
              ))}
            </div>
          )}

          <p style={{ margin: '20px 0 0', fontSize: 13, color: '#888', lineHeight: 1.6 }}>
            Outcomes shown for {purpose}, short-stay. For other purposes (work, study, long-stay), requirements
            differ — check directly with {destination.name}&apos;s consulate.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: `48px ${sectionPad}`, background: '#fff', borderTop: '1px solid #f0f0f0' }}>
        <div style={{ maxWidth: maxW, margin: '0 auto' }}>
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: BRAND }}>Answers</p>
          <h2 style={{ margin: '0 0 28px', fontSize: isMobile ? 22 : 26, fontWeight: 800, color: '#111' }}>
            {destination.name} visa — frequently asked
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {faqs.map((f) => (
              <article key={f.q}>
                <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#111' }}>{f.q}</h3>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: '#666' }}>{f.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Four visa rule types */}
      <section style={{ padding: `56px ${sectionPad}` }}>
        <div style={{ maxWidth: maxW, margin: '0 auto' }}>
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#888' }}>01 — Entry rules</p>
          <h2 style={{ margin: '0 0 8px', fontSize: isMobile ? 22 : 26, fontWeight: 800, color: '#111' }}>
            The four kinds of visa rules
          </h2>
          <p style={{ margin: '0 0 28px', fontSize: 15, color: '#666', maxWidth: 640 }}>
            Two travellers on the same flight can face completely different requirements. Every destination treats
            your passport as one of these four.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: 16,
            }}
          >
            {VISA_RULE_TYPES.map((rule) => (
              <article
                key={rule.title}
                style={{
                  padding: 24,
                  borderRadius: 20,
                  background: '#fff',
                  border: '1px solid #eee',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                }}
              >
                <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: rule.color }}>
                  {rule.title}
                </h3>
                <p style={{ margin: '0 0 16px', fontSize: 14, color: '#666' }}>{rule.subtitle}</p>
                <dl style={{ margin: 0, fontSize: 13, display: 'grid', gap: 8 }}>
                  {[
                    ['Apply', rule.apply],
                    ['Processing', rule.processing],
                    ['Typical fee', rule.fee],
                    ['Where', rule.where],
                  ].map(([dt, dd]) => (
                    <div key={dt} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 8 }}>
                      <dt style={{ margin: 0, color: '#999', fontWeight: 600 }}>{dt}</dt>
                      <dd style={{ margin: 0, color: '#444' }}>{dd}</dd>
                    </div>
                  ))}
                </dl>
                <p style={{ margin: '14px 0 0', fontSize: 12, color: '#888' }}>
                  <strong>Examples:</strong> {rule.examples}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Trending */}
      <section style={{ padding: `0 ${sectionPad} 56px` }}>
        <div style={{ maxWidth: maxW, margin: '0 auto' }}>
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#888' }}>02 — Trending</p>
          <h2 style={{ margin: '0 0 20px', fontSize: isMobile ? 22 : 26, fontWeight: 800, color: '#111' }}>
            Popular this week
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
              gap: 12,
            }}
          >
            {TRENDING.map((t) => (
              <Link
                key={t.slug}
                to={`/tools/visa-requirements/${t.slug}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: 14,
                  background: '#fff',
                  border: '1px solid #eee',
                  textDecoration: 'none',
                  color: '#111',
                  fontSize: 14,
                  fontWeight: 600,
                  transition: 'border-color 0.2s',
                }}
              >
                <span>{t.label}</span>
                <span style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>{t.type} →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Common mistakes */}
      <section style={{ padding: `48px ${sectionPad}`, background: '#fff', borderTop: '1px solid #f0f0f0' }}>
        <div style={{ maxWidth: maxW, margin: '0 auto' }}>
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#888' }}>05 — Avoid these</p>
          <h2 style={{ margin: '0 0 24px', fontSize: isMobile ? 22 : 26, fontWeight: 800, color: '#111' }}>
            Common mistakes that delay travel
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 16 }}>
            {MISTAKES.map((m) => (
              <article
                key={m.title}
                style={{
                  padding: 20,
                  borderRadius: 16,
                  background: '#fafafa',
                  border: '1px solid #eee',
                }}
              >
                <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#111' }}>{m.title}</h3>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#666' }}>{m.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by country */}
      <section style={{ padding: `56px ${sectionPad} 64px` }}>
        <div style={{ maxWidth: maxW, margin: '0 auto' }}>
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#888' }}>08 — Directory</p>
          <h2 style={{ margin: '0 0 20px', fontSize: isMobile ? 22 : 26, fontWeight: 800, color: '#111' }}>
            Browse by country
          </h2>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            {countries.map((c) => (
              <Link
                key={c.slug}
                to={`/tools/visa-requirements/${c.slug === 'uae' ? 'dubai-visa' : c.slug}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 40,
                  background: '#fff',
                  border: '1px solid #eee',
                  textDecoration: 'none',
                  color: '#444',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                <img src={flagUrl(c.countryCode, 40)} alt="" width={20} height={14} style={{ borderRadius: 2 }} />
                {c.name}
              </Link>
            ))}
          </div>
          <p style={{ margin: '32px 0 0', fontSize: 13, color: '#aaa', lineHeight: 1.6 }}>
            Data aggregated from official immigration authorities, airline verification systems, and consular
            notices. For high-stakes trips, cross-check with the destination&apos;s consular site within a week of
            departure. Last updated June 2026 by the Superjet Global Research Team.
          </p>
        </div>
      </section>

      <SiteFooter isMobile={isMobile} />
    </div>
  )
}
