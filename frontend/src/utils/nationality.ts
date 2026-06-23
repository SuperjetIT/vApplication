import { ALL_CITIZENSHIPS } from '../data/citizenships'
import { mapNationalityFromOcr } from './passportOcrHelpers'

/** Resolve a nationality string (name, ISO-2, or MRZ-3 code) to a canonical country name. */
export function resolveNationalityDisplay(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''

  const fromOcr = mapNationalityFromOcr(trimmed)
  if (fromOcr) return fromOcr

  const exact = ALL_CITIZENSHIPS.find((c) => c.name.toLowerCase() === trimmed.toLowerCase())
  if (exact) return exact.name

  const byCode = ALL_CITIZENSHIPS.find((c) => c.code.toLowerCase() === trimmed.toLowerCase())
  if (byCode) return byCode.name

  const partial = ALL_CITIZENSHIPS.find(
    (c) =>
      c.name.toLowerCase().includes(trimmed.toLowerCase()) ||
      trimmed.toLowerCase().includes(c.name.toLowerCase()),
  )
  if (partial) return partial.name

  return trimmed
}

export function resolveNationalityCode(value: string): string {
  const name = resolveNationalityDisplay(value)
  if (!name || name === '—') return ''
  const entry = ALL_CITIZENSHIPS.find((c) => c.name.toLowerCase() === name.toLowerCase())
  return entry?.code ?? ''
}

/** Pick the first non-empty resolved passport country from candidate values. */
export function resolvePassportFromSources(
  ...sources: (string | undefined | null)[]
): { name: string; code: string } {
  for (const src of sources) {
    const raw = String(src ?? '').trim()
    if (!raw || raw === '—' || raw.toLowerCase() === 'unknown') continue
    const name = resolveNationalityDisplay(raw)
    if (!name) continue
    const code = resolveNationalityCode(name) || 'un'
    return { name, code }
  }
  return { name: '—', code: 'un' }
}
