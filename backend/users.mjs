import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const USERS_FILE = path.join(__dirname, 'data', 'users.json')

/** @type {{ users: Record<string, unknown>[] } | null} */
let usersCache = null

function generateId() {
  return `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function migrateLegacyMap(parsed) {
  const now = new Date().toISOString()
  const users = []
  for (const [key, value] of Object.entries(parsed)) {
    if (!value || typeof value !== 'object') continue
    const record = /** @type {{ email?: string; fullName?: string }} */ (value)
    const email = String(record.email ?? key).trim().toLowerCase()
    if (!email) continue
    users.push({
      id: generateId(),
      email,
      fullName: String(record.fullName ?? '').trim(),
      phone: '',
      phoneCode: '+971',
      passportCountry: '',
      residenceCountry: 'UAE',
      residencyStatus: 'Resident',
      registrationSource: 'sign_in',
      createdAt: now,
      lastLogin: now,
      loginCount: 1,
      isVerified: true,
      walletBalance: 0,
    })
  }
  return users
}

function loadUsersFromDisk() {
  if (usersCache) return usersCache
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed?.users)) {
      usersCache = { users: parsed.users }
      return usersCache
    }
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const migrated = migrateLegacyMap(parsed)
      usersCache = { users: migrated }
      saveUsersToDisk()
      return usersCache
    }
  } catch {
    /* first run */
  }
  usersCache = { users: [] }
  return usersCache
}

function saveUsersToDisk() {
  const dir = path.dirname(USERS_FILE)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(USERS_FILE, JSON.stringify(usersCache ?? { users: [] }, null, 2), 'utf8')
}

function findUserIndex(email) {
  const normalized = email.trim().toLowerCase()
  return loadUsersFromDisk().users.findIndex((u) => String(u.email ?? '').toLowerCase() === normalized)
}

function toPublicProfile(user) {
  return {
    email: String(user.email ?? '').trim().toLowerCase(),
    fullName: String(user.fullName ?? '').trim(),
  }
}

export function listUsers() {
  return [...loadUsersFromDisk().users].sort((a, b) =>
    String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')),
  )
}

export function getUserByEmail(email) {
  const idx = findUserIndex(email)
  if (idx === -1) {
    return { email: email.trim().toLowerCase(), fullName: '' }
  }
  return toPublicProfile(loadUsersFromDisk().users[idx])
}

export function upsertUser(email, fullName) {
  const normalized = email.trim().toLowerCase()
  const users = loadUsersFromDisk().users
  const idx = findUserIndex(normalized)
  if (idx === -1) {
    const user = {
      id: generateId(),
      email: normalized,
      fullName: String(fullName ?? '').trim(),
      phone: '',
      phoneCode: '+971',
      passportCountry: '',
      residenceCountry: 'UAE',
      residencyStatus: 'Resident',
      registrationSource: 'sign_in',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      loginCount: 0,
      isVerified: true,
      walletBalance: 0,
    }
    users.push(user)
    saveUsersToDisk()
    return toPublicProfile(user)
  }
  users[idx] = { ...users[idx], fullName: String(fullName ?? '').trim() }
  saveUsersToDisk()
  return toPublicProfile(users[idx])
}

/** Record a successful OTP sign-in (increments login count). */
export function recordUserSession(email, options = {}) {
  const normalized = email.trim().toLowerCase()
  const now = new Date().toISOString()
  const users = loadUsersFromDisk().users
  const idx = findUserIndex(normalized)
  const source = options.source === 'application' ? 'application' : 'sign_in'

  if (idx === -1) {
    const user = {
      id: generateId(),
      email: normalized,
      fullName: String(options.fullName ?? '').trim(),
      phone: String(options.phone ?? '').trim(),
      phoneCode: String(options.phoneCode ?? '+971').trim() || '+971',
      passportCountry: String(options.passportCountry ?? '').trim(),
      residenceCountry: String(options.residenceCountry ?? 'UAE').trim() || 'UAE',
      residencyStatus: String(options.residencyStatus ?? 'Resident').trim() || 'Resident',
      registrationSource: source,
      createdAt: now,
      lastLogin: now,
      loginCount: 1,
      isVerified: true,
      walletBalance: 0,
    }
    users.push(user)
    saveUsersToDisk()
    return { user, isNew: true }
  }

  const existing = users[idx]
  const nextLoginCount = Number(existing.loginCount ?? 0) + 1
  users[idx] = {
    ...existing,
    fullName: String(options.fullName ?? existing.fullName ?? '').trim(),
    phone: String(options.phone ?? existing.phone ?? '').trim(),
    phoneCode: String(options.phoneCode ?? existing.phoneCode ?? '+971').trim() || '+971',
    passportCountry: String(options.passportCountry ?? existing.passportCountry ?? '').trim(),
    residenceCountry: String(options.residenceCountry ?? existing.residenceCountry ?? 'UAE').trim() || 'UAE',
    residencyStatus: String(options.residencyStatus ?? existing.residencyStatus ?? 'Resident').trim() || 'Resident',
    lastLogin: now,
    loginCount: nextLoginCount,
    isVerified: true,
  }
  saveUsersToDisk()
  return { user: users[idx], isNew: false }
}

/** Merge profile fields from the browser without incrementing login count. */
export function syncUserFromClient(data) {
  const email = String(data?.email ?? '').trim().toLowerCase()
  if (!email) throw new Error('EMAIL_REQUIRED')

  const users = loadUsersFromDisk().users
  const idx = findUserIndex(email)
  const now = new Date().toISOString()
  const source = data.registrationSource === 'application' ? 'application' : 'sign_in'

  if (idx === -1) {
    const user = {
      id: String(data.id ?? generateId()),
      email,
      fullName: String(data.fullName ?? '').trim(),
      phone: String(data.phone ?? '').trim(),
      phoneCode: String(data.phoneCode ?? '+971').trim() || '+971',
      passportCountry: String(data.passportCountry ?? '').trim(),
      residenceCountry: String(data.residenceCountry ?? 'UAE').trim() || 'UAE',
      residencyStatus: String(data.residencyStatus ?? 'Resident').trim() || 'Resident',
      registrationSource: source,
      createdAt: String(data.createdAt ?? now),
      lastLogin: String(data.lastLogin ?? now),
      loginCount: Number(data.loginCount ?? 1) || 1,
      isVerified: data.isVerified !== false,
      walletBalance: Number(data.walletBalance ?? 0) || 0,
    }
    users.push(user)
    saveUsersToDisk()
    return { user, isNew: true }
  }

  const existing = users[idx]
  const clientLoginCount = Number(data.loginCount ?? 0) || 0
  const serverLoginCount = Number(existing.loginCount ?? 0) || 0
  const clientLastLogin = String(data.lastLogin ?? '').trim()
  const serverLastLogin = String(existing.lastLogin ?? '').trim()

  users[idx] = {
    ...existing,
    fullName: String(data.fullName ?? existing.fullName ?? '').trim(),
    phone: String(data.phone ?? existing.phone ?? '').trim(),
    phoneCode: String(data.phoneCode ?? existing.phoneCode ?? '+971').trim() || '+971',
    passportCountry: String(data.passportCountry ?? existing.passportCountry ?? '').trim(),
    residenceCountry: String(data.residenceCountry ?? existing.residenceCountry ?? 'UAE').trim() || 'UAE',
    residencyStatus: String(data.residencyStatus ?? existing.residencyStatus ?? 'Resident').trim() || 'Resident',
    registrationSource: existing.registrationSource ?? source,
    lastLogin:
      clientLastLogin && (!serverLastLogin || new Date(clientLastLogin) > new Date(serverLastLogin))
        ? clientLastLogin
        : serverLastLogin || clientLastLogin || now,
    loginCount: Math.max(clientLoginCount, serverLoginCount),
    isVerified: data.isVerified !== false,
  }
  saveUsersToDisk()
  return { user: users[idx], isNew: false }
}

export function deleteUserById(id) {
  const users = loadUsersFromDisk().users
  const idx = users.findIndex((u) => String(u.id) === String(id))
  if (idx === -1) return false
  users.splice(idx, 1)
  saveUsersToDisk()
  return true
}
