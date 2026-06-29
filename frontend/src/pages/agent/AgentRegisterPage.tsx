import { useMemo, useState, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AGENT_LOGIN_PATH } from '../../config/portalRoutes'
import { BRAND, BORDER, DANGER, inputStyle, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from '../../components/admin/adminTheme'
import { AGENT_ACCENT, AGENT_GRADIENTS } from '../../theme/agentTheme'
import { PhoneCountryCodePicker } from '../../components/PhoneCountryCodePicker'
import { Database } from '../../database/db'
import { notifyAdminNewPartner } from '../../utils/adminNotifications'
import {
  isValidEmail,
  isValidPhoneDigits,
  normalizeEmail,
  sanitizeEmailInput,
  sanitizePhoneDigits,
} from '../../utils/formValidation'
import {
  formatFullPhone,
  getDialCodeByCountryCode,
  getPhonePlaceholder,
} from '../../utils/phoneDialCodes'
import { registerPartnerOnServer } from '../../utils/partnerSync'

const WHATSAPP_URL = 'https://wa.me/971559641020'

const fieldLabel: CSSProperties = {
  display: 'block',
  fontSize: 13,
  color: TEXT_MUTED,
  marginBottom: 6,
  fontWeight: 500,
}

const fieldInput: CSSProperties = {
  ...inputStyle,
  width: '100%',
  marginTop: 0,
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p style={{ margin: '6px 0 0', fontSize: 12, color: DANGER }}>{message}</p>
}

export default function AgentRegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phoneCountryCode: 'ae',
    phone: '',
    tradeLicence: '',
    countries: [] as string[],
  })
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitHover, setSubmitHover] = useState(false)

  const emailNormalized = normalizeEmail(form.email)
  const dialCode = getDialCodeByCountryCode(form.phoneCountryCode)

  const fieldErrors = useMemo(() => {
    const errs: Record<string, string> = {}
    if (touched.companyName && !form.companyName.trim()) errs.companyName = 'Company name is required.'
    if (touched.contactPerson && !form.contactPerson.trim()) errs.contactPerson = 'Contact person is required.'
    if (touched.email) {
      if (!emailNormalized) errs.email = 'Business email is required.'
      else if (!isValidEmail(form.email)) errs.email = 'Enter a valid email address.'
    }
    if (touched.phone) {
      if (!form.phone.trim()) errs.phone = 'Phone number is required.'
      else if (!isValidPhoneDigits(form.phone)) errs.phone = 'Enter a valid phone number (6–15 digits).'
    }
    return errs
  }, [touched, form, emailNormalized])

  const touch = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }))

  const validateAll = (): string | null => {
    if (!form.companyName.trim()) return 'Please enter your company name.'
    if (!form.contactPerson.trim()) return 'Please enter the contact person name.'
    if (!emailNormalized) return 'Please enter your business email.'
    if (!isValidEmail(form.email)) return 'Enter a valid email address.'
    if (!form.phone.trim()) return 'Please enter your phone number.'
    if (!isValidPhoneDigits(form.phone)) return 'Enter a valid phone number (6–15 digits).'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setTouched({
      companyName: true,
      contactPerson: true,
      email: true,
      phone: true,
    })

    const validationError = validateAll()
    if (validationError) {
      setError(validationError)
      return
    }

    const email = emailNormalized
    if (Database.getPartners().some((p) => String(p.email).toLowerCase() === email)) {
      setError('A partner with this email already exists.')
      return
    }

    const fullPhone = formatFullPhone(dialCode, form.phone)

    setSubmitting(true)
    const result = await registerPartnerOnServer({
      companyName: form.companyName.trim(),
      contactPerson: form.contactPerson.trim(),
      email,
      phone: fullPhone,
      tradeLicence: form.tradeLicence.trim(),
      countriesSold: form.countries,
      password: '',
    })
    setSubmitting(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    const partner = result.partner

    notifyAdminNewPartner({
      partnerId: String(partner.id ?? ''),
      companyName: form.companyName.trim(),
      contactPerson: form.contactPerson.trim(),
      email,
      phone: fullPhone || undefined,
      status: 'pending',
    })
    Database.logActivity(
      'partner_registered',
      `New B2B partner registration — ${form.companyName.trim()}`,
      undefined,
      email,
      'b2b',
    )
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8f9fc 0%, #f0f4ff 50%, #fff5f5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 28, maxWidth: 440, width: '100%', padding: '40px 32px', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.08)', border: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 48, marginBottom: 16, color: '#22c55e' }}>✓</div>
          <h1 style={{ margin: '0 0 8px', fontSize: 22, color: TEXT_PRIMARY }}>Registration Submitted!</h1>
          <p style={{ margin: '0 0 12px', color: TEXT_MUTED, fontSize: 14, lineHeight: 1.6 }}>
            Your application is under review. Our team will contact you within 24 hours.
          </p>
          <p style={{ margin: '0 0 12px', color: TEXT_MUTED, fontSize: 14, lineHeight: 1.6 }}>
            You&apos;ll receive your login credentials once approved.
          </p>
          <p style={{ margin: '0 0 24px', color: TEXT_SECONDARY, fontSize: 14 }}>
            Questions? Contact us: <strong>+971 559641020</strong>
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                background: '#25D366',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: 12,
                padding: '12px 24px',
                fontWeight: 700,
              }}
            >
              WhatsApp us
            </a>
            <Link
              to={AGENT_LOGIN_PATH}
              style={{
                display: 'inline-block',
                background: BRAND,
                color: '#fff',
                textDecoration: 'none',
                borderRadius: 12,
                padding: '12px 24px',
                fontWeight: 700,
              }}
            >
              Back to login
            </Link>
            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                border: 'none',
                background: 'none',
                color: TEXT_MUTED,
                cursor: 'pointer',
                fontSize: 14,
                fontFamily: 'inherit',
                padding: '4px 8px',
              }}
            >
              ← Back to website
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8f9fc 0%, #f0f4ff 50%, #fff5f5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 28, maxWidth: 520, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.08)', border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${BRAND}, #5057ea)` }} />
        <div style={{ padding: '32px 28px' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontWeight: 800, fontSize: 20, color: TEXT_PRIMARY }}>Become a B2B Partner</div>
            <p style={{ margin: '6px 0 0', color: TEXT_MUTED, fontSize: 14 }}>Register your travel agency with Superjet Global</p>
          </div>

          {error && (
            <div style={{ background: '#fff0f0', border: '1px solid #fca5a5', borderRadius: 12, padding: 12, marginBottom: 16, fontSize: 13, color: DANGER }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: 14 }}>
              <label style={fieldLabel}>Company name *</label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                onBlur={() => touch('companyName')}
                style={{ ...fieldInput, borderColor: fieldErrors.companyName ? '#fca5a5' : inputStyle.border as string }}
                placeholder="Your agency name"
                required
              />
              <FieldError message={fieldErrors.companyName} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={fieldLabel}>Contact person *</label>
              <input
                type="text"
                value={form.contactPerson}
                onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
                onBlur={() => touch('contactPerson')}
                style={{ ...fieldInput, borderColor: fieldErrors.contactPerson ? '#fca5a5' : inputStyle.border as string }}
                placeholder="Full name"
                required
              />
              <FieldError message={fieldErrors.contactPerson} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={fieldLabel}>Business email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: sanitizeEmailInput(e.target.value) }))}
                onBlur={() => touch('email')}
                style={{ ...fieldInput, borderColor: fieldErrors.email ? '#fca5a5' : inputStyle.border as string }}
                placeholder="name@agency.com"
                autoComplete="email"
                required
              />
              <FieldError message={fieldErrors.email} />
              {form.email && isValidEmail(form.email) && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#22c55e' }}>✓ Valid email format</p>
              )}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={fieldLabel}>Phone number *</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
                <PhoneCountryCodePicker
                  value={form.phoneCountryCode}
                  onChange={(countryCode) => setForm((f) => ({ ...f, phoneCountryCode: countryCode }))}
                  onBlur={() => touch('phone')}
                  invalid={Boolean(fieldErrors.phone)}
                  inputStyle={fieldInput}
                />
                <input
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: sanitizePhoneDigits(e.target.value) }))}
                  onBlur={() => touch('phone')}
                  style={{
                    ...fieldInput,
                    flex: 1,
                    minWidth: 0,
                    borderColor: fieldErrors.phone ? '#fca5a5' : inputStyle.border as string,
                  }}
                  placeholder={getPhonePlaceholder(dialCode)}
                  required
                />
              </div>
              <FieldError message={fieldErrors.phone} />
              {form.phone && isValidPhoneDigits(form.phone) && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: TEXT_MUTED }}>
                  Full number: {formatFullPhone(dialCode, form.phone)}
                </p>
              )}
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={fieldLabel}>Trade licence no.</label>
              <input
                type="text"
                value={form.tradeLicence}
                onChange={(e) => setForm((f) => ({ ...f, tradeLicence: e.target.value }))}
                style={fieldInput}
                placeholder="Optional"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              onMouseEnter={() => setSubmitHover(true)}
              onMouseLeave={() => setSubmitHover(false)}
              style={{
                width: '100%',
                marginTop: 4,
                padding: '16px 20px',
                border: 'none',
                borderRadius: 14,
                fontWeight: 800,
                fontSize: 16,
                letterSpacing: '0.02em',
                color: '#fff',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                background: submitting
                  ? '#94a3b8'
                  : submitHover
                    ? 'linear-gradient(135deg, #e83539 0%, #2563eb 100%)'
                    : AGENT_GRADIENTS.welcomeShimmer,
                backgroundSize: '200% 200%',
                boxShadow: submitting
                  ? 'none'
                  : submitHover
                    ? '0 12px 32px rgba(37,99,235,0.35)'
                    : '0 8px 24px rgba(37,99,235,0.28)',
                transform: submitHover && !submitting ? 'translateY(-1px)' : 'none',
                transition: 'transform 0.2s, box-shadow 0.2s, background 0.2s',
                opacity: submitting ? 0.85 : 1,
              }}
            >
              {submitting ? (
                <>
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      border: '2px solid rgba(255,255,255,0.35)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'agent-reg-spin 0.7s linear infinite',
                    }}
                  />
                  Submitting application…
                </>
              ) : (
                <>
                  Submit application
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>
            <style>{`@keyframes agent-reg-spin { to { transform: rotate(360deg); } }`}</style>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: TEXT_MUTED }}>
            Already a partner?{' '}
            <button
              type="button"
              onClick={() => navigate(AGENT_LOGIN_PATH)}
              style={{
                border: 'none',
                background: 'none',
                padding: 0,
                color: AGENT_ACCENT,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                textDecoration: 'underline',
              }}
            >
              Sign in
            </button>
          </p>
          <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13 }}>
            <button type="button" onClick={() => navigate('/')} style={{ border: 'none', background: 'none', color: TEXT_MUTED, cursor: 'pointer' }}>← Back to website</button>
          </p>
        </div>
      </div>
    </div>
  )
}
