import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AdminLayout } from '../../components/AdminLayout'
import { AdminAvatar } from '../../components/admin/AdminAvatar'
import { AdminToast } from '../../components/admin/AdminToast'
import { BRAND, BRAND_BLUE, BORDER, cardStyle, inputStyle, outlineBtn, PAGE_BG, primaryBtn, SUCCESS, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from '../../components/admin/adminTheme'
import { usePortalBase } from '../../hooks/usePortalBase'
import { useDatabaseListener } from '../../hooks/useDatabase'
import { Database } from '../../database/db'
import { LEAD_STATUSES, getStatusColor, type LeadStatus } from '../../types/adminTypes'
import {
  buildAgentNotifyMessage,
  buildCustomerNotifyMessage,
  getLeadById,
  requestDocumentReupload,
  updateLeadStatus,
} from '../../utils/b2cFlow'
import {
  downloadAllApplicationDocuments,
  downloadApplicationDocument,
  formatDocumentType,
  getApplicationDocuments,
  documentStatusStyle,
  updateApplicationDocumentReview,
  type ApplicationDocument,
} from '../../utils/applicationDocuments'

const TIMELINE = [
  { step: 'Application created', icon: BRAND_BLUE },
  { step: 'Documents requested', icon: '#f59e0b' },
  { step: 'Payment received', icon: SUCCESS },
  { step: 'Under embassy review', icon: BRAND },
]

export default function AdminCaseDetail() {
  const { path, basePath } = usePortalBase()
  const { id } = useParams()
  useDatabaseListener()
  const lead = id ? getLeadById(id) : undefined
  const [note, setNote] = useState('')
  const [notes, setNotes] = useState<string[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [statusOpen, setStatusOpen] = useState(false)
  const [refundOpen, setRefundOpen] = useState(false)
  const [refundAmount, setRefundAmount] = useState(0)
  const [refundReason, setRefundReason] = useState('Visa rejected — processing fee refund')
  const [downloadingAll, setDownloadingAll] = useState(false)

  const application = id ? Database.getApplicationById(id) : undefined
  const documents = id ? getApplicationDocuments(id) : []
  const refundProcessed = Boolean(application?.refundProcessed)
  const defaultRefundAmount = lead?.amount ?? Number((application?.amount as { total?: number } | undefined)?.total ?? 0)

  if (!lead) {
    return (
      <AdminLayout activePath={`${basePath}/cases`} title="Application Not Found">
        <div style={{ ...cardStyle, padding: 32, textAlign: 'center' }}>
          <p style={{ color: TEXT_SECONDARY }}>Application not found.</p>
          <Link to={path('/leads')} style={{ color: BRAND, textDecoration: 'none' }}>← Back to Applications</Link>
        </div>
      </AdminLayout>
    )
  }

  const sc = getStatusColor(lead.status)
  const isB2B = lead.source === 'B2B'
  const notifyMessage = isB2B ? buildAgentNotifyMessage : buildCustomerNotifyMessage
  const notifyLabel = isB2B ? 'partner' : 'customer'

  const updateStatus = (status: LeadStatus) => {
    if (!lead) return
    updateLeadStatus(lead.id, status)
    setStatusOpen(false)
    setToast(`Status updated to ${status}`)
    if (status === 'Rejected' && !refundProcessed) {
      setRefundAmount(defaultRefundAmount)
      setRefundOpen(true)
    }
  }

  const openRefundModal = () => {
    setRefundAmount(defaultRefundAmount)
    setRefundOpen(true)
  }

  const processRefundToWallet = () => {
    if (!lead || refundAmount <= 0) return
    const app = Database.getApplicationById(lead.id)
    const ownerType = isB2B ? 'b2b' : 'b2c'
    const ownerId = isB2B ? String(app?.partnerId ?? '') : String(app?.userId ?? '')
    if (!ownerId) {
      setToast('Could not determine refund recipient')
      return
    }
    Database.refundToWallet(ownerId, ownerType, refundAmount, lead.id, refundReason)
    Database.updateApplication(lead.id, {
      refundProcessed: true,
      refundAmount,
      refundReason,
      refundMethod: 'wallet',
      refundedAt: new Date().toISOString(),
    })
    Database.logActivity(
      'refund_processed',
      `Refund of AED ${refundAmount} credited to ${ownerType} wallet for application ${lead.id}`,
      lead.id,
      'admin',
      'admin',
    )
    setRefundOpen(false)
    setToast(`Refund of AED ${refundAmount.toLocaleString()} added to ${isB2B ? 'partner' : 'customer'} wallet`)
  }

  const processRefundOriginal = () => {
    if (!lead) return
    Database.updateApplication(lead.id, {
      refundProcessed: true,
      refundAmount,
      refundReason,
      refundMethod: 'original_payment',
      refundedAt: new Date().toISOString(),
    })
    Database.logActivity('refund_processed', `Refund initiated to original payment method — AED ${refundAmount}`, lead.id, 'admin', 'admin')
    setRefundOpen(false)
    setToast('Refund marked for original payment method')
  }

  const skipRefund = () => {
    if (!lead) return
    Database.updateApplication(lead.id, {
      refundProcessed: true,
      refundMethod: 'none',
      refundedAt: new Date().toISOString(),
    })
    setRefundOpen(false)
    setToast('No refund recorded for this application')
  }

  const notifyReupload = () => {
    if (!lead) return
    const updated = requestDocumentReupload(lead.id)
    const msg = notifyMessage(updated ?? lead)
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
    setToast(isB2B ? 'Partner notified to re-upload documents' : 'Customer notified to re-upload documents')
  }

  const submitToEmbassy = () => {
    if (!lead) return
    updateLeadStatus(lead.id, 'Submitted')
    setToast('Marked as submitted to embassy')
  }

  const saveNote = () => {
    if (!note.trim()) return
    setNotes((prev) => [note.trim(), ...prev])
    setNote('')
    setToast('Note saved')
  }

  const sendReminder = () => {
    const msg = notifyMessage(lead)
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
    setToast(`WhatsApp reminder opened for ${notifyLabel}`)
  }

  const handleDownloadDocument = (doc: ApplicationDocument) => {
    try {
      downloadApplicationDocument(lead.id, doc)
      setToast(`Downloaded ${doc.fileName}`)
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Could not download file')
    }
  }

  const handleDownloadAllDocuments = async () => {
    setDownloadingAll(true)
    try {
      const result = await downloadAllApplicationDocuments(lead.id, documents)
      setToast(
        result.mode === 'folder'
          ? `Saved ${result.saved} file(s) to folder "${lead.id}"`
          : `Downloaded ${result.saved} file(s) — choose a folder in Edge/Chrome for folder save`,
      )
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Could not download documents')
    } finally {
      setDownloadingAll(false)
    }
  }

  const reviewDocument = (doc: ApplicationDocument, status: 'approved' | 'rejected') => {
    updateApplicationDocumentReview(lead.id, doc.id, status)
    setToast(`${formatDocumentType(doc.type)} marked as ${status}`)
  }

  const downloadableCount = documents.filter((d) => d.fileData).length

  return (
    <AdminLayout activePath={`${basePath}/cases`} title={`Application #${lead.id}`}>
      <AdminToast message={toast} onClose={() => setToast(null)} />
      <Link to={path('/leads')} style={{ color: BRAND, textDecoration: 'none', fontSize: 14, marginBottom: 20, display: 'inline-block', fontWeight: 500 }}>← Back to Applications</Link>

      <div style={{ background: 'linear-gradient(135deg, #f8f9fc 0%, #f0f4ff 50%, #fff5f5 100%)', borderRadius: 20, padding: 24, marginBottom: 24, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <AdminAvatar name={lead.name} size={64} fontSize={22} />
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: TEXT_PRIMARY }}>{lead.name}</h2>
          <p style={{ margin: '4px 0 0', color: TEXT_SECONDARY }}>{lead.email}</p>
          {isB2B && lead.agentName && (
            <p style={{ margin: '4px 0 0', color: TEXT_MUTED, fontSize: 13 }}>B2B Partner: {lead.agentName}</p>
          )}
        </div>
        <span style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{lead.status}</span>
      </div>

      <div className="admin-grid-case">
        <div style={cardStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {[
              ['Passport', lead.passport],
              ['Destination', lead.destination],
              ['Visa Type', lead.visaType],
              ['Source', lead.source],
              ...(isB2B ? [['B2B Partner', lead.agentName ?? '—']] : []),
              ['Assigned To', lead.assigned],
              ['Payment', lead.paymentMethod ?? '—'],
              ['Invoice', lead.invoiceNo ?? '—'],
              ['Documents', lead.documentsComplete ? 'Complete' : 'Incomplete'],
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

          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>Documents</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: TEXT_MUTED }}>
                  Verify files and download for embassy portal upload
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleDownloadAllDocuments()}
                disabled={downloadingAll || downloadableCount === 0}
                style={{
                  ...primaryBtn,
                  fontSize: 13,
                  padding: '10px 16px',
                  opacity: downloadingAll || downloadableCount === 0 ? 0.55 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
                </svg>
                {downloadingAll ? 'Saving…' : `Download all (${downloadableCount})`}
              </button>
            </div>

            {documents.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: TEXT_MUTED, fontSize: 13, background: PAGE_BG, borderRadius: 12, border: `1px solid ${BORDER}` }}>
                No documents uploaded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {documents.map((doc) => {
                  const status = documentStatusStyle(doc.status)
                  const hasFile = Boolean(doc.fileData)
                  return (
                    <div
                      key={doc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '14px 16px',
                        background: PAGE_BG,
                        borderRadius: 12,
                        border: `1px solid ${BORDER}`,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: TEXT_PRIMARY }}>
                          {formatDocumentType(doc.type)}
                        </div>
                        <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 }}>{doc.fileName}</div>
                        {doc.uploadedAt && (
                          <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>
                            Uploaded {new Date(doc.uploadedAt).toLocaleString('en-GB')}
                          </div>
                        )}
                      </div>
                      <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: status.bg, color: status.color, border: `1px solid ${status.border}` }}>
                        {status.label}
                      </span>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => reviewDocument(doc, 'approved')}
                          style={{ ...outlineBtn, fontSize: 12, padding: '6px 10px', color: SUCCESS, borderColor: '#bbf7d0' }}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => reviewDocument(doc, 'rejected')}
                          style={{ ...outlineBtn, fontSize: 12, padding: '6px 10px', color: BRAND, borderColor: '#fecaca' }}
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          title={`Download ${doc.fileName}`}
                          disabled={!hasFile}
                          onClick={() => handleDownloadDocument(doc)}
                          style={{
                            ...outlineBtn,
                            fontSize: 12,
                            padding: '6px 10px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            opacity: hasFile ? 1 : 0.5,
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                            <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
                          </svg>
                          Download
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {documents.length > 0 && downloadableCount === 0 && (
              <p style={{ margin: '12px 0 0', fontSize: 12, color: TEXT_MUTED }}>
                Files from older applications may not have stored content. Ask the customer to re-upload documents.
              </p>
            )}
            {downloadableCount > 0 && (
              <p style={{ margin: '12px 0 0', fontSize: 12, color: TEXT_MUTED }}>
                Download all creates a folder named <strong>{lead.id}</strong> on your PC (Edge/Chrome folder picker).
              </p>
            )}
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
            <button type="button" onClick={submitToEmbassy} style={{ ...outlineBtn, display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, fontSize: 13 }}>Submit to Embassy</button>
            <button type="button" onClick={notifyReupload} style={{ ...outlineBtn, display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, fontSize: 13 }}>{isB2B ? 'Notify Partner — Doc Re-upload' : 'Request Doc Re-upload'}</button>
            {!isB2B && (
              <button type="button" onClick={() => setToast('Assign B2B Partner — select from Partners page')} style={{ ...outlineBtn, display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, fontSize: 13 }}>Assign B2B Partner</button>
            )}
            <button type="button" onClick={sendReminder} style={{ ...outlineBtn, display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, fontSize: 13 }}>{isB2B ? 'Notify Partner' : 'Send Reminder'}</button>
            {lead.status === 'Rejected' && !refundProcessed && (
              <button type="button" onClick={openRefundModal} style={{ ...primaryBtn, display: 'block', width: '100%', textAlign: 'center', marginBottom: 8, fontSize: 13 }}>Process Refund</button>
            )}
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

      {refundOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, maxWidth: 440, width: '100%', boxShadow: '0 24px 48px rgba(0,0,0,0.18)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, color: TEXT_PRIMARY }}>Process Refund</h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: TEXT_SECONDARY }}>
              Refund AED {refundAmount.toLocaleString()} to {lead.name}&apos;s {isB2B ? 'partner' : 'customer'} wallet?
            </p>
            <label style={{ display: 'block', fontSize: 12, color: TEXT_MUTED, marginBottom: 6 }}>Refund amount (AED)</label>
            <input
              type="number"
              min={0}
              value={refundAmount}
              onChange={(e) => setRefundAmount(Math.max(0, Number(e.target.value) || 0))}
              style={{ ...inputStyle, width: '100%', marginBottom: 16, boxSizing: 'border-box' }}
            />
            <label style={{ display: 'block', fontSize: 12, color: TEXT_MUTED, marginBottom: 6 }}>Reason</label>
            <input
              type="text"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              style={{ ...inputStyle, width: '100%', marginBottom: 20, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button type="button" onClick={processRefundToWallet} style={{ ...primaryBtn, width: '100%', fontSize: 14 }}>
                Refund to Wallet
              </button>
              <button type="button" onClick={processRefundOriginal} style={{ ...outlineBtn, width: '100%', fontSize: 14 }}>
                Refund to Original Payment Method
              </button>
              <button type="button" onClick={skipRefund} style={{ ...outlineBtn, width: '100%', fontSize: 14, color: TEXT_MUTED }}>
                No Refund
              </button>
              <button type="button" onClick={() => setRefundOpen(false)} style={{ border: 'none', background: 'none', color: TEXT_MUTED, fontSize: 13, cursor: 'pointer', marginTop: 4 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
