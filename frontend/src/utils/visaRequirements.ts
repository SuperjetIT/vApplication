export interface DocumentRequirement {
  id: string
  name: string
  description: string
  required: boolean
  maxSizeMB: number
  allowedTypes: string[]
  condition?: string
}

export interface VisaRequirement {
  required: boolean
  visaType: 'not_required' | 'evisa' | 'on_arrival' | 'embassy' | 'not_eligible'
  fee: string
  currency: string
  processingTime: string
  validity: string
  maxStay: string
  entries: 'single' | 'multiple' | 'unlimited'
  documents: DocumentRequirement[]
  notes: string[]
  source: string
}

export const RESIDENCY_STATUS_OPTIONS = [
  { id: 'Citizen', label: '🏠 Citizen' },
  { id: 'Permanent Resident', label: '📋 Permanent Resident' },
  { id: 'Work Visa', label: '💼 Work Visa' },
  { id: 'Student Visa', label: '🎓 Student Visa' },
  { id: 'Tourist/Visit', label: '✈️ Tourist/Visit' },
  { id: 'Other', label: '❓ Other' },
] as const

export type ResidencyStatus = (typeof RESIDENCY_STATUS_OPTIONS)[number]['id']

function isUae(country: string): boolean {
  const n = country.toLowerCase()
  return n === 'uae' || n.includes('united arab emirates') || n.includes('emirates')
}

export function getVisaRequirements(
  passportCountry: string,
  residenceCountry: string,
  residencyStatus: string,
  destinationCountry: string,
): VisaRequirement {
  const baseDocs: DocumentRequirement[] = [
    {
      id: 'passport',
      name: 'Passport',
      description: 'Valid for at least 6 months beyond travel date',
      required: true,
      maxSizeMB: 15,
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    },
    {
      id: 'photo',
      name: 'Passport Photo',
      description: 'White background, taken within 6 months',
      required: true,
      maxSizeMB: 5,
      allowedTypes: ['image/jpeg', 'image/png'],
    },
  ]

  const residenceDocs: DocumentRequirement[] = []
  if (isUae(residenceCountry)) {
    if (residencyStatus !== 'Tourist/Visit' && residencyStatus !== 'Other') {
      residenceDocs.push(
        {
          id: 'emirates_id',
          name: 'Emirates ID',
          description: 'Front and back copy, must be valid',
          required: true,
          maxSizeMB: 10,
          allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
          condition: `${residenceCountry} Resident`,
        },
        {
          id: 'uae_visa',
          name: 'UAE Residence Visa',
          description: 'Copy of UAE residence visa page',
          required: true,
          maxSizeMB: 10,
          allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
          condition: `${residenceCountry} Resident`,
        },
      )
    } else {
      residenceDocs.push({
        id: 'uae_entry',
        name: 'UAE Entry Stamp / Visit Visa',
        description: `Proof of current stay in ${residenceCountry}`,
        required: true,
        maxSizeMB: 10,
        allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        condition: `${residenceCountry} Visitor`,
      })
    }
  } else if (residenceCountry.toLowerCase() !== passportCountry.toLowerCase()) {
    residenceDocs.push({
      id: 'residence_permit',
      name: `${residenceCountry} Residence Permit`,
      description: `Proof of legal residence in ${residenceCountry}`,
      required: true,
      maxSizeMB: 10,
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      condition: `Resident of ${residenceCountry}`,
    })
    if (residencyStatus === 'Work Visa') {
      residenceDocs.push({
        id: 'employment_letter',
        name: 'Employment Letter / Work Permit',
        description: 'Letter from employer confirming employment',
        required: true,
        maxSizeMB: 10,
        allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      })
    }
    if (residencyStatus === 'Student Visa') {
      residenceDocs.push({
        id: 'enrollment_letter',
        name: 'Student Enrollment Letter',
        description: 'Confirmation from educational institution',
        required: true,
        maxSizeMB: 10,
        allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      })
    }
  }

  const destinationDocs: DocumentRequirement[] = []
  const dest = destinationCountry.toLowerCase()
  const schengenCountries = [
    'france', 'germany', 'italy', 'spain', 'portugal', 'netherlands', 'schengen',
    'belgium', 'austria', 'switzerland', 'greece', 'czech', 'poland', 'sweden',
    'norway', 'denmark', 'finland',
  ]
  const isSchengen = schengenCountries.some((c) => dest.includes(c))

  if (isSchengen) {
    destinationDocs.push(
      { id: 'bank_statement', name: 'Bank Statement', description: '3-6 months, showing sufficient funds', required: true, maxSizeMB: 10, allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'] },
      { id: 'salary_cert', name: 'Salary Certificate / NOC', description: 'From employer, on company letterhead', required: true, maxSizeMB: 10, allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'] },
      { id: 'hotel_booking', name: 'Hotel Booking', description: 'Confirmed accommodation for entire stay', required: true, maxSizeMB: 5, allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'] },
      { id: 'flight_booking', name: 'Flight Booking', description: 'Return flight confirmation', required: true, maxSizeMB: 5, allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'] },
      { id: 'travel_insurance', name: 'Travel Insurance', description: 'Minimum €30,000 coverage for Schengen area', required: true, maxSizeMB: 5, allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'] },
      { id: 'itinerary', name: 'Travel Itinerary', description: 'Day-by-day travel plan', required: false, maxSizeMB: 5, allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'] },
    )
  } else if (dest.includes('uk') || dest.includes('united-kingdom')) {
    destinationDocs.push(
      { id: 'bank_statement', name: 'Bank Statement', description: '6 months bank statements', required: true, maxSizeMB: 10, allowedTypes: ['application/pdf'] },
      { id: 'employment_docs', name: 'Employment Documents', description: 'Payslips, employment letter', required: true, maxSizeMB: 10, allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'] },
      { id: 'hotel_booking', name: 'Hotel / Accommodation', description: 'Where you will stay in UK', required: true, maxSizeMB: 5, allowedTypes: ['application/pdf'] },
      { id: 'flight_booking', name: 'Flight Booking', description: 'Return flight tickets', required: true, maxSizeMB: 5, allowedTypes: ['application/pdf'] },
    )
  } else if (dest.includes('usa') || dest.includes('united-states')) {
    destinationDocs.push(
      { id: 'ds160', name: 'DS-160 Form', description: 'Online nonimmigrant visa application form', required: true, maxSizeMB: 5, allowedTypes: ['application/pdf'] },
      { id: 'bank_statement', name: 'Bank Statement', description: '6 months statements showing financial stability', required: true, maxSizeMB: 10, allowedTypes: ['application/pdf'] },
      { id: 'employment_letter', name: 'Employment Letter', description: 'Confirming employment and approved leave', required: true, maxSizeMB: 10, allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'] },
      { id: 'property_docs', name: 'Property / Ties to Home Country', description: 'Documents proving you will return home', required: false, maxSizeMB: 10, allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'] },
    )
  } else {
    destinationDocs.push(
      { id: 'bank_statement', name: 'Bank Statement', description: '3 months recent statements', required: true, maxSizeMB: 10, allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'] },
      { id: 'hotel_booking', name: 'Hotel Booking', description: 'Accommodation confirmation', required: false, maxSizeMB: 5, allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'] },
      { id: 'flight_booking', name: 'Return Flight', description: 'Return flight booking', required: false, maxSizeMB: 5, allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'] },
    )
  }

  const allDocs = [...baseDocs, ...residenceDocs, ...destinationDocs]

  const visaFreePassports: Record<string, string[]> = {
    schengen: ['USA', 'UK', 'Canada', 'Australia', 'Japan', 'South Korea', 'UAE'],
    thailand: ['USA', 'UK', 'UAE', 'Australia', 'Japan'],
    kenya: ['Uganda', 'Tanzania', 'Rwanda'],
    malaysia: ['USA', 'UK', 'UAE', 'Australia'],
  }

  const destKey = dest.replace('-visa', '').replace(/\s/g, '')
  const visaFreeList = visaFreePassports[destKey] ?? []
  const isVisaFree = visaFreeList.some((c) =>
    passportCountry.toLowerCase().includes(c.toLowerCase()),
  )

  return {
    required: !isVisaFree,
    visaType: isVisaFree ? 'not_required' : 'evisa',
    fee: 'AED 185',
    currency: 'AED',
    processingTime: '3-5 business days',
    validity: '30 days',
    maxStay: '30 days',
    entries: 'single',
    documents: allDocs,
    notes: [
      'All documents must be in English or officially translated',
      'Visa approval is at the sole discretion of the embassy',
      'Processing times may vary during peak seasons',
    ],
    source: 'mock',
  }
}

// FUTURE: Replace mock data with real API
//
// SHERPA API (recommended):
// https://developer.joinsherpa.com
// Endpoint: GET /v2/requirement-sets
// Params: passport_country, residence_country, destination
// Free sandbox available
//
// AMADEUS API:
// https://developers.amadeus.com
// Endpoint: /v1/duty-of-care/diseases/covid19-area-report
// Travel restrictions + visa requirements
//
// IMPLEMENTATION:
// export async function getVisaRequirementsFromAPI(
//   passportCountry: string,
//   residenceCountry: string,
//   destination: string
// ): Promise<VisaRequirement> {
//   const response = await fetch(
//     `https://api.joinsherpa.com/v2/requirement-sets?
//      affiliateId=${SHERPA_API_KEY}&
//      passengerNationality=${passportCountry}&
//      residenceCountry=${residenceCountry}&
//      destination=${destination}`,
//     { headers: { Authorization: `Bearer ${SHERPA_API_KEY}` } }
//   )
//   const data = await response.json()
//   return transformSherpaResponse(data)
// }
