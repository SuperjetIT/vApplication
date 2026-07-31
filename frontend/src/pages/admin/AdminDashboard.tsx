import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AdminLayout } from '../../components/AdminLayout'
import { AdminAvatar } from '../../components/admin/AdminAvatar'
import { BRAND, BORDER, cardStyle, chartTooltipStyle, PAGE_BG, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from '../../components/admin/adminTheme'
import { LEAD_STATUSES, getStatusColor } from '../../types/adminTypes'
import { getOverdueSummary, loadInvoices } from '../../utils/adminInvoiceUtils'
import { usePortalBase } from '../../hooks/usePortalBase'
import { useDatabaseListener } from '../../hooks/useDatabase'
import { getPortalUser } from '../../utils/portalAuth'
import { loadLeads } from '../../utils/b2cFlow'
import { Database } from '../../database/db'

const STAT_CARD_META = [
  { label: 'Total Revenue', hint: 'Paid invoices', iconBg: 'linear-gradient(135deg,#fff0f0,#ffe4e4)', iconColor: BRAND },
  { label: 'Pending Payments', hint: 'Unpaid invoices', iconBg: 'linear-gradient(135deg,#f0f0ff,#e4e4ff)', iconColor: '#5057ea' },
  { label: 'Total Applications', hint: 'All applications', iconBg: 'linear-gradient(135deg,#fff8e1,#fff3c4)', iconColor: '#f59e0b' },
  { label: 'Active Applications', hint: 'In progress', iconBg: 'linear-gradient(135deg,#fff0f0,#ffe4e4)', iconColor: '#ef4444' },
  { label: 'Approved Visas', hint: 'Approved status', iconBg: 'linear-gradient(135deg,#f0fff4,#dcfce7)', iconColor: '#22c55e' },
  { label: 'B2B Partners', hint: 'Registered partners', iconBg: 'linear-gradient(135deg,#f5f0ff,#ede9fe)', iconColor: '#8b5cf6' },
]

const STAGE_COLORS: Record<string, string> = {
  'New Application': '#5057ea', Contacted: '#06b6d4', Qualified: '#8b5cf6', 'Payment Pending': '#f59e0b',
  'Docs Pending': '#f97316', 'Under Review': BRAND, Submitted: '#ec4899', Approved: '#22c55e',
}

function PipelineBar({ stage, count, color, delay, maxPipeline }: { stage: string; count: number; color: string; delay: number; maxPipeline: number }) {
  const [width, setWidth] = useState(0)
  const pct = maxPipeline > 0 ? (count / maxPipeline) * 100 : 0
  useEffect(() => {
    const t = window.setTimeout(() => setWidth(pct), delay)
    return () => window.clearTimeout(t)
  }, [pct, delay])
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: TEXT_SECONDARY }}>{stage}</span>
        <span style={{ fontWeight: 700, fontSize: 13, color: TEXT_PRIMARY }}>{count}</span>
      </div>
      <div style={{ background: '#f0f0f0', borderRadius: 40, height: 8, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 40, background: color, width: `${width}%`, transition: 'width 1.2s ease' }} />
      </div>
    </div>
  )
}

function getTimeGreeting(date = new Date()): string {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getAdminDisplayName(): string {
  return getPortalUser()?.name?.trim() || 'Super Admin'
}

function invoiceAmount(inv: Record<string, unknown>): number {
  const n = Number(inv.total ?? inv.amount ?? 0)
  return Number.isFinite(n) ? n : 0
}

/** Monthly paid-invoice totals for the revenue chart (real data only). */
function buildMonthlyRevenue(monthCount: number): { month: string; revenue: number }[] {
  const now = new Date()
  const buckets: { key: string; month: string; revenue: number }[] = []
  for (let i = monthCount - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      month: d.toLocaleString('en', { month: 'short' }),
      revenue: 0,
    })
  }
  for (const inv of Database.getInvoices()) {
    if (String(inv.status ?? '').toLowerCase() !== 'paid') continue
    const raw = String(inv.paidAt ?? inv.createdAt ?? '')
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) continue
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const bucket = buckets.find((b) => b.key === key)
    if (bucket) bucket.revenue += invoiceAmount(inv)
  }
  return buckets.map(({ month, revenue }) => ({ month, revenue: Math.round(revenue) }))
}

function formatActivityTime(raw: unknown): string {
  const s = String(raw ?? '')
  if (!s) return ''
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleString()
}

export default function AdminDashboard() {
  const dbVersion = useDatabaseListener()
  const navigate = useNavigate()
  const { path, basePath } = usePortalBase()
  const [period, setPeriod] = useState<'3M' | '6M' | '1Y'>('6M')
  const [resolvedActions, setResolvedActions] = useState<Set<string>>(new Set())
  const monthCount = period === '3M' ? 3 : period === '1Y' ? 12 : 6
  const chartData = useMemo(() => buildMonthlyRevenue(monthCount), [monthCount, dbVersion])
  const leads = loadLeads()
  const pipelineStages = useMemo(
    () => LEAD_STATUSES.map((stage) => ({ stage, count: leads.filter((l) => l.status === stage).length })),
    [leads],
  )
  const maxPipeline = Math.max(...pipelineStages.map((s) => s.count), 1)
  const destinationDemand = useMemo(() => {
    const counts: Record<string, number> = {}
    leads.forEach((l) => {
      counts[l.destination] = (counts[l.destination] ?? 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([country, applications]) => ({ country, applications, flag: '' }))
  }, [leads])
  const pendingActions = useMemo(() => {
    const actions: { key: string; issue: string; customer: string; destination: string }[] = []
    leads
      .filter((l) => l.status === 'Docs Pending' || l.status === 'Payment Pending')
      .slice(0, 5)
      .forEach((l) => {
        actions.push({
          key: l.id,
          issue: l.status === 'Docs Pending' ? 'Documents required' : 'Payment pending',
          customer: l.name,
          destination: l.destination,
        })
      })
    return actions
  }, [leads])
  const recentLeads = leads.slice(0, 5)
  const overdue = getOverdueSummary(loadInvoices())
  const stats = Database.getDashboardStats()
  const recentActivity = Database.getRecentActivity(10)
  const greeting = getTimeGreeting()
  const adminName = getAdminDisplayName()
  const dynamicCards = [
    { ...STAT_CARD_META[0], value: `AED ${Math.round(stats.totalRevenue).toLocaleString()}` },
    { ...STAT_CARD_META[1], value: `AED ${Math.round(stats.pendingPayments).toLocaleString()}` },
    { ...STAT_CARD_META[2], value: String(stats.totalApplications) },
    { ...STAT_CARD_META[3], value: String(stats.activeApplications) },
    { ...STAT_CARD_META[4], value: String(stats.approvedApplications) },
    { ...STAT_CARD_META[5], value: String(Database.getPartners().length) },
    {
      label: 'Total Wallet Credit',
      hint: 'Outstanding credit to users',
      value: `AED ${Math.round(stats.totalWalletBalance).toLocaleString()}`,
      iconBg: 'linear-gradient(135deg,#fff8e1,#ffedd5)',
      iconColor: '#f97316',
    },
  ]

  return (
    <AdminLayout activePath={basePath} title="Dashboard">
      <style>{`@keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.2)}} @keyframes float3d { 0%, 100% { transform: rotate(-8deg) translateY(0); } 50% { transform: rotate(-8deg) translateY(-10px); } }`}</style>

      {/* Hero banner */}
      <div className="admin-hero" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b69 50%, #f93e42 150%)', position: 'relative', overflow: 'hidden' }}>
        <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.4 }}>
          <defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.1)" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
        <div aria-hidden style={{ position: 'absolute', width: 300, height: 300, background: 'rgba(255,255,255,0.05)', borderRadius: '50%', top: -100, right: -50 }} />
        <div aria-hidden style={{ position: 'absolute', width: 200, height: 200, background: 'rgba(249,62,66,0.1)', borderRadius: '50%', bottom: -80, right: 200 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: 24 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff' }}>{greeting}, {adminName} 👋</h2>
            <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Here's what's happening with Superjet Global today</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
              {[`📋 ${stats.activeApplications} Active Applications`, `💰 AED ${Math.round(stats.totalRevenue).toLocaleString()} Revenue`, `✅ ${stats.approvedApplications} Approved`, `🏢 B2B: ${stats.b2bApplications}`, `👤 B2C: ${stats.b2cApplications}`, `🧑 B2C Users: ${stats.b2cRegisteredUsers} (${stats.b2cUsersLoggedIn} logged in)`, `⚠ AED ${overdue.amount.toLocaleString()} Overdue`].map((p) => (
                <span key={p} style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: 40, padding: '8px 16px', color: '#fff', fontSize: 13, fontWeight: 500 }}>{p}</span>
              ))}
            </div>
          </div>
          <div
            className="admin-hero-deco"
            style={{
              width: 100,
              height: 70,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 800,
              color: '#fff',
              transform: 'rotate(-8deg)',
              animation: 'float3d 5s ease-in-out infinite',
            }}
          >
            SJ
          </div>
        </div>
      </div>

      {overdue.count > 0 && (
        <div style={{ ...cardStyle, marginBottom: 20, borderLeft: `4px solid #ef4444`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, color: TEXT_PRIMARY }}>⚠ {overdue.count} Overdue Bank Transfer Invoice{overdue.count > 1 ? 's' : ''}</div>
            <div style={{ fontSize: 14, color: TEXT_SECONDARY, marginTop: 4 }}>Total overdue: <strong style={{ color: '#ef4444' }}>AED {overdue.amount.toLocaleString()}</strong></div>
          </div>
          <button type="button" onClick={() => navigate(path('/invoices'))} style={{ background: '#fff0f0', border: `1px solid #fca5a5`, color: '#ef4444', borderRadius: 10, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>View Invoices →</button>
        </div>
      )}

      {/* Stat cards */}
      <div className="admin-stat-grid" style={{ marginBottom: 16 }}>
        {dynamicCards.map((c, i) => (
          <div
            key={c.label}
            style={{
              ...cardStyle,
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              animation: `countUp 0.4s ease both`,
              animationDelay: `${i * 0.08}s`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.01)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c.iconColor} strokeWidth="2"><circle cx="12" cy="12" r="4" /></svg>
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, color: TEXT_MUTED }}>{c.hint}</span>
            </div>
            <div className="admin-stat-value" style={{ fontWeight: 800, color: TEXT_PRIMARY, marginTop: 12 }}>{c.value}</div>
            <div className="admin-stat-label" style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="admin-grid-2" style={{ marginBottom: 20 }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontWeight: 700, color: TEXT_PRIMARY }}>Revenue Overview</h3>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['3M', '6M', '1Y'] as const).map((p) => (
                <button key={p} type="button" onClick={() => setPeriod(p)} style={{ border: 'none', background: period === p ? BRAND : 'transparent', color: period === p ? '#fff' : TEXT_SECONDARY, borderRadius: 8, padding: '4px 12px', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>{p}</button>
              ))}
            </div>
          </div>
          {chartData.every((d) => d.revenue === 0) ? (
            <p style={{ margin: '48px 0', textAlign: 'center', color: TEXT_MUTED, fontSize: 14 }}>
              No paid invoices yet. Revenue appears here after real payments.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: TEXT_MUTED }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: TEXT_MUTED }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="revenue" fill={BRAND} radius={[4, 4, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 4px', fontWeight: 700, color: TEXT_PRIMARY }}>Application Pipeline</h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: TEXT_SECONDARY }}>Current stage distribution</p>
          {leads.length === 0 ? (
            <p style={{ margin: '32px 0', textAlign: 'center', color: TEXT_MUTED, fontSize: 14 }}>No applications yet.</p>
          ) : (
            pipelineStages.map((s, i) => (
              <PipelineBar key={s.stage} stage={s.stage} count={s.count} color={STAGE_COLORS[s.stage] ?? '#5057ea'} delay={i * 80} maxPipeline={maxPipeline} />
            ))
          )}
        </div>
      </div>

      {/* Bottom 3 cards */}
      <div className="admin-grid-3" style={{ marginBottom: 20 }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: 15, color: TEXT_PRIMARY }}>Recent Applications</h3>
            <Link to={path('/leads')} style={{ color: BRAND, fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>View all →</Link>
          </div>
          {recentLeads.length === 0 ? (
            <p style={{ margin: '24px 0', textAlign: 'center', color: TEXT_MUTED, fontSize: 13 }}>
              No applications yet. They appear after B2C or B2B apply flows.
            </p>
          ) : (
            recentLeads.map((lead) => {
              const sc = getStatusColor(lead.status)
              return (
                <div key={lead.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <AdminAvatar name={lead.name} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: TEXT_PRIMARY }}>{lead.name}</div>
                    <div style={{ fontSize: 12, color: TEXT_SECONDARY }}>{lead.email}</div>
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{lead.status}</span>
                </div>
              )
            })
          )}
        </div>
        <div style={{ ...cardStyle, background: '#fff8f8' }}>
          <h3 style={{ margin: '0 0 16px', fontWeight: 700, fontSize: 15, color: TEXT_PRIMARY }}>Needs Action</h3>
          {pendingActions.length === 0 && (
            <p style={{ fontSize: 13, color: TEXT_MUTED, margin: 0 }}>Nothing needs action right now.</p>
          )}
          {pendingActions.filter((a) => !resolvedActions.has(a.key)).map((a) => (
            <div key={a.key} style={{ background: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, borderLeft: `3px solid ${BRAND}` }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: TEXT_PRIMARY }}>{a.issue}</div>
              <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 }}>{a.customer} — {a.destination}</div>
              <button type="button" onClick={() => setResolvedActions((s) => new Set(s).add(a.key))} style={{ marginTop: 8, background: 'transparent', border: `1px solid ${BRAND}`, color: BRAND, borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Resolve</button>
            </div>
          ))}
          {pendingActions.length > 0 && pendingActions.every((a) => resolvedActions.has(a.key)) && (
            <p style={{ fontSize: 13, color: TEXT_MUTED, margin: 0 }}>All caught up! 🎉</p>
          )}
        </div>
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 16px', fontWeight: 700, fontSize: 15, color: TEXT_PRIMARY }}>Country Demand</h3>
          {destinationDemand.length === 0 ? (
            <p style={{ margin: '48px 0', textAlign: 'center', color: TEXT_MUTED, fontSize: 13 }}>No destination data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={destinationDemand} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: TEXT_MUTED }} />
                <YAxis type="category" dataKey="country" width={80} tick={{ fontSize: 11, fill: TEXT_PRIMARY }} tickFormatter={(v, i) => `${destinationDemand[i]?.flag ?? ''} ${v}`} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="applications" radius={[0, 4, 4, 0]}>
                  {destinationDemand.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? BRAND : '#5057ea'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Activity feed */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontWeight: 700, color: TEXT_PRIMARY }}>Live Activity</h3>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'livePulse 2s infinite' }} />
          <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>LIVE</span>
        </div>
        {recentActivity.length === 0 ? (
          <p style={{ margin: '16px 0 8px', color: TEXT_MUTED, fontSize: 13 }}>
            No activity yet. Sign-ups, applications, and status changes will show here.
          </p>
        ) : (
          <div style={{ borderLeft: `2px solid ${BORDER}`, paddingLeft: 24, marginLeft: 18 }}>
            {recentActivity.slice(0, 7).map((a) => (
              <div key={String(a.id)} style={{ display: 'flex', gap: 16, marginBottom: 20, position: 'relative' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: PAGE_BG, border: `1px solid ${BORDER}`, position: 'absolute', left: -43, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>●</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: TEXT_PRIMARY }}>{String(a.description ?? a.type ?? 'Activity')}</div>
                  <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>{formatActivityTime(a.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
