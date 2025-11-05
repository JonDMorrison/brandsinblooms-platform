/**
 * Stripe Configuration
 *
 * Server-side and client-side Stripe initialization
 */

import Stripe from 'stripe'
import { loadStripe, Stripe as StripeJS } from '@stripe/stripe-js'

// =============================================
// SERVER-SIDE STRIPE CLIENT
// =============================================

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

/**
 * Server-side Stripe client
 * DO NOT use this in client components - it contains secret keys
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
  appInfo: {
    name: 'Brands in Blooms Platform',
    version: '0.1.0',
  },
})

// =============================================
// CLIENT-SIDE STRIPE INSTANCE
// =============================================

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set - client-side Stripe features will not work')
}

let stripePromise: Promise<StripeJS | null> | null = null

/**
 * Get Stripe.js instance (client-side only)
 * Singleton pattern to avoid loading Stripe.js multiple times
 */
export const getStripe = (): Promise<StripeJS | null> => {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!key) {
      console.error('Stripe publishable key is not configured')
      return Promise.resolve(null)
    }
    stripePromise = loadStripe(key)
  }
  return stripePromise
}

/**
 * Get Stripe.js instance for a connected account (client-side only)
 * Used when making payments to a site's connected Stripe account
 */
export const getStripeForAccount = (accountId: string): Promise<StripeJS | null> => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!key) {
    console.error('Stripe publishable key is not configured')
    return Promise.resolve(null)
  }
  return loadStripe(key, {
    stripeAccount: accountId,
  })
}

// =============================================
// CONFIGURATION CONSTANTS
// =============================================

export const STRIPE_CONFIG = {
  /**
   * Webhook signature secret for verifying webhook events
   */
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',

  /**
   * Default currency for payments
   */
  defaultCurrency: 'usd',

  /**
   * Minimum charge amount in cents (Stripe requirement: $0.50)
   */
  minimumChargeAmount: 50,

  /**
   * Maximum charge amount in cents ($999,999.99)
   */
  maximumChargeAmount: 99999999,

  /**
   * Stripe Connect OAuth scopes
   */
  connectScopes: ['read_write'] as const,

  /**
   * Stripe Connect account type
   */
  connectAccountType: 'express' as const,
} as const

// =============================================
// TYPE EXPORTS
// =============================================

export type StripeClient = typeof stripe
export type StripeJSClient = StripeJS
