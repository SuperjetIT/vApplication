import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { flagUrl } from '../utils/flags'

const BRAND = '#f93e42'
const ACCENT = '#5057ea'
const GREEN = '#22c55e'
const RED = '#ef4444'

const CONFETTI_COLORS = ['#f93e42', '#5057ea', '#ffd700', '#22c55e', '#ff6b6b', '#4ecdc4']

function ShieldIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"
        stroke={ACCENT}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="#25D366" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function ConfettiLayer() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 80 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        duration: `${2 + Math.random() * 2}s`,
        delay: `${Math.random() * 2}s`,
        size: 8 + Math.floor(Math.random() * 6),
      })),
    [],
  )

  return (
    <div className="no-print" aria-hidden>
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'fixed',
            top: 0,
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: 2,
            zIndex: 9999,
            pointerEvents: 'none',
            animation: `confettiFall ${p.duration} ${p.delay} ease-in forwards`,
          }}
        />
      ))}
    </div>
  )
}

function TableRow({
  description,
  qty,
  unit,
  amount,
  amountColor,
}: {
  description: string
  qty: string
  unit: string
  amount: string
  amountColor?: string
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 0.6fr 1fr 1fr',
        gap: 8,
        padding: '14px 16px',
        borderBottom: '1px solid #f5f5f5',
        fontSize: 14,
        alignItems: 'center',
      }}
    >
      <span style={{ color: '#333' }}>{description}</span>
      <span style={{ color: '#666', textAlign: 'center' }}>{qty}</span>
      <span style={{ color: '#666', textAlign: 'right' }}>{unit}</span>
      <span style={{ color: amountColor ?? '#111', fontWeight: 600, textAlign: 'right' }}>{amount}</span>
    </div>
  )
}

export default function InvoicePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showConfetti, setShowConfetti] = useState(false)

  const status = searchParams.get('status') === 'failed' ? 'failed' : 'success'
  const isSuccess = status === 'success'

  const name = searchParams.get('name') ?? 'Guest Traveler'
  const amount = Number.parseInt(searchParams.get('amount') ?? '0', 10)
  const country = searchParams.get('country') ?? '—'
  const option = searchParams.get('option') ?? 'Visa'
  const invoiceNo =
    searchParams.get('invoiceNo') ?? `ATL${Date.now().toString().slice(-8)}`
  const date = searchParams.get('date') ?? new Date().toLocaleDateString('en-GB')
  const travelers = Number.parseInt(searchParams.get('travelers') ?? '1', 10)
  const govFee = Number.parseInt(searchParams.get('govFee') ?? '0', 10)
  const processingFee = Number.parseInt(searchParams.get('processingFee') ?? '99', 10)
  const discount = Number.parseInt(searchParams.get('discount') ?? '0', 10)
  const countryCode = searchParams.get('countryCode') ?? 'ae'
  const subtotalParam = searchParams.get('subtotal')

  const govTotal = govFee * travelers
  const processingTotal = processingFee * travelers
  const subtotal =
    subtotalParam != null
      ? Number.parseInt(subtotalParam, 10)
      : govTotal + processingTotal - discount
  const vat = Math.round(subtotal * 0.05)
  const grandTotal = amount > 0 ? amount : subtotal + vat

  useEffect(() => {
    if (!isSuccess) return
    setShowConfetti(true)
    const t = window.setTimeout(() => setShowConfetti(false), 4000)
    return () => window.clearTimeout(t)
  }, [isSuccess])

  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .invoice-card { box-shadow: none !important; }
        }
      `}</style>

      {showConfetti && <ConfettiLayer />}

      <div
        style={{
          minHeight: '100vh',
          background: '#f5f5f5',
          padding: '40px 20px',
        }}
      >
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div
            className="invoice-card"
            style={{
              background: '#fff',
              borderRadius: 20,
              boxShadow: '0 4px 40px rgba(0,0,0,0.10)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                background: isSuccess
                  ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                  : 'linear-gradient(135deg, #ef4444, #dc2626)',
                padding: '20px 32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 18 }}>
                {isSuccess ? '✓ PAYMENT SUCCESSFUL' : '✕ PAYMENT FAILED'}
              </p>
              <span
                style={{
                  background: '#fff',
                  color: isSuccess ? GREEN : RED,
                  borderRadius: 8,
                  padding: '6px 16px',
                  fontWeight: 700,
                  fontSize: 14,
                  letterSpacing: '0.04em',
                }}
              >
                {isSuccess ? 'PAID' : 'UNPAID'}
              </span>
            </div>

            <div style={{ padding: 32 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                <div>
                  <span style={{ fontStyle: 'italic', fontWeight: 700, fontSize: 28, color: BRAND }}>
                    Super Visa
                  </span>
                  <span style={{ marginLeft: 6, color: BRAND, fontSize: 22 }}>→</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: '#888',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                    }}
                  >
                    INVOICE
                  </p>
                  <p style={{ margin: '6px 0 0', fontWeight: 700, fontSize: 16, color: '#111' }}>
                    {invoiceNo}
                  </p>
                </div>
              </div>

              <div style={{ height: 1, background: '#eee', marginBottom: 24 }} />

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 24,
                  marginBottom: 28,
                }}
              >
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: 12, color: '#888' }}>Bill To:</p>
                  <p style={{ margin: '0 0 16px', fontWeight: 700, fontSize: 16, color: '#111' }}>
                    {name}
                  </p>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#888' }}>Application Date:</p>
                  <p style={{ margin: '0 0 12px', fontSize: 14, color: '#333' }}>{date}</p>
                  <p style={{ margin: '0 0 6px', fontSize: 12, color: '#888' }}>Visa Destination:</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img
                      src={flagUrl(countryCode, 40)}
                      alt=""
                      width={20}
                      height={14}
                      style={{ borderRadius: 2, objectFit: 'cover' }}
                    />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{country}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#888' }}>Invoice No:</p>
                  <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14 }}>{invoiceNo}</p>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#888' }}>Invoice Date:</p>
                  <p style={{ margin: '0 0 12px', fontSize: 14 }}>{date}</p>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#888' }}>Due Date:</p>
                  <p style={{ margin: '0 0 12px', fontSize: 14 }}>{date}</p>
                  <p style={{ margin: '0 0 6px', fontSize: 12, color: '#888' }}>Status:</p>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      background: isSuccess ? '#dcfce7' : '#fee2e2',
                      color: isSuccess ? GREEN : RED,
                    }}
                  >
                    {isSuccess ? 'PAID' : 'UNPAID'}
                  </span>
                </div>
              </div>

              <div
                style={{
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: '1px solid #eee',
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 0.6fr 1fr 1fr',
                    gap: 8,
                    padding: '12px 16px',
                    background: '#f8f8f8',
                    fontSize: 11,
                    color: '#888',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  <span>Description</span>
                  <span style={{ textAlign: 'center' }}>Qty</span>
                  <span style={{ textAlign: 'right' }}>Unit Price</span>
                  <span style={{ textAlign: 'right' }}>Amount</span>
                </div>
                <TableRow
                  description={`Government Fee (${country} ${option})`}
                  qty={String(travelers)}
                  unit={`AED ${govFee}`}
                  amount={`AED ${govTotal}`}
                />
                <TableRow
                  description="Super Visa Processing Fee"
                  qty={String(travelers)}
                  unit={`AED ${processingFee}`}
                  amount={`AED ${processingTotal}`}
                />
                {discount > 0 && (
                  <TableRow
                    description="5% Multi-traveler Discount"
                    qty="—"
                    unit="—"
                    amount={`-AED ${discount}`}
                    amountColor={RED}
                  />
                )}
              </div>

              <div style={{ textAlign: 'right', marginBottom: 8 }}>
                <p style={{ margin: '0 0 6px', color: '#666', fontSize: 14 }}>Subtotal: AED {subtotal}</p>
                <p style={{ margin: '0 0 12px', color: '#666', fontSize: 14 }}>VAT (5%): AED {vat}</p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 700,
                    color: isSuccess ? GREEN : RED,
                  }}
                >
                  {isSuccess ? 'Total Paid' : 'Total Due'}: AED {grandTotal}
                </p>
              </div>

              <div
                style={{
                  background: '#f0f4ff',
                  borderRadius: 12,
                  padding: 16,
                  marginTop: 16,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                }}
              >
                <ShieldIcon />
                <div>
                  <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 14, color: '#111' }}>
                    Super Protect — Included
                  </p>
                  <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
                    If Visa Delayed: No Super Visa Fee | If Rejected: 100% Refund
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <p style={{ margin: '0 0 8px', color: '#888', fontSize: 13 }}>Thank you for choosing Super Visa</p>
            <button
              type="button"
              className="no-print"
              onClick={() => window.open('https://wa.me/971559641020', '_blank')}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: '#666',
                marginBottom: 12,
              }}
            >
              <WhatsAppIcon />
              Questions? Contact us on WhatsApp: +971 559641020
            </button>
            <p style={{ margin: '0 0 24px', color: BRAND, fontSize: 14, fontWeight: 600 }}>supervisa.com</p>

            <div
              className="no-print"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 12,
              }}
            >
              {isSuccess ? (
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    border: 'none',
                    borderRadius: 40,
                    background: BRAND,
                    color: '#fff',
                    padding: '14px 32px',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Download Invoice PDF
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  style={{
                    border: 'none',
                    borderRadius: 40,
                    background: ACCENT,
                    color: '#fff',
                    padding: '14px 32px',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Try Payment Again
                </button>
              )}
              <Link
                to="/"
                className="no-print"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '14px 28px',
                  borderRadius: 40,
                  border: '1px solid #ddd',
                  background: '#fff',
                  color: '#333',
                  textDecoration: 'none',
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
