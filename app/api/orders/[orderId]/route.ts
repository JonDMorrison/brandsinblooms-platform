/**
 * Get Order Details API Route
 *
 * Retrieves order details for confirmation page
 * GET /api/orders/[orderId]
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { handleError } from '@/src/lib/types/error-handling'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const supabase = await createClient()

    // Get order with items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        payment_status,
        total_amount,
        subtotal,
        tax_amount,
        shipping_amount,
        customer_name,
        customer_email,
        shipping_address,
        created_at
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Get order items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('id, product_name, product_sku, quantity, unit_price, total_price')
      .eq('order_id', orderId)

    if (itemsError) {
      console.error('Failed to fetch order items:', itemsError)
      return NextResponse.json(
        { error: 'Failed to fetch order items' },
        { status: 500 }
      )
    }

    // Format response
    const response = {
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      totalAmount: order.total_amount,
      subtotal: order.subtotal,
      taxAmount: order.tax_amount,
      shippingAmount: order.shipping_amount,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      shippingAddress: order.shipping_address,
      items: items || [],
      createdAt: order.created_at,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Get order error:', error)
    const errorMessage = handleError(error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
