export type CitizenshipEntry = {
  name: string
  code: string
}

/** Display order for the citizenship picker (popular section). */
export const POPULAR_CITIZENSHIP_CODES = [
  'in',
  'pk',
  'lb',
  'eg',
  'sy',
  'bd',
  'ph',
  'np',
  'jo',
  'gh',
  'ng',
  'lk',
  'ke',
  'et',
  'id',
  'gb',
  'us',
  'ae',
  'sa',
  'qa',
  'kw',
  'bh',
  'om',
  'ma',
  'tr',
  'fr',
  'de',
  'cn',
  'kr',
] as const

const EXTRA_CITIZENSHIPS: CitizenshipEntry[] = [
  { name: 'Pakistan', code: 'pk' },
  { name: 'Lebanon', code: 'lb' },
  { name: 'Syria', code: 'sy' },
  { name: 'Bangladesh', code: 'bd' },
  { name: 'Philippines', code: 'ph' },
  { name: 'Nepal', code: 'np' },
  { name: 'Jordan', code: 'jo' },
  { name: 'Ghana', code: 'gh' },
  { name: 'Nigeria', code: 'ng' },
  { name: 'Sri Lanka', code: 'lk' },
  { name: 'Ethiopia', code: 'et' },
  { name: 'Qatar', code: 'qa' },
  { name: 'Kuwait', code: 'kw' },
  { name: 'Bahrain', code: 'bh' },
  { name: 'Oman', code: 'om' },
  { name: 'Morocco', code: 'ma' },
  { name: 'Turkey', code: 'tr' },
  { name: 'Germany', code: 'de' },
  { name: 'China', code: 'cn' },
  { name: 'Afghanistan', code: 'af' },
  { name: 'Albania', code: 'al' },
  { name: 'Algeria', code: 'dz' },
  { name: 'Argentina', code: 'ar' },
  { name: 'Armenia', code: 'am' },
  { name: 'Austria', code: 'at' },
  { name: 'Azerbaijan', code: 'az' },
  { name: 'Belarus', code: 'by' },
  { name: 'Belgium', code: 'be' },
  { name: 'Belize', code: 'bz' },
  { name: 'Benin', code: 'bj' },
  { name: 'Bolivia', code: 'bo' },
  { name: 'Bosnia and Herzegovina', code: 'ba' },
  { name: 'Botswana', code: 'bw' },
  { name: 'Bulgaria', code: 'bg' },
  { name: 'Burkina Faso', code: 'bf' },
  { name: 'Burundi', code: 'bi' },
  { name: 'Cambodia', code: 'kh' },
  { name: 'Cameroon', code: 'cm' },
  { name: 'Chad', code: 'td' },
  { name: 'Chile', code: 'cl' },
  { name: 'Colombia', code: 'co' },
  { name: 'Costa Rica', code: 'cr' },
  { name: 'Croatia', code: 'hr' },
  { name: 'Cuba', code: 'cu' },
  { name: 'Cyprus', code: 'cy' },
  { name: 'Czech Republic', code: 'cz' },
  { name: 'Denmark', code: 'dk' },
  { name: 'Dominican Republic', code: 'do' },
  { name: 'Ecuador', code: 'ec' },
  { name: 'El Salvador', code: 'sv' },
  { name: 'Estonia', code: 'ee' },
  { name: 'Finland', code: 'fi' },
  { name: 'Gabon', code: 'ga' },
  { name: 'Gambia', code: 'gm' },
  { name: 'Georgia', code: 'ge' },
  { name: 'Greece', code: 'gr' },
  { name: 'Guatemala', code: 'gt' },
  { name: 'Guinea', code: 'gn' },
  { name: 'Haiti', code: 'ht' },
  { name: 'Honduras', code: 'hn' },
  { name: 'Hungary', code: 'hu' },
  { name: 'Iceland', code: 'is' },
  { name: 'Iran', code: 'ir' },
  { name: 'Iraq', code: 'iq' },
  { name: 'Ireland', code: 'ie' },
  { name: 'Israel', code: 'il' },
  { name: 'Italy', code: 'it' },
  { name: 'Ivory Coast', code: 'ci' },
  { name: 'Jamaica', code: 'jm' },
  { name: 'Kazakhstan', code: 'kz' },
  { name: 'Kosovo', code: 'xk' },
  { name: 'Kyrgyzstan', code: 'kg' },
  { name: 'Laos', code: 'la' },
  { name: 'Latvia', code: 'lv' },
  { name: 'Libya', code: 'ly' },
  { name: 'Lithuania', code: 'lt' },
  { name: 'Luxembourg', code: 'lu' },
  { name: 'Madagascar', code: 'mg' },
  { name: 'Malawi', code: 'mw' },
  { name: 'Maldives', code: 'mv' },
  { name: 'Mali', code: 'ml' },
  { name: 'Malta', code: 'mt' },
  { name: 'Mauritania', code: 'mr' },
  { name: 'Mauritius', code: 'mu' },
  { name: 'Mexico', code: 'mx' },
  { name: 'Moldova', code: 'md' },
  { name: 'Mongolia', code: 'mn' },
  { name: 'Montenegro', code: 'me' },
  { name: 'Mozambique', code: 'mz' },
  { name: 'Myanmar', code: 'mm' },
  { name: 'Namibia', code: 'na' },
  { name: 'Netherlands', code: 'nl' },
  { name: 'New Zealand', code: 'nz' },
  { name: 'Nicaragua', code: 'ni' },
  { name: 'Niger', code: 'ne' },
  { name: 'North Macedonia', code: 'mk' },
  { name: 'Norway', code: 'no' },
  { name: 'Palestine', code: 'ps' },
  { name: 'Panama', code: 'pa' },
  { name: 'Paraguay', code: 'py' },
  { name: 'Peru', code: 'pe' },
  { name: 'Poland', code: 'pl' },
  { name: 'Portugal', code: 'pt' },
  { name: 'Romania', code: 'ro' },
  { name: 'Russia', code: 'ru' },
  { name: 'Rwanda', code: 'rw' },
  { name: 'Senegal', code: 'sn' },
  { name: 'Serbia', code: 'rs' },
  { name: 'Sierra Leone', code: 'sl' },
  { name: 'Slovakia', code: 'sk' },
  { name: 'Slovenia', code: 'si' },
  { name: 'Somalia', code: 'so' },
  { name: 'South Africa', code: 'za' },
  { name: 'Spain', code: 'es' },
  { name: 'Sudan', code: 'sd' },
  { name: 'Sweden', code: 'se' },
  { name: 'Switzerland', code: 'ch' },
  { name: 'Taiwan', code: 'tw' },
  { name: 'Tajikistan', code: 'tj' },
  { name: 'Tanzania', code: 'tz' },
  { name: 'Tunisia', code: 'tn' },
  { name: 'Turkmenistan', code: 'tm' },
  { name: 'Uganda', code: 'ug' },
  { name: 'Ukraine', code: 'ua' },
  { name: 'Uruguay', code: 'uy' },
  { name: 'Uzbekistan', code: 'uz' },
  { name: 'Venezuela', code: 've' },
  { name: 'Yemen', code: 'ye' },
  { name: 'Zambia', code: 'zm' },
  { name: 'Zimbabwe', code: 'zw' },
]

/** Map destination country entries to citizenship names. */
const FROM_DESTINATIONS: CitizenshipEntry[] = [
  { name: 'India', code: 'in' },
  { name: 'United Kingdom', code: 'gb' },
  { name: 'Kenya', code: 'ke' },
  { name: 'USA', code: 'us' },
  { name: 'Malaysia', code: 'my' },
  { name: 'Egypt', code: 'eg' },
  { name: 'Indonesia', code: 'id' },
  { name: 'Thailand', code: 'th' },
  { name: 'Vietnam', code: 'vn' },
  { name: 'Canada', code: 'ca' },
  { name: 'Australia', code: 'au' },
  { name: 'Saudi Arabia', code: 'sa' },
  { name: 'Singapore', code: 'sg' },
  { name: 'Brazil', code: 'br' },
  { name: 'South Korea', code: 'kr' },
  { name: 'Japan', code: 'jp' },
  { name: 'France', code: 'fr' },
  { name: 'UAE', code: 'ae' },
]

function mergeCitizenships(entries: CitizenshipEntry[]): CitizenshipEntry[] {
  const byCode = new Map<string, CitizenshipEntry>()
  for (const entry of entries) {
    const code = entry.code.toLowerCase()
    if (!byCode.has(code)) byCode.set(code, { name: entry.name, code })
  }
  return [...byCode.values()].sort((a, b) => a.name.localeCompare(b.name))
}

const merged = mergeCitizenships([...FROM_DESTINATIONS, ...EXTRA_CITIZENSHIPS])

export const ALL_CITIZENSHIPS: CitizenshipEntry[] = merged

export const CITIZENSHIP_COUNT = ALL_CITIZENSHIPS.length

export function getCitizenshipByCode(code: string): CitizenshipEntry | undefined {
  const normalized = code.toLowerCase()
  return ALL_CITIZENSHIPS.find((c) => c.code === normalized)
}

export function getPopularCitizenships(): CitizenshipEntry[] {
  return POPULAR_CITIZENSHIP_CODES.map((code) => getCitizenshipByCode(code)).filter(
    (c): c is CitizenshipEntry => Boolean(c),
  )
}

export function getRemainingCitizenships(): CitizenshipEntry[] {
  const popularSet = new Set<string>(POPULAR_CITIZENSHIP_CODES)
  return ALL_CITIZENSHIPS.filter((c) => !popularSet.has(c.code))
}
