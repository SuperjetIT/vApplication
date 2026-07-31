/**
 * Temporary demo credential hydration for client-side auth (pre-server-auth).
 * Values come only from gitignored `.env` / `.env.local` — never commit real secrets.
 * Production must move login to the server; do not put Stripe/SMTP/OCR secrets here.
 */

function env(name: string): string {
  const value = (import.meta.env[name] as string | undefined)?.trim() ?? ''
  return value
}

export function demoAdminPassword(): string {
  return env('VITE_DEMO_ADMIN_PASSWORD')
}

export function demoOpsPassword(): string {
  return env('VITE_DEMO_OPS_PASSWORD')
}

export function demoPartnerPassword(): string {
  return env('VITE_DEMO_PARTNER_PASSWORD')
}
