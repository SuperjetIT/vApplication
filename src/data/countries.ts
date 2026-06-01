export type VisaType = 'e-Visa' | 'Sticker' | 'No Visa Required'

export interface Country {
  name: string
  code: string
  type: VisaType
  valid?: string
  hasFees?: boolean
  documents?: string[]
}

export const countries: Country[] = [
  { name: 'United States', code: 'us', type: 'Sticker', valid: '10 years', hasFees: true, documents: ['Passport'] },
  { name: 'Malaysia', code: 'my', type: 'e-Visa', valid: '30 days', hasFees: true, documents: ['Passport'] },
  { name: 'Egypt', code: 'eg', type: 'e-Visa', valid: '90 days', hasFees: true, documents: ['Passport'] },
  { name: 'United Kingdom', code: 'gb', type: 'e-Visa', valid: '2 years', hasFees: true, documents: ['Photo', 'Passport'] },
  { name: 'Indonesia', code: 'id', type: 'e-Visa', valid: '90 days', hasFees: true, documents: ['Photo', 'Passport'] },
  { name: 'Azerbaijan', code: 'az', type: 'Sticker', valid: '90 days', hasFees: true, documents: ['Emirates Id', 'Bank Statements', 'Photo', 'Passport'] },
  { name: 'Australia', code: 'au', type: 'e-Visa', valid: '1 years', hasFees: true, documents: ['Emirates Id', 'Bank Statements', 'Passport'] },
  { name: 'Jordan', code: 'jo', type: 'e-Visa', hasFees: true, documents: ['Passport'] },
  { name: 'Thailand', code: 'th', type: 'e-Visa', valid: '90 days', hasFees: true, documents: ['Passport'] },
  { name: 'Vietnam', code: 'vn', type: 'e-Visa', valid: '30 days', hasFees: true, documents: ['Photo', 'Passport'] },
  { name: 'South Korea', code: 'kr', type: 'e-Visa', valid: '2 years', hasFees: true, documents: ['Photo', 'Passport'] },
  { name: 'Kuwait', code: 'kw', type: 'e-Visa', valid: '30 days', hasFees: true, documents: ['Emirates Id', 'Bank Statements', 'Photo', 'Passport'] },
  { name: 'Canada', code: 'ca', type: 'Sticker', valid: '5 years', hasFees: true, documents: ['Passport'] },
  { name: 'Kenya', code: 'ke', type: 'e-Visa', valid: '90 days', hasFees: true, documents: ['Photo', 'Passport'] },
  { name: 'India', code: 'in', type: 'e-Visa', valid: '30 days', hasFees: true, documents: ['Photo', 'Passport'] },
  { name: 'Brazil', code: 'br', type: 'e-Visa', valid: '10 years', hasFees: true, documents: ['Photo', 'Passport'] },
  { name: 'China', code: 'cn', type: 'Sticker', valid: '30 days', hasFees: true, documents: ['Bank Statements', 'Photo', 'Passport'] },
  { name: 'Saudi Arabia', code: 'sa', type: 'e-Visa', valid: '365 days', hasFees: true, documents: ['Photo', 'Passport'] },
  { name: 'Singapore', code: 'sg', type: 'e-Visa', hasFees: true, documents: ['Passport'] },
  { name: 'New Zealand', code: 'nz', type: 'e-Visa', valid: '2 years', hasFees: true, documents: ['Photo', 'Passport'] },
  { name: 'Qatar', code: 'qa', type: 'e-Visa', hasFees: true, documents: ['Photo', 'Passport'] },
  { name: 'United Arab Emirates', code: 'ae', type: 'No Visa Required' },
  { name: 'Morocco', code: 'ma', type: 'No Visa Required' },
  { name: 'Türkiye', code: 'tr', type: 'No Visa Required' },
  { name: 'Japan', code: 'jp', type: 'No Visa Required' },
  { name: 'France', code: 'fr', type: 'No Visa Required' },
  { name: 'Germany', code: 'de', type: 'No Visa Required' },
  { name: 'Italy', code: 'it', type: 'No Visa Required' },
  { name: 'Spain', code: 'es', type: 'No Visa Required' },
  { name: 'Hong Kong SAR China', code: 'hk', type: 'No Visa Required' },
  { name: 'South Africa', code: 'za', type: 'No Visa Required' },
  { name: 'Georgia', code: 'ge', type: 'No Visa Required' },
  { name: 'Maldives', code: 'mv', type: 'No Visa Required' },
]
