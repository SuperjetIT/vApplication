/** Strip common XSS patterns from free-text input. */
export function sanitizeInput(val: string): string {
  return val.replace(/<script|javascript:|on\w+=/gi, '')
}

export function maskApiKey(key: string): string {
  const trimmed = key.trim()
  if (!trimmed) return ''
  return `••••••••${trimmed.slice(-4)}`
}
