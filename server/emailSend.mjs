import nodemailer from 'nodemailer'
import {
  getActiveEmailProvider,
  getResolvedSmtpConfig,
  loadEmailSettings,
} from './emailSettings.mjs'

const DEFAULT_REPLY_TO = 'inquiry@superjetgroup.com'

let transporter = null
let transporterKey = ''

export class EmailNotConfiguredError extends Error {
  constructor() {
    super(
      'Email service is not configured. Enable Resend, SendGrid, or SMTP in Admin → Settings → Email.',
    )
    this.name = 'EmailNotConfiguredError'
  }
}

function getSmtpTransporter() {
  const smtp = getResolvedSmtpConfig()
  if (!smtp.enabled || !smtp.user || !smtp.pass) {
    return null
  }
  const key = `${smtp.host}:${smtp.port}:${smtp.user}:${smtp.pass.slice(0, 4)}`
  if (!transporter || transporterKey !== key) {
    transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: false,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    })
    transporterKey = key
  }
  return transporter
}

export function resetSmtpTransporter() {
  transporter = null
  transporterKey = ''
}

function getResolvedResendConfig() {
  const saved = loadEmailSettings().resend
  const apiKey = String(process.env.RESEND_API_KEY || saved.apiKey || '').trim()
  return {
    enabled: saved.enabled === true,
    apiKey,
    fromName: saved.fromName || 'Superjet Visa',
    fromEmail: saved.fromEmail || 'no-reply@superjetglobal.com',
  }
}

function getResolvedSendgridConfig() {
  const saved = loadEmailSettings().sendgrid
  const apiKey = String(process.env.SENDGRID_API_KEY || saved.apiKey || '').trim()
  return {
    enabled: saved.enabled === true,
    apiKey,
    fromName: saved.fromName || 'Superjet Visa',
    fromEmail: saved.fromEmail || 'no-reply@superjetglobal.com',
  }
}

export function getMailIdentity(provider = getActiveEmailProvider()) {
  if (provider === 'resend') {
    const r = getResolvedResendConfig()
    const name = r.fromName.replace(/"/g, '').trim() || 'Superjet Visa'
    const address = r.fromEmail.trim().toLowerCase()
    const from = name ? `${name} <${address}>` : address
    return { provider, name, address, from, replyTo: DEFAULT_REPLY_TO }
  }
  if (provider === 'sendgrid') {
    const s = getResolvedSendgridConfig()
    const name = s.fromName.replace(/"/g, '').trim() || 'Superjet Visa'
    const address = s.fromEmail.trim().toLowerCase()
    return { provider, name, address, from: `"${name}" <${address}>`, replyTo: DEFAULT_REPLY_TO }
  }
  const smtp = getResolvedSmtpConfig()
  const name = smtp.fromName.replace(/"/g, '').trim() || 'Superjet Visa'
  const address = smtp.fromEmail.trim().toLowerCase() || 'no-reply@superjetglobal.com'
  return {
    provider: 'smtp',
    name,
    address,
    from: `"${name}" <${address}>`,
    replyTo: smtp.replyTo.trim() || DEFAULT_REPLY_TO,
  }
}

export function isEmailConfigured() {
  return getActiveEmailProvider() !== 'none'
}

function resolveProvider(requested) {
  if (requested && requested !== 'auto') {
    if (requested === 'resend') {
      const r = getResolvedResendConfig()
      if (r.enabled && r.apiKey) return 'resend'
    }
    if (requested === 'sendgrid') {
      const s = getResolvedSendgridConfig()
      if (s.enabled && s.apiKey) return 'sendgrid'
    }
    if (requested === 'smtp' && getSmtpTransporter()) return 'smtp'
    throw new Error(`${requested.toUpperCase()} is not configured or not enabled.`)
  }
  const active = getActiveEmailProvider()
  if (active === 'none') throw new EmailNotConfiguredError()
  return active
}

async function sendViaResend({ to, subject, text, html, replyTo }) {
  const resend = getResolvedResendConfig()
  if (!resend.enabled || !resend.apiKey) {
    throw new Error('Resend is not configured. Add an API key and enable it in Admin → Settings → Email.')
  }
  const identity = getMailIdentity('resend')
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resend.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: identity.from,
      to: [to],
      subject,
      html,
      text,
      reply_to: replyTo || identity.replyTo,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message =
      data?.message
      || (typeof data?.error === 'string' ? data.error : data?.error?.message)
      || `Resend API error (${res.status})`
    throw new Error(message)
  }
  return { provider: 'resend', id: data?.id }
}

async function sendViaSendgrid({ to, subject, text, html, replyTo }) {
  const sendgrid = getResolvedSendgridConfig()
  if (!sendgrid.enabled || !sendgrid.apiKey) {
    throw new Error('SendGrid is not configured. Add an API key and enable it in Admin → Settings → Email.')
  }
  const identity = getMailIdentity('sendgrid')
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sendgrid.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: identity.address, name: identity.name },
      reply_to: { email: replyTo || identity.replyTo },
      subject,
      content: [
        { type: 'text/plain', value: text || subject },
        { type: 'text/html', value: html || `<p>${text || subject}</p>` },
      ],
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(body || `SendGrid API error (${res.status})`)
  }
  return { provider: 'sendgrid' }
}

async function sendViaSmtp({ to, subject, text, html, replyTo }) {
  const mailer = getSmtpTransporter()
  if (!mailer) {
    throw new Error('SMTP is not configured. Add host, user and password, then save.')
  }
  const identity = getMailIdentity('smtp')
  const info = await mailer.sendMail({
    from: identity.from,
    replyTo: replyTo || identity.replyTo,
    to,
    subject,
    text,
    html,
  })
  return { provider: 'smtp', id: info.messageId }
}

/** Send email using active provider (Resend → SendGrid → SMTP) or a specific provider. */
export async function sendEmail({
  to,
  subject,
  text,
  html,
  replyTo,
  provider = 'auto',
}) {
  const recipient = String(to ?? '').trim().toLowerCase()
  if (!recipient) throw new Error('Recipient email is required.')

  const chosen = resolveProvider(provider)
  const payload = {
    to: recipient,
    subject: String(subject ?? ''),
    text: String(text ?? ''),
    html: String(html ?? `<p>${text ?? subject ?? ''}</p>`),
    replyTo: replyTo ? String(replyTo).trim() : undefined,
  }

  if (chosen === 'resend') return sendViaResend(payload)
  if (chosen === 'sendgrid') return sendViaSendgrid(payload)
  return sendViaSmtp(payload)
}
