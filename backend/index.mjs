import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { createRequire } from 'module'
import { deleteUserById, getUserByEmail, listUsers, recordUserSession, syncUserFromClient, upsertUser } from './users.mjs'
import {
  getActiveEmailProvider,
  getResolvedSmtpConfig,
  loadEmailSettings,
  saveEmailSettings,
  toAdminPayload,
} from './emailSettings.mjs'
import { createPartner, deletePartnerById, listPartners, authenticatePartner, updatePartner } from './partners.mjs'
import { listApplications, syncApplicationFromClient } from './applications.mjs'
import {
  EmailNotConfiguredError,
  getMailIdentity,
  isEmailConfigured,
  resetSmtpTransporter,
  sendEmail,
} from './emailSend.mjs'

const require = createRequire(import.meta.url)
const PassportOcrApi = require('passport-ocr-api').default

dotenv.config()

const PORT = Number(process.env.API_PORT) || 3001
const OTP_TTL_MS = 10 * 60 * 1000

/** @type {Map<string, { code: string; expires: number }>} */
const otpStore = new Map()

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const CONTACT_TO = process.env.CONTACT_TO || 'procurement@superjetgroup.com'

function buildContactEmailHtml({ fullName, email, phone, subject, message }) {
  const safe = (s) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Inter,Segoe UI,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <tr>
      <td style="background:linear-gradient(135deg,#f93e42,#ff6b6b);padding:24px 28px;">
        <span style="font-weight:700;font-size:20px;color:#fff;">Superjet Global — New contact message</span>
      </td>
    </tr>
    <tr>
      <td style="padding:28px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;color:#374151;">
          <tr><td style="padding:8px 0;color:#6b7280;width:100px;">Name</td><td style="padding:8px 0;font-weight:600;">${safe(fullName)}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Email</td><td style="padding:8px 0;"><a href="mailto:${safe(email)}" style="color:#f93e42;">${safe(email)}</a></td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Phone</td><td style="padding:8px 0;">${safe(phone || '—')}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Subject</td><td style="padding:8px 0;font-weight:600;">${safe(subject)}</td></tr>
        </table>
        <div style="margin-top:20px;padding:16px;background:#fafafa;border-radius:12px;border:1px solid #eee;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#6b7280;">Message</p>
          <p style="margin:0;font-size:15px;line-height:1.6;color:#111827;white-space:pre-wrap;">${safe(message)}</p>
        </div>
        <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;">Reply directly to this email to reach the customer.</p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function buildVisaCheckerEmailHtml(payload) {
  const safe = (s) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')

  const rows = [
    ['Name', payload.fullName],
    ['Email', payload.email],
    ['Phone', payload.phone || '—'],
    ['Nationality', payload.nationalityName],
    ['Residence', payload.residenceName],
    ['UAE visa type', payload.uaeVisaType],
    ['Destination', payload.destinationName],
    ['Travel purpose', payload.travelPurpose],
    ['Travel date', payload.travelDate],
    ['Traveler type', payload.travelerType],
    ['Previous rejection', payload.previousRejection === 'yes' ? 'Yes' : 'No'],
  ]

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 0;color:#6b7280;width:140px;">${safe(label)}</td><td style="padding:8px 0;font-weight:600;">${safe(value)}</td></tr>`,
    )
    .join('')

  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Inter,Segoe UI,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;">
    <tr><td style="background:linear-gradient(135deg,#f93e42,#ff6b6b);padding:24px 28px;">
      <span style="font-weight:700;font-size:20px;color:#fff;">New Visa Checker lead</span>
    </td></tr>
    <tr><td style="padding:28px;">
      <p style="margin:0 0 16px;color:#374151;font-size:15px;">A customer submitted the Visa Checker pre-check form. Review and send the checklist manually.</p>
      <table width="100%" style="font-size:15px;color:#111827;">${tableRows}</table>
    </td></tr>
  </table>
</body></html>`
}

function buildOtpEmailHtml(code) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f8ff;font-family:Inter,Segoe UI,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(249,62,66,0.12);">
    <tr>
      <td style="background:linear-gradient(135deg,#f93e42,#e83539);padding:28px 32px;">
        <span style="font-style:italic;font-weight:700;font-size:22px;color:#fff;">Superjet Global</span>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <h1 style="margin:0 0 12px;font-size:22px;color:#111827;">Your sign-in code</h1>
        <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
          Use this one-time password to continue. It expires in 10 minutes.
        </p>
        <div style="text-align:center;padding:20px;background:#fff8f8;border-radius:16px;border:1.5px solid rgba(249,62,66,0.15);">
          <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#f93e42;">${code}</span>
        </div>
        <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;">
          If you didn't request this code, you can safely ignore this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

const app = express()
app.use(cors({ origin: true }))
app.use(express.json({ limit: '20mb' }))

app.get('/api/health', (_req, res) => {
  const smtp = getResolvedSmtpConfig()
  res.json({
    ok: true,
    smtpConfigured: Boolean(smtp.user && smtp.pass),
    emailConfigured: isEmailConfigured(),
    activeEmailProvider: getActiveEmailProvider(),
  })
})

app.get('/api/partners', (_req, res) => {
  res.json({ ok: true, partners: listPartners() })
})

app.get('/api/users', (_req, res) => {
  res.json({ ok: true, users: listUsers() })
})

app.post('/api/users/sync', (req, res) => {
  try {
    const body = req.body ?? {}
    const email = String(body.email ?? '').trim().toLowerCase()
    if (!isValidEmail(email)) {
      return res.status(400).json({ ok: false, error: 'Invalid email address.' })
    }
    const { user, isNew } = syncUserFromClient(body)
    return res.json({ ok: true, user, isNew })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not sync user.'
    return res.status(400).json({ ok: false, error: message })
  }
})

app.delete('/api/users/:id', (req, res) => {
  const deleted = deleteUserById(req.params.id)
  if (!deleted) {
    return res.status(404).json({ ok: false, error: 'User not found.' })
  }
  return res.json({ ok: true })
})

app.get('/api/applications', (_req, res) => {
  res.json({ ok: true, applications: listApplications() })
})

app.post('/api/applications/sync', (req, res) => {
  try {
    const body = req.body ?? {}
    const id = String(body.id ?? '').trim()
    if (!id) {
      return res.status(400).json({ ok: false, error: 'Application id is required.' })
    }
    const { application, isNew } = syncApplicationFromClient(body)
    return res.json({ ok: true, application, isNew })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not sync application.'
    return res.status(400).json({ ok: false, error: message })
  }
})

app.post('/api/partners/login', (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'Email and password are required.' })
  }
  const result = authenticatePartner(email, password)
  if (!result.ok) {
    if (result.error === 'PENDING_APPROVAL') {
      return res.status(403).json({ ok: false, error: 'Your account is pending approval.' })
    }
    return res.status(401).json({ ok: false, error: 'Invalid credentials.' })
  }
  return res.json({ ok: true, partner: result.partner })
})

app.patch('/api/partners/:id', (req, res) => {
  try {
    const id = String(req.params.id ?? '').trim()
    const body = req.body ?? {}
    const partner = updatePartner(id, body)
    return res.json({ ok: true, partner })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not update partner.'
    if (message === 'PARTNER_NOT_FOUND') {
      return res.status(404).json({ ok: false, error: 'Partner not found.' })
    }
    return res.status(400).json({ ok: false, error: message })
  }
})

app.delete('/api/partners/:id', (req, res) => {
  const deleted = deletePartnerById(req.params.id)
  if (!deleted) {
    return res.status(404).json({ ok: false, error: 'Partner not found.' })
  }
  return res.json({ ok: true })
})

app.post('/api/partners/admin', (req, res) => {
  try {
    const body = req.body ?? {}
    const companyName = String(body.companyName ?? '').trim()
    const contactPerson = String(body.contactPerson ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')

    if (!companyName || !contactPerson || !email || !password) {
      return res.status(400).json({ ok: false, error: 'Please fill in all required fields.' })
    }

    const partner = createPartner({
      companyName,
      contactPerson,
      email,
      username: email,
      phone: String(body.phone ?? '').trim(),
      tradeLicence: String(body.tradeLicence ?? '').trim(),
      password,
      commissionRate: Number(body.commissionRate ?? 15) || 15,
      status: String(body.status ?? 'active'),
      registrationSource: 'admin',
    })

    return res.status(201).json({ ok: true, partner })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not create partner.'
    if (message === 'PARTNER_EXISTS') {
      return res.status(409).json({ ok: false, error: 'A partner with this email already exists.' })
    }
    return res.status(500).json({ ok: false, error: message })
  }
})

app.post('/api/partners/register', (req, res) => {
  try {
    const body = req.body ?? {}
    const companyName = String(body.companyName ?? '').trim()
    const contactPerson = String(body.contactPerson ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()

    if (!companyName || !contactPerson || !email) {
      return res.status(400).json({ ok: false, error: 'Please fill in all required fields.' })
    }

    const partner = createPartner({
      companyName,
      contactPerson,
      email,
      username: email,
      phone: String(body.phone ?? '').trim(),
      tradeLicence: String(body.tradeLicence ?? '').trim(),
      password: String(body.password ?? ''),
      commissionRate: 0,
      status: 'pending',
      registrationSource: 'self_service',
      registrationMethod: 'self_registered',
      countriesSold: Array.isArray(body.countriesSold) ? body.countriesSold : [],
    })

    return res.status(201).json({ ok: true, partner })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration failed'
    if (message === 'PARTNER_EXISTS') {
      return res.status(409).json({ ok: false, error: 'A partner with this email already exists.' })
    }
    console.error('Partner register error:', err)
    return res.status(500).json({ ok: false, error: 'Could not save partner registration.' })
  }
})

app.get('/api/admin/email/settings', (_req, res) => {
  const settings = loadEmailSettings()
  return res.json(toAdminPayload(settings))
})

app.put('/api/admin/email/settings', (req, res) => {
  try {
    const body = req.body ?? {}
    const saved = saveEmailSettings({
      smtp: body.smtp,
      resend: body.resend,
      sendgrid: body.sendgrid,
    })
    resetSmtpTransporter()
    return res.json(toAdminPayload(saved))
  } catch (err) {
    console.error('[admin/email/settings]', err)
    const message = err instanceof Error ? err.message : 'Could not save email settings'
    return res.status(400).json({ ok: false, error: message })
  }
})

app.post('/api/admin/email/test', async (req, res) => {
  const to = String(req.body?.to ?? '').trim().toLowerCase()
  const provider = String(req.body?.provider ?? 'auto')

  if (!isValidEmail(to)) {
    return res.status(400).json({ ok: false, error: 'Enter a valid test email address' })
  }

  try {
    const result = await sendEmail({
      to,
      provider,
      subject: 'Superjet Visa — test email',
      text: 'This is a test email from Admin → Settings → Email. Your email integration is working.',
      html: `<p>This is a test email from <strong>Admin → Settings → Email</strong>.</p><p>Your email integration is working.</p>`,
    })
    return res.json({ ok: true, provider: result.provider })
  } catch (err) {
    console.error('[admin/email/test]', err)
    const message = err instanceof Error ? err.message : 'Test email failed'
    const status = err instanceof EmailNotConfiguredError ? 503 : 500
    return res.status(status).json({ ok: false, error: message })
  }
})

app.post('/api/contact', async (req, res) => {
  const fullName = String(req.body?.fullName ?? '').trim()
  const email = String(req.body?.email ?? '')
    .trim()
    .toLowerCase()
  const phone = String(req.body?.phone ?? '').trim()
  const subject = String(req.body?.subject ?? '').trim()
  const message = String(req.body?.message ?? '').trim()

  if (!fullName) {
    return res.status(400).json({ error: 'Full name is required.' })
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' })
  }
  if (!subject) {
    return res.status(400).json({ error: 'Please select a subject.' })
  }
  if (message.length < 10) {
    return res.status(400).json({ error: 'Message must be at least 10 characters.' })
  }

  if (!isEmailConfigured()) {
    return res.status(503).json({
      error: 'Email service is not configured. Enable Resend, SendGrid, or SMTP in Admin → Settings → Email.',
    })
  }

  const mailSubject = `[Superjet Global Contact] ${subject}`

  try {
    await sendEmail({
      to: CONTACT_TO,
      replyTo: `"${fullName.replace(/"/g, '')}" <${email}>`,
      subject: mailSubject,
      text: [
        `New contact form submission`,
        ``,
        `Name: ${fullName}`,
        `Email: ${email}`,
        `Phone: ${phone || '—'}`,
        `Subject: ${subject}`,
        ``,
        message,
      ].join('\n'),
      html: buildContactEmailHtml({ fullName, email, phone, subject, message }),
    })
    return res.json({ success: true })
  } catch (err) {
    console.error('[contact]', err)
    return res.status(500).json({
      error: 'Could not send your message. Please try WhatsApp or call us directly.',
    })
  }
})

app.post('/api/visa-checker', async (req, res) => {
  const fullName = String(req.body?.fullName ?? '').trim()
  const email = String(req.body?.email ?? '')
    .trim()
    .toLowerCase()
  const phone = String(req.body?.phone ?? '').trim()
  const nationalityName = String(req.body?.nationalityName ?? '').trim()
  const residenceName = String(req.body?.residenceName ?? '').trim()
  const uaeVisaType = String(req.body?.uaeVisaType ?? '').trim()
  const destinationName = String(req.body?.destinationName ?? '').trim()
  const travelPurpose = String(req.body?.travelPurpose ?? '').trim()
  const travelDate = String(req.body?.travelDate ?? '').trim()
  const travelerType = String(req.body?.travelerType ?? '').trim()
  const previousRejection = String(req.body?.previousRejection ?? '').trim()

  if (!fullName) {
    return res.status(400).json({ error: 'Full name is required.' })
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' })
  }
  if (!nationalityName || !residenceName || !destinationName) {
    return res.status(400).json({ error: 'Please complete all required fields.' })
  }
  if (!travelDate) {
    return res.status(400).json({ error: 'Travel date is required.' })
  }

  if (!isEmailConfigured()) {
    return res.status(503).json({
      error: 'Email service is not configured. Enable Resend, SendGrid, or SMTP in Admin → Settings → Email.',
    })
  }

  const payload = {
    fullName,
    email,
    phone,
    nationalityName,
    residenceName,
    uaeVisaType,
    destinationName,
    travelPurpose,
    travelDate,
    travelerType,
    previousRejection,
  }

  try {
    await sendEmail({
      to: CONTACT_TO,
      replyTo: `"${fullName.replace(/"/g, '')}" <${email}>`,
      subject: `[Visa Checker] ${destinationName} — ${nationalityName} passport`,
      text: [
        'New Visa Checker pre-check submission',
        '',
        ...Object.entries(payload).map(([k, v]) => `${k}: ${v}`),
      ].join('\n'),
      html: buildVisaCheckerEmailHtml(payload),
    })
    return res.json({ success: true })
  } catch (err) {
    console.error('[visa-checker]', err)
    return res.status(500).json({
      error: 'Could not submit your check. Please contact us on WhatsApp.',
    })
  }
})

app.post('/api/auth/send-otp', async (req, res) => {
  const email = String(req.body?.email ?? '')
    .trim()
    .toLowerCase()

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' })
  }

  if (!isEmailConfigured()) {
    return res.status(503).json({
      error: 'Email service is not configured. Enable Resend, SendGrid, or SMTP in Admin → Settings → Email.',
    })
  }

  const code = generateOtp()
  const expires = Date.now() + OTP_TTL_MS
  otpStore.set(email, { code, expires })

  const identity = getMailIdentity()

  try {
    await sendEmail({
      to: email,
      replyTo: identity.replyTo,
      subject: `${code} is your Superjet Global sign-in code`,
      text: `Your Superjet Global verification code is ${code}. It expires in 10 minutes. If you didn't request this, ignore this email.`,
      html: buildOtpEmailHtml(code),
    })
    return res.json({ success: true })
  } catch (err) {
    console.error('[send-otp]', err)
    otpStore.delete(email)
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Could not send email. Check email settings and try again.',
    })
  }
})

app.post('/api/auth/verify-otp', (req, res) => {
  const email = String(req.body?.email ?? '')
    .trim()
    .toLowerCase()
  const code = String(req.body?.code ?? '').trim()

  if (!isValidEmail(email) || code.length !== 6) {
    return res.status(400).json({ success: false, error: 'Invalid email or code.' })
  }

  const record = otpStore.get(email)
  if (!record) {
    return res.json({ success: false, error: 'No code found. Request a new OTP.' })
  }
  if (Date.now() > record.expires) {
    otpStore.delete(email)
    return res.json({ success: false, error: 'Code expired. Request a new OTP.' })
  }
  if (record.code !== code) {
    return res.json({ success: false, error: 'Incorrect code. Try again.' })
  }

  otpStore.delete(email)
  const { user } = recordUserSession(email, { source: 'sign_in' })
  return res.json({
    success: true,
    user: {
      email: user.email,
      fullName: String(user.fullName ?? '').trim(),
      id: user.id,
      lastLogin: user.lastLogin,
      loginCount: user.loginCount,
      registrationSource: user.registrationSource,
    },
  })
})

app.get('/api/user/me', (req, res) => {
  const email = String(req.headers['x-user-email'] ?? '')
    .trim()
    .toLowerCase()

  if (!isValidEmail(email)) {
    return res.status(401).json({ error: 'Authentication required.' })
  }

  return res.json(getUserByEmail(email))
})

app.patch('/api/user/me', (req, res) => {
  const email = String(req.body?.email ?? '')
    .trim()
    .toLowerCase()
  const fullName = String(req.body?.fullName ?? '').trim()

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address.' })
  }

  if (!fullName) {
    return res.status(400).json({ error: 'Full name is required.' })
  }

  const user = upsertUser(email, fullName)
  return res.json(user)
})

function parseImageBase64(imageBase64, mimeType = 'image/jpeg') {
  let raw = String(imageBase64).trim()
  let mime = mimeType
  if (raw.startsWith('data:')) {
    const match = raw.match(/^data:([^;]+);base64,(.+)$/s)
    if (match) {
      mime = match[1]
      raw = match[2]
    }
  }
  return { buffer: Buffer.from(raw, 'base64'), mime, dataUrl: `data:${mime};base64,${raw}` }
}

async function uploadTemporaryPublicUrl(buffer, fileName, mimeType) {
  const form = new FormData()
  form.append('reqtype', 'fileupload')
  form.append('time', '1h')
  form.append('fileToUpload', new Blob([buffer], { type: mimeType }), fileName)
  const uploadRes = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
    method: 'POST',
    body: form,
  })
  const url = (await uploadRes.text()).trim()
  if (!uploadRes.ok || !url.startsWith('http')) {
    throw new Error(
      url && !url.startsWith('http')
        ? `Temporary file upload failed: ${url.slice(0, 120)}`
        : `Temporary file upload failed (${uploadRes.status})`,
    )
  }
  return url
}

app.post('/api/ocr/passport-api', async (req, res) => {
  const apiKey = String(process.env.PASSPORT_OCR_API_KEY ?? req.body?.apiKey ?? '').trim()
  const imageBase64 = String(req.body?.imageBase64 ?? '').trim()
  const fileName = String(req.body?.fileName ?? 'passport.jpg')
  const mimeType = String(req.body?.mimeType ?? 'image/jpeg')

  if (!apiKey) {
    return res.status(400).json({
      ok: false,
      error: 'Passport OCR API key missing. Add it in Admin → Settings → OCR or set PASSPORT_OCR_API_KEY in .env',
    })
  }
  if (!imageBase64) {
    return res.status(400).json({ ok: false, error: 'imageBase64 is required' })
  }

  const api = new PassportOcrApi({ apiKey, createResponseFiles: false })
  const { buffer, mime } = parseImageBase64(imageBase64, mimeType)

  try {
    // omkar.cloud only accepts publicly fetchable HTTP(S) URLs — not data: URLs.
    const publicUrl = await uploadTemporaryPublicUrl(buffer, fileName, mime)
    const data = await api.extractPassportData(publicUrl)
    return res.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const response = err && typeof err === 'object' && 'response' in err ? err.response : null
    console.error('[passport-ocr-api]', message, response)
    return res.status(502).json({
      ok: false,
      error: message || 'Passport OCR API failed',
      detail: response?.data ?? null,
    })
  }
})

app.listen(PORT, () => {
  console.log(`[superjet-global-api] http://localhost:${PORT}`)
  if (!isEmailConfigured()) {
    console.warn('[superjet-global-api] Email not configured — enable Resend, SendGrid, or SMTP in Admin → Settings → Email')
  } else {
    console.log(`[superjet-global-api] Email provider: ${getActiveEmailProvider()}`)
  }
})
