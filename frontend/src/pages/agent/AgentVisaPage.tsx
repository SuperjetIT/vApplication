import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AgentPageShell, FlagImage } from '../../components/agent/AgentUI'
import { AgentLayout } from '../../components/AgentLayout'
import { AGENT_BASE_PATH } from '../../config/portalRoutes'
import { getCountry } from '../../data/countries'
import { Database } from '../../database/db'
import { useDatabaseListener } from '../../hooks/useDatabase'
import {
  AGENT_ACCENT,
  AGENT_CARD,
  AGENT_EARN_BG,
  AGENT_EARN_TEXT,
  AGENT_MUTED,
  AGENT_PRIMARY,
} from '../../theme/agentTheme'
import { getAgentPartnerId, isAgentLoggedIn, parseFeeAed } from '../../utils/agentSession'
import { evisaBadgeLabel, checkEvisaSupport } from '../../utils/evisaSupport'

export default function AgentVisaPage() {
  const { countrySlug } = useParams()
  const navigate = useNavigate()
  const dbVersion = useDatabaseListener()
  const country = countrySlug ? getCountry(countrySlug) : undefined
  const partner = useMemo(() => Database.getPartnerById(getAgentPartnerId() ?? ''), [dbVersion])
  const rate = Number(partner?.commissionRate ?? 15)
  const [optionIndex, setOptionIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  const pricing = useMemo(() => {
    if (!country) return null
    const opt = country.visaOptions[optionIndex] ?? country.visaOptions[0]
    const gov = parseFeeAed(opt.fee)
    const proc = parseFeeAed(opt.processingFee)
    const cost = gov + proc
    const commission = Math.round(gov * (rate / 100))
    return { gov, proc, cost, commission, suggested: cost + commission, opt }
  }, [country, rate, optionIndex])

  if (!country || !pricing) {
    return (
      <AgentLayout>
        <p>Country not found.</p>
        <Link to={AGENT_BASE_PATH} style={{ color: AGENT_ACCENT }}>← Back to dashboard</Link>
      </AgentLayout>
    )
  }

  const evisa = checkEvisaSupport(country.slug)

  return (
    <AgentLayout>
      <AgentPageShell loading={loading}>
        <Link to={AGENT_BASE_PATH} style={{ color: AGENT_ACCENT, textDecoration: 'none', fontSize: 14, marginBottom: 20, display: 'inline-block' }}>← Back to dashboard</Link>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 32, alignItems: 'start' }}>
          <div>
            <div style={{ background: AGENT_CARD, borderRadius: 20, padding: 24, marginBottom: 20, boxShadow: '0 2px 12px rgba(37,99,235,0.06)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <FlagImage countryCode={country.countryCode} countryName={country.name} width={48} height={34} style={{ borderRadius: 6 }} />
                <div>
                  <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: AGENT_PRIMARY }}>{country.name}</h1>
                  <span style={{ fontSize: 12, color: AGENT_MUTED }}>{evisaBadgeLabel(evisa)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {country.visaOptions.length > 1 && (
                  <div style={{ width: '100%', marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: AGENT_PRIMARY }}>Visa option</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {country.visaOptions.map((opt, idx) => (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => setOptionIndex(idx)}
                          style={{
                            borderRadius: 20,
                            padding: '8px 14px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: idx === optionIndex ? `2px solid ${AGENT_ACCENT}` : '1px solid #e2e8f0',
                            background: idx === optionIndex ? '#eff6ff' : '#fff',
                            color: idx === optionIndex ? AGENT_ACCENT : AGENT_MUTED,
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {[['Type', country.visaType], ['Validity', pricing.opt.validity], ['Processing', pricing.opt.processingTime], ['Entry', pricing.opt.entry]].map(([k, v]) => (
                  <span key={k} style={{ background: '#f8fafc', borderRadius: 20, padding: '6px 14px', fontSize: 12 }}><strong>{k}:</strong> {v}</span>
                ))}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: AGENT_PRIMARY }}>Documents Required</h3>
              <ul style={{ margin: 0, paddingLeft: 20, color: AGENT_MUTED, fontSize: 14, lineHeight: 1.8 }}>
                {country.documents.map((d) => <li key={d}>{d}</li>)}
              </ul>
            </div>
          </div>

          <div style={{ position: 'sticky', top: 88 }}>
            <div style={{ background: AGENT_CARD, borderRadius: 20, boxShadow: '0 4px 24px rgba(37,99,235,0.08)', padding: 24, border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16, color: AGENT_PRIMARY }}>B2B Pricing</div>
              <div style={{ fontSize: 14, color: AGENT_MUTED, lineHeight: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Government Fee</span><span>AED {pricing.gov}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Processing Fee</span><span>AED {pricing.proc}</span></div>
                <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '12px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, color: AGENT_PRIMARY }}><span>Your Cost</span><span>AED {pricing.cost}</span></div>
              </div>

              <div style={{ background: AGENT_EARN_BG, border: '1px solid #bbf7d0', borderRadius: 12, padding: 16, marginTop: 20 }}>
                <div style={{ fontWeight: 700, color: AGENT_EARN_TEXT, fontSize: 13 }}>You Earn</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: AGENT_EARN_TEXT, marginTop: 4 }}>AED {pricing.commission}</div>
                <div style={{ fontSize: 12, color: AGENT_MUTED, marginTop: 6 }}>Suggested customer price: AED {pricing.suggested}</div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const applyPath = `${AGENT_BASE_PATH}/apply?destination=${country.slug}&option=${encodeURIComponent(pricing.opt.label)}`
                  if (!isAgentLoggedIn()) {
                    navigate('/agent/login')
                    return
                  }
                  navigate(applyPath)
                }}
                style={{ width: '100%', background: AGENT_ACCENT, color: '#fff', border: 'none', borderRadius: 16, padding: 16, fontWeight: 700, fontSize: 15, marginTop: 20, cursor: 'pointer' }}
              >
                Apply for Customer →
              </button>
            </div>
          </div>
        </div>
      </AgentPageShell>
    </AgentLayout>
  )
}
