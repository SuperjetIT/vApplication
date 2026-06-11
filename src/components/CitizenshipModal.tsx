import { useEffect, useMemo, useState } from 'react'
import {
  ALL_CITIZENSHIPS,
  CITIZENSHIP_COUNT,
  getPopularCitizenships,
  type CitizenshipEntry,
} from '../data/citizenships'
import { useCitizenship } from '../context/CitizenshipContext'
import { ResidenceSelector } from './ResidenceSelector'
import type { ResidencyStatus } from '../utils/visaRequirements'
import { flagUrl } from '../utils/flags'

const ACCENT = '#5057ea'

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
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {entry.name}
      </span>
    </button>
  )
}

export function CitizenshipModal() {
  const {
    citizenship,
    countryCode,
    residenceCountry,
    residenceCode,
    residencyStatus,
    saveProfile,
    closeCitizenshipModal,
    detectedCountryHint,
  } = useCitizenship()

  const [draftCitizenship, setDraftCitizenship] = useState(citizenship)
  const [draftCode, setDraftCode] = useState(countryCode)
  const [draftResidence, setDraftResidence] = useState(residenceCountry)
  const [draftResidenceCode, setDraftResidenceCode] = useState(residenceCode)
  const [draftStatus, setDraftStatus] = useState<ResidencyStatus>(residencyStatus)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setDraftCitizenship(citizenship)
    setDraftCode(countryCode)
    setDraftResidence(residenceCountry)
    setDraftResidenceCode(residenceCode)
    setDraftStatus(residencyStatus)
  }, [citizenship, countryCode, residenceCountry, residenceCode, residencyStatus])

  const popular = useMemo(() => getPopularCitizenships(), [])
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return ALL_CITIZENSHIPS
    return ALL_CITIZENSHIPS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
    )
  }, [search])

  const showPopular = !search.trim()

  const handleSave = () => {
    saveProfile(draftCitizenship, draftCode, draftResidence, draftResidenceCode, draftStatus)
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
          maxWidth: 520,
          width: '90%',
          maxHeight: '85vh',
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

        <h2 id="citizenship-modal-title" style={{ margin: 0, fontWeight: 700, fontSize: 22, color: '#111' }}>
          Your Travel Profile
        </h2>
        <p style={{ margin: '8px 0 0', color: '#666', fontSize: 14, lineHeight: 1.5, paddingRight: 24 }}>
          Passport nationality, where you live, and your residency status determine visa requirements.
        </p>
        {detectedCountryHint && (
          <p style={{ margin: '8px 0 0', color: ACCENT, fontSize: 13, fontWeight: 500 }}>
            We detected you&apos;re browsing from {detectedCountryHint}
          </p>
        )}

        <div style={{ overflowY: 'auto', flex: 1, marginTop: 20, minHeight: 0 }}>
          <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#333' }}>
            Your passport is from:
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <img src={flagUrl(draftCode, 20)} alt="" width={20} height={14} style={{ borderRadius: 2 }} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>{draftCitizenship}</span>
          </div>

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search passport country"
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
            All citizenships <span style={{ color: '#bbb' }}>[{CITIZENSHIP_COUNT}]</span>
          </p>
          <div style={{ marginBottom: 20 }}>
            {showPopular && (
              <div style={{ display: 'flex', flexWrap: 'wrap', margin: '-4px' }}>
                {popular.map((entry) => (
                  <CitizenshipPill
                    key={entry.code}
                    entry={entry}
                    selected={entry.code === draftCode}
                    onSelect={() => {
                      setDraftCitizenship(entry.name)
                      setDraftCode(entry.code)
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
                <CitizenshipPill
                  key={entry.code}
                  entry={entry}
                  selected={entry.code === draftCode}
                  onSelect={() => {
                    setDraftCitizenship(entry.name)
                    setDraftCode(entry.code)
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 20, marginBottom: 20 }}>
            <ResidenceSelector
              residenceCountry={draftResidence}
              residenceCode={draftResidenceCode}
              residencyStatus={draftStatus}
              onResidenceChange={(name, code) => {
                setDraftResidence(name)
                setDraftResidenceCode(code)
              }}
              onStatusChange={setDraftStatus}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          style={{
            width: '100%',
            marginTop: 12,
            padding: 14,
            background: ACCENT,
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Save profile
        </button>
      </div>
    </div>
  )
}
