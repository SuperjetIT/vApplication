import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCitizenship } from '../context/CitizenshipContext'
import { ALL_CITIZENSHIPS } from '../data/citizenships'
import { getCountry, type Country, type VisaOption } from '../data/countries'
import { flagUrl } from '../utils/flags'

const BRAND = '#f93e42'
const ACCENT = '#5057ea'
const GREEN = '#22c55e'
const BG_GRADIENT =
  'linear-gradient(135deg, #f5e6ff 0%, #ffeaea 30%, #fff0e6 60%, #e6f0ff 100%)'

const STRIPE_PUBLISHABLE_KEY =
  'pk_test_51OxampleTestKeyReplaceWithYourActualStripeTestPublishableKey'

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)

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

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

type TravelerForm = {
  firstName: string
  lastName: string
  dateOfBirth: string
  passportNumber: string
  nationality: string
}

type UploadEntry = {
  fileName: string
  sizeMb: string
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

function parseValidityDays(validity: string): number {
  const v = validity.toLowerCase()
  const years = v.match(/(\d+)\s*years?/)
  if (years) return Number.parseInt(years[1], 10) * 365
  const year = v.match(/(\d+)\s*year/)
  if (year) return Number.parseInt(year[1], 10) * 365
  const days = v.match(/(\d+)\s*days?/)
  if (days) return Number.parseInt(days[1], 10)
  const months = v.match(/(\d+)\s*months?/)
  if (months) return Number.parseInt(months[1], 10) * 30
  return 30
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function parseDobDisplay(value: string): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) return parsed
  const parts = value.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/)
  if (parts) {
    const d = new Date(`${parts[2]} ${parts[3]} ${parts[1]}`)
    if (!Number.isNaN(d.getTime())) return d
  }
  return null
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return startOfDay(d)
}

function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return `(${mb < 0.1 ? '<0.1' : mb.toFixed(1)} MB)`
}

function isTravelerComplete(t: TravelerForm): boolean {
  return Boolean(
    t.firstName.trim() &&
      t.lastName.trim() &&
      t.dateOfBirth &&
      t.passportNumber.trim() &&
      t.nationality.trim() &&
      validatePassportNumber(t.passportNumber, t.nationality).valid,
  )
}

const passportLengthRules: Record<string, { min: number; max: number; pattern: string }> = {
  India: { min: 8, max: 8, pattern: '[A-Z][0-9]{7}' },
  Pakistan: { min: 8, max: 9, pattern: '[A-Z]{2}[0-9]{7}' },
  UAE: { min: 9, max: 9, pattern: '[A-Z0-9]{9}' },
  UK: { min: 9, max: 9, pattern: '[0-9]{9}' },
  USA: { min: 9, max: 9, pattern: '[A-Z0-9]{9}' },
  Philippines: { min: 7, max: 8, pattern: '[A-Z][0-9]{6,7}' },
  Bangladesh: { min: 8, max: 9, pattern: '[A-Z]{2}[0-9]{7}' },
  Kenya: { min: 8, max: 9, pattern: '[A-Z][0-9]{7,8}' },
  Egypt: { min: 9, max: 9, pattern: '[A-Z][0-9]{8}' },
  Nigeria: { min: 8, max: 9, pattern: '[A-Z][0-9]{7,8}' },
  'Sri Lanka': { min: 8, max: 9, pattern: '[A-Z][0-9]{7,8}' },
  Nepal: { min: 8, max: 8, pattern: '[A-Z][0-9]{7}' },
  default: { min: 6, max: 20, pattern: '[A-Z0-9]+' },
}

const nationalityPassportAliases: Record<string, string> = {
  'United Arab Emirates': 'UAE',
  'United States': 'USA',
  'United Kingdom': 'UK',
}

function getPassportRule(nationality: string) {
  const trimmed = nationality.trim()
  const key = nationalityPassportAliases[trimmed] ?? trimmed
  return passportLengthRules[key] ?? passportLengthRules.default
}

function validatePassportNumber(
  value: string,
  nationality: string,
): { valid: boolean; error: string | null } {
  const trimmed = value.trim()
  if (!trimmed) return { valid: false, error: null }
  const rule = getPassportRule(nationality)
  const len = trimmed.length
  if (len < rule.min || len > rule.max) {
    return {
      valid: false,
      error: `Invalid passport number for ${nationality || 'this'} passport (expected ${rule.min}-${rule.max} characters)`,
    }
  }
  const regex = new RegExp(`^${rule.pattern}$`)
  if (!regex.test(trimmed)) {
    return {
      valid: false,
      error: `Invalid passport number for ${nationality || 'this'} passport (expected ${rule.min}-${rule.max} characters)`,
    }
  }
  return { valid: true, error: null }
}

function PassportNumberField({
  value,
  nationality,
  onChange,
  inputStyle,
  labelStyle,
}: {
  value: string
  nationality: string
  onChange: (value: string) => void
  inputStyle: CSSProperties
  labelStyle: CSSProperties
}) {
  const [touched, setTouched] = useState(false)
  const rule = getPassportRule(nationality)
  const validation = validatePassportNumber(value, nationality)
  const showError = touched && value.trim() && !validation.valid && validation.error

  return (
    <div>
      <label style={labelStyle}>Passport Number</label>
      <div style={{ position: 'relative' }}>
        <input
          style={{ ...inputStyle, paddingRight: validation.valid && value.trim() ? 36 : undefined }}
          value={value}
          maxLength={rule.max}
          onChange={(e) =>
            onChange(e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase())
          }
          onBlur={() => setTouched(true)}
        />
        {validation.valid && value.trim() && (
          <span
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              marginTop: 3,
              color: GREEN,
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            ✓
          </span>
        )}
      </div>
      <p style={{ margin: '6px 0 0', fontSize: 11, color: '#888' }}>
        Passport format: {rule.pattern}
      </p>
      {showError && (
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#dc2626' }}>{validation.error}</p>
      )}
    </div>
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

function getUploadRules(docName: string) {
  const lower = docName.toLowerCase()
  if (lower.includes('photo')) {
    return {
      accept: '.jpg,.jpeg,.png,image/jpeg,image/png',
      mimeTypes: ['image/jpeg', 'image/png'],
      extensions: ['jpg', 'jpeg', 'png'],
      maxBytes: 10 * 1024 * 1024,
      typeError: 'Only JPG, PNG files accepted for photo',
      sizeError: 'Photo must be less than 10MB',
    }
  }
  if (lower.includes('bank')) {
    return {
      accept: '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png',
      mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
      extensions: ['pdf', 'jpg', 'jpeg', 'png'],
      maxBytes: 10 * 1024 * 1024,
      typeError: 'Only PDF, JPG, PNG files accepted',
      sizeError: 'File must be less than 10MB',
    }
  }
  if (lower.includes('passport')) {
    return {
      accept: '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png',
      mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
      extensions: ['pdf', 'jpg', 'jpeg', 'png'],
      maxBytes: 15 * 1024 * 1024,
      typeError: 'Only PDF, JPG, PNG files accepted',
      sizeError: 'File must be less than 15MB',
    }
  }
  return {
    accept: '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png',
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    extensions: ['pdf', 'jpg', 'jpeg', 'png'],
    maxBytes: 10 * 1024 * 1024,
    typeError: 'Only PDF, JPG, PNG files accepted',
    sizeError: 'File must be less than 10MB',
  }
}

function CheckIconSmall() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 6L9 17l-5-5"
        stroke={GREEN}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PeopleIcon({ color }: { color: string }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3" stroke={color} strokeWidth="1.5" />
      <circle cx="17" cy="9" r="2.5" stroke={color} strokeWidth="1.5" />
      <path
        d="M3 20c0-3 2.5-5 6-5s6 2 6 5M14 20c0-2.2 1.8-4 4-4"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function DocsIcon({ color }: { color: string }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="3" width="14" height="18" rx="2" stroke={color} strokeWidth="1.5" />
      <path d="M9 8h6M9 12h6M9 16h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CalendarStepIcon({ color }: { color: string }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="15" rx="2" stroke={color} strokeWidth="1.5" />
      <path d="M8 3v4M16 3v4M4 10h16" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

function CartIcon({ color }: { color: string }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6h15l-1.5 9H8L6 6zM6 6L5 3H2M9 20a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
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

function DobDatePicker({
  value,
  onChange,
}: {
  value: string
  onChange: (display: string) => void
}) {
  const today = startOfDay(new Date())
  const currentYear = today.getFullYear()
  const parsed = parseDobDisplay(value)
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? 0)
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? 1990)
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const years = Array.from({ length: currentYear - 1940 + 1 }, (_, i) => currentYear - i)

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const startOffset = firstDay === 0 ? 6 : firstDay - 1
  const cells: (number | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const isSameDay = (a: Date, day: number) =>
    a.getFullYear() === viewYear && a.getMonth() === viewMonth && a.getDate() === day

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const isDisabled = (day: number) => {
    const d = startOfDay(new Date(viewYear, viewMonth, day))
    return d > today
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          marginTop: 6,
          border: '1px solid #eee',
          borderRadius: 10,
          padding: '10px 12px',
          fontSize: 14,
          textAlign: 'left',
          background: '#fff',
          cursor: 'pointer',
          color: value ? '#111' : '#999',
        }}
      >
        {value || 'Select date of birth'}
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 8,
            zIndex: 1000,
            background: '#fff',
            borderRadius: 20,
            boxShadow: '0 8px 40px rgba(249,62,66,0.15)',
            border: '1px solid rgba(249,62,66,0.12)',
            padding: 16,
          }}
        >
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <select
              value={viewMonth}
              onChange={(e) => setViewMonth(Number(e.target.value))}
              style={{
                flex: 1,
                border: '1px solid #eee',
                borderRadius: 10,
                padding: '8px 10px',
                fontSize: 13,
              }}
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={viewYear}
              onChange={(e) => setViewYear(Number(e.target.value))}
              style={{
                flex: 1,
                border: '1px solid #eee',
                borderRadius: 10,
                padding: '8px 10px',
                fontSize: 13,
              }}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
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
              if (!day) return <span key={`e-${idx}`} />
              const disabled = isDisabled(day)
              const selected = parsed ? isSameDay(parsed, day) : false
              const isToday =
                today.getFullYear() === viewYear &&
                today.getMonth() === viewMonth &&
                today.getDate() === day
              const isHovered = hoveredDay === day && !selected && !disabled
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    const d = new Date(viewYear, viewMonth, day)
                    onChange(formatDateLabel(d))
                    setOpen(false)
                  }}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  style={{
                    width: 36,
                    height: 36,
                    border: 'none',
                    borderRadius: '50%',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                    background: selected ? BRAND : isToday && !selected ? '#fff0f0' : isHovered ? '#fff0f0' : 'transparent',
                    color: disabled ? '#ddd' : selected ? '#fff' : isToday ? BRAND : isHovered ? BRAND : '#111',
                    fontWeight: isToday ? 600 : 400,
                  }}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function NationalityInput({
  value,
  onChange,
  defaultNationality,
}: {
  value: string
  onChange: (v: string) => void
  defaultNationality: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value || defaultNationality)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value || defaultNationality)
  }, [value, defaultNationality])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ALL_CITIZENSHIPS.slice(0, 40)
    return ALL_CITIZENSHIPS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
    ).slice(0, 30)
  }, [query])

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        style={{
          width: '100%',
          border: '1px solid #eee',
          borderRadius: 10,
          padding: '10px 12px',
          fontSize: 14,
          boxSizing: 'border-box',
          marginTop: 6,
        }}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search nationality"
      />
      {open && filtered.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            maxHeight: 220,
            overflowY: 'auto',
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            border: '1px solid #eee',
            zIndex: 1000,
            padding: 8,
          }}
        >
          {filtered.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                onChange(c.name)
                setQuery(c.name)
                setOpen(false)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                border: '1px solid #eee',
                borderRadius: 40,
                padding: '8px 14px',
                fontSize: 13,
                cursor: 'pointer',
                background: '#fff',
                marginBottom: 4,
                textAlign: 'left',
              }}
            >
              <img
                src={flagUrl(c.code, 20)}
                alt=""
                width={20}
                height={14}
                style={{ borderRadius: 2, objectFit: 'cover' }}
              />
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ApplyCalendar({
  label,
  selected,
  onSelect,
  minDate,
  maxDate,
  syncViewDate,
  highlighted,
  containerRef,
}: {
  label: string
  selected: Date | null
  onSelect: (date: Date) => void
  minDate?: Date
  maxDate?: Date
  syncViewDate?: Date | null
  highlighted?: boolean
  containerRef?: RefObject<HTMLDivElement | null>
}) {
  const today = startOfDay(new Date())
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth())
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear())
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)

  useEffect(() => {
    if (syncViewDate) {
      setViewMonth(syncViewDate.getMonth())
      setViewYear(syncViewDate.getFullYear())
    }
  }, [syncViewDate?.getTime()])

  const yearStart = minDate ? minDate.getFullYear() : today.getFullYear()
  const yearEnd = maxDate ? maxDate.getFullYear() : today.getFullYear() + 1
  const years = Array.from({ length: yearEnd - yearStart + 1 }, (_, i) => yearStart + i)

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
    const d = startOfDay(new Date(viewYear, viewMonth, day))
    if (minDate && d < startOfDay(minDate)) return true
    if (maxDate && d > startOfDay(maxDate)) return true
    return false
  }

  return (
    <div
      ref={containerRef}
      style={{
        background: '#fff',
        borderRadius: 20,
        boxShadow: highlighted
          ? '0 12px 48px rgba(249,62,66,0.22)'
          : '0 8px 40px rgba(249,62,66,0.12)',
        border: highlighted ? `2px solid ${BRAND}` : '1px solid rgba(249,62,66,0.1)',
        padding: 16,
        width: '100%',
        maxWidth: 320,
        transition: 'box-shadow 0.25s ease, border 0.25s ease',
      }}
    >
      <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: 14, color: highlighted ? BRAND : '#333' }}>
        {label}
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <select
          value={viewMonth}
          onChange={(e) => setViewMonth(Number(e.target.value))}
          style={{
            flex: 1,
            border: '1px solid #eee',
            borderRadius: 10,
            padding: '8px 10px',
            fontSize: 13,
          }}
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={viewYear}
          onChange={(e) => setViewYear(Number(e.target.value))}
          style={{
            flex: 1,
            border: '1px solid #eee',
            borderRadius: 10,
            padding: '8px 10px',
            fontSize: 13,
          }}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
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
          const isToday =
            today.getFullYear() === viewYear &&
            today.getMonth() === viewMonth &&
            today.getDate() === day
          const isHovered = hoveredDay === day && !isSelected && !disabled
          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(startOfDay(new Date(viewYear, viewMonth, day)))}
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
              style={{
                width: 36,
                height: 36,
                border: 'none',
                borderRadius: '50%',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontSize: 14,
                background: isSelected
                  ? BRAND
                  : isToday && !selected
                    ? '#fff0f0'
                    : isHovered
                      ? '#fff0f0'
                      : 'transparent',
                color: disabled ? '#ddd' : isSelected ? '#fff' : isToday ? BRAND : isHovered ? BRAND : '#111827',
                opacity: disabled ? 0.4 : 1,
                fontWeight: isToday ? 600 : 400,
              }}
            >
              {day}
            </button>
          )
        })}
      </div>
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
  stepKey,
  current,
  label,
  icon,
  unlocked,
  completed,
  onNavigate,
}: {
  stepKey: ApplyStep
  current: ApplyStep
  label: string
  icon: ReactNode
  unlocked: boolean
  completed: boolean
  onNavigate: () => void
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  const isCurrent = stepKey === current
  const color = completed ? GREEN : isCurrent ? ACCENT : unlocked ? '#888' : '#ccc'

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        disabled={!unlocked}
        onClick={() => {
          if (!unlocked) {
            setShowTooltip(true)
            window.setTimeout(() => setShowTooltip(false), 2000)
            return
          }
          onNavigate()
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          border: 'none',
          background: 'none',
          cursor: unlocked ? 'pointer' : 'not-allowed',
          padding: '16px 0',
          width: '100%',
        }}
      >
        {icon}
        <span
          style={{
            marginTop: 6,
            fontSize: 11,
            fontWeight: isCurrent ? 700 : 600,
            color,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {completed && <CheckIconSmall />}
          {label}
        </span>
      </button>
      {showTooltip && !unlocked && (
        <div
          style={{
            position: 'absolute',
            left: 64,
            top: '50%',
            transform: 'translateY(-50%)',
            background: '#333',
            color: '#fff',
            fontSize: 11,
            padding: '6px 10px',
            borderRadius: 8,
            whiteSpace: 'nowrap',
            zIndex: 2000,
          }}
        >
          Complete previous step first
        </div>
      )}
    </div>
  )
}

type CheckoutFormProps = {
  country: Country
  selectedOption: VisaOption
  travelersCount: number
  travelerName: string
  pricing: { gov: number; processing: number; discount: number; total: number }
}

function CheckoutPaymentForm({
  country,
  selectedOption,
  travelersCount,
  travelerName,
  pricing,
}: CheckoutFormProps) {
  const navigate = useNavigate()
  const stripe = useStripe()
  const elements = useElements()
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  const goToInvoice = (status: 'success' | 'failed') => {
    const invoiceNo = `ATL${Date.now().toString().slice(-8)}`
    const today = formatDateLabel(new Date())
    const subtotal = pricing.gov * travelersCount + pricing.processing * travelersCount - pricing.discount
    const params = new URLSearchParams({
      status,
      name: travelerName,
      amount: String(pricing.total),
      country: country.name,
      option: selectedOption.label,
      invoiceNo,
      date: today,
      travelers: String(travelersCount),
      govFee: String(pricing.gov),
      processingFee: String(pricing.processing),
      discount: String(pricing.discount),
      subtotal: String(subtotal),
      countryCode: country.countryCode,
    })
    navigate(`/invoice?${params.toString()}`)
  }

  const handlePay = async () => {
    if (!stripe || !elements) return
    const card = elements.getElement(CardElement)
    if (!card) return

    setPaying(true)
    setPayError(null)

    const { error } = await stripe.createPaymentMethod({
      type: 'card',
      card,
    })

    if (error) {
      setPaying(false)
      setPayError(error.message ?? 'Payment failed')
      goToInvoice('failed')
      return
    }

    goToInvoice('success')
  }

  return (
    <>
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
            <span>{travelersCount}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Government fee × {travelersCount}</span>
            <span>AED {pricing.gov * travelersCount}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Processing fee × {travelersCount}</span>
            <span>AED {pricing.processing * travelersCount}</span>
          </div>
          {pricing.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: GREEN }}>
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
        <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 15 }}>Card details</p>
        <div
          style={{
            border: '1px solid #eee',
            borderRadius: 12,
            padding: 16,
            background: '#fff',
          }}
        >
          <CardElement
            options={{
              hidePostalCode: true,
              style: {
                base: {
                  fontSize: '16px',
                  color: '#1a1a1a',
                  fontFamily: 'system-ui, sans-serif',
                  '::placeholder': { color: '#aaa' },
                },
              },
            }}
          />
        </div>
      </div>

      {payError && (
        <p style={{ margin: '0 0 12px', color: '#dc2626', fontSize: 14, textAlign: 'center' }}>{payError}</p>
      )}

      <button
        type="button"
        disabled={!stripe || paying}
        onClick={handlePay}
        style={{
          width: '100%',
          background: BRAND,
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          padding: 16,
          fontSize: 16,
          fontWeight: 700,
          cursor: paying ? 'wait' : 'pointer',
        }}
      >
        {paying ? 'Processing…' : `Pay AED ${pricing.total}`}
      </button>

      <p style={{ margin: '12px 0 0', fontSize: 12, color: '#888', textAlign: 'center' }}>
        Test card: 4242 4242 4242 4242 | Exp: 12/29 | CVV: 123
      </p>

      <div
        style={{
          marginTop: 20,
          background: 'linear-gradient(135deg,#1a1a2e,#2d2d5e)',
          borderRadius: 16,
          padding: 16,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        <span style={{ fontSize: 14, fontWeight: 600 }}>If rejected — 100% refund</span>
      </div>
    </>
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
  const [uploads, setUploads] = useState<Record<string, UploadEntry>>({})
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({})
  const [departureDate, setDepartureDate] = useState<Date | null>(null)
  const [returnDate, setReturnDate] = useState<Date | null>(null)
  const [returnCalendarHighlight, setReturnCalendarHighlight] = useState(false)
  const returnCalendarRef = useRef<HTMLDivElement>(null)

  const [stepDone, setStepDone] = useState({
    travelers: false,
    docs: false,
    appt: false,
  })

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    setTravelers((prev) =>
      prev.map((t, i) =>
        i === 0 && !t.nationality ? { ...t, nationality: citizenship } : t,
      ),
    )
  }, [citizenship])

  const today = useMemo(() => startOfDay(new Date()), [])
  const maxDeparture = useMemo(() => addDays(today, 365), [today])
  const validityDays = selectedOption ? parseValidityDays(selectedOption.validity) : 30
  const validityLabel = selectedOption?.validity ?? '30 days'

  const minReturnDate = departureDate ? addDays(departureDate, 1) : undefined
  const maxReturnDate = departureDate ? addDays(departureDate, validityDays) : undefined

  const returnDateInvalid = useMemo(() => {
    if (!departureDate || !returnDate) return false
    const max = addDays(departureDate, validityDays)
    return returnDate > max
  }, [departureDate, returnDate, validityDays])

  const progress = STEP_PROGRESS[step]

  const applyUrl = (nextStep: ApplyStep) =>
    `/apply?destination=${encodeURIComponent(destination)}&option=${encodeURIComponent(optionId)}&step=${nextStep}`

  const travelersComplete = travelers.length > 0 && travelers.every(isTravelerComplete)

  const requiredDocs = country?.documents.length ? country.documents : ['Passport', 'Photo']
  const docsComplete = requiredDocs.every((doc) => uploads[doc] && !uploadErrors[doc])

  const apptComplete = Boolean(departureDate && returnDate && !returnDateInvalid)

  const unlocked: Record<ApplyStep, boolean> = {
    travelers: true,
    docs: stepDone.travelers,
    appt: stepDone.docs,
    checkout: stepDone.appt,
  }

  const completed: Record<ApplyStep, boolean> = {
    travelers: stepDone.travelers,
    docs: stepDone.docs,
    appt: stepDone.appt,
    checkout: false,
  }

  const defaultReturnOffsetDays = Math.min(30, validityDays)

  const handleDepartureSelect = (d: Date) => {
    setDepartureDate(d)
    const maxReturn = addDays(d, validityDays)
    let nextReturn = addDays(d, defaultReturnOffsetDays)
    if (nextReturn > maxReturn) nextReturn = maxReturn
    setReturnDate(nextReturn)
    setReturnCalendarHighlight(true)
    window.setTimeout(() => {
      returnCalendarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 80)
    window.setTimeout(() => setReturnCalendarHighlight(false), 2400)
  }

  const pricing = useMemo(() => {
    if (!selectedOption) return { gov: 0, processing: 0, discount: 0, total: 0 }
    const gov = parseFeeAed(selectedOption.fee)
    const processing = parseFeeAed(selectedOption.processingFee)
    const count = travelers.length
    const subtotal = (gov + processing) * count
    const discount = count >= 2 ? Math.round(subtotal * 0.05) : 0
    return { gov, processing, discount, total: subtotal - discount }
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

  const removeTraveler = (index: number) => {
    if (index === 0) return
    setTravelers((prev) => prev.filter((_, i) => i !== index))
  }

  const handleFileSelect = (docName: string, file: File | undefined) => {
    if (!file) return
    const rules = getUploadRules(docName)
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const typeOk =
      rules.mimeTypes.includes(file.type) ||
      rules.extensions.includes(ext)

    if (!typeOk) {
      setUploadErrors((prev) => ({ ...prev, [docName]: rules.typeError }))
      setUploads((prev) => {
        const next = { ...prev }
        delete next[docName]
        return next
      })
      return
    }

    if (file.size > rules.maxBytes) {
      setUploadErrors((prev) => ({ ...prev, [docName]: rules.sizeError }))
      setUploads((prev) => {
        const next = { ...prev }
        delete next[docName]
        return next
      })
      return
    }

    setUploadErrors((prev) => {
      const next = { ...prev }
      delete next[docName]
      return next
    })
    setUploads((prev) => ({
      ...prev,
      [docName]: { fileName: file.name, sizeMb: formatFileSize(file.size) },
    }))
  }

  const handleContinue = () => {
    if (step === 'travelers' && travelersComplete) {
      setStepDone((s) => ({ ...s, travelers: true }))
    }
    if (step === 'docs' && docsComplete) {
      setStepDone((s) => ({ ...s, docs: true }))
    }
    if (step === 'appt' && apptComplete) {
      setStepDone((s) => ({ ...s, appt: true }))
    }
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

  const sidebarSteps: { key: ApplyStep; label: string; icon: (color: string) => ReactNode }[] = [
    { key: 'travelers', label: 'Travelers', icon: (c) => <PeopleIcon color={c} /> },
    { key: 'docs', label: 'Docs', icon: (c) => <DocsIcon color={c} /> },
    { key: 'appt', label: 'Appt', icon: (c) => <CalendarStepIcon color={c} /> },
    { key: 'checkout', label: 'Checkout', icon: (c) => <CartIcon color={c} /> },
  ]

  const primaryTravelerName =
    `${travelers[0]?.firstName ?? ''} ${travelers[0]?.lastName ?? ''}`.trim() || 'Guest Traveler'

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
                    background:
                      s === step ? ACCENT : completed[s] || unlocked[s] ? GREEN : '#ddd',
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
            {sidebarSteps.map(({ key, label, icon }) => {
              const isCurrent = key === step
              const isCompleted = completed[key]
              const isUnlocked = unlocked[key]
              const color = isCompleted ? GREEN : isCurrent ? ACCENT : isUnlocked ? '#888' : '#ccc'
              return (
                <SidebarItem
                  key={key}
                  stepKey={key}
                  current={step}
                  label={label}
                  icon={icon(color)}
                  unlocked={isUnlocked}
                  completed={isCompleted}
                  onNavigate={() => navigate(applyUrl(key))}
                />
              )
            })}
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
                        position: 'relative',
                        background: '#fff',
                        borderRadius: 16,
                        padding: 20,
                        marginBottom: 16,
                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                      }}
                    >
                      {index > 0 && (
                        <button
                          type="button"
                          aria-label={`Remove traveller ${index + 1}`}
                          onClick={() => removeTraveler(index)}
                          style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: '#fff0f0',
                            color: BRAND,
                            border: 'none',
                            fontSize: 16,
                            cursor: 'pointer',
                            lineHeight: 1,
                          }}
                        >
                          ×
                        </button>
                      )}
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
                            onChange={(e) =>
                              updateTraveler(index, 'firstName', e.target.value.toUpperCase())
                            }
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Last Name</label>
                          <input
                            style={inputStyle}
                            value={traveler.lastName}
                            onChange={(e) =>
                              updateTraveler(index, 'lastName', e.target.value.toUpperCase())
                            }
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Date of Birth</label>
                          <DobDatePicker
                            value={traveler.dateOfBirth}
                            onChange={(display) => updateTraveler(index, 'dateOfBirth', display)}
                          />
                        </div>
                        <PassportNumberField
                          value={traveler.passportNumber}
                          nationality={traveler.nationality}
                          onChange={(v) => updateTraveler(index, 'passportNumber', v)}
                          inputStyle={inputStyle}
                          labelStyle={labelStyle}
                        />
                        <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                          <label style={labelStyle}>Nationality</label>
                          <NationalityInput
                            value={traveler.nationality}
                            defaultNationality={citizenship}
                            onChange={(v) => updateTraveler(index, 'nationality', v)}
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

                {requiredDocs.map((docName) => {
                  const rules = getUploadRules(docName)
                  const entry = uploads[docName]
                  const err = uploadErrors[docName]
                  return (
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
                        accept={rules.accept}
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileSelect(docName, e.target.files?.[0])}
                      />
                      {err && (
                        <p style={{ margin: '0 0 12px', color: '#dc2626', fontSize: 13 }}>{err}</p>
                      )}
                      {entry ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ color: GREEN, fontWeight: 700 }}>✓</span>
                          <span style={{ fontSize: 14, color: '#333' }}>
                            {entry.fileName} {entry.sizeMb}
                          </span>
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
                        </button>
                      )}
                    </div>
                  )
                })}

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
                <p style={{ margin: '0 0 8px', color: '#888', fontSize: 14, textAlign: 'center' }}>
                  Choose departure and return dates for your trip
                </p>
                <p style={{ margin: '0 0 24px', color: '#666', fontSize: 13, textAlign: 'center' }}>
                  Your visa allows stays up to {validityLabel} from entry date
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
                    minDate={today}
                    maxDate={maxDeparture}
                    syncViewDate={departureDate}
                    onSelect={handleDepartureSelect}
                  />
                  <ApplyCalendar
                    label="Return date"
                    selected={returnDate}
                    minDate={minReturnDate}
                    maxDate={maxReturnDate}
                    syncViewDate={returnDate ?? (departureDate ? addDays(departureDate, defaultReturnOffsetDays) : null)}
                    highlighted={returnCalendarHighlight}
                    containerRef={returnCalendarRef}
                    onSelect={setReturnDate}
                  />
                </div>

                {returnDateInvalid && (
                  <p
                    style={{
                      margin: '16px 0 0',
                      color: '#dc2626',
                      fontSize: 14,
                      textAlign: 'center',
                      fontWeight: 500,
                    }}
                  >
                    Your {selectedOption.label} visa is only valid for {validityLabel}. Please select a
                    return date within this period.
                  </p>
                )}

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
                <Elements stripe={stripePromise}>
                  <CheckoutPaymentForm
                    country={country}
                    selectedOption={selectedOption}
                    travelersCount={travelers.length}
                    travelerName={primaryTravelerName}
                    pricing={pricing}
                  />
                </Elements>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
