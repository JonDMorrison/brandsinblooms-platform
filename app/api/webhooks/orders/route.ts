import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { activityHelpers } from '@/src/lib/queries/domains/activity'
import { headers } from 'next/headers'
import crypto from 'crypto'

// Webhook secret for verification (should be in env vars)
const WEBHOOK_SECRET = process.env.ORDER_WEBHOOK_SECRET || 'your-webhook-secret'

// Verify webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  )
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const headersList = await headers()
    const signature = headersList.get('x-webhook-signature')
    
    // Verify webhook signature
    if (!signature || !verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }
    
    const data = JSON.parse(payload)
    const { event, order } = data
    
    const supabase = await createClient()
    
    switch (event) {
      case 'order.payment.completed':
        // Payment completed - update order status
        await handlePaymentCompleted(supabase, order)
        break
        
      case 'order.payment.failed':
        // Payment failed - update order status
        await handlePaymentFailed(supabase, order)
        break
        
      case 'order.shipped':
        // Order shipped - update tracking info
        await handleOrderShipped(supabase, order)
        break
        
      case 'order.delivered':
        // Order delivered - update status
        await handleOrderDelivered(supabase, order)
        break
        
      default:
        console.log('Unhandled webhook event:', event)
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentCompleted(supabase: any, webhookOrder: any) {
  // Update order status to processing
  const { data: order, error } = await supabase
    .from('orders')
    .update({
      status: 'processing',
      metadata: {
        payment_id: webhookOrder.payment_id,
        payment_method: webhookOrder.payment_method,
        paid_at: new Date().toISOString(),
      }
    })
    .eq('order_number', webhookOrder.order_number)
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to update order: ${error.message}`)
  }
  
  // Log activity
  await supabase
    .from('activity_logs')
    .insert({
      site_id: order.site_id,
      activity_type: 'payment_completed',
      entity_type: 'orders',
      entity_id: order.id,
      title: `Payment completed for order ${order.order_number}`,
      metadata: {
        order_number: order.order_number,
        payment_id: webhookOrder.payment_id,
        amount: order.total_amount,
      }
    })
  
  // Send order confirmation email (implement your email service)
  // await sendOrderConfirmationEmail(order)
}

async function handlePaymentFailed(supabase: any, webhookOrder: any) {
  // Keep order in pending state or cancel
  const { data: order, error } = await supabase
    .from('orders')
    .update({
      metadata: {
        payment_failed_at: new Date().toISOString(),
        failure_reason: webhookOrder.failure_reason,
      }
    })
    .eq('order_number', webhookOrder.order_number)
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to update order: ${error.message}`)
  }
  
  // Log activity
  await supabase
    .from('activity_logs')
    .insert({
      site_id: order.site_id,
      activity_type: 'payment_failed',
      entity_type: 'orders',
      entity_id: order.id,
      title: `Payment failed for order ${order.order_number}`,
      metadata: {
        order_number: order.order_number,
        reason: webhookOrder.failure_reason,
      }
    })
}

async function handleOrderShipped(supabase: any, webhookOrder: any) {
  // Update order with tracking information
  const { data: order, error } = await supabase
    .from('orders')
    .update({
      status: 'shipped',
      shipped_at: new Date().toISOString(),
      metadata: {
        tracking_number: webhookOrder.tracking_number,
        carrier: webhookOrder.carrier,
        estimated_delivery: webhookOrder.estimated_delivery,
      }
    })
    .eq('order_number', webhookOrder.order_number)
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to update order: ${error.message}`)
  }
  
  // Log activity
  await supabase
    .from('activity_logs')
    .insert(
      activityHelpers.orderStatusChanged(
        order.site_id,
        order.id,
        order.order_number,
        'processing',
        'shipped'
      )
    )
  
  // Send shipping notification email
  // await sendShippingNotificationEmail(order)
}

async function handleOrderDelivered(supabase: any, webhookOrder: any) {
  // Update order status to delivered
  const { data: order, error } = await supabase
    .from('orders')
    .update({
      status: 'delivered',
      delivered_at: new Date().toISOString(),
    })
    .eq('order_number', webhookOrder.order_number)
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to update order: ${error.message}`)
  }
  
  // Log activity
  await supabase
    .from('activity_logs')
    .insert(
      activityHelpers.orderStatusChanged(
        order.site_id,
        order.id,
        order.order_number,
        'shipped',
        'delivered'
      )
    )
  
  // Send delivery confirmation email
  // await sendDeliveryConfirmationEmail(order)
}

// GET endpoint for webhook verification (some providers require this)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const challenge = searchParams.get('challenge')
  
  if (challenge) {
    // Return challenge for webhook verification
    return new Response(challenge, {
      headers: { 'Content-Type': 'text/plain' },
    })
  }
  
  return NextResponse.json({ status: 'Webhook endpoint active' })
}