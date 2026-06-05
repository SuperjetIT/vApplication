import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from 'react'
import { Navbar } from '../components/Navbar'
import { SiteFooter } from '../components/SiteFooter'
import { useAuth } from '../context/AuthContext'

const BRAND = '#f93e42'
const PROCUREMENT_EMAIL = 'procurement@superjetgroup.com'
const INQUIRY_EMAIL = 'inquiry@superjetgroup.com'
const PHONE_DISPLAY = '+971 4 339 9779'
const PHONE_TEL = '+97143399779'
const WHATSAPP_DISPLAY = '+971 559641020'
const WHATSAPP_LINK = '971559641020'
const GRIEVANCE_PHONE = '555109437'

const SUBJECTS = [
  'Visa Application Query',
  'Document Requirements',
  'Payment Issue',
  'Visa Status',
  'Emergency',
  'Other',
] as const

const CONFETTI_COLORS = ['#f93e42', '#5057ea', '#ffd700', '#22c55e', '#ff6b6b', '#4ecdc4']

const glassCard: CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 24,
}

const inputBase: CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  padding: '14px 18px',
  color: '#fff',
  fontSize: 15,
  width: '100%',
  outline: 'none',
  marginBottom: 14,
  transition: 'border 0.2s, background 0.2s',
  boxSizing: 'border-box',
  fontFamily: 'system-ui, -apple-system, sans-serif',
}

function PinIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z"
        stroke={BRAND}
        strokeWidth="1.5"
      />
      <circle cx="12" cy="10" r="2.5" stroke={BRAND} strokeWidth="1.5" />
    </svg>
  )
}

function PhoneIcon({ color = '#fff' }: { color?: string }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6.5 4h3l1.5 5-2 1.5a11 11 0 005 5l1.5-2 5 1.5v3a2 2 0 01-2 2C10.5 20 4 13.5 4 6.5a2 2 0 012-2.5z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MailIcon({ color = BRAND }: { color?: string }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke={color} strokeWidth="1.5" />
      <path d="M3 7l9 6 9-6" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="#fff" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden style={{ verticalAlign: 'middle', marginRight: 8 }}>
      <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
      <path d="M12 7v5l3 2" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width={64} height={64} viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="32" cy="32" r="30" stroke="#22c55e" strokeWidth="3" />
      <path
        d="M20 32l8 8 16-16"
        stroke="#22c55e"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ConfettiLayer() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        duration: `${2 + Math.random() * 2}s`,
        delay: `${Math.random() * 2}s`,
        size: 8 + Math.floor(Math.random() * 6),
      })),
    [],
  )

  return (
    <div aria-hidden>
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'fixed',
            top: 0,
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: 2,
            zIndex: 9999,
            pointerEvents: 'none',
            animation: `confettiFall ${p.duration} ${p.delay} ease-in forwards`,
          }}
        />
      ))}
    </div>
  )
}

function getDubaiOfficeOpen(): boolean {
  const now = new Date()
  const dubaiStr = now.toLocaleString('en-US', { timeZone: 'Asia/Dubai' })
  const dubai = new Date(dubaiStr)
  const day = dubai.getDay()
  const minutes = dubai.getHours() * 60 + dubai.getMinutes()
  if (day === 0) return false
  return minutes >= 9 * 60 && minutes < 18 * 60
}

function IconCircle({
  children,
  bg,
  size = 36,
  onClick,
}: {
  children: ReactNode
  bg: string
  size?: number
  onClick?: () => void
}) {
  const inner = (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  )
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          border: 'none',
          background: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'inline-flex',
        }}
      >
        {inner}
      </button>
    )
  }
  return inner
}

function ContactRow({
  icon,
  primary,
  secondary,
  primaryColor = '#fff',
  onClick,
}: {
  icon: ReactNode
  primary: string
  secondary?: string
  primaryColor?: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        border: 'none',
        background: 'none',
        padding: 0,
        cursor: onClick ? 'pointer' : 'default',
        textAlign: 'left',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {icon}
      <span>
        <span
          style={{
            display: 'block',
            color: primaryColor,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {primary}
        </span>
        {secondary && (
          <span style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>
            {secondary}
          </span>
        )}
      </span>
    </button>
  )
}

export default function ContactPage() {
  const { isLoggedIn, avatarInitials, avatarColor } = useAuth()
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState<string>(SUBJECTS[0])
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [sendHover, setSendHover] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(getDubaiOfficeOpen)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    const tick = () => setIsOpen(getDubaiOfficeOpen())
    tick()
    const id = window.setInterval(tick, 60_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!sent) return
    setShowConfetti(true)
    const t = window.setTimeout(() => setShowConfetti(false), 4000)
    return () => window.clearTimeout(t)
  }, [sent])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phone, subject, message }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setSubmitError(data.error ?? 'Could not send your message. Please try again.')
        return
      }
      setSent(true)
    } catch {
      setSubmitError(
        'Could not reach the server. Run npm run dev (not vite alone) and try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const focusStyle = (name: string): CSSProperties =>
    focusedField === name
      ? { border: `1px solid ${BRAND}`, background: 'rgba(249,62,66,0.06)' }
      : {}

  const bentoGrid: CSSProperties = isMobile
    ? {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gridTemplateAreas: '"form" "office" "grief" "hours"',
        gap: 16,
      }
    : {
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gridTemplateAreas: `
          "form form form form form form form office office office office office"
          "form form form form form form form grief grief grief hours hours"
          "form form form form form form form grief grief grief hours hours"
        `,
        gap: 16,
      }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        input::placeholder { color: rgba(255,255,255,0.3) !important; }
        textarea::placeholder { color: rgba(255,255,255,0.3) !important; }
        select option { background: #1a1a1a; color: white; }
        @keyframes float1 {
          from { transform: translate(0, 0); }
          to { transform: translate(60px, 40px); }
        }
        @keyframes float2 {
          from { transform: translate(0, 0); }
          to { transform: translate(-40px, 60px); }
        }
        @keyframes float3 {
          from { transform: translate(-50%, -50%) scale(1); }
          to { transform: translate(-50%, -50%) scale(1.3); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes checkPop {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>

      {/* Animated orbs */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(249,62,66,0.3), transparent)',
          top: -100,
          left: -100,
          zIndex: 0,
          pointerEvents: 'none',
          animation: 'float1 15s infinite alternate',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'fixed',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(80,87,234,0.2), transparent)',
          bottom: -100,
          right: -100,
          zIndex: 0,
          pointerEvents: 'none',
          animation: 'float2 12s infinite alternate',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'fixed',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(249,62,66,0.15), transparent)',
          top: '50%',
          left: '50%',
          zIndex: 0,
          pointerEvents: 'none',
          animation: 'float3 18s infinite alternate',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
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
        <section
          style={{
            textAlign: 'center',
            paddingTop: isMobile ? 48 : 80,
            paddingBottom: 48,
            paddingLeft: 24,
            paddingRight: 24,
            animation: 'fadeUp 0.7s ease forwards',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              background: 'rgba(249,62,66,0.15)',
              border: '1px solid rgba(249,62,66,0.3)',
              borderRadius: 40,
              padding: '6px 16px',
              color: BRAND,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            ✦ We respond within 24 hours
          </span>
          <h1
            style={{
              margin: '20px 0 0',
              fontSize: isMobile ? 36 : 64,
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
            }}
          >
            Let&apos;s{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #f93e42, #ff8c69)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Talk
            </span>
          </h1>
          <p
            style={{
              margin: '16px auto 0',
              color: 'rgba(255,255,255,0.5)',
              fontSize: isMobile ? 15 : 18,
              maxWidth: 480,
              lineHeight: 1.6,
            }}
          >
            Have questions about your visa? We&apos;re one message away.
          </p>
        </section>

        {/* Bento grid */}
        <div
          style={{
            ...bentoGrid,
            maxWidth: 1100,
            margin: '0 auto',
            padding: isMobile ? '0 16px 64px' : '0 24px 80px',
          }}
        >
          {/* Form card */}
          <div
            style={{
              gridArea: 'form',
              ...glassCard,
              background: 'rgba(255,255,255,0.06)',
              padding: isMobile ? 20 : 36,
              animation: 'fadeUp 0.8s ease 0.1s both',
            }}
          >
            {sent ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 360,
                  textAlign: 'center',
                  padding: '24px 0',
                }}
              >
                {showConfetti && <ConfettiLayer />}
                <div style={{ animation: 'checkPop 0.4s ease forwards' }}>
                  <CheckIcon />
                </div>
                <h2 style={{ margin: '24px 0 8px', color: '#fff', fontWeight: 700, fontSize: 24 }}>
                  Message Sent! 🎉
                </h2>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>
                  We&apos;ll be in touch shortly.
                </p>
              </div>
            ) : (
              <>
                <h2 style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 22 }}>Send a Message</h2>
                <p
                  style={{
                    margin: '8px 0 28px',
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: 13,
                  }}
                >
                  Goes directly to {PROCUREMENT_EMAIL}
                </p>
                <form onSubmit={handleSubmit}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                      gap: 14,
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      style={{ ...inputBase, ...focusStyle('name'), marginBottom: isMobile ? 14 : 0 }}
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      style={{ ...inputBase, ...focusStyle('email'), marginBottom: 0 }}
                      required
                    />
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                      gap: 14,
                      marginTop: 14,
                    }}
                  >
                    <input
                      type="tel"
                      placeholder="+971 50 000 0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      style={{ ...inputBase, ...focusStyle('phone'), marginBottom: isMobile ? 14 : 0 }}
                    />
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      onFocus={() => setFocusedField('subject')}
                      onBlur={() => setFocusedField(null)}
                      style={{
                        ...inputBase,
                        ...focusStyle('subject'),
                        marginBottom: 0,
                        cursor: 'pointer',
                        appearance: 'auto',
                      }}
                    >
                      {SUBJECTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    placeholder="Your message…"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onFocus={() => setFocusedField('message')}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      ...inputBase,
                      ...focusStyle('message'),
                      resize: 'none',
                      marginTop: 14,
                      marginBottom: 20,
                    }}
                    required
                  />
                  {submitError && (
                    <p
                      role="alert"
                      style={{
                        margin: '0 0 14px',
                        padding: '12px 14px',
                        borderRadius: 12,
                        background: 'rgba(239,68,68,0.12)',
                        border: '1px solid rgba(239,68,68,0.25)',
                        color: '#fca5a5',
                        fontSize: 14,
                        lineHeight: 1.5,
                      }}
                    >
                      {submitError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    onMouseEnter={() => setSendHover(true)}
                    onMouseLeave={() => setSendHover(false)}
                    style={{
                      width: '100%',
                      padding: 16,
                      background: submitting
                        ? 'rgba(249,62,66,0.5)'
                        : 'linear-gradient(135deg, #f93e42, #ff6b6b)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 16,
                      borderRadius: 12,
                      border: 'none',
                      cursor: submitting ? 'wait' : 'pointer',
                      boxShadow: sendHover && !submitting
                        ? '0 12px 40px rgba(249,62,66,0.45)'
                        : '0 8px 32px rgba(249,62,66,0.35)',
                      transform: sendHover && !submitting ? 'translateY(-2px)' : 'translateY(0)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      opacity: submitting ? 0.85 : 1,
                    }}
                  >
                    {submitting ? 'Sending…' : 'Send Message →'}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Office card */}
          <div
            style={{
              gridArea: 'office',
              ...glassCard,
              padding: 28,
              animation: 'fadeUp 0.8s ease 0.2s both',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'rgba(249,62,66,0.15)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PinIcon />
              </span>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>Dubai HQ</span>
            </div>
            <p
              style={{
                margin: '12px 0 0',
                color: 'rgba(255,255,255,0.5)',
                fontSize: 14,
                lineHeight: 1.9,
              }}
            >
              Office 206, Fifty One @ Business Bay,
              <br />
              Marasi Drive, Business Bay,
              <br />
              Dubai, United Arab Emirates
            </p>
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <ContactRow
                icon={<IconCircle bg="rgba(255,255,255,0.1)"><PhoneIcon /></IconCircle>}
                primary={PHONE_DISPLAY}
                secondary="Call us"
                onClick={() => { window.location.href = `tel:${PHONE_TEL}` }}
              />
              <ContactRow
                icon={<IconCircle bg="rgba(255,255,255,0.1)"><MailIcon /></IconCircle>}
                primary={INQUIRY_EMAIL}
                primaryColor={BRAND}
                onClick={() => { window.location.href = `mailto:${INQUIRY_EMAIL}` }}
              />
              <ContactRow
                icon={
                  <IconCircle bg="linear-gradient(135deg, #25d366, #128c7e)">
                    <WhatsAppIcon />
                  </IconCircle>
                }
                primary={WHATSAPP_DISPLAY}
                onClick={() => { window.open(`https://wa.me/${WHATSAPP_LINK}`, '_blank', 'noopener,noreferrer') }}
              />
            </div>
            <div
              style={{
                marginTop: 20,
                borderRadius: 16,
                overflow: 'hidden',
                height: 160,
              }}
            >
              <iframe
                title="Super Visa Dubai office map"
                src="https://maps.google.com/maps?q=Fifty+One+Business+Bay+Dubai&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height={160}
                style={{
                  border: 'none',
                  filter: 'grayscale(20%) contrast(1.1)',
                  display: 'block',
                }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          {/* Grievance card */}
          <div
            style={{
              gridArea: 'grief',
              ...glassCard,
              padding: 28,
              animation: 'fadeUp 0.8s ease 0.3s both',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                background: 'rgba(249,62,66,0.15)',
                color: BRAND,
                borderRadius: 20,
                padding: '4px 12px',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Escalations
            </span>
            <h3 style={{ margin: '8px 0 4px', color: '#fff', fontWeight: 700, fontSize: 17 }}>
              Grievance Redressal
            </h3>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              For formal complaints &amp; escalations
            </p>
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
              <span
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f93e42, #5057ea)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 18,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                AB
              </span>
              <div>
                <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 15 }}>Andrew Barra</p>
                <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                  Grievance Officer
                </p>
              </div>
            </div>
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ContactRow
                icon={<IconCircle bg="rgba(255,255,255,0.1)"><PhoneIcon color="rgba(255,255,255,0.7)" /></IconCircle>}
                primary={GRIEVANCE_PHONE}
                primaryColor="rgba(255,255,255,0.7)"
                onClick={() => { window.location.href = `tel:${GRIEVANCE_PHONE}` }}
              />
              <ContactRow
                icon={<IconCircle bg="rgba(255,255,255,0.1)"><MailIcon /></IconCircle>}
                primary={INQUIRY_EMAIL}
                primaryColor={BRAND}
                onClick={() => { window.location.href = `mailto:${INQUIRY_EMAIL}` }}
              />
            </div>
            <span
              style={{
                display: 'inline-block',
                marginTop: 16,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: 12,
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              ⏱ Responds within 48 hours
            </span>
          </div>

          {/* Hours card */}
          <div
            style={{
              gridArea: 'hours',
              ...glassCard,
              padding: 24,
              animation: 'fadeUp 0.8s ease 0.4s both',
            }}
          >
            <p style={{ margin: '0 0 16px', color: '#fff', fontWeight: 700, fontSize: 15 }}>
              <ClockIcon />
              Working Hours
            </p>
            <div style={{ marginBottom: 12 }}>
              <p style={{ margin: '0 0 4px', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                Monday – Saturday
              </p>
              <p style={{ margin: 0, color: '#fff', fontSize: 14, fontWeight: 500 }}>
                9:00 AM – 6:00 PM GST
              </p>
            </div>
            <div
              style={{
                height: 1,
                background: 'rgba(255,255,255,0.06)',
                margin: '12px 0',
              }}
            />
            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: '0 0 4px', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                Sunday
              </p>
              <p style={{ margin: 0, color: BRAND, fontSize: 14, fontWeight: 500 }}>
                Closed
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: isOpen ? '#22c55e' : '#ef4444',
                  animation: 'pulse 2s infinite',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: isOpen ? '#22c55e' : '#ef4444',
                }}
              >
                {isOpen ? 'Open Now' : 'Closed'}
              </span>
            </div>
          </div>
        </div>

        <SiteFooter isMobile={isMobile} />
      </div>
    </div>
  )
}
