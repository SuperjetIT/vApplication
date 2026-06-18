import { Link, useParams } from 'react-router-dom'
import { AgentLayout } from '../../components/AgentLayout'
import { AGENT_BASE_PATH } from '../../config/portalRoutes'
import { Database } from '../../database/db'
import { getAgentPartnerId } from '../../utils/agentSession'
import { evisaBadgeLabel } from '../../utils/evisaSupport'
import { buildInvoiceViewUrl } from '../../utils/adminInvoiceUtils'
import { dbInvoiceToAdmin } from '../../utils/dbMappers'

const BRAND = '#f93e42'

export default function AgentApplicationDetailPage() {
  const { id } = useParams()
  const partnerId = getAgentPartnerId() ?? ''
  const app = id ? Database.getApplicationById(id) : undefined
  const commission = Database.getCommissions({ partnerId }).find((c) => String(c.applicationId) === id)
  const docs = id ? Database.getDocumentsByApplication(id) : []
  const appDocs = (app?.documents as { id?: string; type?: string; fileName?: string; status?: string }[] | undefined) ?? []

  if (!app || String(app.partnerId) !== partnerId) {
    return (
      <AgentLayout>
        <p>Application not found.</p>
        <Link to={`${AGENT_BASE_PATH}/applications`} style={{ color: BRAND }}>← Back</Link>
      </AgentLayout>
    )
  }

  const travelers = app.travelers as { firstName?: string; lastName?: string; email?: string; phone?: string; nationality?: string }[] | undefined
  const customer = travelers?.[0]
  const timeline = (app.timeline as { status?: string; timestamp?: string; note?: string }[] | undefined) ?? []
  const amount = app.amount as { governmentFee?: number; processingFee?: number; total?: number } | undefined
  const allDocs = appDocs.length > 0 ? appDocs : docs
  const invoice = Database.getInvoices().find((inv) => String(inv.applicationId) === id)
  const invoiceUrl = invoice
    ? buildInvoiceViewUrl(dbInvoiceToAdmin(invoice as Record<string, unknown>), id)
    : null

  return (
    <AgentLayout>
      <Link to={`${AGENT_BASE_PATH}/applications`} style={{ color: BRAND, textDecoration: 'none', fontSize: 14, marginBottom: 20, display: 'inline-block' }}>← Back to applications</Link>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 24, alignItems: 'start' }}>
        <div>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <h1 style={{ margin: '0 0 4px', fontSize: 20 }}>{customer ? `${customer.firstName} ${customer.lastName}` : 'Customer'}</h1>
            <p style={{ margin: 0, color: '#666' }}>{String(app.destinationName)} · {String(app.visaOption)}</p>
            <span style={{ display: 'inline-block', marginTop: 8, fontSize: 12, color: '#888' }}>{evisaBadgeLabel(Boolean(app.evisaSupported))}</span>
          </div>

          <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Status Timeline</h3>
            <div style={{ borderLeft: '2px solid #eee', paddingLeft: 20, marginLeft: 8 }}>
              {timeline.map((t, i) => (
                <div key={i} style={{ marginBottom: 20, position: 'relative' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: BRAND, position: 'absolute', left: -27, top: 4 }} />
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{String(t.status)}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{String(t.timestamp ?? '').slice(0, 16).replace('T', ' ')}</div>
                  {t.note && <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{t.note}</div>}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Documents</h3>
            {allDocs.length === 0 ? (
              <p style={{ color: '#888', fontSize: 13 }}>No documents uploaded.</p>
            ) : (
              allDocs.map((d, i) => (
                <div key={String(d.id ?? i)} style={{ padding: 12, background: '#f8f9fc', borderRadius: 10, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13 }}>{String(d.fileName ?? d.type)}</span>
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: String(d.status).includes('reject') ? '#fee2e2' : '#eef4ff', color: String(d.status).includes('reject') ? '#b91c1c' : '#5057ea' }}>{String(d.status ?? 'uploaded')}</span>
                </div>
              ))
            )}
            {String(app.status).includes('pending') && (
              <button type="button" style={{ marginTop: 12, background: '#fff', border: `1px solid ${BRAND}`, color: BRAND, borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Re-upload Documents</button>
            )}
          </div>
        </div>

        <div style={{ position: 'sticky', top: 88 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Customer Info</h3>
            <div style={{ fontSize: 13, color: '#555', lineHeight: 1.8 }}>
              <div>{customer?.email ?? '—'}</div>
              <div>{customer?.phone ?? '—'}</div>
              <div>{customer?.nationality ?? '—'}</div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Payment Summary</h3>
            <div style={{ fontSize: 13, lineHeight: 1.8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Gov Fee</span><span>AED {amount?.governmentFee ?? 0}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Processing</span><span>AED {amount?.processingFee ?? 0}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: 8 }}><span>Total</span><span>AED {amount?.total ?? 0}</span></div>
              <div style={{ marginTop: 8, color: '#888' }}>Status: {String(app.paymentStatus)}</div>
            </div>
          </div>

          <div style={{ background: '#f0fff4', border: '1px solid #bbf7d0', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 13, color: '#166534' }}>You&apos;ll earn AED {Number(commission?.commissionAmount ?? 0)} once approved</div>
            {invoiceUrl ? (
              <a href={invoiceUrl} target="_blank" rel="noreferrer" style={{ display: 'block', width: '100%', marginTop: 12, background: '#fff', border: '1px solid #ddd', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', color: '#333' }}>Download Invoice</a>
            ) : (
              <button type="button" disabled style={{ width: '100%', marginTop: 12, background: '#fff', border: '1px solid #ddd', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 600, cursor: 'not-allowed', opacity: 0.6 }}>No invoice yet</button>
            )}
          </div>
        </div>
      </div>
    </AgentLayout>
  )
}
