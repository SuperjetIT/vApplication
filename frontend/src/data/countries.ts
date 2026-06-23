export type VisaType = 'e-Visa' | 'Sticker' | 'No Visa Required'

export type ProcessingCategory = 'instant' | '24hours' | '3-5days' | '6-7days' | '8-30days'

export type DocumentCategory =
  | 'passport-only'
  | 'passport-bank'
  | 'passport-emirates'
  | 'us-uk-schengen'

export type TypeFilter = 'visa-free' | 'visa-on-arrival' | 'e-visa' | 'sticker'

export interface VisaOption {
  id: string
  label: string
  validity: string
  fee: string
  processingFee: string
  processingTime: string
  entry: string
  method: string
  ports: string
}

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
  visaOptions: VisaOption[]
}

const PROCESSING_FEE = 'AED 173'
const ALL_PORTS = 'All Ports of Entry'
const PAPERLESS = 'Paperless'

function singleOption(
  validity: string,
  fee: string,
  processingTime: string,
  label = 'Single Entry Visa',
): VisaOption[] {
  return [
    {
      id: 'single',
      label,
      validity,
      fee,
      processingFee: fee === 'Free' ? 'Free' : PROCESSING_FEE,
      processingTime,
      entry: 'Single',
      method: PAPERLESS,
      ports: ALL_PORTS,
    },
  ]
}

function dualOptions(
  single: { validity: string; fee: string; processingTime: string },
  multiple: { validity: string; fee: string; processingTime: string },
): VisaOption[] {
  return [
    {
      id: 'single',
      label: 'Single Entry Visa',
      validity: single.validity,
      fee: single.fee,
      processingFee: PROCESSING_FEE,
      processingTime: single.processingTime,
      entry: 'Single',
      method: PAPERLESS,
      ports: ALL_PORTS,
    },
    {
      id: 'multiple',
      label: 'Multiple Entry Visa',
      validity: multiple.validity,
      fee: multiple.fee,
      processingFee: PROCESSING_FEE,
      processingTime: multiple.processingTime,
      entry: 'Multiple',
      method: PAPERLESS,
      ports: ALL_PORTS,
    },
  ]
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
    visaOptions: dualOptions(
      { validity: '30 days', fee: 'AED 185', processingTime: '3-5 days' },
      { validity: '1 year', fee: 'AED 320', processingTime: '5-7 days' },
    ),
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
    visaOptions: dualOptions(
      { validity: '6 months', fee: 'AED 650', processingTime: '10-15 days' },
      { validity: '2 years', fee: 'AED 890', processingTime: '12-18 days' },
    ),
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
    visaOptions: dualOptions(
      { validity: '30 days', fee: 'AED 220', processingTime: '2-4 days' },
      { validity: '90 days', fee: 'AED 310', processingTime: '3-5 days' },
    ),
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
    visaOptions: dualOptions(
      { validity: '10 years', fee: 'AED 720', processingTime: '15-30 days' },
      { validity: '10 years', fee: 'AED 820', processingTime: '12-25 days' },
    ),
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
    visaOptions: dualOptions(
      { validity: '30 days', fee: 'AED 150', processingTime: '2-3 days' },
      { validity: '90 days', fee: 'AED 240', processingTime: '3-5 days' },
    ),
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
    visaOptions: dualOptions(
      { validity: '30 days', fee: 'AED 114', processingTime: '3-5 days' },
      { validity: '90 days', fee: 'AED 220', processingTime: '5-7 days' },
    ),
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
    visaOptions: singleOption('90 days', 'AED 190', '3-5 days'),
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
    visaOptions: dualOptions(
      { validity: '30 days', fee: 'AED 210', processingTime: '4-6 days' },
      { validity: '90 days', fee: 'AED 295', processingTime: '5-7 days' },
    ),
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
    visaOptions: singleOption('30 days', 'AED 165', '3-5 days'),
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
    visaOptions: dualOptions(
      { validity: '6 months', fee: 'AED 580', processingTime: '20-30 days' },
      { validity: '5 years', fee: 'AED 720', processingTime: '18-28 days' },
    ),
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
    visaOptions: dualOptions(
      { validity: '3 months', fee: 'AED 490', processingTime: '10-15 days' },
      { validity: '1 year', fee: 'AED 620', processingTime: '12-18 days' },
    ),
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
    visaOptions: singleOption('365 days', 'AED 320', '2-4 days'),
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
    visaOptions: dualOptions(
      { validity: '30 days', fee: 'AED 140', processingTime: '3-5 days' },
      { validity: '90 days', fee: 'AED 225', processingTime: '5-7 days' },
    ),
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
    visaOptions: singleOption('10 years', 'AED 260', '7-10 days'),
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
    visaOptions: singleOption('2 years', 'AED 380', '8-12 days'),
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
    visaOptions: singleOption('90 days', 'Free', 'Instant', 'Visa Free Entry'),
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
    visaOptions: dualOptions(
      { validity: '90 days', fee: 'AED 350', processingTime: '8-12 days' },
      { validity: '2 years', fee: 'AED 520', processingTime: '10-15 days' },
    ),
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
    visaOptions: dualOptions(
      { validity: '30 days', fee: 'AED 280', processingTime: '2-4 days' },
      { validity: '90 days', fee: 'AED 420', processingTime: '3-5 days' },
    ),
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
