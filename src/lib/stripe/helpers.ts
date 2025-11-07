/**
 * Stripe Helper Functions
 *
 * Utility functions for working with Stripe API
 */

import { getServerStripe, STRIPE_CONFIG } from './config'
import Stripe from 'stripe'

// =============================================
// AMOUNT CONVERSION
// =============================================

/**
 * Convert dollar amount to cents for Stripe
 * Stripe requires amounts in the smallest currency unit (cents for USD)
 *
 * @param dollars - Amount in dollars (e.g., 10.50)
 * @returns Amount in cents (e.g., 1050)
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100)
}

/**
 * Convert cents to dollar amount
 *
 * @param cents - Amount in cents (e.g., 1050)
 * @returns Amount in dollars (e.g., 10.50)
 */
export function centsToDollars(cents: number): number {
  return cents / 100
}

/**
 * Validate amount is within Stripe's allowed range
 *
 * @param cents - Amount in cents
 * @returns True if valid, false otherwise
 */
export function isValidStripeAmount(cents: number): boolean {
  return cents >= STRIPE_CONFIG.minimumChargeAmount &&
         cents <= STRIPE_CONFIG.maximumChargeAmount
}

// =============================================
// PAYMENT INTENT HELPERS
// =============================================

/**
 * Create a PaymentIntent for a connected account
 *
 * @param params - PaymentIntent creation parameters
 * @returns Stripe PaymentIntent
 */
export async function createConnectedAccountPaymentIntent(params: {
  amount: number // in cents
  currency: string
  connectedAccountId: string
  metadata: Record<string, string>
  applicationFeeAmount?: number // in cents (platform commission)
  description?: string
}): Promise<Stripe.PaymentIntent> {
  const {
    amount,
    currency,
    connectedAccountId,
    metadata,
    applicationFeeAmount,
    description,
  } = params

  // Validate amount
  if (!isValidStripeAmount(amount)) {
    throw new Error(
      `Invalid payment amount: $${centsToDollars(amount)}. ` +
      `Must be between $${centsToDollars(STRIPE_CONFIG.minimumChargeAmount)} ` +
      `and $${centsToDollars(STRIPE_CONFIG.maximumChargeAmount)}`
    )
  }

  // Create PaymentIntent on connected account
  const paymentIntent = await getServerStripe().paymentIntents.create(
    {
      amount,
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata,
      description,
      ...(applicationFeeAmount && applicationFeeAmount > 0
        ? { application_fee_amount: applicationFeeAmount }
        : {}),
    },
    {
      stripeAccount: connectedAccountId,
    }
  )

  return paymentIntent
}

/**
 * Retrieve a PaymentIntent from a connected account
 *
 * @param paymentIntentId - Stripe PaymentIntent ID
 * @param connectedAccountId - Stripe Connect account ID
 * @returns Stripe PaymentIntent
 */
export async function retrieveConnectedAccountPaymentIntent(
  paymentIntentId: string,
  connectedAccountId: string
): Promise<Stripe.PaymentIntent> {
  return await getServerStripe().paymentIntents.retrieve(
    paymentIntentId,
    {
      stripeAccount: connectedAccountId,
    }
  )
}

// =============================================
// REFUND HELPERS
// =============================================

/**
 * Create a refund for a connected account payment
 *
 * @param params - Refund parameters
 * @returns Stripe Refund
 */
export async function createConnectedAccountRefund(params: {
  paymentIntentId: string
  connectedAccountId: string
  amount?: number // in cents (optional - full refund if not specified)
  reason?: Stripe.RefundCreateParams.Reason
  metadata?: Record<string, string>
}): Promise<Stripe.Refund> {
  const {
    paymentIntentId,
    connectedAccountId,
    amount,
    reason,
    metadata,
  } = params

  return await getServerStripe().refunds.create(
    {
      payment_intent: paymentIntentId,
      ...(amount ? { amount } : {}),
      ...(reason ? { reason } : {}),
      ...(metadata ? { metadata } : {}),
    },
    {
      stripeAccount: connectedAccountId,
    }
  )
}

// =============================================
// WEBHOOK HELPERS
// =============================================

/**
 * Construct and verify a Stripe webhook event
 *
 * @param payload - Raw request body
 * @param signature - Stripe signature header
 * @param webhookSecret - Webhook signing secret
 * @returns Verified Stripe event
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  try {
    return getServerStripe().webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Webhook signature verification failed: ${error.message}`)
    }
    throw new Error('Webhook signature verification failed')
  }
}

/**
 * Check if a webhook event has already been processed (idempotency check)
 *
 * @param eventId - Stripe event ID
 * @returns True if event was already processed
 */
export async function isWebhookEventProcessed(eventId: string): Promise<boolean> {
  // This would typically query your database
  // For now, return false (implement database check in webhook handler)
  return false
}

// =============================================
// ERROR HANDLING
// =============================================

/**
 * Extract user-friendly error message from Stripe error
 *
 * @param error - Error object
 * @returns User-friendly error message
 */
export function getStripeErrorMessage(error: unknown): string {
  if (error instanceof Stripe.errors.StripeError) {
    switch (error.type) {
      case 'StripeCardError':
        return error.message || 'Your card was declined. Please try a different payment method.'
      case 'StripeRateLimitError':
        return 'Too many requests. Please try again in a moment.'
      case 'StripeInvalidRequestError':
        return 'Invalid payment request. Please contact support.'
      case 'StripeAPIError':
        return 'Payment processing error. Please try again.'
      case 'StripeConnectionError':
        return 'Network error. Please check your connection and try again.'
      case 'StripeAuthenticationError':
        return 'Payment configuration error. Please contact support.'
      default:
        return error.message || 'An unexpected error occurred. Please try again.'
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred. Please try again.'
}

// =============================================
// FORMATTING HELPERS
// =============================================

/**
 * Format currency amount for display
 *
 * @param cents - Amount in cents
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string (e.g., "$10.50")
 */
export function formatCurrency(cents: number, currency: string = 'USD'): string {
  const dollars = centsToDollars(cents)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(dollars)
}

/**
 * Get payment status display information
 *
 * @param status - Stripe PaymentIntent status
 * @returns Display-friendly status info
 */
export function getPaymentStatusDisplay(status: string): {
  label: string
  color: 'success' | 'warning' | 'error' | 'default'
} {
  switch (status) {
    case 'succeeded':
      return { label: 'Paid', color: 'success' }
    case 'processing':
      return { label: 'Processing', color: 'warning' }
    case 'requires_payment_method':
      return { label: 'Requires Payment', color: 'warning' }
    case 'requires_confirmation':
      return { label: 'Requires Confirmation', color: 'warning' }
    case 'requires_action':
      return { label: 'Requires Action', color: 'warning' }
    case 'canceled':
      return { label: 'Canceled', color: 'error' }
    case 'failed':
      return { label: 'Failed', color: 'error' }
    default:
      return { label: status, color: 'default' }
  }
}
