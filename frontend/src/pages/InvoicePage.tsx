import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { SiteFooter } from '../components/SiteFooter'
import { findInvoiceById, findInvoiceByNo, getEffectiveInvoiceStatus } from '../utils/adminInvoiceUtils'
import { flagUrl } from '../utils/flags'

const BRAND = '#f93e42'
const ACCENT = '#5057ea'
const RED = '#ef4444'

const CONFETTI_COLORS = ['#f93e42', '#5057ea', '#ffd700', '#22c55e', '#ff6b6b', '#4ecdc4']

function DisclaimerIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0, marginTop: 2 }}>
      <circle cx="12" cy="12" r="10" stroke="#888" strokeWidth="1.5" />
      <path d="M12 8v5M12 16h.01" stroke="#888" strokeWidth="1.5" strokeLinecap="round" />
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

function DownloadIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3v12M12 15l-4-4M12 15l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function InvoiceDownloadButton({ invoiceNo }: { invoiceNo: string }) {
  const handleDownload = () => {
    const prevTitle = document.title
    document.title = `Invoice-${invoiceNo}`
    window.print()
    window.setTimeout(() => {
      document.title = prevTitle
    }, 500)
  }

  return (
    <button
      type="button"
      className="invoice-download-btn no-print"
      aria-label="Download invoice"
      title="Download"
      onClick={handleDownload}
    >
      <DownloadIcon />
      <span className="invoice-download-tooltip">Download</span>
    </button>
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

function statusBannerClass(status: string): string {
  if (status === 'PAID') return 'invoice-status-banner--paid'
  if (status === 'REFUNDED') return 'invoice-status-banner--refunded'
  if (status === 'OVERDUE') return 'invoice-status-banner--overdue'
  if (status === 'FAILED') return 'invoice-status-banner--failed'
  return 'invoice-status-banner--pending'
}

function statusBadgeClass(status: string): string {
  if (status === 'PAID') return 'invoice-status-badge--paid'
  if (status === 'REFUNDED') return 'invoice-status-badge--refunded'
  if (status === 'OVERDUE') return 'invoice-status-badge--overdue'
  if (status === 'FAILED') return 'invoice-status-badge--failed'
  return 'invoice-status-badge--pending'
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
    <div className="invoice-table-row">
      <span className="invoice-table-desc">{description}</span>
      <span className="invoice-table-qty">{qty}</span>
      <span className="invoice-table-unit">{unit}</span>
      <span className="invoice-table-amount" style={{ color: amountColor }}>{amount}</span>
    </div>
  )
}

export default function InvoicePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showConfetti, setShowConfetti] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  const invoiceIdParam = searchParams.get('invoiceId')
  const invoiceNoParam = searchParams.get('no') ?? searchParams.get('invoiceNo')
  const storedInvoice =
    (invoiceIdParam ? findInvoiceById(invoiceIdParam) : undefined)
    ?? (invoiceNoParam ? findInvoiceByNo(invoiceNoParam) : undefined)
  const effectiveStatus = storedInvoice
    ? getEffectiveInvoiceStatus(storedInvoice)
    : null

  const statusParam = searchParams.get('status')?.toLowerCase()
  const displayStatus = effectiveStatus
    ?? (statusParam === 'paid' || statusParam === 'success' ? 'PAID'
      : statusParam === 'refunded' ? 'REFUNDED'
        : statusParam === 'overdue' ? 'OVERDUE'
          : statusParam === 'failed' ? 'FAILED'
            : statusParam === 'unpaid' ? 'UNPAID'
              : 'PAID')

  const isPaid = displayStatus === 'PAID'
  const isRefunded = displayStatus === 'REFUNDED'
  const isFailed = displayStatus === 'FAILED'
  const isOverdue = displayStatus === 'OVERDUE'
  const isSuccess = isPaid

  const name = searchParams.get('name') ?? storedInvoice?.customer ?? 'Guest Traveler'
  const amount = Number.parseInt(searchParams.get('amount') ?? String(storedInvoice?.amount ?? 0), 10)
  const country = searchParams.get('country') ?? storedInvoice?.destination ?? '—'
  const option = searchParams.get('option') ?? 'Visa'
  const invoiceNo = storedInvoice?.invoiceNo ?? invoiceNoParam ?? `ATL${Date.now().toString().slice(-8)}`
  const date = searchParams.get('date') ?? storedInvoice?.date ?? new Date().toLocaleDateString('en-GB')
  const dueDate = searchParams.get('dueDate') ?? storedInvoice?.dueDate ?? date
  const travelers = Number.parseInt(searchParams.get('travelers') ?? '1', 10)
  const govFee = Number.parseInt(searchParams.get('govFee') ?? String(storedInvoice?.govFee ?? 0), 10)
  const processingFee = Number.parseInt(searchParams.get('processingFee') ?? String(storedInvoice?.processingFee ?? 99), 10)
  const discount = Number.parseInt(searchParams.get('discount') ?? '0', 10)
  const countryCode = searchParams.get('countryCode') ?? storedInvoice?.countryCode ?? 'ae'
  const paymentMethod = searchParams.get('paymentMethod') ?? storedInvoice?.paymentMethod ?? 'Card'
  const applicationId = searchParams.get('applicationId') ?? ''
  const subtotalParam = searchParams.get('subtotal')

  const govTotal = govFee * travelers
  const processingTotal = processingFee * travelers
  const subtotal =
    subtotalParam != null
      ? Number.parseInt(subtotalParam, 10)
      : govTotal + processingTotal - discount
  const vat = Math.round(subtotal * 0.05)
  const grandTotal = amount > 0 ? amount : subtotal + vat
  const bannerMod = statusBannerClass(displayStatus === 'FAILED' ? 'FAILED' : displayStatus)
  const badgeMod = statusBadgeClass(displayStatus === 'FAILED' ? 'FAILED' : displayStatus)
  const pillMod = bannerMod.replace('invoice-status-banner', 'invoice-pill')

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

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

        .invoice-table-row {
          display: grid;
          grid-template-columns: 2fr 0.6fr 1fr 1fr;
          gap: 8px;
          padding: 14px 16px;
          border-bottom: 1px solid #f5f5f5;
          font-size: 14px;
          align-items: center;
        }
        .invoice-table-desc { color: #333; }
        .invoice-table-qty { color: #666; text-align: center; }
        .invoice-table-unit { color: #666; text-align: right; }
        .invoice-table-amount { color: #111; font-weight: 600; text-align: right; }

        .invoice-status-banner--paid { background: linear-gradient(135deg, #22c55e, #16a34a); }
        .invoice-status-banner--refunded { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
        .invoice-status-banner--overdue { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .invoice-status-banner--failed { background: linear-gradient(135deg, #ef4444, #dc2626); }
        .invoice-status-banner--pending { background: linear-gradient(135deg, #ef4444, #dc2626); }

        .invoice-status-badge--paid { color: #22c55e; }
        .invoice-status-badge--refunded { color: #8b5cf6; }
        .invoice-status-badge--overdue { color: #d97706; }
        .invoice-status-badge--failed { color: #ef4444; }
        .invoice-status-badge--pending { color: #ef4444; }

        .invoice-pill--paid { background: #dcfce7; color: #16a34a; }
        .invoice-pill--refunded { background: #ede9fe; color: #7c3aed; }
        .invoice-pill--overdue { background: #fef3c7; color: #d97706; }
        .invoice-pill--failed { background: #fee2e2; color: #dc2626; }
        .invoice-pill--pending { background: #fee2e2; color: #dc2626; }

        .invoice-total--success { color: #22c55e; }
        .invoice-total--due { color: #ef4444; }

        .invoice-flag-code {
          display: none;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          padding: 2px 6px;
          border: 1px solid #ccc;
          border-radius: 3px;
          color: #444;
        }

        .invoice-print-footer {
          display: none;
        }

        @page {
          size: A4 portrait;
          margin: 12mm 14mm;
        }

        @media print {
          html, body, #root {
            width: 210mm !important;
            min-height: auto !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .no-print {
            display: none !important;
          }

          .invoice-print-shell {
            min-height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #fff !important;
          }

          .invoice-print-container {
            max-width: none !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .invoice-page-wrap {
            display: block !important;
          }

          .invoice-card {
            width: 100% !important;
            max-width: 182mm !important;
            margin: 0 auto !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            border: 1px solid #d4d4d4 !important;
            overflow: visible !important;
            page-break-inside: avoid;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .invoice-status-banner {
            padding: 14px 20px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .invoice-status-banner--paid { background: #16a34a !important; }
          .invoice-status-banner--refunded { background: #6d28d9 !important; }
          .invoice-status-banner--overdue { background: #d97706 !important; }
          .invoice-status-banner--failed { background: #dc2626 !important; }
          .invoice-status-banner--pending { background: #dc2626 !important; }

          .invoice-status-banner__title {
            color: #fff !important;
            font-size: 16px !important;
          }

          .invoice-status-badge {
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .invoice-body {
            padding: 20px 22px !important;
          }

          .invoice-brand {
            color: #f93e42 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .invoice-meta-grid {
            gap: 16px !important;
            margin-bottom: 18px !important;
          }

          .invoice-line-items {
            border: 1px solid #ddd !important;
            page-break-inside: avoid;
          }

          .invoice-line-items__head {
            background: #f0f0f0 !important;
            color: #555 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .invoice-table-row {
            border-bottom-color: #e8e8e8 !important;
            padding: 10px 14px !important;
            font-size: 12px !important;
          }

          .invoice-totals {
            font-size: 13px !important;
          }

          .invoice-total-line {
            font-size: 18px !important;
          }

          .invoice-total--success { color: #16a34a !important; }
          .invoice-total--due { color: #dc2626 !important; }

          .invoice-disclaimer {
            background: #f5f5f5 !important;
            border: 1px solid #ddd !important;
            padding: 12px 14px !important;
            margin-top: 14px !important;
            page-break-inside: avoid;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .invoice-pill {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .invoice-pill--paid { background: #dcfce7 !important; color: #16a34a !important; }
          .invoice-pill--refunded { background: #ede9fe !important; color: #7c3aed !important; }
          .invoice-pill--overdue { background: #fef3c7 !important; color: #d97706 !important; }
          .invoice-pill--failed { background: #fee2e2 !important; color: #dc2626 !important; }
          .invoice-pill--pending { background: #fee2e2 !important; color: #dc2626 !important; }

          .invoice-flag-img { display: none !important; }
          .invoice-flag-code { display: inline-block !important; }

          .invoice-print-footer {
            display: block !important;
            margin-top: 18px;
            padding-top: 12px;
            border-top: 1px solid #ccc;
            text-align: center;
            font-size: 10px;
            color: #666;
            line-height: 1.5;
          }
          .invoice-print-footer strong {
            color: #333;
          }
        }

        .invoice-page-wrap {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .invoice-download-btn {
          position: relative;
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          margin-top: 8px;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          background: #fff;
          color: #444;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .invoice-download-btn:hover {
          background: #f8f9ff;
          color: ${ACCENT};
          border-color: #c7d2fe;
          box-shadow: 0 4px 12px rgba(80,87,234,0.15);
        }
        .invoice-download-tooltip {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          background: #1a1a1a;
          color: #fff;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 10px;
          border-radius: 8px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transform: translateY(-4px);
          transition: opacity 0.15s ease, transform 0.15s ease;
        }
        .invoice-download-tooltip::before {
          content: '';
          position: absolute;
          bottom: 100%;
          right: 14px;
          border: 5px solid transparent;
          border-bottom-color: #1a1a1a;
        }
        .invoice-download-btn:hover .invoice-download-tooltip,
        .invoice-download-btn:focus-visible .invoice-download-tooltip {
          opacity: 1;
          transform: translateY(0);
        }
        @media (max-width: 768px) {
          .invoice-page-wrap {
            flex-direction: column-reverse;
            align-items: stretch;
          }
          .invoice-download-btn {
            align-self: flex-end;
            margin-top: 0;
            margin-bottom: 4px;
          }
        }
      `}</style>

      {showConfetti && <ConfettiLayer />}

      <div className="invoice-print-shell no-print-target" style={{ minHeight: '100vh', background: '#f5f5f5', padding: '40px 20px' }}>
        <div className="invoice-print-container" style={{ maxWidth: 680, margin: '0 auto' }}>
          <div className="invoice-page-wrap">
          <div
            className="invoice-card"
            style={{
              background: '#fff',
              borderRadius: 20,
              boxShadow: '0 4px 40px rgba(0,0,0,0.10)',
              overflow: 'hidden',
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              className={`invoice-status-banner ${bannerMod}`}
              style={{
                padding: '20px 32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <p className="invoice-status-banner__title" style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 18 }}>
                {isPaid ? '✓ PAYMENT SUCCESSFUL' : isRefunded ? '↩ PAYMENT REFUNDED' : isOverdue ? '⚠ PAYMENT OVERDUE' : isFailed ? '✕ PAYMENT FAILED' : '⏱ PAYMENT PENDING'}
              </p>
              <span
                className={`invoice-status-badge ${badgeMod}`}
                style={{
                  background: '#fff',
                  borderRadius: 8,
                  padding: '6px 16px',
                  fontWeight: 700,
                  fontSize: 14,
                  letterSpacing: '0.04em',
                }}
              >
                {displayStatus === 'FAILED' ? 'FAILED' : displayStatus}
              </span>
            </div>

            <div className="invoice-body" style={{ padding: 32 }}>
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
                  <span className="invoice-brand" style={{ fontStyle: 'italic', fontWeight: 700, fontSize: 28, color: BRAND }}>
                    Superjet Global
                  </span>
                  <span className="invoice-brand" style={{ marginLeft: 6, color: BRAND, fontSize: 22 }}>→</span>
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
                className="invoice-meta-grid"
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
                      className="invoice-flag-img"
                      src={flagUrl(countryCode, 40)}
                      alt=""
                      width={20}
                      height={14}
                      style={{ borderRadius: 2, objectFit: 'cover' }}
                    />
                    <span className="invoice-flag-code">{countryCode.toUpperCase()}</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{country}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#888' }}>Invoice No:</p>
                  <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14 }}>{invoiceNo}</p>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#888' }}>Invoice Date:</p>
                  <p style={{ margin: '0 0 12px', fontSize: 14 }}>{date}</p>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#888' }}>Due Date:</p>
                  <p style={{ margin: '0 0 12px', fontSize: 14 }}>{dueDate}</p>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#888' }}>Payment Method:</p>
                  <p style={{ margin: '0 0 12px', fontSize: 14 }}>{paymentMethod}</p>
                  <p style={{ margin: '0 0 6px', fontSize: 12, color: '#888' }}>Status:</p>
                  <span
                    className={`invoice-pill ${pillMod}`}
                    style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {displayStatus === 'FAILED' ? 'FAILED' : displayStatus}
                  </span>
                </div>
              </div>

              <div
                className="invoice-line-items"
                style={{
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: '1px solid #eee',
                  marginBottom: 20,
                }}
              >
                <div
                  className="invoice-line-items__head"
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
                  description="Superjet Global Processing Fee"
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

              <div className="invoice-totals" style={{ textAlign: 'right', marginBottom: 8 }}>
                <p style={{ margin: '0 0 6px', color: '#666', fontSize: 14 }}>Subtotal: AED {subtotal}</p>
                <p style={{ margin: '0 0 12px', color: '#666', fontSize: 14 }}>VAT (5%): AED {vat}</p>
                <p
                  className={`invoice-total-line ${isSuccess ? 'invoice-total--success' : 'invoice-total--due'}`}
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 700,
                  }}
                >
                  {isPaid ? 'Total Paid' : 'Total Due'}: AED {grandTotal}
                </p>
              </div>

              <div
                className="invoice-disclaimer"
                style={{
                  background: '#f8f9fa',
                  border: '1px solid #eee',
                  borderRadius: 12,
                  padding: 16,
                  marginTop: 16,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                }}
              >
                <DisclaimerIcon />
                <div>
                  <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 13, color: '#555', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Disclaimer
                  </p>
                  <p style={{ margin: 0, fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                    This invoice is for visa application assistance and processing services. Visa approval
                    remains at the sole discretion of the embassy or immigration authority. Government fees
                    may be non-refundable once submitted, per issuing authority rules. Processing times are
                    estimates only and are not guaranteed. Services may be facilitated through third-party
                    visa providers; their terms and conditions apply.
                  </p>
                </div>
              </div>

              <div className="invoice-print-footer">
                <strong>Superjet Global</strong> · superjetglobal.com · inquiry@superjetgroup.com · +971 559641020
                <br />
                Tax Invoice · {invoiceNo} · Generated {date}
              </div>
            </div>
          </div>
          <InvoiceDownloadButton invoiceNo={invoiceNo} />
          </div>

          <div className="no-print" style={{ textAlign: 'center', marginTop: 28 }}>
            <p style={{ margin: '0 0 8px', color: '#888', fontSize: 13 }}>Thank you for choosing Superjet Global</p>
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
            <p style={{ margin: '0 0 24px', color: BRAND, fontSize: 14, fontWeight: 600 }}>superjetglobal.com</p>

            <div
              className="no-print"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 12,
              }}
            >
              {isPaid && applicationId && (
                <Link
                  to={`/user/me/applications/${applicationId}`}
                  className="no-print"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '14px 28px',
                    borderRadius: 40,
                    border: 'none',
                    background: ACCENT,
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  View My Application
                </Link>
              )}
              {!isPaid && paymentMethod === 'Bank Transfer' && applicationId ? (
                <Link
                  to={`/user/me/applications/${applicationId}`}
                  className="no-print"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '14px 28px',
                    borderRadius: 40,
                    border: 'none',
                    background: ACCENT,
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  View Application Status
                </Link>
              ) : !isPaid ? (
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
              ) : null}
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
      <div className="no-print">
        <SiteFooter isMobile={isMobile} />
      </div>
    </>
  )
}
