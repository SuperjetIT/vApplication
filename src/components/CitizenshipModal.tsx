import { useMemo, useState } from 'react'
import {
  ALL_CITIZENSHIPS,
  CITIZENSHIP_COUNT,
  getPopularCitizenships,
  type CitizenshipEntry,
} from '../data/citizenships'
import { useCitizenship } from '../context/CitizenshipContext'
import { flagUrl } from '../utils/flags'

const ACCENT = '#5057ea'

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 20h4l10-10-4-4L4 16v4zM14 6l4 4"
        stroke={ACCENT}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CitizenshipPill({
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
      <img
        src={flagUrl(entry.code, 20)}
        alt=""
        width={20}
        height={14}
        style={{ borderRadius: 2, objectFit: 'cover', flexShrink: 0 }}
      />
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {entry.name}
      </span>
    </button>
  )
}

export function CitizenshipModal() {
  const {
    citizenship,
    countryCode,
    setCitizenship,
    closeCitizenshipModal,
    detectedCountryHint,
  } = useCitizenship()
  const [editing, setEditing] = useState(false)
  const [search, setSearch] = useState('')
  const [inputFocused, setInputFocused] = useState(false)

  const popular = useMemo(() => getPopularCitizenships(), [])
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return ALL_CITIZENSHIPS
    return ALL_CITIZENSHIPS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
    )
  }, [search])

  const showPopular = !search.trim()

  const handleSelect = (entry: CitizenshipEntry) => {
    setCitizenship(entry.name, entry.code)
    closeCitizenshipModal()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="citizenship-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={closeCitizenshipModal}
    >
      <div
        style={{
          position: 'relative',
          background: '#fff',
          borderRadius: 24,
          padding: 32,
          maxWidth: 500,
          width: '90%',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={closeCitizenshipModal}
          style={{
            position: 'absolute',
            top: 16,
            right: 20,
            border: 'none',
            background: 'none',
            fontSize: 20,
            color: '#999',
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          ×
        </button>

        <h2
          id="citizenship-modal-title"
          style={{ margin: 0, fontWeight: 700, fontSize: 22, color: '#111' }}
        >
          Your Citizenship
        </h2>
        <p style={{ margin: '8px 0 0', color: '#666', fontSize: 14, lineHeight: 1.5, paddingRight: 24 }}>
          This is the nationality on your passport. It determines your visa requirements and where you
          can travel visa-free
        </p>
        {detectedCountryHint && (
          <p style={{ margin: '8px 0 0', color: ACCENT, fontSize: 13, fontWeight: 500 }}>
            We detected you&apos;re browsing from {detectedCountryHint}
          </p>
        )}

        <p style={{ margin: '20px 0 8px', color: '#888', fontSize: 13 }}>
          I live in UAE and am a citizen of
        </p>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            border: `1.5px solid ${ACCENT}`,
            borderRadius: 40,
            padding: '8px 16px',
            background: '#fff',
            cursor: 'pointer',
            alignSelf: 'flex-start',
          }}
        >
          <img
            src={flagUrl(countryCode, 20)}
            alt=""
            width={20}
            height={14}
            style={{ borderRadius: 2, objectFit: 'cover' }}
          />
          <span style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>{citizenship}</span>
          <PencilIcon />
        </button>

        {(editing || search.length > 0) && (
          <>
            <p style={{ margin: '16px 0 8px', fontWeight: 700, fontSize: 14, color: '#111' }}>
              Enter a new citizenship
            </p>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Search for a country"
              style={{
                width: '100%',
                border: `1px solid ${inputFocused ? ACCENT : '#eee'}`,
                borderRadius: 12,
                padding: '12px 16px',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </>
        )}

        <p style={{ margin: '16px 0 0', fontSize: 13, color: '#888' }}>
          All citizenships{' '}
          <span style={{ color: '#bbb' }}>[{CITIZENSHIP_COUNT}]</span>
        </p>

        <div style={{ overflowY: 'auto', flex: 1, marginTop: 12, minHeight: 0 }}>
          {showPopular && (
            <div style={{ display: 'flex', flexWrap: 'wrap', margin: '-4px' }}>
              {popular.map((entry) => (
                <CitizenshipPill
                  key={entry.code}
                  entry={entry}
                  selected={entry.code === countryCode}
                  onSelect={() => handleSelect(entry)}
                />
              ))}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', margin: '-4px' }}>
            {(showPopular
              ? filtered.filter((c) => !popular.some((p) => p.code === c.code))
              : filtered
            ).map((entry) => (
              <CitizenshipPill
                key={entry.code}
                entry={entry}
                selected={entry.code === countryCode}
                onSelect={() => handleSelect(entry)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
