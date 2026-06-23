import Tesseract from 'tesseract.js'

export interface PassportData {
  firstName: string
  lastName: string
  passportNumber: string
  nationality: string
  dateOfBirth: string
  expiryDate: string
  gender: string
  rawText: string
}

async function fileToImageUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.type === 'application/pdf') {
      reject(new Error('PDF_NOT_SUPPORTED'))
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function preprocessImage(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = 2
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
        const contrast = 1.5
        const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255))
        const newVal = Math.min(255, Math.max(0, factor * (gray - 128) + 128))
        const threshold = newVal > 140 ? 255 : 0
        data[i] = threshold
        data[i + 1] = threshold
        data[i + 2] = threshold
      }
      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.src = imageUrl
  })
}

function cleanMRZLine(line: string): string {
  return line.toUpperCase().replace(/[^A-Z0-9<]/g, '')
}

function isMRZLine(line: string): boolean {
  const clean = cleanMRZLine(line)
  return clean.length >= 30 && clean.includes('<')
}

function parseMRZDate(yymmdd: string, isBirth: boolean = false): string {
  if (!yymmdd || yymmdd.length !== 6) return ''
  const yy = parseInt(yymmdd.slice(0, 2), 10)
  const mm = yymmdd.slice(2, 4)
  const dd = yymmdd.slice(4, 6)
  let yyyy: number
  if (isBirth) {
    const currentYY = new Date().getFullYear() % 100
    yyyy = yy > currentYY ? 1900 + yy : 2000 + yy
  } else {
    yyyy = 2000 + yy
  }
  return `${dd}/${mm}/${yyyy}`
}

export async function scanPassport(
  file: File,
  onProgress: (n: number) => void,
): Promise<PassportData> {
  const parsed: PassportData = {
    firstName: '',
    lastName: '',
    passportNumber: '',
    nationality: '',
    dateOfBirth: '',
    expiryDate: '',
    gender: '',
    rawText: '',
  }

  if (file.type === 'application/pdf') {
    throw new Error('PDF_NOT_SUPPORTED')
  }

  onProgress(5)

  const imageUrl = await fileToImageUrl(file)
  onProgress(10)

  const processedUrl = await preprocessImage(imageUrl)
  onProgress(20)

  const result = await Tesseract.recognize(processedUrl, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress(20 + Math.round(m.progress * 70))
      }
    },
  })

  onProgress(95)
  const rawText = result.data.text
  parsed.rawText = rawText
  console.log('OCR RAW TEXT:', rawText)

  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  const mrzCandidates = lines.filter(isMRZLine)
  console.log('MRZ CANDIDATES:', mrzCandidates)

  if (mrzCandidates.length >= 2) {
    const mrz1Raw = mrzCandidates[mrzCandidates.length - 2]
    const mrz2Raw = mrzCandidates[mrzCandidates.length - 1]
    const mrz1 = cleanMRZLine(mrz1Raw).padEnd(44, '<').slice(0, 44)
    const mrz2 = cleanMRZLine(mrz2Raw).padEnd(44, '<').slice(0, 44)
    console.log('MRZ1:', mrz1)
    console.log('MRZ2:', mrz2)

    if (mrz1.length >= 44) {
      parsed.nationality = mrz1.slice(2, 5).replace(/</g, '').trim()
      const nameField = mrz1.slice(5)
      const doubleChevron = nameField.indexOf('<<')
      if (doubleChevron !== -1) {
        parsed.lastName = nameField.slice(0, doubleChevron).replace(/</g, ' ').trim()
        parsed.firstName = nameField
          .slice(doubleChevron + 2)
          .replace(/</g, ' ')
          .trim()
          .split(' ')[0]
      } else {
        parsed.lastName = nameField.replace(/</g, ' ').trim()
      }
    }

    if (mrz2.length >= 44) {
      parsed.passportNumber = mrz2.slice(0, 9).replace(/</g, '').replace(/[^A-Z0-9]/gi, '').toUpperCase()
      if (!parsed.nationality) {
        parsed.nationality = mrz2.slice(10, 13).replace(/</g, '').trim()
      }
      parsed.dateOfBirth = parseMRZDate(mrz2.slice(13, 19), true)
      const sexChar = mrz2[20]
      parsed.gender = sexChar === 'M' ? 'Male' : sexChar === 'F' ? 'Female' : ''
      parsed.expiryDate = parseMRZDate(mrz2.slice(21, 27), false)
    }
  } else if (mrzCandidates.length === 1) {
    const mrz = cleanMRZLine(mrzCandidates[0]).padEnd(44, '<').slice(0, 44)
    if (mrz.startsWith('P')) {
      parsed.nationality = mrz.slice(2, 5).replace(/</g, '')
      const nameField = mrz.slice(5)
      const dc = nameField.indexOf('<<')
      if (dc !== -1) {
        parsed.lastName = nameField.slice(0, dc).replace(/</g, ' ').trim()
        parsed.firstName = nameField.slice(dc + 2).replace(/</g, ' ').trim().split(' ')[0]
      }
    } else {
      parsed.passportNumber = mrz.slice(0, 9).replace(/</g, '').replace(/[^A-Z0-9]/gi, '').toUpperCase()
      parsed.dateOfBirth = parseMRZDate(mrz.slice(13, 19), true)
      parsed.gender = mrz[20] === 'M' ? 'Male' : mrz[20] === 'F' ? 'Female' : ''
      parsed.expiryDate = parseMRZDate(mrz.slice(21, 27), false)
    }
  }

  if (!parsed.passportNumber) {
    const ppPatterns = [
      /\b([A-Z]{1,2}[0-9]{6,8})\b/,
      /\bPassport\s*No[.:]\s*([A-Z0-9]+)/i,
      /\bDocument\s*No[.:]\s*([A-Z0-9]+)/i,
    ]
    for (const pattern of ppPatterns) {
      const match = rawText.match(pattern)
      if (match) {
        parsed.passportNumber = match[1].replace(/[^A-Z0-9]/gi, '').toUpperCase()
        break
      }
    }
  }

  if (!parsed.lastName) {
    const surnameMatch = rawText.match(/(?:Surname|SURNAME|Last\s*Name)[:\s]+([A-Z]+)/i)
    if (surnameMatch) parsed.lastName = surnameMatch[1]
  }

  if (!parsed.firstName) {
    const givenMatch = rawText.match(/(?:Given\s*Names?|GIVEN|First\s*Name)[:\s]+([A-Z\s]+)/i)
    if (givenMatch) parsed.firstName = givenMatch[1].trim().split(' ')[0]
  }

  if (!parsed.nationality) {
    const natMatch = rawText.match(/(?:Nationality|NATIONALITY)[:\s]+([A-Z]+)/i)
    if (natMatch) parsed.nationality = natMatch[1]
  }

  onProgress(100)

  const hasData = parsed.passportNumber || parsed.lastName || parsed.firstName
  if (!hasData) {
    throw new Error('NO_DATA_FOUND')
  }

  return parsed
}
