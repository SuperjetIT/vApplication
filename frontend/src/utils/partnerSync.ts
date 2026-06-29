import { Database } from '../database/db'
import { notifyAdminNewPartner } from './adminNotifications'

function hasPartnerRegistrationNotification(partnerId: string): boolean {
  return Database.getAdminNotifications().some(
    (n) => String(n.category) === 'b2b_partner_registered' && String(n.partnerId) === partnerId,
  )
}

/** Pull self-service partner registrations from the API into local Database (shared across hosts/tabs). */
export async function syncPartnersFromServer(): Promise<number> {
  try {
    const res = await fetch('/api/partners')
    if (!res.ok) return 0
    const payload = (await res.json()) as { partners?: Record<string, unknown>[] }
    const remote = Array.isArray(payload.partners) ? payload.partners : []
    let added = 0

    for (const partner of remote) {
      const email = String(partner.email ?? '').trim().toLowerCase()
      if (!email) continue

      const existing = Database.getPartners().find(
        (p) => String(p.email ?? '').toLowerCase() === email,
      )

      if (!existing) {
        Database.mergePartner(partner)
        added += 1
        const partnerId = String(partner.id ?? '')
        if (partnerId && !hasPartnerRegistrationNotification(partnerId)) {
          notifyAdminNewPartner({
            partnerId,
            companyName: String(partner.companyName ?? ''),
            contactPerson: String(partner.contactPerson ?? ''),
            email,
            phone: String(partner.phone ?? '') || undefined,
            status: String(partner.status ?? 'pending') === 'active' ? 'active' : 'pending',
          })
        }
      } else {
        Database.mergePartner(partner)
      }
    }

    return added
  } catch {
    return 0
  }
}

export async function registerPartnerOnServer(input: {
  companyName: string
  contactPerson: string
  email: string
  phone: string
  tradeLicence: string
  password?: string
  countriesSold?: string[]
}): Promise<{ ok: true; partner: Record<string, unknown>; source: 'server' | 'local' } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase()

  if (Database.getPartners().some((p) => String(p.email).toLowerCase() === email)) {
    return { ok: false, error: 'A partner with this email already exists.' }
  }

  const payload = {
    companyName: input.companyName.trim(),
    contactPerson: input.contactPerson.trim(),
    email,
    phone: input.phone.trim(),
    tradeLicence: input.tradeLicence.trim(),
    password: input.password ?? '',
    countriesSold: input.countriesSold ?? [],
  }

  try {
    const res = await fetch('/api/partners/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean
      error?: string
      partner?: Record<string, unknown>
    }
    if (res.status === 409) {
      return { ok: false, error: String(body.error ?? 'A partner with this email already exists.') }
    }
    if (res.ok && body.ok && body.partner) {
      return { ok: true, partner: Database.mergePartner(body.partner), source: 'server' }
    }
    if (!res.ok && body.error) {
      return { ok: false, error: String(body.error) }
    }
  } catch {
    /* API unavailable — fall back to local storage below */
  }

  const partner = Database.createPartner({
    companyName: payload.companyName,
    contactPerson: payload.contactPerson,
    email,
    username: email,
    phone: payload.phone,
    tradeLicence: payload.tradeLicence,
    countriesSold: payload.countriesSold,
    password: '',
    commissionRate: 0,
    walletBalance: 0,
    status: 'pending',
    registrationMethod: 'self_registered',
    registrationSource: 'self_service',
  })

  return { ok: true, partner, source: 'local' }
}

export async function deletePartnerOnServer(id: string): Promise<void> {
  try {
    await fetch(`/api/partners/${encodeURIComponent(id)}`, { method: 'DELETE' })
  } catch {
    /* best-effort — local Database already updated */
  }
}

export async function approvePartnerOnServer(
  id: string,
  updates?: {
    status?: string
    commissionRate?: number
    password?: string
    approvedAt?: string
    approvedBy?: string
    approvalNote?: string
  },
): Promise<void> {
  const body = { status: 'active', ...updates }
  try {
    const res = await fetch(`/api/partners/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const payload = (await res.json()) as { partner?: Record<string, unknown> }
      if (payload.partner) Database.mergePartner(payload.partner)
      return
    }
  } catch {
    /* fall through to local update */
  }
  Database.updatePartner(id, body)
}

export async function createAdminPartnerOnServer(input: {
  companyName: string
  contactPerson: string
  email: string
  phone: string
  tradeLicence: string
  password: string
  commissionRate: number
  status: 'active' | 'pending'
}): Promise<{ ok: true; partner: Record<string, unknown> } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase()
  if (Database.getPartners().some((p) => String(p.email).toLowerCase() === email)) {
    return { ok: false, error: 'A partner with this email already exists.' }
  }

  try {
    const res = await fetch('/api/partners/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const payload = (await res.json().catch(() => ({}))) as {
      ok?: boolean
      error?: string
      partner?: Record<string, unknown>
    }
    if (res.status === 409) {
      return { ok: false, error: String(payload.error ?? 'A partner with this email already exists.') }
    }
    if (res.ok && payload.ok && payload.partner) {
      return { ok: true, partner: Database.mergePartner(payload.partner) }
    }
  } catch {
    /* API unavailable */
  }

  const partner = Database.createPartner({
    companyName: input.companyName.trim(),
    contactPerson: input.contactPerson.trim(),
    email,
    username: email,
    phone: input.phone.trim(),
    tradeLicence: input.tradeLicence.trim(),
    password: input.password,
    commissionRate: input.commissionRate,
    walletBalance: 0,
    status: input.status,
    registrationSource: 'admin',
  })
  return { ok: true, partner }
}
