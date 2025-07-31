import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database/types';
import { Order, OrderInsert, OrderUpdate, OrderItem, OrderStatus } from '@/lib/database/aliases';
import { SupabaseError } from '@/lib/queries/errors';

export interface OrderFilters {
  status?: OrderStatus;
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
    .select(`
      *,
      customer:profiles!customer_id(
        user_id,
        full_name,
        email,
        avatar_url
      )
    `)
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
  
  return {
    orders: orders as unknown as OrderWithCustomer[],
    nextCursor,
    hasMore,
  };
}

// Get single order with details
export async function getOrder(
  client: SupabaseClient<Database>,
  siteId: string,
  orderId: string
): Promise<OrderWithCustomer> {
  const query = client
    .from('orders')
    .select(`
      *,
      customer:profiles!customer_id(
        user_id,
        full_name,
        email,
        avatar_url
      ),
      order_items(
        *,
        product:products(
          id,
          title,
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
  return data as unknown as OrderWithCustomer;
}

// Get order statistics
export async function getOrderStats(
  client: SupabaseClient<Database>,
  siteId: string
): Promise<OrderStats> {
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
  const todayISO = today.toISOString();
  
  const todayOrders = orders.filter(order => 
    new Date(order.created_at) >= today
  );
  
  // Calculate statistics
  const stats: OrderStats = {
    totalOrders: orders.length,
    processingOrders: orders.filter(o => o.status === 'processing').length,
    shippedOrders: orders.filter(o => o.status === 'shipped').length,
    deliveredOrders: orders.filter(o => o.status === 'delivered').length,
    cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
    totalRevenue: orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total_amount), 0),
    averageOrderValue: orders.length > 0 
      ? orders
          .filter(o => o.status !== 'cancelled')
          .reduce((sum, o) => sum + Number(o.total_amount), 0) / 
          orders.filter(o => o.status !== 'cancelled').length
      : 0,
    todayOrders: todayOrders.length,
    todayRevenue: todayOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total_amount), 0),
  };
  
  return stats;
}

// Create new order
export async function createOrder(
  client: SupabaseClient<Database>,
  siteId: string,
  orderData: Omit<OrderInsert, 'site_id' | 'order_number'>
): Promise<Order> {
  // Generate order number using the database function
  const { data: orderNumber } = await client
    .rpc('generate_order_number', { site_prefix: 'ORD' })
    .single();
  
  if (!orderNumber) {
    throw new Error('Failed to generate order number');
  }
  
  const query = client
    .from('orders')
    .insert({
      ...orderData,
      site_id: siteId,
      order_number: orderNumber,
    })
    .select()
    .single();
  
  const { data, error } = await query;
  if (error) throw new SupabaseError(error.message, error.code);
  if (!data) throw new SupabaseError('Failed to create order', 'CREATE_ERROR');
  return data;
}

// Update order
export async function updateOrder(
  client: SupabaseClient<Database>,
  siteId: string,
  orderId: string,
  updates: OrderUpdate
): Promise<Order> {
  const query = client
    .from('orders')
    .update(updates)
    .eq('site_id', siteId)
    .eq('id', orderId)
    .select()
    .single();
  
  const { data, error } = await query;
  if (error) throw new SupabaseError(error.message, error.code);
  if (!data) throw new SupabaseError('Order not found', 'NOT_FOUND');
  return data;
}

// Update order status
export async function updateOrderStatus(
  client: SupabaseClient<Database>,
  siteId: string,
  orderId: string,
  status: OrderStatus
): Promise<Order> {
  return updateOrder(client, siteId, orderId, { status });
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
    .select(`
      *,
      customer:profiles!customer_id(
        user_id,
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('site_id', siteId)
    .or(
      `order_number.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%`
    )
    .order('created_at', { ascending: false })
    .limit(limit);
  
  const { data, error } = await query;
  if (error) throw new SupabaseError(error.message, error.code);
  return (data || []) as unknown as OrderWithCustomer[];
}

// Bulk update orders
export async function bulkUpdateOrderStatus(
  client: SupabaseClient<Database>,
  siteId: string,
  orderIds: string[],
  status: OrderStatus
): Promise<Order[]> {
  const query = client
    .from('orders')
    .update({ status })
    .eq('site_id', siteId)
    .in('id', orderIds)
    .select();
  
  const { data, error } = await query;
  if (error) throw new SupabaseError(error.message, error.code);
  return data || [];
}