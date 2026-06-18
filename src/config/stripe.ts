import { loadStripe, type Stripe } from '@stripe/stripe-js'

const envKey = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined)?.trim() ?? ''

/** Ignore placeholder keys from the template. */
function isPlaceholderKey(key: string): boolean {
  return !key || key.includes('ReplaceWithYourActual') || key.includes('Oxample')
}

export const stripePublishableKey = isPlaceholderKey(envKey) ? '' : envKey

/** True when using Stripe test publishable key (pk_test_…). */
export const stripeTestMode = stripePublishableKey.startsWith('pk_test_')

/**
 * Dev checkout without Stripe keys — simulates a successful card payment.
 * Auto-enabled in dev when no publishable key is set, unless explicitly disabled.
 */
export const stripeMockCheckout =
  import.meta.env.DEV &&
  (import.meta.env.VITE_STRIPE_MOCK_CHECKOUT === 'true' ||
    (import.meta.env.VITE_STRIPE_MOCK_CHECKOUT !== 'false' && !stripePublishableKey))

export const stripeConfigured = Boolean(stripePublishableKey)

let stripePromise: Promise<Stripe | null> | null = null

export function getStripePromise(): Promise<Stripe | null> | null {
  if (stripeMockCheckout || !stripePublishableKey) return null
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey)
  }
  return stripePromise
}
