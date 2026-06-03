export type VisaType = 'e-Visa' | 'Sticker' | 'No Visa Required'

export type ProcessingCategory = 'instant' | '24hours' | '3-5days' | '6-7days' | '8-30days'

export type DocumentCategory =
  | 'passport-only'
  | 'passport-bank'
  | 'passport-emirates'
  | 'us-uk-schengen'

export type TypeFilter = 'visa-free' | 'visa-on-arrival' | 'e-visa' | 'sticker'

export interface Country {
  slug: string
  name: string
  flag: string
  countryCode: string
  visaType: VisaType
  validity: string
  processingTime: string
  fee: string
  documents: string[]
  guaranteedDate: string
  processingCategory: ProcessingCategory
  documentCategory: DocumentCategory
  typeFilter: TypeFilter
}

export const countries: Country[] = [
  {
    slug: 'india',
    name: 'India',
    flag: '🇮🇳',
    countryCode: 'in',
    visaType: 'e-Visa',
    validity: '30 days',
    processingTime: '3–5 business days',
    fee: 'AED 185',
    documents: ['Passport', 'Photo'],
    guaranteedDate: '5 Jun 2026, 6:16 PM',
    processingCategory: '3-5days',
    documentCategory: 'passport-only',
    typeFilter: 'e-visa',
  },
  {
    slug: 'uk',
    name: 'United Kingdom',
    flag: '🇬🇧',
    countryCode: 'gb',
    visaType: 'e-Visa',
    validity: '2 years',
    processingTime: '10–15 business days',
    fee: 'AED 650',
    documents: ['Passport', 'Photo', 'Bank Statements'],
    guaranteedDate: '12 Jun 2026, 2:30 PM',
    processingCategory: '8-30days',
    documentCategory: 'passport-bank',
    typeFilter: 'e-visa',
  },
  {
    slug: 'kenya',
    name: 'Kenya',
    flag: '🇰🇪',
    countryCode: 'ke',
    visaType: 'e-Visa',
    validity: '90 days',
    processingTime: '2–4 business days',
    fee: 'AED 220',
    documents: ['Passport', 'Photo'],
    guaranteedDate: '3 Jun 2026, 11:00 AM',
    processingCategory: 'instant',
    documentCategory: 'passport-only',
    typeFilter: 'e-visa',
  },
  {
    slug: 'united-states',
    name: 'United States',
    flag: '🇺🇸',
    countryCode: 'us',
    visaType: 'Sticker',
    validity: '10 years',
    processingTime: '15–30 business days',
    fee: 'AED 720',
    documents: ['Passport', 'Photo', 'Bank Statements'],
    guaranteedDate: '18 Jun 2026, 4:45 PM',
    processingCategory: '8-30days',
    documentCategory: 'us-uk-schengen',
    typeFilter: 'sticker',
  },
  {
    slug: 'malaysia',
    name: 'Malaysia',
    flag: '🇲🇾',
    countryCode: 'my',
    visaType: 'e-Visa',
    validity: '30 days',
    processingTime: '2–3 business days',
    fee: 'AED 150',
    documents: ['Passport'],
    guaranteedDate: '4 Jun 2026, 9:20 AM',
    processingCategory: '24hours',
    documentCategory: 'passport-only',
    typeFilter: 'e-visa',
  },
  {
    slug: 'egypt',
    name: 'Egypt',
    flag: '🇪🇬',
    countryCode: 'eg',
    visaType: 'e-Visa',
    validity: '90 days',
    processingTime: '3–5 business days',
    fee: 'AED 175',
    documents: ['Passport'],
    guaranteedDate: '6 Jun 2026, 1:15 PM',
    processingCategory: '3-5days',
    documentCategory: 'passport-only',
    typeFilter: 'e-visa',
  },
  {
    slug: 'indonesia',
    name: 'Indonesia',
    flag: '🇮🇩',
    countryCode: 'id',
    visaType: 'e-Visa',
    validity: '90 days',
    processingTime: '3–5 business days',
    fee: 'AED 190',
    documents: ['Passport', 'Photo'],
    guaranteedDate: '7 Jun 2026, 10:40 AM',
    processingCategory: '3-5days',
    documentCategory: 'passport-only',
    typeFilter: 'e-visa',
  },
  {
    slug: 'thailand',
    name: 'Thailand',
    flag: '🇹🇭',
    countryCode: 'th',
    visaType: 'e-Visa',
    validity: '90 days',
    processingTime: '4–6 business days',
    fee: 'AED 210',
    documents: ['Passport'],
    guaranteedDate: '4 Jun 2026, 3:00 PM',
    processingCategory: '24hours',
    documentCategory: 'passport-only',
    typeFilter: 'visa-on-arrival',
  },
  {
    slug: 'vietnam',
    name: 'Vietnam',
    flag: '🇻🇳',
    countryCode: 'vn',
    visaType: 'e-Visa',
    validity: '30 days',
    processingTime: '3–5 business days',
    fee: 'AED 165',
    documents: ['Passport', 'Photo'],
    guaranteedDate: '6 Jun 2026, 8:50 AM',
    processingCategory: '3-5days',
    documentCategory: 'passport-only',
    typeFilter: 'e-visa',
  },
  {
    slug: 'canada',
    name: 'Canada',
    flag: '🇨🇦',
    countryCode: 'ca',
    visaType: 'Sticker',
    validity: '5 years',
    processingTime: '20–30 business days',
    fee: 'AED 580',
    documents: ['Passport', 'Photo', 'Bank Statements'],
    guaranteedDate: '20 Jun 2026, 5:30 PM',
    processingCategory: '8-30days',
    documentCategory: 'passport-bank',
    typeFilter: 'sticker',
  },
  {
    slug: 'australia',
    name: 'Australia',
    flag: '🇦🇺',
    countryCode: 'au',
    visaType: 'e-Visa',
    validity: '1 year',
    processingTime: '10–15 business days',
    fee: 'AED 490',
    documents: ['Passport', 'Emirates Id', 'Bank Statements'],
    guaranteedDate: '10 Jun 2026, 12:00 PM',
    processingCategory: '6-7days',
    documentCategory: 'passport-emirates',
    typeFilter: 'e-visa',
  },
  {
    slug: 'saudi-arabia',
    name: 'Saudi Arabia',
    flag: '🇸🇦',
    countryCode: 'sa',
    visaType: 'e-Visa',
    validity: '365 days',
    processingTime: '2–4 business days',
    fee: 'AED 320',
    documents: ['Passport', 'Photo'],
    guaranteedDate: '4 Jun 2026, 7:10 PM',
    processingCategory: '24hours',
    documentCategory: 'passport-only',
    typeFilter: 'e-visa',
  },
  {
    slug: 'singapore',
    name: 'Singapore',
    flag: '🇸🇬',
    countryCode: 'sg',
    visaType: 'e-Visa',
    validity: '30 days',
    processingTime: '3–5 business days',
    fee: 'AED 140',
    documents: ['Passport'],
    guaranteedDate: '5 Jun 2026, 2:05 PM',
    processingCategory: '3-5days',
    documentCategory: 'passport-only',
    typeFilter: 'e-visa',
  },
  {
    slug: 'brazil',
    name: 'Brazil',
    flag: '🇧🇷',
    countryCode: 'br',
    visaType: 'e-Visa',
    validity: '10 years',
    processingTime: '7–10 business days',
    fee: 'AED 260',
    documents: ['Passport', 'Photo'],
    guaranteedDate: '9 Jun 2026, 11:45 AM',
    processingCategory: '6-7days',
    documentCategory: 'passport-only',
    typeFilter: 'e-visa',
  },
  {
    slug: 'south-korea',
    name: 'South Korea',
    flag: '🇰🇷',
    countryCode: 'kr',
    visaType: 'e-Visa',
    validity: '2 years',
    processingTime: '8–12 business days',
    fee: 'AED 380',
    documents: ['Passport', 'Photo'],
    guaranteedDate: '11 Jun 2026, 4:20 PM',
    processingCategory: '6-7days',
    documentCategory: 'passport-only',
    typeFilter: 'e-visa',
  },
  {
    slug: 'japan',
    name: 'Japan',
    flag: '🇯🇵',
    countryCode: 'jp',
    visaType: 'No Visa Required',
    validity: '90 days',
    processingTime: 'Not applicable',
    fee: 'Free',
    documents: [],
    guaranteedDate: '2 Jun 2026, 6:16 PM',
    processingCategory: 'instant',
    documentCategory: 'passport-only',
    typeFilter: 'visa-free',
  },
  {
    slug: 'france',
    name: 'France',
    flag: '🇫🇷',
    countryCode: 'fr',
    visaType: 'No Visa Required',
    validity: '90 days',
    processingTime: 'Not applicable',
    fee: 'Free',
    documents: [],
    guaranteedDate: '2 Jun 2026, 6:16 PM',
    processingCategory: 'instant',
    documentCategory: 'passport-only',
    typeFilter: 'visa-free',
  },
  {
    slug: 'uae',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    countryCode: 'ae',
    visaType: 'No Visa Required',
    validity: 'N/A',
    processingTime: 'Not applicable',
    fee: 'Free',
    documents: [],
    guaranteedDate: '2 Jun 2026, 6:16 PM',
    processingCategory: 'instant',
    documentCategory: 'passport-only',
    typeFilter: 'visa-free',
  },
]

export function getCountry(slug: string): Country | undefined {
  return countries.find((c) => c.slug === slug)
}

export function getProcessingDays(category: ProcessingCategory): number {
  switch (category) {
    case 'instant':
      return 0
    case '24hours':
      return 1
    case '3-5days':
      return 5
    case '6-7days':
      return 7
    case '8-30days':
      return 30
  }
}
