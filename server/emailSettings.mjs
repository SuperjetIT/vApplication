import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SETTINGS_PATH = path.join(__dirname, 'email-settings.json')

const MASK = '••••••••'

const defaults = () => ({
  smtp: {
    enabled: true,
    host: 'smtp.gmail.com',
    port: 587,
    user: '',
    pass: '',
    fromName: 'Superjet Visa',
    fromEmail: 'no-reply@superjetglobal.com',
    replyTo: 'inquiry@superjetgroup.com',
  },
  resend: {
    enabled: false,
    apiKey: '',
    fromEmail: 'no-reply@superjetglobal.com',
    fromName: 'Superjet Visa',
  },
  sendgrid: {
    enabled: false,
    apiKey: '',
    fromEmail: 'no-reply@superjetglobal.com',
    fromName: 'Superjet Visa',
  },
})

function mergeProvider(current, updates) {
  const next = { ...current, ...updates }
  if (updates?.pass === MASK) {
    next.pass = current.pass
  }
  if (updates?.apiKey === MASK) {
    next.apiKey = current.apiKey
  }
  return next
}

export function loadEmailSettings() {
  const base = defaults()
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      const raw = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'))
      return {
        smtp: { ...base.smtp, ...(raw.smtp ?? {}) },
        resend: { ...base.resend, ...(raw.resend ?? {}) },
        sendgrid: { ...base.sendgrid, ...(raw.sendgrid ?? {}) },
      }
    }
  } catch (err) {
    console.warn('[email-settings] Could not read settings file', err)
  }

  if (process.env.SMTP_USER) {
    base.smtp.user = process.env.SMTP_USER
    base.smtp.pass = String(process.env.SMTP_PASS ?? '').replace(/\s/g, '')
    base.smtp.host = process.env.SMTP_HOST || base.smtp.host
    base.smtp.port = Number(process.env.SMTP_PORT) || base.smtp.port
    base.smtp.fromName = process.env.SMTP_FROM_NAME || base.smtp.fromName
    base.smtp.fromEmail = process.env.SMTP_FROM_EMAIL || base.smtp.fromEmail
    base.smtp.replyTo = process.env.SMTP_REPLY_TO || base.smtp.replyTo
    try {
      fs.writeFileSync(SETTINGS_PATH, JSON.stringify(base, null, 2))
    } catch {
      /* ignore */
    }
  }

  return base
}

export function saveEmailSettings(updates = {}) {
  const current = loadEmailSettings()
  const next = {
    smtp: updates.smtp ? mergeProvider(current.smtp, updates.smtp) : current.smtp,
    resend: updates.resend ? mergeProvider(current.resend, updates.resend) : current.resend,
    sendgrid: updates.sendgrid ? mergeProvider(current.sendgrid, updates.sendgrid) : current.sendgrid,
  }
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(next, null, 2))
  return next
}

export function maskSecret(value) {
  return value ? MASK : ''
}

export function getResolvedSmtpConfig() {
  const saved = loadEmailSettings().smtp
  const enabled = saved.enabled !== false
  const user = String(process.env.SMTP_USER || saved.user || '').trim()
  const pass = String(process.env.SMTP_PASS || saved.pass || '').replace(/\s/g, '')
  return {
    enabled,
    host: process.env.SMTP_HOST || saved.host || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || saved.port) || 587,
    user,
    pass,
    fromName: process.env.SMTP_FROM_NAME || saved.fromName || 'Superjet Visa',
    fromEmail: process.env.SMTP_FROM_EMAIL || saved.fromEmail || 'no-reply@superjetglobal.com',
    replyTo: process.env.SMTP_REPLY_TO || saved.replyTo || 'inquiry@superjetgroup.com',
    envOverride: Boolean(process.env.SMTP_USER || process.env.SMTP_PASS),
  }
}

export function getActiveEmailProvider() {
  const settings = loadEmailSettings()
  if (settings.resend?.enabled && settings.resend.apiKey) return 'resend'
  if (settings.sendgrid?.enabled && settings.sendgrid.apiKey) return 'sendgrid'
  if (settings.smtp?.enabled !== false && getResolvedSmtpConfig().user && getResolvedSmtpConfig().pass) {
    return 'smtp'
  }
  return 'none'
}

export function toAdminPayload(settings) {
  const smtp = getResolvedSmtpConfig()
  return {
    ok: true,
    activeProvider: getActiveEmailProvider(),
    smtp: {
      ...settings.smtp,
      pass: maskSecret(settings.smtp.pass),
      configured: Boolean(smtp.user && smtp.pass),
      envOverride: smtp.envOverride,
    },
    resend: {
      ...settings.resend,
      apiKey: maskSecret(settings.resend.apiKey),
    },
    sendgrid: {
      ...settings.sendgrid,
      apiKey: maskSecret(settings.sendgrid.apiKey),
    },
  }
}
