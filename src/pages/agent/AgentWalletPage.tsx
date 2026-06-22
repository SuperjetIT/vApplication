import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AgentLayout } from '../../components/AgentLayout'
import { Database } from '../../database/db'
import { useDatabaseListener } from '../../hooks/useDatabase'
import { AGENT_ACCENT, AGENT_CARD, AGENT_MUTED, AGENT_PRIMARY } from '../../theme/agentTheme'
import { getAgentPartnerId } from '../../utils/agentSession'
import { downloadWalletStatement, getWalletHealthStyle } from '../../utils/walletUtils'

type FilterTab = 'all' | 'credit' | 'debit'

export default function AgentWalletPage() {
  const navigate = useNavigate()
  const partnerId = getAgentPartnerId() ?? ''
  const dbVersion = useDatabaseListener()
  const [filter, setFilter] = useState<FilterTab>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  const partner = useMemo(
    () => Database.getPartnerById(partnerId),
    [partnerId, dbVersion],
  )
  const balance = useMemo(
    () => Database.getPartnerWalletBalance(partnerId),
    [partnerId, dbVersion],
  )
  const transactions = useMemo(
    () => Database.getWalletTransactions(partnerId),
    [partnerId, dbVersion],
  )

  const filtered = useMemo(() => {
    if (filter === 'all') return transactions
    return transactions.filter((t) => String(t.type) === filter)
  }, [transactions, filter])

  const health = getWalletHealthStyle(balance)
  const companyName = String(partner?.companyName ?? 'Partner')

  const openWhatsAppTopUp = () => {
    const text = `Hi Superjet Global, I need to top up my partner wallet. My company: ${companyName}. Current balance: AED ${balance}`
    window.open(`https://wa.me/971559641020?text=${encodeURIComponent(text)}`, '_blank')
  }

  if (!partner && !loading) {
    return (
      <AgentLayout>
        <p>Partner not found.</p>
      </AgentLayout>
    )
  }

  return (
    <AgentLayout>
      <style>{`@keyframes agentSpin { to { transform: rotate(360deg); } }`}</style>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTop: `3px solid ${AGENT_ACCENT}`, borderRadius: '50%', animation: 'agentSpin 1s linear infinite' }} />
        </div>
      ) : (
        <>
          <h1 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700, color: AGENT_PRIMARY }}>My Wallet</h1>

          <div style={{
            background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
            borderRadius: 24,
            padding: 40,
            color: '#fff',
            textAlign: 'center',
            marginBottom: 24,
          }}>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>Available Balance</div>
            <div style={{ fontSize: 52, fontWeight: 800, marginTop: 8 }}>AED {balance.toLocaleString()}</div>
            <div style={{ fontSize: 13, marginTop: 12, color: 'rgba(255,255,255,0.85)' }}>
              {balance < 500 ? '⚠ Low balance — contact your account manager' : '✓ Balance is healthy'}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
              <button type="button" onClick={openWhatsAppTopUp} style={{ background: '#fff', color: AGENT_ACCENT, border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 700, cursor: 'pointer' }}>
                Request Top-up
              </button>
              <button
                type="button"
                onClick={() => downloadWalletStatement(transactions, `wallet-statement-${companyName.replace(/\s/g, '-')}.csv`)}
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 12, padding: '12px 24px', fontWeight: 600, cursor: 'pointer' }}
              >
                Download Statement
              </button>
            </div>
          </div>

          {balance < 500 && (
            <div style={{ background: '#fff0f0', border: '1px solid #fca5a5', borderRadius: 16, padding: 20, marginBottom: 24 }}>
              <div style={{ fontWeight: 700, color: '#b91c1c', marginBottom: 6 }}>⚠ Your wallet balance is running low</div>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#991b1b' }}>
                Contact Superjet Global to add credit before your next application.
              </p>
              <button type="button" onClick={openWhatsAppTopUp} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Request Top-up via WhatsApp
              </button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: AGENT_PRIMARY }}>Transaction History</h2>
            <span style={{ background: health.background, color: health.color, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
              {health.label}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {(['all', 'credit', 'debit'] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  border: filter === tab ? `2px solid ${AGENT_ACCENT}` : '1px solid #e2e8f0',
                  background: filter === tab ? '#eff6ff' : '#fff',
                  color: filter === tab ? AGENT_ACCENT : AGENT_MUTED,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {tab === 'all' ? 'All' : tab === 'credit' ? 'Credits' : 'Debits'}
              </button>
            ))}
          </div>

          <div style={{ background: AGENT_CARD, borderRadius: 16, overflow: 'auto', border: '1px solid #e2e8f0' }}>
            {filtered.length === 0 ? (
              <p style={{ padding: 32, textAlign: 'center', color: AGENT_MUTED, margin: 0 }}>No transactions yet</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 640 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {['Date', 'Type', 'Description', 'Amount', 'Balance After'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: AGENT_MUTED, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => {
                    const isCredit = String(t.type) === 'credit'
                    return (
                      <tr key={String(t.id)} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', color: AGENT_MUTED }}>{String(t.createdAt).slice(0, 10)}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: isCredit ? '#166534' : '#b91c1c' }}>
                          {isCredit ? 'Credit ↑' : 'Debit ↓'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>{String(t.note ?? '—')}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: isCredit ? '#166534' : '#b91c1c' }}>
                          {isCredit ? '+' : '-'}AED {Number(t.amount ?? 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 16px', color: AGENT_MUTED }}>AED {Number(t.balanceAfter ?? 0).toLocaleString()}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          <button type="button" onClick={() => navigate('/agent/apply')} style={{ marginTop: 24, background: AGENT_ACCENT, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 700, cursor: 'pointer' }}>
            Apply for Visa →
          </button>
        </>
      )}
    </AgentLayout>
  )
}
