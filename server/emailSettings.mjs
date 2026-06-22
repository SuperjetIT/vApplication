import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SETTINGS_PATH = path.join(__dirname, 'email-settings.json')

const MASK = '••••••••'

export function isMaskedSecret(value) {
  return value === MASK || value === '••••••••'
}

function validateResendApiKey(apiKey, isUpdate = false) {
  const trimmed = String(apiKey ?? '').trim()
  if (!trimmed || isMaskedSecret(trimmed)) return trimmed
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    throw new Error('Invalid Resend API key. Paste your key from resend.com (starts with re_), not a website URL.')
  }
  if (!trimmed.startsWith('re_')) {
    throw new Error('Resend API key must start with re_')
  }
  if (trimmed.length < 20) {
    throw new Error('Resend API key looks too short. Copy the full key from your Resend dashboard.')
  }
  return trimmed
}

function applyProviderExclusivity(next, updates) {
  if (updates.resend?.enabled === true) {
    next.smtp = { ...next.smtp, enabled: false }
  }
  if (updates.smtp?.enabled === true) {
    next.resend = { ...next.resend, enabled: false }
  }
  return next
}

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
  if (updates?.pass === MASK || isMaskedSecret(updates?.pass)) {
    next.pass = current.pass
  }
  if (updates?.apiKey === MASK || isMaskedSecret(updates?.apiKey)) {
    next.apiKey = current.apiKey
  }
  return next
}

export function loadEmailSettings() {
  const base = defaults()
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      const raw = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'))
      const merged = {
        smtp: { ...base.smtp, ...(raw.smtp ?? {}) },
        resend: { ...base.resend, ...(raw.resend ?? {}) },
        sendgrid: { ...base.sendgrid, ...(raw.sendgrid ?? {}) },
      }
      const resendKey = String(merged.resend.apiKey ?? '').trim()
      if (
        resendKey
        && !isMaskedSecret(resendKey)
        && (!resendKey.startsWith('re_') || resendKey.startsWith('http'))
      ) {
        console.warn('[email-settings] Ignoring invalid Resend API key in settings file')
        merged.resend.apiKey = ''
        merged.resend.enabled = false
      }
      return merged
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
  let next = {
    smtp: updates.smtp ? mergeProvider(current.smtp, updates.smtp) : current.smtp,
    resend: updates.resend ? mergeProvider(current.resend, updates.resend) : current.resend,
    sendgrid: updates.sendgrid ? mergeProvider(current.sendgrid, updates.sendgrid) : current.sendgrid,
  }
  next = applyProviderExclusivity(next, updates)

  if (updates.resend && next.resend.apiKey && !isMaskedSecret(next.resend.apiKey)) {
    next.resend.apiKey = validateResendApiKey(next.resend.apiKey, true)
  }

  if (next.resend.enabled && !next.resend.apiKey) {
    throw new Error('Resend is enabled but no API key is saved. Add your re_ API key and save again.')
  }

  const persist = {
    smtp: {
      enabled: next.smtp.enabled !== false,
      host: next.smtp.host,
      port: next.smtp.port,
      user: next.smtp.user,
      pass: next.smtp.pass,
      fromName: next.smtp.fromName,
      fromEmail: next.smtp.fromEmail,
      replyTo: next.smtp.replyTo,
    },
    resend: {
      enabled: next.resend.enabled === true,
      apiKey: next.resend.apiKey,
      fromEmail: next.resend.fromEmail,
      fromName: next.resend.fromName,
    },
    sendgrid: {
      enabled: next.sendgrid.enabled === true,
      apiKey: next.sendgrid.apiKey,
      fromEmail: next.sendgrid.fromEmail,
      fromName: next.sendgrid.fromName,
    },
  }
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(persist, null, 2))
  return next
}

export function maskSecret(value) {
  return value ? MASK : ''
}

export function getResolvedSmtpConfig() {
  const saved = loadEmailSettings().smtp
  const enabled = saved.enabled === true
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
  if (settings.resend?.enabled === true && settings.resend.apiKey) return 'resend'
  if (settings.smtp?.enabled === true && getResolvedSmtpConfig().user && getResolvedSmtpConfig().pass) {
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
      configured: Boolean(settings.resend.apiKey),
    },
    sendgrid: {
      ...settings.sendgrid,
      apiKey: maskSecret(settings.sendgrid.apiKey),
    },
  }
}
