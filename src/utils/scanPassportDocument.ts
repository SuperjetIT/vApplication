import { Database } from '../database/db'
import { scanPassport, type PassportData } from './passportOCR'
import { scanPassportViaApi } from './passportOcrApi'

export type OcrEngine = 'passport-api' | 'tesseract' | 'ml'

type IntegrationSettings = Record<string, Record<string, unknown>>

function integrations(): IntegrationSettings {
  return (Database.getSettings().integrations as IntegrationSettings | undefined) ?? {}
}

export function isPassportOcrApiEnabled(): boolean {
  return Boolean(integrations().passportOcrApi?.enabled)
}

export function getPreferredOcrEngine(): OcrEngine | null {
  const ints = integrations()
  const passportApi = ints.passportOcrApi ?? {}
  if (passportApi.enabled) {
    return 'passport-api'
  }
  if (ints.mlOcr?.enabled) return 'ml'
  if (ints.tesseractOcr?.enabled !== false) return 'tesseract'
  return null
}

export function isOcrAutoFillEnabled(engine: OcrEngine): boolean {
  const ints = integrations()
  if (engine === 'passport-api') return ints.passportOcrApi?.autoFill !== false
  if (engine === 'ml') return Boolean(ints.mlOcr?.autoFill)
  return ints.tesseractOcr?.autoFill !== false
}

export function getPassportOcrApiKey(): string {
  return String(integrations().passportOcrApi?.apiKey ?? '').trim()
}

export async function scanPassportDocument(
  file: File,
  onProgress: (n: number) => void,
): Promise<PassportData> {
  const engine = getPreferredOcrEngine()
  if (!engine) {
    throw new Error('OCR_DISABLED')
  }

  if (engine === 'passport-api') {
    return scanPassportViaApi(file, getPassportOcrApiKey(), onProgress)
  }

  if (engine === 'ml') {
    onProgress(10)
    const b64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    onProgress(35)
    const res = await fetch('/api/ocr/ml-scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: b64 }),
    })
    const data = await res.json()
    onProgress(90)
    if (!res.ok || !data.ok) {
      throw new Error(String(data.error ?? 'ML OCR failed'))
    }
    const parsed = data.parsed as Record<string, string> | undefined
    onProgress(100)
    return {
      firstName: parsed?.firstName ?? '',
      lastName: parsed?.lastName ?? '',
      passportNumber: parsed?.passportNumber ?? '',
      nationality: parsed?.nationality ?? '',
      dateOfBirth: parsed?.dateOfBirth ?? '',
      expiryDate: parsed?.expiryDate ?? '',
      gender: parsed?.gender ?? '',
      rawText: String(data.rawText ?? ''),
    }
  }

  return scanPassport(file, onProgress)
}
