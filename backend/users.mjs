import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const USERS_FILE = path.join(__dirname, 'data', 'users.json')

/** @type {Record<string, { email: string; fullName: string }>} */
let usersCache = null

function loadUsersFromDisk() {
  if (usersCache) return usersCache
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      usersCache = parsed
      return usersCache
    }
  } catch {
    /* first run */
  }
  usersCache = {}
  return usersCache
}

function saveUsersToDisk() {
  const dir = path.dirname(USERS_FILE)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(USERS_FILE, JSON.stringify(usersCache ?? {}, null, 2), 'utf8')
}

export function getUserByEmail(email) {
  const normalized = email.trim().toLowerCase()
  const users = loadUsersFromDisk()
  const record = users[normalized]
  if (!record) {
    return { email: normalized, fullName: '' }
  }
  return {
    email: normalized,
    fullName: String(record.fullName ?? '').trim(),
  }
}

export function upsertUser(email, fullName) {
  const normalized = email.trim().toLowerCase()
  const users = loadUsersFromDisk()
  users[normalized] = {
    email: normalized,
    fullName: String(fullName ?? '').trim(),
  }
  saveUsersToDisk()
  return users[normalized]
}
