import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { useCitizenship } from '../context/CitizenshipContext'
import { getCitizenshipByCode } from '../data/citizenships'
import {
  countries,
  getProcessingDays,
  type Country,
  type DocumentCategory,
  type ProcessingCategory,
  type TypeFilter,
} from '../data/countries'

const BRAND = '#f93e42'

type DeliveryFilter = 'any' | ProcessingCategory
type TypeFilterValue = 'all' | TypeFilter
type DocumentsFilter = 'any' | DocumentCategory
type OpenDropdown = 'delivery' | 'type' | 'documents' | 'holidays' | null

const deliveryOptions: { value: DeliveryFilter; label: string; count: number }[] = [
  { value: 'any', label: 'Any Time', count: 109 },
  { value: 'instant', label: 'Instant', count: 2 },
  { value: '24hours', label: 'Within 24 Hours', count: 4 },
  { value: '3-5days', label: '3–5 Days', count: 20 },
  { value: '6-7days', label: '6–7 Days', count: 31 },
  { value: '8-30days', label: '8–30 Days', count: 52 },
]

const typeOptions: { value: TypeFilterValue; label: string; count: number }[] = [
  { value: 'all', label: 'All Visa Types', count: 109 },
  { value: 'visa-free', label: 'Visa Free', count: 20 },
  { value: 'visa-on-arrival', label: 'Visa on Arrival', count: 11 },
  { value: 'e-visa', label: 'e-Visa', count: 59 },
  { value: 'sticker', label: 'Sticker Visa', count: 19 },
]

const documentOptions: { value: DocumentsFilter; label: string; count: number }[] = [
  { value: 'any', label: 'Any Documents', count: 109 },
  { value: 'passport-only', label: 'Only Passport', count: 18 },
  { value: 'passport-bank', label: 'Passport & Bank Statements', count: 9 },
  { value: 'passport-emirates', label: 'Passport & Emirates Id', count: 15 },
  { value: 'us-uk-schengen', label: 'With US/UK/Schengen visa', count: 9 },
]

function unsplashUrl(name: string) {
  return `https://source.unsplash.com/400x600/?${name.replace(/\s+/g, '+')},travel`
}

function formatHolidayDate(date: Date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function matchesDelivery(country: Country, filter: DeliveryFilter) {
  if (filter === 'any') return true
  return country.processingCategory === filter
}

function matchesType(country: Country, filter: TypeFilterValue) {
  if (filter === 'all') return true
  return country.typeFilter === filter
}

function matchesDocuments(country: Country, filter: DocumentsFilter) {
  if (filter === 'any') return true
  return country.documentCategory === filter
}

function matchesHoliday(country: Country, selected: Date | null) {
  if (!selected) return true
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(selected)
  target.setHours(23, 59, 59, 999)
  const daysUntil = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return getProcessingDays(country.processingCategory) <= daysUntil
}

function SearchIconBrand() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke={BRAND} strokeWidth="1.5" />
      <path d="M20 20l-3.5-3.5" stroke={BRAND} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function LightningIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M13 2L4 14h7l-1 8 10-14h-7l0-6z" fill="#22c55e" />
    </svg>
  )
}

function PlaneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 12l18-7-4 7 4 7-18-7 4-2-4-2z"
        fill="#3b82f6"
        stroke="#3b82f6"
        strokeWidth="1"
      />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 3h8l4 4v14H8V3z" fill="#f97316" />
      <path d="M16 3v4h4" stroke="#fff" strokeWidth="1.5" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="15" rx="2" fill="#ec4899" />
      <path d="M8 3v4M16 3v4M4 10h16" stroke="#fff" strokeWidth="1.5" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="1.5" />
      <path d="M12 7v5l3 2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function DropdownOption({
  label,
  count,
  selected,
  onClick,
}: {
  label: string
  count: number
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '8px 12px',
        border: 'none',
        borderRadius: 8,
        background: selected ? '#fff8f8' : 'transparent',
        cursor: 'pointer',
        pointerEvents: 'all',
        fontSize: 15,
        textAlign: 'left',
        color: '#111827',
      }}
    >
      <span>
        {selected && <span style={{ color: BRAND, marginRight: 6, fontWeight: 700 }}>•</span>}
        {label}
      </span>
      <span style={{ color: '#9ca3af', fontSize: 14 }}>{count}</span>
    </button>
  )
}

function CalendarPopup({
  selected,
  onSelect,
  onClose,
}: {
  selected: Date | null
  onSelect: (date: Date) => void
  onClose: () => void
}) {
  const today = new Date()
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [pending, setPending] = useState<Date | null>(selected)
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

  return (
    <div
      style={{
        position: 'absolute',
        top: '110%',
        left: 0,
        width: 320,
        background: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 8px 40px rgba(249,62,66,0.15)',
        border: '1px solid rgba(249,62,66,0.12)',
        padding: 16,
        zIndex: 99999,
        pointerEvents: 'all',
      }}
    >
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
          const isToday =
            today.getFullYear() === viewYear &&
            today.getMonth() === viewMonth &&
            today.getDate() === day
          const isSelected = pending ? isSameDay(pending, day) : false
          const isHighlighted = isToday || isSelected
          const isHovered = hoveredDay === day && !isHighlighted
          return (
            <button
              key={day}
              type="button"
              onClick={() => setPending(new Date(viewYear, viewMonth, day))}
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
              style={{
                width: 36,
                height: 36,
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: 14,
                background: isHighlighted ? BRAND : isHovered ? '#fff0f0' : 'transparent',
                color: isHighlighted ? '#fff' : isHovered ? BRAND : '#111827',
                fontWeight: isToday ? 600 : 400,
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
            >
              {day}
            </button>
          )
        })}
      </div>
      <p style={{ margin: '16px 0 12px', fontSize: 13, color: '#6b7280' }}>
        Guaranteed visas before{' '}
        <strong style={{ color: '#111827' }}>
          {pending ? formatHolidayDate(pending) : 'selected date'}
        </strong>
      </p>
      <button
        type="button"
        onClick={() => {
          if (pending) onSelect(pending)
          onClose()
        }}
        style={{
          width: '100%',
          padding: '12px 16px',
          border: 'none',
          borderRadius: 40,
          background: BRAND,
          color: '#fff',
          fontWeight: 600,
          fontSize: 15,
          cursor: 'pointer',
        }}
      >
        Select
      </button>
    </div>
  )
}

function countryCardNameFontSize(name: string, isMobile: boolean): number {
  const len = name.length
  if (isMobile) {
    if (len > 22) return 8
    if (len > 16) return 9
    return 11
  }
  if (len > 24) return 9
  if (len > 18) return 10
  return 12
}

function countryCardNameBottom(name: string, isMobile: boolean): number {
  const barHeight = isMobile ? 44 : 48
  const gap = 10
  const extraLines = name.length > 22 ? 12 : name.length > 16 ? 6 : 0
  return barHeight + gap + extraLines
}

function CountryCard({ country, isMobile }: { country: Country; isMobile: boolean }) {
  const [hovered, setHovered] = useState(false)
  const displayType =
    country.visaType === 'No Visa Required' ? 'No Visa Required' : country.visaType
  const cardHeight = isMobile ? 260 : 320
  const bottomBarHeight = isMobile ? 44 : 48
  const nameBottom = countryCardNameBottom(country.name, isMobile)

  return (
    <Link
      to={`/visa/${country.slug}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block', width: '100%' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <article
        style={{
          position: 'relative',
          width: '100%',
          height: cardHeight,
          borderRadius: 20,
          overflow: 'hidden',
          transform: hovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
          transition: 'all 0.3s ease',
          boxShadow: hovered ? '0 16px 40px rgba(0,0,0,0.15)' : '0 4px 16px rgba(0,0,0,0.08)',
        }}
      >
        <img
          src={unsplashUrl(country.name)}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.4) 18%, rgba(0,0,0,0.12) 42%, transparent 68%)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: isMobile ? '42%' : '44%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          <img
            src={`https://flagcdn.com/w80/${country.countryCode}.png`}
            alt={`${country.name} flag`}
            style={{
              width: 52,
              height: 36,
              objectFit: 'cover',
              borderRadius: 6,
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            }}
          />
        </div>

        <h3
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: nameBottom,
            margin: 0,
            textAlign: 'center',
            fontSize: countryCardNameFontSize(country.name, isMobile),
            fontWeight: 700,
            letterSpacing: country.name.length > 18 ? '0.04em' : '0.08em',
            lineHeight: 1.35,
            color: '#fff',
            textTransform: 'uppercase',
            padding: '0 10px',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            textShadow: '0 1px 6px rgba(0,0,0,0.65)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          {country.name}
        </h3>

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: bottomBarHeight,
            boxSizing: 'border-box',
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 4,
            padding: '6px 6px',
            alignItems: 'center',
            zIndex: 1,
            transform: hovered ? 'translateY(100%)' : 'translateY(0)',
            opacity: hovered ? 0 : 1,
            transition: 'transform 0.3s ease, opacity 0.3s ease',
          }}
        >
          {[
            { label: 'TYPE', value: displayType },
            { label: 'VALID', value: country.validity },
            { label: 'FEES', value: country.fee },
          ].map((item) => (
            <div key={item.label} style={{ textAlign: 'center', minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 8, color: '#9ca3af', letterSpacing: '0.05em' }}>{item.label}</p>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: 14,
            zIndex: 3,
            background: 'rgba(15,15,25,0.88)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            transform: hovered ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.3s ease',
          }}
        >
          <p
            style={{
              margin: '0 0 6px',
              fontSize: 9,
              letterSpacing: '0.1em',
              color: '#9ca3af',
            }}
          >
            DOCUMENTS NEEDED:
          </p>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: '#fff', lineHeight: 1.4 }}>
            {country.documents.length > 0 ? country.documents.join(', ') : 'None required'}
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              border: 'none',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.12)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <ClockIcon />
            Get emergency assistance
          </button>
        </div>
      </article>
    </Link>
  )
}

type IpToast = { detectedCountry: string; detectedCode: string }

export default function HomePage() {
  const { isLoggedIn, avatarInitials, avatarColor } = useAuth()
  const {
    countryCode,
    hasSavedCitizenship,
    setCitizenship,
    openCitizenshipModal,
    setDetectedCountryHint,
  } = useCitizenship()
  const [ipToast, setIpToast] = useState<IpToast | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'explore' | 'events'>('explore')
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null)
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryFilter>('any')
  const [typeFilter, setTypeFilter] = useState<TypeFilterValue>('all')
  const [documentsFilter, setDocumentsFilter] = useState<DocumentsFilter>('any')
  const [holidayDate, setHolidayDate] = useState<Date | null>(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [filterSticky, setFilterSticky] = useState(false)
  const [filterBarHeight, setFilterBarHeight] = useState(72)

  const heroRef = useRef<HTMLElement>(null)
  const filterDropdownRef = useRef<HTMLDivElement>(null)
  const filterBarInnerRef = useRef<HTMLDivElement>(null)
  const heroSearchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    let cancelled = false
    let modalTimer: ReturnType<typeof setTimeout> | undefined
    let toastTimer: ReturnType<typeof setTimeout> | undefined

    async function detectLocation() {
      try {
        const res = await fetch('https://ipapi.co/json/')
        if (!res.ok || cancelled) return
        const data = (await res.json()) as { country_name?: string; country_code?: string }
        const detectedCountry = data.country_name?.trim()
        const detectedCode = data.country_code?.trim().toLowerCase()
        if (!detectedCountry || !detectedCode || cancelled) return

        const savedRaw = localStorage.getItem('user_citizenship')
        if (!savedRaw) {
          setDetectedCountryHint(detectedCountry)
          modalTimer = window.setTimeout(() => {
            if (!cancelled) openCitizenshipModal()
          }, 1000)
          return
        }

        let savedCode = countryCode
        try {
          const parsed = JSON.parse(savedRaw) as { countryCode?: string }
          if (parsed.countryCode) savedCode = parsed.countryCode.toLowerCase()
        } catch {
          /* ignore */
        }

        if (detectedCode !== savedCode) {
          setIpToast({ detectedCountry, detectedCode })
          toastTimer = window.setTimeout(() => {
            if (!cancelled) setIpToast(null)
          }, 8000)
        }
      } catch {
        /* ignore network errors */
      }
    }

    detectLocation()

    return () => {
      cancelled = true
      if (modalTimer) window.clearTimeout(modalTimer)
      if (toastTimer) window.clearTimeout(toastTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run IP detection once on mount
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const measure = () => {
      if (filterBarInnerRef.current) {
        setFilterBarHeight(filterBarInnerRef.current.offsetHeight)
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [isMobile])

  useEffect(() => {
    const onScroll = () => {
      const hero = heroRef.current
      if (!hero) return
      const heroBottom = hero.getBoundingClientRect().bottom
      setFilterSticky(heroBottom <= 64)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const deliveryLabel =
    deliveryOptions.find((o) => o.value === deliveryFilter)?.label ?? 'Any Time'
  const typeLabel = typeOptions.find((o) => o.value === typeFilter)?.label ?? 'All Visa Types'
  const documentsLabel =
    documentOptions.find((o) => o.value === documentsFilter)?.label ?? 'Any Documents'
  const holidayLabel = holidayDate ? formatHolidayDate(holidayDate) : 'Select Dates'

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return countries.filter((c) => {
      const matchesSearch = !q || c.name.toLowerCase().includes(q)
      return (
        matchesSearch &&
        matchesDelivery(c, deliveryFilter) &&
        matchesType(c, typeFilter) &&
        matchesDocuments(c, documentsFilter) &&
        matchesHoliday(c, holidayDate)
      )
    })
  }, [search, deliveryFilter, typeFilter, documentsFilter, holidayDate])

  const dropdownStyle: CSSProperties = {
    position: 'absolute',
    zIndex: 99999,
    top: '110%',
    left: 0,
    minWidth: 280,
    background: '#ffffff',
    borderRadius: 16,
    boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
    padding: 16,
    pointerEvents: 'all',
  }

  const filterBarInner = (
    <div
      ref={filterBarInnerRef}
      className="home-filter-bar-inner"
      style={{
        display: 'flex',
        alignItems: 'stretch',
        border: '1px solid rgba(249,62,66,0.12)',
        borderRadius: 40,
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(12px)',
        maxWidth: 1100,
        margin: '0 auto',
        boxShadow: '0 4px 20px rgba(249,62,66,0.06)',
        overflow: 'visible',
      }}
    >
      <div style={{ position: 'relative', flex: isMobile ? '0 0 auto' : 1, minWidth: isMobile ? 140 : undefined, borderRight: '1px solid #eee' }}>
        <button
          type="button"
          onClick={() => setOpenDropdown(openDropdown === 'delivery' ? null : 'delivery')}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <LightningIcon />
          <div>
            <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>Visa delivery:</p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>{deliveryLabel} ↓</p>
          </div>
        </button>
        {openDropdown === 'delivery' && (
          <div style={dropdownStyle}>
            {deliveryOptions.map((opt) => (
              <DropdownOption
                key={opt.value}
                label={opt.label}
                count={opt.count}
                selected={deliveryFilter === opt.value}
                onClick={() => {
                  setDeliveryFilter(opt.value)
                  setOpenDropdown(null)
                }}
              />
            ))}
          </div>
        )}
      </div>
      <div style={{ position: 'relative', flex: isMobile ? '0 0 auto' : 1, minWidth: isMobile ? 140 : undefined, borderRight: '1px solid #eee' }}>
        <button
          type="button"
          onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <PlaneIcon />
          <div>
            <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>Type:</p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>{typeLabel} ↓</p>
          </div>
        </button>
        {openDropdown === 'type' && (
          <div style={dropdownStyle}>
            {typeOptions.map((opt) => (
              <DropdownOption
                key={opt.value}
                label={opt.label}
                count={opt.count}
                selected={typeFilter === opt.value}
                onClick={() => {
                  setTypeFilter(opt.value)
                  setOpenDropdown(null)
                }}
              />
            ))}
          </div>
        )}
      </div>
      <div style={{ position: 'relative', flex: isMobile ? '0 0 auto' : 1, minWidth: isMobile ? 140 : undefined, borderRight: '1px solid #eee' }}>
        <button
          type="button"
          onClick={() => setOpenDropdown(openDropdown === 'documents' ? null : 'documents')}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <DocumentIcon />
          <div>
            <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>Documents:</p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>{documentsLabel} ↓</p>
          </div>
        </button>
        {openDropdown === 'documents' && (
          <div style={dropdownStyle}>
            {documentOptions.map((opt) => (
              <DropdownOption
                key={opt.value}
                label={opt.label}
                count={opt.count}
                selected={documentsFilter === opt.value}
                onClick={() => {
                  setDocumentsFilter(opt.value)
                  setOpenDropdown(null)
                }}
              />
            ))}
          </div>
        )}
      </div>
      <div
        style={{
          position: 'relative',
          flex: isMobile ? '0 0 auto' : 1,
          minWidth: isMobile ? 140 : undefined,
          ...(openDropdown === 'holidays'
            ? {
                border: '2px solid #f93e42',
                background: '#fff8f8',
                borderRadius: isMobile ? 20 : '0 40px 40px 0',
              }
            : {}),
        }}
      >
        <button
          type="button"
          onClick={() => setOpenDropdown(openDropdown === 'holidays' ? null : 'holidays')}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
        >
          <CalendarIcon />
          <div>
            <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>Holidays:</p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>{holidayLabel} ↓</p>
          </div>
        </button>
        {openDropdown === 'holidays' && (
          <CalendarPopup
            selected={holidayDate}
            onSelect={setHolidayDate}
            onClose={() => setOpenDropdown(null)}
          />
        )}
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes float1 {
          from { transform: translate(0, 0) scale(1); }
          to { transform: translate(40px, 30px) scale(1.1); }
        }
        @keyframes float2 {
          from { transform: translate(0, 0) scale(1); }
          to { transform: translate(-30px, 40px) scale(1.08); }
        }
        @keyframes float3 {
          from { transform: translate(0, 0) scale(1); }
          to { transform: translate(20px, -30px) scale(1.05); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .country-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          box-sizing: border-box;
        }
        @media (max-width: 768px) {
          .country-cards-grid {
            grid-template-columns: repeat(2, minmax(150px, 1fr));
            gap: 12px;
          }
          .home-filter-scroll {
            overflow-x: auto;
            overflow-y: visible;
            flex-wrap: nowrap !important;
            -webkit-overflow-scrolling: touch;
          }
          .home-filter-scroll--open {
            overflow: visible;
          }
          .home-filter-scroll::-webkit-scrollbar { display: none; }
        }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(160deg, #fff8f8 0%, #fff 40%, #f8f8ff 100%)',
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

        <section
          ref={heroRef}
          style={{
            position: 'relative',
            padding: isMobile ? '40px 20px 32px' : '56px 32px 40px',
            textAlign: 'center',
            overflow: 'hidden',
            animation: 'fadeSlideUp 0.7s ease forwards',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              width: 500,
              height: 500,
              borderRadius: '50%',
              background: 'rgba(249,62,66,0.07)',
              filter: 'blur(80px)',
              top: -100,
              left: -100,
              pointerEvents: 'none',
              zIndex: 0,
              animation: 'float1 12s infinite alternate',
            }}
          />
          <div
            aria-hidden
            style={{
              position: 'absolute',
              width: 400,
              height: 400,
              borderRadius: '50%',
              background: 'rgba(80,87,234,0.05)',
              filter: 'blur(80px)',
              top: 200,
              right: -80,
              pointerEvents: 'none',
              zIndex: 0,
              animation: 'float2 15s infinite alternate',
            }}
          />
          <div
            aria-hidden
            style={{
              position: 'absolute',
              width: 350,
              height: 350,
              borderRadius: '50%',
              background: 'rgba(249,62,66,0.05)',
              filter: 'blur(80px)',
              bottom: 0,
              left: '30%',
              pointerEvents: 'none',
              zIndex: 0,
              animation: 'float3 10s infinite alternate',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1
              style={{
                margin: '0 0 12px',
                fontSize: isMobile ? '2rem' : 'clamp(2.25rem, 5vw, 3.25rem)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: '#111827',
              }}
            >
              Visas. Delivered <span style={{ color: BRAND }}>On Time</span>.
            </h1>
            <p style={{ margin: '0 0 0', fontSize: 17, color: '#666' }}>
              120+ destinations for UAE residents. Guaranteed.
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                maxWidth: 520,
                margin: '32px auto 0',
                padding: '6px 6px 6px 18px',
                background: '#fff',
                borderRadius: 50,
                boxShadow: '0 8px 32px rgba(249,62,66,0.12)',
                border: '1.5px solid rgba(249,62,66,0.15)',
                gap: 12,
              }}
            >
              <SearchIconBrand />
              <input
                ref={heroSearchRef}
                type="search"
                placeholder="Search 120+ destinations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search destinations"
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: 15,
                  background: 'transparent',
                  minWidth: 0,
                }}
              />
              <button
                type="button"
                style={{
                  padding: '10px 22px',
                  border: 'none',
                  borderRadius: 40,
                  background: BRAND,
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                Search
              </button>
            </div>
          </div>
        </section>

        <div>
          {filterSticky && <div style={{ height: filterBarHeight }} aria-hidden />}

          <div
            ref={filterDropdownRef}
            style={{
              padding: isMobile ? '0 12px 16px' : '0 32px 24px',
              ...(filterSticky
                ? {
                    position: 'fixed',
                    top: 64,
                    left: 0,
                    right: 0,
                    zIndex: openDropdown ? 10001 : 999,
                    background: openDropdown ? 'transparent' : 'rgba(255,255,255,0.95)',
                    backdropFilter: openDropdown ? 'none' : 'blur(20px)',
                    WebkitBackdropFilter: openDropdown ? 'none' : 'blur(20px)',
                    borderBottom: openDropdown
                      ? 'none'
                      : '1px solid rgba(249,62,66,0.08)',
                    boxShadow: openDropdown ? 'none' : '0 4px 24px rgba(0,0,0,0.06)',
                    padding: isMobile ? '12px' : '16px 32px',
                    transition: 'all 0.3s ease',
                  }
                : { transition: 'all 0.3s ease' }),
            }}
          >
            <div
              className={
                isMobile
                  ? `home-filter-scroll${openDropdown ? ' home-filter-scroll--open' : ''}`
                  : undefined
              }
              style={{ display: isMobile ? 'flex' : 'block', overflow: openDropdown ? 'visible' : undefined }}
            >
              {filterBarInner}
            </div>
          </div>
        </div>

        <main style={{ padding: isMobile ? '0 12px 48px' : '0 32px 48px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto 24px' }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#111827' }}>
              Popular Destinations
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: '#888' }}>
              Trending visas for UAE residents
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['🔥 Trending', '⚡ Fast', '💳 e-Visa'].map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: '6px 14px',
                    background: '#fff8f8',
                    border: '1px solid #f9e0e0',
                    color: BRAND,
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="country-cards-grid">
            {filtered.map((country) => (
              <CountryCard key={country.slug} country={country} isMobile={isMobile} />
            ))}
          </div>
          {filtered.length === 0 && (
            <p style={{ textAlign: 'center', color: '#6b7280', padding: '48px 0' }}>
              No countries match your filters.
            </p>
          )}
        </main>
      </div>

      {ipToast && hasSavedCitizenship && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: '#fff',
            borderRadius: 40,
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            maxWidth: 'calc(100% - 32px)',
          }}
        >
          <span style={{ fontSize: 14, color: '#333' }}>
            📍 Browsing from {ipToast.detectedCountry}. Is that your citizenship?
          </span>
          <button
            type="button"
            onClick={() => {
              const entry =
                getCitizenshipByCode(ipToast.detectedCode) ??
                ({ name: ipToast.detectedCountry, code: ipToast.detectedCode } as const)
              setCitizenship(entry.name, entry.code)
              setIpToast(null)
            }}
            style={{
              border: 'none',
              borderRadius: 40,
              background: BRAND,
              color: '#fff',
              padding: '6px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => {
              setIpToast(null)
              openCitizenshipModal()
            }}
            style={{
              border: '1px solid #eee',
              borderRadius: 40,
              background: '#fff',
              color: '#333',
              padding: '6px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Change
          </button>
        </div>
      )}
    </>
  )
}
