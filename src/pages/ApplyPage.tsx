import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCitizenship } from '../context/CitizenshipContext'
import { getCountry } from '../data/countries'
import { flagUrl } from '../utils/flags'

const BRAND = '#f93e42'
const ACCENT = '#5057ea'
const BG_GRADIENT =
  'linear-gradient(135deg, #f5e6ff 0%, #ffeaea 30%, #fff0e6 60%, #e6f0ff 100%)'

type ApplyStep = 'travelers' | 'docs' | 'appt' | 'checkout'

const STEPS: ApplyStep[] = ['travelers', 'docs', 'appt', 'checkout']
const STEP_PROGRESS: Record<ApplyStep, number> = {
  travelers: 0,
  docs: 25,
  appt: 50,
  checkout: 75,
}

const NEXT_STEP: Record<ApplyStep, ApplyStep | null> = {
  travelers: 'docs',
  docs: 'appt',
  appt: 'checkout',
  checkout: null,
}

type TravelerForm = {
  firstName: string
  lastName: string
  dateOfBirth: string
  passportNumber: string
  nationality: string
}

function emptyTraveler(nationality: string): TravelerForm {
  return {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    passportNumber: '',
    nationality,
  }
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

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function isTravelerComplete(t: TravelerForm): boolean {
  return Boolean(
    t.firstName.trim() &&
      t.lastName.trim() &&
      t.dateOfBirth &&
      t.passportNumber.trim() &&
      t.nationality.trim(),
  )
}

function documentDescription(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('passport')) return 'Must be valid for at least 6 months from travel date.'
  if (lower.includes('photo')) return 'Recent passport-size photo on a plain background.'
  if (lower.includes('bank')) return 'Last 3–6 months showing sufficient funds.'
  if (lower.includes('emirates')) return 'Valid UAE Emirates ID copy (front and back).'
  return 'Upload a clear, legible copy of this document.'
}

function PeopleIcon({ active }: { active: boolean }) {
  const c = active ? ACCENT : '#ccc'
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3" stroke={c} strokeWidth="1.5" />
      <circle cx="17" cy="9" r="2.5" stroke={c} strokeWidth="1.5" />
      <path
        d="M3 20c0-3 2.5-5 6-5s6 2 6 5M14 20c0-2.2 1.8-4 4-4"
        stroke={c}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function DocsIcon({ active }: { active: boolean }) {
  const c = active ? ACCENT : '#ccc'
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="3" width="14" height="18" rx="2" stroke={c} strokeWidth="1.5" />
      <path d="M9 8h6M9 12h6M9 16h4" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CalendarStepIcon({ active }: { active: boolean }) {
  const c = active ? ACCENT : '#ccc'
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="15" rx="2" stroke={c} strokeWidth="1.5" />
      <path d="M8 3v4M16 3v4M4 10h16" stroke={c} strokeWidth="1.5" />
    </svg>
  )
}

function CartIcon({ active }: { active: boolean }) {
  const c = active ? ACCENT : '#ccc'
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6h15l-1.5 9H8L6 6zM6 6L5 3H2M9 20a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"
        stroke={c}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ShieldSmall() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"
        stroke={BRAND}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke={BRAND} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z"
        stroke="#666"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ApplyCalendar({
  label,
  selected,
  onSelect,
  minDate,
}: {
  label: string
  selected: Date | null
  onSelect: (date: Date) => void
  minDate?: Date
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth())
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear())
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)

  const monthName = new Date(viewYear, viewMonth).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const startOffset = firstDay === 0 ? 6 : firstDay - 1
  const cells: (number | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const isSameDay = (a: Date, day: number) =>
    a.getFullYear() === viewYear && a.getMonth() === viewMonth && a.getDate() === day

  const isDisabled = (day: number) => {
    const d = new Date(viewYear, viewMonth, day)
    d.setHours(0, 0, 0, 0)
    if (d < today) return true
    if (minDate && d < minDate) return true
    return false
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 8px 40px rgba(249,62,66,0.12)',
        border: '1px solid rgba(249,62,66,0.1)',
        padding: 16,
        width: '100%',
        maxWidth: 320,
      }}
    >
      <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: 14, color: '#333' }}>{label}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => {
            if (viewMonth === 0) {
              setViewMonth(11)
              setViewYear((y) => y - 1)
            } else setViewMonth((m) => m - 1)
          }}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18 }}
        >
          ‹
        </button>
        <strong style={{ fontSize: 15 }}>{monthName}</strong>
        <button
          type="button"
          onClick={() => {
            if (viewMonth === 11) {
              setViewMonth(0)
              setViewYear((y) => y + 1)
            } else setViewMonth((m) => m + 1)
          }}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18 }}
        >
          ›
        </button>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
          marginBottom: 8,
          fontSize: 12,
          fontWeight: 600,
          color: BRAND,
          textAlign: 'center',
        }}
      >
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((day, idx) => {
          if (!day) return <span key={`empty-${idx}`} />
          const disabled = isDisabled(day)
          const isSelected = selected ? isSameDay(selected, day) : false
          const isHovered = hoveredDay === day && !isSelected && !disabled
          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(new Date(viewYear, viewMonth, day))}
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
              style={{
                width: 36,
                height: 36,
                border: 'none',
                borderRadius: '50%',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontSize: 14,
                background: isSelected ? BRAND : isHovered ? '#fff0f0' : 'transparent',
                color: disabled ? '#ddd' : isSelected ? '#fff' : isHovered ? BRAND : '#111827',
                opacity: disabled ? 0.4 : 1,
              }}
            >
              {day}
            </button>
          )
        })}
      </div>
      {selected && (
        <p style={{ margin: '12px 0 0', fontSize: 13, color: '#666', textAlign: 'center' }}>
          Selected: <strong>{formatDateLabel(selected)}</strong>
        </p>
      )}
    </div>
  )
}

function ContinueButton({
  enabled,
  label,
  onClick,
  fullWidth,
}: {
  enabled: boolean
  label: string
  onClick: () => void
  fullWidth?: boolean
}) {
  return (
    <div style={{ textAlign: 'center', marginTop: 32 }}>
      <button
        type="button"
        disabled={!enabled}
        onClick={onClick}
        style={{
          background: enabled ? ACCENT : '#888',
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          padding: 16,
          width: fullWidth ? '100%' : 400,
          maxWidth: '90%',
          fontSize: 16,
          fontWeight: 600,
          cursor: enabled ? 'pointer' : 'not-allowed',
        }}
      >
        {label}
      </button>
    </div>
  )
}

function SidebarItem({
  step,
  current,
  label,
  icon,
  onClick,
}: {
  step: ApplyStep
  current: ApplyStep
  label: string
  icon: ReactNode
  onClick: () => void
}) {
  const active = step === current
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        padding: '16px 0',
        width: '100%',
      }}
    >
      {icon}
      <span
        style={{
          marginTop: 6,
          fontSize: 11,
          fontWeight: 600,
          color: active ? ACCENT : '#ccc',
        }}
      >
        {label}
      </span>
    </button>
  )
}

export default function ApplyPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { citizenship } = useCitizenship()
  const { isLoggedIn } = useAuth()
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  const destination = searchParams.get('destination') ?? ''
  const optionId = searchParams.get('option') ?? 'single'
  const stepParam = searchParams.get('step') ?? 'travelers'
  const step: ApplyStep = STEPS.includes(stepParam as ApplyStep) ? (stepParam as ApplyStep) : 'travelers'

  const country = getCountry(destination)
  const selectedOption = country?.visaOptions.find((o) => o.id === optionId) ?? country?.visaOptions[0]

  const [travelers, setTravelers] = useState<TravelerForm[]>(() => [emptyTraveler(citizenship)])
  const [uploads, setUploads] = useState<Record<string, string>>({})
  const [departureDate, setDepartureDate] = useState<Date | null>(null)
  const [returnDate, setReturnDate] = useState<Date | null>(null)
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    setTravelers((prev) =>
      prev.map((t, i) => (i === 0 && !t.nationality ? { ...t, nationality: citizenship } : t)),
    )
  }, [citizenship])

  const progress = STEP_PROGRESS[step]

  const applyUrl = (nextStep: ApplyStep) =>
    `/apply?destination=${encodeURIComponent(destination)}&option=${encodeURIComponent(optionId)}&step=${nextStep}`

  const travelersComplete = travelers.length > 0 && travelers.every(isTravelerComplete)

  const requiredDocs = country?.documents.length ? country.documents : ['Passport', 'Photo']
  const docsComplete = requiredDocs.every((doc) => uploads[doc])

  const apptComplete = Boolean(departureDate && returnDate)

  const pricing = useMemo(() => {
    if (!selectedOption) return { gov: 0, processing: 0, discount: 0, total: 0 }
    const gov = parseFeeAed(selectedOption.fee)
    const processing = parseFeeAed(selectedOption.processingFee)
    const count = travelers.length
    const subtotal = (gov + processing) * count
    const discount = count >= 2 ? Math.round(subtotal * 0.05) : 0
    return {
      gov,
      processing,
      discount,
      total: subtotal - discount,
    }
  }, [selectedOption, travelers.length])

  const visaReadyBy = useMemo(() => {
    if (!selectedOption) return '—'
    const days = parseProcessingDaysMax(selectedOption.processingTime)
    const d = new Date()
    d.setDate(d.getDate() + days)
    return formatDateLabel(d)
  }, [selectedOption])

  if (!country || !selectedOption) {
    return <Navigate to="/" replace />
  }

  const updateTraveler = (index: number, field: keyof TravelerForm, value: string) => {
    setTravelers((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)))
  }

  const addTraveler = () => {
    setTravelers((prev) => [...prev, emptyTraveler(citizenship)])
  }

  const handleFileSelect = (docName: string, file: File | undefined) => {
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext ?? '')) return
    setUploads((prev) => ({ ...prev, [docName]: file.name }))
  }

  const handleContinue = () => {
    const next = NEXT_STEP[step]
    if (next) navigate(applyUrl(next))
  }

  const inputStyle = {
    width: '100%',
    border: '1px solid #eee',
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 14,
    boxSizing: 'border-box' as const,
    marginTop: 6,
  }

  const labelStyle = { fontSize: 13, fontWeight: 600 as const, color: '#333' }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: BG_GRADIENT,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          padding: isMobile ? '12px 16px' : '16px 24px',
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            justifySelf: 'start',
            border: 'none',
            background: 'none',
            fontSize: 15,
            fontWeight: 600,
            color: '#333',
            cursor: 'pointer',
            padding: '8px 0',
          }}
        >
          ← Back
        </button>

        <div style={{ textAlign: 'center', minWidth: 120 }}>
          {isMobile && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              {STEPS.map((s) => (
                <span
                  key={s}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: s === step ? ACCENT : '#ddd',
                  }}
                />
              ))}
            </div>
          )}
          <p style={{ margin: 0, fontSize: 11, color: '#888', letterSpacing: '0.06em' }}>
            {progress}% COMPLETED
          </p>
          <div
            style={{
              marginTop: 6,
              height: 3,
              width: isMobile ? 120 : 160,
              background: '#e5e7eb',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.max(progress, 4)}%`,
                background: ACCENT,
                borderRadius: 2,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        <Link
          to={isLoggedIn ? '/user/me' : '/'}
          style={{
            justifySelf: 'end',
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '1px solid #eee',
            background: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
          }}
          aria-label="Home"
        >
          <HomeIcon />
        </Link>
      </header>

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {!isMobile && (
          <aside
            style={{
              position: 'fixed',
              left: 0,
              top: 72,
              bottom: 0,
              width: 60,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.5)',
              borderRight: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <SidebarItem
              step="travelers"
              current={step}
              label="Travelers"
              icon={<PeopleIcon active={step === 'travelers'} />}
              onClick={() => navigate(applyUrl('travelers'))}
            />
            <SidebarItem
              step="docs"
              current={step}
              label="Docs"
              icon={<DocsIcon active={step === 'docs'} />}
              onClick={() => navigate(applyUrl('docs'))}
            />
            <SidebarItem
              step="appt"
              current={step}
              label="Appt"
              icon={<CalendarStepIcon active={step === 'appt'} />}
              onClick={() => navigate(applyUrl('appt'))}
            />
            <SidebarItem
              step="checkout"
              current={step}
              label="Checkout"
              icon={<CartIcon active={step === 'checkout'} />}
              onClick={() => navigate(applyUrl('checkout'))}
            />
          </aside>
        )}

        <main
          style={{
            flex: 1,
            marginLeft: isMobile ? 0 : 60,
            padding: isMobile ? '16px 16px 48px' : '24px 32px 64px',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: '100%', maxWidth: 560 }}>
            {step === 'travelers' && (
              <>
                {travelers.length < 2 && (
                  <div style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        background: '#f0fff4',
                        border: '1px solid #c3e6cb',
                        color: '#2d6a4f',
                        borderRadius: 40,
                        padding: '8px 20px',
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      ✓ Add 1 more traveller to unlock 5% off
                    </span>
                  </div>
                )}
                <h1
                  style={{
                    margin: '32px 0 8px',
                    fontSize: 24,
                    fontWeight: 700,
                    textAlign: 'center',
                    color: '#111',
                  }}
                >
                  Who&apos;s going on this trip to {country.name}?
                </h1>
                <p style={{ margin: '0 0 24px', color: '#888', fontSize: 14, textAlign: 'center' }}>
                  You can add all travellers or continue solo
                </p>

                <div
                  style={{
                    borderBottom: '2px dashed #ddd',
                    minHeight: 200,
                    paddingBottom: 24,
                  }}
                >
                  {travelers.map((traveler, index) => (
                    <div
                      key={index}
                      style={{
                        background: '#fff',
                        borderRadius: 16,
                        padding: 20,
                        marginBottom: 16,
                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                      }}
                    >
                      <p style={{ margin: '0 0 16px', fontWeight: 700, fontSize: 15 }}>
                        Traveller {index + 1}
                      </p>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                          gap: 16,
                        }}
                      >
                        <div>
                          <label style={labelStyle}>First Name</label>
                          <input
                            style={inputStyle}
                            value={traveler.firstName}
                            onChange={(e) => updateTraveler(index, 'firstName', e.target.value)}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Last Name</label>
                          <input
                            style={inputStyle}
                            value={traveler.lastName}
                            onChange={(e) => updateTraveler(index, 'lastName', e.target.value)}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Date of Birth</label>
                          <input
                            type="date"
                            style={inputStyle}
                            value={traveler.dateOfBirth}
                            onChange={(e) => updateTraveler(index, 'dateOfBirth', e.target.value)}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Passport Number</label>
                          <input
                            style={inputStyle}
                            value={traveler.passportNumber}
                            onChange={(e) => updateTraveler(index, 'passportNumber', e.target.value)}
                          />
                        </div>
                        <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                          <label style={labelStyle}>Nationality</label>
                          <input
                            style={inputStyle}
                            value={traveler.nationality}
                            onChange={(e) => updateTraveler(index, 'nationality', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addTraveler}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: ACCENT,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '8px 0',
                    }}
                  >
                    + Add Traveller
                  </button>
                </div>

                <ContinueButton
                  enabled={travelersComplete}
                  label="Continue →"
                  onClick={handleContinue}
                  fullWidth={isMobile}
                />
              </>
            )}

            {step === 'docs' && (
              <>
                <h1 style={{ margin: '32px 0 8px', fontSize: 24, fontWeight: 700, textAlign: 'center' }}>
                  Upload your documents
                </h1>
                <p style={{ margin: '0 0 24px', color: '#888', fontSize: 14, textAlign: 'center' }}>
                  Required for {country.name} visa application
                </p>

                {requiredDocs.map((docName) => (
                  <div
                    key={docName}
                    style={{
                      background: '#fff',
                      borderRadius: 16,
                      padding: 20,
                      marginBottom: 16,
                      border: '2px dashed #eee',
                    }}
                  >
                    <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15 }}>{docName}</p>
                    <p style={{ margin: '0 0 16px', fontSize: 13, color: '#888' }}>
                      {documentDescription(docName)}
                    </p>
                    <input
                      ref={(el) => {
                        fileInputRefs.current[docName] = el
                      }}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileSelect(docName, e.target.files?.[0])}
                    />
                    {uploads[docName] ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#15803d', fontWeight: 700 }}>✓</span>
                        <span style={{ fontSize: 14, color: '#333' }}>{uploads[docName]}</span>
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[docName]?.click()}
                          style={{
                            marginLeft: 'auto',
                            border: 'none',
                            background: 'none',
                            color: ACCENT,
                            fontSize: 13,
                            cursor: 'pointer',
                          }}
                        >
                          Replace
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[docName]?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault()
                          handleFileSelect(docName, e.dataTransfer.files?.[0])
                        }}
                        style={{
                          width: '100%',
                          padding: 24,
                          border: '1px dashed #ddd',
                          borderRadius: 12,
                          background: '#fafafa',
                          color: '#888',
                          fontSize: 14,
                          cursor: 'pointer',
                        }}
                      >
                        Click to upload or drag &amp; drop
                        <br />
                        <span style={{ fontSize: 12 }}>PDF, JPG, PNG</span>
                      </button>
                    )}
                  </div>
                ))}

                <ContinueButton
                  enabled={docsComplete}
                  label="Continue →"
                  onClick={handleContinue}
                  fullWidth={isMobile}
                />
              </>
            )}

            {step === 'appt' && (
              <>
                <h1 style={{ margin: '32px 0 8px', fontSize: 24, fontWeight: 700, textAlign: 'center' }}>
                  Select your travel dates
                </h1>
                <p style={{ margin: '0 0 24px', color: '#888', fontSize: 14, textAlign: 'center' }}>
                  Choose departure and return dates for your trip
                </p>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: 20,
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <ApplyCalendar
                    label="Departure date"
                    selected={departureDate}
                    onSelect={(d) => {
                      setDepartureDate(d)
                      if (returnDate && returnDate < d) setReturnDate(null)
                    }}
                  />
                  <ApplyCalendar
                    label="Return date"
                    selected={returnDate}
                    onSelect={setReturnDate}
                    minDate={departureDate ?? undefined}
                  />
                </div>

                <p
                  style={{
                    margin: '24px 0 0',
                    textAlign: 'center',
                    fontSize: 14,
                    color: '#666',
                    background: '#fff',
                    borderRadius: 12,
                    padding: '12px 16px',
                  }}
                >
                  Your visa will be ready by <strong style={{ color: '#111' }}>{visaReadyBy}</strong>
                </p>

                <ContinueButton
                  enabled={apptComplete}
                  label="Continue →"
                  onClick={handleContinue}
                  fullWidth={isMobile}
                />
              </>
            )}

            {step === 'checkout' && (
              <>
                <h1 style={{ margin: '32px 0 24px', fontSize: 24, fontWeight: 700, textAlign: 'center' }}>
                  Review and pay
                </h1>

                <div
                  style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: 24,
                    marginBottom: 24,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <img
                      src={flagUrl(country.countryCode, 40)}
                      alt=""
                      width={40}
                      height={28}
                      style={{ borderRadius: 4, objectFit: 'cover' }}
                    />
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>{country.name}</p>
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>{selectedOption.label}</p>
                    </div>
                  </div>

                  <div style={{ fontSize: 14, color: '#555', lineHeight: 2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Travelers</span>
                      <span>{travelers.length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Government fee × {travelers.length}</span>
                      <span>AED {pricing.gov * travelers.length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Processing fee × {travelers.length}</span>
                      <span>AED {pricing.processing * travelers.length}</span>
                    </div>
                    {pricing.discount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d' }}>
                        <span>Discount (5% off)</span>
                        <span>− AED {pricing.discount}</span>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 16,
                      borderTop: '1px solid #eee',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 16 }}>Total</span>
                    <span style={{ fontWeight: 700, fontSize: 24, color: BRAND }}>AED {pricing.total}</span>
                  </div>
                </div>

                <div
                  style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: 24,
                    marginBottom: 16,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  }}
                >
                  <p style={{ margin: '0 0 16px', fontWeight: 700, fontSize: 15 }}>Payment</p>
                  <label style={labelStyle}>Card number</label>
                  <input
                    style={{ ...inputStyle, marginBottom: 12 }}
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Expiry</label>
                      <input
                        style={inputStyle}
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>CVV</label>
                      <input
                        style={inputStyle}
                        placeholder="123"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/')}
                  style={{
                    width: '100%',
                    background: BRAND,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Pay AED {pricing.total}
                </button>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginTop: 16,
                  }}
                >
                  <ShieldSmall />
                  <span style={{ fontSize: 13, color: '#666' }}>Supervisa Protect — 100% refund if rejected</span>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
