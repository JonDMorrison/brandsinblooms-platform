import { SupabaseClient } from '@supabase/supabase-js';
import { Database, CustomerStats } from '@/lib/database/types';
import { executeQuery } from '@/lib/queries/utils/execute-query';

export interface CustomerFilters {
  status?: 'active' | 'inactive';
  search?: string;
  sortBy?: 'name' | 'orders' | 'spent' | 'lastOrder';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CustomerWithStats extends CustomerStats {
  recent_orders?: Array<{
    id: string;
    order_number: string;
    total_amount: number;
    status: string;
    created_at: string;
  }>;
}

export interface PaginatedCustomers {
  customers: CustomerStats[];
  totalCount: number;
  page: number;
  totalPages: number;
}

// Get paginated customers with stats
export async function getCustomers(
  client: SupabaseClient<Database>,
  siteId: string,
  filters: CustomerFilters = {}
): Promise<PaginatedCustomers> {
  const { 
    status, 
    search, 
    sortBy = 'name', 
    sortDirection = 'asc',
    page = 1, 
    limit = 20 
  } = filters;
  
  // First, get the customers from the view
  let query = client
    .from('customer_stats')
    .select('*', { count: 'exact' });
  
  // Apply search filter
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,email.ilike.%${search}%`
    );
  }
  
  // Apply status filter
  if (status) {
    query = query.eq('status', status);
  }
  
  // Apply sorting
  const sortColumn = {
    name: 'name',
    orders: 'orders_count',
    spent: 'total_spent',
    lastOrder: 'last_order_date'
  }[sortBy] || 'name';
  
  query = query.order(sortColumn, { ascending: sortDirection === 'asc' });
  
  // Apply pagination
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);
  
  const { data, count } = await client
    .from('customer_stats')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1);
  
  if (!data) throw new Error('Failed to fetch customers');
  
  return {
    customers: data,
    totalCount: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

// Get single customer with detailed stats
export async function getCustomer(
  client: SupabaseClient<Database>,
  customerId: string
): Promise<CustomerWithStats> {
  // Get customer stats
  const customerQuery = client
    .from('customer_stats')
    .select('*')
    .eq('id', customerId)
    .single();
  
  const customer = await executeQuery(customerQuery);
  
  // Get recent orders
  const ordersQuery = client
    .from('orders')
    .select('id, order_number, total_amount, status, created_at')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(5);
  
  const recentOrders = await executeQuery(ordersQuery);
  
  return {
    ...customer,
    recent_orders: recentOrders,
  };
}

// Get top customers by revenue
export async function getTopCustomers(
  client: SupabaseClient<Database>,
  siteId: string,
  limit: number = 10
): Promise<CustomerStats[]> {
  const query = client
    .from('customer_stats')
    .select('*')
    .order('total_spent', { ascending: false })
    .limit(limit);
  
  // Note: customer_stats view doesn't have site_id, so we need to filter by joining with orders
  // This is a limitation of the view approach - in production, you might want to add site_id to the view
  
  return await executeQuery(query);
}

// Get customer statistics
export async function getCustomerStatistics(
  client: SupabaseClient<Database>,
  siteId: string
): Promise<{
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  averageOrdersPerCustomer: number;
  averageSpentPerCustomer: number;
}> {
  // Get all customers
  const customersQuery = client
    .from('profiles')
    .select('user_id, created_at', { count: 'exact' })
    .eq('user_type', 'customer');
  
  const { data: customers, count: totalCustomers } = await customersQuery;
  
  // Get orders for statistics
  const ordersQuery = client
    .from('orders')
    .select('customer_id, total_amount, created_at')
    .eq('site_id', siteId);
  
  const orders = await executeQuery(ordersQuery);
  
  // Calculate statistics
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const activeCustomerIds = new Set(
    orders
      .filter(o => new Date(o.created_at) > thirtyDaysAgo)
      .map(o => o.customer_id)
  );
  
  const newCustomersThisMonth = customers?.filter(c => 
    new Date(c.created_at) >= thisMonthStart
  ).length || 0;
  
  const customerOrderCounts = orders.reduce((acc, order) => {
    acc[order.customer_id] = (acc[order.customer_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const customerSpentTotals = orders.reduce((acc, order) => {
    acc[order.customer_id] = (acc[order.customer_id] || 0) + Number(order.total_amount);
    return acc;
  }, {} as Record<string, number>);
  
  const customersWithOrders = Object.keys(customerOrderCounts).length;
  
  return {
    totalCustomers: totalCustomers || 0,
    activeCustomers: activeCustomerIds.size,
    newCustomersThisMonth,
    averageOrdersPerCustomer: customersWithOrders > 0 
      ? orders.length / customersWithOrders 
      : 0,
    averageSpentPerCustomer: customersWithOrders > 0
      ? Object.values(customerSpentTotals).reduce((sum, val) => sum + val, 0) / customersWithOrders
      : 0,
  };
}

// Search customers
export async function searchCustomers(
  client: SupabaseClient<Database>,
  searchTerm: string,
  limit: number = 10
): Promise<CustomerStats[]> {
  const query = client
    .from('customer_stats')
    .select('*')
    .or(
      `name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
    )
    .limit(limit);
  
  return await executeQuery(query);
}

// Get customer order history
export async function getCustomerOrderHistory(
  client: SupabaseClient<Database>,
  customerId: string,
  page: number = 1,
  limit: number = 20
): Promise<{
  orders: Array<{
    id: string;
    order_number: string;
    total_amount: number;
    items_count: number;
    status: string;
    created_at: string;
  }>;
  totalCount: number;
  totalPages: number;
}> {
  const offset = (page - 1) * limit;
  
  const { data, count } = await client
    .from('orders')
    .select('id, order_number, total_amount, items_count, status, created_at', { count: 'exact' })
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (!data) throw new Error('Failed to fetch order history');
  
  return {
    orders: data,
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

// Get customer insights
export async function getCustomerInsights(
  client: SupabaseClient<Database>,
  customerId: string
): Promise<{
  favoriteProducts: Array<{ product_name: string; order_count: number }>;
  averageOrderValue: number;
  orderFrequency: string;
  preferredOrderTime: string;
}> {
  // Get all orders and order items for this customer
  const ordersQuery = client
    .from('orders')
    .select(`
      id,
      total_amount,
      created_at,
      order_items(product_name)
    `)
    .eq('customer_id', customerId)
    .neq('status', 'cancelled');
  
  const orders = await executeQuery(ordersQuery);
  
  if (orders.length === 0) {
    return {
      favoriteProducts: [],
      averageOrderValue: 0,
      orderFrequency: 'No orders yet',
      preferredOrderTime: 'No data',
    };
  }
  
  // Calculate favorite products
  const productCounts: Record<string, number> = {};
  orders.forEach(order => {
    if (order.order_items) {
      order.order_items.forEach((item: any) => {
        productCounts[item.product_name] = (productCounts[item.product_name] || 0) + 1;
      });
    }
  });
  
  const favoriteProducts = Object.entries(productCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([product_name, order_count]) => ({ product_name, order_count }));
  
  // Calculate average order value
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  const averageOrderValue = totalRevenue / orders.length;
  
  // Calculate order frequency
  if (orders.length > 1) {
    const dates = orders.map(o => new Date(o.created_at).getTime()).sort();
    const daysBetweenOrders = dates.slice(1).map((date, i) => 
      (date - dates[i]) / (1000 * 60 * 60 * 24)
    );
    const avgDaysBetween = daysBetweenOrders.reduce((a, b) => a + b, 0) / daysBetweenOrders.length;
    
    const orderFrequency = 
      avgDaysBetween < 7 ? 'Weekly' :
      avgDaysBetween < 30 ? 'Monthly' :
      avgDaysBetween < 90 ? 'Quarterly' :
      'Occasional';
  } else {
    const orderFrequency = 'First order';
  }
  
  // Calculate preferred order time
  const hourCounts: Record<number, number> = {};
  orders.forEach(order => {
    const hour = new Date(order.created_at).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  const preferredHour = Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0];
  
  const preferredOrderTime = preferredHour !== undefined
    ? `${preferredHour}:00 - ${(parseInt(preferredHour) + 1) % 24}:00`
    : 'No pattern';
  
  return {
    favoriteProducts,
    averageOrderValue,
    orderFrequency,
    preferredOrderTime,
  };
}