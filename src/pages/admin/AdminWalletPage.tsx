import { useMemo, useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AdminLayout } from '../../components/AdminLayout'
import { AdminToast } from '../../components/admin/AdminToast'
import { BRAND, BORDER, cardStyle, inputStyle, primaryBtn, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from '../../components/admin/adminTheme'
import { Database } from '../../database/db'
import { useDatabaseListener } from '../../hooks/useDatabase'
import { getWalletChartData, getWalletHealthStyle } from '../../utils/walletUtils'

const PRESETS = [100, 500, 1000, 2000]

export default function AdminWalletPage() {
  const dbVersion = useDatabaseListener()
  const [tab, setTab] = useState<'b2b' | 'b2c'>('b2b')
  const [toast, setToast] = useState<string | null>(null)
  const [creditModal, setCreditModal] = useState<{ id: string; name: string; type: 'b2b' | 'b2c' } | null>(null)
  const [historyModal, setHistoryModal] = useState<{ id: string; name: string } | null>(null)
  const [creditAmount, setCreditAmount] = useState(500)
  const [creditNote, setCreditNote] = useState('')

  const { b2bWallets, b2cWallets } = useMemo(() => Database.getAllWalletBalances(), [dbVersion])
  const chartData = useMemo(
    () => getWalletChartData(Database.getAllWalletTransactions()),
    [dbVersion],
  )

  const b2bTotal = b2bWallets.reduce((s, w) => s + w.balance, 0)
  const b2cTotal = b2cWallets.reduce((s, w) => s + w.balance, 0)
  const lowB2b = b2bWallets.filter((w) => w.balance < 500).length
  const monthKey = new Date().toISOString().slice(0, 7)
  const toppedUpMonth = b2bWallets.flatMap((w) => Database.getWalletTransactions(w.id))
    .filter((t) => String(t.type) === 'credit' && String(t.createdAt).slice(0, 7) === monthKey)
    .reduce((s, t) => s + Number(t.amount ?? 0), 0)

  const confirmCredit = () => {
    if (!creditModal || creditAmount <= 0) return
    if (creditModal.type === 'b2b') {
      Database.topUpPartnerWallet(creditModal.id, creditAmount, 'admin', creditNote || 'Monthly credit allocation')
    } else {
      Database.topUpUserWallet(creditModal.id, creditAmount)
    }
    setToast(`AED ${creditAmount.toLocaleString()} added to ${creditModal.name}'s wallet`)
    setCreditModal(null)
    setCreditAmount(500)
    setCreditNote('')
  }

  const historyRows = historyModal ? Database.getWalletTransactions(historyModal.id) : []

  return (
    <AdminLayout activePath="/admin/wallet" title="Wallet Management">
      <AdminToast message={toast} onClose={() => setToast(null)} />

      <div style={{ display: 'flex', gap: 24, borderBottom: `1px solid ${BORDER}`, marginBottom: 24 }}>
        {(['b2b', 'b2c'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: '12px 0',
              border: 'none',
              background: 'none',
              fontWeight: 700,
              fontSize: 14,
              color: tab === t ? TEXT_PRIMARY : TEXT_MUTED,
              borderBottom: tab === t ? `2px solid ${BRAND}` : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            {t === 'b2b' ? 'B2B Partner Wallets' : 'B2C Customer Wallets'}
          </button>
        ))}
      </div>

      {tab === 'b2b' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total B2B Credit Outstanding', value: `AED ${b2bTotal.toLocaleString()}` },
              { label: 'Partners with Low Balance (<500)', value: String(lowB2b) },
              { label: 'Total Topped Up This Month', value: `AED ${toppedUpMonth.toLocaleString()}` },
            ].map((c) => (
              <div key={c.label} style={{ ...cardStyle, padding: 20 }}>
                <div style={{ fontSize: 12, color: TEXT_MUTED }}>{c.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: TEXT_PRIMARY, marginTop: 4 }}>{c.value}</div>
              </div>
            ))}
          </div>

          <div style={{ ...cardStyle, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 720 }}>
              <thead>
                <tr style={{ background: '#f8f9fc' }}>
                  {['Partner', 'Company', 'Balance', 'Status', 'Actions'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: TEXT_MUTED }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b2bWallets.map((w) => {
                  const health = getWalletHealthStyle(w.balance)
                  return (
                    <tr key={w.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td style={{ padding: '12px 16px' }}>{w.contactPerson || '—'}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{w.name}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>AED {w.balance.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: health.background, color: health.color, borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 600 }}>{health.label}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button type="button" onClick={() => setCreditModal({ id: w.id, name: w.name, type: 'b2b' })} style={{ ...primaryBtn, padding: '6px 12px', fontSize: 12, marginRight: 8 }}>Add Credit</button>
                        <button type="button" onClick={() => setHistoryModal({ id: w.id, name: w.name })} style={{ border: `1px solid ${BORDER}`, background: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>View Transactions</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'b2c' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total B2C Wallet Balance', value: `AED ${b2cTotal.toLocaleString()}` },
              { label: 'Customers with Balance', value: String(b2cWallets.filter((w) => w.balance > 0).length) },
              { label: 'Refunds This Month', value: `AED ${b2cWallets.flatMap((w) => Database.getWalletTransactions(w.id)).filter((t) => String(t.type) === 'credit' && String(t.note).includes('Refund') && String(t.createdAt).slice(0, 7) === monthKey).reduce((s, t) => s + Number(t.amount ?? 0), 0).toLocaleString()}` },
            ].map((c) => (
              <div key={c.label} style={{ ...cardStyle, padding: 20 }}>
                <div style={{ fontSize: 12, color: TEXT_MUTED }}>{c.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: TEXT_PRIMARY, marginTop: 4 }}>{c.value}</div>
              </div>
            ))}
          </div>

          <div style={{ ...cardStyle, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 640 }}>
              <thead>
                <tr style={{ background: '#f8f9fc' }}>
                  {['Customer', 'Email', 'Balance', 'Actions'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: TEXT_MUTED }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b2cWallets.map((w) => (
                  <tr key={w.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{w.name}</td>
                    <td style={{ padding: '12px 16px', color: TEXT_SECONDARY }}>{w.email}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700 }}>AED {w.balance.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <button type="button" onClick={() => setCreditModal({ id: w.id, name: w.name, type: 'b2c' })} style={{ ...primaryBtn, padding: '6px 12px', fontSize: 12, marginRight: 8 }}>Add Credit (Refund)</button>
                      <button type="button" onClick={() => setHistoryModal({ id: w.id, name: w.name })} style={{ border: `1px solid ${BORDER}`, background: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>View History</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div style={{ ...cardStyle, padding: 24, marginTop: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Wallet Activity (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="credits" stroke="#22c55e" strokeWidth={2} dot={false} name="Credits" />
            <Line type="monotone" dataKey="debits" stroke="#5057ea" strokeWidth={2} dot={false} name="Debits" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {creditModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 24 }} onClick={() => setCreditModal(null)}>
          <div style={{ ...cardStyle, padding: 28, maxWidth: 400, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px' }}>Add Credit — {creditModal.name}</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {PRESETS.map((p) => (
                <button key={p} type="button" onClick={() => setCreditAmount(p)} style={{ padding: '6px 12px', borderRadius: 8, border: creditAmount === p ? `2px solid ${BRAND}` : `1px solid ${BORDER}`, background: '#fff', cursor: 'pointer' }}>AED {p}</button>
              ))}
            </div>
            <input type="number" value={creditAmount} onChange={(e) => setCreditAmount(Number(e.target.value) || 0)} style={{ ...inputStyle, width: '100%', marginBottom: 12 }} placeholder="Custom amount" />
            {creditModal.type === 'b2b' && (
              <input value={creditNote} onChange={(e) => setCreditNote(e.target.value)} style={{ ...inputStyle, width: '100%', marginBottom: 16 }} placeholder="Note (optional)" />
            )}
            <button type="button" onClick={confirmCredit} style={{ ...primaryBtn, width: '100%' }}>Confirm Top-up</button>
          </div>
        </div>
      )}

      {historyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 24 }} onClick={() => setHistoryModal(null)}>
          <div style={{ ...cardStyle, padding: 28, maxWidth: 640, width: '100%', maxHeight: '80vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px' }}>Transactions — {historyModal.name}</h3>
            {historyRows.length === 0 ? <p style={{ color: TEXT_MUTED }}>No transactions</p> : (
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead><tr>{['Date', 'Type', 'Amount', 'Note'].map((h) => <th key={h} style={{ textAlign: 'left', padding: 8, color: TEXT_MUTED }}>{h}</th>)}</tr></thead>
                <tbody>
                  {historyRows.map((t) => (
                    <tr key={String(t.id)} style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td style={{ padding: 8 }}>{String(t.createdAt).slice(0, 10)}</td>
                      <td style={{ padding: 8 }}>{String(t.type)}</td>
                      <td style={{ padding: 8 }}>AED {Number(t.amount ?? 0)}</td>
                      <td style={{ padding: 8 }}>{String(t.note ?? '')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
