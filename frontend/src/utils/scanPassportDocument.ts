import { Database } from '../database/db'
import { scanPassport, type PassportData } from './passportOCR'
import { scanPassportViaApi } from './passportOcrApi'

export type OcrEngine = 'passport-api' | 'tesseract'

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
  if (ints.tesseractOcr?.enabled !== false) return 'tesseract'
  return null
}

export function isOcrAutoFillEnabled(engine: OcrEngine): boolean {
  const ints = integrations()
  if (engine === 'passport-api') return ints.passportOcrApi?.autoFill !== false
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

  return scanPassport(file, onProgress)
}
