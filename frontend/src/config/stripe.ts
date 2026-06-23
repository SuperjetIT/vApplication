import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { Database } from '../database/db'

type StripeIntegration = {
  enabled?: boolean
  publishableKey?: string
  secretKey?: string
  webhookSecret?: string
  testMode?: boolean
}

/** Ignore placeholder keys from the template. */
function isPlaceholderKey(key: string): boolean {
  return !key || key.includes('ReplaceWithYourActual') || key.includes('Oxample')
}

function readStripeIntegration(): StripeIntegration {
  const integrations =
    (Database.getSettings().integrations as Record<string, StripeIntegration> | undefined) ?? {}
  return integrations.stripe ?? {}
}

function envPublishableKey(): string {
  const envKey = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined)?.trim() ?? ''
  return isPlaceholderKey(envKey) ? '' : envKey
}

export function isStripeEnabledInAdmin(): boolean {
  return readStripeIntegration().enabled === true
}

export function getStripePublishableKey(): string {
  const fromSettings = String(readStripeIntegration().publishableKey ?? '').trim()
  if (fromSettings && !isPlaceholderKey(fromSettings)) return fromSettings
  return envPublishableKey()
}

export function isStripeConfigured(): boolean {
  if (!isStripeEnabledInAdmin()) return false
  return Boolean(getStripePublishableKey())
}

export function isStripeTestMode(): boolean {
  const integration = readStripeIntegration()
  if (integration.testMode === false) return false
  if (integration.testMode === true) return true
  return getStripePublishableKey().startsWith('pk_test_')
}

/**
 * Dev checkout without Stripe keys — simulates a successful card payment.
 * Disabled when Stripe is turned on in Admin → Settings with a valid publishable key.
 */
export function isStripeMockCheckout(): boolean {
  if (!isStripeEnabledInAdmin()) return true
  if (isStripeConfigured()) return false
  return (
    import.meta.env.DEV &&
    (import.meta.env.VITE_STRIPE_MOCK_CHECKOUT === 'true' ||
      (import.meta.env.VITE_STRIPE_MOCK_CHECKOUT !== 'false' && !getStripePublishableKey()))
  )
}

let stripePromise: Promise<Stripe | null> | null = null
let cachedPublishableKey = ''

export function getStripePromise(): Promise<Stripe | null> | null {
  const key = getStripePublishableKey()
  if (isStripeMockCheckout() || !key) return null
  if (!stripePromise || cachedPublishableKey !== key) {
    cachedPublishableKey = key
    stripePromise = loadStripe(key)
  }
  return stripePromise
}
