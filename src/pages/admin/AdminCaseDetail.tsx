import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AdminLayout } from '../../components/AdminLayout'
import { AdminAvatar } from '../../components/admin/AdminAvatar'
import { AdminToast } from '../../components/admin/AdminToast'
import { BRAND, BRAND_BLUE, BORDER, cardStyle, inputStyle, outlineBtn, PAGE_BG, primaryBtn, SUCCESS, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from '../../components/admin/adminTheme'
import { LEAD_STATUSES, MOCK_LEADS, getStatusColor, type LeadStatus } from '../../data/adminMockData'

const TIMELINE = [
  { step: 'Application created', icon: BRAND_BLUE },
  { step: 'Documents requested', icon: '#f59e0b' },
  { step: 'Payment received', icon: SUCCESS },
  { step: 'Under embassy review', icon: BRAND },
]

export default function AdminCaseDetail() {
  const { id } = useParams()
  const [lead, setLead] = useState(() => MOCK_LEADS.find((l) => l.id === id))
  const [note, setNote] = useState('')
  const [notes, setNotes] = useState<string[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [statusOpen, setStatusOpen] = useState(false)

  if (!lead) {
    return (
      <AdminLayout activePath="/admin/cases" title="Application Not Found">
        <div style={{ ...cardStyle, padding: 32, textAlign: 'center' }}>
          <p style={{ color: TEXT_SECONDARY }}>Application not found.</p>
          <Link to="/admin/leads" style={{ color: BRAND, textDecoration: 'none' }}>← Back to Applications</Link>
        </div>
      </AdminLayout>
    )
  }

  const sc = getStatusColor(lead.status)

  const updateStatus = (status: LeadStatus) => {
    setLead({ ...lead, status })
    setStatusOpen(false)
    setToast(`Status updated to ${status}`)
  }

  const saveNote = () => {
    if (!note.trim()) return
    setNotes((prev) => [note.trim(), ...prev])
    setNote('')
    setToast('Note saved')
  }

  const sendReminder = () => {
    const msg = `Hello ${lead.name}, this is Super Visa regarding your ${lead.destination} visa application. Please check your email for next steps.`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
    setToast('WhatsApp reminder opened')
  }

  return (
    <AdminLayout activePath="/admin/cases" title={`Application #${lead.id}`}>
      <AdminToast message={toast} onClose={() => setToast(null)} />
      <Link to="/admin/leads" style={{ color: BRAND, textDecoration: 'none', fontSize: 14, marginBottom: 20, display: 'inline-block', fontWeight: 500 }}>← Back to Applications</Link>

      <div style={{ background: 'linear-gradient(135deg, #f8f9fc 0%, #f0f4ff 50%, #fff5f5 100%)', borderRadius: 20, padding: 24, marginBottom: 24, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <AdminAvatar name={lead.name} size={64} fontSize={22} />
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 22, color: TEXT_PRIMARY }}>{lead.name}</h2>
          <p style={{ margin: '4px 0 0', color: TEXT_SECONDARY }}>{lead.email}</p>
        </div>
        <span style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{lead.status}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div style={cardStyle}>
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
                <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 4, fontWeight: 500 }}>{label}</div>
                <div style={{ fontWeight: 600, color: TEXT_PRIMARY }}>{value}</div>
              </div>
            ))}
          </div>

          <h3 style={{ margin: '24px 0 16px', fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>Application Timeline</h3>
          <div style={{ borderLeft: `2px solid ${BORDER}`, paddingLeft: 24, marginLeft: 18 }}>
            {TIMELINE.map((t, i) => (
              <div key={t.step} style={{ display: 'flex', gap: 16, marginBottom: i < TIMELINE.length - 1 ? 24 : 0, position: 'relative' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: t.icon, position: 'absolute', left: -43, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: TEXT_PRIMARY }}>{t.step}</div>
                  <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>{lead.created}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>Quick Actions</h3>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <button type="button" onClick={() => setStatusOpen((o) => !o)} style={{ ...outlineBtn, display: 'block', width: '100%', textAlign: 'left', fontSize: 13 }}>Change Status</button>
              {statusOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, zIndex: 50, marginTop: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', maxHeight: 200, overflowY: 'auto' }}>
                  {LEAD_STATUSES.map((s) => (
                    <button key={s} type="button" onClick={() => updateStatus(s)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13 }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = PAGE_BG }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
                    >{s}</button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={() => setToast('Assign B2B Partner — select from Partners page')} style={{ ...outlineBtn, display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, fontSize: 13 }}>Assign B2B Partner</button>
            <button type="button" onClick={sendReminder} style={{ ...outlineBtn, display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, fontSize: 13 }}>Send Reminder</button>
            <button type="button" onClick={() => setToast('Document upload — drag & drop coming soon')} style={{ ...outlineBtn, display: 'block', width: '100%', textAlign: 'left', fontSize: 13 }}>Upload Document</button>
          </div>
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>Internal Notes</h3>
            <textarea placeholder="Add internal note..." value={note} onChange={(e) => setNote(e.target.value)} style={{ ...inputStyle, width: '100%', minHeight: 100, resize: 'vertical' }} />
            <button type="button" onClick={saveNote} style={{ ...primaryBtn, marginTop: 8, fontSize: 13, width: '100%' }}>Save Note</button>
            {notes.length > 0 && (
              <div style={{ marginTop: 16, borderTop: `1px solid ${BORDER}`, paddingTop: 12 }}>
                {notes.map((n, i) => (
                  <div key={i} style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 8, padding: 8, background: PAGE_BG, borderRadius: 8 }}>{n}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
