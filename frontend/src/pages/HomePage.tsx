import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { SiteFooter } from '../components/SiteFooter'
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
import { flagUrl } from '../utils/flags'
import { getCountryLandmarkImage, getCountryLandmarkLabel } from '../utils/countryLandmarks'
import { isUserLoggedIn, redirectToSignIn } from '../utils/authGate'

const BRAND = '#f93e42'

type PopularDestination = {
  label: string
  href?: string
  flagCode?: string
  searchTerm?: string
}

const popularDestinations: PopularDestination[] = [
  { label: 'Schengen', href: '/visa/schengen', flagCode: 'eu' },
  { label: 'UK', href: '/visa/uk', flagCode: 'gb' },
  { label: 'USA', href: '/visa/united-states', flagCode: 'us' },
  { label: 'Canada', href: '/visa/canada', flagCode: 'ca' },
  { label: 'Australia', href: '/visa/australia', flagCode: 'au' },
  { label: 'Japan', href: '/visa/japan', flagCode: 'jp' },
  { label: 'Korea', href: '/visa/south-korea', flagCode: 'kr' },
  { label: 'Saudi', href: '/visa/saudi-arabia', flagCode: 'sa' },
  { label: 'Turkey', searchTerm: 'turkey', flagCode: 'tr' },
]

const WHATSAPP_EXPERT = '971559641020'
const PARTNER_EMAIL = 'procurement@superjetgroup.com'
const VISA_REQUIREMENTS_PATH = '/tools/visa-requirements/dubai-visa'

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

function ClipboardCheckIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="8" y="3" width="12" height="16" rx="2" stroke={BRAND} strokeWidth="1.5" />
      <path d="M8 7H6a2 2 0 00-2 2v12h12v-2" stroke={BRAND} strokeWidth="1.5" />
      <path d="M11 13l2 2 4-4" stroke={BRAND} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function HeadsetIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 14v-2a8 8 0 0116 0v2M6 14h2v4H6v-4zm10 0h2v4h-2v-4z"
        stroke={BRAND}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function HandshakeIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 11l2-2 3 3 5-5 2 2-5 5-3-3-2 2v3H7v-3z"
        stroke={BRAND}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M4 20h8" stroke={BRAND} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 16V4m0 0l4 4m-4-4L8 8" stroke={BRAND} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20h16" stroke={BRAND} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function PassportVisaIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect x="12" y="8" width="40" height="48" rx="6" fill="rgba(249,62,66,0.12)" stroke={BRAND} strokeWidth="2" />
      <circle cx="32" cy="28" r="8" stroke={BRAND} strokeWidth="2" />
      <path d="M22 44c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke={BRAND} strokeWidth="2" strokeLinecap="round" />
      <rect x="38" y="14" width="18" height="24" rx="3" fill="#fff" stroke="#5057ea" strokeWidth="1.5" />
      <path d="M42 22h10M42 27h8M42 32h6" stroke="#5057ea" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function PartnerBriefcaseIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect x="8" y="22" width="48" height="30" rx="4" fill="rgba(80,87,234,0.1)" stroke="#5057ea" strokeWidth="2" />
      <path d="M24 22v-4a8 8 0 0116 0v4" stroke="#5057ea" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 32h48" stroke="#5057ea" strokeWidth="2" />
      <circle cx="32" cy="36" r="4" fill={BRAND} />
      <path d="M44 12l6 6-6 6" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M50 18H38" stroke={BRAND} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function SectionCta({
  label,
  primary,
  onClick,
  href,
  to,
}: {
  label: string
  primary?: boolean
  onClick?: () => void
  href?: string
  to?: string
}) {
  const [hovered, setHovered] = useState(false)
  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px 24px',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'none',
    border: primary ? 'none' : '1.5px solid rgba(249,62,66,0.25)',
    background: primary
      ? hovered
        ? '#e83539'
        : BRAND
      : hovered
        ? '#fff8f8'
        : '#fff',
    color: primary ? '#fff' : '#111827',
    boxShadow: primary && hovered ? '0 8px 24px rgba(249,62,66,0.3)' : 'none',
    transform: hovered ? 'translateY(-1px)' : 'none',
    transition: 'transform 0.2s, box-shadow 0.2s, background 0.2s',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  }

  if (href) {
    return (
      <a
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
        style={style}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {label}
      </a>
    )
  }
  if (to) {
    return (
      <Link to={to} style={style} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        {label}
      </Link>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
    </button>
  )
}

function DestinationChip({
  dest,
  onSearch,
}: {
  dest: PopularDestination
  onSearch: (term: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  const chipStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 18px',
    background: hovered ? '#fff' : 'rgba(255,255,255,0.92)',
    border: `1px solid ${hovered ? 'rgba(249,62,66,0.25)' : 'rgba(249,62,66,0.12)'}`,
    borderRadius: 40,
    boxShadow: hovered ? '0 8px 24px rgba(249,62,66,0.12)' : '0 2px 12px rgba(0,0,0,0.04)',
    textDecoration: 'none',
    color: '#111827',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
    transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
  }

  const inner = (
    <>
      {dest.flagCode && (
        <img
          src={flagUrl(dest.flagCode, 40)}
          alt=""
          width={22}
          height={15}
          style={{ borderRadius: 2, objectFit: 'cover', flexShrink: 0 }}
        />
      )}
      {dest.label}
    </>
  )

  if (dest.href) {
    return (
      <Link
        to={dest.href}
        style={chipStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {inner}
      </Link>
    )
  }

  return (
    <button
      type="button"
      style={{ ...chipStyle, fontFamily: 'inherit' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => dest.searchTerm && onSearch(dest.searchTerm)}
    >
      {inner}
    </button>
  )
}

function HeroCtaButton({
  icon,
  label,
  primary,
  onClick,
  href,
  to,
}: {
  icon: ReactNode
  label: string
  primary?: boolean
  onClick?: () => void
  href?: string
  to?: string
}) {
  const [hovered, setHovered] = useState(false)
  const base: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '16px 20px',
    borderRadius: 16,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'none',
    border: primary ? 'none' : '1.5px solid rgba(249,62,66,0.2)',
    background: primary
      ? hovered
        ? 'linear-gradient(135deg, #e83539, #f93e42)'
        : 'linear-gradient(135deg, #f93e42, #ff6b6b)'
      : hovered
        ? '#fff8f8'
        : '#fff',
    color: primary ? '#fff' : '#111827',
    boxShadow: primary
      ? hovered
        ? '0 12px 36px rgba(249,62,66,0.35)'
        : '0 8px 28px rgba(249,62,66,0.25)'
      : hovered
        ? '0 6px 20px rgba(249,62,66,0.1)'
        : '0 2px 12px rgba(0,0,0,0.04)',
    transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
    transition: 'transform 0.2s, box-shadow 0.2s, background 0.2s',
    fontFamily: 'inherit',
    width: '100%',
  }

  if (href) {
    return (
      <a
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
        style={base}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {icon}
        {label}
      </a>
    )
  }

  if (to) {
    return (
      <Link
        to={to}
        style={base}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {icon}
        {label}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      style={base}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {icon}
      {label}
    </button>
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
        position: 'relative',
        zIndex: 99999,
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
        isolation: 'isolate',
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
          src={getCountryLandmarkImage(country.slug, isMobile ? 600 : 800, isMobile ? 520 : 640)}
          alt={`${country.name} — ${getCountryLandmarkLabel(country.slug)}`}
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

const TRUST_ITEMS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f93e42" strokeWidth="2.5" aria-hidden>
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ),
    value: '500+',
    label: 'Visas Processed',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f93e42" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    value: '98%',
    label: 'Approval Rate',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f93e42" strokeWidth="2" aria-hidden>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    value: 'UAE Based',
    label: 'Expert Team',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f93e42" strokeWidth="2" aria-hidden>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    value: 'On Time',
    label: 'Guaranteed',
  },
] as const

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Check Requirements',
    description: 'Enter your nationality and destination',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f93e42" strokeWidth="1.5" aria-hidden>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    title: 'Submit Documents',
    description: 'Upload your documents securely',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f93e42" strokeWidth="1.5" aria-hidden>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    title: 'We Process',
    description: 'Our experts handle your application',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f93e42" strokeWidth="1.5" aria-hidden>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
      </svg>
    ),
  },
  {
    title: 'Visa Delivered',
    description: 'Receive your visa on time, guaranteed',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f93e42" strokeWidth="1.5" aria-hidden>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
] as const

const WHY_CHOOSE_FEATURES = [
  { emoji: '🎯', title: 'Expert Team', description: 'UAE-based visa experts with 10+ years experience' },
  { emoji: '⚡', title: 'Fast Processing', description: 'Most visas processed within 3-7 business days' },
  { emoji: '📋', title: 'Document Guidance', description: 'Step-by-step checklist for every destination' },
  { emoji: '🛡', title: 'Rejection Support', description: 'Free reapplication support if visa is rejected' },
  { emoji: '💬', title: 'WhatsApp Support', description: 'Direct WhatsApp access to your case officer' },
  { emoji: '🏆', title: '98% Success Rate', description: 'Industry-leading approval rate across all visas' },
] as const

const TESTIMONIALS = [
  {
    initials: 'AH',
    name: 'Ahmed Hassan',
    color: BRAND,
    text: 'Got my Schengen visa in 5 days. Superjet team handled everything perfectly. Highly recommended!',
    date: 'Mar 2026',
  },
  {
    initials: 'PS',
    name: 'Priya Sharma',
    color: '#5057ea',
    text: 'UK visa approved first attempt. The document checklist was very clear and the team was always available on WhatsApp.',
    date: 'Feb 2026',
  },
  {
    initials: 'MK',
    name: 'Mohammed Al Kaabi',
    color: '#22c55e',
    text: 'Applied for USA visa for my whole family. Process was smooth and transparent. Will use again.',
    date: 'Jan 2026',
  },
] as const

const FAQ_ITEMS = [
  {
    q: 'How long does visa processing take?',
    a: 'Processing time varies by destination. Schengen typically takes 10-15 days, UK 15 working days, UAE same day for most nationalities. We always aim to submit your application well within the required timeframe.',
  },
  {
    q: 'What documents do I need for a Schengen visa?',
    a: 'For Schengen you typically need: valid passport (6+ months), UAE residence visa, Emirates ID, 3-6 months bank statement, salary certificate/NOC, hotel booking, flight booking, travel insurance, and passport photos. We provide a complete checklist after you apply.',
  },
  {
    q: 'What if my visa gets rejected?',
    a: 'If your visa is rejected, our Superjet Global Protect guarantee covers you. We offer free consultation on rejection reasons and support for reapplication. In some cases, a full refund may apply.',
  },
  {
    q: 'Can I apply for my family together?',
    a: 'Yes, you can add multiple travelers in one application. Adding 2 or more travelers also unlocks a 5% discount on processing fees.',
  },
  {
    q: 'How do I track my visa application status?',
    a: 'After applying, you receive a unique application ID. You can track real-time status in your customer dashboard at /user/me or contact us on WhatsApp anytime.',
  },
] as const

function WhyChooseCard({
  emoji,
  title,
  description,
}: {
  emoji: string
  title: string
  description: string
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: '1px solid #f5f5f5',
        borderRadius: 20,
        padding: 28,
        transition: 'all 0.3s',
        boxShadow: hovered ? '0 8px 32px rgba(249,62,66,0.08)' : 'none',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: '#fff8f8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          marginBottom: 16,
        }}
      >
        {emoji}
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#111' }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#888' }}>{description}</p>
    </article>
  )
}

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div style={{ border: '1px solid #f0f0f0', borderRadius: 16, marginBottom: 12, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={onToggle}
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
        <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a', paddingRight: 16 }}>{q}</span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#888"
          strokeWidth="2"
          aria-hidden
          style={{
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s',
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div
        style={{
          padding: open ? '0 24px 20px' : '0 24px',
          maxHeight: open ? 500 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease, padding 0.3s ease',
          color: '#666',
          fontSize: 15,
          lineHeight: 1.7,
        }}
      >
        {a}
      </div>
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
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
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  const heroSearchRef = useRef<HTMLInputElement>(null)

  const handleCheckVisaRequirements = () => {
    if (isUserLoggedIn()) {
      navigate(VISA_REQUIREMENTS_PATH)
    } else {
      redirectToSignIn(navigate, VISA_REQUIREMENTS_PATH)
    }
  }

  const heroRef = useRef<HTMLElement>(null)
  const countriesSectionRef = useRef<HTMLElement>(null)
  const filterBarRef = useRef<HTMLDivElement>(null)
  const filterBarInnerRef = useRef<HTMLDivElement>(null)

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

        const savedRaw =
          localStorage.getItem('super_visa_citizenship') ?? localStorage.getItem('user_citizenship')
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

  const closeAllDropdowns = () => setOpenDropdown(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target as Node)) {
        closeAllDropdowns()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
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

  const scrollToVisaTools = () => {
    filterBarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    window.setTimeout(() => heroSearchRef.current?.focus(), 450)
  }

  const handleDestinationSearch = (term: string) => {
    setSearch(term)
    countriesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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
    isolation: 'isolate',
  }

  const filterSectionWrap: CSSProperties = {
    position: 'relative',
    zIndex: 9999,
    isolation: 'isolate',
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
      <div
        style={{
          ...filterSectionWrap,
          flex: isMobile ? '0 0 auto' : 1,
          minWidth: isMobile ? 140 : undefined,
          borderRight: '1px solid #eee',
        }}
      >
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
      <div
        style={{
          ...filterSectionWrap,
          flex: isMobile ? '0 0 auto' : 1,
          minWidth: isMobile ? 140 : undefined,
          borderRight: '1px solid #eee',
        }}
      >
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
      <div
        style={{
          ...filterSectionWrap,
          flex: isMobile ? '0 0 auto' : 1,
          minWidth: isMobile ? 140 : undefined,
          borderRight: '1px solid #eee',
        }}
      >
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
          ...filterSectionWrap,
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
            padding: isMobile ? '40px 20px 40px' : '64px 32px 48px',
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

          <div style={{ position: 'relative', zIndex: 1, maxWidth: 960, margin: '0 auto' }}>
            <p
              style={{
                margin: '0 0 16px',
                display: 'inline-block',
                padding: '6px 16px',
                borderRadius: 40,
                background: 'rgba(249,62,66,0.08)',
                border: '1px solid rgba(249,62,66,0.15)',
                color: BRAND,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ✦ Trusted visa desk for UAE residents
            </p>
            <h1
              style={{
                margin: '0 0 16px',
                fontSize: isMobile ? '2rem' : 'clamp(2.5rem, 5vw, 3.5rem)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: '#111827',
                lineHeight: 1.08,
              }}
            >
              Superjet Global{' '}
              <span style={{ color: BRAND }}>Visa Desk</span>
            </h1>
            <p
              style={{
                margin: '0 auto',
                maxWidth: 620,
                fontSize: isMobile ? 16 : 18,
                lineHeight: 1.65,
                color: '#666',
              }}
            >
              Visa support for UAE residents, families, businesses, and travel agents.
            </p>

            <div style={{ marginTop: 32 }}>
              <p
                style={{
                  margin: '0 0 14px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Popular Destinations
              </p>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                {popularDestinations.map((dest) => (
                  <DestinationChip
                    key={dest.label}
                    dest={dest}
                    onSearch={handleDestinationSearch}
                  />
                ))}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                gap: 12,
                marginTop: 32,
                maxWidth: 720,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              <HeroCtaButton
                primary
                icon={<ClipboardCheckIcon />}
                label="Check Visa Requirement"
                onClick={handleCheckVisaRequirements}
              />
              <HeroCtaButton
                icon={<HeadsetIcon />}
                label="Talk to Visa Expert"
                href={`https://wa.me/${WHATSAPP_EXPERT}`}
              />
              <HeroCtaButton
                icon={<HandshakeIcon />}
                label="Become Agent Partner"
                href={`mailto:${PARTNER_EMAIL}?subject=${encodeURIComponent('Agent Partnership Inquiry')}`}
              />
              <HeroCtaButton
                icon={<UploadIcon />}
                label="Upload Documents"
                to={isLoggedIn ? '/user/me' : '/sign-in'}
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                maxWidth: 560,
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
                onClick={scrollToVisaTools}
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

        <div id="visa-tools">
          {filterSticky && <div style={{ height: filterBarHeight }} aria-hidden />}

          <div
            ref={filterBarRef}
            style={{
              position: 'relative',
              zIndex: 9999,
              isolation: 'isolate',
              padding: isMobile ? '0 12px 16px' : '0 32px 24px',
              ...(filterSticky
                ? {
                    position: 'fixed',
                    top: 64,
                    left: 0,
                    right: 0,
                    zIndex: 9999,
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

        <main
          ref={countriesSectionRef}
          style={{ padding: isMobile ? '0 12px 48px' : '0 32px 48px' }}
        >
          <div style={{ maxWidth: 1280, margin: '0 auto 24px' }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#111827' }}>
              Explore All Destinations
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: '#888' }}>
              Filter by delivery time, visa type, and documents — find the right visa fast
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['🔥 Trending', '⚡ Fast Track', '💳 e-Visa Ready'].map((tag) => (
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

          <div className="country-cards-grid" style={{ position: 'relative', zIndex: 1 }}>
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

        {/* Trust bar */}
        <section
          style={{
            width: '100%',
            background: '#fff',
            borderTop: '1px solid #f5f5f5',
            padding: 32,
          }}
        >
          <div
            style={{
              display: isMobile ? 'grid' : 'flex',
              gridTemplateColumns: isMobile ? '1fr 1fr' : undefined,
              justifyContent: 'center',
              alignItems: 'center',
              gap: isMobile ? 24 : 48,
              flexWrap: 'wrap',
              maxWidth: 1100,
              margin: '0 auto',
            }}
          >
            {TRUST_ITEMS.map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                  {item.icon}
                </span>
                <div>
                  <strong style={{ display: 'block', fontSize: 20, color: '#111' }}>{item.value}</strong>
                  <span style={{ fontSize: 13, color: '#666' }}>{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section
          style={{
            background: 'linear-gradient(160deg, #fff8f8, #fff)',
            padding: isMobile ? '48px 16px' : '64px 32px',
            textAlign: 'center',
          }}
        >
          <h2 style={{ margin: '0 0 8px', fontSize: isMobile ? 26 : 32, fontWeight: 700, color: '#1a1a1a' }}>
            How It Works
          </h2>
          <p style={{ margin: '0 0 48px', color: '#888', fontSize: 16 }}>Get your visa in 4 simple steps</p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
              gap: isMobile ? 32 : 16,
              maxWidth: 1100,
              margin: '0 auto',
              position: 'relative',
            }}
          >
            {!isMobile &&
              HOW_IT_WORKS_STEPS.slice(0, -1).map((_, i) => (
                <div
                  key={`line-${i}`}
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: 24,
                    left: `${12.5 + i * 25}%`,
                    width: '25%',
                    borderTop: '2px dashed #f0d0d0',
                    zIndex: 0,
                  }}
                />
              ))}
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <div key={step.title} style={{ position: 'relative', zIndex: 1 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: BRAND,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>{step.icon}</div>
                <h3 style={{ margin: '12px 0 6px', fontSize: 16, fontWeight: 700, color: '#111' }}>{step.title}</h3>
                <p style={{ margin: 0, fontSize: 14, color: '#888', lineHeight: 1.5 }}>{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why choose us */}
        <section style={{ padding: isMobile ? '48px 16px' : '64px 32px', background: '#fff' }}>
          <h2 style={{ margin: '0 0 8px', fontSize: isMobile ? 26 : 32, fontWeight: 700, color: '#1a1a1a', textAlign: 'center' }}>
            Why Choose Super Visa?
          </h2>
          <p style={{ margin: '0 0 48px', color: '#888', fontSize: 16, textAlign: 'center' }}>
            Trusted by thousands of UAE residents
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
              maxWidth: 1100,
              margin: '0 auto',
            }}
          >
            {WHY_CHOOSE_FEATURES.map((f) => (
              <WhyChooseCard key={f.title} emoji={f.emoji} title={f.title} description={f.description} />
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section
          style={{
            background: 'linear-gradient(160deg, #fff8f8, #fff)',
            padding: isMobile ? '48px 16px' : '64px 32px',
          }}
        >
          <h2 style={{ margin: '0 0 8px', fontSize: isMobile ? 26 : 32, fontWeight: 700, color: '#1a1a1a', textAlign: 'center' }}>
            What Our Customers Say
          </h2>
          <p style={{ margin: '0 0 12px', color: BRAND, fontSize: 15, fontWeight: 600, textAlign: 'center' }}>
            4.8 ★ rating across all platforms
          </p>
          <div
            style={{
              display: 'flex',
              gap: 24,
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: 48,
              fontSize: 13,
              color: '#888',
            }}
          >
            {['Trustpilot', 'App Store', 'Google Play'].map((platform, i) => (
              <span key={platform}>
                {i > 0 && <span style={{ margin: '0 12px', color: '#ddd' }}>|</span>}
                {platform}
              </span>
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 20,
              overflowX: isMobile ? 'auto' : 'visible',
              flexWrap: isMobile ? 'nowrap' : 'wrap',
              justifyContent: isMobile ? 'flex-start' : 'center',
              maxWidth: 1100,
              margin: '0 auto',
              paddingBottom: isMobile ? 8 : 0,
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {TESTIMONIALS.map((t) => (
              <article
                key={t.name}
                style={{
                  flex: isMobile ? '0 0 300px' : '1 1 280px',
                  minWidth: isMobile ? 300 : 280,
                  maxWidth: 360,
                  background: '#fff',
                  borderRadius: 20,
                  padding: 28,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                }}
              >
                <div style={{ color: '#fbbf24', fontSize: 18, letterSpacing: 2 }}>★★★★★</div>
                <p style={{ margin: '12px 0 20px', color: '#444', fontSize: 15, lineHeight: 1.7 }}>
                  &ldquo;{t.text}&rdquo;
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: t.color,
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 14,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {t.initials}
                  </span>
                  <div>
                    <strong style={{ display: 'block', fontSize: 14, color: '#111' }}>{t.name}</strong>
                    <span style={{ fontSize: 12, color: '#888' }}>UAE Resident · {t.date}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Agent partner banner */}
        <section style={{ padding: isMobile ? '0 16px 48px' : '0 32px 48px' }}>
          <div
            style={{
              maxWidth: 1100,
              margin: '0 auto',
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
              borderRadius: 24,
              padding: isMobile ? '32px 24px' : '48px 64px',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'stretch' : 'center',
              gap: 32,
            }}
          >
            <div>
              <span
                style={{
                  display: 'inline-block',
                  background: 'rgba(249,62,66,0.2)',
                  color: BRAND,
                  borderRadius: 40,
                  padding: '6px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                🤝 B2B Partner Program
              </span>
              <h2
                style={{
                  margin: '12px 0 8px',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: isMobile ? 24 : 32,
                }}
              >
                Are You a Travel Agent?
              </h2>
              <p style={{ margin: '0 0 20px', color: 'rgba(255,255,255,0.6)', fontSize: 16, lineHeight: 1.6 }}>
                Join our partner network. Earn commission on every visa you refer.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {['✓ Up to 15% Commission', '✓ Real-time tracking', '✓ Dedicated support'].map((pill) => (
                  <span
                    key={pill}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: 40,
                      padding: '6px 14px',
                      color: '#fff',
                      fontSize: 13,
                    }}
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/agent/register')}
              style={{
                background: BRAND,
                color: '#fff',
                borderRadius: 40,
                padding: '16px 32px',
                fontWeight: 700,
                fontSize: 16,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(249,62,66,0.4)',
                fontFamily: 'inherit',
                width: isMobile ? '100%' : 'auto',
                flexShrink: 0,
              }}
            >
              Become Agent Partner →
            </button>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: isMobile ? '48px 16px' : '64px 32px', maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ margin: '0 0 8px', fontSize: isMobile ? 26 : 32, fontWeight: 700, color: '#1a1a1a', textAlign: 'center' }}>
            Frequently Asked Questions
          </h2>
          <p style={{ margin: '0 0 48px', color: '#888', fontSize: 16, textAlign: 'center' }}>
            Everything you need to know about visa applications
          </p>
          {FAQ_ITEMS.map((item, i) => (
            <FaqItem
              key={item.q}
              q={item.q}
              a={item.a}
              open={openFaqIndex === i}
              onToggle={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
            />
          ))}
        </section>

        <section
          aria-labelledby="visa-requirements-heading"
          style={{
            padding: isMobile ? '0 12px 32px' : '0 32px 32px',
          }}
        >
          <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Section 1: Visa Requirements */}
            <article
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 24,
                background: 'linear-gradient(135deg, #fff 0%, #fff8f8 50%, #f8f8ff 100%)',
                border: '1px solid rgba(249,62,66,0.1)',
                boxShadow: '0 8px 40px rgba(249,62,66,0.06)',
                padding: isMobile ? 24 : 40,
              }}
            >
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  width: 280,
                  height: 280,
                  borderRadius: '50%',
                  background: 'rgba(249,62,66,0.06)',
                  filter: 'blur(40px)',
                  top: -80,
                  right: -60,
                  pointerEvents: 'none',
                }}
              />
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  background: 'rgba(80,87,234,0.05)',
                  filter: 'blur(40px)',
                  bottom: -40,
                  left: -40,
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  position: 'relative',
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'auto 1fr',
                  gap: isMobile ? 24 : 40,
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: isMobile ? 88 : 112,
                    height: isMobile ? 88 : 112,
                    borderRadius: 24,
                    background: '#fff',
                    border: '1px solid rgba(249,62,66,0.12)',
                    boxShadow: '0 4px 20px rgba(249,62,66,0.08)',
                    margin: isMobile ? '0 auto' : undefined,
                  }}
                >
                  <PassportVisaIcon size={isMobile ? 44 : 56} />
                </div>
                <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
                  <h2
                    id="visa-requirements-heading"
                    style={{
                      margin: '0 0 12px',
                      fontSize: isMobile ? 22 : 28,
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                      color: '#111827',
                    }}
                  >
                    Visa Requirements
                  </h2>
                  <p
                    style={{
                      margin: '0 0 24px',
                      fontSize: isMobile ? 15 : 16,
                      lineHeight: 1.7,
                      color: '#666',
                      maxWidth: 720,
                      marginLeft: isMobile ? 'auto' : undefined,
                      marginRight: isMobile ? 'auto' : undefined,
                    }}
                  >
                    Check the visa requirements, required documents, processing timelines, and application
                    guidelines for your destination. Our team helps UAE residents, families, businesses, and
                    travelers prepare complete and accurate applications.
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 12,
                      justifyContent: isMobile ? 'center' : 'flex-start',
                    }}
                  >
                    <SectionCta
                      primary
                      label="Check Visa Requirements"
                      onClick={handleCheckVisaRequirements}
                    />
                    <SectionCta
                      label="Talk to Visa Expert"
                      href={`https://wa.me/${WHATSAPP_EXPERT}`}
                    />
                  </div>
                </div>
              </div>
            </article>

            {/* Section 2: Become an Agent Partner */}
            <article
              style={{
                borderRadius: 24,
                background: '#fff',
                border: '1px solid #eee',
                boxShadow: '0 4px 32px rgba(0,0,0,0.04)',
                padding: isMobile ? 24 : 40,
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: isMobile ? 28 : 48,
                  alignItems: 'start',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      marginBottom: 16,
                      justifyContent: isMobile ? 'center' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        background: 'linear-gradient(135deg, rgba(80,87,234,0.08), rgba(249,62,66,0.08))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <PartnerBriefcaseIcon size={36} />
                    </div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: isMobile ? 22 : 26,
                        fontWeight: 800,
                        letterSpacing: '-0.02em',
                        color: '#111827',
                      }}
                    >
                      Become an Agent Partner
                    </h2>
                  </div>
                  <p
                    style={{
                      margin: '0 0 24px',
                      fontSize: isMobile ? 15 : 16,
                      lineHeight: 1.7,
                      color: '#666',
                      textAlign: isMobile ? 'center' : 'left',
                    }}
                  >
                    Partner with Superjet Global Visa Desk and expand your travel business with access to visa
                    processing support, dedicated assistance, and competitive partnership opportunities. Ideal
                    for travel agencies, consultants, and businesses serving international travelers.
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 12,
                      justifyContent: isMobile ? 'center' : 'flex-start',
                    }}
                  >
                    <SectionCta
                      primary
                      label="Become an Agent Partner"
                      href={`mailto:${PARTNER_EMAIL}?subject=${encodeURIComponent('Agent Partnership Application')}`}
                    />
                    <SectionCta label="Contact Partnership Team" to="/contact" />
                  </div>
                </div>

                <div
                  style={{
                    background: '#f9fafb',
                    borderRadius: 16,
                    border: '1px solid #eee',
                    padding: isMobile ? 20 : 24,
                  }}
                >
                  <h3
                    style={{
                      margin: '0 0 12px',
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#111827',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Eligibility
                  </h3>
                  <ul
                    style={{
                      margin: '0 0 20px',
                      paddingLeft: 18,
                      fontSize: 14,
                      lineHeight: 1.65,
                      color: '#555',
                    }}
                  >
                    <li>Must be a registered travel agency, tourism company, consultancy, or legitimate business entity.</li>
                    <li>Must comply with applicable UAE laws and regulations.</li>
                    <li>Must provide accurate business information during registration.</li>
                  </ul>
                  <h3
                    style={{
                      margin: '0 0 12px',
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#111827',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Disclaimer
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: '#888' }}>
                    Agent partnership approval is subject to verification and review by Superjet Global Visa
                    Desk. Submission of an application does not guarantee approval. Additional documents may
                    be requested during the verification process.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </section>

        <SiteFooter isMobile={isMobile} />
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
