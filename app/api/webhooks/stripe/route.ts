/**
 * Stripe Webhook Handler
 *
 * Processes Stripe webhook events for payment status updates
 * POST /api/webhooks/stripe
 */

import { NextRequest, NextResponse } from 'next/server'
import { STRIPE_CONFIG } from '@/src/lib/stripe/config'
import { constructWebhookEvent } from '@/src/lib/stripe/helpers'
import { handleAccountUpdatedEvent, handleAccountDeauthorizedEvent } from '@/src/lib/stripe/connect'
import { createClient } from '@/src/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = constructWebhookEvent(
      body,
      signature,
      STRIPE_CONFIG.webhookSecret
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // Log webhook event
  await supabase.from('stripe_webhook_events').insert({
    stripe_event_id: event.id,
    event_type: event.type,
    stripe_account_id: event.account || null,
    payload: event as unknown as Record<string, unknown>,
    processed: false,
  })

  try {
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account)
        break

      case 'account.application.deauthorized':
        await handleAccountDeauthorized(event)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Mark event as processed
    await supabase
      .from('stripe_webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('stripe_event_id', event.id)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)

    // Log error but return 200 to prevent Stripe retries
    await supabase
      .from('stripe_webhook_events')
      .update({
        error_message: error instanceof Error ? error.message : 'Unknown error',
        processed_at: new Date().toISOString(),
      })
      .eq('stripe_event_id', event.id)

    return NextResponse.json({ received: true, error: 'Processing failed' })
  }
}

/**
 * Handle payment_intent.succeeded event
 * Update order status to paid and decrement inventory
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const supabase = await createClient()

  // Find order by payment intent ID
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, site_id, payment_status, order_number')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .single()

  if (orderError || !order) {
    console.error('Order not found for payment intent:', paymentIntent.id)
    return
  }

  // Check if already processed (idempotency)
  if (order.payment_status === 'paid') {
    console.log('Order already marked as paid:', order.order_number)
    return
  }

  // Update order status
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      payment_status: 'paid',
      status: 'processing',
    })
    .eq('id', order.id)

  if (updateError) {
    console.error('Failed to update order status:', updateError)
    throw updateError
  }

  // Get order items to decrement inventory
  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', order.id)

  if (itemsError || !orderItems) {
    console.error('Failed to fetch order items:', itemsError)
    return
  }

  // Decrement inventory for each product
  for (const item of orderItems) {
    const { error: inventoryError } = await supabase.rpc('decrement_product_inventory', {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    })

    if (inventoryError) {
      console.error('Failed to decrement inventory:', inventoryError)
      // Continue processing other items
    }
  }

  // Record payment in order_payments table
  await supabase.from('order_payments').insert({
    order_id: order.id,
    payment_method: 'card',
    amount: paymentIntent.amount / 100, // Convert cents to dollars
    currency: paymentIntent.currency.toUpperCase(),
    status: 'completed',
    transaction_id: paymentIntent.id,
    provider_response: paymentIntent as unknown as Record<string, unknown>,
    processed_at: new Date().toISOString(),
  })

  console.log('Payment succeeded for order:', order.order_number)
}

/**
 * Handle payment_intent.payment_failed event
 * Mark order as cancelled
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({
      payment_status: 'failed',
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntent.id)

  if (error) {
    console.error('Failed to update order for failed payment:', error)
  }

  console.log('Payment failed for payment intent:', paymentIntent.id)
}

/**
 * Handle charge.refunded event
 * Update order status to refunded
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  const supabase = await createClient()

  const paymentIntentId = charge.payment_intent as string

  if (!paymentIntentId) {
    console.error('No payment intent ID in refund event')
    return
  }

  const { error } = await supabase
    .from('orders')
    .update({
      payment_status: 'refunded',
      status: 'refunded',
      refunded_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntentId)

  if (error) {
    console.error('Failed to update order for refund:', error)
  }

  console.log('Refund processed for payment intent:', paymentIntentId)
}

/**
 * Handle account.updated event
 * Update site's Stripe account status
 */
async function handleAccountUpdated(account: Stripe.Account) {
  const accountInfo = handleAccountUpdatedEvent(account)
  const supabase = await createClient()

  const { error } = await supabase
    .from('sites')
    .update({
      stripe_account_status: accountInfo.status.status,
      stripe_onboarding_completed: accountInfo.status.detailsSubmitted,
      stripe_charges_enabled: accountInfo.status.chargesEnabled,
      stripe_payouts_enabled: accountInfo.status.payoutsEnabled,
    })
    .eq('stripe_account_id', accountInfo.accountId)

  if (error) {
    console.error('Failed to update site Stripe status:', error)
  }

  console.log('Account updated:', accountInfo.accountId, accountInfo.status.status)
}

/**
 * Handle account.application.deauthorized event
 * Clear site's Stripe account connection
 */
async function handleAccountDeauthorized(event: Stripe.Event) {
  const accountId = handleAccountDeauthorizedEvent(event)

  if (!accountId) {
    console.error('No account ID in deauthorization event')
    return
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('sites')
    .update({
      stripe_account_id: null,
      stripe_account_status: 'not_connected',
      stripe_onboarding_completed: false,
      stripe_charges_enabled: false,
      stripe_payouts_enabled: false,
      stripe_disconnected_at: new Date().toISOString(),
    })
    .eq('stripe_account_id', accountId)

  if (error) {
    console.error('Failed to clear Stripe account:', error)
  }

  console.log('Account deauthorized:', accountId)
}
