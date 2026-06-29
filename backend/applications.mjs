import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APPLICATIONS_FILE = path.join(__dirname, 'data', 'applications.json')

function generateId() {
  return `app_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function loadApplicationsFromDisk() {
  try {
    const raw = fs.readFileSync(APPLICATIONS_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed?.applications)) return parsed.applications
  } catch {
    /* first run */
  }
  return []
}

function saveApplicationsToDisk(applications) {
  const dir = path.dirname(APPLICATIONS_FILE)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(APPLICATIONS_FILE, JSON.stringify({ applications }, null, 2), 'utf8')
}

function stripHeavyFields(app) {
  const copy = { ...app }
  if (Array.isArray(copy.documents)) {
    copy.documents = copy.documents.map((doc) => {
      const next = { ...doc }
      if (next.fileData && typeof next.fileData === 'string' && next.fileData.length > 200) {
        next.fileData = null
        next.fileStoredLocally = true
      }
      return next
    })
  }
  return copy
}

export function listApplications() {
  return [...loadApplicationsFromDisk()].sort((a, b) =>
    String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')),
  )
}

export function getApplicationById(id) {
  return listApplications().find((a) => String(a.id) === String(id)) ?? null
}

export function syncApplicationFromClient(data) {
  const id = String(data?.id ?? '').trim()
  if (!id) throw new Error('APPLICATION_ID_REQUIRED')

  const applications = loadApplicationsFromDisk()
  const idx = applications.findIndex((a) => String(a.id) === id)
  const now = new Date().toISOString()
  const sanitized = stripHeavyFields(data)

  if (idx === -1) {
    const application = {
      createdAt: now,
      updatedAt: now,
      timeline: [{ status: 'submitted', timestamp: now, note: 'Application submitted' }],
      ...sanitized,
      id,
    }
    applications.push(application)
    saveApplicationsToDisk(applications)
    return { application, isNew: true }
  }

  const existing = applications[idx]
  const clientUpdated = String(sanitized.updatedAt ?? '').trim()
  const serverUpdated = String(existing.updatedAt ?? '').trim()
  applications[idx] = {
    ...existing,
    ...sanitized,
    id,
    updatedAt:
      clientUpdated && (!serverUpdated || new Date(clientUpdated) >= new Date(serverUpdated))
        ? clientUpdated
        : serverUpdated || now,
  }
  saveApplicationsToDisk(applications)
  return { application: applications[idx], isNew: false }
}
