import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AgentLayout } from '../../components/AgentLayout'
import { AGENT_BASE_PATH } from '../../config/portalRoutes'
import { getCountry } from '../../data/countries'
import { Database } from '../../database/db'
import { getAgentPartnerId, getPartnerWalletBalance, parseFeeAed } from '../../utils/agentSession'
import { checkEvisaSupport } from '../../utils/evisaSupport'
import { flagUrl } from '../../utils/flags'

const BRAND = '#f93e42'

type CustomerForm = {
  firstName: string
  lastName: string
  email: string
  phone: string
  nationality: string
  passportNumber: string
  dateOfBirth: string
  passportExpiry: string
}

const emptyCustomer = (): CustomerForm => ({
  firstName: '', lastName: '', email: '', phone: '', nationality: '',
  passportNumber: '', dateOfBirth: '', passportExpiry: '',
})

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box',
}

const DOC_SLOTS = ['Passport copy', 'Passport photo', 'Bank statement', 'Emirates ID']

export default function AgentApplyPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const destSlug = searchParams.get('destination') ?? 'kenya'
  const visaOptionLabel = searchParams.get('option') ?? ''
  const country = getCountry(destSlug)
  const partnerId = getAgentPartnerId() ?? ''
  const partner = Database.getPartnerById(partnerId)
  const rate = Number(partner?.commissionRate ?? 15)

  const [step, setStep] = useState(1)
  const [customers, setCustomers] = useState<CustomerForm[]>([emptyCustomer()])
  const [uploads, setUploads] = useState<Record<string, string>>({})
  const [payMethod, setPayMethod] = useState<'wallet' | 'bank' | 'card'>('wallet')
  const [submitted, setSubmitted] = useState<{ appId: string } | null>(null)
  const [error, setError] = useState('')

  const pricing = useMemo(() => {
    if (!country) return null
    const opt = country.visaOptions.find((o) => o.label === visaOptionLabel) ?? country.visaOptions[0]
    const gov = parseFeeAed(opt.fee)
    const proc = parseFeeAed(opt.processingFee)
    const count = Math.max(customers.length, 1)
    const cost = (gov + proc) * count
    const commission = Math.round(gov * (rate / 100)) * count
    return { gov, proc, cost, commission, opt, count }
  }, [country, visaOptionLabel, rate, customers.length])

  const wallet = getPartnerWalletBalance(partnerId)
  const docsComplete = DOC_SLOTS.every((d) => uploads[d])
  const progress = step === 1 ? 33 : step === 2 ? 66 : 100

  const updateCustomer = (idx: number, field: keyof CustomerForm, value: string) => {
    setCustomers((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)))
  }

  const handleSubmit = () => {
    if (!partner || !country || !pricing) return
    setError('')

    if (payMethod === 'wallet' && wallet < pricing.cost) {
      setError('Insufficient wallet balance. Top up or use another method.')
      return
    }

    if (payMethod === 'wallet') {
      const ok = Database.deductPartnerWallet(partnerId, pricing.cost)
      if (!ok) {
        setError('Insufficient wallet balance.')
        return
      }
    }

    const travelers = customers.map((c) => ({
      firstName: c.firstName.toUpperCase(),
      lastName: c.lastName.toUpperCase(),
      dateOfBirth: c.dateOfBirth,
      passportNumber: c.passportNumber,
      passportExpiry: c.passportExpiry,
      nationality: c.nationality,
      email: c.email,
      phone: c.phone,
    }))

    const evisa = checkEvisaSupport(country.slug)
    const paymentStatus = payMethod === 'wallet' ? 'paid' : 'pending'

    const newApp = Database.createApplication({
      type: 'b2b',
      partnerId,
      userId: null,
      destination: country.slug,
      destinationName: country.name,
      visaOption: pricing.opt.label,
      travelers,
      travelDates: { departure: null, return: null },
      documents: Object.entries(uploads).map(([type, fileName]) => ({
        id: `doc_${Date.now()}_${type}`,
        type: type.toLowerCase().replace(/\s/g, '_'),
        fileName,
        status: 'pending_review',
        uploadedAt: new Date().toISOString(),
      })),
      status: docsComplete ? 'under_review' : 'pending_docs',
      evisaSupported: evisa,
      submissionMethod: evisa ? 'automated' : 'manual',
      assignedOperator: null,
      amount: { governmentFee: pricing.gov * pricing.count, processingFee: pricing.proc * pricing.count, discount: 0, total: pricing.cost },
      paymentStatus,
      paymentMethod: payMethod,
    })

    Database.createCommission({
      partnerId,
      applicationId: String(newApp.id),
      visaFee: pricing.gov * pricing.count,
      commissionRate: rate,
      commissionAmount: pricing.commission,
    })

    const invoice = Database.createInvoice({
      applicationId: String(newApp.id),
      type: 'b2b',
      customerName: `${customers[0].firstName} ${customers[0].lastName}`.trim(),
      destination: country.name,
      amount: pricing.cost,
      governmentFee: pricing.gov * pricing.count,
      processingFee: pricing.proc * pricing.count,
      total: pricing.cost,
      status: paymentStatus === 'paid' ? 'paid' : 'unpaid',
      paymentMethod: payMethod === 'wallet' ? 'wallet' : payMethod === 'bank' ? 'bank_transfer' : 'card',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      paidAt: paymentStatus === 'paid' ? new Date().toISOString() : null,
    })

    if (paymentStatus === 'paid') {
      Database.createPayment({
        invoiceId: String(invoice.id),
        applicationId: String(newApp.id),
        amount: pricing.cost,
        method: payMethod === 'wallet' ? 'wallet' : 'card',
        gateway: payMethod === 'wallet' ? 'wallet' : payMethod === 'bank' ? 'bank' : 'stripe',
        status: 'success',
      })
    }

    Database.updatePartner(partnerId, {
      totalApplications: Number(partner.totalApplications ?? 0) + 1,
      totalRevenue: Number(partner.totalRevenue ?? 0) + pricing.cost,
    })

    Database.logActivity(
      'b2b_application_created',
      `B2B application — ${String(partner.companyName)} — ${customers[0].firstName} ${customers[0].lastName} — ${country.name}`,
      String(newApp.id),
      partnerId,
      'b2b',
    )

    setSubmitted({ appId: String(newApp.id) })
  }

  if (!partner || !country || !pricing) {
    return (
      <AgentLayout>
        <p>Invalid session or destination.</p>
        <Link to={AGENT_BASE_PATH} style={{ color: BRAND }}>← Dashboard</Link>
      </AgentLayout>
    )
  }

  if (submitted) {
    return (
      <AgentLayout>
        <div style={{ maxWidth: 520, margin: '40px auto', background: '#fff', borderRadius: 20, padding: 40, textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
          <h2 style={{ margin: '0 0 8px', color: '#166534' }}>Application Submitted!</h2>
          <p style={{ color: '#666', fontSize: 14, lineHeight: 1.6 }}>Your customer&apos;s application has been sent to our operations team for review.</p>
          <p style={{ fontWeight: 600, marginTop: 16 }}>Application ID: {submitted.appId}</p>
          <p style={{ fontSize: 13, color: '#888' }}>Track status anytime in My Applications</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => navigate(`${AGENT_BASE_PATH}/applications/${submitted.appId}`)} style={{ background: BRAND, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 700, cursor: 'pointer' }}>View Application</button>
            <button type="button" onClick={() => navigate(AGENT_BASE_PATH)} style={{ background: '#fff', color: BRAND, border: `1px solid ${BRAND}`, borderRadius: 12, padding: '12px 24px', fontWeight: 600, cursor: 'pointer' }}>Submit Another</button>
          </div>
        </div>
      </AgentLayout>
    )
  }

  return (
    <AgentLayout>
      <Link to={AGENT_BASE_PATH} style={{ color: BRAND, textDecoration: 'none', fontSize: 14, marginBottom: 16, display: 'inline-block' }}>← Back</Link>

      <div style={{ height: 6, background: '#eee', borderRadius: 40, marginBottom: 24, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: BRAND, borderRadius: 40, transition: 'width 0.3s' }} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {['Customer Details', 'Documents', 'Payment'].map((label, i) => (
          <span key={label} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: step === i + 1 ? BRAND : '#fff', color: step === i + 1 ? '#fff' : '#888', border: '1px solid #eee' }}>{i + 1}. {label}</span>
        ))}
      </div>

      {error && <div style={{ background: '#fff0f0', border: '1px solid #fca5a5', borderRadius: 12, padding: 14, marginBottom: 16, color: BRAND, fontSize: 13 }}>{error}</div>}

      {step === 1 && (
        <div style={{ background: '#fff', borderRadius: 20, padding: 28, maxWidth: 640, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>Who are you applying for?</h2>
          <p style={{ margin: '0 0 20px', color: '#888', fontSize: 13 }}>Enter your customer&apos;s details</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: 12, background: '#f8f9fc', borderRadius: 12 }}>
            <img src={flagUrl(country.countryCode, 32)} alt="" width={32} height={22} />
            <span style={{ fontWeight: 600 }}>{country.name}</span>
            <span style={{ color: '#888', fontSize: 13 }}>· {pricing.opt.label}</span>
          </div>

          {customers.map((c, idx) => (
            <div key={idx} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: idx < customers.length - 1 ? '1px solid #eee' : 'none' }}>
              {customers.length > 1 && <div style={{ fontWeight: 600, marginBottom: 12 }}>Customer {idx + 1}</div>}
              {[['firstName', 'First Name'], ['lastName', 'Last Name'], ['email', 'Email'], ['phone', 'Phone'], ['nationality', 'Nationality'], ['passportNumber', 'Passport Number'], ['dateOfBirth', 'Date of Birth'], ['passportExpiry', 'Passport Expiry']].map(([field, label]) => (
                <div key={field} style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 4 }}>{label}</label>
                  <input value={c[field as keyof CustomerForm]} onChange={(e) => updateCustomer(idx, field as keyof CustomerForm, e.target.value)} style={inputStyle} />
                </div>
              ))}
            </div>
          ))}

          <button type="button" onClick={() => setCustomers((prev) => [...prev, emptyCustomer()])} style={{ border: 'none', background: 'none', color: BRAND, fontWeight: 600, fontSize: 13, cursor: 'pointer', marginBottom: 20 }}>+ Add Another Customer</button>

          <button type="button" disabled={!customers[0].firstName || !customers[0].email} onClick={() => setStep(2)} style={{ background: BRAND, color: '#fff', border: 'none', borderRadius: 12, padding: '14px 28px', fontWeight: 700, cursor: 'pointer', opacity: customers[0].firstName && customers[0].email ? 1 : 0.5 }}>Continue →</button>
        </div>
      )}

      {step === 2 && (
        <div style={{ background: '#fff', borderRadius: 20, padding: 28, maxWidth: 640, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>Upload customer documents</h2>
          <p style={{ margin: '0 0 20px', color: '#888', fontSize: 13 }}>Upload required documents for {country.name}</p>
          {DOC_SLOTS.map((slot) => (
            <div key={slot} style={{ marginBottom: 14, padding: 14, background: '#f8f9fc', borderRadius: 12, border: '1px solid #eee' }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>{slot}</div>
              <input type="file" accept="image/*,.pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) setUploads((p) => ({ ...p, [slot]: f.name })) }} />
              {uploads[slot] && <div style={{ marginTop: 6, fontSize: 12, color: '#166534' }}>✓ {uploads[slot]}</div>}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setStep(1)} style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 12, padding: '12px 20px', cursor: 'pointer' }}>← Back</button>
            <button type="button" onClick={() => setStep(3)} style={{ background: BRAND, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontWeight: 700, cursor: 'pointer' }}>Continue to Payment →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ background: '#fff', borderRadius: 20, padding: 28, maxWidth: 520, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 20 }}>Payment</h2>
          <div style={{ background: '#f8f9fc', borderRadius: 12, padding: 16, marginBottom: 20, fontSize: 14 }}>
            <div style={{ fontWeight: 600 }}>{customers[0].firstName} {customers[0].lastName} · {country.name}</div>
            <div style={{ color: '#666', marginTop: 4 }}>{pricing.opt.label}</div>
            <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Your Cost</span><span>AED {pricing.cost}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534' }}><span>Your Commission</span><span>AED {pricing.commission}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18, color: BRAND, marginTop: 12 }}><span>You Pay</span><span>AED {pricing.cost}</span></div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {(['wallet', 'bank', 'card'] as const).map((m) => (
              <button key={m} type="button" onClick={() => setPayMethod(m)} style={{ padding: 14, borderRadius: 12, border: payMethod === m ? `2px solid ${BRAND}` : '1px solid #eee', background: payMethod === m ? '#fff8f8' : '#fff', cursor: 'pointer', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>
                {m === 'wallet' ? `Wallet Balance (AED ${wallet.toLocaleString()})` : m === 'bank' ? 'Bank Transfer' : 'Card via Stripe'}
              </button>
            ))}
          </div>

          {payMethod === 'wallet' && wallet < pricing.cost && (
            <p style={{ color: BRAND, fontSize: 13, marginBottom: 12 }}>Insufficient wallet balance. Top up or use another method.</p>
          )}
          {payMethod === 'bank' && (
            <p style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>IBAN: AE07 0331 2345 6789 0123 456 · Ref: invoice on submit</p>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setStep(2)} style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 12, padding: '12px 20px', cursor: 'pointer' }}>← Back</button>
            <button type="button" onClick={handleSubmit} disabled={payMethod === 'wallet' && wallet < pricing.cost} style={{ flex: 1, background: BRAND, color: '#fff', border: 'none', borderRadius: 12, padding: 16, fontWeight: 700, cursor: 'pointer', opacity: payMethod === 'wallet' && wallet < pricing.cost ? 0.5 : 1 }}>Submit Application</button>
          </div>
        </div>
      )}
    </AgentLayout>
  )
}
