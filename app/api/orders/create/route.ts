/**
 * Create Order API Route
 *
 * Creates an order after successful payment
 * POST /api/orders/create
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { createOrderSchema } from '@/src/lib/validation/checkout-schemas'
import { handleError } from '@/src/lib/types/error-handling'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request
    const validatedData = createOrderSchema.parse(body)
    const {
      siteId,
      stripePaymentIntentId,
      cartItems,
      customerEmail,
      customerName,
      shippingAddress,
      subtotal,
      taxAmount,
      shippingAmount,
      totalAmount,
    } = validatedData

    const supabase = await createClient()

    // Get authenticated user (optional - guest checkout allowed)
    const { data: { user } } = await supabase.auth.getUser()

    // Generate order number using RPC function
    const { data: orderNumberData, error: orderNumberError } = await supabase
      .rpc('generate_order_number', { site_id_param: siteId })

    if (orderNumberError || !orderNumberData) {
      console.error('Failed to generate order number:', orderNumberError)
      return NextResponse.json(
        { error: 'Failed to generate order number' },
        { status: 500 }
      )
    }

    const orderNumber = orderNumberData

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        site_id: siteId,
        customer_id: user?.id || null,
        order_number: orderNumber,
        status: 'processing',
        payment_status: 'pending', // Will be updated by webhook
        payment_method: 'card',
        stripe_payment_intent_id: stripePaymentIntentId,
        customer_name: customerName,
        customer_email: customerEmail,
        subtotal,
        tax_amount: taxAmount,
        shipping_amount: shippingAmount,
        total_amount: totalAmount,
        shipping_address: shippingAddress,
        billing_address: shippingAddress, // Same as shipping for now
        items_count: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      })
      .select('id, order_number')
      .single()

    if (orderError || !order) {
      console.error('Failed to create order:', orderError)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    // Create order items
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      product_sku: item.productSku || '',
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Failed to create order items:', itemsError)
      // Order was created but items failed - this is a critical error
      return NextResponse.json(
        { error: 'Failed to save order items' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
    })
  } catch (error) {
    console.error('Create order error:', error)
    const errorMessage = handleError(error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
