import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AgentPageShell, StatusProgressBar } from '../../components/agent/AgentUI'
import { AgentLayout } from '../../components/AgentLayout'
import { AGENT_BASE_PATH } from '../../config/portalRoutes'
import { Database } from '../../database/db'
import { useDatabaseListener } from '../../hooks/useDatabase'
import { AGENT_ACCENT, AGENT_CARD, AGENT_ERROR, AGENT_MUTED, AGENT_PRIMARY } from '../../theme/agentTheme'
import { getAgentPartnerId } from '../../utils/agentSession'
import { evisaBadgeLabel } from '../../utils/evisaSupport'
import { buildInvoiceViewUrl } from '../../utils/adminInvoiceUtils'
import { dbInvoiceToAdmin } from '../../utils/dbMappers'

export default function AgentApplicationDetailPage() {
  const { id } = useParams()
  const partnerId = getAgentPartnerId() ?? ''
  const dbVersion = useDatabaseListener()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  const app = useMemo(
    () => (id ? Database.getApplicationById(id) : undefined),
    [id, dbVersion],
  )
  const commission = useMemo(
    () => Database.getCommissions({ partnerId }).find((c) => String(c.applicationId) === id),
    [partnerId, id, dbVersion],
  )
  const docs = useMemo(
    () => (id ? Database.getDocumentsByApplication(id) : []),
    [id, dbVersion],
  )

  if (!app || String(app.partnerId) !== partnerId) {
    return (
      <AgentLayout>
        <p>Application not found.</p>
        <Link to={`${AGENT_BASE_PATH}/applications`} style={{ color: AGENT_ACCENT }}>← Back</Link>
      </AgentLayout>
    )
  }

  const travelers = app.travelers as { firstName?: string; lastName?: string; email?: string; phone?: string; nationality?: string }[] | undefined
  const customer = travelers?.[0]
  const timeline = (app.timeline as { status?: string; timestamp?: string; note?: string }[] | undefined) ?? []
  const amount = app.amount as { governmentFee?: number; processingFee?: number; total?: number } | undefined
  const appDocs = (app.documents as { id?: string; type?: string; fileName?: string; status?: string }[] | undefined) ?? []
  const allDocs = appDocs.length > 0 ? appDocs : docs
  const invoice = Database.getInvoices().find((inv) => String(inv.applicationId) === id)
  const invoiceUrl = invoice
    ? buildInvoiceViewUrl(dbInvoiceToAdmin(invoice as Record<string, unknown>), id)
    : null

  const isRejected = String(app.status).toLowerCase() === 'rejected'
  const refundProcessed = Boolean(app.refundProcessed)
  const refundAmount = Number(app.refundAmount ?? 0)
  const walletBalance = Database.getPartnerWalletBalance(partnerId)

  return (
    <AgentLayout>
      <AgentPageShell loading={loading}>
        <Link to={`${AGENT_BASE_PATH}/applications`} style={{ color: AGENT_ACCENT, textDecoration: 'none', fontSize: 14, marginBottom: 20, display: 'inline-block' }}>← Back to applications</Link>

        {isRejected && refundProcessed && app.refundMethod === 'wallet' && refundAmount > 0 && (
          <div style={{ background: '#f0fff4', border: '1px solid #bbf7d0', borderRadius: 16, padding: 20, marginBottom: 20, color: '#166534' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>✓ Refund processed</div>
            <div style={{ fontSize: 14 }}>
              AED {refundAmount.toLocaleString()} has been refunded to your wallet. Current balance: AED {walletBalance.toLocaleString()}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 24, alignItems: 'start' }}>
          <div>
            <div style={{ background: AGENT_CARD, borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 2px 12px rgba(37,99,235,0.06)', border: '1px solid #e2e8f0' }}>
              <h1 style={{ margin: '0 0 4px', fontSize: 20, color: AGENT_PRIMARY }}>{customer ? `${customer.firstName} ${customer.lastName}` : 'Customer'}</h1>
              <p style={{ margin: 0, color: AGENT_MUTED }}>{String(app.destinationName)} · {String(app.visaOption)}</p>
              <div style={{ marginTop: 12 }}>
                <StatusProgressBar status={String(app.status)} />
              </div>
              <span style={{ display: 'inline-block', marginTop: 8, fontSize: 12, color: AGENT_MUTED }}>{evisaBadgeLabel(Boolean(app.evisaSupported))}</span>
            </div>

            <div style={{ background: AGENT_CARD, borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 2px 12px rgba(37,99,235,0.06)', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: AGENT_PRIMARY }}>Status Timeline</h3>
              <div style={{ borderLeft: '2px solid #e2e8f0', paddingLeft: 20, marginLeft: 8 }}>
                {timeline.length === 0 ? (
                  <p style={{ color: AGENT_MUTED, fontSize: 13 }}>Status: {String(app.status)}</p>
                ) : timeline.map((t, i) => (
                  <div key={i} style={{ marginBottom: 20, position: 'relative' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: AGENT_ACCENT, position: 'absolute', left: -27, top: 4 }} />
                    <div style={{ fontWeight: 600, fontSize: 14, color: AGENT_PRIMARY }}>{String(t.status)}</div>
                    <div style={{ fontSize: 12, color: AGENT_MUTED }}>{String(t.timestamp ?? '').slice(0, 16).replace('T', ' ')}</div>
                    {t.note && <div style={{ fontSize: 13, color: AGENT_MUTED, marginTop: 4 }}>{t.note}</div>}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: AGENT_CARD, borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(37,99,235,0.06)', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: AGENT_PRIMARY }}>Documents</h3>
              {allDocs.length === 0 ? (
                <p style={{ color: AGENT_MUTED, fontSize: 13 }}>No documents uploaded.</p>
              ) : (
                allDocs.map((d, i) => (
                  <div key={String(d.id ?? i)} style={{ padding: 12, background: '#f8fafc', borderRadius: 10, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13 }}>{String(d.fileName ?? d.type)}</span>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: String(d.status).includes('reject') ? '#fee2e2' : '#eff6ff', color: String(d.status).includes('reject') ? AGENT_ERROR : AGENT_ACCENT }}>{String(d.status ?? 'uploaded')}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ position: 'sticky', top: 88 }}>
            <div style={{ background: AGENT_CARD, borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: '0 2px 12px rgba(37,99,235,0.06)', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: AGENT_PRIMARY }}>Customer Info</h3>
              <div style={{ fontSize: 13, color: AGENT_MUTED, lineHeight: 1.8 }}>
                <div>{customer?.email ?? '—'}</div>
                <div>{customer?.phone ?? '—'}</div>
                <div>{customer?.nationality ?? '—'}</div>
              </div>
            </div>

            <div style={{ background: AGENT_CARD, borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: '0 2px 12px rgba(37,99,235,0.06)', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: AGENT_PRIMARY }}>Payment Summary</h3>
              <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Gov Fee</span><span>AED {amount?.governmentFee ?? 0}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Processing</span><span>AED {amount?.processingFee ?? 0}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: 8, color: AGENT_PRIMARY }}><span>Total</span><span>AED {amount?.total ?? 0}</span></div>
                <div style={{ marginTop: 8, color: AGENT_MUTED }}>Status: {String(app.paymentStatus)}</div>
              </div>
            </div>

            <div style={{ background: '#f0fff4', border: '1px solid #bbf7d0', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(37,99,235,0.06)' }}>
              <div style={{ fontSize: 13, color: '#166534' }}>You&apos;ll earn AED {Number(commission?.commissionAmount ?? 0)} once approved</div>
              {invoiceUrl ? (
                <a href={invoiceUrl} target="_blank" rel="noreferrer" style={{ display: 'block', width: '100%', marginTop: 12, background: AGENT_ACCENT, border: 'none', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', color: '#fff' }}>Download Invoice</a>
              ) : (
                <button type="button" disabled style={{ width: '100%', marginTop: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 600, cursor: 'not-allowed', opacity: 0.6 }}>No invoice yet</button>
              )}
            </div>
          </div>
        </div>
      </AgentPageShell>
    </AgentLayout>
  )
}
