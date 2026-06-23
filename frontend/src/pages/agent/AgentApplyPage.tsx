import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PassportUploadSection, usePassportScanState } from '../../components/PassportUploadSection'
import { AgentPageShell, FlagImage } from '../../components/agent/AgentUI'
import { AgentLayout } from '../../components/AgentLayout'
import { AGENT_BASE_PATH } from '../../config/portalRoutes'
import { countries, getCountry } from '../../data/countries'
import { Database } from '../../database/db'
import { useDatabaseListener } from '../../hooks/useDatabase'
import {
  AGENT_ACCENT,
  AGENT_CARD,
  AGENT_EARN_BG,
  AGENT_EARN_TEXT,
  AGENT_ERROR,
  AGENT_MUTED,
  AGENT_PRIMARY,
} from '../../theme/agentTheme'
import { getAgentPartnerId, parseFeeAed } from '../../utils/agentSession'
import { checkEvisaSupport } from '../../utils/evisaSupport'
import { notifyAdminB2BApplication } from '../../utils/adminNotifications'
import { readFileAsDataUrl } from '../../utils/applicationDocuments'
import { buildPassportAutoFill } from '../../utils/passportOcrHelpers'
import { getPreferredOcrEngine, isOcrAutoFillEnabled, scanPassportDocument } from '../../utils/scanPassportDocument'

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
  width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box',
}

type AgentUploadEntry = { fileName: string; fileData?: string; mimeType?: string }

const DOC_SLOTS = ['Passport copy', 'Passport photo', 'Bank statement', 'Emirates ID']
const PASSPORT_COPY_SLOT = 'Passport copy'

function AutoFilledBadge() {
  return (
    <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: '#16a34a', background: '#f0fff4', borderRadius: 4, padding: '1px 6px' }}>
      Auto-filled
    </span>
  )
}

function DestinationPicker({ rate, onSelect }: { rate: number; onSelect: (slug: string) => void }) {
  const [query, setQuery] = useState('')
  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return countries
      .filter((c) => c.visaOptions.length > 0)
      .filter((c) => !q || c.name.toLowerCase().includes(q))
  }, [query])

  return (
    <div>
      <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: AGENT_PRIMARY }}>Select Destination</h1>
      <p style={{ margin: '0 0 20px', color: AGENT_MUTED, fontSize: 14 }}>Choose a country to start a new B2B visa application</p>
      <input
        placeholder="Search countries..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ ...inputStyle, maxWidth: 400, marginBottom: 24 }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {list.map((country) => {
          const opt = country.visaOptions[0]
          const gov = parseFeeAed(opt.fee)
          const proc = parseFeeAed(opt.processingFee)
          const cost = gov + proc
          const commission = Math.round(gov * (rate / 100))
          const sellPrice = cost + commission
          return (
            <button
              key={country.slug}
              type="button"
              onClick={() => onSelect(country.slug)}
              style={{
                background: AGENT_CARD,
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                padding: 20,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = AGENT_ACCENT
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(37,99,235,0.12)'
                e.currentTarget.style.transform = 'translateY(-4px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <FlagImage countryCode={country.countryCode} countryName={country.name} />
                <span style={{ fontWeight: 700, color: AGENT_PRIMARY }}>{country.name}</span>
              </div>
              <div style={{ fontSize: 11, color: AGENT_MUTED }}>B2B Price</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: AGENT_PRIMARY, marginBottom: 8 }}>AED {sellPrice}</div>
              <div style={{ background: AGENT_EARN_BG, borderRadius: 8, padding: '6px 10px' }}>
                <span style={{ color: AGENT_EARN_TEXT, fontWeight: 700, fontSize: 13 }}>You earn: AED {commission}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function AgentApplyPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const destSlug = searchParams.get('destination')
  const visaOptionLabel = searchParams.get('option') ?? ''
  const country = destSlug ? getCountry(destSlug) : undefined
  const partnerId = getAgentPartnerId() ?? ''
  const dbVersion = useDatabaseListener()
  const partner = useMemo(() => Database.getPartnerById(partnerId), [partnerId, dbVersion])
  const rate = Number(partner?.commissionRate ?? 15)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  const [step, setStep] = useState(1)
  const [customers, setCustomers] = useState<CustomerForm[]>([emptyCustomer()])
  const [uploads, setUploads] = useState<Record<string, AgentUploadEntry>>({})
  const [payMethod, setPayMethod] = useState<'wallet' | 'bank' | 'card'>('wallet')
  const [submitted, setSubmitted] = useState<{ appId: string } | null>(null)
  const [error, setError] = useState('')
  const scan = usePassportScanState()

  const storeUploadFile = useCallback((slot: string, file: File) => {
    setUploads((prev) => ({
      ...prev,
      [slot]: { fileName: file.name },
    }))
    void readFileAsDataUrl(file).then(({ fileData, mimeType }) => {
      setUploads((prev) => ({
        ...prev,
        [slot]: { fileName: file.name, fileData, mimeType },
      }))
    })
  }, [])

  const attachPassportUpload = useCallback((file: File) => {
    storeUploadFile(PASSPORT_COPY_SLOT, file)
  }, [storeUploadFile])

  const handlePassportUpload = useCallback(async (file: File, customerIndex: number) => {
    if (!file) return
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!allowed.includes(file.type)) {
      window.alert('Only JPG, PNG or PDF files allowed')
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      window.alert('File must be less than 15MB')
      return
    }

    attachPassportUpload(file)

    const previewUrl = URL.createObjectURL(file)
    scan.setPreviewUrls((prev) => ({ ...prev, [customerIndex]: previewUrl }))
    scan.setPreviewIsPdf((prev) => ({ ...prev, [customerIndex]: file.type === 'application/pdf' }))
    scan.setIsScanning((prev) => ({ ...prev, [customerIndex]: true }))
    scan.setScanProgress((prev) => ({ ...prev, [customerIndex]: 0 }))
    scan.setScanResult((prev) => ({ ...prev, [customerIndex]: null }))

    try {
      const engine = getPreferredOcrEngine()
      const data = await scanPassportDocument(file, (progress) => {
        scan.setScanProgress((prev) => ({ ...prev, [customerIndex]: progress }))
      })

      const shouldAutoFill = engine ? isOcrAutoFillEnabled(engine) : false
      const { fields, filledKeys, displayData } = buildPassportAutoFill(data, shouldAutoFill)

      setCustomers((prev) =>
        prev.map((c, i) => (i === customerIndex ? { ...c, ...fields } : c)),
      )
      scan.setScannedDataByIndex((prev) => ({ ...prev, [customerIndex]: displayData }))
      scan.setAutoFilledFields((prev) => ({ ...prev, [customerIndex]: filledKeys }))
      scan.setScanResult((prev) => ({ ...prev, [customerIndex]: 'success' }))
    } catch (err: unknown) {
      console.error('Scan error:', err)
      const message = err instanceof Error ? err.message : ''
      attachPassportUpload(file)
      if (message === 'PDF_NOT_SUPPORTED') {
        scan.setScanResult((prev) => ({ ...prev, [customerIndex]: 'pdf' }))
      } else if (message === 'OCR_DISABLED') {
        scan.setScanResult((prev) => ({ ...prev, [customerIndex]: 'failed' }))
        window.alert('Passport scanning is disabled. Enable an OCR engine in Admin → Settings → OCR.')
      } else if (message.includes('API key missing') || message === 'PASSPORT_OCR_API_KEY_MISSING') {
        scan.setScanResult((prev) => ({ ...prev, [customerIndex]: 'failed' }))
        window.alert(
          'Passport OCR API is enabled but no API key is configured. Add your key in Admin → Settings → OCR or set PASSPORT_OCR_API_KEY in .env.',
        )
      } else {
        scan.setScanResult((prev) => ({ ...prev, [customerIndex]: 'failed' }))
      }
    } finally {
      scan.setIsScanning((prev) => ({ ...prev, [customerIndex]: false }))
    }
  }, [attachPassportUpload, scan])

  const isAutoFilled = (index: number, field: string) =>
    (scan.autoFilledFields[index] ?? []).includes(field)

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

  const wallet = useMemo(
    () => Database.getPartnerWalletBalance(partnerId),
    [partnerId, dbVersion],
  )
  const walletSufficient = wallet >= (pricing?.cost ?? 0)
  const walletShortfall = Math.max(0, (pricing?.cost ?? 0) - wallet)

  const openWalletTopUp = () => {
    const text = `Hi Superjet Global, I need to top up my partner wallet. My company: ${String(partner?.companyName ?? '')}. Current balance: AED ${wallet}`
    window.open(`https://wa.me/971559641020?text=${encodeURIComponent(text)}`, '_blank')
  }
  const docsComplete = DOC_SLOTS.every((d) => Boolean(uploads[d]?.fileName))
  const progress = step === 1 ? 33 : step === 2 ? 66 : 100

  const updateCustomer = (idx: number, field: keyof CustomerForm, value: string) => {
    setCustomers((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)))
    scan.setAutoFilledFields((prev) => ({
      ...prev,
      [idx]: (prev[idx] ?? []).filter((f) => f !== field),
    }))
  }

  const customerName = `${customers[0].firstName} ${customers[0].lastName}`.trim()

  const handleSubmit = () => {
    if (!partner || !country || !pricing) return
    setError('')

    if (payMethod === 'wallet' && wallet < pricing.cost) {
      setError('Insufficient wallet balance. Top up or use another method.')
      return
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
      documents: Object.entries(uploads).map(([type, entry]) => ({
        id: `doc_${Date.now()}_${type.toLowerCase().replace(/\s/g, '_')}`,
        type: type.toLowerCase().replace(/\s/g, '_'),
        fileName: entry.fileName,
        fileData: entry.fileData ?? null,
        mimeType: entry.mimeType ?? 'application/octet-stream',
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
      customerName,
      destinationName: country.name,
    })

    const invoice = Database.createInvoice({
      applicationId: String(newApp.id),
      type: 'b2b',
      customerName,
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

    if (payMethod === 'wallet') {
      const result = Database.deductPartnerWallet(partnerId, pricing.cost, String(newApp.id))
      if (!result.success) {
        setError(result.error ?? 'Insufficient wallet balance.')
        return
      }
      Database.markInvoicePaid(String(invoice.id), 'wallet')
      Database.createPayment({
        invoiceId: String(invoice.id),
        applicationId: String(newApp.id),
        amount: pricing.cost,
        method: 'wallet',
        gateway: 'wallet',
        status: 'success',
      })
    } else if (paymentStatus === 'paid') {
      Database.createPayment({
        invoiceId: String(invoice.id),
        applicationId: String(newApp.id),
        amount: pricing.cost,
        method: 'card',
        gateway: 'stripe',
        status: 'success',
      })
    }

    Database.updatePartner(partnerId, {
      totalApplications: Number(partner.totalApplications ?? 0) + 1,
      totalRevenue: Number(partner.totalRevenue ?? 0) + pricing.cost,
    })

    Database.createNotification({
      userId: partnerId,
      userType: 'partner',
      title: 'Application Submitted',
      message: `Your application for ${country.name} (${customerName}) has been submitted`,
      applicationId: String(newApp.id),
    })

    Database.logActivity(
      'b2b_application_created',
      `B2B application — ${String(partner.companyName)} — ${customerName} — ${country.name}`,
      String(newApp.id),
      partnerId,
      'b2b',
    )

    notifyAdminB2BApplication({
      applicationId: String(newApp.id),
      partnerName: String(partner.companyName),
      customerName,
      destination: country.name,
      amount: pricing.cost,
      paymentStatus: paymentStatus === 'paid' ? 'paid' : 'pending',
      paymentMethod: payMethod === 'wallet' ? 'Wallet' : payMethod === 'bank' ? 'Bank Transfer' : 'Card',
    })

    setSubmitted({ appId: String(newApp.id) })
  }

  if (!partner && !loading) {
    return (
      <AgentLayout>
        <p>Invalid session.</p>
        <Link to={AGENT_BASE_PATH} style={{ color: AGENT_ACCENT }}>← Dashboard</Link>
      </AgentLayout>
    )
  }

  if (submitted) {
    return (
      <AgentLayout>
        <div style={{ maxWidth: 520, margin: '40px auto', background: AGENT_CARD, borderRadius: 20, padding: 40, textAlign: 'center', boxShadow: '0 4px 24px rgba(37,99,235,0.08)', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
          <h2 style={{ margin: '0 0 8px', color: '#166534' }}>Application Submitted!</h2>
          <p style={{ color: AGENT_MUTED, fontSize: 14, lineHeight: 1.6 }}>Your customer&apos;s application has been sent to our operations team for review.</p>
          <p style={{ fontWeight: 600, marginTop: 16, color: AGENT_PRIMARY }}>Application ID: {submitted.appId}</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => navigate(`${AGENT_BASE_PATH}/applications/${submitted.appId}`)} style={{ background: AGENT_ACCENT, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 700, cursor: 'pointer' }}>View Application</button>
            <button type="button" onClick={() => navigate(`${AGENT_BASE_PATH}/apply`)} style={{ background: '#fff', color: AGENT_ACCENT, border: `1px solid ${AGENT_ACCENT}`, borderRadius: 12, padding: '12px 24px', fontWeight: 600, cursor: 'pointer' }}>Submit Another</button>
          </div>
        </div>
      </AgentLayout>
    )
  }

  if (!destSlug) {
    return (
      <AgentLayout>
        <AgentPageShell loading={loading}>
          <Link to={AGENT_BASE_PATH} style={{ color: AGENT_ACCENT, textDecoration: 'none', fontSize: 14, marginBottom: 16, display: 'inline-block' }}>← Dashboard</Link>
          <DestinationPicker rate={rate} onSelect={(slug) => setSearchParams({ destination: slug })} />
        </AgentPageShell>
      </AgentLayout>
    )
  }

  if (!country || !pricing) {
    return (
      <AgentLayout>
        <p>Destination not found.</p>
        <Link to={`${AGENT_BASE_PATH}/apply`} style={{ color: AGENT_ACCENT }}>← Select destination</Link>
      </AgentLayout>
    )
  }

  return (
    <AgentLayout>
      <AgentPageShell loading={loading}>
        <Link to={`${AGENT_BASE_PATH}/apply`} style={{ color: AGENT_ACCENT, textDecoration: 'none', fontSize: 14, marginBottom: 16, display: 'inline-block' }}>← Change destination</Link>

        <div style={{ height: 6, background: '#e2e8f0', borderRadius: 40, marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: AGENT_ACCENT, borderRadius: 40, transition: 'width 0.3s' }} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {['Customer Details', 'Documents', 'Payment'].map((label, i) => (
            <span key={label} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: step === i + 1 ? AGENT_ACCENT : '#fff', color: step === i + 1 ? '#fff' : AGENT_MUTED, border: '1px solid #e2e8f0' }}>{i + 1}. {label}</span>
          ))}
        </div>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, padding: 14, marginBottom: 16, color: AGENT_ERROR, fontSize: 13 }}>{error}</div>}

        {step === 1 && (
          <div style={{ background: AGENT_CARD, borderRadius: 20, padding: 28, maxWidth: 640, boxShadow: '0 2px 12px rgba(37,99,235,0.06)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 20, color: AGENT_PRIMARY }}>Who are you applying for?</h2>
            <p style={{ margin: '0 0 20px', color: AGENT_MUTED, fontSize: 13 }}>Enter your customer&apos;s details</p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: 12, background: '#f8fafc', borderRadius: 12 }}>
              <FlagImage countryCode={country.countryCode} countryName={country.name} width={32} height={22} />
              <span style={{ fontWeight: 600, color: AGENT_PRIMARY }}>{country.name}</span>
              <span style={{ color: AGENT_MUTED, fontSize: 13 }}>· {pricing.opt.label}</span>
            </div>

            {customers.map((c, idx) => (
              <div key={idx} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: idx < customers.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                {customers.length > 1 && <div style={{ fontWeight: 600, marginBottom: 12 }}>Customer {idx + 1}</div>}

                <PassportUploadSection
                  accentColor={AGENT_ACCENT}
                  isScanning={Boolean(scan.isScanning[idx])}
                  scanProgress={scan.scanProgress[idx] ?? 0}
                  scanResult={scan.scanResult[idx] ?? null}
                  scannedData={scan.scannedDataByIndex[idx] ?? null}
                  previewUrl={scan.previewUrls[idx] ?? null}
                  isPdf={Boolean(scan.previewIsPdf[idx])}
                  onUpload={(file) => handlePassportUpload(file, idx)}
                  onRescan={() => {
                    scan.resetScanState(idx)
                    setUploads((prev) => {
                      const next = { ...prev }
                      delete next[PASSPORT_COPY_SLOT]
                      return next
                    })
                  }}
                  onTryAgain={() => scan.resetScanState(idx)}
                  onFillManually={() => scan.setScanResult((prev) => ({ ...prev, [idx]: null }))}
                />

                {[['firstName', 'First Name'], ['lastName', 'Last Name'], ['email', 'Email'], ['phone', 'Phone'], ['nationality', 'Nationality'], ['passportNumber', 'Passport Number'], ['dateOfBirth', 'Date of Birth'], ['passportExpiry', 'Passport Expiry']].map(([field, label]) => (
                  <div key={field} style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 13, color: AGENT_MUTED, marginBottom: 4 }}>
                      {label}
                      {isAutoFilled(idx, field) && <AutoFilledBadge />}
                    </label>
                    <input
                      value={c[field as keyof CustomerForm]}
                      onChange={(e) => updateCustomer(idx, field as keyof CustomerForm, e.target.value)}
                      style={{
                        ...inputStyle,
                        borderColor: isAutoFilled(idx, field) ? '#bbf7d0' : '#e2e8f0',
                        background: isAutoFilled(idx, field) ? '#f0fff4' : '#fff',
                      }}
                    />
                  </div>
                ))}
              </div>
            ))}

            <button type="button" onClick={() => setCustomers((prev) => [...prev, emptyCustomer()])} style={{ border: 'none', background: 'none', color: AGENT_ACCENT, fontWeight: 600, fontSize: 13, cursor: 'pointer', marginBottom: 20 }}>+ Add Another Customer</button>

            <button type="button" disabled={!customers[0].firstName || !customers[0].email} onClick={() => setStep(2)} style={{ background: AGENT_ACCENT, color: '#fff', border: 'none', borderRadius: 12, padding: '14px 28px', fontWeight: 700, cursor: 'pointer', opacity: customers[0].firstName && customers[0].email ? 1 : 0.5 }}>Continue →</button>
          </div>
        )}

        {step === 2 && (
          <div style={{ background: AGENT_CARD, borderRadius: 20, padding: 28, maxWidth: 640, boxShadow: '0 2px 12px rgba(37,99,235,0.06)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 20, color: AGENT_PRIMARY }}>Upload customer documents</h2>
            <p style={{ margin: '0 0 20px', color: AGENT_MUTED, fontSize: 13 }}>Upload required documents for {country.name}</p>
            {DOC_SLOTS.map((slot) => (
              <div key={slot} style={{ marginBottom: 14, padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>{slot}</div>
                {slot === PASSPORT_COPY_SLOT && uploads[slot]?.fileName ? (
                  <div style={{ fontSize: 12, color: '#166534' }}>
                    ✓ {uploads[slot].fileName} — uploaded from passport scan
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) storeUploadFile(slot, f)
                      }}
                    />
                    {uploads[slot]?.fileName && (
                      <div style={{ marginTop: 6, fontSize: 12, color: '#166534' }}>✓ {uploads[slot].fileName}</div>
                    )}
                  </>
                )}
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setStep(1)} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 20px', cursor: 'pointer' }}>← Back</button>
              <button type="button" onClick={() => setStep(3)} style={{ background: AGENT_ACCENT, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontWeight: 700, cursor: 'pointer' }}>Continue to Payment →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ background: AGENT_CARD, borderRadius: 20, padding: 28, maxWidth: 520, boxShadow: '0 2px 12px rgba(37,99,235,0.06)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 20, color: AGENT_PRIMARY }}>Payment</h2>
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 20, fontSize: 14 }}>
              <div style={{ fontWeight: 600 }}>{customerName} · {country.name}</div>
              <div style={{ color: AGENT_MUTED, marginTop: 4 }}>{pricing.opt.label}</div>
              <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Your Cost</span><span>AED {pricing.cost}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534' }}><span>You Earn</span><span>AED {pricing.commission}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18, color: AGENT_PRIMARY, marginTop: 12 }}><span>You Pay</span><span>AED {pricing.cost}</span></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <button
                type="button"
                disabled={!walletSufficient}
                onClick={() => walletSufficient && setPayMethod('wallet')}
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: payMethod === 'wallet' ? '2px solid #22c55e' : '1px solid #e2e8f0',
                  background: walletSufficient ? (payMethod === 'wallet' ? '#f0fff4' : '#fff') : '#f5f5f5',
                  cursor: walletSufficient ? 'pointer' : 'not-allowed',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 15, color: AGENT_PRIMARY }}>💰 Pay from Wallet</div>
                <div style={{ fontSize: 13, color: '#166534', marginTop: 6 }}>Current Balance: AED {wallet.toLocaleString()}</div>
                {walletSufficient ? (
                  <div style={{ fontSize: 12, color: AGENT_MUTED, marginTop: 4 }}>After payment: AED {(wallet - pricing.cost).toLocaleString()}</div>
                ) : (
                  <>
                    <div style={{ fontSize: 13, color: AGENT_ERROR, marginTop: 8, fontWeight: 600 }}>⚠ Insufficient Balance</div>
                    <div style={{ fontSize: 12, color: AGENT_MUTED }}>You need AED {walletShortfall.toLocaleString()} more</div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); openWalletTopUp() }} style={{ marginTop: 8, border: 'none', background: 'none', color: AGENT_ACCENT, fontWeight: 600, fontSize: 12, cursor: 'pointer', padding: 0 }}>
                      Request Top-up →
                    </button>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setPayMethod('card')}
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: payMethod === 'card' ? `2px solid ${AGENT_ACCENT}` : '1px solid #e2e8f0',
                  background: payMethod === 'card' ? '#eff6ff' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 15, color: AGENT_PRIMARY }}>💳 Pay by Card (Stripe)</div>
                <div style={{ fontSize: 12, color: AGENT_MUTED, marginTop: 4 }}>Pay AED {pricing.cost.toLocaleString()} securely via Stripe</div>
              </button>

              <button
                type="button"
                onClick={() => setPayMethod('bank')}
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: payMethod === 'bank' ? `2px solid ${AGENT_ACCENT}` : '1px solid #e2e8f0',
                  background: payMethod === 'bank' ? '#eff6ff' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 15, color: AGENT_PRIMARY }}>🏦 Bank Transfer</div>
                <div style={{ fontSize: 12, color: AGENT_MUTED, marginTop: 4 }}>Creates unpaid invoice — transfer to our account</div>
              </button>
            </div>

            {payMethod === 'bank' && (
              <p style={{ fontSize: 12, color: AGENT_MUTED, marginBottom: 12, background: '#f8fafc', padding: 12, borderRadius: 10 }}>
                IBAN: AE07 0331 2345 6789 0123 456 · Ref: invoice on submit
              </p>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setStep(2)} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 20px', cursor: 'pointer' }}>← Back</button>
              <button type="button" onClick={handleSubmit} disabled={payMethod === 'wallet' && !walletSufficient} style={{ flex: 1, background: AGENT_ACCENT, color: '#fff', border: 'none', borderRadius: 12, padding: 16, fontWeight: 700, cursor: 'pointer', opacity: payMethod === 'wallet' && !walletSufficient ? 0.5 : 1 }}>
                {payMethod === 'wallet' ? `Pay AED ${pricing.cost.toLocaleString()} from Wallet` : payMethod === 'bank' ? 'Submit & Create Invoice' : 'Submit Application'}
              </button>
            </div>
          </div>
        )}
      </AgentPageShell>
    </AgentLayout>
  )
}
