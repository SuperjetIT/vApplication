import type { PassportData } from './passportOCR'

export type PassportOcrApiResponse = {
  last_name?: string
  given_names?: string[]
  birth_place?: string
  birth_date?: string
  issuance_date?: string
  expire_date?: string
  document_id?: string
  issuing_state?: string
  gender?: string
  mrz?: string
  nationality?: string
  [key: string]: unknown
}

function isoDateToDdMmYyyy(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return iso
  return `${m[3]}/${m[2]}/${m[1]}`
}

function mapGender(g?: string): string {
  if (!g) return ''
  const c = g.toUpperCase().charAt(0)
  if (c === 'M') return 'Male'
  if (c === 'F') return 'Female'
  return g
}

export function mapPassportApiToPassportData(raw: PassportOcrApiResponse): PassportData {
  const firstName = Array.isArray(raw.given_names)
    ? raw.given_names.map((n) => String(n).trim()).filter(Boolean).join(' ')
    : ''
  const lastName = String(raw.last_name ?? '').trim()
  return {
    firstName,
    lastName,
    passportNumber: String(raw.document_id ?? '').trim(),
    nationality: String(raw.nationality ?? raw.issuing_state ?? '').trim(),
    dateOfBirth: raw.birth_date ? isoDateToDdMmYyyy(String(raw.birth_date)) : '',
    expiryDate: raw.expire_date ? isoDateToDdMmYyyy(String(raw.expire_date)) : '',
    gender: mapGender(raw.gender ? String(raw.gender) : undefined),
    rawText: String(raw.mrz ?? JSON.stringify(raw, null, 2)),
  }
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function scanPassportViaApi(
  file: File,
  apiKey: string,
  onProgress: (n: number) => void,
): Promise<PassportData> {
  onProgress(15)
  const imageBase64 = await fileToDataUrl(file)
  onProgress(40)

  const res = await fetch('/api/ocr/passport-api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64,
      ...(apiKey ? { apiKey } : {}),
      fileName: file.name,
      mimeType: file.type || 'image/jpeg',
    }),
  })

  onProgress(85)
  const payload = await res.json().catch(() => ({}))
  if (!res.ok || !payload.ok) {
    throw new Error(String(payload.error ?? 'Passport OCR API request failed'))
  }

  onProgress(100)
  return mapPassportApiToPassportData(payload.data as PassportOcrApiResponse)
}
