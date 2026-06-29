import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { CountryFlag } from './CountryFlag'
import { filterPhoneCodeOptions, getPhoneCodeOptions, type PhoneCodeOption } from '../utils/phoneDialCodes'

type PhoneCountryCodePickerProps = {
  value: string
  onChange: (countryCode: string) => void
  onBlur?: () => void
  invalid?: boolean
  inputStyle?: CSSProperties
}

export function PhoneCountryCodePicker({
  value,
  onChange,
  onBlur,
  invalid,
  inputStyle = {},
}: PhoneCountryCodePickerProps) {
  const options = useMemo(() => getPhoneCodeOptions(), [])
  const selected = options.find((o) => o.countryCode === value) ?? options.find((o) => o.countryCode === 'ae')!
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(
    () => (query.trim() ? filterPhoneCodeOptions(options, query, 50) : options),
    [options, query],
  )

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const pick = (opt: PhoneCodeOption) => {
    onChange(opt.countryCode)
    setOpen(false)
    setQuery('')
  }

  const borderColor = invalid ? '#fca5a5' : (inputStyle.border as string | undefined) ?? '#e5e7eb'

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '46%', minWidth: 168, maxWidth: 220, flexShrink: 0 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          ...inputStyle,
          marginTop: 0,
          padding: '10px 10px',
          border: `1px solid ${borderColor}`,
          borderRadius: inputStyle.borderRadius ?? 10,
          background: '#fff',
          cursor: 'text',
        }}
      >
        <CountryFlag code={selected.countryCode} countryName={selected.countryName} size="sm" />
        <input
          type="text"
          value={open ? query : selected.dial}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            setOpen(true)
            setQuery('')
          }}
          onBlur={() => {
            window.setTimeout(() => {
              setOpen(false)
              setQuery('')
              onBlur?.()
            }, 150)
          }}
          placeholder={open ? 'Search country…' : selected.dial}
          aria-label="Search country calling code"
          aria-expanded={open}
          aria-haspopup="listbox"
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            width: '100%',
            minWidth: 0,
            fontSize: 14,
            fontWeight: open ? 400 : 600,
            color: '#111827',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {open && (
        <ul
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            margin: 0,
            padding: 6,
            listStyle: 'none',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
            maxHeight: 260,
            overflowY: 'auto',
            zIndex: 50,
          }}
        >
          {filtered.length === 0 ? (
            <li style={{ padding: '12px 10px', fontSize: 13, color: '#6b7280', textAlign: 'center' }}>
              No countries match &ldquo;{query}&rdquo;
            </li>
          ) : (
            filtered.map((opt) => {
              const active = opt.countryCode === value
              return (
                <li key={opt.countryCode}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(opt)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 10px',
                      border: 'none',
                      borderRadius: 8,
                      background: active ? '#eff6ff' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                    }}
                  >
                    <CountryFlag code={opt.countryCode} countryName={opt.countryName} size="sm" />
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#111827', minWidth: 44 }}>{opt.dial}</span>
                    <span style={{ fontSize: 13, color: '#4b5563', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {opt.countryName}
                    </span>
                  </button>
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}
