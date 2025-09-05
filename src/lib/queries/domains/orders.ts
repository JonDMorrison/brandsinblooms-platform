import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Tables, TablesInsert, TablesUpdate } from '@/lib/database/types';

// Type aliases for order-related tables
export type OrderPayment = Tables<'order_payments'>;
export type OrderShipment = Tables<'order_shipments'>;
export type OrderStatusHistory = Tables<'order_status_history'>;
import { Order, OrderInsert, OrderUpdate, OrderItem, OrderStatus } from '@/lib/database/aliases';
import { SupabaseError } from '@/lib/queries/errors';
import { handleError } from '@/lib/types/error-handling';

export interface OrderFilters {
  status?: OrderStatus;
  paymentStatus?: string;
  customerId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  limit?: number;
}

export interface OrderWithCustomer extends Order {
  customer: {
    user_id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
  order_items?: OrderItem[];
  order_payments?: OrderPayment[];
  order_shipments?: OrderShipment[];
  order_status_history?: OrderStatusHistory[];
}

export interface OrderWithDetails extends Order {
  customer: {
    user_id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
  order_items: (OrderItem & {
    product?: {
      id: string;
      name: string;
      slug: string | null;
      images: any;
    } | null;
  })[];
  order_status_history: {
    id: string;
    from_status: string | null;
    to_status: string;
    created_at: string;
    changed_by: string | null;
    notes: string | null;
  }[];
  order_payments: {
    id: string;
    amount: number;
    currency: string | null;
    payment_method: string;
    status: string;
    processed_at: string | null;
    transaction_id: string | null;
  }[];
  order_shipments: {
    id: string;
    carrier: string | null;
    tracking_number: string | null;
    tracking_url: string | null;
    status: string | null;
    shipped_at: string | null;
    delivered_at: string | null;
  }[];
}

export interface OrderStats {
  totalOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  todayOrders: number;
  todayRevenue: number;
}

export interface PaginatedOrders {
  orders: OrderWithCustomer[];
  nextCursor: string | null;
  hasMore: boolean;
}

// Get paginated orders with filters
export async function getOrders(
  client: SupabaseClient<Database>,
  siteId: string,
  filters: OrderFilters = {}
): Promise<PaginatedOrders> {
  const { cursor, limit = 20, status, customerId, search, dateFrom, dateTo } = filters;
  
  let query = client
    .from('orders')
    .select('*')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .limit(limit + 1); // Fetch one extra to check if there are more
  
  // Apply cursor-based pagination
  if (cursor) {
    query = query.lt('created_at', cursor);
  }
  
  // Apply filters
  if (status) {
    query = query.eq('status', status);
  }
  
  if (customerId) {
    query = query.eq('customer_id', customerId);
  }
  
  if (filters.paymentStatus) {
    query = query.eq('payment_status', filters.paymentStatus);
  }
  
  if (search) {
    query = query.or(
      `order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`
    );
  }
  
  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }
  
  if (dateTo) {
    query = query.lte('created_at', dateTo);
  }
  
  const { data, error } = await query;
  if (error) throw new SupabaseError(error.message, error.code);
  if (!data) return { orders: [], nextCursor: null, hasMore: false };
  
  const hasMore = data.length > limit;
  const orders = hasMore ? data.slice(0, -1) : data;
  const nextCursor = hasMore ? orders[orders.length - 1]?.created_at : null;
  
  // Fetch profiles for all customers
  const customerIds = [...new Set(orders.map(o => o.customer_id).filter(Boolean))];
  let ordersWithCustomers: OrderWithCustomer[] = [];
  
  if (customerIds.length > 0) {
    const { data: profiles } = await client
      .from('profiles')
      .select('user_id, full_name, email, avatar_url')
      .in('user_id', customerIds);
    
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    
    ordersWithCustomers = orders.map(order => ({
      ...order,
      customer: profileMap.get(order.customer_id) || {
        user_id: order.customer_id,
        full_name: order.customer_name,
        email: order.customer_email,
        avatar_url: null,
      }
    })) as OrderWithCustomer[];
  } else {
    ordersWithCustomers = orders.map(order => ({
      ...order,
      customer: {
        user_id: order.customer_id,
        full_name: order.customer_name,
        email: order.customer_email,
        avatar_url: null,
      }
    })) as OrderWithCustomer[];
  }
  
  return {
    orders: ordersWithCustomers,
    nextCursor,
    hasMore,
  };
}

// Get paginated orders with filters (optimized for useInfiniteSupabase)
export function getOrdersInfinite(
  client: SupabaseClient<Database>,
  siteId: string,
  filters: Omit<OrderFilters, 'cursor' | 'limit'> = {}
) {
  return async (cursor: string | null, pageSize: number, signal: AbortSignal) => {
    // Check if request was aborted
    if (signal.aborted) {
      throw new Error('Request aborted');
    }

    const result = await getOrders(client, siteId, {
      ...filters,
      cursor,
      limit: pageSize,
    });

    return {
      items: result.orders,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  };
}

// Get single order with basic details
export async function getOrder(
  client: SupabaseClient<Database>,
  siteId: string,
  orderId: string
): Promise<OrderWithCustomer> {
  const query = client
    .from('orders')
    .select(`
      *,
      order_items(
        *,
        product:products(
          id,
          name,
          slug,
          images
        )
      )
    `)
    .eq('site_id', siteId)
    .eq('id', orderId)
    .single();
  
  const { data, error } = await query;
  if (error) throw new SupabaseError(error.message, error.code);
  if (!data) throw new SupabaseError('Order not found', 'NOT_FOUND');
  
  // Fetch customer profile
  let customer = {
    user_id: data.customer_id,
    full_name: data.customer_name,
    email: data.customer_email,
    avatar_url: null as string | null,
  };
  
  if (data.customer_id) {
    const { data: profile } = await client
      .from('profiles')
      .select('user_id, full_name, email, avatar_url')
      .eq('user_id', data.customer_id)
      .single();
    
    if (profile) {
      customer = {
        user_id: profile.user_id,
        full_name: profile.full_name || data.customer_name,
        email: profile.email || data.customer_email,
        avatar_url: profile.avatar_url,
      };
    }
  }
  
  return {
    ...data,
    customer
  } as unknown as OrderWithCustomer;
}

// Get single order with full details (items, history, payments, shipments)
export async function getOrderById(
  client: SupabaseClient<Database>,
  siteId: string,
  orderId: string
): Promise<OrderWithDetails> {
  try {
    const query = client
      .from('orders')
      .select(`
        *,
        order_items(
          *,
          product:products(
            id,
            name,
            slug,
            images
          )
        ),
        order_status_history(
          id,
          from_status,
          to_status,
          created_at,
          changed_by,
          notes
        ),
        order_payments(
          id,
          amount,
          currency,
          payment_method,
          status,
          processed_at,
          transaction_id
        ),
        order_shipments(
          id,
          carrier,
          tracking_number,
          tracking_url,
          status,
          shipped_at,
          delivered_at
        )
      `)
      .eq('site_id', siteId)
      .eq('id', orderId)
      .single();
    
    const { data, error } = await query;
    if (error) throw new SupabaseError(error.message, error.code);
    if (!data) throw new SupabaseError('Order not found', 'NOT_FOUND');
    
    // Fetch customer profile
    let customer = {
      user_id: data.customer_id,
      full_name: data.customer_name,
      email: data.customer_email,
      avatar_url: null as string | null,
    };
    
    if (data.customer_id) {
      const { data: profile } = await client
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .eq('user_id', data.customer_id)
        .single();
      
      if (profile) {
        customer = {
          user_id: profile.user_id,
          full_name: profile.full_name || data.customer_name,
          email: profile.email || data.customer_email,
          avatar_url: profile.avatar_url,
        };
      }
    }
    
    return {
      ...data,
      customer
    } as unknown as OrderWithDetails;
  } catch (error: unknown) {
    const errorDetails = handleError(error);
    throw new SupabaseError(errorDetails.message, errorDetails.code || 'UNKNOWN_ERROR');
  }
}

// Get order statistics
export async function getOrderStats(
  client: SupabaseClient<Database>,
  siteId: string
): Promise<OrderStats> {
  try {
    // Use the database function for better performance
    const { data, error } = await client
      .rpc('get_order_summary_stats', { 
        p_site_id: siteId
        // p_date_range is optional and will default to all-time stats
      })
      .single();
    
    if (error) throw new SupabaseError(error.message, error.code);
    if (!data) {
      // Fallback to manual calculation if function doesn't exist
      return await getOrderStatsManual(client, siteId);
    }
    
    // Map database function result to our interface
    const stats: OrderStats = {
      totalOrders: data.total_orders || 0,
      processingOrders: data.processing_orders || 0,
      shippedOrders: data.shipped_orders || 0,
      deliveredOrders: data.delivered_orders || 0,
      cancelledOrders: 0, // Not provided by function, could be added
      totalRevenue: data.total_revenue || 0,
      averageOrderValue: data.average_order_value || 0,
      todayOrders: 0, // Calculate separately if needed
      todayRevenue: 0, // Calculate separately if needed
    };
    
    return stats;
  } catch (error: unknown) {
    // Fallback to manual calculation on any error
    return await getOrderStatsManual(client, siteId);
  }
}

// Manual order statistics calculation (fallback)
async function getOrderStatsManual(
  client: SupabaseClient<Database>,
  siteId: string
): Promise<OrderStats> {
  try {
    // Get overall stats
    const overallQuery = client
      .from('orders')
      .select('id, status, total_amount, created_at')
      .eq('site_id', siteId);
    
    const { data: orders, error } = await overallQuery;
    if (error) throw new SupabaseError(error.message, error.code);
    if (!orders) throw new SupabaseError('Failed to fetch orders', 'FETCH_ERROR');
    
    // Calculate today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = orders.filter(order => 
      new Date(order.created_at) >= today
    );
    
    // Calculate statistics
    const validOrders = orders.filter(o => o.status !== 'cancelled');
    const totalRevenue = validOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const todayRevenue = todayOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total_amount), 0);
    
    const stats: OrderStats = {
      totalOrders: orders.length,
      processingOrders: orders.filter(o => o.status === 'processing').length,
      shippedOrders: orders.filter(o => o.status === 'shipped').length,
      deliveredOrders: orders.filter(o => o.status === 'delivered').length,
      cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
      totalRevenue,
      averageOrderValue: validOrders.length > 0 ? totalRevenue / validOrders.length : 0,
      todayOrders: todayOrders.length,
      todayRevenue,
    };
    
    return stats;
  } catch (error: unknown) {
    const errorDetails = handleError(error);
    throw new SupabaseError(errorDetails.message, errorDetails.code || 'UNKNOWN_ERROR');
  }
}

// Create new order
export async function createOrder(
  client: SupabaseClient<Database>,
  siteId: string,
  orderData: Omit<OrderInsert, 'site_id' | 'order_number'>
): Promise<Order> {
  try {
    // Generate order number using the database function
    const { data: orderNumber, error: orderNumberError } = await client
      .rpc('generate_order_number', { site_prefix: 'ORD' })
      .single();
    
    if (orderNumberError || !orderNumber) {
      throw new SupabaseError('Failed to generate order number', 'GENERATION_ERROR');
    }
    
    const query = client
      .from('orders')
      .insert({
        ...orderData,
        site_id: siteId,
        order_number: orderNumber,
        items_count: orderData.items_count || 0,
        status: (orderData.status || 'processing') as OrderStatus,
        payment_status: orderData.payment_status || 'pending',
      })
      .select()
      .single();
    
    const { data, error } = await query;
    if (error) throw new SupabaseError(error.message, error.code);
    if (!data) throw new SupabaseError('Failed to create order', 'CREATE_ERROR');
    return data;
  } catch (error: unknown) {
    const errorDetails = handleError(error);
    throw new SupabaseError(errorDetails.message, errorDetails.code || 'UNKNOWN_ERROR');
  }
}

// Update order
export async function updateOrder(
  client: SupabaseClient<Database>,
  siteId: string,
  orderId: string,
  updates: OrderUpdate
): Promise<Order> {
  try {
    const query = client
      .from('orders')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('site_id', siteId)
      .eq('id', orderId)
      .select()
      .single();
    
    const { data, error } = await query;
    if (error) throw new SupabaseError(error.message, error.code);
    if (!data) throw new SupabaseError('Order not found', 'NOT_FOUND');
    return data;
  } catch (error: unknown) {
    const errorDetails = handleError(error);
    throw new SupabaseError(errorDetails.message, errorDetails.code || 'UNKNOWN_ERROR');
  }
}

// Update order status with history tracking
export async function updateOrderStatus(
  client: SupabaseClient<Database>,
  siteId: string,
  orderId: string,
  status: OrderStatus,
  changedBy?: string,
  notes?: string
): Promise<Order> {
  try {
    // First get the current status
    const { data: currentOrder } = await client
      .from('orders')
      .select('status')
      .eq('site_id', siteId)
      .eq('id', orderId)
      .single();
    
    if (!currentOrder) {
      throw new SupabaseError('Order not found', 'NOT_FOUND');
    }
    
    // Update the order status
    const updatedOrder = await updateOrder(client, siteId, orderId, { 
      status,
      ...(status === 'shipped' && { shipped_at: new Date().toISOString() }),
      ...(status === 'delivered' && { delivered_at: new Date().toISOString() }),
      ...(status === 'cancelled' && { cancelled_at: new Date().toISOString() }),
      ...(status === 'delivered' && { completed_at: new Date().toISOString() }),
    });
    
    // Add status change to history
    await client
      .from('order_status_history')
      .insert({
        order_id: orderId,
        from_status: currentOrder.status,
        to_status: status,
        changed_by: changedBy,
        notes,
      });
    
    return updatedOrder;
  } catch (error: unknown) {
    const errorDetails = handleError(error);
    throw new SupabaseError(errorDetails.message, errorDetails.code || 'UNKNOWN_ERROR');
  }
}

// Cancel order
export async function cancelOrder(
  client: SupabaseClient<Database>,
  siteId: string,
  orderId: string
): Promise<Order> {
  return updateOrderStatus(client, siteId, orderId, 'cancelled');
}

// Get customer orders
export async function getCustomerOrders(
  client: SupabaseClient<Database>,
  siteId: string,
  customerId: string,
  limit: number = 10
): Promise<Order[]> {
  const query = client
    .from('orders')
    .select('*')
    .eq('site_id', siteId)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  const { data, error } = await query;
  if (error) throw new SupabaseError(error.message, error.code);
  return data || [];
}

// Search orders
export async function searchOrders(
  client: SupabaseClient<Database>,
  siteId: string,
  searchTerm: string,
  limit: number = 10
): Promise<OrderWithCustomer[]> {
  const query = client
    .from('orders')
    .select('*')
    .eq('site_id', siteId)
    .or(
      `order_number.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%`
    )
    .order('created_at', { ascending: false })
    .limit(limit);
  
  const { data, error } = await query;
  if (error) throw new SupabaseError(error.message, error.code);
  const orders = data || [];
  
  // Fetch profiles for all customers
  const customerIds = [...new Set(orders.map(o => o.customer_id).filter(Boolean))];
  let ordersWithCustomers: OrderWithCustomer[] = [];
  
  if (customerIds.length > 0) {
    const { data: profiles } = await client
      .from('profiles')
      .select('user_id, full_name, email, avatar_url')
      .in('user_id', customerIds);
    
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    
    ordersWithCustomers = orders.map(order => ({
      ...order,
      customer: profileMap.get(order.customer_id) || {
        user_id: order.customer_id,
        full_name: order.customer_name,
        email: order.customer_email,
        avatar_url: null,
      }
    })) as OrderWithCustomer[];
  } else {
    ordersWithCustomers = orders.map(order => ({
      ...order,
      customer: {
        user_id: order.customer_id,
        full_name: order.customer_name,
        email: order.customer_email,
        avatar_url: null,
      }
    })) as OrderWithCustomer[];
  }
  
  return ordersWithCustomers;
}

// Get order items for a specific order
export async function getOrderItems(
  client: SupabaseClient<Database>,
  siteId: string,
  orderId: string
): Promise<OrderItem[]> {
  try {
    const { data, error } = await client
      .from('order_items')
      .select(`
        *,
        product:products(
          id,
          name,
          slug,
          images
        )
      `)
      .eq('order_id', orderId);
    
    if (error) throw new SupabaseError(error.message, error.code);
    return data || [];
  } catch (error: unknown) {
    const errorDetails = handleError(error);
    throw new SupabaseError(errorDetails.message, errorDetails.code || 'UNKNOWN_ERROR');
  }
}

// Delete order (soft delete by marking as cancelled)
export async function deleteOrder(
  client: SupabaseClient<Database>,
  siteId: string,
  orderId: string,
  deletedBy?: string
): Promise<Order> {
  return updateOrderStatus(client, siteId, orderId, 'cancelled', deletedBy, 'Order deleted');
}

// Bulk update orders
export async function bulkUpdateOrderStatus(
  client: SupabaseClient<Database>,
  siteId: string,
  orderIds: string[],
  status: OrderStatus,
  changedBy?: string
): Promise<Order[]> {
  try {
    // Update orders in batches to avoid timeout
    const batchSize = 50;
    const results: Order[] = [];
    
    for (let i = 0; i < orderIds.length; i += batchSize) {
      const batch = orderIds.slice(i, i + batchSize);
      
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };
      
      // Add timestamp fields based on status
      if (status === 'shipped') updateData.shipped_at = new Date().toISOString();
      if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
        updateData.completed_at = new Date().toISOString();
      }
      if (status === 'cancelled') updateData.cancelled_at = new Date().toISOString();
      
      const { data, error } = await client
        .from('orders')
        .update(updateData)
        .eq('site_id', siteId)
        .in('id', batch)
        .select();
      
      if (error) throw new SupabaseError(error.message, error.code);
      if (data) results.push(...data);
      
      // Add status history entries for this batch
      if (data) {
        const historyEntries = data.map(order => ({
          order_id: order.id,
          from_status: null, // We don't track the previous status in bulk operations
          to_status: status,
          changed_by: changedBy,
          notes: `Bulk status update to ${status}`,
        }));
        
        await client
          .from('order_status_history')
          .insert(historyEntries);
      }
    }
    
    return results;
  } catch (error: unknown) {
    const errorDetails = handleError(error);
    throw new SupabaseError(errorDetails.message, errorDetails.code || 'UNKNOWN_ERROR');
  }
}