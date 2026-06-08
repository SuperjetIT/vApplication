import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import nodemailer from 'nodemailer'
import { getUserByEmail, upsertUser } from './users.mjs'

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
app.use(express.json())

let transporter = null

function getTransporter() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS.replace(/\s/g, ''),
      },
    })
  }
  return transporter
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    smtpConfigured: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
  })
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

  const mailer = getTransporter()
  if (!mailer) {
    return res.status(503).json({
      error:
        'Email service is not configured. Run npm run dev and add SMTP settings to .env',
    })
  }

  const from = process.env.SMTP_FROM || `"Superjet Global" <${process.env.SMTP_USER}>`
  const mailSubject = `[Superjet Global Contact] ${subject}`

  try {
    await mailer.sendMail({
      from,
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

app.post('/api/auth/send-otp', async (req, res) => {
  const email = String(req.body?.email ?? '')
    .trim()
    .toLowerCase()

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' })
  }

  const mailer = getTransporter()
  if (!mailer) {
    return res.status(503).json({
      error: 'Email service is not configured. Add SMTP settings to .env',
    })
  }

  const code = generateOtp()
  const expires = Date.now() + OTP_TTL_MS
  otpStore.set(email, { code, expires })

  const from = process.env.SMTP_FROM || `"Superjet Global" <${process.env.SMTP_USER}>`

  try {
    await mailer.sendMail({
      from,
      to: email,
      subject: `${code} is your Superjet Global sign-in code`,
      text: `Your Superjet Global verification code is ${code}. It expires in 10 minutes. If you didn't request this, ignore this email.`,
      html: buildOtpEmailHtml(code),
    })
    return res.json({ success: true })
  } catch (err) {
    console.error('[send-otp]', err)
    otpStore.delete(email)
    return res.status(500).json({
      error: 'Could not send email. Check SMTP settings and try again.',
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
  const user = getUserByEmail(email)
  return res.json({ success: true, user })
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

app.listen(PORT, () => {
  console.log(`[superjet-global-api] http://localhost:${PORT}`)
  if (!process.env.SMTP_USER) {
    console.warn('[superjet-global-api] SMTP_USER missing — copy .env.example to .env')
  }
})
