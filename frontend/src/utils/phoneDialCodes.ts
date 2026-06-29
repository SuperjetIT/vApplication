import { ALL_CITIZENSHIPS } from '../data/citizenships'

/** ISO 3166-1 alpha-2 → ITU-T E.164 country calling code */
const DIAL_CODES: Record<string, string> = {
  af: '+93', al: '+355', dz: '+213', ar: '+54', am: '+374', au: '+61', at: '+43', az: '+994',
  bh: '+973', bd: '+880', by: '+375', be: '+32', bz: '+501', bj: '+229', bo: '+591', ba: '+387',
  bw: '+267', br: '+55', bg: '+359', bf: '+226', bi: '+257', kh: '+855', cm: '+237', ca: '+1',
  cl: '+56', cn: '+86', co: '+57', cr: '+506', hr: '+385', cu: '+53', cy: '+357', cz: '+420',
  dk: '+45', do: '+1', ec: '+593', eg: '+20', sv: '+503', ee: '+372', et: '+251', fi: '+358',
  fr: '+33', ga: '+241', gm: '+220', ge: '+995', de: '+49', gh: '+233', gr: '+30', gt: '+502',
  gn: '+224', ht: '+509', hn: '+504', hu: '+36', is: '+354', in: '+91', id: '+62', ir: '+98',
  iq: '+964', ie: '+353', il: '+972', it: '+39', ci: '+225', jm: '+1', jp: '+81', jo: '+962',
  kz: '+7', ke: '+254', kw: '+965', kg: '+996', la: '+856', lv: '+371', lb: '+961', ly: '+218',
  lt: '+370', lu: '+352', mg: '+261', mw: '+265', my: '+60', mv: '+960', ml: '+223', mt: '+356',
  mr: '+222', mu: '+230', mx: '+52', md: '+373', mn: '+976', me: '+382', ma: '+212', mz: '+258',
  mm: '+95', na: '+264', np: '+977', nl: '+31', nz: '+64', ni: '+505', ne: '+227', ng: '+234',
  mk: '+389', no: '+47', om: '+968', pk: '+92', ps: '+970', pa: '+507', py: '+595', pe: '+51',
  ph: '+63', pl: '+48', pt: '+351', qa: '+974', ro: '+40', ru: '+7', rw: '+250', sa: '+966',
  sn: '+221', rs: '+381', sg: '+65', sk: '+421', si: '+386', za: '+27', kr: '+82', es: '+34',
  lk: '+94', sd: '+249', se: '+46', ch: '+41', sy: '+963', tw: '+886', tz: '+255', th: '+66',
  tg: '+228', tt: '+1', tn: '+216', tr: '+90', tm: '+993', ug: '+256', ua: '+380', ae: '+971',
  gb: '+44', us: '+1', uy: '+598', uz: '+998', ve: '+58', vn: '+84', ye: '+967', zm: '+260',
  zw: '+263', xk: '+383',
}

export function getDialCodeByCountryCode(countryCode: string): string {
  const normalized = countryCode.trim().toLowerCase()
  return DIAL_CODES[normalized] ?? '+971'
}

export function getDialCodeForCountryName(countryName: string): string {
  const trimmed = countryName.trim()
  if (!trimmed) return '+971'
  const entry = ALL_CITIZENSHIPS.find((c) => c.name.toLowerCase() === trimmed.toLowerCase())
  return entry ? getDialCodeByCountryCode(entry.code) : '+971'
}

/** Prefer country of residence, then passport nationality. */
export function resolveDefaultPhoneCountry(input: {
  residenceCode?: string
  residenceCountry?: string
  nationality?: string
}): { countryCode: string; dial: string } {
  if (input.residenceCode?.trim()) {
    const countryCode = input.residenceCode.trim().toLowerCase()
    return { countryCode, dial: getDialCodeByCountryCode(countryCode) }
  }
  if (input.residenceCountry?.trim()) {
    const entry = ALL_CITIZENSHIPS.find(
      (c) => c.name.toLowerCase() === input.residenceCountry!.trim().toLowerCase(),
    )
    if (entry) {
      return { countryCode: entry.code, dial: getDialCodeByCountryCode(entry.code) }
    }
  }
  if (input.nationality?.trim()) {
    const entry = ALL_CITIZENSHIPS.find(
      (c) => c.name.toLowerCase() === input.nationality!.trim().toLowerCase(),
    )
    if (entry) {
      return { countryCode: entry.code, dial: getDialCodeByCountryCode(entry.code) }
    }
  }
  return { countryCode: 'ae', dial: '+971' }
}

export function resolveDefaultPhoneCode(input: {
  residenceCode?: string
  residenceCountry?: string
  nationality?: string
}): string {
  return resolveDefaultPhoneCountry(input).dial
}

export type PhoneCodeOption = {
  dial: string
  countryCode: string
  countryName: string
  label: string
}

let cachedOptions: PhoneCodeOption[] | null = null

export function getPhoneCodeOptions(): PhoneCodeOption[] {
  if (cachedOptions) return cachedOptions
  cachedOptions = ALL_CITIZENSHIPS.map((c) => {
    const dial = getDialCodeByCountryCode(c.code)
    return {
      dial,
      countryCode: c.code,
      countryName: c.name,
      label: `${dial} ${c.name}`,
    }
  }).sort((a, b) => a.countryName.localeCompare(b.countryName))
  return cachedOptions
}

export function getPhonePlaceholder(dialCode: string): string {
  if (dialCode === '+971') return '501234567'
  if (dialCode === '+91') return '9876543210'
  if (dialCode === '+1') return '2025551234'
  if (dialCode === '+44') return '7911123456'
  return '123456789'
}

/** Search by country name, ISO code, or dial code (e.g. "ind" → India, Indonesia). */
export function filterPhoneCodeOptions(
  options: PhoneCodeOption[],
  query: string,
  limit = 40,
): PhoneCodeOption[] {
  const q = query.trim().toLowerCase()
  if (!q) return options
  const dialQ = q.replace(/^\+/, '')
  return options
    .filter((opt) => {
      const name = opt.countryName.toLowerCase()
      const code = opt.countryCode.toLowerCase()
      const dial = opt.dial.replace('+', '')
      return (
        name.includes(q) ||
        code.includes(q) ||
        dial.includes(dialQ) ||
        name.split(/\s+/).some((word) => word.startsWith(q))
      )
    })
    .slice(0, limit)
}

export function formatFullPhone(mobileCode: string, mobile: string): string {
  const digits = mobile.replace(/\D/g, '')
  if (!digits) return ''
  return `${mobileCode}${digits}`
}
