import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import { getStripePromise, isStripeConfigured, isStripeMockCheckout, isStripeTestMode } from '../config/stripe'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCitizenship } from '../context/CitizenshipContext'
import { ALL_CITIZENSHIPS } from '../data/citizenships'
import { getCountry, type Country, type VisaOption } from '../data/countries'
import { ResidenceSelector } from '../components/ResidenceSelector'
import { SiteFooter } from '../components/SiteFooter'
import { flagUrl } from '../utils/flags'
import { CountryFlag } from '../components/CountryFlag'
import { scanPassportDocument, getPreferredOcrEngine, isOcrAutoFillEnabled } from '../utils/scanPassportDocument'
import { buildPassportAutoFill } from '../utils/passportOcrHelpers'
import {
  formatFullPhone,
  getDialCodeByCountryCode,
  getPhoneCodeOptions,
  getPhonePlaceholder,
  resolveDefaultPhoneCountry,
} from '../utils/phoneDialCodes'
import type { PassportData } from '../utils/passportOCR'
import { Database } from '../database/db'
import { notifyAdminB2CApplication, notifyAdminNewUser } from '../utils/adminNotifications'
import { syncApplicationToServer } from '../utils/applicationSync'
import { syncUserToServer } from '../utils/userSync'
import {
  isUserLoggedIn,
  saveRedirectUrl,
  USER_REF_KEY,
} from '../utils/authGate'
import { readFileAsDataUrl } from '../utils/applicationDocuments'
import { resolveNationalityDisplay } from '../utils/nationality'
import {
  getVisaRequirements,
  type DocumentRequirement,
  type ResidencyStatus,
} from '../utils/visaRequirements'

const BRAND = '#f93e42'
const ACCENT = '#5057ea'
const GREEN = '#22c55e'
const ORANGE = '#f59e0b'
const BG_GRADIENT =
  'linear-gradient(135deg, #f5e6ff 0%, #ffeaea 30%, #fff0e6 60%, #e6f0ff 100%)'

type ApplyStep = 'personal' | 'travel' | 'docs' | 'appt' | 'checkout'

const STEPS: ApplyStep[] = ['personal', 'travel', 'docs', 'appt', 'checkout']
const STEP_PROGRESS: Record<ApplyStep, number> = {
  personal: 0,
  travel: 25,
  docs: 50,
  appt: 75,
  checkout: 90,
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const TRAVEL_PURPOSES = ['Tourist', 'Business', 'Family Visit', 'Student', 'Medical', 'Transit'] as const
const OCCUPATIONS = [
  'Employed', 'Self Employed', 'Business Owner', 'Student', 'Homemaker', 'Retired', 'Other',
] as const

type SalaryCurrencyOption = { code: string; label: string }

const BASE_SALARY_CURRENCIES: SalaryCurrencyOption[] = [
  { code: 'AED', label: 'AED' },
  { code: 'USD', label: 'USD' },
  { code: 'EUR', label: 'EUR' },
  { code: 'GBP', label: 'GBP' },
]

/** Local currency shown when traveller nationality is set (e.g. India → INR). */
const NATIONALITY_SALARY_CURRENCY: Record<string, SalaryCurrencyOption> = {
  India: { code: 'INR', label: 'INR (₹)' },
  Pakistan: { code: 'PKR', label: 'PKR (Rs)' },
  Bangladesh: { code: 'BDT', label: 'BDT (৳)' },
  Philippines: { code: 'PHP', label: 'PHP (₱)' },
  Nepal: { code: 'NPR', label: 'NPR (Rs)' },
  'Sri Lanka': { code: 'LKR', label: 'LKR (Rs)' },
  Egypt: { code: 'EGP', label: 'EGP' },
  Kenya: { code: 'KES', label: 'KES' },
  Nigeria: { code: 'NGN', label: 'NGN (₦)' },
  Ghana: { code: 'GHS', label: 'GHS' },
  Ethiopia: { code: 'ETB', label: 'ETB' },
  Jordan: { code: 'JOD', label: 'JOD' },
  Lebanon: { code: 'LBP', label: 'LBP' },
  Indonesia: { code: 'IDR', label: 'IDR (Rp)' },
  Thailand: { code: 'THB', label: 'THB (฿)' },
  Vietnam: { code: 'VND', label: 'VND (₫)' },
  Malaysia: { code: 'MYR', label: 'MYR (RM)' },
  'Saudi Arabia': { code: 'SAR', label: 'SAR' },
  Qatar: { code: 'QAR', label: 'QAR' },
  Kuwait: { code: 'KWD', label: 'KWD' },
  Bahrain: { code: 'BHD', label: 'BHD' },
  Oman: { code: 'OMR', label: 'OMR' },
}

type TravelerForm = {
  firstName: string
  lastName: string
  dateOfBirth: string
  passportNumber: string
  passportExpiry: string
  uaeVisaExpiry: string
  emiratesIdExpiry: string
  mobile: string
  mobileCountryCode: string
  email: string
  nationality: string
  gender: string
  passportFile?: File
  /** Additional travellers only — when false, skip applicant residence visa / ID fields. */
  livesInApplicantResidence?: boolean
}

type TravelInfo = {
  purpose: string
  occupation: string
  companyName: string
  salary: string
  salaryCurrency: string
  bankStatementAvailable: 'yes' | 'no' | ''
  previousRejection: 'yes' | 'no' | ''
  rejectionDetails: string
  agentReferral: string
}

type UploadEntry = { fileName: string; sizeMb: string; fromPersonalStep?: boolean; fileData?: string; mimeType?: string }

function passportUploadKey(travelerIndex: number): string {
  return `${travelerIndex}-passport`
}

function buildPassportUploadEntry(file: File, fromPersonalStep = true): UploadEntry {
  return {
    fileName: file.name,
    sizeMb: formatFileSize(file.size),
    fromPersonalStep,
  }
}

function syncPassportFilesToUploads(
  travelers: TravelerForm[],
  uploads: Record<string, UploadEntry>,
): Record<string, UploadEntry> {
  let next = uploads
  let changed = false
  travelers.forEach((traveler, index) => {
    const file = traveler.passportFile
    const key = passportUploadKey(index)
    if (!file) return
    const entry = buildPassportUploadEntry(file, true)
    const existing = next[key]
    if (!existing || existing.fileName !== entry.fileName || existing.sizeMb !== entry.sizeMb) {
      if (!changed) {
        next = { ...uploads }
        changed = true
      }
      next[key] = entry
    }
  })
  return next
}

function getTravelerDocEntry(
  travelerIndex: number,
  docId: string,
  traveler: TravelerForm,
  uploads: Record<string, UploadEntry>,
): UploadEntry | undefined {
  const key = `${travelerIndex}-${docId}`
  if (uploads[key]) return uploads[key]
  if (docId === 'passport' && traveler.passportFile) {
    return buildPassportUploadEntry(traveler.passportFile, true)
  }
  return undefined
}

function hasTravelerDocUploaded(
  travelerIndex: number,
  doc: DocDef,
  traveler: TravelerForm,
  uploads: Record<string, UploadEntry>,
  uploadErrors: Record<string, string>,
): boolean {
  const key = `${travelerIndex}-${doc.id}`
  if (uploadErrors[key]) return false
  return Boolean(getTravelerDocEntry(travelerIndex, doc.id, traveler, uploads))
}

type FormData = {
  travelers: TravelerForm[]
  travelInfo: TravelInfo
  uploads: Record<string, UploadEntry>
  departureDate: Date | null
  returnDate: Date | null
}

type ApplySessionSnapshot = {
  formData: {
    travelers: Omit<TravelerForm, 'passportFile'>[]
    travelInfo: TravelInfo
    uploads: Record<string, UploadEntry>
    departureDate: string | null
    returnDate: string | null
  }
  stepDone: {
    personal: boolean
    travel: boolean
    docs: boolean
    appt: boolean
  }
}

function applySessionKey(destination: string, optionId: string) {
  return `apply_session_${destination}_${optionId}`
}

function loadApplySession(destination: string, optionId: string): ApplySessionSnapshot | null {
  try {
    const raw = sessionStorage.getItem(applySessionKey(destination, optionId))
    if (!raw) return null
    return JSON.parse(raw) as ApplySessionSnapshot
  } catch {
    return null
  }
}

function saveApplySession(destination: string, optionId: string, formData: FormData, stepDone: ApplySessionSnapshot['stepDone']) {
  const snapshot: ApplySessionSnapshot = {
    formData: {
      travelers: formData.travelers.map(({ passportFile: _file, ...rest }) => rest),
      travelInfo: formData.travelInfo,
      uploads: sanitizeUploadsForSession(formData.uploads),
      departureDate: formData.departureDate?.toISOString() ?? null,
      returnDate: formData.returnDate?.toISOString() ?? null,
    },
    stepDone,
  }
  try {
    sessionStorage.setItem(applySessionKey(destination, optionId), JSON.stringify(snapshot))
  } catch {
    /* Passport scans can exceed sessionStorage quota — keep in-memory state only */
  }
}

function sanitizeUploadsForSession(uploads: Record<string, UploadEntry>): Record<string, UploadEntry> {
  const next: Record<string, UploadEntry> = {}
  for (const [key, entry] of Object.entries(uploads)) {
    next[key] = {
      fileName: entry.fileName,
      sizeMb: entry.sizeMb,
      fromPersonalStep: entry.fromPersonalStep,
    }
  }
  return next
}

function loadInitialApplyBundle(destination: string, optionId: string): {
  formData: FormData
  stepDone: ApplySessionSnapshot['stepDone']
} {
  const defaultForm: FormData = {
    travelers: [emptyTraveler()],
    travelInfo: emptyTravelInfo(),
    uploads: {},
    departureDate: null,
    returnDate: null,
  }
  const defaultStepDone = { personal: false, travel: false, docs: false, appt: false }
  if (!destination || !optionId) {
    return { formData: defaultForm, stepDone: defaultStepDone }
  }
  const saved = loadApplySession(destination, optionId)
  if (!saved) {
    return { formData: defaultForm, stepDone: defaultStepDone }
  }
  const travelers = Array.isArray(saved.formData.travelers) && saved.formData.travelers.length > 0
    ? saved.formData.travelers
    : defaultForm.travelers
  return {
    formData: {
      ...restoreFormData({ ...saved.formData, travelers }),
    },
    stepDone: { ...defaultStepDone, ...saved.stepDone },
  }
}

function restoreFormData(snapshot: ApplySessionSnapshot['formData']): FormData {
  return {
    travelers: snapshot.travelers.map((t) => ({ ...t, passportFile: undefined })),
    travelInfo: snapshot.travelInfo,
    uploads: snapshot.uploads,
    departureDate: snapshot.departureDate ? new Date(snapshot.departureDate) : null,
    returnDate: snapshot.returnDate ? new Date(snapshot.returnDate) : null,
  }
}

type DocDef = {
  id: string
  name: string
  description: string
  required: boolean
  accept: string
  mimeTypes: string[]
  extensions: string[]
  maxBytes: number
  typeError: string
  sizeError: string
  condition?: string
}

function isUaeResidence(country: string): boolean {
  const n = country.toLowerCase()
  return n === 'uae' || n.includes('united arab emirates') || n.includes('emirates')
}

function getResidenceFieldRequirements(
  residenceCountry: string,
  passportCountry: string,
  residencyStatus: string,
) {
  if (isUaeResidence(residenceCountry)) {
    if (residencyStatus === 'Tourist/Visit' || residencyStatus === 'Other') {
      return { showPermitExpiry: true, showEmiratesId: false, permitLabel: 'Entry Permit Expiry Date *' }
    }
    return {
      showPermitExpiry: true,
      showEmiratesId: true,
      permitLabel: 'Residence Visa Expiry Date *',
      emiratesLabel: 'Emirates ID Expiry Date *',
    }
  }
  if (residenceCountry.toLowerCase() !== passportCountry.toLowerCase()) {
    return {
      showPermitExpiry: true,
      showEmiratesId: false,
      permitLabel: `${residenceCountry} Residence Permit Expiry *`,
    }
  }
  return { showPermitExpiry: false, showEmiratesId: false, permitLabel: '' }
}

function applicantHasResidenceDocumentation(residenceCountry: string, residencyStatus: string): boolean {
  return getResidenceFieldRequirements(residenceCountry, 'Other', residencyStatus).showPermitExpiry
}

function getTravelerResidenceFieldRequirements(
  traveler: TravelerForm,
  travelerIndex: number,
  residenceCountry: string,
  residencyStatus: string,
) {
  const passportCountry = resolveNationalityName(traveler.nationality) || traveler.nationality
  const usesApplicantResidence =
    travelerIndex === 0 || traveler.livesInApplicantResidence === true
  if (!usesApplicantResidence) {
    return { showPermitExpiry: false, showEmiratesId: false, permitLabel: '', emiratesLabel: '' }
  }
  return getResidenceFieldRequirements(residenceCountry, passportCountry, residencyStatus)
}

function travelerUsesApplicantResidence(traveler: TravelerForm, travelerIndex: number): boolean {
  return travelerIndex === 0 || traveler.livesInApplicantResidence === true
}

function docAppliesToTraveler(
  doc: DocDef,
  traveler: TravelerForm,
  travelerIndex: number,
  residenceCountry: string,
  residencyStatus: string,
): boolean {
  const usesResidence = travelerUsesApplicantResidence(traveler, travelerIndex)
  const passportCountry = resolveNationalityName(traveler.nationality) || traveler.nationality

  if (doc.id === 'emirates_id' || doc.id === 'uae_visa') {
    return (
      usesResidence &&
      isUaeResidence(residenceCountry) &&
      residencyStatus !== 'Tourist/Visit' &&
      residencyStatus !== 'Other'
    )
  }
  if (doc.id === 'uae_entry') {
    return (
      usesResidence &&
      isUaeResidence(residenceCountry) &&
      (residencyStatus === 'Tourist/Visit' || residencyStatus === 'Other')
    )
  }
  if (doc.id === 'residence_permit') {
    if (!usesResidence || isUaeResidence(residenceCountry)) return false
    return residenceCountry.toLowerCase() !== passportCountry.toLowerCase()
  }
  if (doc.id === 'enrollment_letter') {
    return usesResidence && residencyStatus === 'Student Visa'
  }

  return true
}

function getTravelerDocList(
  docList: DocDef[],
  traveler: TravelerForm,
  travelerIndex: number,
  residenceCountry: string,
  residencyStatus: string,
): DocDef[] {
  const seen = new Set<string>()
  return docList.filter((doc) => {
    if (!docAppliesToTraveler(doc, traveler, travelerIndex, residenceCountry, residencyStatus)) return false
    if (seen.has(doc.id)) return false
    seen.add(doc.id)
    return true
  })
}

function mimeToExtensions(types: string[]): string[] {
  const exts: string[] = []
  for (const t of types) {
    if (t === 'application/pdf') exts.push('pdf')
    if (t === 'image/jpeg') exts.push('jpg', 'jpeg')
    if (t === 'image/png') exts.push('png')
  }
  return exts
}

function docRequirementToDocDef(doc: DocumentRequirement): DocDef {
  const extensions = mimeToExtensions(doc.allowedTypes)
  const accept = doc.allowedTypes.concat(extensions.map((e) => `.${e}`)).join(',')
  return {
    id: doc.id,
    name: doc.name,
    description: doc.description,
    required: doc.required,
    accept,
    mimeTypes: doc.allowedTypes,
    extensions,
    maxBytes: doc.maxSizeMB * 1024 * 1024,
    typeError: `Only ${extensions.join(', ').toUpperCase()} accepted`,
    sizeError: `File must be less than ${doc.maxSizeMB}MB`,
    condition: doc.condition,
  }
}

function emptyTraveler(mobileCountryCode = 'ae'): TravelerForm {
  return {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    passportNumber: '',
    passportExpiry: '',
    uaeVisaExpiry: '',
    emiratesIdExpiry: '',
    mobile: '',
    mobileCountryCode,
    email: '',
    nationality: '',
    gender: '',
    livesInApplicantResidence: false,
  }
}

function emptyTravelInfo(): TravelInfo {
  return {
    purpose: '',
    occupation: '',
    companyName: '',
    salary: '',
    salaryCurrency: 'AED',
    bankStatementAvailable: '',
    previousRejection: '',
    rejectionDetails: '',
    agentReferral: '',
  }
}

function normalizeStep(param: string | null): ApplyStep {
  if (param === 'travelers') return 'personal'
  if (STEPS.includes(param as ApplyStep)) return param as ApplyStep
  return 'personal'
}

function parseFeeAed(fee: string): number {
  const match = fee.match(/(\d+)/)
  return match ? Number.parseInt(match[1], 10) : 0
}

function parseProcessingDaysMax(processingTime: string): number {
  if (processingTime === 'Instant' || processingTime === 'Not applicable') return 0
  const nums = processingTime.match(/\d+/g)?.map((n) => Number.parseInt(n, 10)) ?? [5]
  return nums[nums.length - 1] ?? 5
}

function parseValidityDays(validity: string): number {
  const v = validity.toLowerCase()
  const years = v.match(/(\d+)\s*years?/)
  if (years) return Number.parseInt(years[1], 10) * 365
  const year = v.match(/(\d+)\s*year/)
  if (year) return Number.parseInt(year[1], 10) * 365
  const days = v.match(/(\d+)\s*days?/)
  if (days) return Number.parseInt(days[1], 10)
  const months = v.match(/(\d+)\s*months?/)
  if (months) return Number.parseInt(months[1], 10) * 30
  return 30
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function parseDobDisplay(value: string): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) return parsed
  const parts = value.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/)
  if (parts) {
    const d = new Date(`${parts[2]} ${parts[3]} ${parts[1]}`)
    if (!Number.isNaN(d.getTime())) return d
  }
  return null
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return startOfDay(d)
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return startOfDay(d)
}

function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return `(${mb < 0.1 ? '<0.1' : mb.toFixed(1)} MB)`
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

const passportLengthRules: Record<string, { min: number; max: number; pattern: string }> = {
  India: { min: 8, max: 8, pattern: '[A-Z][0-9]{7}' },
  Pakistan: { min: 8, max: 9, pattern: '[A-Z]{2}[0-9]{7}' },
  UAE: { min: 9, max: 9, pattern: '[A-Z0-9]{9}' },
  UK: { min: 9, max: 9, pattern: '[0-9]{9}' },
  USA: { min: 9, max: 9, pattern: '[A-Z0-9]{9}' },
  Philippines: { min: 7, max: 8, pattern: '[A-Z][0-9]{6,7}' },
  Bangladesh: { min: 8, max: 9, pattern: '[A-Z]{2}[0-9]{7}' },
  Kenya: { min: 8, max: 9, pattern: '[A-Z][0-9]{7,8}' },
  Egypt: { min: 9, max: 9, pattern: '[A-Z][0-9]{8}' },
  Nigeria: { min: 8, max: 9, pattern: '[A-Z][0-9]{7,8}' },
  'Sri Lanka': { min: 8, max: 9, pattern: '[A-Z][0-9]{7,8}' },
  Indonesia: { min: 7, max: 9, pattern: '[A-Z0-9]{7,9}' },
  Nepal: { min: 8, max: 8, pattern: '[A-Z][0-9]{7}' },
  default: { min: 6, max: 20, pattern: '[A-Z0-9]+' },
}

const nationalityPassportAliases: Record<string, string> = {
  'United Arab Emirates': 'UAE',
  'United States': 'USA',
  'United Kingdom': 'UK',
}

function getPassportRule(nationality: string) {
  const resolved = resolveNationalityName(nationality) || nationality.trim()
  const key = nationalityPassportAliases[resolved] ?? resolved
  return passportLengthRules[key] ?? passportLengthRules.default
}

function sanitizePassportNumber(value: string): string {
  return value.replace(/[^A-Z0-9]/gi, '').toUpperCase()
}

function normalizePassportForNationality(value: string, nationality: string): string {
  const sanitized = sanitizePassportNumber(value)
  const resolved = resolveNationalityName(nationality) || nationality.trim()
  if (!resolved || !sanitized) return sanitized
  const rule = getPassportRule(resolved)
  if (sanitized.length <= rule.max) return sanitized
  const trimmed = sanitized.slice(0, rule.max)
  if (validatePassportNumber(trimmed, resolved).valid) return trimmed
  return sanitized.slice(0, rule.max)
}

function validatePassportNumber(
  value: string,
  nationality: string,
): { valid: boolean; error: string | null } {
  const trimmed = sanitizePassportNumber(value).trim()
  if (!trimmed) return { valid: false, error: null }
  const rule = getPassportRule(nationality)
  const len = trimmed.length
  if (len < rule.min || len > rule.max) {
    return {
      valid: false,
      error: `Invalid passport number for ${nationality || 'this'} passport (expected ${rule.min}-${rule.max} characters)`,
    }
  }
  const regex = new RegExp(`^${rule.pattern}$`)
  if (!regex.test(trimmed)) {
    return {
      valid: false,
      error: `Invalid passport number for ${nationality || 'this'} passport (expected ${rule.min}-${rule.max} characters)`,
    }
  }
  return { valid: true, error: null }
}

function resolveNationalityName(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const exact = ALL_CITIZENSHIPS.find((c) => c.name.toLowerCase() === trimmed.toLowerCase())
  if (exact) return exact.name
  const byCode = ALL_CITIZENSHIPS.find((c) => c.code.toLowerCase() === trimmed.toLowerCase())
  return byCode?.name ?? ''
}

function getSalaryCurrencyOptions(nationality: string): SalaryCurrencyOption[] {
  const resolved = resolveNationalityName(nationality) || nationality.trim()
  const local = resolved ? NATIONALITY_SALARY_CURRENCY[resolved] : undefined
  if (!local) return BASE_SALARY_CURRENCIES
  if (BASE_SALARY_CURRENCIES.some((c) => c.code === local.code)) return BASE_SALARY_CURRENCIES
  return [local, ...BASE_SALARY_CURRENCIES]
}

function isTravelerComplete(
  t: TravelerForm,
  travelerIndex: number,
  residenceCountry: string,
  residencyStatus: string,
): boolean {
  const nationality = resolveNationalityName(t.nationality)
  const fields = getTravelerResidenceFieldRequirements(t, travelerIndex, residenceCountry, residencyStatus)
  const base =
    t.firstName.trim() &&
    t.lastName.trim() &&
    t.dateOfBirth &&
    t.passportNumber.trim() &&
    t.passportExpiry &&
    t.mobile.trim() &&
    t.email.trim() &&
    isValidEmail(t.email) &&
    nationality &&
    validatePassportNumber(t.passportNumber, nationality).valid
  if (!base) return false
  if (fields.showPermitExpiry && !t.uaeVisaExpiry) return false
  if (fields.showEmiratesId && !t.emiratesIdExpiry) return false
  return true
}

function isTravelInfoComplete(info: TravelInfo): boolean {
  if (!info.purpose || !info.occupation || !info.bankStatementAvailable || !info.previousRejection) {
    return false
  }
  if (
    (info.occupation === 'Employed' || info.occupation === 'Business Owner') &&
    !info.companyName.trim()
  ) {
    return false
  }
  if (
    (info.occupation === 'Employed' || info.occupation === 'Self Employed') &&
    !info.salary.trim()
  ) {
    return false
  }
  if (info.previousRejection === 'yes' && !info.rejectionDetails.trim()) return false
  return true
}

const borderInputStyle: CSSProperties = {
  width: '100%',
  border: 'none',
  borderBottom: '1px solid #ddd',
  borderRadius: 0,
  padding: '10px 0',
  fontSize: 14,
  boxSizing: 'border-box',
  marginTop: 6,
  background: 'transparent',
  outline: 'none',
}

const labelStyle: CSSProperties = { fontSize: 13, fontWeight: 600, color: '#333' }

function AutoFilledBadge() {
  return (
    <span
      style={{
        background: '#f0fff4',
        color: '#16a34a',
        borderRadius: 20,
        padding: '2px 8px',
        fontSize: 10,
        fontWeight: 500,
      }}
    >
      Auto-filled
    </span>
  )
}

function FieldHintBadge({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        background: '#f0fff4',
        color: '#16a34a',
        borderRadius: 6,
        padding: '3px 8px',
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

function calculateAgeYears(dob: Date, today: Date): number {
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1
  }
  return age
}

function monthsUntilExpiry(expiry: Date, today: Date): number {
  return (
    (expiry.getFullYear() - today.getFullYear()) * 12 +
    (expiry.getMonth() - today.getMonth()) +
    (expiry.getDate() >= today.getDate() ? 0 : -1)
  )
}

function getDateFieldHint(value: string, mode: 'dob' | 'expiry'): string | null {
  const parsed = parseDobDisplay(value)
  if (!parsed) return null
  const today = startOfDay(new Date())
  if (mode === 'dob') {
    if (parsed > today) return null
    const age = calculateAgeYears(parsed, today)
    return `${age} yrs`
  }
  const months = monthsUntilExpiry(parsed, today)
  if (months < 0) return 'Expired'
  return `${months} mo`
}

function FieldLabel({ children, autoFilled }: { children: ReactNode; autoFilled?: boolean }) {
  return (
    <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {children}
      {autoFilled && <AutoFilledBadge />}
    </label>
  )
}

function PassportDocIcon({ size = 20, color = ACCENT }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="2" width="18" height="20" rx="2" stroke={color} strokeWidth="1.5" />
      <circle cx="12" cy="10" r="3" stroke={color} strokeWidth="1.5" />
      <path d="M6 21v-1a6 6 0 0 1 12 0v1" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

function PassportUploadSection({
  isScanning,
  scanProgress,
  scanResult,
  scannedData,
  previewUrl,
  isPdf,
  onUpload,
  onRescan,
  onTryAgain,
  onFillManually,
}: {
  isScanning: boolean
  scanProgress: number
  scanResult: 'success' | 'failed' | 'pdf' | null
  scannedData: PassportData | null
  previewUrl: string | null
  isPdf: boolean
  onUpload: (file: File) => void
  onRescan: () => void
  onTryAgain: () => void
  onFillManually: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File | undefined) => {
    if (file) onUpload(file)
  }

  const handleRescan = () => {
    onRescan()
    window.setTimeout(() => inputRef.current?.click(), 0)
  }

  const handleTryAgain = () => {
    onTryAgain()
    window.setTimeout(() => inputRef.current?.click(), 0)
  }

  const cornerStyle = (position: 'tl' | 'tr' | 'bl' | 'br'): CSSProperties => {
    const base: CSSProperties = {
      position: 'absolute',
      width: 16,
      height: 16,
      borderColor: ACCENT,
      borderStyle: 'solid',
      borderWidth: 0,
    }
    if (position === 'tl') return { ...base, top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 }
    if (position === 'tr') return { ...base, top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 }
    if (position === 'bl') return { ...base, bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 }
    return { ...base, bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 }
  }

  return (
    <div
      style={{
        background: '#f8f9ff',
        border: '2px dashed #c7d2fe',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <PassportDocIcon />
        <span style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a' }}>Upload Passport for Auto-fill</span>
      </div>
      <p style={{ margin: '4px 0 16px', color: '#888', fontSize: 12 }}>
        Upload passport image or PDF — details will be filled automatically
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        style={{ display: 'none' }}
        onChange={(e) => {
          handleFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      {isScanning && (
        <div>
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 8, height: 80 }}>
            {previewUrl && !isPdf ? (
              <img src={previewUrl} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8 }} />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: 80,
                  background: '#eef2ff',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: ACCENT,
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                PDF
              </div>
            )}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(80,87,234,0.06)',
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              <div className="passport-scan-line" style={{ position: 'absolute', left: 0, right: 0, height: 2 }} />
              <div style={cornerStyle('tl')} />
              <div style={cornerStyle('tr')} />
              <div style={cornerStyle('bl')} />
              <div style={cornerStyle('br')} />
            </div>
          </div>
          <div style={{ background: '#e0e7ff', borderRadius: 40, height: 6, marginTop: 12, overflow: 'hidden' }}>
            <div
              style={{
                background: ACCENT,
                height: '100%',
                borderRadius: 40,
                width: `${scanProgress}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <p style={{ color: ACCENT, fontSize: 13, textAlign: 'center', marginTop: 8, fontWeight: 500 }}>
            Reading passport... {scanProgress}%
          </p>
          <p style={{ color: ACCENT, fontSize: 13, textAlign: 'center', margin: '4px 0 0', fontWeight: 500 }}>
            Scanning
            <span className="passport-scan-dot" style={{ animationDelay: '0s' }}>.</span>
            <span className="passport-scan-dot" style={{ animationDelay: '0.2s' }}>.</span>
            <span className="passport-scan-dot" style={{ animationDelay: '0.4s' }}>.</span>
          </p>
        </div>
      )}

      {!isScanning && scanResult === 'success' && scannedData && (
        <div style={{ background: '#f0fff4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: GREEN,
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              ✓
            </span>
            <span style={{ fontWeight: 700, color: GREEN, fontSize: 14 }}>Passport scanned successfully!</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
            {scannedData.firstName || scannedData.lastName ? (
              <p style={{ margin: 0, fontSize: 13, color: '#374151' }}>
                <strong>Name:</strong> {scannedData.firstName} {scannedData.lastName}
              </p>
            ) : null}
            {scannedData.passportNumber ? (
              <p style={{ margin: 0, fontSize: 13, color: '#374151' }}>
                <strong>Passport No:</strong> {scannedData.passportNumber}
              </p>
            ) : null}
            {scannedData.dateOfBirth ? (
              <p style={{ margin: 0, fontSize: 13, color: '#374151' }}>
                <strong>Date of Birth:</strong> {scannedData.dateOfBirth}
              </p>
            ) : null}
            {scannedData.expiryDate ? (
              <p style={{ margin: 0, fontSize: 13, color: '#374151' }}>
                <strong>Expiry:</strong> {scannedData.expiryDate}
              </p>
            ) : null}
            {scannedData.nationality ? (
              <p style={{ margin: 0, fontSize: 13, color: '#374151' }}>
                <strong>Nationality:</strong> {scannedData.nationality}
              </p>
            ) : null}
            {scannedData.gender ? (
              <p style={{ margin: 0, fontSize: 13, color: '#374151' }}>
                <strong>Gender:</strong> {scannedData.gender}
              </p>
            ) : null}
          </div>
          <p style={{ color: '#16a34a', fontSize: 12, marginTop: 8, marginBottom: 8 }}>
            ✓ All fields filled below — you can edit any detail
          </p>
          <p style={{ color: '#16a34a', fontSize: 12, margin: '0 0 8px' }}>
            ✓ Passport file saved — no need to upload again on the Documents step
          </p>
          <button
            type="button"
            onClick={handleRescan}
            style={{ border: 'none', background: 'none', color: ACCENT, fontSize: 12, cursor: 'pointer', padding: 0 }}
          >
            Re-scan
          </button>
        </div>
      )}

      {!isScanning && scanResult === 'pdf' && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 12, padding: 16, color: '#92400e' }}>
          <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 14 }}>📄 PDF uploaded successfully</p>
          <p style={{ margin: '0 0 6px', fontSize: 12 }}>
            PDF files cannot be auto-scanned. Please fill details manually below.
          </p>
          <p style={{ margin: 0, fontSize: 12 }}>
            Your passport PDF is saved and will be submitted with your application ✓
          </p>
          <button
            type="button"
            onClick={handleRescan}
            style={{ border: 'none', background: 'none', color: ACCENT, fontSize: 12, cursor: 'pointer', padding: 0, marginTop: 10 }}
          >
            Upload a different file
          </button>
        </div>
      )}

      {!isScanning && scanResult === 'failed' && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 12, padding: 16 }}>
          <p style={{ margin: 0, fontWeight: 700, color: '#92400e', fontSize: 14 }}>⚠ Could not read passport clearly</p>
          <p style={{ margin: '4px 0 12px', color: '#92400e', fontSize: 12 }}>
            Tips: ensure good lighting, all 4 corners visible, no glare
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <button type="button" onClick={handleTryAgain} style={{ border: 'none', background: 'none', color: ACCENT, fontSize: 12, cursor: 'pointer', padding: 0 }}>
              Try again
            </button>
            <button type="button" onClick={onFillManually} style={{ border: 'none', background: 'none', color: ACCENT, fontSize: 12, cursor: 'pointer', padding: 0 }}>
              Fill manually
            </button>
          </div>
        </div>
      )}

      {!isScanning && scanResult !== 'success' && scanResult !== 'failed' && scanResult !== 'pdf' && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            handleFile(e.dataTransfer.files?.[0])
          }}
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: 32,
            textAlign: 'center',
            cursor: 'pointer',
            border: '1px dashed #e0e7ff',
          }}
        >
          <svg width={40} height={40} viewBox="0 0 24 24" fill="none" aria-hidden style={{ margin: '0 auto' }}>
            <path d="M12 16V4M12 4l-4 4M12 4l4 4" stroke="#c7d2fe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 20h16" stroke="#c7d2fe" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p style={{ margin: '8px 0 0', fontWeight: 700, color: ACCENT, fontSize: 14 }}>Click to upload passport</p>
          <p style={{ margin: '4px 0 0', color: '#aaa', fontSize: 12 }}>JPG, PNG or PDF — Max 15MB</p>
        </div>
      )}

      <p style={{ color: '#aaa', fontSize: 12, textAlign: 'center', marginTop: 12, marginBottom: 0 }}>
        Prefer to fill manually? Skip upload and complete the form below.
      </p>
    </div>
  )
}

function CheckIconSmall() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M20 6L9 17l-5-5" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PeopleIcon({ color }: { color: string }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3" stroke={color} strokeWidth="1.5" />
      <circle cx="17" cy="9" r="2.5" stroke={color} strokeWidth="1.5" />
      <path d="M3 20c0-3 2.5-5 6-5s6 2 6 5M14 20c0-2.2 1.8-4 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function PlaneIcon({ color }: { color: string }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M2 12h6l2-7 3 14 2-7h7" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DocsIcon({ color }: { color: string }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="3" width="14" height="18" rx="2" stroke={color} strokeWidth="1.5" />
      <path d="M9 8h6M9 12h6M9 16h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CalendarStepIcon({ color }: { color: string }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="15" rx="2" stroke={color} strokeWidth="1.5" />
      <path d="M8 3v4M16 3v4M4 10h16" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

function CartIcon({ color }: { color: string }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6h15l-1.5 9H8L6 6zM6 6L5 3H2M9 20a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="#888" strokeWidth="1.5" />
      <path d="M8 11V8a4 4 0 118 0v3" stroke="#888" strokeWidth="1.5" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z" stroke="#666" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DatePickerField({
  value,
  onChange,
  placeholder,
  mode = 'expiry',
}: {
  value: string
  onChange: (display: string) => void
  placeholder: string
  mode?: 'dob' | 'expiry'
}) {
  const today = startOfDay(new Date())
  const currentYear = today.getFullYear()
  const parsed = parseDobDisplay(value)
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? (mode === 'dob' ? 0 : today.getMonth()))
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? (mode === 'dob' ? 1990 : today.getFullYear()))
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const years =
    mode === 'dob'
      ? Array.from({ length: currentYear - 1940 + 1 }, (_, i) => currentYear - i)
      : Array.from({ length: 30 }, (_, i) => currentYear - 5 + i)

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const startOffset = firstDay === 0 ? 6 : firstDay - 1
  const cells: (number | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const isSameDay = (a: Date, day: number) =>
    a.getFullYear() === viewYear && a.getMonth() === viewMonth && a.getDate() === day

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const isDisabled = (day: number) => {
    const d = startOfDay(new Date(viewYear, viewMonth, day))
    if (mode === 'dob') return d > today
    return false
  }

  const hint = getDateFieldHint(value, mode)

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{
            ...borderInputStyle,
            textAlign: 'left',
            cursor: 'pointer',
            color: value ? '#111' : '#999',
            paddingRight: hint ? 72 : undefined,
          }}
        >
          {value || placeholder}
        </button>
        {hint && (
          <span
            style={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          >
            <FieldHintBadge>{hint}</FieldHintBadge>
          </span>
        )}
      </div>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 8,
            zIndex: 1000,
            background: '#fff',
            borderRadius: 20,
            boxShadow: '0 8px 40px rgba(249,62,66,0.15)',
            border: '1px solid rgba(249,62,66,0.12)',
            padding: 16,
          }}
        >
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <select
              value={viewMonth}
              onChange={(e) => setViewMonth(Number(e.target.value))}
              style={{ flex: 1, border: '1px solid #eee', borderRadius: 10, padding: '8px 10px', fontSize: 13 }}
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
            <select
              value={viewYear}
              onChange={(e) => setViewYear(Number(e.target.value))}
              style={{ flex: 1, border: '1px solid #eee', borderRadius: 10, padding: '8px 10px', fontSize: 13 }}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8, fontSize: 12, fontWeight: 600, color: BRAND, textAlign: 'center' }}>
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {cells.map((day, idx) => {
              if (!day) return <span key={`e-${idx}`} />
              const disabled = isDisabled(day)
              const selected = parsed ? isSameDay(parsed, day) : false
              const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day
              const isHovered = hoveredDay === day && !selected && !disabled
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(formatDateLabel(new Date(viewYear, viewMonth, day)))
                    setOpen(false)
                  }}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  style={{
                    width: 36, height: 36, border: 'none', borderRadius: '50%',
                    cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 14,
                    background: selected ? BRAND : isToday && !selected ? '#fff0f0' : isHovered ? '#fff0f0' : 'transparent',
                    color: disabled ? '#ddd' : selected ? '#fff' : isToday ? BRAND : isHovered ? BRAND : '#111',
                    fontWeight: isToday ? 600 : 400,
                  }}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function DobDatePicker({ value, onChange }: { value: string; onChange: (display: string) => void }) {
  return <DatePickerField value={value} onChange={onChange} placeholder="Select date of birth" mode="dob" />
}

function PassportNumberField({
  value,
  nationality,
  onChange,
  autoFilled,
}: {
  value: string
  nationality: string
  onChange: (value: string) => void
  autoFilled?: boolean
}) {
  const [touched, setTouched] = useState(false)
  const resolvedNationality = resolveNationalityName(nationality) || nationality.trim()
  const normalizedValue = sanitizePassportNumber(value)
  const rule = getPassportRule(resolvedNationality)
  const validation = validatePassportNumber(normalizedValue, resolvedNationality)
  const showError = touched && normalizedValue && !validation.valid && validation.error

  useEffect(() => {
    if (normalizedValue !== value) {
      onChange(normalizedValue)
    }
  }, [value, normalizedValue, onChange])

  return (
    <div>
      <FieldLabel autoFilled={autoFilled}>Passport Number *</FieldLabel>
      <div style={{ position: 'relative' }}>
        <input
          style={{ ...borderInputStyle, paddingRight: validation.valid && normalizedValue ? 36 : undefined }}
          value={normalizedValue}
          maxLength={rule.max}
          onChange={(e) => onChange(sanitizePassportNumber(e.target.value))}
          onBlur={() => setTouched(true)}
        />
        {validation.valid && normalizedValue && (
          <span style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', marginTop: 3, color: GREEN, fontWeight: 700, fontSize: 16 }}>✓</span>
        )}
      </div>
      <p style={{ margin: '6px 0 0', fontSize: 11, color: '#888' }}>Passport format: {rule.pattern}</p>
      {showError && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#dc2626' }}>{validation.error}</p>}
    </div>
  )
}

function NationalityInput({
  value,
  onChange,
  defaultNationality,
  invalid,
  onBlur,
}: {
  value: string
  onChange: (v: string) => void
  defaultNationality: string
  invalid?: boolean
  onBlur?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ALL_CITIZENSHIPS.slice(0, 40)
    return ALL_CITIZENSHIPS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
    ).slice(0, 30)
  }, [query])

  const selectedEntry = ALL_CITIZENSHIPS.find((c) => c.name.toLowerCase() === value.trim().toLowerCase())
  const selectedCode = selectedEntry?.code ?? null
  const hint = selectedCode ?? null

  const commitQuery = () => {
    const trimmed = query.trim()
    if (!trimmed) {
      onChange('')
      setQuery('')
      return
    }
    const exact = ALL_CITIZENSHIPS.find((c) => c.name.toLowerCase() === trimmed.toLowerCase())
    if (exact) {
      onChange(exact.name)
      setQuery(exact.name)
    }
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        {selectedCode && (
          <span
            style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              marginTop: 3,
              pointerEvents: 'none',
            }}
          >
            <CountryFlag code={selectedCode} countryName={value} size="sm" />
          </span>
        )}
        <input
          style={{
            ...borderInputStyle,
            paddingLeft: selectedCode ? 30 : 0,
            paddingRight: hint ? 52 : undefined,
          }}
          value={query}
          onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => {
              setOpen(false)
              commitQuery()
              onBlur?.()
            }, 150)
          }}
          placeholder={defaultNationality ? `Search nationality (e.g. ${defaultNationality})` : 'Search nationality'}
        />
        {invalid && !value && (
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#dc2626' }}>Select a nationality from the list</p>
        )}
        {invalid && value && !resolveNationalityName(value) && (
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#dc2626' }}>Choose a matching country from the dropdown</p>
        )}
        {hint && (
          <span
            style={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          >
            <FieldHintBadge>{hint}</FieldHintBadge>
          </span>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, maxHeight: 220, overflowY: 'auto', background: '#fff', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #eee', zIndex: 1000, padding: 8 }}>
          {filtered.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => { onChange(c.name); setQuery(c.name); setOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', border: '1px solid #eee', borderRadius: 40, padding: '8px 14px', fontSize: 13, cursor: 'pointer', background: '#fff', marginBottom: 4, textAlign: 'left' }}
            >
              <CountryFlag code={c.code} countryName={c.name} size="sm" />
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ApplyCalendar({
  label,
  selected,
  onSelect,
  minDate,
  maxDate,
  syncViewDate,
  highlighted,
  containerRef,
}: {
  label: string
  selected: Date | null
  onSelect: (date: Date) => void
  minDate?: Date
  maxDate?: Date
  syncViewDate?: Date | null
  highlighted?: boolean
  containerRef?: RefObject<HTMLDivElement | null>
}) {
  const today = startOfDay(new Date())
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth())
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear())
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)

  useEffect(() => {
    if (syncViewDate) {
      setViewMonth(syncViewDate.getMonth())
      setViewYear(syncViewDate.getFullYear())
    }
  }, [syncViewDate?.getTime()])

  const yearStart = minDate ? minDate.getFullYear() : today.getFullYear()
  const yearEnd = maxDate ? maxDate.getFullYear() : today.getFullYear() + 1
  const years = Array.from({ length: yearEnd - yearStart + 1 }, (_, i) => yearStart + i)

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const startOffset = firstDay === 0 ? 6 : firstDay - 1
  const cells: (number | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const isSameDay = (a: Date, day: number) =>
    a.getFullYear() === viewYear && a.getMonth() === viewMonth && a.getDate() === day

  const isDisabled = (day: number) => {
    const d = startOfDay(new Date(viewYear, viewMonth, day))
    if (minDate && d < startOfDay(minDate)) return true
    if (maxDate && d > startOfDay(maxDate)) return true
    return false
  }

  return (
    <div
      ref={containerRef}
      style={{
        background: '#fff', borderRadius: 20,
        boxShadow: highlighted ? '0 12px 48px rgba(249,62,66,0.22)' : '0 8px 40px rgba(249,62,66,0.12)',
        border: highlighted ? `2px solid ${BRAND}` : '1px solid rgba(249,62,66,0.1)',
        padding: 16, width: '100%', maxWidth: 320,
        transition: 'box-shadow 0.25s ease, border 0.25s ease',
      }}
    >
      <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: 14, color: highlighted ? BRAND : '#333' }}>{label}</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <select value={viewMonth} onChange={(e) => setViewMonth(Number(e.target.value))} style={{ flex: 1, border: '1px solid #eee', borderRadius: 10, padding: '8px 10px', fontSize: 13 }}>
          {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
        </select>
        <select value={viewYear} onChange={(e) => setViewYear(Number(e.target.value))} style={{ flex: 1, border: '1px solid #eee', borderRadius: 10, padding: '8px 10px', fontSize: 13 }}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8, fontSize: 12, fontWeight: 600, color: BRAND, textAlign: 'center' }}>
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => <span key={d}>{d}</span>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((day, idx) => {
          if (!day) return <span key={`empty-${idx}`} />
          const disabled = isDisabled(day)
          const isSelected = selected ? isSameDay(selected, day) : false
          const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day
          const isHovered = hoveredDay === day && !isSelected && !disabled
          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(startOfDay(new Date(viewYear, viewMonth, day)))}
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
              style={{
                width: 36, height: 36, border: 'none', borderRadius: '50%',
                cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 14,
                background: isSelected ? BRAND : isToday && !selected ? '#fff0f0' : isHovered ? '#fff0f0' : 'transparent',
                color: disabled ? '#ddd' : isSelected ? '#fff' : isToday ? BRAND : isHovered ? BRAND : '#111827',
                opacity: disabled ? 0.4 : 1, fontWeight: isToday ? 600 : 400,
              }}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SidebarItem({
  stepKey, current, label, icon, unlocked, completed, onNavigate,
}: {
  stepKey: ApplyStep; current: ApplyStep; label: string; icon: ReactNode
  unlocked: boolean; completed: boolean; onNavigate: () => void
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  const isCurrent = stepKey === current
  const color = completed ? GREEN : isCurrent ? ACCENT : unlocked ? '#888' : '#ccc'

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        disabled={!unlocked}
        onClick={() => {
          if (!unlocked) { setShowTooltip(true); window.setTimeout(() => setShowTooltip(false), 2000); return }
          onNavigate()
        }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', border: 'none', background: 'none', cursor: unlocked ? 'pointer' : 'not-allowed', padding: '16px 0', width: '100%' }}
      >
        {icon}
        <span style={{ marginTop: 6, fontSize: 11, fontWeight: isCurrent ? 700 : 600, color, display: 'flex', alignItems: 'center', gap: 2 }}>
          {completed && <CheckIconSmall />}{label}
        </span>
      </button>
      {showTooltip && !unlocked && (
        <div style={{ position: 'absolute', left: 64, top: '50%', transform: 'translateY(-50%)', background: '#333', color: '#fff', fontSize: 11, padding: '6px 10px', borderRadius: 8, whiteSpace: 'nowrap', zIndex: 2000 }}>
          Complete previous step first
        </div>
      )}
    </div>
  )
}

function FixedBottomBar({
  isMobile,
  left,
  center,
  right,
}: {
  isMobile: boolean
  left?: ReactNode
  center?: ReactNode
  right: ReactNode
}) {
  return (
    <div
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#fff', borderTop: '1px solid #eee',
        padding: isMobile ? '12px 16px' : '16px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: 12, zIndex: 100, marginLeft: isMobile ? 0 : 60,
      }}
    >
      <div style={{ flex: 1 }}>{left}</div>
      {center && <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>{center}</div>}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
    </div>
  )
}

function SuperVaultLock() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#888', fontSize: 12 }}>
      <LockIcon />
      <span>SuperVault — AES-256 encrypted</span>
    </div>
  )
}

function ActionButton({ enabled, label, onClick }: { enabled: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={!enabled}
      onClick={onClick}
      style={{
        background: enabled ? ACCENT : '#888', color: '#fff', border: 'none',
        borderRadius: 12, padding: '12px 28px', fontSize: 15, fontWeight: 600,
        cursor: enabled ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

type CheckoutFormProps = {
  country: Country
  selectedOption: VisaOption
  travelers: TravelerForm[]
  departureDate: Date | null
  returnDate: Date | null
  pricing: { gov: number; processing: number; discount: number; total: number }
  docsComplete: boolean
  passportCode: string
  uploads: Record<string, UploadEntry>
  mockCheckout?: boolean
}

type CheckoutBodyProps = CheckoutFormProps & {
  stripe: ReturnType<typeof useStripe>
  elements: ReturnType<typeof useElements>
}

function CheckoutPaymentForm(props: CheckoutFormProps) {
  const useMock = props.mockCheckout ?? (isStripeMockCheckout() || !isStripeConfigured())
  if (useMock) {
    return <CheckoutPaymentFormBody {...props} mockCheckout stripe={null} elements={null} />
  }
  const promise = getStripePromise()
  if (!promise) {
    return <CheckoutPaymentFormBody {...props} mockCheckout stripe={null} elements={null} />
  }
  return (
    <Elements stripe={promise}>
      <CheckoutPaymentFormStripe {...props} />
    </Elements>
  )
}

function CheckoutPaymentFormStripe(props: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  return <CheckoutPaymentFormBody {...props} mockCheckout={false} stripe={stripe} elements={elements} />
}

function CheckoutPaymentFormBody({
  country,
  selectedOption,
  travelers,
  departureDate,
  returnDate,
  pricing,
  docsComplete,
  uploads,
  mockCheckout = false,
  stripe,
  elements,
}: CheckoutBodyProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { residenceCountry, residencyStatus, citizenship } = useCitizenship()
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [payMethod, setPayMethod] = useState<'card' | 'bank' | 'wallet' | 'wallet_partial'>('card')

  const primary = travelers[0]
  const primaryName = `${primary?.firstName ?? ''} ${primary?.lastName ?? ''}`.trim() || 'Guest Traveler'
  const customerEmail = (primary?.email?.trim() || user?.email?.trim() || '').toLowerCase()
  const travelersCount = travelers.length
  const vatPreview = Number((pricing.total * 0.05).toFixed(2))
  const grandTotalPreview = Number((pricing.total + vatPreview).toFixed(2))
  const existingUser = customerEmail ? Database.getUserByEmail(customerEmail) : null
  const walletBalance = existingUser ? Database.getUserWalletBalance(String(existingUser.id)) : 0
  const walletCoversAll = walletBalance >= grandTotalPreview
  const walletPartialRemainder = Math.max(0, grandTotalPreview - walletBalance)

  const finalizeAndNavigate = (status: 'success' | 'failed' | 'unpaid', paymentSuccess: boolean) => {
    const today = formatDateLabel(new Date())
    const due = new Date()
    due.setDate(due.getDate() + 7)
    const subtotal = pricing.gov * travelersCount + pricing.processing * travelersCount - pricing.discount
    const paymentMethod = payMethod === 'bank' ? 'Bank Transfer' : payMethod === 'wallet' || payMethod === 'wallet_partial' ? 'Wallet' : 'Card'
    const useWallet = payMethod === 'wallet' || payMethod === 'wallet_partial'
    const walletPayAmount = payMethod === 'wallet' ? grandTotalPreview : payMethod === 'wallet_partial' ? Math.min(walletBalance, grandTotalPreview) : 0

    let applicationId = ''
    let invoiceId = ''
    if (customerEmail) {
      let dbUser = Database.getUserByEmail(customerEmail)
      const resolvedNationality =
        resolveNationalityDisplay(primary?.nationality ?? '') ||
        resolveNationalityDisplay(citizenship)
      const normalizedTravelers = travelers.map((t, i) => {
        const raw = i === 0 ? (t.nationality.trim() || citizenship) : t.nationality
        const nationality = resolveNationalityDisplay(raw) || raw.trim()
        return { ...t, nationality }
      })

      if (!dbUser) {
        const customerPhone = formatFullPhone(
          getDialCodeByCountryCode(primary?.mobileCountryCode ?? 'ae'),
          primary?.mobile ?? '',
        )
        dbUser = Database.createUser({
          fullName: primaryName,
          email: customerEmail,
          phone: customerPhone,
          phoneCode: getDialCodeByCountryCode(primary?.mobileCountryCode ?? 'ae'),
          passportCountry: resolvedNationality,
          residenceCountry,
          residencyStatus,
          registrationSource: 'application',
          isVerified: true,
          profilePhoto: null,
          lastLogin: new Date().toISOString(),
          loginCount: 1,
        })
        notifyAdminNewUser({
          userId: String(dbUser.id),
          fullName: primaryName,
          email: customerEmail,
          phone: customerPhone,
          source: 'application',
        })
        void syncUserToServer(dbUser as Record<string, unknown>)
      } else if (resolvedNationality) {
        Database.updateUser(String(dbUser.id), { passportCountry: resolvedNationality })
      }
      localStorage.setItem(USER_REF_KEY, String(dbUser.id))

      const docRecords = Object.entries(uploads).map(([key, entry]) => ({
        id: `doc_${key.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
        type: key.split('-').slice(1).join('-') || 'document',
        fileName: entry.fileName,
        fileData: entry.fileData ?? null,
        mimeType: entry.mimeType ?? 'application/octet-stream',
        fileSize: undefined,
        status: 'pending_review',
        uploadedAt: new Date().toISOString(),
        travelerIndex: Number(key.split('-')[0]) || 0,
      }))

      const appStatus =
        status === 'success'
          ? docsComplete
            ? 'under_review'
            : 'pending_docs'
          : status === 'failed'
            ? 'payment_failed'
            : 'payment_pending'

      const dbApplication = Database.createApplication({
        type: 'b2c',
        userId: String(dbUser.id),
        partnerId: null,
        destination: country.slug,
        destinationName: country.name,
        visaOption: selectedOption.label,
        travelers: normalizedTravelers,
        passportCountry: resolvedNationality,
        travelDates: {
          departure: departureDate ? departureDate.toISOString().slice(0, 10) : null,
          return: returnDate ? returnDate.toISOString().slice(0, 10) : null,
        },
        documents: docRecords,
        status: appStatus,
        evisaSupported: country.visaType === 'e-Visa',
        submissionMethod: country.visaType === 'e-Visa' ? 'automated' : 'manual',
        assignedOperator: null,
        amount: {
          governmentFee: pricing.gov,
          processingFee: pricing.processing,
          discount: pricing.discount,
          total: pricing.total,
        },
        paymentStatus: paymentSuccess ? 'paid' : 'pending',
        paymentMethod: useWallet ? 'wallet' : payMethod === 'bank' ? 'bank_transfer' : 'card',
        countryCode: country.countryCode,
      })
      applicationId = String(dbApplication.id)

      const vat = Number((pricing.total * 0.05).toFixed(2))
      const grandTotal = Number((pricing.total + vat).toFixed(2))
      const invoice = Database.createInvoice({
        applicationId,
        type: 'b2c',
        customerName: primaryName,
        destination: country.name,
        amount: pricing.total,
        governmentFee: pricing.gov,
        processingFee: pricing.processing,
        vat,
        total: grandTotal,
        status: paymentSuccess ? 'paid' : 'unpaid',
        paymentMethod: paymentSuccess ? (useWallet ? 'wallet' : 'card') : payMethod === 'bank' ? 'bank_transfer' : null,
        dueDate: due.toISOString(),
        paidAt: paymentSuccess ? new Date().toISOString() : null,
        countryCode: country.countryCode,
      })
      invoiceId = String(invoice.id)

      if (paymentSuccess) {
        if (useWallet && walletPayAmount > 0) {
          Database.deductUserWallet(String(dbUser.id), walletPayAmount, applicationId)
        }
        Database.createPayment({
          invoiceId,
          applicationId,
          amount: grandTotal,
          method: useWallet ? 'wallet' : 'card',
          gateway: useWallet ? 'wallet' : 'stripe',
          status: 'success',
        })
      }

      Database.logActivity(
        'application_created',
        `New B2C application — ${primaryName} — ${country.name}`,
        applicationId,
        String(dbUser.id),
        'customer',
      )

      notifyAdminB2CApplication({
        applicationId,
        customerName: primaryName,
        destination: country.name,
        amountPending: grandTotal,
        paymentStatus: paymentSuccess ? 'paid' : 'pending',
        paymentMethod,
        customerPhone: formatFullPhone(
          getDialCodeByCountryCode(primary?.mobileCountryCode ?? 'ae'),
          primary?.mobile ?? '',
        ),
      })
      void syncApplicationToServer(dbApplication as Record<string, unknown>)
    }

    const params = new URLSearchParams({
      status,
      name: primaryName,
      email: customerEmail,
      amount: String(pricing.total),
      country: country.name,
      option: selectedOption.label,
      date: today,
      travelers: String(travelersCount),
      govFee: String(pricing.gov),
      processingFee: String(pricing.processing),
      discount: String(pricing.discount),
      subtotal: String(subtotal),
      countryCode: country.countryCode,
      paymentMethod,
      applicationId,
      invoiceId,
    })
    if (payMethod === 'bank') {
      params.set('dueDate', due.toISOString().slice(0, 10))
    }
    navigate(`/invoice?${params.toString()}`)
  }

  const handleBankTransfer = () => {
    if (!customerEmail) {
      setPayError('Please enter a valid email on the Personal Details step.')
      return
    }
    setPayError(null)
    finalizeAndNavigate('unpaid', false)
  }

  const handleWalletPay = () => {
    if (!customerEmail) {
      setPayError('Please enter a valid email on the Personal Details step.')
      return
    }
    if (payMethod === 'wallet' && walletBalance < grandTotalPreview) {
      setPayError('Insufficient wallet balance.')
      return
    }
    setPayError(null)
    setPaying(true)
    window.setTimeout(() => {
      setPaying(false)
      finalizeAndNavigate('success', true)
    }, 400)
  }

  const handleMockPay = () => {
    if (!customerEmail) {
      setPayError('Please enter a valid email on the Personal Details step.')
      return
    }
    setPayError(null)
    setPaying(true)
    window.setTimeout(() => {
      setPaying(false)
      finalizeAndNavigate('success', true)
    }, 600)
  }

  const handlePay = async () => {
    if (payMethod === 'wallet') {
      handleWalletPay()
      return
    }
    if (mockCheckout) {
      handleMockPay()
      return
    }
    if (!customerEmail) {
      setPayError('Please enter a valid email on the Personal Details step.')
      return
    }
    if (!stripe || !elements) return
    const card = elements.getElement(CardElement)
    if (!card) return
    setPaying(true)
    setPayError(null)
    const { error } = await stripe.createPaymentMethod({ type: 'card', card })
    if (error) {
      setPaying(false)
      setPayError(error.message ?? 'Payment failed')
      return
    }
    finalizeAndNavigate('success', true)
  }

  const dateRange = departureDate && returnDate
    ? `${formatDateLabel(departureDate)} → ${formatDateLabel(returnDate)}`
    : '—'

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <img src={flagUrl(country.countryCode, 40)} alt="" width={40} height={28} style={{ borderRadius: 4, objectFit: 'cover' }} />
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>{country.name}</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>{selectedOption.label}</p>
          </div>
        </div>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#666' }}>Travel dates: <strong>{dateRange}</strong></p>
        <p style={{ margin: '0 0 4px', fontSize: 14, color: '#555' }}>Travelers ({travelersCount})</p>
        {travelers.map((t, i) => (
          <p key={i} style={{ margin: '2px 0', fontSize: 12, color: '#888' }}>
            {i + 1}. {(t.firstName + ' ' + t.lastName).trim() || 'Unnamed'}
          </p>
        ))}
        <div style={{ fontSize: 14, color: '#555', lineHeight: 2, marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Government fee × {travelersCount}</span>
            <span>AED {pricing.gov * travelersCount}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Processing fee × {travelersCount}</span>
            <span>AED {pricing.processing * travelersCount}</span>
          </div>
          {pricing.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: GREEN }}>
              <span>5% Multi-traveler Discount</span>
              <span>− AED {pricing.discount}</span>
            </div>
          )}
        </div>
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Total</span>
          <span style={{ fontWeight: 700, fontSize: 24, color: BRAND }}>AED {pricing.total}</span>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 15 }}>Payment method</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {walletBalance > 0 && (
            <button
              type="button"
              disabled={!walletCoversAll}
              onClick={() => walletCoversAll && setPayMethod('wallet')}
              style={{
                padding: 16,
                borderRadius: 12,
                border: payMethod === 'wallet' ? '2px solid #22c55e' : '1px solid #eee',
                background: walletCoversAll ? (payMethod === 'wallet' ? '#f0fff4' : '#fff') : '#f5f5f5',
                fontWeight: 600,
                fontSize: 13,
                cursor: walletCoversAll ? 'pointer' : 'not-allowed',
                textAlign: 'left',
              }}
            >
              💰 Pay from Wallet (AED {walletBalance.toLocaleString()} available)
              {walletCoversAll ? (
                <div style={{ fontSize: 12, color: '#666', fontWeight: 400, marginTop: 4 }}>After payment: AED {(walletBalance - grandTotalPreview).toLocaleString()}</div>
              ) : (
                <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 4 }}>
                  Insufficient — use partial option below
                </div>
              )}
            </button>
          )}
          {walletBalance > 0 && !walletCoversAll && (
            <button
              type="button"
              onClick={() => setPayMethod('wallet_partial')}
              style={{
                padding: 16,
                borderRadius: 12,
                border: payMethod === 'wallet_partial' ? `2px solid ${ACCENT}` : '1px solid #eee',
                background: payMethod === 'wallet_partial' ? '#f0f0ff' : '#fff',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              💰 Use AED {walletBalance.toLocaleString()} from wallet + pay AED {walletPartialRemainder.toLocaleString()} by card
            </button>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
          {([
            { key: 'card' as const, label: '💳 Pay by Card (Stripe)' },
            { key: 'bank' as const, label: '🏦 Bank Transfer' },
          ]).map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setPayMethod(m.key)}
              style={{
                flex: 1,
                padding: '12px 14px',
                borderRadius: 12,
                border: payMethod === m.key ? `2px solid ${ACCENT}` : '1px solid #eee',
                background: payMethod === m.key ? '#f0f0ff' : '#fff',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {m.label}
            </button>
          ))}
          </div>
        </div>

        {payMethod === 'card' || payMethod === 'wallet_partial' ? (
          <>
            {(isStripeTestMode() || mockCheckout) && (
              <div
                style={{
                  marginBottom: 12,
                  padding: '10px 14px',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: 10,
                  fontSize: 12,
                  color: '#92400e',
                  lineHeight: 1.5,
                }}
              >
                {mockCheckout ? (
                  <>
                    <strong>Dev test mode</strong> — no real Stripe charge. Click Pay to simulate a successful
                    payment and open the success invoice.
                  </>
                ) : (
                  <>
                    <strong>Stripe test mode</strong> — use card <code>4242 4242 4242 4242</code>, any future
                    expiry, any CVC. No real money is charged.
                  </>
                )}
              </div>
            )}
            {!mockCheckout && !isStripeConfigured() && (
              <div
                style={{
                  marginBottom: 12,
                  padding: '10px 14px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 10,
                  fontSize: 12,
                  color: '#991b1b',
                }}
              >
                Add <code>VITE_STRIPE_PUBLISHABLE_KEY=pk_test_…</code> to your <code>.env</code> file and restart
                the dev server to enable card payments.
              </div>
            )}
            <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 15 }}>Card details</p>
            {mockCheckout ? (
              <div
                style={{
                  border: '1px dashed #c7d2fe',
                  borderRadius: 12,
                  padding: 20,
                  background: '#f8f9ff',
                  fontSize: 13,
                  color: '#555',
                  textAlign: 'center',
                }}
              >
                Card form skipped in dev mock mode
              </div>
            ) : (
              <>
                <div style={{ border: '1px solid #eee', borderRadius: 12, padding: 16, background: '#fff' }}>
                  <CardElement options={{ hidePostalCode: true, style: { base: { fontSize: '16px', color: '#1a1a1a', fontFamily: 'system-ui, sans-serif', '::placeholder': { color: '#aaa' } } } }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
                  {['Visa', 'MC', 'Amex'].map((card) => (
                    <span key={card} style={{ background: '#f5f5f5', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#555', border: '1px solid #e5e5e5' }}>{card}</span>
                  ))}
                </div>
              </>
            )}
            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#888', textAlign: 'center' }}>🔒 Secured by Stripe</p>
          </>
        ) : (
          <div style={{ background: '#f8f9fc', borderRadius: 12, padding: 16, fontSize: 13, color: '#555', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#111' }}>Bank transfer instructions</p>
            <p style={{ margin: 0 }}>You will receive an invoice with our bank details. Your application appears in our operations queue once you confirm. Transfer within 7 days.</p>
            <p style={{ margin: '12px 0 0', fontSize: 12, color: '#888' }}>IBAN: AE07 0331 2345 6789 0123 456 · Ref: your invoice number</p>
          </div>
        )}
      </div>

      {payError && <p style={{ margin: '0 0 12px', color: '#dc2626', fontSize: 14, textAlign: 'center' }}>{payError}</p>}

      {payMethod === 'wallet' ? (
        <button
          type="button"
          disabled={paying || walletBalance < grandTotalPreview}
          onClick={handleWalletPay}
          style={{ width: '100%', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 12, padding: 16, fontSize: 16, fontWeight: 700, cursor: paying ? 'wait' : 'pointer' }}
        >
          {paying ? 'Processing…' : `Pay AED ${grandTotalPreview.toLocaleString()} from Wallet`}
        </button>
      ) : payMethod === 'card' || payMethod === 'wallet_partial' ? (
        <button
          type="button"
          disabled={(!mockCheckout && !stripe) || paying}
          onClick={() => void handlePay()}
          style={{ width: '100%', background: BRAND, color: '#fff', border: 'none', borderRadius: 12, padding: 16, fontSize: 16, fontWeight: 700, cursor: paying ? 'wait' : 'pointer' }}
        >
          {paying ? 'Processing…' : payMethod === 'wallet_partial'
            ? `Pay AED ${walletPartialRemainder.toLocaleString()} by Card (+ AED ${walletBalance.toLocaleString()} wallet)`
            : mockCheckout ? `Test Pay AED ${pricing.total}` : `Pay AED ${pricing.total}`}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleBankTransfer}
          style={{ width: '100%', background: ACCENT, color: '#fff', border: 'none', borderRadius: 12, padding: 16, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
        >
          Confirm & Get Bank Invoice — AED {pricing.total}
        </button>
      )}

      <p style={{ margin: '12px 0 0', fontSize: 12, color: '#888', textAlign: 'center' }}>
        {mockCheckout
          ? 'Simulated checkout — for local testing only'
          : 'Test card: 4242 4242 4242 4242 | Exp: any future date | CVV: any 3 digits'}
      </p>

      <div style={{ marginTop: 20, background: 'linear-gradient(135deg,#1a1a2e,#2d2d5e)', borderRadius: 16, padding: 16, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        <span style={{ fontSize: 14, fontWeight: 600 }}>If rejected — contact us for Super Protect guidance</span>
      </div>
    </>
  )
}

export default function ApplyPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const {
    citizenship,
    countryCode,
    residenceCountry,
    residenceCode,
    residencyStatus,
    setResidenceCountry,
    setResidencyStatus,
  } = useCitizenship()
  const { isLoggedIn, user } = useAuth()
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [authReady, setAuthReady] = useState(() => isUserLoggedIn())

  useEffect(() => {
    if (!isUserLoggedIn()) {
      saveRedirectUrl(window.location.pathname + window.location.search)
      navigate('/sign-in', { replace: true })
      return
    }
    setAuthReady(true)
  }, [navigate])

  const destination = searchParams.get('destination') ?? ''
  const optionId = searchParams.get('option') ?? 'single'
  const step = normalizeStep(searchParams.get('step'))

  const country = getCountry(destination)
  const selectedOption = country?.visaOptions.find((o) => o.id === optionId) ?? country?.visaOptions[0]

  const initialBundle = useMemo(
    () => loadInitialApplyBundle(destination, optionId),
    [destination, optionId],
  )

  const [formData, setFormData] = useState<FormData>(initialBundle.formData)
  const [stepDone, setStepDone] = useState(initialBundle.stepDone)
  const [sessionRestored, setSessionRestored] = useState(true)

  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({})
  const [emailTouched, setEmailTouched] = useState<Record<number, boolean>>({})
  const [nationalityTouched, setNationalityTouched] = useState<Record<number, boolean>>({})
  const [isScanning, setIsScanning] = useState<Record<number, boolean>>({})
  const [scanProgress, setScanProgress] = useState<Record<number, number>>({})
  const [scanResult, setScanResult] = useState<Record<number, 'success' | 'failed' | 'pdf' | null>>({})
  const [autoFilledFields, setAutoFilledFields] = useState<Record<number, string[]>>({})
  const [scannedDataByTraveler, setScannedDataByTraveler] = useState<Record<number, PassportData>>({})
  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({})
  const [previewIsPdf, setPreviewIsPdf] = useState<Record<number, boolean>>({})
  const [mobileCountryCodeTouched, setMobileCountryCodeTouched] = useState<Record<number, boolean>>({})
  const [returnCalendarHighlight, setReturnCalendarHighlight] = useState(false)
  const returnCalendarRef = useRef<HTMLDivElement>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const phoneCodeOptions = useMemo(() => getPhoneCodeOptions(), [])

  const { travelers, travelInfo, uploads, departureDate, returnDate } = formData

  const effectiveUploads = useMemo(
    () => syncPassportFilesToUploads(travelers, uploads),
    [travelers, uploads],
  )

  const passportFilesKey = useMemo(
    () =>
      travelers
        .map((t, i) => (t.passportFile ? `${i}:${t.passportFile.name}:${t.passportFile.size}` : ''))
        .join('|'),
    [travelers],
  )

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    const accountEmail = user?.email?.trim().toLowerCase()
    if (!accountEmail) return

    setFormData((prev) => {
      const traveler = prev.travelers[0]
      if (!traveler || traveler.email.trim()) return prev
      return {
        ...prev,
        travelers: prev.travelers.map((t, i) => (i === 0 ? { ...t, email: accountEmail } : t)),
      }
    })

    setAutoFilledFields((prev) => {
      const fields = prev[0] ?? []
      if (fields.includes('email')) return prev
      return { ...prev, 0: [...fields, 'email'] }
    })
  }, [user?.email])

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      travelers: prev.travelers.map((t, i) => {
        if (mobileCountryCodeTouched[i]) return t
        const next = resolveDefaultPhoneCountry({
          residenceCode,
          residenceCountry,
          nationality: t.nationality || citizenship,
        })
        if (t.mobileCountryCode === next.countryCode) return t
        return { ...t, mobileCountryCode: next.countryCode }
      }),
    }))
  }, [residenceCode, residenceCountry, citizenship, mobileCountryCodeTouched])

  useEffect(() => {
    setFormData((prev) => {
      const synced = syncPassportFilesToUploads(prev.travelers, prev.uploads)
      if (synced === prev.uploads) return prev
      return { ...prev, uploads: synced }
    })
  }, [passportFilesKey])

  const today = useMemo(() => startOfDay(new Date()), [])
  const maxDeparture = useMemo(() => addDays(today, 365), [today])
  const validityDays = selectedOption ? parseValidityDays(selectedOption.validity) : 30
  const validityLabel = selectedOption?.validity ?? '30 days'

  const minReturnDate = departureDate ? addDays(departureDate, 1) : undefined
  const maxReturnDate = departureDate ? addDays(departureDate, validityDays) : undefined

  const returnDateInvalid = useMemo(() => {
    if (!departureDate || !returnDate) return false
    return returnDate > addDays(departureDate, validityDays)
  }, [departureDate, returnDate, validityDays])

  const visaExpiryDate = departureDate ? addDays(departureDate, validityDays) : null
  const returnWithinValidity = returnDate && visaExpiryDate ? returnDate <= visaExpiryDate : true

  const progress = STEP_PROGRESS[step]
  const applyUrl = (nextStep: ApplyStep) =>
    `/apply?destination=${encodeURIComponent(destination)}&option=${encodeURIComponent(optionId)}&step=${nextStep}`

  const visaRequirements = useMemo(() => {
    if (!country) return null
    const applicantNationality = travelers[0]?.nationality?.trim() || citizenship
    return getVisaRequirements(
      applicantNationality,
      residenceCountry,
      residencyStatus,
      country.slug,
    )
  }, [country, citizenship, travelers, residenceCountry, residencyStatus])

  const primaryNationality = travelers[0]?.nationality?.trim() || citizenship
  const salaryCurrencyOptions = useMemo(
    () => getSalaryCurrencyOptions(primaryNationality),
    [primaryNationality],
  )

  useEffect(() => {
    const codes = salaryCurrencyOptions.map((c) => c.code)
    setFormData((prev) => {
      if (codes.includes(prev.travelInfo.salaryCurrency)) return prev
      return {
        ...prev,
        travelInfo: { ...prev.travelInfo, salaryCurrency: codes[0] ?? 'AED' },
      }
    })
  }, [salaryCurrencyOptions])

  const personalComplete =
    travelers.length > 0 &&
    travelers.every((t, i) => isTravelerComplete(t, i, residenceCountry, residencyStatus))

  const personalMissingHint = useMemo(() => {
    if (personalComplete || travelers.length === 0) return null
    for (let i = 0; i < travelers.length; i++) {
      const t = travelers[i]
      const nationality = resolveNationalityName(t.nationality)
      const fields = getTravelerResidenceFieldRequirements(t, i, residenceCountry, residencyStatus)
      const who = travelers.length > 1 ? `Traveller ${i + 1}: ` : ''
      if (!t.firstName.trim()) return `${who}Enter first name`
      if (!t.lastName.trim()) return `${who}Enter last name`
      if (!t.dateOfBirth) return `${who}Select date of birth`
      if (!nationality) return `${who}Select nationality from the dropdown`
      if (!t.passportNumber.trim() || !validatePassportNumber(t.passportNumber, nationality).valid) {
        return `${who}Enter a valid passport number`
      }
      if (!t.passportExpiry) return `${who}Select passport expiry date`
      if (!t.mobile.trim()) return `${who}Enter mobile number`
      if (!t.email.trim() || !isValidEmail(t.email)) return `${who}Enter a valid email address`
      if (fields.showPermitExpiry && !t.uaeVisaExpiry) {
        return `${who}Select ${fields.permitLabel.replace(' *', '')}`
      }
      if (fields.showEmiratesId && !t.emiratesIdExpiry) {
        return `${who}Select ${(fields.emiratesLabel ?? 'National ID Expiry Date').replace(' *', '')}`
      }
    }
    return 'Complete all required traveller fields'
  }, [personalComplete, travelers, residenceCountry, residencyStatus])

  const travelComplete = isTravelInfoComplete(travelInfo)

  const docList = useMemo(() => {
    if (!visaRequirements) return []
    return visaRequirements.documents
      .map(docRequirementToDocDef)
      .sort((a, b) => (a.required === b.required ? 0 : a.required ? -1 : 1))
  }, [visaRequirements])

  const docsComplete = useMemo(() => {
    if (!country) return false
    return travelers.every((traveler, ti) => {
      const requiredForTraveler = getTravelerDocList(
        docList,
        traveler,
        ti,
        residenceCountry,
        residencyStatus,
      ).filter((d) => d.required)
      return requiredForTraveler.every((doc) =>
        hasTravelerDocUploaded(ti, doc, traveler, effectiveUploads, uploadErrors),
      )
    })
  }, [travelers, docList, effectiveUploads, uploadErrors, country, residenceCountry, residencyStatus])

  const docsMissingHint = useMemo(() => {
    if (docsComplete || !country) return null
    for (let ti = 0; ti < travelers.length; ti++) {
      const traveler = travelers[ti]
      const name = `${traveler.firstName} ${traveler.lastName}`.trim() || `Traveller ${ti + 1}`
      const requiredForTraveler = getTravelerDocList(
        docList,
        traveler,
        ti,
        residenceCountry,
        residencyStatus,
      ).filter((d) => d.required)
      for (const doc of requiredForTraveler) {
        if (!hasTravelerDocUploaded(ti, doc, traveler, effectiveUploads, uploadErrors)) {
          return ti === 0 ? `Upload ${doc.name}` : `${name}: upload ${doc.name}`
        }
      }
    }
    return 'Upload all required documents for each traveller'
  }, [docsComplete, country, travelers, docList, residenceCountry, residencyStatus, effectiveUploads, uploadErrors])

  const apptComplete = Boolean(departureDate && returnDate && !returnDateInvalid)

  useEffect(() => {
    setFormData(initialBundle.formData)
    setStepDone(initialBundle.stepDone)
    setSessionRestored(true)
  }, [initialBundle])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  useEffect(() => {
    if (!destination || !optionId || !sessionRestored) return
    saveApplySession(destination, optionId, formData, stepDone)
  }, [destination, optionId, formData, stepDone, sessionRestored])

  useEffect(() => {
    if (step !== 'checkout') return
    setStepDone((prev) => ({
      personal: prev.personal || personalComplete,
      travel: prev.travel || travelComplete,
      docs: prev.docs || docsComplete,
      appt: prev.appt || apptComplete,
    }))
  }, [step, personalComplete, travelComplete, docsComplete, apptComplete])

  const unlocked: Record<ApplyStep, boolean> = {
    personal: true,
    travel: stepDone.personal || step === 'travel',
    docs: stepDone.travel || step === 'docs',
    appt: stepDone.docs || step === 'appt',
    checkout: stepDone.appt || step === 'checkout',
  }

  const completed: Record<ApplyStep, boolean> = {
    personal: stepDone.personal,
    travel: stepDone.travel,
    docs: stepDone.docs,
    appt: stepDone.appt,
    checkout: false,
  }

  const defaultReturnOffsetDays = Math.min(30, validityDays)

  const pricing = useMemo(() => {
    if (!selectedOption) return { gov: 0, processing: 0, discount: 0, total: 0 }
    const gov = parseFeeAed(selectedOption.fee)
    const processing = parseFeeAed(selectedOption.processingFee)
    const count = travelers.length
    const subtotal = (gov + processing) * count
    const discount = count >= 2 ? Math.round(subtotal * 0.05) : 0
    return { gov, processing, discount, total: subtotal - discount }
  }, [selectedOption, travelers.length])

  const visaReadyBy = useMemo(() => {
    if (!selectedOption) return '—'
    const days = parseProcessingDaysMax(selectedOption.processingTime)
    const d = new Date()
    d.setDate(d.getDate() + days)
    return formatDateLabel(d)
  }, [selectedOption])

  if (!authReady) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: BG_GRADIENT,
          color: '#666',
          fontSize: 15,
        }}
      >
        Loading your application…
      </div>
    )
  }

  if (!country || !selectedOption) {
    return <Navigate to="/" replace />
  }

  const isAutoFilled = (index: number, field: string) =>
    (autoFilledFields[index] ?? []).includes(field)

  const resetScanState = (travelerIndex: number) => {
    setIsScanning((prev) => ({ ...prev, [travelerIndex]: false }))
    setScanProgress((prev) => ({ ...prev, [travelerIndex]: 0 }))
    setScanResult((prev) => ({ ...prev, [travelerIndex]: null }))
    setScannedDataByTraveler((prev) => {
      const next = { ...prev }
      delete next[travelerIndex]
      return next
    })
    if (previewUrls[travelerIndex]) {
      URL.revokeObjectURL(previewUrls[travelerIndex])
    }
    setPreviewUrls((prev) => {
      const next = { ...prev }
      delete next[travelerIndex]
      return next
    })
    setPreviewIsPdf((prev) => {
      const next = { ...prev }
      delete next[travelerIndex]
      return next
    })
    setAutoFilledFields((prev) => {
      const next = { ...prev }
      delete next[travelerIndex]
      return next
    })
    const uploadKey = passportUploadKey(travelerIndex)
    setFormData((prev) => {
      if (!prev.uploads[uploadKey] && !prev.travelers[travelerIndex]?.passportFile) return prev
      const nextUploads = { ...prev.uploads }
      delete nextUploads[uploadKey]
      return {
        ...prev,
        uploads: nextUploads,
        travelers: prev.travelers.map((t, i) =>
          i === travelerIndex ? { ...t, passportFile: undefined } : t,
        ),
      }
    })
  }

  const attachPassportFile = (travelerIndex: number, file: File) => {
    setFormData((prev) => ({
      ...prev,
      travelers: prev.travelers.map((t, i) => (i === travelerIndex ? { ...t, passportFile: file } : t)),
      uploads: {
        ...prev.uploads,
        [passportUploadKey(travelerIndex)]: buildPassportUploadEntry(file, true),
      },
    }))
    void readFileAsDataUrl(file).then(({ fileData, mimeType }) => {
      setFormData((prev) => {
        const key = passportUploadKey(travelerIndex)
        const entry = prev.uploads[key]
        if (!entry) return prev
        return {
          ...prev,
          uploads: { ...prev.uploads, [key]: { ...entry, fileData, mimeType } },
        }
      })
    })
  }

  const handlePassportUpload = async (file: File, travelerIndex: number) => {
    if (!file) return
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!allowed.includes(file.type)) {
      window.alert('Only JPG, PNG or PDF files allowed')
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      window.alert('File must be less than 15MB')
      return
    }

    attachPassportFile(travelerIndex, file)

    const previewUrl = URL.createObjectURL(file)
    setPreviewUrls((prev) => ({ ...prev, [travelerIndex]: previewUrl }))
    setPreviewIsPdf((prev) => ({ ...prev, [travelerIndex]: file.type === 'application/pdf' }))
    setIsScanning((prev) => ({ ...prev, [travelerIndex]: true }))
    setScanProgress((prev) => ({ ...prev, [travelerIndex]: 0 }))
    setScanResult((prev) => ({ ...prev, [travelerIndex]: null }))

    try {
      const engine = getPreferredOcrEngine()
      const data = await scanPassportDocument(file, (progress) => {
        setScanProgress((prev) => ({ ...prev, [travelerIndex]: progress }))
      })

      const shouldAutoFill = engine ? isOcrAutoFillEnabled(engine) : false
      const { fields, filledKeys, displayData } = buildPassportAutoFill(data, shouldAutoFill)
      if (fields.passportNumber) {
        const travelerBefore = formData.travelers[travelerIndex]
        const nationalityForRule =
          fields.nationality || travelerBefore?.nationality || citizenship
        fields.passportNumber = normalizePassportForNationality(
          fields.passportNumber,
          nationalityForRule,
        )
      }
      const filledFields = [...filledKeys]
      if (shouldAutoFill && data.gender) {
        filledFields.push('gender')
      }

      setFormData((prev) => {
        const uploadKey = passportUploadKey(travelerIndex)
        const passportEntry = buildPassportUploadEntry(file, true)
        return {
          ...prev,
          travelers: prev.travelers.map((t, i) => {
            if (i !== travelerIndex) return t
            return {
              ...t,
              passportFile: file,
              ...fields,
              ...(shouldAutoFill && data.gender ? { gender: data.gender } : {}),
            }
          }),
          uploads: { ...prev.uploads, [uploadKey]: passportEntry },
        }
      })

      setScannedDataByTraveler((prev) => ({
        ...prev,
        [travelerIndex]: displayData,
      }))
      setAutoFilledFields((prev) => ({ ...prev, [travelerIndex]: filledFields }))
      setScanResult((prev) => ({ ...prev, [travelerIndex]: 'success' }))
    } catch (err: unknown) {
      console.error('Scan error:', err)
      const message = err instanceof Error ? err.message : ''
      if (message === 'PDF_NOT_SUPPORTED') {
        attachPassportFile(travelerIndex, file)
        setScanResult((prev) => ({ ...prev, [travelerIndex]: 'pdf' }))
      } else if (message === 'OCR_DISABLED') {
        attachPassportFile(travelerIndex, file)
        setScanResult((prev) => ({ ...prev, [travelerIndex]: 'failed' }))
        window.alert('Passport scanning is disabled. Enable an OCR engine in Admin → Settings → OCR.')
      } else if (message.includes('API key missing') || message === 'PASSPORT_OCR_API_KEY_MISSING') {
        attachPassportFile(travelerIndex, file)
        setScanResult((prev) => ({ ...prev, [travelerIndex]: 'failed' }))
        window.alert(
          'Passport OCR API is enabled but no API key is configured. Add your key in Admin → Settings → OCR or set PASSPORT_OCR_API_KEY in .env.',
        )
      } else {
        attachPassportFile(travelerIndex, file)
        setScanResult((prev) => ({ ...prev, [travelerIndex]: 'failed' }))
      }
    } finally {
      setIsScanning((prev) => ({ ...prev, [travelerIndex]: false }))
    }
  }

  const updateTraveler = (index: number, field: keyof TravelerForm, value: string) => {
    setFormData((prev) => ({
      ...prev,
      travelers: prev.travelers.map((t, i) => (i === index ? { ...t, [field]: value } : t)),
    }))
    setAutoFilledFields((prev) => ({
      ...prev,
      [index]: (prev[index] ?? []).filter((f) => f !== field),
    }))
  }

  const updateTravelerResidence = (index: number, livesInApplicantResidence: boolean) => {
    setFormData((prev) => ({
      ...prev,
      travelers: prev.travelers.map((t, i) =>
        i === index
          ? {
              ...t,
              livesInApplicantResidence,
              ...(livesInApplicantResidence ? {} : { uaeVisaExpiry: '', emiratesIdExpiry: '' }),
            }
          : t,
      ),
    }))
  }

  const updateTravelInfo = <K extends keyof TravelInfo>(field: K, value: TravelInfo[K]) => {
    setFormData((prev) => ({ ...prev, travelInfo: { ...prev.travelInfo, [field]: value } }))
  }

  const addTraveler = () => {
    const { countryCode } = resolveDefaultPhoneCountry({
      residenceCode,
      residenceCountry,
      nationality: citizenship,
    })
    setFormData((prev) => ({ ...prev, travelers: [...prev.travelers, emptyTraveler(countryCode)] }))
  }

  const removeTraveler = (index: number) => {
    if (index === 0) return
    setFormData((prev) => ({ ...prev, travelers: prev.travelers.filter((_, i) => i !== index) }))
  }

  const handleDepartureSelect = (d: Date) => {
    const maxReturn = addDays(d, validityDays)
    let nextReturn = addDays(d, defaultReturnOffsetDays)
    if (nextReturn > maxReturn) nextReturn = maxReturn
    setFormData((prev) => ({ ...prev, departureDate: d, returnDate: nextReturn }))
    setReturnCalendarHighlight(true)
    window.setTimeout(() => returnCalendarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80)
    window.setTimeout(() => setReturnCalendarHighlight(false), 2400)
  }

  const handleFileSelect = (uploadKey: string, doc: DocDef, file: File | undefined) => {
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const typeOk = doc.mimeTypes.includes(file.type) || doc.extensions.includes(ext)
    if (!typeOk) {
      setUploadErrors((prev) => ({ ...prev, [uploadKey]: doc.typeError }))
      setFormData((prev) => {
        const next = { ...prev.uploads }
        delete next[uploadKey]
        return { ...prev, uploads: next }
      })
      return
    }
    if (file.size > doc.maxBytes) {
      setUploadErrors((prev) => ({ ...prev, [uploadKey]: doc.sizeError }))
      setFormData((prev) => {
        const next = { ...prev.uploads }
        delete next[uploadKey]
        return { ...prev, uploads: next }
      })
      return
    }
    setUploadErrors((prev) => { const next = { ...prev }; delete next[uploadKey]; return next })
    const travelerIndex = Number(uploadKey.split('-')[0])
    const isPassportDoc = uploadKey.endsWith('-passport')
    setFormData((prev) => ({
      ...prev,
      uploads: {
        ...prev.uploads,
        [uploadKey]: { fileName: file.name, sizeMb: formatFileSize(file.size), fromPersonalStep: false },
      },
      travelers: isPassportDoc && !Number.isNaN(travelerIndex)
        ? prev.travelers.map((t, i) => (i === travelerIndex ? { ...t, passportFile: file } : t))
        : prev.travelers,
    }))
    void readFileAsDataUrl(file).then(({ fileData, mimeType }) => {
      setFormData((prev) => {
        const entry = prev.uploads[uploadKey]
        if (!entry) return prev
        return {
          ...prev,
          uploads: {
            ...prev.uploads,
            [uploadKey]: { ...entry, fileData, mimeType },
          },
        }
      })
    })
  }

  const removeUpload = (uploadKey: string) => {
    const travelerIndex = Number(uploadKey.split('-')[0])
    const isPassportDoc = uploadKey.endsWith('-passport')
    setFormData((prev) => {
      const next = { ...prev.uploads }
      delete next[uploadKey]
      return {
        ...prev,
        uploads: next,
        travelers:
          isPassportDoc && !Number.isNaN(travelerIndex)
            ? prev.travelers.map((t, i) =>
                i === travelerIndex ? { ...t, passportFile: undefined } : t,
              )
            : prev.travelers,
      }
    })
    setUploadErrors((prev) => { const next = { ...prev }; delete next[uploadKey]; return next })
  }

  const markStepDone = (s: keyof typeof stepDone) => {
    setStepDone((prev) => ({ ...prev, [s]: true }))
  }

  const goToStep = (next: ApplyStep) => navigate(applyUrl(next))

  const handlePersonalContinue = () => {
    if (!personalComplete) return
    markStepDone('personal')
    setFormData((prev) => ({
      ...prev,
      uploads: syncPassportFilesToUploads(prev.travelers, prev.uploads),
    }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
    goToStep('travel')
  }

  const handleTravelContinue = () => {
    if (!travelComplete) return
    markStepDone('travel')
    setFormData((prev) => ({
      ...prev,
      uploads: syncPassportFilesToUploads(prev.travelers, prev.uploads),
    }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
    goToStep('docs')
  }

  const handleDocsContinue = () => {
    if (!docsComplete) return
    markStepDone('docs')
    setFormData((prev) => ({
      ...prev,
      uploads: syncPassportFilesToUploads(prev.travelers, prev.uploads),
    }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
    goToStep('appt')
  }

  const handleApptContinue = () => {
    if (!apptComplete) return
    markStepDone('appt')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    goToStep('checkout')
  }

  const sidebarSteps: { key: ApplyStep; label: string; icon: (color: string) => ReactNode }[] = [
    { key: 'personal', label: 'Travelers', icon: (c) => <PeopleIcon color={c} /> },
    { key: 'travel', label: 'Travel Info', icon: (c) => <PlaneIcon color={c} /> },
    { key: 'docs', label: 'Docs', icon: (c) => <DocsIcon color={c} /> },
    { key: 'appt', label: 'Appt', icon: (c) => <CalendarStepIcon color={c} /> },
    { key: 'checkout', label: 'Checkout', icon: (c) => <CartIcon color={c} /> },
  ]

  const showBottomBar = step === 'personal' || step === 'travel' || step === 'docs'
  const bottomPad = showBottomBar ? 80 : 48

  const passportExpiryWarning = (expiry: string) => {
    const d = parseDobDisplay(expiry)
    if (!d) return null
    const sixMonths = addMonths(today, 6)
    if (d < sixMonths) return 'Passport expires too soon for this visa'
    return null
  }

  const permitExpiryWarning = (expiry: string) => {
    const d = parseDobDisplay(expiry)
    if (!d) return null
    if (d < today) return 'Your residence permit has expired'
    const threeMonths = addMonths(today, 3)
    if (d < threeMonths) return 'Your residence permit expires soon'
    return null
  }

  const travelerAvatarColor = (i: number) => ['#f93e42', '#5057ea', '#22c55e', '#f59e0b'][i % 4]

  return (
    <div style={{ minHeight: '100vh', background: BG_GRADIENT, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes scanLine {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        @keyframes blink {
          0%, 80%, 100% { opacity: 0.2; }
          40% { opacity: 1; }
        }
        .passport-scan-line {
          background: linear-gradient(90deg, transparent, #5057ea, transparent);
          box-shadow: 0 0 8px rgba(80, 87, 234, 0.6);
          animation: scanLine 1.5s ease-in-out infinite alternate;
        }
        .passport-scan-dot {
          animation: blink 1.4s infinite;
        }
      `}</style>
      <header style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: isMobile ? '12px 16px' : '16px 24px', gap: 12 }}>
        <button type="button" onClick={() => navigate(-1)} style={{ justifySelf: 'start', border: 'none', background: 'none', fontSize: 15, fontWeight: 600, color: '#333', cursor: 'pointer', padding: '8px 0' }}>
          ← Back
        </button>
        <div style={{ textAlign: 'center', minWidth: 120 }}>
          {isMobile && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              {STEPS.map((s) => (
                <span key={s} style={{ width: 8, height: 8, borderRadius: '50%', background: s === step ? ACCENT : completed[s] || unlocked[s] ? GREEN : '#ddd' }} />
              ))}
            </div>
          )}
          <p style={{ margin: 0, fontSize: 11, color: '#888', letterSpacing: '0.06em' }}>{progress}% COMPLETED</p>
          <div style={{ marginTop: 6, height: 3, width: isMobile ? 120 : 160, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.max(progress, 4)}%`, background: ACCENT, borderRadius: 2, transition: 'width 0.3s ease' }} />
          </div>
        </div>
        <Link to="/" style={{ justifySelf: 'end', width: 40, height: 40, borderRadius: '50%', border: '1px solid #eee', background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }} aria-label="Home">
          <HomeIcon />
        </Link>
      </header>

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {!isMobile && (
          <aside style={{ position: 'fixed', left: 0, top: 72, bottom: 0, width: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.5)', borderRight: '1px solid rgba(0,0,0,0.06)' }}>
            {sidebarSteps.map(({ key, label, icon }) => {
              const color = completed[key] ? GREEN : key === step ? ACCENT : unlocked[key] ? '#888' : '#ccc'
              return (
                <SidebarItem key={key} stepKey={key} current={step} label={label} icon={icon(color)} unlocked={unlocked[key]} completed={completed[key]} onNavigate={() => goToStep(key)} />
              )
            })}
          </aside>
        )}

        <main style={{ flex: 1, marginLeft: isMobile ? 0 : 60, padding: isMobile ? `16px 16px ${bottomPad}px` : `24px 32px ${bottomPad}px`, display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: step === 'travel' ? 700 : step === 'docs' ? 960 : 560 }}>

            {step === 'personal' && (
              <>
                {travelers.length < 2 && (
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ display: 'inline-block', background: '#f0fff4', border: '1px solid #c3e6cb', color: '#2d6a4f', borderRadius: 40, padding: '8px 20px', fontSize: 13, fontWeight: 500 }}>
                      ✓ Add 1 more traveller to unlock 5% off
                    </span>
                  </div>
                )}
                <h1 style={{ margin: '32px 0 8px', fontSize: 24, fontWeight: 700, textAlign: 'center', color: '#111' }}>
                  Who&apos;s going on this trip to {country.name}?
                </h1>
                <p style={{ margin: '0 0 24px', color: '#888', fontSize: 14, textAlign: 'center' }}>
                  You can add all travellers or continue solo
                </p>

                <div style={{ background: '#fff', borderRadius: 20, padding: 24, marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: '#111' }}>
                    Where are you applying from?
                  </h2>
                  <ResidenceSelector
                    residenceCountry={residenceCountry}
                    residenceCode={residenceCode}
                    residencyStatus={residencyStatus}
                    onResidenceChange={setResidenceCountry}
                    onStatusChange={(s) => setResidencyStatus(s as ResidencyStatus)}
                    compact
                  />
                  {visaRequirements && (
                    <div
                      style={{
                        marginTop: 20,
                        background: '#f0f4ff',
                        border: '1px solid #c7d2fe',
                        borderRadius: 12,
                        padding: 14,
                      }}
                    >
                      <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#333' }}>
                        📋 Based on your profile, you will need:
                      </p>
                      <ul style={{ margin: '0 0 8px', paddingLeft: 18, fontSize: 13, color: '#555', lineHeight: 1.7 }}>
                        {visaRequirements.documents
                          .filter((d) => d.required)
                          .slice(0, 4)
                          .map((d) => (
                            <li key={d.id}>{d.name}</li>
                          ))}
                      </ul>
                      <p style={{ margin: 0, fontSize: 12, color: '#888' }}>
                        Full document list will be shown in the Documents step
                      </p>
                    </div>
                  )}
                </div>

                {travelers.map((traveler, index) => {
                  const passWarn = passportExpiryWarning(traveler.passportExpiry)
                  const permitWarn = permitExpiryWarning(traveler.uaeVisaExpiry)
                  const emailErr = emailTouched[index] && traveler.email && !isValidEmail(traveler.email)
                  const nationalityErr = nationalityTouched[index] && !resolveNationalityName(traveler.nationality)
                  const residenceFields = getTravelerResidenceFieldRequirements(
                    traveler,
                    index,
                    residenceCountry,
                    residencyStatus,
                  )
                  const showResidenceToggle =
                    index > 0 && applicantHasResidenceDocumentation(residenceCountry, residencyStatus)
                  return (
                    <div key={index} style={{ position: 'relative', background: '#fff', borderRadius: 20, padding: 28, marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                      {index > 0 && (
                        <button type="button" aria-label={`Remove traveller ${index + 1}`} onClick={() => removeTraveler(index)} style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: '50%', background: '#fff0f0', color: BRAND, border: 'none', fontSize: 16, cursor: 'pointer', lineHeight: 1 }}>×</button>
                      )}
                      <p style={{ margin: '0 0 20px', fontWeight: 700, fontSize: 16 }}>Traveller {index + 1}</p>

                      <PassportUploadSection
                        isScanning={Boolean(isScanning[index])}
                        scanProgress={scanProgress[index] ?? 0}
                        scanResult={scanResult[index] ?? null}
                        scannedData={scannedDataByTraveler[index] ?? null}
                        previewUrl={previewUrls[index] ?? null}
                        isPdf={Boolean(previewIsPdf[index])}
                        onUpload={(file) => void handlePassportUpload(file, index)}
                        onRescan={() => resetScanState(index)}
                        onTryAgain={() => resetScanState(index)}
                        onFillManually={() => setScanResult((prev) => ({ ...prev, [index]: null }))}
                      />

                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
                        <div>
                          <FieldLabel autoFilled={isAutoFilled(index, 'firstName')}>First Name *</FieldLabel>
                          <input style={borderInputStyle} value={traveler.firstName} onChange={(e) => updateTraveler(index, 'firstName', e.target.value.toUpperCase())} />
                        </div>
                        <div>
                          <FieldLabel autoFilled={isAutoFilled(index, 'lastName')}>Last Name *</FieldLabel>
                          <input style={borderInputStyle} value={traveler.lastName} onChange={(e) => updateTraveler(index, 'lastName', e.target.value.toUpperCase())} />
                        </div>
                        <div>
                          <FieldLabel autoFilled={isAutoFilled(index, 'dateOfBirth')}>Date of Birth *</FieldLabel>
                          <DobDatePicker value={traveler.dateOfBirth} onChange={(v) => updateTraveler(index, 'dateOfBirth', v)} />
                        </div>
                        <PassportNumberField
                          value={traveler.passportNumber}
                          nationality={resolveNationalityName(traveler.nationality) || traveler.nationality || citizenship}
                          onChange={(v) => updateTraveler(index, 'passportNumber', v)}
                          autoFilled={isAutoFilled(index, 'passportNumber')}
                        />
                        <div>
                          <FieldLabel autoFilled={isAutoFilled(index, 'passportExpiry')}>Passport Expiry Date *</FieldLabel>
                          <DatePickerField value={traveler.passportExpiry} onChange={(v) => updateTraveler(index, 'passportExpiry', v)} placeholder="Select expiry date" />
                          {passWarn && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#dc2626' }}>{passWarn}</p>}
                        </div>
                        {showResidenceToggle && (
                          <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 10,
                                fontSize: 13,
                                color: '#374151',
                                cursor: 'pointer',
                                lineHeight: 1.5,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={traveler.livesInApplicantResidence === true}
                                onChange={(e) => updateTravelerResidence(index, e.target.checked)}
                                style={{ marginTop: 3, accentColor: ACCENT }}
                              />
                              <span>
                                This traveller also lives in {residenceCountry} (same as you) and has a{' '}
                                {isUaeResidence(residenceCountry) && residencyStatus !== 'Tourist/Visit' && residencyStatus !== 'Other'
                                  ? 'UAE residence visa & Emirates ID'
                                  : 'valid residence permit / entry permit'}
                              </span>
                            </label>
                            {traveler.livesInApplicantResidence !== true && (
                              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b' }}>
                                Family members travelling from abroad only need passport details — no UAE visa or Emirates ID required.
                              </p>
                            )}
                          </div>
                        )}
                        {residenceFields.showPermitExpiry && (
                          <div>
                            <FieldLabel autoFilled={isAutoFilled(index, 'uaeVisaExpiry')}>
                              {residenceFields.permitLabel}
                            </FieldLabel>
                            <DatePickerField value={traveler.uaeVisaExpiry} onChange={(v) => updateTraveler(index, 'uaeVisaExpiry', v)} placeholder="Select expiry date" />
                            {permitWarn && <p style={{ margin: '4px 0 0', fontSize: 12, color: ORANGE }}>{permitWarn}</p>}
                          </div>
                        )}
                        {residenceFields.showEmiratesId && (
                          <div>
                            <FieldLabel autoFilled={isAutoFilled(index, 'emiratesIdExpiry')}>
                              {residenceFields.emiratesLabel ?? 'National ID Expiry Date *'}
                            </FieldLabel>
                            <DatePickerField value={traveler.emiratesIdExpiry} onChange={(v) => updateTraveler(index, 'emiratesIdExpiry', v)} placeholder="Select ID expiry" />
                          </div>
                        )}
                        <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                          <FieldLabel autoFilled={isAutoFilled(index, 'mobile')}>Mobile Number *</FieldLabel>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'stretch', marginTop: 6, width: '100%' }}>
                            <select
                              value={traveler.mobileCountryCode}
                              onChange={(e) => {
                                setMobileCountryCodeTouched((prev) => ({ ...prev, [index]: true }))
                                updateTraveler(index, 'mobileCountryCode', e.target.value)
                              }}
                              aria-label="Country calling code"
                              style={{
                                ...borderInputStyle,
                                marginTop: 0,
                                width: 112,
                                minWidth: 112,
                                maxWidth: 112,
                                flexShrink: 0,
                                padding: '10px 8px',
                                cursor: 'pointer',
                              }}
                            >
                              {phoneCodeOptions.map((opt) => (
                                <option key={opt.countryCode} value={opt.countryCode} title={opt.countryName}>
                                  {opt.dial}
                                </option>
                              ))}
                            </select>
                            <input
                              style={{
                                ...borderInputStyle,
                                marginTop: 0,
                                flex: 1,
                                minWidth: 0,
                                width: 'auto',
                              }}
                              type="tel"
                              inputMode="numeric"
                              value={traveler.mobile}
                              onChange={(e) => updateTraveler(index, 'mobile', e.target.value.replace(/\D/g, ''))}
                              placeholder={getPhonePlaceholder(getDialCodeByCountryCode(traveler.mobileCountryCode))}
                            />
                          </div>
                        </div>
                        <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                          <FieldLabel autoFilled={isAutoFilled(index, 'email')}>Email Address *</FieldLabel>
                          <input
                            style={borderInputStyle}
                            type="email"
                            value={traveler.email}
                            onChange={(e) => updateTraveler(index, 'email', e.target.value)}
                            onBlur={() => setEmailTouched((p) => ({ ...p, [index]: true }))}
                            placeholder={isLoggedIn && index === 0 ? 'your@email.com' : undefined}
                            autoComplete="email"
                          />
                          {emailErr && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#dc2626' }}>Please enter a valid email address</p>}
                        </div>
                        <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                          <FieldLabel autoFilled={isAutoFilled(index, 'nationality')}>Nationality *</FieldLabel>
                          <NationalityInput
                            value={traveler.nationality}
                            defaultNationality={citizenship}
                            invalid={nationalityErr}
                            onChange={(v) => updateTraveler(index, 'nationality', v)}
                            onBlur={() => setNationalityTouched((p) => ({ ...p, [index]: true }))}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
                <button type="button" onClick={addTraveler} style={{ border: 'none', background: 'none', color: ACCENT, fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '8px 0' }}>
                  + Add Traveller
                </button>
              </>
            )}

            {step === 'travel' && (
              <>
                <h1 style={{ margin: '32px 0 8px', fontSize: 24, fontWeight: 700, textAlign: 'center' }}>Tell us about your trip</h1>
                <p style={{ margin: '0 0 24px', color: '#888', fontSize: 14, textAlign: 'center' }}>This helps us prepare the right application</p>
                <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#333' }}>Destination Country</p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#f5f5f5', borderRadius: 40, padding: '10px 20px', marginBottom: 24 }}>
                    <img src={flagUrl(country.countryCode, 24)} alt="" width={24} height={16} style={{ borderRadius: 2, objectFit: 'cover' }} />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{country.name}</span>
                    <button type="button" onClick={() => navigate(-1)} style={{ border: 'none', background: 'none', color: ACCENT, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginLeft: 8 }}>Change</button>
                  </div>

                  <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600 }}>Purpose of Travel *</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                    {TRAVEL_PURPOSES.map((p) => (
                      <button key={p} type="button" onClick={() => updateTravelInfo('purpose', p)} style={{ border: travelInfo.purpose === p ? 'none' : '1px solid #eee', borderRadius: 40, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: travelInfo.purpose === p ? BRAND : '#fff', color: travelInfo.purpose === p ? '#fff' : '#333' }}>{p}</button>
                    ))}
                  </div>

                  <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600 }}>Occupation *</p>
                  <select value={travelInfo.occupation} onChange={(e) => updateTravelInfo('occupation', e.target.value)} style={{ width: '100%', border: '1px solid #eee', borderRadius: 10, padding: '10px 12px', fontSize: 14, marginBottom: 20, boxSizing: 'border-box' }}>
                    <option value="">Select occupation</option>
                    {OCCUPATIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>

                  {(travelInfo.occupation === 'Employed' || travelInfo.occupation === 'Business Owner') && (
                    <div style={{ marginBottom: 20 }}>
                      <label style={labelStyle}>Company Name *</label>
                      <input style={borderInputStyle} value={travelInfo.companyName} onChange={(e) => updateTravelInfo('companyName', e.target.value)} placeholder="Company / Business name" />
                    </div>
                  )}

                  {(travelInfo.occupation === 'Employed' || travelInfo.occupation === 'Self Employed') && (
                    <div style={{ marginBottom: 20 }}>
                      <label style={labelStyle}>Monthly Salary *</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input style={{ ...borderInputStyle, flex: 1 }} type="number" value={travelInfo.salary} onChange={(e) => updateTravelInfo('salary', e.target.value)} placeholder="Amount" />
                        <select value={travelInfo.salaryCurrency} onChange={(e) => updateTravelInfo('salaryCurrency', e.target.value)} style={{ border: '1px solid #eee', borderRadius: 10, padding: '10px 12px', fontSize: 14, minWidth: 110 }}>
                          {salaryCurrencyOptions.map((c) => (
                            <option key={c.code} value={c.code}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600 }}>Bank Statement Available? *</p>
                  <div style={{ display: 'flex', gap: 8, marginBottom: travelInfo.bankStatementAvailable === 'no' ? 8 : 20 }}>
                    {(['yes', 'no'] as const).map((v) => (
                      <button key={v} type="button" onClick={() => updateTravelInfo('bankStatementAvailable', v)} style={{ border: travelInfo.bankStatementAvailable === v && v === 'no' ? '1px solid #eee' : travelInfo.bankStatementAvailable === v ? 'none' : '1px solid #eee', borderRadius: 40, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: travelInfo.bankStatementAvailable === v ? (v === 'yes' ? GREEN : '#fff') : '#fff', color: travelInfo.bankStatementAvailable === v && v === 'yes' ? '#fff' : '#333' }}>{v === 'yes' ? 'Yes' : 'No'}</button>
                    ))}
                  </div>
                  {travelInfo.bankStatementAvailable === 'no' && (
                    <p style={{ margin: '0 0 20px', padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, fontSize: 13, color: '#92400e' }}>
                      Bank statement is usually required. We&apos;ll contact you for alternatives.
                    </p>
                  )}

                  <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600 }}>Previous Visa Rejection? *</p>
                  <div style={{ display: 'flex', gap: 8, marginBottom: travelInfo.previousRejection === 'yes' ? 12 : 20 }}>
                    {(['yes', 'no'] as const).map((v) => (
                      <button key={v} type="button" onClick={() => updateTravelInfo('previousRejection', v)} style={{ border: travelInfo.previousRejection === v ? 'none' : '1px solid #eee', borderRadius: 40, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: travelInfo.previousRejection === v ? (v === 'yes' ? BRAND : GREEN) : '#fff', color: travelInfo.previousRejection === v ? '#fff' : '#333' }}>{v === 'yes' ? 'Yes' : 'No'}</button>
                    ))}
                  </div>
                  {travelInfo.previousRejection === 'yes' && (
                    <textarea value={travelInfo.rejectionDetails} onChange={(e) => updateTravelInfo('rejectionDetails', e.target.value)} placeholder="Please describe the rejection briefly (country, year, reason)" style={{ width: '100%', minHeight: 80, background: '#fff8f8', border: `1px solid ${BRAND}`, borderRadius: 12, padding: 12, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 20, resize: 'vertical' }} />
                  )}

                  <div>
                    <label style={labelStyle}>Agent Referral Name</label>
                    <input style={borderInputStyle} value={travelInfo.agentReferral} onChange={(e) => updateTravelInfo('agentReferral', e.target.value)} placeholder="Enter agent name if referred by someone" />
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>Leave blank if you found us directly</p>
                  </div>
                </div>
              </>
            )}

            {step === 'docs' && (
              <>
                <h1 style={{ margin: '32px 0 8px', fontSize: 24, fontWeight: 700, textAlign: 'center' }}>The Essential Documents</h1>
                <p style={{ margin: '0 0 24px', color: '#888', fontSize: 14, textAlign: 'center' }}>As per official {country.name} embassy requirements</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
                  {travelers.map((traveler, ti) => {
                    const name = `${traveler.firstName} ${traveler.lastName}`.trim() || `Traveller ${ti + 1}`
                    const travelerDocs = getTravelerDocList(
                      docList,
                      traveler,
                      ti,
                      residenceCountry,
                      residencyStatus,
                    )
                    const uploadedCount = travelerDocs.filter((d) =>
                      hasTravelerDocUploaded(ti, d, traveler, effectiveUploads, uploadErrors),
                    ).length
                    const requiredCount = travelerDocs.filter((d) => d.required).length
                    const requiredUploaded = travelerDocs.filter(
                      (d) => d.required && hasTravelerDocUploaded(ti, d, traveler, effectiveUploads, uploadErrors),
                    ).length
                    return (
                      <div key={ti} style={{ background: '#fff', borderRadius: 20, padding: 20, minWidth: 280, flex: '1 1 280px', maxWidth: 460, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: travelerAvatarColor(ti), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{name}</p>
                            <p style={{ margin: '2px 0 0', fontSize: 12, color: requiredUploaded === requiredCount ? GREEN : '#888' }}>
                              {requiredUploaded}/{requiredCount} required docs
                              {travelerDocs.length > requiredCount ? ` · ${uploadedCount}/${travelerDocs.length} total` : ''}
                            </p>
                          </div>
                        </div>
                        {travelerDocs.map((doc) => {
                          const uploadKey = `${ti}-${doc.id}`
                          const entry = getTravelerDocEntry(ti, doc.id, traveler, effectiveUploads)
                          const err = uploadErrors[uploadKey]
                          const passportAutoAttached =
                            doc.id === 'passport' && Boolean(traveler.passportFile && entry)
                          return (
                            <div key={doc.id}>
                              <input ref={(el) => { fileInputRefs.current[uploadKey] = el }} type="file" accept={doc.accept} style={{ display: 'none' }} onChange={(e) => handleFileSelect(uploadKey, doc, e.target.files?.[0])} />
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={() => !entry && fileInputRefs.current[uploadKey]?.click()}
                                onKeyDown={(e) => e.key === 'Enter' && !entry && fileInputRefs.current[uploadKey]?.click()}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 10,
                                  padding: '12px 8px',
                                  borderBottom: '1px solid #f0f0f0',
                                  cursor: entry ? 'default' : 'pointer',
                                  background: passportAutoAttached ? '#f8fff9' : undefined,
                                  borderRadius: passportAutoAttached ? 8 : 0,
                                }}
                              >
                                <UploadIcon />
                                <div style={{ flex: 1 }}>
                                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>
                                    {doc.name}
                                    {doc.required ? <span style={{ color: BRAND }}> *</span> : <span style={{ marginLeft: 6, fontSize: 10, background: '#f0f0f0', color: '#888', borderRadius: 4, padding: '2px 6px' }}>Optional</span>}
                                    {doc.condition && (
                                      <span style={{ marginLeft: 6, fontSize: 10, background: '#eef4ff', color: ACCENT, borderRadius: 4, padding: '2px 6px' }}>
                                        {doc.condition} only
                                      </span>
                                    )}
                                  </p>
                                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>{doc.description}</p>
                                  {err && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#dc2626' }}>{err}</p>}
                                  {entry && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                                      <span style={{ color: GREEN, fontWeight: 700 }}>✓</span>
                                      <span style={{ fontSize: 13, color: '#333' }}>{entry.fileName} {entry.sizeMb}</span>
                                      {passportAutoAttached && (
                                        <span style={{ fontSize: 10, background: '#f0fff4', color: '#16a34a', borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>
                                          From passport scan
                                        </span>
                                      )}
                                      <button type="button" onClick={(e) => { e.stopPropagation(); removeUpload(uploadKey) }} style={{ border: 'none', background: 'none', color: BRAND, fontSize: 16, cursor: 'pointer', marginLeft: 'auto' }}>×</button>
                                      <button type="button" onClick={(e) => { e.stopPropagation(); fileInputRefs.current[uploadKey]?.click() }} style={{ border: 'none', background: 'none', color: ACCENT, fontSize: 12, cursor: 'pointer' }}>Replace</button>
                                    </div>
                                  )}
                                  {!entry && doc.id === 'passport' && !traveler.passportFile && (
                                    <p style={{ margin: '6px 0 0', fontSize: 12, color: '#888' }}>
                                      Upload your passport copy here if you did not upload on the personal step
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
                {visaRequirements && visaRequirements.notes.length > 0 && (
                  <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {visaRequirements.notes.map((note) => (
                      <div
                        key={note}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          background: '#f8f9ff',
                          borderRadius: 8,
                          padding: 10,
                          fontSize: 13,
                          color: '#555',
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0, marginTop: 2 }}>
                          <circle cx="12" cy="12" r="10" stroke={ACCENT} strokeWidth="1.5" />
                          <path d="M12 8v5M12 16h.01" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        {note}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {step === 'appt' && (
              <>
                <h1 style={{ margin: '32px 0 8px', fontSize: 24, fontWeight: 700, textAlign: 'center' }}>Select your travel dates</h1>
                <p style={{ margin: '0 0 12px', color: '#888', fontSize: 14, textAlign: 'center' }}>Choose departure and return dates for your trip</p>
                <p style={{ margin: '0 auto 24px', color: ACCENT, fontSize: 14, background: '#eef4ff', borderRadius: 8, padding: '8px 14px', textAlign: 'center', maxWidth: 480 }}>
                  Your {selectedOption.label} visa is valid for {validityLabel} from entry date
                </p>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <ApplyCalendar label="Departure date" selected={departureDate} minDate={today} maxDate={maxDeparture} syncViewDate={departureDate} onSelect={handleDepartureSelect} />
                  <ApplyCalendar label="Return date" selected={returnDate} minDate={minReturnDate} maxDate={maxReturnDate} syncViewDate={returnDate ?? (departureDate ? addDays(departureDate, defaultReturnOffsetDays) : null)} highlighted={returnCalendarHighlight} containerRef={returnCalendarRef} onSelect={(d) => setFormData((prev) => ({ ...prev, returnDate: d }))} />
                </div>
                {returnDateInvalid && (
                  <p style={{ margin: '16px 0 0', color: '#dc2626', fontSize: 14, textAlign: 'center', fontWeight: 500 }}>
                    Exceeds your visa validity of {validityLabel}
                  </p>
                )}
                {visaExpiryDate && (
                  <div style={{ margin: '24px auto 0', textAlign: 'center', maxWidth: 480 }}>
                    <p style={{ margin: '0 0 8px', fontSize: 14, color: '#666' }}>
                      Your visa will expire on <strong>{formatDateLabel(visaExpiryDate)}</strong>
                    </p>
                    {returnDate && (
                      <span style={{ display: 'inline-block', borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 600, background: returnWithinValidity ? '#f0fff4' : '#fff0f0', color: returnWithinValidity ? GREEN : '#dc2626', border: `1px solid ${returnWithinValidity ? '#c3e6cb' : '#fecaca'}` }}>
                        {returnWithinValidity ? '✓ Return date within visa validity' : '✗ Return date exceeds visa validity'}
                      </span>
                    )}
                  </div>
                )}
                <p style={{ margin: '24px 0 0', textAlign: 'center', fontSize: 14, color: '#666', background: '#fff', borderRadius: 12, padding: '12px 16px' }}>
                  Your visa will be ready by <strong style={{ color: '#111' }}>{visaReadyBy}</strong>
                </p>
                <div style={{ textAlign: 'center', marginTop: 32 }}>
                  <ActionButton enabled={apptComplete} label="Continue →" onClick={handleApptContinue} />
                </div>
              </>
            )}

            {step === 'checkout' && (
              <>
                <h1 style={{ margin: '32px 0 24px', fontSize: 24, fontWeight: 700, textAlign: 'center' }}>Review and pay</h1>
                <CheckoutPaymentForm
                  country={country}
                  selectedOption={selectedOption}
                  travelers={travelers}
                  departureDate={departureDate}
                  returnDate={returnDate}
                  pricing={pricing}
                  docsComplete={docsComplete}
                  passportCode={countryCode || country.countryCode}
                  uploads={effectiveUploads}
                />
              </>
            )}
          </div>
        </main>
      </div>

      {step === 'personal' && (
        <FixedBottomBar
          isMobile={isMobile}
          left={<SuperVaultLock />}
          center={!personalComplete && personalMissingHint ? (
            <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500 }}>{personalMissingHint}</span>
          ) : undefined}
          right={<ActionButton enabled={personalComplete} label="Continue →" onClick={handlePersonalContinue} />}
        />
      )}
      {step === 'travel' && (
        <FixedBottomBar isMobile={isMobile} left={<button type="button" onClick={() => goToStep('personal')} style={{ border: 'none', background: 'none', color: '#333', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>← Back</button>} right={<ActionButton enabled={travelComplete} label="Continue →" onClick={handleTravelContinue} />} />
      )}
      {step === 'docs' && (
        <FixedBottomBar
          isMobile={isMobile}
          left={<SuperVaultLock />}
          center={
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <button type="button" onClick={() => goToStep('personal')} style={{ border: `1px solid ${ACCENT}`, background: '#fff', color: ACCENT, borderRadius: 12, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                + Add travelers
              </button>
              {!docsComplete && docsMissingHint && (
                <p style={{ margin: 0, fontSize: 12, color: '#dc2626', textAlign: 'center', maxWidth: 280 }}>
                  {docsMissingHint}
                </p>
              )}
            </div>
          }
          right={<ActionButton enabled={docsComplete} label="Proceed to Appointment →" onClick={handleDocsContinue} />}
        />
      )}

      <SiteFooter isMobile={isMobile} />
    </div>
  )
}
