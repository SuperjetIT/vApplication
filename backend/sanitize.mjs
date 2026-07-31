/** Strip secrets before sending objects in API responses. */
const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'secretKey',
  'webhookSecret',
  'apiKey',
  'accessToken',
  'smtpPass',
  'pass',
  'token',
  'refreshToken',
])

export function stripSensitiveFields(value) {
  if (value == null) return value
  if (Array.isArray(value)) return value.map(stripSensitiveFields)
  if (typeof value !== 'object') return value
  const out = {}
  for (const [key, v] of Object.entries(value)) {
    if (SENSITIVE_KEYS.has(key)) continue
    out[key] = typeof v === 'object' && v !== null ? stripSensitiveFields(v) : v
  }
  return out
}

export function toPublicPartner(partner) {
  if (!partner || typeof partner !== 'object') return partner
  return stripSensitiveFields(partner)
}

export function toPublicPartners(partners) {
  if (!Array.isArray(partners)) return []
  return partners.map(toPublicPartner)
}
