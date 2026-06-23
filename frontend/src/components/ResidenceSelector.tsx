import { useMemo, useState } from 'react'
import {
  ALL_CITIZENSHIPS,
  CITIZENSHIP_COUNT,
  getPopularCitizenships,
  type CitizenshipEntry,
} from '../data/citizenships'
import { RESIDENCY_STATUS_OPTIONS, type ResidencyStatus } from '../utils/visaRequirements'
import { CountryFlag } from './CountryFlag'

const ACCENT = '#5057ea'

function CountryPill({
  entry,
  selected,
  onSelect,
}: {
  entry: CitizenshipEntry
  selected: boolean
  onSelect: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        border: selected ? 'none' : '1px solid #eee',
        borderRadius: 40,
        padding: '8px 14px',
        fontSize: 13,
        cursor: 'pointer',
        margin: 4,
        flex: '0 0 calc(33.333% - 8px)',
        boxSizing: 'border-box',
        justifyContent: 'flex-start',
        background: selected ? ACCENT : hovered ? '#f5f5f5' : '#fff',
        color: selected ? '#fff' : '#333',
        minWidth: 0,
      }}
    >
      <CountryFlag code={entry.code} countryName={entry.name} size="sm" />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {entry.name}
      </span>
    </button>
  )
}

type ResidenceSelectorProps = {
  residenceCountry: string
  residenceCode: string
  residencyStatus: ResidencyStatus
  onResidenceChange: (name: string, code: string) => void
  onStatusChange: (status: ResidencyStatus) => void
  showStatus?: boolean
  compact?: boolean
}

export function ResidenceSelector({
  residenceCountry,
  residenceCode,
  residencyStatus,
  onResidenceChange,
  onStatusChange,
  showStatus = true,
  compact = false,
}: ResidenceSelectorProps) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(!compact)

  const popular = useMemo(() => getPopularCitizenships(), [])
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return ALL_CITIZENSHIPS
    return ALL_CITIZENSHIPS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
    )
  }, [search])

  const showPopular = !search.trim()

  return (
    <div>
      <p style={{ margin: compact ? '0 0 8px' : '0 0 8px', fontSize: 13, fontWeight: 600, color: '#333' }}>
        {compact ? 'I currently live in:' : 'You currently live in:'}
      </p>

      {compact && !expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            border: `1.5px solid ${ACCENT}`,
            borderRadius: 40,
            padding: '10px 18px',
            background: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 14,
            fontFamily: 'inherit',
            maxWidth: '100%',
          }}
        >
          <CountryFlag code={residenceCode} countryName={residenceCountry} size="md" />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {residenceCountry}
          </span>
        </button>
      ) : (
        <>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for a country"
            style={{
              width: '100%',
              border: '1px solid #eee',
              borderRadius: 12,
              padding: '10px 14px',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: 8,
            }}
          />
          <p style={{ margin: '0 0 4px', fontSize: 12, color: '#888' }}>
            All countries <span style={{ color: '#bbb' }}>[{CITIZENSHIP_COUNT}]</span>
          </p>
          <div style={{ maxHeight: compact ? 160 : 200, overflowY: 'auto' }}>
            {showPopular && (
              <div style={{ display: 'flex', flexWrap: 'wrap', margin: '-4px' }}>
                {popular.map((entry) => (
                  <CountryPill
                    key={entry.code}
                    entry={entry}
                    selected={entry.code === residenceCode}
                    onSelect={() => {
                      onResidenceChange(entry.name, entry.code)
                      if (compact) setExpanded(false)
                    }}
                  />
                ))}
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', margin: '-4px' }}>
              {(showPopular
                ? filtered.filter((c) => !popular.some((p) => p.code === c.code))
                : filtered
              ).map((entry) => (
                <CountryPill
                  key={entry.code}
                  entry={entry}
                  selected={entry.code === residenceCode}
                  onSelect={() => {
                    onResidenceChange(entry.name, entry.code)
                    if (compact) setExpanded(false)
                  }}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {showStatus && (
        <div style={{ marginTop: compact ? 16 : 20 }}>
          <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#333' }}>
            My status in {residenceCountry}:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {RESIDENCY_STATUS_OPTIONS.map((opt) => {
              const selected = residencyStatus === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onStatusChange(opt.id)}
                  style={{
                    border: selected ? 'none' : '1px solid #eee',
                    borderRadius: 40,
                    padding: '8px 18px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: selected ? ACCENT : '#fff',
                    color: selected ? '#fff' : '#666',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
