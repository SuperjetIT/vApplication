import { Database } from '../database/db'

export type ApplicationDocument = {
  id: string
  type: string
  fileName: string
  fileData?: string | null
  mimeType?: string
  fileSize?: number
  status?: string
  reviewNote?: string | null
  reviewedAt?: string
  reviewedBy?: string
  uploadedAt?: string
  travelerIndex?: number
}

export function readFileAsDataUrl(file: File): Promise<{ fileData: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      resolve({
        fileData: String(reader.result),
        mimeType: file.type || 'application/octet-stream',
      })
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

export function getApplicationDocuments(applicationId: string): ApplicationDocument[] {
  const app = Database.getApplicationById(applicationId)
  const embedded = Array.isArray(app?.documents)
    ? (app.documents as ApplicationDocument[])
    : []
  const fromTable = Database.getDocumentsByApplication(applicationId) as ApplicationDocument[]

  const byId = new Map<string, ApplicationDocument>()
  for (const doc of [...embedded, ...fromTable]) {
    const id = String(doc.id ?? `${doc.type}-${doc.fileName}`)
    const existing = byId.get(id)
    byId.set(id, {
      ...existing,
      ...doc,
      id,
      type: String(doc.type ?? 'document'),
      fileName: String(doc.fileName ?? 'file'),
    })
  }
  return [...byId.values()].sort((a, b) => String(a.type).localeCompare(String(b.type)))
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/data:([^;]+)/)?.[1] ?? 'application/octet-stream'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*]+/g, '_').trim() || 'document'
}

export function documentDownloadName(applicationId: string, doc: ApplicationDocument): string {
  const typePart = sanitizeFileName(doc.type || 'document')
  const base = sanitizeFileName(doc.fileName || `${typePart}.bin`)
  return `${sanitizeFileName(applicationId)}_${typePart}_${base}`
}

export function downloadApplicationDocument(applicationId: string, doc: ApplicationDocument) {
  if (!doc.fileData) {
    throw new Error('File content is not stored for this document. Ask the customer to re-upload.')
  }
  const blob = dataUrlToBlob(doc.fileData)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = documentDownloadName(applicationId, doc)
  link.click()
  URL.revokeObjectURL(url)
}

type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>
}

async function writeDocToDirectory(
  dir: FileSystemDirectoryHandle,
  doc: ApplicationDocument,
) {
  if (!doc.fileData) return false
  const blob = dataUrlToBlob(doc.fileData)
  const name = sanitizeFileName(doc.fileName || `${doc.type}.bin`)
  const handle = await dir.getFileHandle(name, { create: true })
  const writable = await handle.createWritable()
  await writable.write(blob)
  await writable.close()
  return true
}

export async function downloadAllApplicationDocuments(
  applicationId: string,
  documents: ApplicationDocument[],
): Promise<{ saved: number; mode: 'folder' | 'files' }> {
  const withData = documents.filter((d) => d.fileData)
  if (withData.length === 0) {
    throw new Error('No downloadable files found for this application.')
  }

  const pickerWindow = window as DirectoryPickerWindow
  if (pickerWindow.showDirectoryPicker) {
    const parent = await pickerWindow.showDirectoryPicker({ mode: 'readwrite' })
    const appDir = await parent.getDirectoryHandle(sanitizeFileName(applicationId), { create: true })
    let saved = 0
    for (const doc of withData) {
      if (await writeDocToDirectory(appDir, doc)) saved += 1
    }
    return { saved, mode: 'folder' }
  }

  for (const doc of withData) {
    downloadApplicationDocument(applicationId, doc)
    await new Promise((r) => window.setTimeout(r, 350))
  }
  return { saved: withData.length, mode: 'files' }
}

export function updateApplicationDocumentReview(
  applicationId: string,
  docId: string,
  status: 'approved' | 'rejected' | 'pending_review',
  reviewNote = '',
) {
  const app = Database.getApplicationById(applicationId)
  if (!app) return null
  const docs = Array.isArray(app.documents) ? [...(app.documents as ApplicationDocument[])] : []
  const idx = docs.findIndex((d) => String(d.id) === docId)
  if (idx === -1) return null
  docs[idx] = {
    ...docs[idx],
    status,
    reviewNote,
    reviewedAt: new Date().toISOString(),
    reviewedBy: 'operations',
  }
  Database.updateApplication(applicationId, { documents: docs })
  const tableDoc = Database.getDocumentsByApplication(applicationId).find((d) => String(d.id) === docId)
  if (tableDoc) {
    Database.updateDocumentStatus(docId, status, reviewNote, 'operations')
  }
  return docs[idx]
}

export function formatDocumentType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function documentStatusStyle(status?: string) {
  const s = String(status ?? 'pending_review').toLowerCase()
  if (s === 'approved') return { bg: '#f0fff4', color: '#166534', border: '#bbf7d0', label: 'Approved' }
  if (s === 'rejected') return { bg: '#fff0f0', color: '#dc2626', border: '#fecaca', label: 'Rejected' }
  return { bg: '#fffbeb', color: '#b45309', border: '#fde68a', label: 'Pending review' }
}
