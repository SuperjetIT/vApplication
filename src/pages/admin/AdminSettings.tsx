import { useCallback, useEffect, useState } from 'react'
import { AdminLayout } from '../../components/AdminLayout'
import { AdminToast } from '../../components/admin/AdminToast'
import { AdminToggle } from '../../components/admin/AdminToggle'
import { BRAND, BRAND_BLUE, BORDER, cardStyle, hoverCardProps, inputStyle, outlineBtn, PAGE_BG, pillTab, primaryBtn, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from '../../components/admin/adminTheme'
import { Database } from '../../database/db'
import { scanPassport } from '../../utils/passportOCR'
import { scanPassportViaApi } from '../../utils/passportOcrApi'

const TABS = [
  { key: 'gateways', label: 'Payment Gateways' },
  { key: 'email', label: 'Email' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'visa', label: 'Visa APIs' },
  { key: 'ocr', label: 'OCR' },
  { key: 'security', label: 'Security' },
] as const

type IntegrationRecord = Record<string, unknown>

type SmtpSettings = {
  enabled: boolean
  host: string
  port: number
  user: string
  pass: string
  fromName: string
  fromEmail: string
  replyTo: string
  configured?: boolean
  envOverride?: boolean
}

type ApiEmailSettings = {
  ok: boolean
  activeProvider: string
  smtp: SmtpSettings
  resend: { enabled: boolean; apiKey: string; fromEmail: string; fromName: string }
  sendgrid: { enabled: boolean; apiKey: string; fromEmail: string; fromName: string }
}

const defaultSmtp = (): SmtpSettings => ({
  enabled: true,
  host: 'smtp.gmail.com',
  port: 587,
  user: '',
  pass: '',
  fromName: 'Superjet Visa',
  fromEmail: 'no-reply@superjetglobal.com',
  replyTo: 'inquiry@superjetgroup.com',
})

function readIntegration(name: string): IntegrationRecord {
  const integrations = (Database.getSettings().integrations as Record<string, IntegrationRecord> | undefined) ?? {}
  return { ...(integrations[name] ?? {}) }
}

function MaskedField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  const copy = () => {
    if (!value) return
    void navigator.clipboard.writeText(value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>{label}</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type={revealed ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button type="button" onClick={() => setRevealed((r) => !r)} style={{ background: PAGE_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 12px', cursor: 'pointer', color: TEXT_SECONDARY, fontSize: 13 }}>{revealed ? '🙈' : '👁'}</button>
        <button type="button" onClick={copy} style={{ background: PAGE_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 12px', cursor: 'pointer', color: TEXT_SECONDARY, position: 'relative', fontSize: 13 }}>
          📋
          {copied && <span style={{ position: 'absolute', top: -28, right: 0, background: '#22c55e', color: '#fff', fontSize: 11, padding: '4px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>Copied!</span>}
        </button>
      </div>
    </div>
  )
}

function GatewayCard({ name, logo, defaultOn, children, onSave }: { name: string; logo: React.ReactNode; defaultOn?: boolean; children: React.ReactNode; onSave: () => void }) {
  const [on, setOn] = useState(defaultOn ?? false)
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      style={{ ...cardStyle, padding: 24, ...hoverCardProps.style }}
      onMouseEnter={hoverCardProps.onMouseEnter}
      onMouseLeave={hoverCardProps.onMouseLeave}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: PAGE_BG, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {logo}
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: TEXT_PRIMARY }}>{name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 20,
            background: on ? '#f0fff4' : PAGE_BG,
            color: on ? '#16a34a' : TEXT_MUTED,
            border: `1px solid ${on ? '#bbf7d0' : BORDER}`,
          }}>
            {on ? '● Connected' : '○ Disconnected'}
          </span>
          <AdminToggle enabled={on} onChange={setOn} color={on ? '#22c55e' : undefined} />
        </div>
      </div>
      <button type="button" onClick={() => setExpanded((e) => !e)} style={{ ...outlineBtn, width: '100%', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {expanded ? 'Hide Settings' : 'Settings'}
        <span style={{ fontSize: 10, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
      </button>
      {expanded && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
          {children}
          <button type="button" onClick={onSave} style={{ ...primaryBtn, marginTop: 16, width: '100%' }}>Save Settings</button>
        </div>
      )}
    </div>
  )
}

export default function AdminSettings() {
  const [activeSettingsTab, setActiveSettingsTab] = useState<(typeof TABS)[number]['key']>('gateways')
  const [toast, setToast] = useState<string | null>(null)
  const [sherpaConnected, setSherpaConnected] = useState(false)
  const [twoFa, setTwoFa] = useState(false)

  const [mailchimp, setMailchimp] = useState(() => ({
    enabled: Boolean(readIntegration('mailchimp').enabled),
    apiKey: String(readIntegration('mailchimp').apiKey ?? ''),
    audienceId: String(readIntegration('mailchimp').audienceId ?? ''),
    fromEmail: String(readIntegration('mailchimp').fromEmail ?? 'no-reply@superjetglobal.com'),
  }))

  const [smtp, setSmtp] = useState<SmtpSettings>(defaultSmtp)
  const [resend, setResend] = useState({
    enabled: false,
    apiKey: '',
    fromEmail: 'no-reply@superjetglobal.com',
    fromName: 'Superjet Visa',
  })
  const [sendgrid, setSendgrid] = useState({
    enabled: false,
    apiKey: '',
    fromEmail: 'no-reply@superjetglobal.com',
    fromName: 'Superjet Visa',
  })
  const [activeEmailProvider, setActiveEmailProvider] = useState('none')
  const [emailLoading, setEmailLoading] = useState(false)
  const [testEmailTo, setTestEmailTo] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)

  const [tesseractOcr, setTesseractOcr] = useState(() => ({
    enabled: readIntegration('tesseractOcr').enabled !== false,
    autoFill: readIntegration('tesseractOcr').autoFill !== false,
  }))

  const [passportOcrApi, setPassportOcrApi] = useState(() => ({
    enabled: Boolean(readIntegration('passportOcrApi').enabled),
    apiKey: String(readIntegration('passportOcrApi').apiKey ?? ''),
    autoFill: readIntegration('passportOcrApi').autoFill !== false,
  }))

  const [mlOcr, setMlOcr] = useState(() => ({
    enabled: Boolean(readIntegration('mlOcr').enabled),
    serviceUrl: String(readIntegration('mlOcr').serviceUrl ?? 'http://localhost:3002'),
    model: String(readIntegration('mlOcr').model ?? 'microsoft/trocr-base-printed'),
    autoFill: Boolean(readIntegration('mlOcr').autoFill),
  }))

  const [mlHealth, setMlHealth] = useState<{ ok?: boolean; error?: string; torch?: string; transformers?: string; modelLoaded?: boolean } | null>(null)
  const [mlHealthLoading, setMlHealthLoading] = useState(false)
  const [ocrTestFile, setOcrTestFile] = useState<File | null>(null)
  const [ocrEngine, setOcrEngine] = useState<'passport-api' | 'tesseract' | 'ml'>('passport-api')
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrResult, setOcrResult] = useState<string | null>(null)
  const [ocrScanning, setOcrScanning] = useState(false)

  const save = () => setToast('Settings saved')

  const saveMailchimp = useCallback(() => {
    Database.updateIntegrationSettings('mailchimp', mailchimp)
    setToast('Mailchimp settings saved')
  }, [mailchimp])

  const updateMailchimp = useCallback((updates: Partial<typeof mailchimp>) => {
    setMailchimp((prev) => {
      const next = { ...prev, ...updates }
      Database.updateIntegrationSettings('mailchimp', next)
      return next
    })
    setToast('Mailchimp saved')
  }, [])

  const applyEmailPayload = useCallback((data: ApiEmailSettings) => {
    setSmtp(data.smtp)
    setResend(data.resend)
    setSendgrid(data.sendgrid)
    setActiveEmailProvider(data.activeProvider)
  }, [])

  const loadEmailSettings = useCallback(async () => {
    setEmailLoading(true)
    try {
      const res = await fetch('/api/admin/email/settings')
      const data = (await res.json()) as ApiEmailSettings
      if (!res.ok || !data.ok) throw new Error('Could not load email settings')
      applyEmailPayload(data)
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Could not load email settings')
    } finally {
      setEmailLoading(false)
    }
  }, [applyEmailPayload])

  const persistEmailSettings = useCallback(async (updates: {
    smtp?: Partial<SmtpSettings>
    resend?: Partial<typeof resend>
    sendgrid?: Partial<typeof sendgrid>
  }) => {
    setEmailSaving(true)
    try {
      const res = await fetch('/api/admin/email/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const data = (await res.json()) as ApiEmailSettings & { error?: string }
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Could not save email settings')
      applyEmailPayload(data)
      setToast('Email settings saved')
      return data
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Could not save email settings')
      throw err
    } finally {
      setEmailSaving(false)
    }
  }, [applyEmailPayload])

  const updateSmtp = useCallback((updates: Partial<SmtpSettings>) => {
    setSmtp((prev) => {
      const next = { ...prev, ...updates }
      void persistEmailSettings({ smtp: next })
      return next
    })
  }, [persistEmailSettings])

  const updateResend = useCallback((updates: Partial<typeof resend>) => {
    setResend((prev) => {
      const next = { ...prev, ...updates }
      void persistEmailSettings({ resend: next })
      return next
    })
  }, [persistEmailSettings])

  const updateSendgrid = useCallback((updates: Partial<typeof sendgrid>) => {
    setSendgrid((prev) => {
      const next = { ...prev, ...updates }
      void persistEmailSettings({ sendgrid: next })
      return next
    })
  }, [persistEmailSettings])

  const sendTestEmail = async (provider: 'smtp' | 'resend' | 'sendgrid') => {
    if (!testEmailTo.trim()) {
      setToast('Enter a test email address first')
      return
    }
    setEmailSaving(true)
    try {
      const res = await fetch('/api/admin/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmailTo.trim(), provider }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Test email failed')
      setToast(`Test email sent to ${testEmailTo.trim()}`)
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Test email failed')
    } finally {
      setEmailSaving(false)
    }
  }

  const saveOcrSettings = useCallback(() => {
    Database.updateIntegrationSettings('tesseractOcr', tesseractOcr)
    Database.updateIntegrationSettings('passportOcrApi', passportOcrApi)
    Database.updateIntegrationSettings('mlOcr', mlOcr)
    setToast('OCR settings saved')
  }, [tesseractOcr, passportOcrApi, mlOcr])

  const updatePassportOcrApi = useCallback((updates: Partial<typeof passportOcrApi>) => {
    setPassportOcrApi((prev) => {
      const next = { ...prev, ...updates }
      Database.updateIntegrationSettings('passportOcrApi', next)
      return next
    })
    setToast('Passport OCR API saved')
  }, [])

  const updateTesseractOcr = useCallback((updates: Partial<typeof tesseractOcr>) => {
    setTesseractOcr((prev) => {
      const next = { ...prev, ...updates }
      Database.updateIntegrationSettings('tesseractOcr', next)
      return next
    })
    setToast('Tesseract OCR saved')
  }, [])

  const updateMlOcr = useCallback((updates: Partial<typeof mlOcr>) => {
    setMlOcr((prev) => {
      const next = { ...prev, ...updates }
      Database.updateIntegrationSettings('mlOcr', next)
      return next
    })
    setToast('ML OCR saved')
  }, [])

  useEffect(() => {
    if (activeSettingsTab !== 'ocr') return
    setMlHealth(null)
  }, [activeSettingsTab])

  useEffect(() => {
    if (activeSettingsTab !== 'email') return
    void loadEmailSettings()
  }, [activeSettingsTab, loadEmailSettings])

  const checkMlHealth = async () => {
    setMlHealthLoading(true)
    setMlHealth(null)
    try {
      const res = await fetch('/api/ocr/ml-health')
      const data = await res.json()
      setMlHealth(data)
      if (data.ok) setToast('ML OCR service is reachable')
      else setToast(data.error ?? 'ML OCR health check failed')
    } catch {
      setMlHealth({ ok: false, error: 'Could not reach API. Run npm run dev and python server/ocr_server.py' })
    } finally {
      setMlHealthLoading(false)
    }
  }

  const activeOcrEngine = passportOcrApi.enabled
    ? 'Passport OCR API'
    : mlOcr.enabled
      ? 'ML OCR (PyTorch)'
      : tesseractOcr.enabled
        ? 'Tesseract.js'
        : 'None — passport scanning disabled on Apply page'

  const runOcrTest = async () => {
    if (!ocrTestFile) {
      setToast('Upload a passport image first')
      return
    }
    setOcrScanning(true)
    setOcrResult(null)
    setOcrProgress(0)
    try {
      if (ocrEngine === 'passport-api') {
        const data = await scanPassportViaApi(ocrTestFile, passportOcrApi.apiKey, setOcrProgress)
        setOcrResult(JSON.stringify(data, null, 2))
        setToast('Passport OCR API test complete')
      } else if (ocrEngine === 'tesseract') {
        const data = await scanPassport(ocrTestFile, setOcrProgress)
        setOcrResult(JSON.stringify(data, null, 2))
        setToast('Tesseract OCR test complete')
      } else {
        const b64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result))
          reader.onerror = reject
          reader.readAsDataURL(ocrTestFile)
        })
        setOcrProgress(30)
        const res = await fetch('/api/ocr/ml-scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: b64 }),
        })
        const data = await res.json()
        setOcrProgress(100)
        if (!res.ok || !data.ok) {
          throw new Error(data.error ?? 'ML scan failed')
        }
        setOcrResult(JSON.stringify(data, null, 2))
        setToast('ML OCR test complete')
      }
    } catch (err) {
      setOcrResult(err instanceof Error ? err.message : 'OCR test failed')
      setToast('OCR test failed — see output below')
    } finally {
      setOcrScanning(false)
    }
  }

  return (
    <AdminLayout activePath="/admin/settings" title="Settings & API Integrations">
      <AdminToast message={toast} onClose={() => setToast(null)} />

      <div className="admin-tab-bar" style={{ background: PAGE_BG, borderRadius: 40, padding: 4, display: 'inline-flex', border: `1px solid ${BORDER}`, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setActiveSettingsTab(t.key)} style={pillTab(activeSettingsTab === t.key)}>{t.label}</button>
        ))}
      </div>

      {activeSettingsTab === 'gateways' && (
        <div className="admin-grid-3">
          <GatewayCard name="Stripe" onSave={save} logo={<span style={{ fontWeight: 800, color: '#635bff', fontSize: 14 }}>stripe</span>}>
            <MaskedField label="Publishable Key" value="" onChange={() => {}} placeholder="pk_test_..." />
            <MaskedField label="Secret Key" value="" onChange={() => {}} />
            <MaskedField label="Webhook Secret" value="" onChange={() => {}} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: TEXT_SECONDARY }}><input type="checkbox" /> Test Mode</label>
          </GatewayCard>
          <GatewayCard name="PayPal" onSave={save} logo={<span style={{ fontWeight: 800, color: '#003087', fontSize: 13 }}>PayPal</span>}>
            <MaskedField label="Client ID" value="" onChange={() => {}} />
            <MaskedField label="Secret" value="" onChange={() => {}} />
          </GatewayCard>
          <GatewayCard name="Bank Transfer" defaultOn onSave={save} logo={<span style={{ fontSize: 20 }}>🏦</span>}>
            <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>Bank Name</label>
            <input defaultValue="Emirates NBD" style={{ ...inputStyle, width: '100%', marginBottom: 12 }} />
            <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>IBAN</label>
            <input defaultValue="AE07 0351 2345 6789 0123 456" style={{ ...inputStyle, width: '100%', marginBottom: 12 }} />
            <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>Account Name</label>
            <input defaultValue="Superjet Global FZE" style={{ ...inputStyle, width: '100%', marginBottom: 12 }} />
            <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>Swift Code</label>
            <input defaultValue="EBILAEAD" style={{ ...inputStyle, width: '100%' }} />
          </GatewayCard>
          <GatewayCard name="Telr" onSave={save} logo={<span style={{ fontWeight: 700, color: '#00a651', fontSize: 13 }}>Telr</span>}>
            <MaskedField label="Store ID" value="" onChange={() => {}} placeholder="•••••" />
            <MaskedField label="Auth Key" value="" onChange={() => {}} />
          </GatewayCard>
          <GatewayCard name="Network International" onSave={save} logo={<span style={{ fontWeight: 600, fontSize: 11, color: TEXT_PRIMARY }}>NI UAE</span>}>
            <MaskedField label="Outlet ID" value="" onChange={() => {}} />
            <MaskedField label="Terminal ID" value="" onChange={() => {}} />
            <MaskedField label="API Key" value="" onChange={() => {}} />
          </GatewayCard>
          <GatewayCard name="Checkout.com" onSave={save} logo={<span style={{ fontWeight: 700, fontSize: 12 }}>Checkout</span>}>
            <MaskedField label="Public Key" value="" onChange={() => {}} />
            <MaskedField label="Secret Key" value="" onChange={() => {}} />
          </GatewayCard>
          <GatewayCard name="Wallet Balance" defaultOn onSave={save} logo={<span style={{ fontSize: 20 }}>👛</span>}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 8, color: TEXT_SECONDARY }}><input type="checkbox" defaultChecked /> Enable top-up</label>
            <input defaultValue="0" placeholder="Min Balance" style={{ ...inputStyle, width: '100%', marginBottom: 8 }} />
            <input defaultValue="Full refund within 7 days" style={{ ...inputStyle, width: '100%' }} />
          </GatewayCard>
          <GatewayCard name="Pay Later" onSave={save} logo={<span style={{ fontSize: 20 }}>📅</span>}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 8, color: TEXT_SECONDARY }}><input type="checkbox" /> Enable installments</label>
            <input defaultValue="3 / 6 / 12 months" style={{ ...inputStyle, width: '100%' }} />
          </GatewayCard>
        </div>
      )}

      {activeSettingsTab === 'email' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          <div style={{ gridColumn: '1 / -1', ...cardStyle, padding: '12px 16px', background: PAGE_BG, border: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: 13, color: TEXT_SECONDARY }}>
              Active provider: <strong style={{ color: TEXT_PRIMARY }}>{activeEmailProvider === 'none' ? 'Not configured' : activeEmailProvider.toUpperCase()}</strong>
              {emailLoading ? ' · Loading…' : ''}
              {smtp.envOverride ? ' · .env overrides SMTP login (restart API after .env changes)' : ''}
            </span>
          </div>

          <div style={{ ...cardStyle, padding: 24, border: smtp.enabled ? `2px solid ${BRAND}` : cardStyle.border, gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: PAGE_BG, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📬</div>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 15, display: 'block' }}>SMTP</span>
                  <span style={{ fontSize: 12, color: TEXT_MUTED }}>OTP, contact & visa checker emails</span>
                </div>
              </div>
              <AdminToggle enabled={smtp.enabled} onChange={(enabled) => updateSmtp({ enabled })} color="#22c55e" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>SMTP Host</label>
                <input value={smtp.host} onChange={(e) => setSmtp((s) => ({ ...s, host: e.target.value }))} style={{ ...inputStyle, width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>Port</label>
                <input type="number" value={smtp.port} onChange={(e) => setSmtp((s) => ({ ...s, port: Number(e.target.value) || 587 }))} style={{ ...inputStyle, width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>SMTP User</label>
                <input value={smtp.user} onChange={(e) => setSmtp((s) => ({ ...s, user: e.target.value }))} placeholder="your-email@gmail.com" style={{ ...inputStyle, width: '100%' }} />
              </div>
              <div>
                <MaskedField label="SMTP Password" value={smtp.pass} onChange={(pass) => setSmtp((s) => ({ ...s, pass }))} placeholder="App password" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>From Email (shown to customers)</label>
                <input value={smtp.fromEmail} onChange={(e) => setSmtp((s) => ({ ...s, fromEmail: e.target.value }))} style={{ ...inputStyle, width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>From Name</label>
                <input value={smtp.fromName} onChange={(e) => setSmtp((s) => ({ ...s, fromName: e.target.value }))} style={{ ...inputStyle, width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>Reply-To</label>
                <input value={smtp.replyTo} onChange={(e) => setSmtp((s) => ({ ...s, replyTo: e.target.value }))} style={{ ...inputStyle, width: '100%' }} />
              </div>
            </div>
            {smtp.configured && (
              <p style={{ fontSize: 11, color: '#166534', margin: '12px 0 0' }}>● SMTP credentials saved — used for sign-in OTP emails</p>
            )}
            <button type="button" onClick={() => void persistEmailSettings({ smtp })} disabled={emailSaving} style={{ ...primaryBtn, width: '100%', marginTop: 16 }}>
              {emailSaving ? 'Saving…' : 'Save SMTP'}
            </button>
          </div>

          <div style={{ ...cardStyle, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: PAGE_BG, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✉</div>
                <span style={{ fontWeight: 700, fontSize: 15 }}>Resend.com</span>
              </div>
              <AdminToggle enabled={resend.enabled} onChange={(enabled) => updateResend({ enabled })} color="#22c55e" />
            </div>
            <MaskedField label="API Key" value={resend.apiKey} onChange={(apiKey) => setResend((r) => ({ ...r, apiKey }))} />
            <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>From Email</label>
            <input value={resend.fromEmail} onChange={(e) => setResend((r) => ({ ...r, fromEmail: e.target.value }))} style={{ ...inputStyle, width: '100%', marginBottom: 12 }} />
            <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>From Name</label>
            <input value={resend.fromName} onChange={(e) => setResend((r) => ({ ...r, fromName: e.target.value }))} style={{ ...inputStyle, width: '100%', marginBottom: 16 }} />
            <button type="button" onClick={() => void persistEmailSettings({ resend })} disabled={emailSaving} style={{ ...outlineBtn, width: '100%' }}>Save Resend</button>
          </div>

          <div style={{ ...cardStyle, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: PAGE_BG, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📧</div>
                <span style={{ fontWeight: 700, fontSize: 15 }}>SendGrid</span>
              </div>
              <AdminToggle enabled={sendgrid.enabled} onChange={(enabled) => updateSendgrid({ enabled })} color="#22c55e" />
            </div>
            <MaskedField label="API Key" value={sendgrid.apiKey} onChange={(apiKey) => setSendgrid((s) => ({ ...s, apiKey }))} />
            <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>From Email</label>
            <input value={sendgrid.fromEmail} onChange={(e) => setSendgrid((s) => ({ ...s, fromEmail: e.target.value }))} style={{ ...inputStyle, width: '100%', marginBottom: 12 }} />
            <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>From Name</label>
            <input value={sendgrid.fromName} onChange={(e) => setSendgrid((s) => ({ ...s, fromName: e.target.value }))} style={{ ...inputStyle, width: '100%', marginBottom: 16 }} />
            <button type="button" onClick={() => void persistEmailSettings({ sendgrid })} disabled={emailSaving} style={{ ...outlineBtn, width: '100%' }}>Save SendGrid</button>
          </div>

          <div style={{ ...cardStyle, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff5f5', border: `1px solid #fecaca`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#ffe01b' }}>M</div>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 15, display: 'block' }}>Mailchimp</span>
                  <span style={{ fontSize: 12, color: TEXT_MUTED }}>Newsletters & marketing</span>
                </div>
              </div>
              <AdminToggle enabled={mailchimp.enabled} onChange={(enabled) => updateMailchimp({ enabled })} color="#22c55e" />
            </div>
            <MaskedField label="API Key" value={mailchimp.apiKey} onChange={(apiKey) => setMailchimp((m) => ({ ...m, apiKey }))} placeholder="xxxxxxxx-us1" />
            <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>Audience / List ID</label>
            <input
              value={mailchimp.audienceId}
              onChange={(e) => setMailchimp((m) => ({ ...m, audienceId: e.target.value }))}
              placeholder="e.g. a1b2c3d4e5"
              style={{ ...inputStyle, width: '100%', marginBottom: 12 }}
            />
            <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>From Email</label>
            <input
              value={mailchimp.fromEmail}
              onChange={(e) => setMailchimp((m) => ({ ...m, fromEmail: e.target.value }))}
              style={{ ...inputStyle, width: '100%', marginBottom: 16 }}
            />
            <button type="button" onClick={saveMailchimp} style={{ ...primaryBtn, width: '100%' }}>Save Mailchimp</button>
          </div>

          <div style={{ ...cardStyle, padding: 24, gridColumn: '1 / -1' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Send test email</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <input
                type="email"
                value={testEmailTo}
                onChange={(e) => setTestEmailTo(e.target.value)}
                placeholder="you@example.com"
                style={{ ...inputStyle, minWidth: 240, flex: 1 }}
              />
              <button type="button" onClick={() => void sendTestEmail('smtp')} disabled={emailSaving} style={primaryBtn}>
                Test SMTP
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSettingsTab === 'whatsapp' && (
        <div style={{ ...cardStyle, padding: 28, maxWidth: 520 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#f0fff4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>💬</div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY }}>Meta WhatsApp Cloud API</h3>
          </div>
          <MaskedField label="Phone Number ID" value="" onChange={() => {}} placeholder="••••••••" />
          <MaskedField label="Access Token" value="" onChange={() => {}} />
          <MaskedField label="Webhook Verify Token" value="" onChange={() => {}} />
          <a href="https://wa.me/971559641020" target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 12, background: '#25d366', color: '#fff', borderRadius: 10, padding: '10px 20px', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>Send Test Message</a>
        </div>
      )}

      {activeSettingsTab === 'visa' && (
        <div className="admin-grid-3">
          <div style={{ ...cardStyle, padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Sherpa API</h3>
            <MaskedField label="API Key" value="" onChange={() => {}} />
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: TEXT_SECONDARY, fontWeight: 500 }}>Environment</span>
              <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                <label style={{ fontSize: 13, color: TEXT_SECONDARY }}><input type="radio" name="sherpa" defaultChecked /> Sandbox</label>
                <label style={{ fontSize: 13, color: TEXT_SECONDARY }}><input type="radio" name="sherpa" /> Production</label>
              </div>
            </div>
            <button type="button" onClick={() => { setSherpaConnected(true); save() }} style={{ ...primaryBtn, width: '100%' }}>Test Connection</button>
            <div style={{ marginTop: 12, fontSize: 13, fontWeight: 500, color: sherpaConnected ? '#22c55e' : TEXT_MUTED }}>{sherpaConnected ? '● Connected' : '● Not Connected'}</div>
          </div>
          <div style={{ ...cardStyle, padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Amadeus API</h3>
            <MaskedField label="Client ID" value="" onChange={() => {}} />
            <MaskedField label="Client Secret" value="" onChange={() => {}} />
            <button type="button" onClick={save} style={{ ...primaryBtn, marginTop: 8, width: '100%' }}>Test Connection</button>
          </div>
          <div style={{ ...cardStyle, padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>ipapi.co</h3>
            <div style={{ fontSize: 13, color: '#22c55e', marginBottom: 8, fontWeight: 500 }}>● Free tier active</div>
            <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 8 }}>234 / 1000 requests today</div>
            <div style={{ height: 8, background: PAGE_BG, borderRadius: 4, marginBottom: 12, border: `1px solid ${BORDER}` }}>
              <div style={{ width: '23.4%', height: '100%', background: `linear-gradient(90deg, ${BRAND}, ${BRAND_BLUE})`, borderRadius: 4 }} />
            </div>
            <a href="#" style={{ fontSize: 13, color: BRAND, fontWeight: 500, textDecoration: 'none' }}>Upgrade to Pro →</a>
          </div>
        </div>
      )}

      {activeSettingsTab === 'ocr' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          <div style={{ gridColumn: '1 / -1', ...cardStyle, padding: '12px 16px', background: PAGE_BG, border: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: 13, color: TEXT_SECONDARY }}>
              Apply page engine: <strong style={{ color: TEXT_PRIMARY }}>{activeOcrEngine}</strong>
              {' · '}
              Priority: Passport OCR API → ML OCR → Tesseract.js
            </span>
          </div>
          <div style={{ ...cardStyle, padding: 24, border: passportOcrApi.enabled ? `2px solid ${BRAND}` : cardStyle.border }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Passport OCR API</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: TEXT_MUTED }}>
                  omkar.cloud · <code>passport-ocr-api</code> · used on Apply page when enabled
                </p>
              </div>
              <AdminToggle
                enabled={passportOcrApi.enabled}
                onChange={(enabled) => updatePassportOcrApi({ enabled })}
                color="#22c55e"
              />
            </div>
            <MaskedField
              label="API Key"
              value={passportOcrApi.apiKey}
              onChange={(apiKey) => setPassportOcrApi((p) => ({ ...p, apiKey }))}
              placeholder="Your omkar.cloud API key"
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: TEXT_SECONDARY, marginBottom: 16 }}>
              <input
                type="checkbox"
                checked={passportOcrApi.autoFill}
                onChange={(e) => updatePassportOcrApi({ autoFill: e.target.checked })}
              />
              Auto-fill traveler fields after passport scan
            </label>
            <button type="button" onClick={() => { Database.updateIntegrationSettings('passportOcrApi', passportOcrApi); setToast('Passport OCR API saved') }} style={{ ...primaryBtn, width: '100%' }}>
              Save API key
            </button>
            {passportOcrApi.enabled && (
              <p style={{ fontSize: 11, color: '#166534', marginTop: 12, marginBottom: 0 }}>
                ● Active — Apply page will use this engine (requires <code>npm run dev</code> for API proxy)
              </p>
            )}
          </div>

          <div style={{ ...cardStyle, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Tesseract.js (Browser)</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: TEXT_MUTED }}>Used on Apply page today — MRZ parsing in React</p>
              </div>
              <AdminToggle
                enabled={tesseractOcr.enabled}
                onChange={(enabled) => updateTesseractOcr({ enabled })}
                color="#22c55e"
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: TEXT_SECONDARY, marginBottom: 16 }}>
              <input
                type="checkbox"
                checked={tesseractOcr.autoFill}
                onChange={(e) => updateTesseractOcr({ autoFill: e.target.checked })}
              />
              Auto-fill traveler fields after passport scan
            </label>
            <div style={{ fontSize: 12, color: TEXT_MUTED, background: PAGE_BG, borderRadius: 10, padding: 12, border: `1px solid ${BORDER}` }}>
              Package: <code>tesseract.js</code> · runs in the browser · no server required
            </div>
          </div>

          <div style={{ ...cardStyle, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>ML OCR (PyTorch)</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: TEXT_MUTED }}>Transformers TrOCR + Pillow — experimental</p>
              </div>
              <AdminToggle
                enabled={mlOcr.enabled}
                onChange={(enabled) => updateMlOcr({ enabled })}
                color="#22c55e"
              />
            </div>
            <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>Service URL</label>
            <input
              value={mlOcr.serviceUrl}
              onChange={(e) => setMlOcr((m) => ({ ...m, serviceUrl: e.target.value }))}
              style={{ ...inputStyle, width: '100%', marginBottom: 12 }}
            />
            <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>Hugging Face model</label>
            <input
              value={mlOcr.model}
              onChange={(e) => setMlOcr((m) => ({ ...m, model: e.target.value }))}
              style={{ ...inputStyle, width: '100%', marginBottom: 12 }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: TEXT_SECONDARY, marginBottom: 16 }}>
              <input
                type="checkbox"
                checked={mlOcr.autoFill}
                onChange={(e) => updateMlOcr({ autoFill: e.target.checked })}
              />
              Use ML OCR on apply flow when enabled (after testing)
            </label>
            <button type="button" onClick={checkMlHealth} disabled={mlHealthLoading} style={{ ...outlineBtn, width: '100%', marginBottom: 8 }}>
              {mlHealthLoading ? 'Checking…' : 'Test ML Service Connection'}
            </button>
            {mlHealth && (
              <pre style={{ fontSize: 11, background: PAGE_BG, padding: 12, borderRadius: 8, overflow: 'auto', margin: '8px 0 0', border: `1px solid ${BORDER}` }}>
                {JSON.stringify(mlHealth, null, 2)}
              </pre>
            )}
            <p style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 12, lineHeight: 1.5 }}>
              Install: <code>pip install -r server/requirements-ocr.txt</code><br />
              Run: <code>npm run dev:ocr</code> or <code>python server/ocr_server.py</code>
            </p>
          </div>

          <div style={{ ...cardStyle, padding: 24, gridColumn: '1 / -1' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>Test passport scan</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: TEXT_SECONDARY }}>Upload a passport image and compare Tesseract vs ML OCR output.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 16 }}>
              <select value={ocrEngine} onChange={(e) => setOcrEngine(e.target.value as 'passport-api' | 'tesseract' | 'ml')} style={{ ...inputStyle, minWidth: 200 }}>
                <option value="passport-api">Passport OCR API (omkar.cloud)</option>
                <option value="tesseract">Tesseract.js (browser)</option>
                <option value="ml">ML OCR (PyTorch server)</option>
              </select>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setOcrTestFile(e.target.files?.[0] ?? null)}
              />
              <button type="button" onClick={runOcrTest} disabled={ocrScanning} style={{ ...primaryBtn, opacity: ocrScanning ? 0.6 : 1 }}>
                {ocrScanning ? `Scanning… ${ocrProgress}%` : 'Run test scan'}
              </button>
              <button type="button" onClick={saveOcrSettings} style={outlineBtn}>Save OCR settings</button>
            </div>
            {ocrResult && (
              <pre style={{ fontSize: 12, background: '#1a1a2e', color: '#e2e8f0', padding: 16, borderRadius: 12, overflow: 'auto', maxHeight: 320, margin: 0 }}>
                {ocrResult}
              </pre>
            )}
          </div>
        </div>
      )}

      {activeSettingsTab === 'security' && (
        <div style={{ ...cardStyle, padding: 28, maxWidth: 520 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY }}>Change Admin Password</h3>
          <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>Current Password</label>
          <input type="password" style={{ ...inputStyle, width: '100%', marginBottom: 12 }} />
          <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>New Password</label>
          <input type="password" style={{ ...inputStyle, width: '100%', marginBottom: 12 }} />
          <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>Confirm Password</label>
          <input type="password" style={{ ...inputStyle, width: '100%', marginBottom: 20 }} />
          <button type="button" onClick={save} style={{ ...primaryBtn, marginBottom: 24, width: '100%' }}>Update Password</button>
          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: TEXT_PRIMARY }}>Two-Factor Authentication</div>
                <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>Require OTP on login</div>
              </div>
              <AdminToggle enabled={twoFa} onChange={setTwoFa} color="#22c55e" />
            </div>
            <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>Session Timeout</label>
            <select style={{ ...inputStyle, width: '100%', marginBottom: 16 }}>
              <option>1 hour</option><option>4 hours</option><option>8 hours</option><option>24 hours</option>
            </select>
            <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>Login Attempts Limit</label>
            <input defaultValue="5" style={{ ...inputStyle, width: '100%' }} />
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
