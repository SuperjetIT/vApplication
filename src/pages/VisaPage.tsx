import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { SiteFooter } from '../components/SiteFooter'
import { useAuth } from '../context/AuthContext'
import { useCitizenship } from '../context/CitizenshipContext'
import { countries, getCountry, type Country, type VisaOption } from '../data/countries'
import { flagUrl } from '../utils/flags'
import { getVisaRequirements } from '../utils/visaRequirements'

const BRAND = '#f93e42'
const ACCENT = '#5057ea'
const MAX_W = 1200
const EXPRESS_SURCHARGE = 50

const nearbyBySlug: Record<string, string[]> = {
  singapore: ['malaysia', 'indonesia', 'thailand', 'vietnam'],
  malaysia: ['singapore', 'indonesia', 'thailand', 'vietnam'],
  indonesia: ['malaysia', 'singapore', 'thailand', 'vietnam'],
  thailand: ['malaysia', 'vietnam', 'singapore', 'indonesia'],
  vietnam: ['thailand', 'malaysia', 'singapore', 'indonesia'],
  india: ['thailand', 'malaysia', 'singapore', 'indonesia'],
  uk: ['france', 'canada', 'united-states', 'australia'],
  kenya: ['egypt', 'india', 'thailand', 'malaysia'],
  'united-states': ['canada', 'uk', 'australia', 'brazil'],
  egypt: ['kenya', 'saudi-arabia', 'india', 'thailand'],
  canada: ['united-states', 'uk', 'australia', 'brazil'],
  australia: ['uk', 'canada', 'singapore', 'japan'],
  'saudi-arabia': ['egypt', 'india', 'thailand', 'malaysia'],
  brazil: ['united-states', 'canada', 'australia', 'south-korea'],
  'south-korea': ['japan', 'singapore', 'thailand', 'australia'],
  japan: ['south-korea', 'singapore', 'thailand', 'australia'],
  france: ['uk', 'canada', 'united-states', 'australia'],
}

const REJECTION_REASONS = [
  {
    title: 'Incomplete Documents',
    description: 'Missing or unclear documents are the top rejection reason',
  },
  {
    title: 'Insufficient Bank Balance',
    description: 'Embassy requires minimum balance proof for your trip duration',
  },
  {
    title: 'Wrong Visa Category',
    description: 'Applying for wrong visa type based on travel purpose',
  },
  {
    title: 'Travel History Issues',
    description: 'No prior international travel history can affect approval',
  },
]

const REVIEWS = [
  {
    initials: 'AK',
    name: 'Ahmed K.',
    color: BRAND,
    text: 'Got my visa before the promised date. Smooth process and clear updates throughout.',
  },
  {
    initials: 'SM',
    name: 'Sara M.',
    color: ACCENT,
    text: 'Best visa experience in the UAE. Upload once and they handled the rest perfectly.',
  },
  {
    initials: 'RJ',
    name: 'Ravi J.',
    color: '#22c55e',
    text: 'Transparent pricing and fast support on WhatsApp. Highly recommend for families.',
  },
]

function countryImageUrl(slug: string) {
  return `https://picsum.photos/seed/${slug}/1400/600`
}

function parseFeeAed(fee: string): number {
  const match = fee.match(/(\d+)/)
  return match ? Number.parseInt(match[1], 10) : 0
}

function parseProcessingDaysMax(processingTime: string): number {
  if (processingTime === 'Instant' || processingTime === 'Not applicable') return 0
  const nums = processingTime.match(/\d+/g)?.map((n) => Number.parseInt(n, 10)) ?? [5]
  return nums[nums.length - 1] ?? 5
}

function parseProcessingDaysMin(processingTime: string): number {
  if (processingTime === 'Instant' || processingTime === 'Not applicable') return 0
  const nums = processingTime.match(/\d+/g)?.map((n) => Number.parseInt(n, 10)) ?? [3]
  return nums[0] ?? 3
}

function formatDeliveryDate(daysFromNow: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${date} at ${time}`
}

function getNearby(slug: string): Country[] {
  const slugs = nearbyBySlug[slug]
  if (slugs) {
    return slugs.map((s) => getCountry(s)).filter((c): c is Country => Boolean(c)).slice(0, 4)
  }
  return countries.filter((c) => c.slug !== slug).slice(0, 4)
}

function getEligibilityBadge(
  country: Country,
  passportCountry: string,
  residenceCountry: string,
  residencyStatus: string,
) {
  const req = getVisaRequirements(
    passportCountry,
    residenceCountry,
    residencyStatus,
    country.slug,
  )
  if (!req.required || req.visaType === 'not_required') {
    return { label: '✅ Visa Free Entry', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' }
  }
  if (req.visaType === 'not_eligible') {
    return { label: '❌ Not Eligible', color: '#dc2626', bg: '#fff0f0', border: '#fecaca' }
  }
  return { label: '📋 Visa Required', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' }
}

function getOptionButtonLabel(option: VisaOption, countryName: string): string {
  if (option.id === 'multiple' || option.entry === 'Multiple') {
    return `I want a Multi-entry ${countryName} visa`
  }
  return `I want a ${option.label} for ${countryName}`
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>{title}</h2>
      <div
        style={{
          width: 48,
          height: 3,
          background: BRAND,
          borderRadius: 2,
          marginTop: 8,
        }}
      />
    </div>
  )
}

function IconPassport() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f93e42" strokeWidth="1.5" aria-hidden>
      <rect x="3" y="2" width="18" height="20" rx="2" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6 21v-1a6 6 0 0 1 12 0v1" />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f93e42" strokeWidth="1.5" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f93e42" strokeWidth="1.5" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}

function IconEntry() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f93e42" strokeWidth="1.5" aria-hidden>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
    </svg>
  )
}

function IconLocation() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f93e42" strokeWidth="1.5" aria-hidden>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function IconMethod() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f93e42" strokeWidth="1.5" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

function InfoPill({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #f0f0f0',
        borderRadius: 16,
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: '#fff8f8',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <div>
        <p style={{ margin: '0 0 2px', fontSize: 12, color: '#888' }}>{label}</p>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111' }}>{value}</p>
      </div>
    </div>
  )
}

function ShieldIcon({ color = BRAND, size = 20 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="#fff" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function PaymentBox({
  country,
  selectedOptionId,
  setSearchParams,
  travelers,
  setTravelers,
  expressExtra,
  total,
  govFee,
  processingFeeNum,
  processingDate,
  isMobile,
  applyHover,
  setApplyHover,
  onApply,
}: {
  country: Country
  selectedOptionId: string
  setSearchParams: ReturnType<typeof useSearchParams>[1]
  travelers: number
  setTravelers: (n: number) => void
  expressExtra: number
  total: number
  govFee: number
  processingFeeNum: number
  processingDate: string
  isMobile: boolean
  applyHover: boolean
  setApplyHover: (v: boolean) => void
  onApply: () => void
}) {
  const hasMultiple = country.visaOptions.length > 1
  const otherOption = country.visaOptions.find((o) => o.id !== selectedOptionId)

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 380,
        ...(isMobile ? {} : { position: 'sticky', top: 80, alignSelf: 'flex-start' }),
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 24,
          boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #eef4ff, #e8f0fe)',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldIcon color={ACCENT} />
            <span style={{ color: ACCENT, fontWeight: 600, fontSize: 14 }}>
              Guaranteed by {processingDate}
            </span>
          </div>
          <span style={{ color: '#888', fontSize: 12 }}>⚡ 1 day faster option</span>
        </div>

        {hasMultiple && (
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f5f5f5' }}>
            {country.visaOptions.map((option) => {
              const selected = option.id === selectedOptionId
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSearchParams({ option: option.id }, { replace: true })}
                  style={{
                    width: '100%',
                    marginBottom: 8,
                    padding: 12,
                    borderRadius: 40,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    background: selected ? BRAND : '#fff',
                    color: selected ? '#fff' : '#333',
                    border: selected ? 'none' : '1px solid #ddd',
                  }}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        )}

        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #f5f5f5',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="8" r="4" stroke="#666" strokeWidth="1.5" />
            <path d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="#666" strokeWidth="1.5" />
          </svg>
          <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>Travelers</span>
          <button
            type="button"
            onClick={() => setTravelers(Math.max(1, travelers - 1))}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid #ddd',
              background: '#fafafa',
              cursor: 'pointer',
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            −
          </button>
          <span style={{ fontWeight: 700, fontSize: 18, minWidth: 24, textAlign: 'center' }}>{travelers}</span>
          <button
            type="button"
            onClick={() => setTravelers(Math.min(10, travelers + 1))}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              background: BRAND,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            +
          </button>
        </div>

        <div style={{ padding: 20, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 36, fontWeight: 700, color: '#1a1a1a' }}>AED {total}</p>
          <p
            style={{
              margin: '6px 0 0',
              fontSize: 11,
              letterSpacing: '0.1em',
              color: '#888',
              fontWeight: 600,
            }}
          >
            TO BE PAID NOW
          </p>
        </div>

        <button
          type="button"
          onClick={onApply}
          onMouseEnter={() => setApplyHover(true)}
          onMouseLeave={() => setApplyHover(false)}
          style={{
            display: 'block',
            width: 'calc(100% - 40px)',
            margin: '0 20px 12px',
            padding: 16,
            background: 'linear-gradient(135deg, #f93e42, #ff6b6b)',
            color: '#fff',
            borderRadius: 16,
            border: 'none',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: applyHover
              ? '0 12px 32px rgba(249,62,66,0.45)'
              : '0 8px 24px rgba(249,62,66,0.35)',
            transform: applyHover ? 'translateY(-2px)' : 'translateY(0)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
        >
          Start Application
        </button>

        {hasMultiple && otherOption && (
          <button
            type="button"
            onClick={() => setSearchParams({ option: otherOption.id }, { replace: true })}
            style={{
              display: 'block',
              width: 'calc(100% - 40px)',
              margin: '0 20px 16px',
              padding: 12,
              background: '#fff',
              border: '1px solid #eee',
              borderRadius: 16,
              color: '#666',
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {getOptionButtonLabel(otherOption, country.name)}
          </button>
        )}

        <div style={{ padding: '16px 20px', borderTop: '1px solid #f5f5f5', fontSize: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <span style={{ fontWeight: 600, color: '#111' }}>Pay Now</span>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>Government Fees</p>
            </div>
            <span style={{ fontWeight: 700 }}>AED {govFee * travelers}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <span style={{ fontWeight: 600, color: '#111' }}>Pay on approval</span>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>Processing Fee</p>
            </div>
            <span style={{ fontWeight: 700 }}>AED {processingFeeNum * travelers}</span>
          </div>
          {expressExtra > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span>Express delivery</span>
              <span style={{ fontWeight: 700 }}>AED {expressExtra * travelers}</span>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '1px solid #f5f5f5',
              paddingTop: 14,
              marginTop: 4,
            }}
          >
            <span style={{ fontWeight: 700 }}>Total Amount</span>
            <span style={{ fontWeight: 700, fontSize: 18, color: BRAND }}>AED {total}</span>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          background: 'linear-gradient(135deg, #1a1a2e, #2d2d5e)',
          borderRadius: 20,
          padding: 20,
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <ShieldIcon color="#fff" />
          <span style={{ fontWeight: 700 }}>Super Protect</span>
          <span
            style={{
              marginLeft: 'auto',
              background: '#22c55e',
              color: '#fff',
              borderRadius: 20,
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Included
          </span>
        </div>
        <p style={{ margin: '0 0 6px', fontSize: 13, opacity: 0.95 }}>
          If Visa Delayed — No Superjet Global Fee
        </p>
        <p style={{ margin: 0, fontSize: 13, opacity: 0.85 }}>
          If Rejected — third-party provider terms apply; contact us for Super Protect coverage details.
        </p>
      </div>

      <div
        style={{
          marginTop: 12,
          background: '#fff',
          borderRadius: 16,
          padding: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}
      >
        <div>
          <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14 }}>Have Queries?</p>
          <p style={{ margin: 0, fontSize: 12, color: '#888' }}>Documents, process, price, etc.</p>
        </div>
        <a
          href="https://wa.me/971559641020"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #25d366, #128c7e)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
          }}
        >
          <WhatsAppIcon />
        </a>
      </div>
    </div>
  )
}

export default function VisaPage() {
  const { countrySlug } = useParams<{ countrySlug: string }>()
  const country = countrySlug ? getCountry(countrySlug) : undefined
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    citizenship,
    countryCode,
    residenceCountry,
    residenceCode,
    residencyStatus,
    openCitizenshipModal,
  } = useCitizenship()
  const { isLoggedIn, avatarInitials, avatarColor } = useAuth()
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [travelers, setTravelers] = useState(1)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [applyHover, setApplyHover] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState<1 | 2>(1)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const selectedOption = useMemo(() => {
    if (!country) return undefined
    const param = searchParams.get('option')
    return country.visaOptions.find((o) => o.id === param) ?? country.visaOptions[0]
  }, [country, searchParams])

  const selectedOptionId = selectedOption?.id ?? 'single'

  useEffect(() => {
    if (!country) return
    const param = searchParams.get('option')
    if (!param || !country.visaOptions.some((o) => o.id === param)) {
      setSearchParams({ option: country.visaOptions[0].id }, { replace: true })
    }
  }, [country, searchParams, setSearchParams])

  useEffect(() => {
    setSelectedDelivery(1)
  }, [selectedOptionId])

  const nearby = useMemo(() => (country ? getNearby(country.slug) : []), [country])
  const eligibility = country
    ? getEligibilityBadge(country, citizenship, residenceCountry, residencyStatus)
    : null

  const govFee = selectedOption ? parseFeeAed(selectedOption.fee) : 0
  const processingFeeNum = selectedOption ? parseFeeAed(selectedOption.processingFee) : 0
  const expressExtra = selectedDelivery === 2 ? EXPRESS_SURCHARGE : 0
  const total = (govFee + processingFeeNum + expressExtra) * travelers

  const maxDays = selectedOption ? parseProcessingDaysMax(selectedOption.processingTime) : 5
  const minDays = selectedOption ? parseProcessingDaysMin(selectedOption.processingTime) : 3
  const standardDate = formatDeliveryDate(maxDays)
  const expressDate = formatDeliveryDate(Math.max(0, minDays - 1))
  const inDaysLabel =
    maxDays === 0 ? 'Instant' : maxDays === minDays ? `in ${maxDays} days` : `in ${minDays}-${maxDays} days`

  const faqs = useMemo(() => {
    if (!country) return []
    const docs =
      country.documents.length > 0
        ? country.documents.join(', ')
        : 'No documents required for this destination.'
    return [
      {
        q: 'What documents do I need?',
        a: `For ${country.name}, you typically need: ${docs}. Our team verifies everything before submission.`,
      },
      {
        q: 'How long does processing take?',
        a: `Standard processing for ${country.name} is ${selectedOption?.processingTime ?? country.processingTime}. We guarantee delivery by ${country.guaranteedDate}.`,
      },
      {
        q: 'Can I track my application?',
        a: 'Yes. After you apply, you receive real-time status updates by email and in your Superjet Global dashboard.',
      },
      {
        q: 'What if my visa is rejected?',
        a: 'With Super Protect, rejected applications qualify for a 100% refund of Superjet Global fees per our policy.',
      },
      {
        q: 'Is my payment secure?',
        a: 'All payments are encrypted and processed through secure payment partners. We never store full card details.',
      },
    ]
  }, [country, selectedOption])

  const processSteps = [
    { title: 'Fill Application', desc: 'Complete your personal details and travel information' },
    { title: 'Upload Documents', desc: 'Submit required documents through our secure portal' },
    { title: 'Expert Review', desc: 'Our visa experts verify and prepare your application' },
    { title: 'Visa Delivered', desc: 'Receive your visa before your travel date, guaranteed' },
  ]

  const sectionGap: CSSProperties = { marginTop: 40 }

  if (!country) {
    return (
      <div style={{ minHeight: '100vh', background: '#fafafa' }}>
        <Navbar isMobile={isMobile} isLoggedIn={isLoggedIn} avatarInitials={avatarInitials} avatarColor={avatarColor} />
        <main style={{ maxWidth: MAX_W, margin: '0 auto', padding: 48, textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 12px', fontSize: 28, fontWeight: 700 }}>Country not found</h1>
          <p style={{ color: '#666', marginBottom: 24 }}>We couldn&apos;t find visa information for this destination.</p>
          <Link to="/" style={{ color: BRAND, fontWeight: 600, textDecoration: 'none' }}>
            ← All Destinations
          </Link>
        </main>
        <SiteFooter isMobile={isMobile} />
      </div>
    )
  }

  if (!selectedOption) return null

  const paymentBox = (
    <PaymentBox
      country={country}
      selectedOptionId={selectedOptionId}
      setSearchParams={setSearchParams}
      travelers={travelers}
      setTravelers={setTravelers}
      expressExtra={expressExtra}
      total={total}
      govFee={govFee}
      processingFeeNum={processingFeeNum}
      processingDate={standardDate}
      isMobile={isMobile}
      applyHover={applyHover}
      setApplyHover={setApplyHover}
      onApply={() =>
        navigate(
          `/apply?destination=${encodeURIComponent(country.slug)}&option=${encodeURIComponent(selectedOptionId)}&step=personal`,
        )
      }
    />
  )

  const leftContent = (
    <div style={{ paddingTop: 32, paddingRight: isMobile ? 0 : 32 }}>
      <section>
        <SectionHeading title={`${country.name} Visa Information`} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: 12,
          }}
        >
          <InfoPill icon={<IconPassport />} label="Visa Type" value={country.visaType} />
          <InfoPill icon={<IconCalendar />} label="Validity" value={selectedOption.validity} />
          <InfoPill icon={<IconClock />} label="Processing" value={selectedOption.processingTime} />
          <InfoPill icon={<IconEntry />} label="Entry" value={selectedOption.entry} />
          <InfoPill icon={<IconLocation />} label="Ports" value={selectedOption.ports} />
          <InfoPill icon={<IconMethod />} label="Method" value={selectedOption.method} />
        </div>
      </section>

      <section style={sectionGap}>
        <SectionHeading title="Who Can Apply" />
        <p style={{ margin: '0 0 20px', color: '#555', fontSize: 15, lineHeight: 1.8 }}>
          {residenceCountry} residents with a {citizenship} passport can apply for a {country.name} visa
          through Superjet Global. Whether you&apos;re planning a tourist trip, business visit, or family
          reunion, we handle your complete application.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: 12,
          }}
        >
          {[
            { emoji: '🧑‍💼', title: 'Employed', desc: 'Salary certificate + NOC required' },
            { emoji: '💼', title: 'Self Employed', desc: 'Trade licence + bank statement' },
            { emoji: '👨‍👩‍👧', title: 'Family', desc: 'Sponsor documents required' },
          ].map((c) => (
            <div
              key={c.title}
              style={{
                borderRadius: 16,
                padding: 20,
                textAlign: 'center',
                border: '1px solid #f0f0f0',
                background: '#fff',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{c.emoji}</div>
              <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15 }}>{c.title}</p>
              <p style={{ margin: 0, fontSize: 13, color: '#888' }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={sectionGap}>
        <SectionHeading title="Guaranteed Visa Delivery" />
        <div
          role="button"
          tabIndex={0}
          onClick={() => setSelectedDelivery(1)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setSelectedDelivery(1)
            }
          }}
          style={{
            border: selectedDelivery === 1 ? `2px solid ${ACCENT}` : '1px solid #eee',
            background: selectedDelivery === 1 ? '#fafbff' : '#fff',
            borderRadius: 16,
            padding: 20,
            marginBottom: 12,
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: 12,
            cursor: 'pointer',
          }}
        >
          <div>
            <span
              style={{
                display: 'inline-block',
                background: selectedDelivery === 1 ? '#eef4ff' : '#f5f5f5',
                color: selectedDelivery === 1 ? ACCENT : '#888',
                borderRadius: 40,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              {inDaysLabel}
            </span>
            <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 18 }}>{standardDate}</p>
            <span style={{ color: '#888', fontSize: 13 }}>View Timeline ↓</span>
          </div>
          {selectedDelivery === 1 ? (
            <span
              style={{
                alignSelf: isMobile ? 'flex-start' : 'center',
                background: '#22c55e',
                color: '#fff',
                borderRadius: 40,
                padding: '6px 16px',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ✓ Selected
            </span>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedDelivery(1)
              }}
              style={{
                alignSelf: isMobile ? 'flex-start' : 'center',
                border: '1px solid #ddd',
                borderRadius: 40,
                padding: '6px 16px',
                fontSize: 13,
                background: '#fff',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Select
            </button>
          )}
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setSelectedDelivery(2)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setSelectedDelivery(2)
            }
          }}
          style={{
            border: selectedDelivery === 2 ? `2px solid ${ACCENT}` : '1px solid #eee',
            background: selectedDelivery === 2 ? '#fafbff' : '#fff',
            borderRadius: 16,
            padding: 20,
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: 12,
            cursor: 'pointer',
          }}
        >
          <div>
            <span
              style={{
                display: 'inline-block',
                background: selectedDelivery === 2 ? '#eef4ff' : '#f5f5f5',
                color: selectedDelivery === 2 ? ACCENT : '#888',
                borderRadius: 40,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              36 hours sooner
            </span>
            <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 18 }}>{expressDate}</p>
            <span style={{ color: '#888', fontSize: 13 }}>View Timeline ↓</span>
          </div>
          {selectedDelivery === 2 ? (
            <span
              style={{
                alignSelf: isMobile ? 'flex-start' : 'center',
                background: '#22c55e',
                color: '#fff',
                borderRadius: 40,
                padding: '6px 16px',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ✓ Selected
            </span>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedDelivery(2)
              }}
              style={{
                alignSelf: isMobile ? 'flex-start' : 'center',
                border: '1px solid #ddd',
                borderRadius: 40,
                padding: '6px 16px',
                fontSize: 13,
                background: '#fff',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Select
            </button>
          )}
        </div>
      </section>

      <section style={sectionGap}>
        <SectionHeading title="How Visa Process Works" />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
            gap: isMobile ? 24 : 8,
            position: 'relative',
          }}
        >
          {!isMobile &&
            processSteps.slice(0, -1).map((_, i) => (
              <div
                key={`line-${i}`}
                aria-hidden
                style={{
                  position: 'absolute',
                  top: 16,
                  left: `${12.5 + i * 25}%`,
                  width: '25%',
                  borderTop: '2px dashed #f0d0d0',
                }}
              />
            ))}
          {processSteps.map((step, i) => (
            <div key={step.title} style={{ position: 'relative', zIndex: 1 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: BRAND,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {i + 1}
              </div>
              <p style={{ margin: '12px 0 4px', fontWeight: 700, fontSize: 15 }}>{step.title}</p>
              <p style={{ margin: 0, fontSize: 13, color: '#888', lineHeight: 1.5 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={sectionGap}>
        <SectionHeading title="Documents Required" />
        {(country.documents.length > 0 ? country.documents : ['Passport', 'Photo']).map((doc) => (
          <div
            key={doc}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 0',
              borderBottom: '1px solid #f5f5f5',
            }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: '#f0fdf4',
                color: '#16a34a',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              ✓
            </span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{doc}</span>
          </div>
        ))}
        <div
          style={{
            marginTop: 16,
            background: '#f0fff4',
            border: '1px solid #c3e6cb',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#16a34a',
            fontSize: 13,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="5" y="11" width="14" height="10" rx="2" stroke="#16a34a" strokeWidth="1.5" />
            <path d="M8 11V7a4 4 0 118 0v4" stroke="#16a34a" strokeWidth="1.5" />
          </svg>
          All documents are verified by our experts before submission
        </div>
      </section>

      <section style={{ ...sectionGap, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 3c-2 4-6 5-8 8 2-1 5-1 8 1-2-3-4-6-5-8-8 2 1 5 1 8-1-2-4-6-5-8-8z" stroke={BRAND} strokeWidth="1.2" opacity={0.7} />
          </svg>
          <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 24, fontWeight: 700 }}>
            4.5 ★ Rating Across All Platforms
          </h2>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden style={{ transform: 'scaleX(-1)' }}>
            <path d="M12 3c-2 4-6 5-8 8 2-1 5-1 8 1-2-3-4-6-5-8-8 2 1 5 1 8-1-2-4-6-5-8-8z" stroke={BRAND} strokeWidth="1.2" opacity={0.7} />
          </svg>
        </div>
        <p style={{ margin: '0 0 12px', color: '#888' }}>
          Highest rating for any visa platform in United Arab Emirates
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 32, fontSize: 13, color: '#888' }}>
          {['Trustpilot', 'App Store', 'Google Play'].map((p, i) => (
            <span key={p}>
              {i > 0 && <span style={{ marginRight: 32, color: '#ddd' }}>|</span>}
              {p}
            </span>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            gap: 16,
            overflowX: isMobile ? 'auto' : 'visible',
            flexWrap: isMobile ? 'nowrap' : 'wrap',
            justifyContent: 'center',
          }}
        >
          {REVIEWS.map((r) => (
            <article
              key={r.name}
              style={{
                flex: isMobile ? '0 0 280px' : '1 1 240px',
                maxWidth: 320,
                background: '#fff',
                borderRadius: 20,
                padding: 24,
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                textAlign: 'left',
              }}
            >
              <div style={{ color: '#fbbf24', fontSize: 18, letterSpacing: 2 }}>★★★★★</div>
              <p style={{ margin: '12px 0 16px', color: '#444', fontSize: 15, lineHeight: 1.7 }}>
                &ldquo;{r.text}&rdquo;
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: r.color,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 12,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {r.initials}
                </span>
                <div>
                  <strong style={{ fontSize: 14 }}>{r.name}</strong>
                  <p style={{ margin: 0, fontSize: 12, color: '#888' }}>UAE Resident</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={sectionGap}>
        <SectionHeading title={`${country.name} Visa Rejection Reasons`} />
        {REJECTION_REASONS.map((r) => (
          <div
            key={r.title}
            style={{
              borderLeft: `3px solid ${BRAND}`,
              background: '#fff8f8',
              borderRadius: '0 12px 12px 0',
              padding: 16,
              marginBottom: 12,
            }}
          >
            <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14 }}>⚠ {r.title}</p>
            <p style={{ margin: 0, fontSize: 13, color: '#888' }}>{r.description}</p>
          </div>
        ))}
      </section>

      <section style={sectionGap}>
        <SectionHeading title="Frequently Asked Questions" />
        {faqs.map((faq, idx) => {
          const open = openFaq === idx
          return (
            <div
              key={faq.q}
              style={{ border: '1px solid #f0f0f0', borderRadius: 16, marginBottom: 12, overflow: 'hidden' }}
            >
              <button
                type="button"
                onClick={() => setOpenFaq(open ? null : idx)}
                style={{
                  width: '100%',
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: 'none',
                  background: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a' }}>{faq.q}</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                  style={{
                    flexShrink: 0,
                    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s',
                  }}
                >
                  <path d="M6 9l6 6 6-6" stroke="#888" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <div
                style={{
                  padding: open ? '0 24px 20px' : '0 24px',
                  maxHeight: open ? 500 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease',
                  color: '#666',
                  fontSize: 15,
                  lineHeight: 1.7,
                }}
              >
                {faq.a}
              </div>
            </div>
          )
        })}
      </section>

      <section style={sectionGap}>
        <SectionHeading title="Explore Similar Destinations" />
        <div
          style={{
            display: 'flex',
            gap: 12,
            overflowX: 'auto',
            paddingBottom: 8,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {nearby.map((c) => (
            <Link
              key={c.slug}
              to={`/visa/${c.slug}`}
              style={{
                flex: '0 0 160px',
                width: 160,
                textDecoration: 'none',
                color: 'inherit',
                background: '#fff',
                border: '1px solid #f0f0f0',
                borderRadius: 16,
                padding: 16,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <img
                src={flagUrl(c.countryCode, 80)}
                alt=""
                width={40}
                height={28}
                style={{ borderRadius: 4, objectFit: 'cover', marginBottom: 10 }}
              />
              <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 14 }}>{c.name}</p>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: 11,
                  fontWeight: 600,
                  color: BRAND,
                  background: '#fff8f8',
                  padding: '4px 8px',
                  borderRadius: 20,
                  marginBottom: 8,
                }}
              >
                {c.visaType}
              </span>
              <p style={{ margin: 0, fontSize: 13, color: BRAND, fontWeight: 600 }}>View →</p>
            </Link>
          ))}
        </div>
      </section>

      <section style={{ ...sectionGap, marginBottom: 40 }}>
        <div
          style={{
            background: '#f8f8f8',
            borderRadius: 16,
            padding: 24,
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <ShieldIcon color={ACCENT} size={32} />
          <div>
            <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15 }}>How We Reviewed This Page</p>
            <p style={{ margin: 0, color: '#666', fontSize: 13, lineHeight: 1.6 }}>
              Last reviewed: June 2026 · Verified by Superjet Global visa experts · Information updated monthly
            </p>
          </div>
        </div>
      </section>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Navbar
        activeTab="explore"
        setActiveTab={() => {}}
        isMobile={isMobile}
        isLoggedIn={isLoggedIn}
        avatarInitials={avatarInitials}
        avatarColor={avatarColor}
        showEvents={false}
      />

      {/* Hero */}
      <div
        style={{
          position: 'relative',
          height: isMobile ? 260 : 420,
          overflow: 'hidden',
          borderRadius: '0 0 32px 32px',
        }}
      >
        <img
          src={countryImageUrl(country.slug)}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 24,
            right: isMobile ? 16 : 32,
            display: 'flex',
            gap: 10,
          }}
        >
          {['Share', 'Save'].map((label) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              {label === 'Share' ? '↗' : '☆'}
            </button>
          ))}
        </div>
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: isMobile ? '24px 20px' : '40px',
          }}
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              border: 'none',
              background: 'none',
              color: '#fff',
              opacity: 0.8,
              fontSize: 14,
              cursor: 'pointer',
              padding: 0,
              textAlign: 'left',
              fontFamily: 'inherit',
            }}
          >
            ← All Destinations
          </button>
          <img
            src={flagUrl(country.countryCode, 80)}
            alt=""
            width={56}
            height={40}
            style={{
              marginTop: 16,
              borderRadius: 6,
              objectFit: 'cover',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            }}
          />
          <h1
            style={{
              margin: '12px 0 10px',
              color: '#fff',
              fontSize: isMobile ? 28 : 48,
              fontWeight: 800,
              letterSpacing: '-0.02em',
            }}
          >
            {country.name}
          </h1>
          <span
            style={{
              display: 'inline-block',
              width: 'fit-content',
              background: 'rgba(249,62,66,0.9)',
              color: '#fff',
              borderRadius: 40,
              padding: '6px 18px',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {country.visaType}
          </span>
        </div>
      </div>

      {/* Passport strip */}
      <div
        style={{
          background: '#fff',
          padding: isMobile ? '16px 20px' : '16px 40px',
          borderBottom: '1px solid #f0f0f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ color: '#888', fontSize: 13 }}>Viewing for:</span>
          <button
            type="button"
            onClick={openCitizenshipModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#fff8f8',
              border: `1.5px solid ${BRAND}`,
              borderRadius: 40,
              padding: '8px 14px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            <img src={flagUrl(countryCode, 40)} alt="" width={22} height={15} style={{ borderRadius: 2, objectFit: 'cover' }} />
            {citizenship} passport
          </button>
          <span style={{ color: '#ccc', fontSize: 13 }}>+</span>
          <button
            type="button"
            onClick={openCitizenshipModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#f0f4ff',
              border: `1.5px solid ${ACCENT}`,
              borderRadius: 40,
              padding: '8px 14px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            <img src={flagUrl(residenceCode, 40)} alt="" width={22} height={15} style={{ borderRadius: 2, objectFit: 'cover' }} />
            Living in {residenceCountry}
          </button>
        </div>
        {eligibility && (
          <span
            style={{
              padding: '6px 14px',
              borderRadius: 40,
              fontSize: 13,
              fontWeight: 600,
              color: eligibility.color,
              background: eligibility.bg,
              border: `1px solid ${eligibility.border}`,
            }}
          >
            {eligibility.label}
          </span>
        )}
      </div>

      {/* Two columns */}
      <div
        style={{
          maxWidth: MAX_W,
          margin: '0 auto',
          padding: isMobile ? '0 16px 48px' : '0 32px 64px',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 24 : 0,
          alignItems: 'flex-start',
        }}
      >
        {isMobile && paymentBox}
        <div style={{ flex: isMobile ? '1 1 100%' : '0 0 65%', width: isMobile ? '100%' : '65%' }}>
          {leftContent}
        </div>
        {!isMobile && (
          <div style={{ flex: '0 0 35%', width: '35%', display: 'flex', justifyContent: 'center' }}>
            {paymentBox}
          </div>
        )}
      </div>

      <SiteFooter isMobile={isMobile} />
    </div>
  )
}
