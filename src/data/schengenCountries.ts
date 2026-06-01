export interface SchengenCountry {
  name: string
  code: string
  popular?: boolean
}

export const schengenCountries: SchengenCountry[] = [
  { name: 'Austria', code: 'at', popular: true },
  { name: 'Spain', code: 'es', popular: true },
  { name: 'Netherlands', code: 'nl', popular: true },
  { name: 'Italy', code: 'it', popular: true },
  { name: 'Greece', code: 'gr', popular: true },
  { name: 'France', code: 'fr', popular: true },
  { name: 'Iceland', code: 'is', popular: true },
  { name: 'Germany', code: 'de', popular: true },
  { name: 'Belgium', code: 'be' },
  { name: 'Bulgaria', code: 'bg' },
  { name: 'Croatia', code: 'hr' },
  { name: 'Czech Republic', code: 'cz' },
  { name: 'Denmark', code: 'dk' },
  { name: 'Estonia', code: 'ee' },
  { name: 'Finland', code: 'fi' },
  { name: 'Hungary', code: 'hu' },
  { name: 'Latvia', code: 'lv' },
  { name: 'Liechtenstein', code: 'li' },
  { name: 'Lithuania', code: 'lt' },
  { name: 'Luxembourg', code: 'lu' },
  { name: 'Malta', code: 'mt' },
  { name: 'Norway', code: 'no' },
  { name: 'Poland', code: 'pl' },
  { name: 'Portugal', code: 'pt' },
  { name: 'Romania', code: 'ro' },
  { name: 'Slovakia', code: 'sk' },
  { name: 'Slovenia', code: 'si' },
  { name: 'Sweden', code: 'se' },
  { name: 'Switzerland', code: 'ch' },
]

export const popularSchengen = schengenCountries.filter((c) => c.popular)
export const otherSchengen = schengenCountries.filter((c) => !c.popular)
