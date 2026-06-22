import { ALL_CITIZENSHIPS } from '../data/citizenships'
import type { PassportData } from './passportOCR'

const MRZ_NATIONALITY: Record<string, string> = {
  IND: 'India',
  PAK: 'Pakistan',
  BGD: 'Bangladesh',
  PHL: 'Philippines',
  NPL: 'Nepal',
  LKA: 'Sri Lanka',
  EGY: 'Egypt',
  ARE: 'United Arab Emirates',
  GBR: 'United Kingdom',
  USA: 'United States',
  KEN: 'Kenya',
  NGA: 'Nigeria',
  GHA: 'Ghana',
  JOR: 'Jordan',
  LBN: 'Lebanon',
  SYR: 'Syria',
  ETH: 'Ethiopia',
  IDN: 'Indonesia',
  MYS: 'Malaysia',
  THA: 'Thailand',
  VNM: 'Vietnam',
  CHN: 'China',
  JPN: 'Japan',
  KOR: 'South Korea',
  AUS: 'Australia',
  CAN: 'Canada',
  DEU: 'Germany',
  FRA: 'France',
  SAU: 'Saudi Arabia',
  QAT: 'Qatar',
  KWT: 'Kuwait',
  BHR: 'Bahrain',
  OMN: 'Oman',
  TUR: 'Turkey',
  MAR: 'Morocco',
  AFG: 'Afghanistan',
}

export function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function ocrDateToDisplay(ddmmyyyy: string): string {
  const parts = ddmmyyyy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!parts) return ddmmyyyy
  const d = new Date(
    Number.parseInt(parts[3], 10),
    Number.parseInt(parts[2], 10) - 1,
    Number.parseInt(parts[1], 10),
  )
  if (Number.isNaN(d.getTime())) return ddmmyyyy
  return formatDateLabel(d)
}

export function mapNationalityFromOcr(value: string, rawText = ''): string {
  const tryCode = (code: string): string => {
    const upper = code.toUpperCase().trim()
    if (!upper) return ''
    if (MRZ_NATIONALITY[upper]) return MRZ_NATIONALITY[upper]
    const byCode = ALL_CITIZENSHIPS.find((c) => c.code === upper)
    return byCode?.name ?? ''
  }

  const fromValue = value.trim()
  if (fromValue) {
    const fromCode = tryCode(fromValue)
    if (fromCode) return fromCode
    const exact = ALL_CITIZENSHIPS.find((c) => c.name.toLowerCase() === fromValue.toLowerCase())
    if (exact) return exact.name
    const partial = ALL_CITIZENSHIPS.find(
      (c) =>
        c.name.toLowerCase().includes(fromValue.toLowerCase()) ||
        fromValue.toLowerCase().includes(c.name.toLowerCase()),
    )
    if (partial) return partial.name
  }

  if (rawText) {
    const lines = rawText
      .split('\n')
      .map((l) => l.toUpperCase().replace(/[^A-Z0-9<]/g, ''))
      .filter((l) => l.length >= 28)
    for (const line of lines) {
      const codes: string[] = []
      if (line.startsWith('P<')) codes.push(line.slice(2, 5).replace(/</g, ''))
      if (line.length >= 13) codes.push(line.slice(10, 13).replace(/</g, ''))
      for (const code of codes) {
        const mapped = tryCode(code)
        if (mapped) return mapped
      }
    }
  }

  return ''
}

export type PassportAutoFillFields = {
  firstName?: string
  lastName?: string
  passportNumber?: string
  dateOfBirth?: string
  passportExpiry?: string
  nationality?: string
}

export function buildPassportAutoFill(
  data: PassportData,
  shouldAutoFill: boolean,
): { fields: PassportAutoFillFields; filledKeys: string[]; displayData: PassportData } {
  const mappedNationality = mapNationalityFromOcr(data.nationality, data.rawText)
  const displayDob = data.dateOfBirth ? ocrDateToDisplay(data.dateOfBirth) : ''
  const displayExpiry = data.expiryDate ? ocrDateToDisplay(data.expiryDate) : ''

  const displayData: PassportData = {
    ...data,
    nationality: mappedNationality || data.nationality,
    dateOfBirth: displayDob || data.dateOfBirth,
    expiryDate: displayExpiry || data.expiryDate,
  }

  if (!shouldAutoFill) {
    return { fields: {}, filledKeys: [], displayData }
  }

  const fields: PassportAutoFillFields = {}
  const filledKeys: string[] = []

  if (data.firstName) {
    fields.firstName = data.firstName.toUpperCase()
    filledKeys.push('firstName')
  }
  if (data.lastName) {
    fields.lastName = data.lastName.toUpperCase()
    filledKeys.push('lastName')
  }
  if (data.passportNumber) {
    fields.passportNumber = data.passportNumber.toUpperCase()
    filledKeys.push('passportNumber')
  }
  if (displayDob) {
    fields.dateOfBirth = displayDob
    filledKeys.push('dateOfBirth')
  }
  if (displayExpiry) {
    fields.passportExpiry = displayExpiry
    filledKeys.push('passportExpiry')
  }
  if (mappedNationality) {
    fields.nationality = mappedNationality
    filledKeys.push('nationality')
  }

  return { fields, filledKeys, displayData }
}
