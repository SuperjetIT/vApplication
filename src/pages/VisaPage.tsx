import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { countries, getCountry, type Country } from '../data/countries'
import { SiteLayout } from '../components/SiteLayout'

const BRAND = '#f93e42'
const BRAND_HOVER = '#d42e32'
const TEXT = '#111827'
const TEXT_MUTED = '#6b7280'
const BORDER = '#e5e7eb'
const MAX_W = 1280
const PROCESSING_FEE = 99

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

const rejectionReasons = [
  'Incomplete documents',
  'Insufficient funds',
  'Wrong visa type',
  'Travel history issues',
]

const reviews = [
  {
    initials: 'AK',
    name: 'Ahmed K.',
    text: 'Got my visa before the promised date. Smooth process and clear updates throughout.',
  },
  {
    initials: 'SM',
    name: 'Sara M.',
    text: 'Best visa experience in the UAE. Upload once and they handled the rest perfectly.',
  },
  {
    initials: 'RJ',
    name: 'Ravi J.',
    text: 'Transparent pricing and fast support on WhatsApp. Highly recommend for families.',
  },
]

function unsplashUrl(name: string) {
  return `https://source.unsplash.com/1200x400/?${name.replace(/\s+/g, '+')},travel,landmark`
}

function parseFeeAed(fee: string): number {
  const match = fee.match(/(\d+)/)
  return match ? Number.parseInt(match[1], 10) : 0
}

function getNearby(slug: string): Country[] {
  const slugs = nearbyBySlug[slug]
  if (slugs) {
    return slugs
      .map((s) => getCountry(s))
      .filter((c): c is Country => Boolean(c))
      .slice(0, 4)
  }
  return countries.filter((c) => c.slug !== slug).slice(0, 4)
}

function getEntryType(visaType: string): string {
  if (visaType === 'Sticker') return 'Multiple'
  if (visaType === 'No Visa Required') return 'Visa Free'
  return 'Single'
}

function getLengthOfStay(validity: string): string {
  if (validity === 'N/A' || validity === 'Not applicable') return '—'
  return validity
}

function getValidityLabel(country: Country): string {
  if (country.visaType === 'Sticker') return country.validity
  if (country.validity.includes('year')) return country.validity
  return 'From date of issue'
}

function SectionAccent() {
  return (
    <div
      style={{
        width: 40,
        height: 3,
        background: BRAND,
        borderRadius: 2,
        marginBottom: 20,
      }}
    />
  )
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h2
      style={{
        margin: '0 0 8px',
        fontSize: 22,
        fontWeight: 700,
        color: TEXT,
        letterSpacing: '-0.02em',
      }}
    >
      {children}
    </h2>
  )
}

function ShieldIcon({ color = BRAND, size = 20 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 20h4l10-10-4-4L4 16v4zM14 6l4 4"
        stroke={BRAND}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16"
        stroke={BRAND}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
        stroke={BRAND}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 6L9 17l-5-5"
        stroke={BRAND}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="#666" strokeWidth="1.5" />
      <path
        d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7"
        stroke="#666"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MinusCircleIcon() {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke={BORDER} strokeWidth="1.5" />
      <path d="M8 12h8" stroke={TEXT} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function PlusCircleIcon() {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke={BORDER} strokeWidth="1.5" />
      <path d="M12 8v8M8 12h8" stroke={TEXT} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{
        flexShrink: 0,
        transition: 'transform 0.25s ease',
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
      }}
    >
      <path d="M6 9l6 6 6-6" stroke={TEXT} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function LaurelIcon() {
  return (
    <svg width={32} height={32} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3c-2 4-6 5-8 8 2-1 5-1 8 1-2-3-4-6-5-8-8 2 1 5 1 8-1-2-4-6-5-8-8z"
        stroke={BRAND}
        strokeWidth="1.2"
        strokeLinejoin="round"
        opacity={0.7}
      />
    </svg>
  )
}

function StarIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 2l3 7h7l-5.5 4.5 2 7L12 17l-6.5 3.5 2-7L2 9h7l3-7z"
        fill={filled ? '#fbbf24' : '#e5e7eb'}
      />
    </svg>
  )
}

function TrustpilotIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <rect width={24} height={24} rx={4} fill="#00b67a" />
      <path d="M12 6l1.5 4.5H18l-3.7 2.7 1.4 4.5L12 15l-3.7 2.7 1.4-4.5L6 10.5h4.5L12 6z" fill="#fff" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill={TEXT} aria-hidden>
      <path d="M17.05 12.67c-.02-2.58 2.1-3.82 2.19-3.89-1.19-1.74-3.04-1.98-3.7-2.01-1.58-.16-3.08.93-3.88.93-.8 0-2.03-.9-3.34-.88-1.72.03-3.3 1-4.18 2.54-1.78 3.09-.46 7.67 1.28 10.18.85 1.23 1.86 2.61 3.19 2.56 1.28-.05 1.76-.83 3.3-.83 1.54 0 1.97.83 3.32.8 1.37-.02 2.24-1.25 3.08-2.49.97-1.42 1.37-2.8 1.39-2.87-.03-.01-2.67-1.02-2.7-4.05zM14.3 4.2c.7-.85 1.17-2.03 1.04-3.2-1.01.04-2.23.67-2.96 1.52-.65.75-1.22 1.95-1.07 3.1 1.13.09 2.28-.58 2.99-1.42z" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden>
      <path d="M8 5v14l11-7L8 5z" fill={BRAND} />
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

function InfoPill({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div
      style={{
        flex: '1 1 140px',
        minWidth: 140,
        padding: '14px 16px',
        background: '#f3f4f6',
        borderRadius: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>{icon}</div>
      <p style={{ margin: '0 0 4px', fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase' }}>
        {label}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 15,
          fontWeight: 700,
          color: TEXT,
          textDecoration: 'underline',
          textUnderlineOffset: 3,
        }}
      >
        {value}
      </p>
    </div>
  )
}

function PaymentSidebar({
  country,
  travelers,
  setTravelers,
  govFee,
  total,
  isMobile,
  applyHover,
  setApplyHover,
  onApply,
}: {
  country: Country
  travelers: number
  setTravelers: (n: number) => void
  govFee: number
  total: number
  isMobile: boolean
  applyHover: boolean
  setApplyHover: (v: boolean) => void
  onApply: () => void
}) {
  const stickyWrap: CSSProperties = isMobile
    ? {}
    : { position: 'sticky', top: 80, alignSelf: 'flex-start' }

  return (
    <div style={{ ...stickyWrap, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
          border: '1px solid #eee',
          padding: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#eef4ff',
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <ShieldIcon color="#2563eb" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#2563eb', lineHeight: 1.4 }}>
            Visa Guaranteed on {country.guaranteedDate}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PersonIcon />
            <span style={{ fontWeight: 600, fontSize: 14, color: TEXT }}>Travelers</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              aria-label="Decrease travelers"
              onClick={() => setTravelers(Math.max(1, travelers - 1))}
              style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
            >
              <MinusCircleIcon />
            </button>
            <span style={{ fontWeight: 700, fontSize: 16, minWidth: 24, textAlign: 'center' }}>
              {travelers}
            </span>
            <button
              type="button"
              aria-label="Increase travelers"
              onClick={() => setTravelers(Math.min(10, travelers + 1))}
              style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
            >
              <PlusCircleIcon />
            </button>
          </div>
        </div>

        <div style={{ fontSize: 14, color: TEXT_MUTED, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span>Government Fees</span>
            <span style={{ color: TEXT, fontWeight: 500 }}>
              AED {govFee * travelers}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Processing Fee</span>
            <span style={{ color: TEXT, fontWeight: 500 }}>
              AED {PROCESSING_FEE * travelers}
            </span>
          </div>
        </div>

        <div
          style={{
            borderTop: `1px solid ${BORDER}`,
            paddingTop: 14,
            marginBottom: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 15, color: TEXT }}>Total Amount</span>
          <span style={{ fontWeight: 700, fontSize: 18, color: BRAND }}>AED {total}</span>
        </div>

        <button
          type="button"
          onClick={onApply}
          onMouseEnter={() => setApplyHover(true)}
          onMouseLeave={() => setApplyHover(false)}
          style={{
            width: '100%',
            padding: 16,
            border: 'none',
            borderRadius: 40,
            background: applyHover ? BRAND_HOVER : BRAND,
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            transform: applyHover ? 'scale(1.02)' : 'scale(1)',
            transition: 'background 0.2s ease, transform 0.2s ease',
          }}
        >
          Start Application
        </button>
      </div>

      <div
        style={{
          background: 'linear-gradient(135deg,#1a1a2e,#2d2d5e)',
          borderRadius: 16,
          padding: 16,
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <ShieldIcon color="#fff" />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Atlys Protect</span>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 11,
              fontWeight: 600,
              background: '#22c55e',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: 20,
            }}
          >
            Included
          </span>
        </div>
        <p style={{ margin: '0 0 6px', fontSize: 13, opacity: 0.9 }}>If Visa Delayed — No Atlys Fee</p>
        <p style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>If Rejected — 100% Refund</p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '4px 0',
        }}
      >
        <div>
          <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14, color: TEXT }}>Have Queries?</p>
          <p style={{ margin: 0, fontSize: 12, color: TEXT_MUTED }}>Documents, process, price, etc.</p>
        </div>
        <a
          href="https://wa.me/971559641020"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#25d366,#128c7e)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            textDecoration: 'none',
            boxShadow: '0 4px 12px rgba(37,211,102,0.35)',
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [travelers, setTravelers] = useState(1)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [applyHover, setApplyHover] = useState(false)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const nearby = useMemo(
    () => (country ? getNearby(country.slug) : []),
    [country],
  )

  const govFee = country ? parseFeeAed(country.fee) : 0
  const total = (govFee + PROCESSING_FEE) * travelers

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
        a: `Standard processing for ${country.name} is ${country.processingTime}. We guarantee delivery by ${country.guaranteedDate}.`,
      },
      {
        q: 'Can I track my application?',
        a: 'Yes. After you apply, you receive real-time status updates by email and in your supervisa dashboard.',
      },
      {
        q: 'What if my visa is rejected?',
        a: 'With Atlys Protect, rejected applications qualify for a 100% refund of Atlys fees per our policy.',
      },
      {
        q: 'Is my payment secure?',
        a: 'All payments are encrypted and processed through secure payment partners. We never store full card details.',
      },
    ]
  }, [country])

  const steps = [
    { num: 1, title: 'Fill Application', desc: 'Complete your details online in minutes.', icon: <EditIcon /> },
    { num: 2, title: 'Upload Documents', desc: 'Submit passport and required files securely.', icon: <UploadIcon /> },
    { num: 3, title: 'We Submit', desc: 'Our experts file with the embassy for you.', icon: <SendIcon /> },
    { num: 4, title: 'Visa Delivered', desc: 'Receive your visa on time, guaranteed.', icon: <CheckIcon /> },
  ]

  const sectionBlock: CSSProperties = {
    paddingBottom: 32,
    marginBottom: 32,
    borderBottom: `1px solid ${BORDER}`,
  }

  if (!country) {
    return (
      <SiteLayout>
        <main
          style={{
            maxWidth: MAX_W,
            margin: '0 auto',
            padding: isMobile ? '24px 16px' : '48px 32px',
            textAlign: 'center',
          }}
        >
          <h1 style={{ margin: '0 0 12px', fontSize: '1.75rem', fontWeight: 700, color: TEXT }}>
            Country not found
          </h1>
          <p style={{ margin: '0 0 24px', color: TEXT_MUTED }}>We couldn&apos;t find visa information for this destination.</p>
          <Link to="/" style={{ color: BRAND, fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
            ← All countries
          </Link>
        </main>
      </SiteLayout>
    )
  }

  const paymentProps = {
    country,
    travelers,
    setTravelers,
    govFee,
    total,
    isMobile,
    applyHover,
    setApplyHover,
    onApply: () => navigate('/sign-in'),
  }

  return (
    <SiteLayout>
      <style>{`
        .visa-reviews-scroll {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 8px;
        }
        .visa-reviews-scroll::-webkit-scrollbar { height: 6px; }
        .visa-reviews-scroll::-webkit-scrollbar-thumb { background: #ddd; border-radius: 3px; }
        .visa-nearby-scroll {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 8px;
        }
        .visa-nearby-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      <main style={{ background: '#fff' }}>
        <div
          style={{
            maxWidth: MAX_W,
            margin: '0 auto',
            padding: isMobile ? '20px 16px 48px' : '32px 32px 64px',
          }}
        >
          <Link
            to="/"
            style={{
              display: 'inline-block',
              marginBottom: 20,
              color: BRAND,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            ← All countries
          </Link>

          <div
            style={{
              position: 'relative',
              height: 400,
              borderRadius: 16,
              overflow: 'hidden',
              marginBottom: isMobile ? 24 : 40,
            }}
          >
            <img
              src={unsplashUrl(country.name)}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: isMobile ? 16 : 24,
                right: isMobile ? 16 : 24,
                bottom: isMobile ? 16 : 24,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <img
                src={`https://flagcdn.com/w80/${country.countryCode}.png`}
                alt=""
                width={56}
                height={40}
                style={{ borderRadius: 6, objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
              />
              <div>
                <h1
                  style={{
                    margin: '0 0 8px',
                    color: '#fff',
                    fontSize: isMobile ? '1.5rem' : '2rem',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {country.name}
                </h1>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '6px 14px',
                    borderRadius: 20,
                    background: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(8px)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {country.visaType}
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 28 : 40,
              alignItems: 'flex-start',
            }}
          >
            {isMobile && (
              <div style={{ width: '100%', order: 0 }}>
                <PaymentSidebar {...paymentProps} />
              </div>
            )}

            <div style={{ flex: isMobile ? '1 1 100%' : '0 0 70%', maxWidth: isMobile ? '100%' : '70%', width: '100%' }}>
              <section style={sectionBlock}>
                <SectionTitle>{`${country.name} Visa Information`}</SectionTitle>
                <SectionAccent />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  <InfoPill icon={<EditIcon />} label="Visa Type" value={country.visaType} />
                  <InfoPill icon={<UploadIcon />} label="Length of Stay" value={getLengthOfStay(country.validity)} />
                  <InfoPill icon={<SendIcon />} label="Validity" value={getValidityLabel(country)} />
                  <InfoPill icon={<CheckIcon />} label="Entry" value={getEntryType(country.visaType)} />
                </div>
              </section>

              <section style={sectionBlock}>
                <SectionTitle>How Visa Process Works</SectionTitle>
                <SectionAccent />
                <div
                  style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'stretch' : 'flex-start',
                    gap: isMobile ? 20 : 8,
                  }}
                >
                  {steps.map((step, idx) => (
                    <div
                      key={step.num}
                      style={{
                        flex: isMobile ? undefined : 1,
                        display: 'flex',
                        flexDirection: isMobile ? 'row' : 'column',
                        alignItems: isMobile ? 'flex-start' : 'center',
                        textAlign: isMobile ? 'left' : 'center',
                        gap: isMobile ? 16 : 0,
                        position: 'relative',
                      }}
                    >
                      {idx < steps.length - 1 && !isMobile && (
                        <div
                          aria-hidden
                          style={{
                            position: 'absolute',
                            top: 20,
                            left: 'calc(50% + 28px)',
                            width: 'calc(100% - 56px)',
                            borderTop: '2px dashed #e5e7eb',
                          }}
                        />
                      )}
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: BRAND,
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: 16,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginBottom: isMobile ? 0 : 12,
                        }}
                      >
                        {step.num}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: 8 }}>{step.icon}</div>
                        <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14, color: TEXT }}>
                          {step.title}
                        </p>
                        <p style={{ margin: 0, fontSize: 12, color: TEXT_MUTED, lineHeight: 1.5 }}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section style={sectionBlock}>
                <SectionTitle>Will Your Visa Be Approved?</SectionTitle>
                <SectionAccent />
                <div
                  style={{
                    background: 'linear-gradient(135deg,#f0f4ff,#fff0f8)',
                    borderRadius: 16,
                    padding: isMobile ? 24 : 32,
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    justifyContent: 'space-between',
                    gap: 20,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 17, fontWeight: 600, color: TEXT, maxWidth: 400 }}>
                    Check your visa eligibility instantly
                  </p>
                  <Link
                    to="/sign-in"
                    style={{
                      display: 'inline-block',
                      padding: '12px 28px',
                      background: BRAND,
                      color: '#fff',
                      borderRadius: 40,
                      fontWeight: 600,
                      fontSize: 15,
                      textDecoration: 'none',
                      flexShrink: 0,
                    }}
                  >
                    Check Eligibility
                  </Link>
                </div>
              </section>

              <section style={sectionBlock}>
                <SectionTitle>{`${country.name} Visa Rejection Reasons`}</SectionTitle>
                <SectionAccent />
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                    gap: 12,
                  }}
                >
                  {rejectionReasons.map((reason) => (
                    <div
                      key={reason}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '14px 16px',
                        background: '#fff8f8',
                        borderRadius: 10,
                        borderLeft: `3px solid ${BRAND}`,
                      }}
                    >
                      <ShieldIcon color={BRAND} size={18} />
                      <span style={{ fontSize: 14, fontWeight: 500, color: TEXT }}>{reason}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section style={sectionBlock}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 12,
                      marginBottom: 8,
                    }}
                  >
                    <LaurelIcon />
                    <span style={{ fontSize: isMobile ? 28 : 36, fontWeight: 800, color: TEXT }}>
                      4.5 Rating Across All Platforms
                    </span>
                    <LaurelIcon />
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: TEXT_MUTED }}>
                    Highest rating for any visa platform in United Arab Emirates
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 0,
                    marginBottom: 28,
                    flexWrap: 'wrap',
                  }}
                >
                  {[
                    { icon: <TrustpilotIcon />, name: 'Trustpilot' },
                    { icon: <AppleIcon />, name: 'App Store' },
                    { icon: <PlayIcon />, name: 'Google Play' },
                  ].map((p, i) => (
                    <div
                      key={p.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '0 20px',
                        borderRight: i < 2 ? `1px solid ${BORDER}` : 'none',
                      }}
                    >
                      {p.icon}
                      <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{p.name}</span>
                    </div>
                  ))}
                </div>

                <div className={isMobile ? 'visa-reviews-scroll' : undefined}>
                  <div
                    style={{
                      display: 'flex',
                      gap: 16,
                      flexDirection: isMobile ? 'row' : 'row',
                      flexWrap: isMobile ? 'nowrap' : 'wrap',
                    }}
                  >
                    {reviews.map((r) => (
                      <article
                        key={r.name}
                        style={{
                          flex: isMobile ? '0 0 280px' : '1 1 240px',
                          minWidth: isMobile ? 280 : 200,
                          background: '#fff',
                          borderRadius: 16,
                          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                          padding: 20,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              background: '#f3f4f6',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: 13,
                              color: BRAND,
                            }}
                          >
                            {r.initials}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{r.name}</p>
                            <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
                              {Array.from({ length: 5 }).map((_, i) => (
                                <StarIcon key={i} filled />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            color: TEXT_MUTED,
                            lineHeight: 1.55,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {r.text}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              </section>

              <section style={sectionBlock}>
                <SectionTitle>FAQ</SectionTitle>
                <SectionAccent />
                <div>
                  {faqs.map((faq, idx) => {
                    const open = openFaq === idx
                    return (
                      <div key={faq.q} style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <button
                          type="button"
                          onClick={() => setOpenFaq(open ? null : idx)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 16,
                            padding: '16px 0',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <span style={{ fontWeight: 700, fontSize: 15, color: TEXT }}>{faq.q}</span>
                          <ChevronIcon open={open} />
                        </button>
                        <div
                          style={{
                            maxHeight: open ? 200 : 0,
                            overflow: 'hidden',
                            transition: 'max-height 0.3s ease',
                          }}
                        >
                          <p
                            style={{
                              margin: '0 0 16px',
                              fontSize: 14,
                              color: TEXT_MUTED,
                              lineHeight: 1.6,
                            }}
                          >
                            {faq.a}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              <section style={sectionBlock}>
                <SectionTitle>Nearby Countries</SectionTitle>
                <SectionAccent />
                <div className="visa-nearby-scroll">
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
                        border: `1px solid ${BORDER}`,
                        borderRadius: 12,
                        padding: 12,
                        display: 'block',
                      }}
                    >
                      <img
                        src={`https://flagcdn.com/w80/${c.countryCode}.png`}
                        alt=""
                        width={40}
                        height={28}
                        style={{ borderRadius: 4, objectFit: 'cover', marginBottom: 8 }}
                      />
                      <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 13, color: TEXT }}>
                        {c.name}
                      </p>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: BRAND,
                          background: '#fff8f8',
                          padding: '4px 8px',
                          borderRadius: 20,
                        }}
                      >
                        {c.visaType}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>

              <section style={{ marginBottom: 0 }}>
                <SectionTitle>How We Reviewed This Page</SectionTitle>
                <SectionAccent />
                <div
                  style={{
                    background: '#f3f4f6',
                    borderRadius: 12,
                    padding: 20,
                  }}
                >
                  <p style={{ margin: '0 0 8px', fontSize: 14, color: TEXT, fontWeight: 600 }}>
                    Last reviewed: June 2026
                  </p>
                  <p style={{ margin: '0 0 16px', fontSize: 13, color: TEXT_MUTED }}>
                    Our visa experts verify all information monthly
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {['AR', 'MK', 'LS'].map((initials, i) => (
                      <div
                        key={initials}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: ['#fde8e8', '#e8eeff', '#e8f5e9'][i],
                          color: TEXT,
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginLeft: i > 0 ? -8 : 0,
                          border: '2px solid #fff',
                        }}
                      >
                        {initials}
                      </div>
                    ))}
                    <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_MUTED, marginLeft: 4 }}>
                      Atlys Research Team
                    </span>
                  </div>
                </div>
              </section>
            </div>

            {!isMobile && (
              <div style={{ flex: '0 0 30%', maxWidth: '30%', width: '100%' }}>
                <PaymentSidebar {...paymentProps} />
              </div>
            )}
          </div>
        </div>
      </main>
    </SiteLayout>
  )
}
