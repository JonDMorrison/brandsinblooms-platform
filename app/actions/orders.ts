'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { OrderStatus, OrderInsert } from '@/lib/database/aliases'
import { activityHelpers } from '@/lib/queries/domains/activity'
import { z } from 'zod'

// Validation schemas
const createOrderSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Invalid email address'),
  totalAmount: z.number().positive('Total amount must be positive'),
  itemsCount: z.number().int().positive('Items count must be positive'),
  notes: z.string().optional(),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string(),
  }).optional(),
  billingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string(),
  }).optional(),
})

const updateOrderStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(['processing', 'shipped', 'delivered', 'cancelled']),
})

// Create a new order
export async function createOrder(formData: FormData) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  
  // Get current site from user's membership
  const { data: membership } = await supabase
    .from('site_memberships')
    .select('site_id')
    .eq('user_id', user.id)
    .single()
  
  if (!membership) {
    throw new Error('No site membership found')
  }

  // Parse and validate form data
  const rawData = {
    customerName: formData.get('customerName') as string,
    customerEmail: formData.get('customerEmail') as string,
    totalAmount: parseFloat(formData.get('totalAmount') as string),
    itemsCount: parseInt(formData.get('itemsCount') as string),
    notes: formData.get('notes') as string | null,
    shippingAddress: formData.get('shippingAddress') 
      ? JSON.parse(formData.get('shippingAddress') as string)
      : undefined,
    billingAddress: formData.get('billingAddress')
      ? JSON.parse(formData.get('billingAddress') as string)
      : undefined,
  }

  const validatedData = createOrderSchema.parse(rawData)

  // Generate order number
  const { data: orderNumber } = await supabase
    .rpc('generate_order_number', { site_prefix: 'ORD' })
    .single()

  if (!orderNumber) {
    throw new Error('Failed to generate order number')
  }

  // Create order
  const orderData: OrderInsert = {
    site_id: membership.site_id,
    customer_id: user.id, // For now, use current user as customer
    customer_name: validatedData.customerName,
    customer_email: validatedData.customerEmail,
    order_number: orderNumber,
    total_amount: validatedData.totalAmount,
    items_count: validatedData.itemsCount,
    notes: validatedData.notes || null,
    shipping_address: validatedData.shippingAddress || null,
    billing_address: validatedData.billingAddress || null,
    status: 'processing',
  }

  const { data: newOrder, error } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Log activity
  await supabase
    .from('activity_logs')
    .insert(
      activityHelpers.orderCreated(
        membership.site_id,
        newOrder.id,
        newOrder.order_number
      )
    )

  revalidatePath('/dashboard/orders')
  return { success: true, order: newOrder }
}

// Update order status
export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  
  // Validate input
  const validated = updateOrderStatusSchema.parse({ orderId, status })

  // Get current order to check permissions and log activity
  const { data: currentOrder, error: fetchError } = await supabase
    .from('orders')
    .select('*, site:sites!inner(id)')
    .eq('id', validated.orderId)
    .single()

  if (fetchError || !currentOrder) {
    throw new Error('Order not found')
  }

  // Check user has permission to update this order
  const { data: membership } = await supabase
    .from('site_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('site_id', currentOrder.site_id)
    .single()

  if (!membership || !['owner', 'editor'].includes(membership.role)) {
    throw new Error('Insufficient permissions')
  }

  // Update order status
  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({ status: validated.status })
    .eq('id', validated.orderId)
    .select()
    .single()

  if (updateError) {
    throw new Error(updateError.message)
  }

  // Log activity
  await supabase
    .from('activity_logs')
    .insert(
      activityHelpers.orderStatusChanged(
        currentOrder.site_id,
        updatedOrder.id,
        updatedOrder.order_number,
        currentOrder.status,
        updatedOrder.status
      )
    )

  revalidatePath('/dashboard/orders')
  revalidatePath(`/dashboard/orders/${orderId}`)
  
  return { success: true, order: updatedOrder }
}

// Bulk update order status
export async function bulkUpdateOrderStatus(orderIds: string[], status: OrderStatus) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  
  // Get user's site membership
  const { data: membership } = await supabase
    .from('site_memberships')
    .select('site_id, role')
    .eq('user_id', user.id)
    .single()
  
  if (!membership || !['owner', 'editor'].includes(membership.role)) {
    throw new Error('Insufficient permissions')
  }

  // Update all orders
  const { data: updatedOrders, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('site_id', membership.site_id)
    .in('id', orderIds)
    .select()

  if (error) {
    throw new Error(error.message)
  }

  // Log activities for each order
  const activities = updatedOrders.map(order => ({
    site_id: membership.site_id,
    user_id: user.id,
    activity_type: 'order_bulk_update',
    entity_type: 'orders',
    entity_id: order.id,
    title: `Order ${order.order_number} status changed to ${status}`,
    metadata: { order_number: order.order_number, new_status: status },
  }))

  await supabase.from('activity_logs').insert(activities)

  revalidatePath('/dashboard/orders')
  
  return { success: true, count: updatedOrders.length }
}

// Delete order (soft delete by marking as cancelled)
export async function deleteOrder(orderId: string) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  
  // Get order to check permissions
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('site_id, order_number')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) {
    throw new Error('Order not found')
  }

  // Check user has permission
  const { data: membership } = await supabase
    .from('site_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('site_id', order.site_id)
    .single()

  if (!membership || membership.role !== 'owner') {
    throw new Error('Only site owners can delete orders')
  }

  // Cancel the order instead of hard delete
  const { error: updateError } = await supabase
    .from('orders')
    .update({ 
      status: 'cancelled' as OrderStatus,
      cancelled_at: new Date().toISOString()
    })
    .eq('id', orderId)

  if (updateError) {
    throw new Error(updateError.message)
  }

  // Log activity
  await supabase
    .from('activity_logs')
    .insert({
      site_id: order.site_id,
      user_id: user.id,
      activity_type: 'order_deleted',
      entity_type: 'orders',
      entity_id: orderId,
      title: `Order ${order.order_number} was deleted`,
      metadata: { order_number: order.order_number },
    })

  revalidatePath('/dashboard/orders')
  redirect('/dashboard/orders')
}

// Export orders to CSV
export async function exportOrders(filters?: {
  status?: OrderStatus
  dateFrom?: string
  dateTo?: string
}) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  
  // Get user's site
  const { data: membership } = await supabase
    .from('site_memberships')
    .select('site_id')
    .eq('user_id', user.id)
    .single()
  
  if (!membership) {
    throw new Error('No site membership found')
  }

  // Build query
  let query = supabase
    .from('orders')
    .select(`
      *,
      customer:profiles!customer_id(
        full_name,
        email
      )
    `)
    .eq('site_id', membership.site_id)
    .order('created_at', { ascending: false })

  // Apply filters
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  
  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }
  
  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo)
  }

  const { data: orders, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  // Convert to CSV format
  const csv = [
    // Headers
    'Order Number,Customer Name,Customer Email,Status,Total Amount,Items,Created At',
    // Data rows
    ...orders.map(order => 
      `"${order.order_number}","${order.customer_name}","${order.customer_email}","${order.status}","${order.total_amount}","${order.items_count}","${new Date(order.created_at).toLocaleString()}"`
    )
  ].join('\n')

  return {
    csv,
    filename: `orders-export-${new Date().toISOString().split('T')[0]}.csv`,
    count: orders.length
  }
}

// Process order (e.g., mark as shipped and send notification)
export async function processOrder(orderId: string) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  
  // This is where you would integrate with payment processors,
  // shipping APIs, email services, etc.
  
  // For now, just update status to shipped
  const result = await updateOrderStatus(orderId, 'shipped')
  
  // In a real app, you might:
  // - Send shipping notification email
  // - Update inventory
  // - Create shipping label
  // - Update tracking information
  
  return result
}