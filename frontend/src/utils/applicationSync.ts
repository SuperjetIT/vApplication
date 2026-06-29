import { Database } from '../database/db'
import { notifyAdminB2BApplication, notifyAdminB2CApplication } from './adminNotifications'

function hasApplicationNotification(applicationId: string, category: string): boolean {
  return Database.getAdminNotifications().some(
    (n) => String(n.category) === category && String(n.applicationId) === applicationId,
  )
}

function travelerName(travelers: unknown): string {
  if (!Array.isArray(travelers) || !travelers[0]) return 'Customer'
  const t = travelers[0] as Record<string, unknown>
  const first = String(t.firstName ?? '').trim()
  const last = String(t.lastName ?? '').trim()
  return `${first} ${last}`.trim() || 'Customer'
}

function notifySyncedApplication(app: Record<string, unknown>) {
  const applicationId = String(app.id ?? '')
  if (!applicationId) return

  const type = String(app.type ?? 'b2c')
  const amountObj = app.amount as { total?: number } | undefined
  const total = Number(amountObj?.total ?? 0)
  const paymentStatus = String(app.paymentStatus ?? 'pending').toLowerCase() === 'paid' ? 'paid' : 'pending'
  const paymentMethod = String(app.paymentMethod ?? 'card')
  const destination = String(app.destinationName ?? app.destination ?? '')

  if (type === 'b2b') {
    if (hasApplicationNotification(applicationId, 'b2b_application')) return
    const partnerId = String(app.partnerId ?? '')
    const partner = partnerId ? Database.getPartnerById(partnerId) : undefined
    notifyAdminB2BApplication({
      applicationId,
      partnerName: String(partner?.companyName ?? 'B2B Partner'),
      customerName: travelerName(app.travelers),
      destination,
      amount: total,
      paymentStatus,
      paymentMethod,
    })
    return
  }

  if (hasApplicationNotification(applicationId, 'b2c_application')) return
  notifyAdminB2CApplication({
    applicationId,
    customerName: travelerName(app.travelers),
    destination,
    amountPending: total,
    paymentStatus,
    paymentMethod,
  })
}

/** Pull applications from the API into local Database (shared across browsers/tabs). */
export async function syncApplicationsFromServer(): Promise<number> {
  try {
    const res = await fetch('/api/applications')
    if (!res.ok) return 0
    const payload = (await res.json()) as { applications?: Record<string, unknown>[] }
    const remote = Array.isArray(payload.applications) ? payload.applications : []
    let added = 0

    for (const app of remote) {
      const id = String(app.id ?? '')
      if (!id) continue
      const existing = Database.getApplicationById(id)
      Database.mergeApplication(app)
      if (!existing) {
        added += 1
        notifySyncedApplication(app)
      }
    }

    return added
  } catch {
    return 0
  }
}

export async function syncApplicationToServer(app: Record<string, unknown>): Promise<void> {
  try {
    await fetch('/api/applications/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(app),
    })
  } catch {
    /* best-effort — local Database already updated */
  }
}
