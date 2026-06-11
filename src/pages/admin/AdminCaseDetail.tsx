import { Link, useParams } from 'react-router-dom'
import { AdminLayout } from '../../components/AdminLayout'
import { AdminAvatar } from '../../components/admin/AdminAvatar'
import { BRAND, BORDER, cardStyle, inputStyle, outlineBtn, PAGE_BG, primaryBtn, TEXT_MUTED, TEXT_SECONDARY } from '../../components/admin/adminTheme'
import { MOCK_LEADS, getStatusColor } from '../../data/adminMockData'

export default function AdminCaseDetail() {
  const { id } = useParams()
  const lead = MOCK_LEADS.find((l) => l.id === id)

  if (!lead) {
    return (
      <AdminLayout activePath="/admin/cases" title="Case Not Found">
        <div style={{ ...cardStyle, padding: 32, textAlign: 'center' }}>
          <p style={{ color: TEXT_SECONDARY }}>Case not found.</p>
          <Link to="/admin/leads" style={{ color: BRAND, textDecoration: 'none' }}>← Back to Leads</Link>
        </div>
      </AdminLayout>
    )
  }

  const sc = getStatusColor(lead.status)

  return (
    <AdminLayout activePath="/admin/cases" title={`Case #${lead.id}`}>
      <Link to="/admin/leads" style={{ color: BRAND, textDecoration: 'none', fontSize: 14, marginBottom: 20, display: 'inline-block' }}>← Back to Leads</Link>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div style={{ ...cardStyle, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <AdminAvatar name={lead.name} size={56} fontSize={20} />
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 22 }}>{lead.name}</h2>
              <p style={{ margin: '4px 0 0', color: TEXT_SECONDARY }}>{lead.email}</p>
            </div>
            <span style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, background: sc.bg, color: sc.color }}>{lead.status}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {[
              ['Passport', lead.passport],
              ['Destination', lead.destination],
              ['Visa Type', lead.visaType],
              ['Source', lead.source],
              ['Assigned To', lead.assigned],
              ['Created', lead.created],
            ].map(([label, value]) => (
              <div key={label} style={{ background: PAGE_BG, borderRadius: 12, padding: 16, border: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 4 }}>{label}</div>
                <div style={{ fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>

          <h3 style={{ margin: '24px 0 12px', fontSize: 15 }}>Timeline</h3>
          <div style={{ borderLeft: `2px solid ${BORDER}`, paddingLeft: 20 }}>
            {['Lead created', 'Documents requested', 'Payment received', 'Under embassy review'].map((step) => (
              <div key={step} style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{step}</div>
                <div style={{ fontSize: 12, color: TEXT_MUTED }}>{lead.created}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ ...cardStyle, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Quick Actions</h3>
            {['Change Status', 'Assign Agent', 'Send Reminder', 'Upload Document'].map((a) => (
              <button key={a} type="button" style={{ ...outlineBtn, display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, fontSize: 13 }}>{a}</button>
            ))}
          </div>
          <div style={{ ...cardStyle, padding: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>Notes</h3>
            <textarea placeholder="Add internal note..." style={{ ...inputStyle, width: '100%', minHeight: 100, resize: 'vertical' }} />
            <button type="button" style={{ ...primaryBtn, marginTop: 8, fontSize: 13 }}>Save Note</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
