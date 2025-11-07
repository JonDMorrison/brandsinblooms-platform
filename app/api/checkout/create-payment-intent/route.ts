/**
 * Create Payment Intent API Route
 *
 * Creates a Stripe PaymentIntent for checkout processing
 * POST /api/checkout/create-payment-intent
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { createConnectedAccountPaymentIntent, dollarsToCents } from '@/src/lib/stripe/helpers'
import { calculateOrderTotals, calculatePlatformCommission } from '@/src/lib/checkout/calculate-totals'
import { createPaymentIntentSchema } from '@/src/lib/validation/checkout-schemas'
import { handleError } from '@/src/lib/types/error-handling'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request
    const validatedData = createPaymentIntentSchema.parse(body)
    const { siteId, cartItems, shippingAddress } = validatedData

    // Get site details
    const supabase = await createClient()
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, name, stripe_account_id, stripe_charges_enabled, stripe_account_status')
      .eq('id', siteId)
      .single()

    if (siteError || !site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      )
    }

    // Verify site can accept payments
    if (!site.stripe_account_id || !site.stripe_charges_enabled || site.stripe_account_status !== 'active') {
      return NextResponse.json(
        { error: 'This site is not configured to accept payments. Please contact the site owner.' },
        { status: 400 }
      )
    }

    // Calculate order totals
    const totals = await calculateOrderTotals(siteId, cartItems, shippingAddress)

    // Validate cart items exist and are available
    const productIds = cartItems.map(item => item.productId)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, inventory_count, is_active')
      .in('id', productIds)
      .eq('site_id', siteId)

    if (productsError || !products || products.length !== cartItems.length) {
      return NextResponse.json(
        { error: 'One or more products in your cart are no longer available' },
        { status: 400 }
      )
    }

    // Verify inventory and prices
    for (const item of cartItems) {
      const product = products.find(p => p.id === item.productId)
      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found` },
          { status: 400 }
        )
      }

      if (!product.is_active) {
        return NextResponse.json(
          { error: `${product.name} is no longer available` },
          { status: 400 }
        )
      }

      if (product.inventory_count !== null && product.inventory_count < item.quantity) {
        return NextResponse.json(
          { error: `${product.name} has insufficient inventory (${product.inventory_count} available)` },
          { status: 400 }
        )
      }

      // Verify price hasn't changed (allow small floating point differences)
      const priceDiff = Math.abs(product.price - item.price)
      if (priceDiff > 0.01) {
        return NextResponse.json(
          { error: `Price for ${product.name} has changed. Please refresh your cart.` },
          { status: 400 }
        )
      }
    }

    // Calculate platform commission (if applicable)
    const platformCommission = await calculatePlatformCommission(siteId, totals.total)

    // Convert to cents for Stripe
    const amountInCents = dollarsToCents(totals.total)
    const platformCommissionInCents = platformCommission > 0 ? dollarsToCents(platformCommission) : undefined

    // Create PaymentIntent on connected account
    const paymentIntent = await createConnectedAccountPaymentIntent({
      amount: amountInCents,
      currency: totals.currency.toLowerCase(),
      connectedAccountId: site.stripe_account_id,
      metadata: {
        site_id: siteId,
        site_name: site.name,
        subtotal: totals.subtotal.toFixed(2),
        tax: totals.tax.toFixed(2),
        shipping: totals.shipping.toFixed(2),
        total: totals.total.toFixed(2),
        customer_email: shippingAddress.email,
        customer_name: shippingAddress.fullName,
      },
      applicationFeeAmount: platformCommissionInCents,
      description: `Order from ${site.name}`,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      totals,
    })
  } catch (error) {
    console.error('Create payment intent error:', error)
    const errorMessage = handleError(error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
