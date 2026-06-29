import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PARTNERS_FILE = path.join(__dirname, 'data', 'partners.json')

function generateId() {
  return `ptn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function loadPartnersFromDisk() {
  try {
    const raw = fs.readFileSync(PARTNERS_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed?.partners)) return parsed.partners
  } catch {
    /* first run */
  }
  return []
}

function savePartnersToDisk(partners) {
  const dir = path.dirname(PARTNERS_FILE)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(PARTNERS_FILE, JSON.stringify({ partners }, null, 2), 'utf8')
}

export function listPartners() {
  return loadPartnersFromDisk()
}

export function getPartnerByEmail(email) {
  const normalized = String(email ?? '').trim().toLowerCase()
  if (!normalized) return null
  return listPartners().find((p) => String(p.email ?? '').toLowerCase() === normalized) ?? null
}

export function createPartner(data) {
  const email = String(data.email ?? '').trim().toLowerCase()
  if (!email) throw new Error('EMAIL_REQUIRED')
  if (getPartnerByEmail(email)) throw new Error('PARTNER_EXISTS')

  const partner = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    totalApplications: 0,
    totalRevenue: 0,
    totalCommission: 0,
    walletBalance: 0,
    status: String(data.status ?? 'pending'),
    registrationSource: String(data.registrationSource ?? 'self_service'),
    companyName: String(data.companyName ?? '').trim(),
    contactPerson: String(data.contactPerson ?? '').trim(),
    email,
    username: String(data.username ?? email).trim().toLowerCase(),
    phone: String(data.phone ?? '').trim(),
    tradeLicence: String(data.tradeLicence ?? '').trim(),
    password: String(data.password ?? ''),
    commissionRate: Number(data.commissionRate ?? 15) || 15,
    countriesSold: Array.isArray(data.countriesSold) ? data.countriesSold : [],
    registrationMethod: String(data.registrationMethod ?? data.registrationSource ?? 'self_service'),
  }

  const partners = listPartners()
  partners.push(partner)
  savePartnersToDisk(partners)
  return partner
}

export function getPartnerById(id) {
  return listPartners().find((p) => String(p.id) === String(id)) ?? null
}

export function updatePartner(id, updates) {
  const partners = listPartners()
  const idx = partners.findIndex((p) => String(p.id) === String(id))
  if (idx === -1) throw new Error('PARTNER_NOT_FOUND')
  partners[idx] = { ...partners[idx], ...updates }
  savePartnersToDisk(partners)
  return partners[idx]
}

export function deletePartnerById(id) {
  const partners = listPartners()
  const idx = partners.findIndex((p) => String(p.id) === String(id))
  if (idx === -1) return false
  partners.splice(idx, 1)
  savePartnersToDisk(partners)
  return true
}

export function authenticatePartner(email, password) {
  const normalized = String(email ?? '').trim().toLowerCase()
  const partner = getPartnerByEmail(normalized)
  if (!partner) return { ok: false, error: 'INVALID_CREDENTIALS' }
  if (String(partner.password ?? '') !== String(password ?? '')) {
    return { ok: false, error: 'INVALID_CREDENTIALS' }
  }
  if (String(partner.status ?? '').toLowerCase() !== 'active') {
    return { ok: false, error: 'PENDING_APPROVAL' }
  }
  return { ok: true, partner }
}

