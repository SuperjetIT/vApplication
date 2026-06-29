/** Strip characters that are invalid in email local/domain parts while typing. */
export function sanitizeEmailInput(value: string): string {
  return value.replace(/[^\w.@+-]/gi, '')
}

export function normalizeEmail(email: string): string {
  return sanitizeEmailInput(email).trim().toLowerCase()
}

export function isValidEmail(email: string): boolean {
  const normalized = normalizeEmail(email)
  if (!normalized || normalized.length > 254) return false
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalized)
}

export type PasswordCheck = { label: string; met: boolean }

export type PasswordStrength = {
  valid: boolean
  score: number
  checks: PasswordCheck[]
  label: string
  color: string
}

export function getPasswordStrength(password: string): PasswordStrength {
  const checks: PasswordCheck[] = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter (A–Z)', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter (a–z)', met: /[a-z]/.test(password) },
    { label: 'One number (0–9)', met: /\d/.test(password) },
    { label: 'One special character (!@#$…)', met: /[^A-Za-z0-9]/.test(password) },
  ]
  const score = checks.filter((c) => c.met).length
  const valid = checks.every((c) => c.met)
  let label = 'Too weak'
  let color = '#dc2626'
  if (score >= 5) {
    label = 'Strong'
    color = '#16a34a'
  } else if (score >= 4) {
    label = 'Good'
    color = '#2563eb'
  } else if (score >= 3) {
    label = 'Fair'
    color = '#d97706'
  }
  return { valid, score, checks, label, color }
}

export function sanitizePhoneDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 15)
}

export function isValidPhoneDigits(digits: string, min = 6, max = 15): boolean {
  const len = digits.replace(/\D/g, '').length
  return len >= min && len <= max
}
