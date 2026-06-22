import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AgentKeyframes, AgentPageShell, FlagImage, MonthProgressRing } from '../../components/agent/AgentUI'
import { AgentLayout } from '../../components/AgentLayout'
import { AGENT_BASE_PATH } from '../../config/portalRoutes'
import { countries } from '../../data/countries'
import { Database } from '../../database/db'
import { useDatabaseListener } from '../../hooks/useDatabase'
import {
  AGENT_ACCENT,
  AGENT_CARD,
  AGENT_COMMISSION_BG,
  AGENT_COMMISSION_TEXT,
  AGENT_EARN_BG,
  AGENT_EARN_TEXT,
  AGENT_GRADIENTS,
  AGENT_MUTED,
  AGENT_PRIMARY,
} from '../../theme/agentTheme'
import { getAgentPartnerId, parseFeeAed } from '../../utils/agentSession'

function statusStyle(status: string) {
  const s = status.toLowerCase()
  if (s === 'approved') return { bg: '#dcfce7', color: '#166534' }
  if (s === 'rejected') return { bg: '#fee2e2', color: '#dc2626' }
  if (s.includes('pending')) return { bg: '#fef3c7', color: '#a16207' }
  return { bg: '#eff6ff', color: AGENT_ACCENT }
}

export default function AgentDashboard() {
  const navigate = useNavigate()
  const dbVersion = useDatabaseListener()
  const partnerId = getAgentPartnerId() ?? ''
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  const partner = useMemo(
    () => Database.getPartnerById(partnerId),
    [partnerId, dbVersion],
  )
  const myApplications = useMemo(
    () => Database.getApplications({ partnerId, type: 'b2b' }),
    [partnerId, dbVersion],
  )
  const myCommissions = useMemo(
    () => Database.getCommissions({ partnerId }),
    [partnerId, dbVersion],
  )
  const rate = Number(partner?.commissionRate ?? 15)

  const stats = useMemo(() => {
    const active = myApplications.filter((a) => !['approved', 'rejected', 'closed'].includes(String(a.status).toLowerCase())).length
    const approved = myApplications.filter((a) => String(a.status).toLowerCase() === 'approved').length
    const pendingComm = myCommissions.filter((c) => String(c.status).toLowerCase() === 'pending').reduce((s, c) => s + Number(c.commissionAmount ?? 0), 0)
    const monthKey = new Date().toISOString().slice(0, 7)
    const monthApps = myApplications.filter((a) => String(a.createdAt).slice(0, 7) === monthKey).length
    const monthRevenue = myApplications
      .filter((a) => String(a.createdAt).slice(0, 7) === monthKey)
      .reduce((s, a) => s + Number((a.amount as { total?: number })?.total ?? 0), 0)
    const paidComm = myCommissions.filter((c) => String(c.status) === 'paid').reduce((s, c) => s + Number(c.commissionAmount ?? 0), 0)
    return { active, approved, pendingComm, monthRevenue, monthApps, paidComm }
  }, [myApplications, myCommissions])

  const popular = useMemo(
    () => countries.filter((c) => c.visaOptions.length > 0).slice(0, 8),
    [],
  )
  const recent = useMemo(
    () => [...myApplications].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 5),
    [myApplications],
  )

  if (!partner && !loading) {
    return (
      <AgentLayout>
        <p>Partner not found. Please sign in again.</p>
      </AgentLayout>
    )
  }

  const statPills = [
    `Applications: ${myApplications.length}`,
    `This Month Revenue: AED ${stats.monthRevenue.toLocaleString()}`,
    `Commission Earned: AED ${stats.paidComm.toLocaleString()}`,
  ]

  return (
    <AgentLayout>
      <AgentKeyframes />
      <AgentPageShell loading={loading}>
        <div style={{
          background: AGENT_GRADIENTS.welcomeShimmer,
          backgroundSize: '200% 200%',
          animation: 'shimmer 4s ease infinite, float3d 6s ease-in-out infinite',
          borderRadius: 24,
          padding: 32,
          color: '#fff',
          marginBottom: 28,
          position: 'relative',
          overflow: 'hidden',
          transformStyle: 'preserve-3d',
        }}>
          <div style={{
            position: 'absolute',
            right: 80,
            top: '50%',
            transform: 'translateY(-50%) rotate(-15deg)',
            width: 120,
            height: 80,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            animation: 'float3d 4s ease-in-out infinite',
            animationDelay: '1s',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}>
            <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5">
              <path d="M2 12h20M12 2l4 10-4 10-4-10 4-10z" />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600 }}>B2B Partner</span>
          </div>
          {[0, 0.5, 1].map((delay, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                top: 20 + i * 28,
                right: 24 + i * 40,
                animation: 'float3d 5s ease-in-out infinite',
                animationDelay: `${delay}s`,
              }}
            />
          ))}

          <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700, animation: 'slideInLeft 0.5s ease' }}>
            Welcome back, {String(partner?.contactPerson)} 👋
          </h1>
          <p style={{ margin: '0 0 20px', color: 'rgba(255,255,255,0.75)', fontSize: 15 }}>{String(partner?.companyName)}</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {statPills.map((pill, i) => (
              <span
                key={pill}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  borderRadius: 40,
                  padding: '8px 16px',
                  fontSize: 13,
                  animation: 'slideInLeft 0.4s ease',
                  animationDelay: `${i * 0.1}s`,
                  animationFillMode: 'both',
                }}
              >
                {pill}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Total Applications', value: myApplications.length, grad: AGENT_GRADIENTS.statNavy, color: AGENT_PRIMARY },
            { label: 'Active', value: stats.active, grad: AGENT_GRADIENTS.statBlue, color: AGENT_ACCENT },
            { label: 'Approved', value: stats.approved, grad: AGENT_GRADIENTS.statGreen, color: '#166534' },
            { label: 'Commission Pending', value: `AED ${stats.pendingComm.toLocaleString()}`, grad: AGENT_GRADIENTS.statAmber, color: '#a16207' },
          ].map((c) => (
            <div key={c.label} style={{ background: AGENT_CARD, borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(37,99,235,0.06)', border: '1px solid #e2e8f0' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: c.grad, marginBottom: 12 }} />
              <div style={{ fontSize: 22, fontWeight: 800, color: c.color, animation: 'countUp 0.5s ease' }}>{c.value}</div>
              <div style={{ fontSize: 13, color: AGENT_MUTED, marginTop: 4 }}>{c.label}</div>
            </div>
          ))}
        </div>

        <div style={{
          background: AGENT_CARD,
          borderRadius: 16,
          padding: 20,
          marginBottom: 28,
          boxShadow: '0 2px 12px rgba(37,99,235,0.06)',
          border: '1px solid #e2e8f0',
        }}>
          <MonthProgressRing current={stats.monthApps} target={20} />
        </div>

        <button
          type="button"
          onClick={() => navigate(`${AGENT_BASE_PATH}/apply`)}
          style={{
            width: '100%',
            background: AGENT_ACCENT,
            color: '#fff',
            border: 'none',
            borderRadius: 16,
            padding: 20,
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: 32,
          }}
        >
          + New Application
        </button>

        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: AGENT_PRIMARY }}>Popular Destinations</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
          {popular.map((country) => {
            const opt = country.visaOptions[0]
            const gov = parseFeeAed(opt.fee)
            const proc = parseFeeAed(opt.processingFee)
            const cost = gov + proc
            const commission = Math.round(gov * (rate / 100))
            const sellPrice = cost + commission
            const visaBadge = country.visaType === 'Sticker' ? 'Sticker' : 'e-Visa'

            return (
              <div
                key={country.slug}
                style={{
                  background: AGENT_CARD,
                  borderRadius: 16,
                  padding: 20,
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(37,99,235,0.12)'
                  e.currentTarget.style.borderColor = AGENT_ACCENT
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
                  e.currentTarget.style.borderColor = '#e2e8f0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FlagImage countryCode={country.countryCode} countryName={country.name} />
                    <span style={{ fontWeight: 700, fontSize: 15, color: AGENT_PRIMARY }}>{country.name}</span>
                  </div>
                  <span style={{
                    background: '#eff6ff',
                    color: AGENT_ACCENT,
                    borderRadius: 20,
                    padding: '3px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                  }}>
                    {visaBadge}
                  </span>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: AGENT_MUTED }}>B2B Price</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: AGENT_PRIMARY }}>AED {sellPrice}</div>
                </div>
                <div style={{ background: AGENT_EARN_BG, borderRadius: 8, padding: '6px 10px', marginBottom: 14 }}>
                  <span style={{ color: AGENT_EARN_TEXT, fontWeight: 700, fontSize: 13 }}>You earn: AED {commission}</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`${AGENT_BASE_PATH}/apply?destination=${country.slug}`)}
                  style={{
                    width: '100%',
                    background: AGENT_ACCENT,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Apply Now →
                </button>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: AGENT_PRIMARY }}>Recent Applications</h2>
          <Link to={`${AGENT_BASE_PATH}/applications`} style={{ color: AGENT_ACCENT, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>View all →</Link>
        </div>
        <div style={{ background: AGENT_CARD, borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(37,99,235,0.06)', border: '1px solid #e2e8f0' }}>
          {recent.length === 0 ? (
            <p style={{ padding: 24, color: AGENT_MUTED, margin: 0 }}>No applications yet. Submit your first application.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Customer', 'Destination', 'Status', 'Amount', 'Commission', 'Date'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: AGENT_MUTED, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((app) => {
                  const travelers = app.travelers as { firstName?: string; lastName?: string }[] | undefined
                  const name = travelers?.[0] ? `${travelers[0].firstName ?? ''} ${travelers[0].lastName ?? ''}`.trim() : 'Customer'
                  const amt = (app.amount as { total?: number })?.total ?? 0
                  const comm = myCommissions.find((c) => String(c.applicationId) === String(app.id))
                  const sc = statusStyle(String(app.status))
                  return (
                    <tr key={String(app.id)} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: AGENT_PRIMARY }}>{name}</td>
                      <td style={{ padding: '12px 16px' }}>{String(app.destinationName ?? app.destination)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>{String(app.status)}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>AED {Number(amt).toLocaleString()}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: AGENT_COMMISSION_BG, color: AGENT_COMMISSION_TEXT, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                          AED {Number(comm?.commissionAmount ?? 0).toLocaleString()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: AGENT_MUTED }}>{String(app.createdAt).slice(0, 10)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </AgentPageShell>
    </AgentLayout>
  )
}
