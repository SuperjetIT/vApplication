import { countries, getCountry, type Country, type TypeFilter } from './countries'
import { ALL_CITIZENSHIPS, getCitizenshipByCode } from './citizenships'

export type VisaPurpose = 'tourism' | 'business'

export interface VisaRequirementResult {
  passportCode: string
  passportName: string
  destinationSlug: string
  destinationName: string
  purpose: VisaPurpose
  visaNeeded: boolean
  type: string
  maxStay: string
  processing: string
}

export interface RequirementDestination {
  slug: string
  name: string
  countryCode: string
  routeSlug: string
}

const TYPE_LABEL: Record<TypeFilter, string> = {
  'visa-free': 'Visa Free',
  'visa-on-arrival': 'Visa on Arrival',
  'e-visa': 'E-Visa',
  sticker: 'Embassy Visa',
}

/** Inbound UAE rules — aligned with common official guidance for tourism. */
const UAE_INBOUND: Record<
  string,
  Omit<VisaRequirementResult, 'passportCode' | 'passportName' | 'destinationSlug' | 'destinationName' | 'purpose'>
> = {
  in: { visaNeeded: true, type: 'E-Visa', maxStay: '30 days', processing: '2 days' },
  us: { visaNeeded: true, type: 'E-Visa', maxStay: '30 days', processing: '7 days' },
  gb: { visaNeeded: true, type: 'E-Visa', maxStay: '30 days', processing: '2 days' },
  ca: { visaNeeded: true, type: 'E-Visa', maxStay: '30 days', processing: '7 days' },
  au: { visaNeeded: true, type: 'E-Visa', maxStay: '30 days', processing: '2 days' },
  ae: { visaNeeded: true, type: 'Visa Required', maxStay: '—', processing: '—' },
  sa: { visaNeeded: false, type: 'Visa Free', maxStay: '30 days', processing: 'Instant' },
  ph: { visaNeeded: true, type: 'E-Visa', maxStay: '30 days', processing: '7 days' },
  pk: { visaNeeded: true, type: 'E-Visa', maxStay: '30 days', processing: '2 days' },
  bd: { visaNeeded: true, type: 'E-Visa', maxStay: '30 days', processing: '2 days' },
  ng: { visaNeeded: true, type: 'E-Visa', maxStay: '30 days', processing: '7 days' },
  eg: { visaNeeded: true, type: 'E-Visa', maxStay: '30 days', processing: '2 days' },
  id: { visaNeeded: true, type: 'E-Visa', maxStay: '30 days', processing: '7 days' },
  my: { visaNeeded: true, type: 'E-Visa', maxStay: '30 days', processing: '7 days' },
  sg: { visaNeeded: true, type: 'E-Visa', maxStay: '30 days', processing: '7 days' },
  th: { visaNeeded: true, type: 'E-Visa', maxStay: '30 days', processing: '7 days' },
  vn: { visaNeeded: true, type: 'E-Visa', maxStay: '30 days', processing: '7 days' },
  br: { visaNeeded: true, type: 'E-Visa', maxStay: '30 days', processing: '2 days' },
  za: { visaNeeded: true, type: 'E-Visa', maxStay: '30 days', processing: '2 days' },
  de: { visaNeeded: false, type: 'Visa Free', maxStay: '30 days', processing: 'Instant' },
  fr: { visaNeeded: false, type: 'Visa Free', maxStay: '30 days', processing: 'Instant' },
  kw: { visaNeeded: false, type: 'Visa Free', maxStay: '30 days', processing: 'Instant' },
  qa: { visaNeeded: false, type: 'Visa Free', maxStay: '30 days', processing: 'Instant' },
  bh: { visaNeeded: false, type: 'Visa Free', maxStay: '30 days', processing: 'Instant' },
  om: { visaNeeded: false, type: 'Visa Free', maxStay: '30 days', processing: 'Instant' },
}

export const TOP_PASSPORT_CODES = [
  'in',
  'us',
  'gb',
  'ca',
  'au',
  'ae',
  'sa',
  'ph',
  'pk',
  'bd',
  'ng',
  'eg',
  'id',
  'my',
  'sg',
  'th',
  'vn',
  'br',
  'za',
  'de',
] as const

export function normalizeDestinationSlug(raw?: string): string {
  if (!raw || raw === 'dubai-visa' || raw === 'uae-visa') return 'uae'
  const country = getCountry(raw)
  return country?.slug ?? 'uae'
}

export function getRequirementDestinations(): RequirementDestination[] {
  const seen = new Set<string>()
  const list: RequirementDestination[] = []

  for (const c of countries) {
    if (seen.has(c.slug)) continue
    seen.add(c.slug)
    list.push({
      slug: c.slug,
      name: c.name,
      countryCode: c.countryCode,
      routeSlug: c.slug === 'uae' ? 'dubai-visa' : c.slug,
    })
  }

  return list.sort((a, b) => a.name.localeCompare(b.name))
}

function processingShort(country: Country): string {
  const t = country.processingTime.toLowerCase()
  if (t.includes('instant') || t.includes('not applicable')) return 'Instant'
  if (t.includes('24')) return '1 day'
  if (t.includes('2–3') || t.includes('2-3') || t.includes('2–4')) return '2 days'
  if (t.includes('3–5') || t.includes('3-5')) return '3 days'
  if (t.includes('10')) return '10 days'
  if (t.includes('15')) return '15 days'
  if (t.includes('20')) return '20 days'
  return '7 days'
}

function deriveFromCountry(country: Country, passportCode: string): Omit<
  VisaRequirementResult,
  'passportCode' | 'passportName' | 'destinationSlug' | 'destinationName' | 'purpose'
> {
  const gcc = new Set(['ae', 'sa', 'kw', 'qa', 'bh', 'om'])
  if (gcc.has(passportCode) && country.typeFilter === 'visa-free') {
    return {
      visaNeeded: false,
      type: 'Visa Free',
      maxStay: country.validity === 'N/A' ? '—' : country.validity,
      processing: 'Instant',
    }
  }

  const visaNeeded = country.typeFilter !== 'visa-free'
  return {
    visaNeeded,
    type: TYPE_LABEL[country.typeFilter],
    maxStay: country.validity === 'N/A' ? '—' : country.validity,
    processing: processingShort(country),
  }
}

export function getVisaRequirement(
  passportCode: string,
  destinationSlug: string,
  purpose: VisaPurpose = 'tourism',
): VisaRequirementResult | null {
  const passport = getCitizenshipByCode(passportCode)
  const destSlug = normalizeDestinationSlug(destinationSlug)
  const destination = getCountry(destSlug)
  if (!passport || !destination) return null

  let rule: Omit<
    VisaRequirementResult,
    'passportCode' | 'passportName' | 'destinationSlug' | 'destinationName' | 'purpose'
  >

  if (destSlug === 'uae' && UAE_INBOUND[passportCode]) {
    rule = { ...UAE_INBOUND[passportCode] }
    if (purpose === 'business' && rule.type === 'E-Visa') {
      rule = { ...rule, type: 'Business E-Visa' }
    }
  } else {
    rule = deriveFromCountry(destination, passportCode)
    if (purpose === 'business' && rule.visaNeeded) {
      rule = { ...rule, type: rule.type.replace('E-Visa', 'Business E-Visa') }
    }
  }

  return {
    passportCode: passport.code,
    passportName: passport.name,
    destinationSlug: destSlug,
    destinationName: destination.name,
    purpose,
    ...rule,
  }
}

export function getDestinationTableRows(
  destinationSlug: string,
  purpose: VisaPurpose = 'tourism',
): VisaRequirementResult[] {
  return TOP_PASSPORT_CODES.map((code) => getVisaRequirement(code, destinationSlug, purpose)).filter(
    (r): r is VisaRequirementResult => Boolean(r),
  )
}

export function buildFaqs(destinationName: string, destinationSlug: string) {
  const slug = normalizeDestinationSlug(destinationSlug)
  const samples = [
    { code: 'us', label: 'Americans' },
    { code: 'in', label: 'Indians' },
    { code: 'gb', label: 'British' },
    { code: 'ae', label: 'Emiratis' },
  ]

  return samples.map(({ code, label }) => {
    const r = getVisaRequirement(code, slug, 'tourism')
    if (!r) return null
    const need = r.visaNeeded
      ? `Yes. ${label} need a ${r.type.toLowerCase()} to enter ${destinationName}.`
      : `No. ${label} can enter ${destinationName} visa-free.`
    const stay =
      r.maxStay !== '—'
        ? ` Each visit can last up to ${r.maxStay}. Processing typically takes around ${r.processing}.`
        : ''
    return {
      q: `Do ${label.toLowerCase()} need a visa for ${destinationName}?`,
      a: `${need}${stay}`,
    }
  }).filter((f): f is { q: string; a: string } => Boolean(f))
}

export const ALL_DESTINATION_COUNT = ALL_CITIZENSHIPS.length
