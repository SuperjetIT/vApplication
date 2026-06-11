import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AdminLayout } from '../../components/AdminLayout'
import { AdminAvatar } from '../../components/admin/AdminAvatar'
import { BRAND, BORDER, cardStyle, chartTooltipStyle, PAGE_BG, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from '../../components/admin/adminTheme'
import { MOCK_ACTIVITIES, MOCK_AGENTS, MOCK_LEADS, PIPELINE_STAGES, PENDING_ACTIONS, REVENUE_CHART_DATA, getStatusColor } from '../../data/adminMockData'

const STAT_CARDS = [
  { label: 'Revenue Today', value: 'AED 4,200', trend: '+12%', up: true, gradient: 'linear-gradient(135deg, #f93e42, #ff8c69)', spark: 'M0,20 L12,16 L24,18 L36,12 L48,14 L60,10 L72,12 L80,8', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg> },
  { label: 'Monthly Revenue', value: 'AED 38,500', trend: '+8%', up: true, gradient: 'linear-gradient(135deg, #5057ea, #818cf8)', spark: 'M0,16 L12,14 L24,10 L36,14 L48,8 L60,10 L72,6 L80,4', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg> },
  { label: 'Total Leads', value: '284', trend: '+24', up: true, gradient: 'linear-gradient(135deg, #f59e0b, #fcd34d)', spark: 'M0,18 L12,14 L24,16 L36,10 L48,12 L60,8 L72,10 L80,6', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
  { label: 'Active Cases', value: '47', trend: '12', up: false, gradient: 'linear-gradient(135deg, #22c55e, #86efac)', spark: 'M0,8 L12,10 L24,12 L36,14 L48,12 L60,14 L72,16 L80,18', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg> },
  { label: 'Pending Payments', value: 'AED 8,200', trend: '14', up: false, gradient: 'linear-gradient(135deg, #ef4444, #fca5a5)', spark: 'M0,10 L12,12 L24,14 L36,12 L48,16 L60,14 L72,16 L80,18', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> },
  { label: 'Approval Rate', value: '94%', trend: '+3%', up: true, gradient: 'linear-gradient(135deg, #8b5cf6, #c4b5fd)', spark: 'M0,18 L12,16 L24,12 L36,10 L48,8 L60,6 L72,4 L80,2', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polyline points="8 17 12 21 16 17" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" /></svg> },
]

const LEAD_SOURCES = [
  { name: 'Direct', value: 45, color: '#f93e42' },
  { name: 'Agent B2B', value: 30, color: '#5057ea' },
  { name: 'Google', value: 15, color: '#f59e0b' },
  { name: 'WhatsApp', value: 10, color: '#22c55e' },
]

const STAGE_COLORS: Record<string, string> = {
  'New Lead': '#5057ea', Contacted: '#818cf8', Qualified: '#f59e0b', 'Payment Pending': '#f97316',
  'Docs Pending': '#ef4444', 'Under Review': '#ec4899', Submitted: '#8b5cf6', Approved: '#22c55e',
}

const ACTIVITY_STYLES: Record<string, { bg: string; color: string }> = {
  approved: { bg: '#f0fff4', color: '#22c55e' },
  rejected: { bg: '#fff0f0', color: '#ef4444' },
  lead: { bg: '#eff6ff', color: '#3b82f6' },
  payment: { bg: '#fff7ed', color: '#f97316' },
  doc: { bg: '#f8f9fc', color: '#6b7280' },
  agent: { bg: '#f5f3ff', color: '#8b5cf6' },
}

const RANK_GRADIENTS = [
  'linear-gradient(135deg, #ffd700, #ffb800)',
  'linear-gradient(135deg, #c0c0c0, #a0a0a0)',
  'linear-gradient(135deg, #cd7f32, #b8692a)',
]

const maxPipeline = Math.max(...PIPELINE_STAGES.map((s) => s.count))

function PipelineRow({ stage, count, color, delay }: { stage: string; count: number; color: string; delay: number }) {
  const [width, setWidth] = useState(0)
  const pct = (count / maxPipeline) * 100
  useEffect(() => {
    const t = window.setTimeout(() => setWidth(pct), delay)
    return () => window.clearTimeout(t)
  }, [pct, delay])
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ color: TEXT_SECONDARY, fontSize: 13, width: 130, flexShrink: 0 }}>{stage}</span>
      <div style={{ flex: 1, height: 8, background: PAGE_BG, borderRadius: 40, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 40, background: color, width: `${width}%`, transition: 'width 1.2s ease' }} />
      </div>
      <span style={{ color: TEXT_PRIMARY, fontWeight: 700, fontSize: 13, width: 40, textAlign: 'right' }}>{count}</span>
      <span style={{ color: TEXT_MUTED, fontSize: 11, width: 36, textAlign: 'right' }}>{Math.round(pct)}%</span>
    </div>
  )
}

export default function AdminDashboard() {
  const [chartRange, setChartRange] = useState<'1M' | '3M' | '6M' | '1Y'>('6M')
  const recentLeads = MOCK_LEADS.slice(0, 5)
  const topAgents = MOCK_AGENTS.slice(0, 3)
  const chartData = chartRange === '3M' ? REVENUE_CHART_DATA.slice(-3) : chartRange === '1M' ? REVENUE_CHART_DATA.slice(-1) : REVENUE_CHART_DATA

  return (
    <AdminLayout activePath="/admin" title="Dashboard">
      <style>{`@keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.2)} }`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: TEXT_PRIMARY }}>Good morning, Super Admin 👋</h2>
          <p style={{ margin: '4px 0 0', color: TEXT_SECONDARY, fontSize: 14 }}>Here's what's happening with your visa platform today.</p>
        </div>
        <div style={{ background: '#fff8f8', border: '1px solid #fce7e7', borderRadius: 40, padding: '8px 20px' }}>
          <span style={{ color: BRAND, fontSize: 13, fontWeight: 500 }}>284 total leads · AED 38,500 revenue</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
        {STAT_CARDS.map((c) => (
          <div key={c.label} style={{ ...cardStyle, position: 'relative', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: c.gradient, opacity: 0.08 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: c.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.icon}</div>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: c.up ? '#f0fff4' : '#fff0f0', color: c.up ? '#16a34a' : '#dc2626' }}>{c.up ? '↑' : '↓'} {c.trend}</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: TEXT_PRIMARY, marginTop: 12 }}>{c.value}</div>
            <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 4 }}>{c.label}</div>
            <svg style={{ position: 'absolute', bottom: 16, right: 16, width: 80, height: 32 }} viewBox="0 0 80 32">
              <path d={c.spark} fill="none" stroke={c.up ? '#22c55e' : '#ef4444'} strokeWidth="2" strokeLinecap="round" opacity={0.4} />
            </svg>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontWeight: 700, color: TEXT_PRIMARY }}>Revenue Overview</h3>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['1M', '3M', '6M', '1Y'] as const).map((r) => (
                <button key={r} type="button" onClick={() => setChartRange(r)} style={{ border: 'none', background: chartRange === r ? BRAND : 'transparent', color: chartRange === r ? '#fff' : TEXT_SECONDARY, borderRadius: 8, padding: '4px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>{r}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} barGap={4}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f93e42" />
                  <stop offset="100%" stopColor="#ff8c69" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: TEXT_SECONDARY }} />
              <YAxis tick={{ fontSize: 12, fill: TEXT_SECONDARY }} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="revenue" fill="url(#revenueGradient)" radius={[6, 6, 0, 0]} name="Revenue" />
              <Bar dataKey="target" fill="#f0f0f5" radius={[6, 6, 0, 0]} name="Target" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ ...cardStyle, position: 'relative' }}>
          <h3 style={{ margin: '0 0 16px', fontWeight: 700, color: TEXT_PRIMARY }}>Lead Sources</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={LEAD_SOURCES} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4}>
                {LEAD_SOURCES.map((s) => <Cell key={s.name} fill={s.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -20%)', textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: TEXT_PRIMARY }}>284</div>
            <div style={{ fontSize: 12, color: TEXT_SECONDARY }}>Leads</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
            {LEAD_SOURCES.map((s) => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: TEXT_SECONDARY }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                {s.name} ({s.value}%)
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontWeight: 700, color: TEXT_PRIMARY }}>Lead Pipeline</h3>
            <span style={{ fontSize: 12, color: TEXT_MUTED }}>This Month</span>
          </div>
          {PIPELINE_STAGES.map((s, i) => (
            <PipelineRow key={s.stage} stage={s.stage} count={s.count} color={STAGE_COLORS[s.stage] ?? '#5057ea'} delay={i * 80} />
          ))}
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontWeight: 700, color: TEXT_PRIMARY }}>Live Activity</h3>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'livePulse 2s infinite' }} />
            <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>LIVE</span>
          </div>
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {MOCK_ACTIVITIES.map((a) => {
              const st = ACTIVITY_STYLES[a.type] ?? ACTIVITY_STYLES.doc
              return (
                <div key={a.id} style={{ display: 'flex', gap: 12, padding: 12, borderRadius: 12, transition: 'background 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = PAGE_BG }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: st.color, fontSize: 14 }}>●</span>
                  </div>
                  <div>
                    <div style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: 500 }}>{a.text}</div>
                    <div style={{ color: TEXT_MUTED, fontSize: 11, marginTop: 2 }}>{a.time}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>Recent Leads</h3>
            <Link to="/admin/leads" style={{ color: BRAND, fontSize: 13, textDecoration: 'none' }}>View all →</Link>
          </div>
          {recentLeads.map((lead) => {
            const sc = getStatusColor(lead.status)
            return (
              <div key={lead.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${PAGE_BG}` }}>
                <AdminAvatar name={lead.name} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: 500 }}>{lead.name}</div>
                  <div style={{ color: TEXT_SECONDARY, fontSize: 12 }}>{lead.destination}</div>
                </div>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{lead.status}</span>
                <span style={{ color: TEXT_MUTED, fontSize: 11, whiteSpace: 'nowrap' }}>{lead.created}</span>
              </div>
            )
          })}
        </div>

        <div style={{ ...cardStyle, padding: 20, background: '#fff8f8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>Needs Action</h3>
            <span style={{ background: '#ef4444', color: TEXT_PRIMARY, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{PENDING_ACTIONS.length}</span>
          </div>
          {PENDING_ACTIONS.map((a) => (
            <div key={a.issue} style={{ borderRadius: 12, padding: 12, marginBottom: 8, background: '#fff', border: '1px solid #fee2e2', borderLeft: '3px solid #f93e42' }}>
              <div style={{ color: TEXT_PRIMARY, fontWeight: 700, fontSize: 13 }}>{a.issue}</div>
              <div style={{ color: TEXT_SECONDARY, fontSize: 12, marginTop: 2 }}>{a.customer} — {a.destination}</div>
              <div style={{ color: BRAND, fontSize: 11, fontWeight: 600, marginTop: 4 }}>Action required</div>
            </div>
          ))}
        </div>

        <div style={{ ...cardStyle, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>Top Agents</h3>
          {topAgents.map((agent, i) => (
            <div key={agent.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${PAGE_BG}` }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: RANK_GRADIENTS[i], color: TEXT_PRIMARY, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
              <AdminAvatar name={agent.name} size={32} />
              <div style={{ flex: 1 }}>
                <div style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: 500 }}>{agent.name}</div>
                <div style={{ color: TEXT_SECONDARY, fontSize: 12 }}>{agent.leads} leads</div>
              </div>
              <span style={{ color: BRAND, fontWeight: 700, fontSize: 13 }}>AED {agent.revenue.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
