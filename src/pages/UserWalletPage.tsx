import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import { Navbar } from '../components/Navbar'
import { SiteFooter } from '../components/SiteFooter'
import { useAuth } from '../context/AuthContext'
import { getStripePromise, stripeMockCheckout } from '../config/stripe'
import { Database } from '../database/db'
import { useDatabaseListener } from '../hooks/useDatabase'
import { downloadWalletStatement } from '../utils/walletUtils'

const B2C_ACCENT = '#5057ea'
const PRESETS = [100, 250, 500, 1000]

function getUserId(email: string): string | null {
  const fromStorage = localStorage.getItem('current_user_id')
  if (fromStorage) return fromStorage
  const user = Database.getUserByEmail(email.trim().toLowerCase())
  return user ? String(user.id) : null
}

function AddMoneyForm({ userId, onSuccess }: { userId: string; onSuccess: (amount: number) => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [amount, setAmount] = useState(250)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  const handleAdd = async () => {
    if (amount <= 0) return
    setError('')
    setPaying(true)

    if (stripeMockCheckout || !stripe) {
      window.setTimeout(() => {
        Database.topUpUserWallet(userId, amount, `mock_${Date.now()}`)
        setPaying(false)
        onSuccess(amount)
      }, 600)
      return
    }

    const card = elements?.getElement(CardElement)
    if (!card) {
      setPaying(false)
      setError('Card form not ready')
      return
    }
    const { error: stripeError } = await stripe.createPaymentMethod({ type: 'card', card })
    if (stripeError) {
      setPaying(false)
      setError(stripeError.message ?? 'Payment failed')
      return
    }
    Database.topUpUserWallet(userId, amount, `stripe_${Date.now()}`)
    setPaying(false)
    onSuccess(amount)
  }

  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 8 }}>Amount (AED)</label>
      <input
        type="number"
        min={1}
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value) || 0)}
        style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box', marginBottom: 12 }}
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {PRESETS.map((p) => (
          <button key={p} type="button" onClick={() => setAmount(p)} style={{ padding: '8px 14px', borderRadius: 20, border: amount === p ? `2px solid ${B2C_ACCENT}` : '1px solid #e5e7eb', background: amount === p ? '#eef2ff' : '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
            AED {p}
          </button>
        ))}
      </div>
      {!stripeMockCheckout && (
        <div style={{ padding: 14, border: '1px solid #e5e7eb', borderRadius: 12, marginBottom: 16 }}>
          <CardElement options={{ style: { base: { fontSize: '15px' } } }} />
        </div>
      )}
      {error && <p style={{ color: '#b91c1c', fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <button type="button" disabled={paying || amount <= 0} onClick={handleAdd} style={{ width: '100%', background: B2C_ACCENT, color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontWeight: 700, cursor: 'pointer', opacity: paying ? 0.7 : 1 }}>
        {paying ? 'Processing…' : `Add AED ${amount.toLocaleString()} to Wallet`}
      </button>
    </div>
  )
}

export default function UserWalletPage() {
  const { user, isLoggedIn } = useAuth()
  const dbVersion = useDatabaseListener()
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const userId = user?.email ? getUserId(user.email) : null

  const balance = useMemo(
    () => (userId ? Database.getUserWalletBalance(userId) : 0),
    [userId, dbVersion],
  )
  const transactions = useMemo(
    () => (userId ? Database.getWalletTransactions(userId) : []),
    [userId, dbVersion],
  )

  const filtered = useMemo(() => {
    if (filter === 'all') return transactions
    return transactions.filter((t: Record<string, unknown>) => String(t.type) === filter)
  }, [transactions, filter])

  if (!isLoggedIn || !userId) return <Navigate to="/sign-in" replace />

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fc', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        isMobile={isMobile}
        isLoggedIn
        avatarInitials={initials}
        showTabs={false}
        walletBalance={balance}
      />
      <main style={{ flex: 1, maxWidth: 800, margin: '0 auto', padding: '32px 24px', width: '100%' }}>
        <Link to="/user/me" style={{ color: B2C_ACCENT, textDecoration: 'none', fontSize: 14, marginBottom: 20, display: 'inline-block' }}>← Back to My Account</Link>
        <h1 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 700 }}>My Wallet</h1>

        {successMsg && (
          <div style={{ background: '#f0fff4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 14, marginBottom: 20, color: '#166534', fontSize: 14 }}>
            {successMsg}
          </div>
        )}

        <div style={{ background: `linear-gradient(135deg, ${B2C_ACCENT}, #818cf8)`, borderRadius: 24, padding: 40, color: '#fff', textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 14, opacity: 0.85 }}>Available Balance</div>
          <div style={{ fontSize: 48, fontWeight: 800, marginTop: 8 }}>AED {balance.toLocaleString()}</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setShowAddModal(true)} style={{ background: '#fff', color: B2C_ACCENT, border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 700, cursor: 'pointer' }}>Add Money</button>
            <button type="button" onClick={() => downloadWalletStatement(transactions, 'my-wallet-statement.csv')} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 12, padding: '12px 24px', fontWeight: 600, cursor: 'pointer' }}>
              Transaction History
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['all', 'credit', 'debit'] as const).map((tab) => (
            <button key={tab} type="button" onClick={() => setFilter(tab)} style={{ padding: '8px 16px', borderRadius: 20, border: filter === tab ? `2px solid ${B2C_ACCENT}` : '1px solid #e5e7eb', background: filter === tab ? '#eef2ff' : '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize' }}>
              {tab === 'all' ? 'All' : tab === 'credit' ? 'Credits' : 'Debits'}
            </button>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 16, overflow: 'auto', border: '1px solid #eee' }}>
          {filtered.length === 0 ? (
            <p style={{ padding: 32, textAlign: 'center', color: '#888', margin: 0 }}>No transactions yet</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 560 }}>
              <thead>
                <tr style={{ background: '#f8f9fc' }}>
                  {['Date', 'Type', 'Description', 'Amount', 'Balance'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#888' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t: Record<string, unknown>) => {
                  const credit = String(t.type) === 'credit'
                  return (
                    <tr key={String(t.id)} style={{ borderTop: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px 16px' }}>{String(t.createdAt).slice(0, 10)}</td>
                      <td style={{ padding: '12px 16px', color: credit ? '#166534' : '#b91c1c', fontWeight: 600 }}>{credit ? 'Credit ↑' : 'Debit ↓'}</td>
                      <td style={{ padding: '12px 16px' }}>{String(t.note ?? '—')}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: credit ? '#166534' : '#b91c1c' }}>{credit ? '+' : '-'}AED {Number(t.amount ?? 0).toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', color: '#888' }}>AED {Number(t.balanceAfter ?? 0).toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
      <SiteFooter isMobile={isMobile} />

      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 24 }} onClick={() => setShowAddModal(false)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, maxWidth: 420, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18 }}>Add Money to Wallet</h2>
            <Elements stripe={getStripePromise()}>
              <AddMoneyForm
                userId={userId}
                onSuccess={(amt) => {
                  setShowAddModal(false)
                  setSuccessMsg(`AED ${amt.toLocaleString()} added to your wallet!`)
                }}
              />
            </Elements>
            <button type="button" onClick={() => setShowAddModal(false)} style={{ marginTop: 12, width: '100%', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
