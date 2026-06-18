import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AgentLayout } from '../../components/AgentLayout'
import { AGENT_BASE_PATH } from '../../config/portalRoutes'
import { countries } from '../../data/countries'
import { Database } from '../../database/db'
import { getAgentPartnerId, parseFeeAed } from '../../utils/agentSession'
import { flagUrl } from '../../utils/flags'

const BRAND = '#f93e42'

function statusStyle(status: string) {
  const s = status.toLowerCase()
  if (s === 'approved') return { bg: '#dcfce7', color: '#166534' }
  if (s === 'rejected') return { bg: '#fee2e2', color: '#b91c1c' }
  if (s.includes('pending')) return { bg: '#fef3c7', color: '#a16207' }
  return { bg: '#eef4ff', color: '#5057ea' }
}

export default function AgentDashboard() {
  const navigate = useNavigate()
  const partnerId = getAgentPartnerId() ?? ''
  const partner = Database.getPartnerById(partnerId)
  const myApplications = Database.getApplications({ partnerId, type: 'b2b' })
  const myCommissions = Database.getCommissions({ partnerId })
  const rate = Number(partner?.commissionRate ?? 15)

  const stats = useMemo(() => {
    const active = myApplications.filter((a) => !['approved', 'rejected', 'closed'].includes(String(a.status).toLowerCase())).length
    const approved = myApplications.filter((a) => String(a.status).toLowerCase() === 'approved').length
    const pendingComm = myCommissions.filter((c) => String(c.status).toLowerCase() === 'pending').reduce((s, c) => s + Number(c.commissionAmount ?? 0), 0)
    const monthRevenue = myApplications.reduce((s, a) => {
      const amt = a.amount as { total?: number } | undefined
      return s + Number(amt?.total ?? 0)
    }, 0)
    return { active, approved, pendingComm, monthRevenue }
  }, [myApplications, myCommissions])

  const popular = countries.filter((c) => c.visaOptions.length > 0).slice(0, 8)
  const recent = [...myApplications].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 5)

  if (!partner) {
    return (
      <AgentLayout>
        <p>Partner not found. Please sign in again.</p>
      </AgentLayout>
    )
  }

  return (
    <AgentLayout>
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #2d1b69, #f93e42)', borderRadius: 24, padding: 32, color: '#fff', marginBottom: 28 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700 }}>Welcome back, {String(partner.contactPerson)} 👋</h1>
        <p style={{ margin: '0 0 20px', color: 'rgba(255,255,255,0.7)', fontSize: 15 }}>{String(partner.companyName)}</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            `Applications: ${myApplications.length}`,
            `This Month Revenue: AED ${stats.monthRevenue.toLocaleString()}`,
            `Commission Earned: AED ${myCommissions.filter((c) => String(c.status) === 'paid').reduce((s, c) => s + Number(c.commissionAmount ?? 0), 0).toLocaleString()}`,
          ].map((pill) => (
            <span key={pill} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 40, padding: '8px 16px', fontSize: 13 }}>{pill}</span>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Applications', value: myApplications.length, grad: 'linear-gradient(135deg,#fff0f0,#ffe4e4)', color: BRAND },
          { label: 'Active', value: stats.active, grad: 'linear-gradient(135deg,#f0f0ff,#e4e4ff)', color: '#5057ea' },
          { label: 'Approved', value: stats.approved, grad: 'linear-gradient(135deg,#f0fff4,#dcfce7)', color: '#166534' },
          { label: 'Commission Pending', value: `AED ${stats.pendingComm.toLocaleString()}`, grad: 'linear-gradient(135deg,#fff8e1,#fff3c4)', color: '#a16207' },
        ].map((c) => (
          <div key={c.label} style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: c.grad, marginBottom: 12 }} />
            <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      <button type="button" onClick={() => navigate(`${AGENT_BASE_PATH}/apply`)} style={{ width: '100%', background: BRAND, color: '#fff', border: 'none', borderRadius: 16, padding: 20, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginBottom: 32 }}>
        + New Application
      </button>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Popular Destinations</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        {popular.map((country) => {
          const opt = country.visaOptions[0]
          const gov = parseFeeAed(opt.fee)
          const proc = parseFeeAed(opt.processingFee)
          const cost = gov + proc
          const commission = Math.round(gov * (rate / 100))
          const sellPrice = cost + commission
          return (
            <button
              key={country.slug}
              type="button"
              onClick={() => navigate(`${AGENT_BASE_PATH}/visa/${country.slug}`)}
              style={{ background: '#fff', border: '1px solid #eee', borderRadius: 16, padding: 16, textAlign: 'left', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <img src={flagUrl(country.countryCode, 32)} alt="" width={32} height={22} style={{ borderRadius: 4 }} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>{country.name}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: BRAND }}>B2B Price: AED {sellPrice}</div>
              <div style={{ fontSize: 12, color: '#166534', marginTop: 4 }}>Your Commission: AED {commission}</div>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Recent Applications</h2>
        <Link to={`${AGENT_BASE_PATH}/applications`} style={{ color: BRAND, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>View all →</Link>
      </div>
      <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        {recent.length === 0 ? (
          <p style={{ padding: 24, color: '#666', margin: 0 }}>No applications yet. Submit your first application.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8f9fc', borderBottom: '1px solid #eee' }}>
                {['Customer', 'Destination', 'Status', 'Amount', 'Commission', 'Date'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#888', fontWeight: 600 }}>{h}</th>
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
                  <tr key={String(app.id)} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{name}</td>
                    <td style={{ padding: '12px 16px' }}>{String(app.destinationName ?? app.destination)}</td>
                    <td style={{ padding: '12px 16px' }}><span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>{String(app.status)}</span></td>
                    <td style={{ padding: '12px 16px' }}>AED {Number(amt).toLocaleString()}</td>
                    <td style={{ padding: '12px 16px' }}>AED {Number(comm?.commissionAmount ?? 0).toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', color: '#888' }}>{String(app.createdAt).slice(0, 10)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </AgentLayout>
  )
}
