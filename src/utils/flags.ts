import { ALL_CITIZENSHIPS, getCitizenshipByCode } from '../data/citizenships'

const NAME_ALIASES: Record<string, string> = {
  uae: 'ae',
  'united arab emirates': 'ae',
  uk: 'gb',
  'united kingdom': 'gb',
  usa: 'us',
  'united states': 'us',
  'united states of america': 'us',
}

/** Resolve a 2-letter ISO code from a code and/or country display name. */
export function resolveFlagCode(code: string, countryName?: string): string {
  const normalizedCode = code?.trim().toLowerCase()
  if (normalizedCode && /^[a-z]{2}$/.test(normalizedCode)) return normalizedCode

  const name = (countryName ?? code)?.trim().toLowerCase()
  if (!name) return ''

  if (NAME_ALIASES[name]) return NAME_ALIASES[name]

  const byName = ALL_CITIZENSHIPS.find((c) => c.name.toLowerCase() === name)
  if (byName) return byName.code

  const byPartial = ALL_CITIZENSHIPS.find(
    (c) => c.name.toLowerCase().includes(name) || name.includes(c.name.toLowerCase()),
  )
  if (byPartial) return byPartial.code

  if (normalizedCode) {
    const byCode = getCitizenshipByCode(normalizedCode)
    if (byCode) return byCode.code
  }

  return ''
}

export function flagEmoji(code: string, countryName?: string): string {
  const resolved = resolveFlagCode(code, countryName)
  if (!resolved || resolved.length !== 2) return '🏳️'
  const up = resolved.toUpperCase()
  return String.fromCodePoint(
    0x1f1e6 + up.charCodeAt(0) - 65,
    0x1f1e6 + up.charCodeAt(1) - 65,
  )
}

export function flagUrl(code: string, width = 80, countryName?: string) {
  const resolved = resolveFlagCode(code, countryName)
  if (!resolved) return ''
  return `https://flagcdn.com/w${width}/${resolved}.png`
}
