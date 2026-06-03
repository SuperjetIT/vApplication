import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCountry } from '../data/countries'
import { SiteLayout } from '../components/SiteLayout'

const TEXT = '#111827'
const TEXT_MUTED = '#6b7280'
const BORDER = '#e5e7eb'
const BG_SOFT = '#f9fafb'
const GREEN = '#059669'
const GREEN_BG = '#ecfdf5'
const MAX_W = 1280
const SERIF = "'Newsreader', Georgia, 'Times New Roman', serif"

export default function VisaPage() {
  const { countrySlug } = useParams<{ countrySlug: string }>()
  const country = countrySlug ? getCountry(countrySlug) : undefined
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 600)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const pagePadding = isMobile ? '24px' : '48px'
  const sectionPadding = isMobile ? '40px 24px' : '64px 24px'

  if (!country) {
    return (
      <SiteLayout>
        <main
          style={{
            maxWidth: MAX_W,
            margin: '0 auto',
            padding: `${pagePadding} 24px`,
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              margin: '0 0 12px',
              fontFamily: SERIF,
              fontSize: isMobile ? '1.75rem' : '2.5rem',
              fontWeight: 500,
              color: TEXT,
            }}
          >
            Country not found
          </h1>
          <p style={{ margin: '0 0 24px', color: TEXT_MUTED, fontSize: 17, lineHeight: 1.6 }}>
            We couldn&apos;t find visa information for this destination.
          </p>
          <Link
            to="/"
            style={{
              display: 'inline-block',
              padding: '14px 28px',
              borderRadius: 999,
              background: TEXT,
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            ← All countries
          </Link>
        </main>
      </SiteLayout>
    )
  }

  const needsVisa = country.visaType !== 'No Visa Required'

  return (
    <SiteLayout>
      <main style={{ background: '#fff' }}>
        <section style={{ padding: sectionPadding }}>
          <div style={{ maxWidth: MAX_W, margin: '0 auto' }}>
            <Link
              to="/"
              style={{
                display: 'inline-block',
                marginBottom: isMobile ? 24 : 32,
                color: TEXT,
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: 14,
              }}
            >
              ← All countries
            </Link>

            <header
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'center' : 'center',
                textAlign: isMobile ? 'center' : 'left',
                gap: isMobile ? 16 : 20,
                marginBottom: isMobile ? 32 : 40,
              }}
            >
              <img
                src={`https://flagcdn.com/w80/${country.countryCode}.png`}
                alt={`${country.name} flag`}
                width={isMobile ? 64 : 80}
                height={isMobile ? 43 : 54}
                style={{
                  objectFit: 'cover',
                  borderRadius: 8,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                }}
              />
              <div>
                <h1
                  style={{
                    margin: '0 0 10px',
                    fontFamily: SERIF,
                    fontSize: isMobile ? '1.75rem' : 'clamp(2rem, 4vw, 2.75rem)',
                    fontWeight: 500,
                    lineHeight: 1.15,
                    letterSpacing: '-0.02em',
                    color: TEXT,
                  }}
                >
                  {country.name}
                </h1>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '6px 14px',
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 600,
                    background: needsVisa ? 'rgba(17, 24, 39, 0.08)' : GREEN_BG,
                    color: needsVisa ? TEXT : GREEN,
                  }}
                >
                  {country.visaType}
                </span>
              </div>
            </header>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: 12,
                marginBottom: isMobile ? 32 : 40,
              }}
            >
              {[
                { label: 'Validity', value: country.validity },
                { label: 'Processing time', value: country.processingTime },
                { label: 'Fee', value: country.fee },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    padding: 20,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 12,
                    background: '#fff',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontSize: 13,
                      color: TEXT_MUTED,
                      marginBottom: 8,
                    }}
                  >
                    {stat.label}
                  </span>
                  <strong style={{ fontSize: '1.125rem', fontWeight: 600, color: TEXT }}>
                    {stat.value}
                  </strong>
                </div>
              ))}
            </div>

            {country.documents.length > 0 && (
              <section style={{ marginBottom: isMobile ? 32 : 40 }}>
                <h2
                  style={{
                    margin: '0 0 16px',
                    fontFamily: SERIF,
                    fontSize: isMobile ? '1.5rem' : 'clamp(1.75rem, 3vw, 2rem)',
                    fontWeight: 500,
                    letterSpacing: '-0.02em',
                    color: TEXT,
                  }}
                >
                  {country.name} Visa Requirements
                </h2>
                <p style={{ margin: '0 0 24px', fontSize: 17, lineHeight: 1.6, color: TEXT_MUTED }}>
                  Here are the basic documents required:
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: 16,
                  }}
                >
                  {country.documents.map((doc) => (
                    <article
                      key={doc}
                      style={{
                        padding: 24,
                        border: `1px solid ${BORDER}`,
                        borderRadius: 16,
                        background: '#fff',
                      }}
                    >
                      <h3 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 600, color: TEXT }}>
                        {doc}
                      </h3>
                      <p style={{ margin: 0, fontSize: 14, color: TEXT_MUTED, lineHeight: 1.5 }}>
                        Required for your {country.name} visa application.
                      </p>
                    </article>
                  ))}
                </div>
                <p
                  style={{
                    margin: '24px 0 0',
                    fontSize: 14,
                    color: TEXT_MUTED,
                    textAlign: 'center',
                  }}
                >
                  vApplication prepares and verifies all required documents for you.
                </p>
              </section>
            )}

            {needsVisa && (
              <Link
                to="/sign-in"
                style={{
                  display: isMobile ? 'flex' : 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: isMobile ? '100%' : 'auto',
                  gap: 8,
                  padding: '14px 28px',
                  borderRadius: 999,
                  background: TEXT,
                  color: '#fff',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: 15,
                  marginTop: 8,
                  boxSizing: 'border-box',
                }}
              >
                Apply now →
              </Link>
            )}
          </div>
        </section>

        <section style={{ padding: sectionPadding, background: BG_SOFT, borderTop: `1px solid ${BORDER}` }}>
          <div style={{ maxWidth: MAX_W, margin: '0 auto', textAlign: 'center' }}>
            <p
              style={{
                margin: '0 0 20px',
                fontFamily: SERIF,
                fontSize: isMobile ? '1.25rem' : 'clamp(1.25rem, 2.5vw, 1.75rem)',
                lineHeight: 1.35,
                color: TEXT,
              }}
            >
              vApplication helps you plan, apply, and track visas seamlessly across the world.
            </p>
            <button
              type="button"
              style={{
                padding: '12px 24px',
                border: `1px solid ${BORDER}`,
                borderRadius: 999,
                background: '#fff',
                fontWeight: 500,
                cursor: 'pointer',
                fontSize: 15,
              }}
            >
              Ask AI about vApplication
            </button>
          </div>
        </section>
      </main>
    </SiteLayout>
  )
}
