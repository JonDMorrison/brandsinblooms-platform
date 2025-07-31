import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database/types';
import { 
  SiteMetrics, 
  SiteMetricsInsert
} from '@/lib/database/aliases';
import { SupabaseError } from '../errors';

export interface MetricsHistory {
  date: string;
  unique_visitors: number;
  page_views: number;
  content_count: number;
  product_count: number;
  inquiry_count: number;
}

// Get current metrics (today's or most recent)
export async function getCurrentMetrics(
  client: SupabaseClient<Database>,
  siteId: string
): Promise<SiteMetrics | null> {
  const today = new Date().toISOString().split('T')[0];
  
  // Try to get today's metrics first
  let query = client
    .from('site_metrics')
    .select('*')
    .eq('site_id', siteId)
    .eq('metric_date', today)
    .single();
  
  try {
    const { data: result, error } = await query;
    if (error) throw new SupabaseError(error.message, error.code);
    return result;
  } catch (error) {
    // If no metrics for today, get the most recent
    const recentQuery = client
      .from('site_metrics')
      .select('*')
      .eq('site_id', siteId)
      .order('metric_date', { ascending: false })
      .limit(1)
      .single();
    
    try {
      const { data: result, error: recentError } = await recentQuery;
      if (recentError) throw new SupabaseError(recentError.message, recentError.code);
      return result;
    } catch {
      return null;
    }
  }
}

// Get metrics history
export async function getMetricsHistory(
  client: SupabaseClient<Database>,
  siteId: string,
  days: number = 30
): Promise<MetricsHistory[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const query = client
    .from('site_metrics')
    .select('*')
    .eq('site_id', siteId)
    .gte('metric_date', startDate.toISOString().split('T')[0])
    .lte('metric_date', endDate.toISOString().split('T')[0])
    .order('metric_date', { ascending: true });
  
  const { data: results, error } = await query;
  if (error) throw new SupabaseError(error.message, error.code);
  
  return (results || []).map(result => ({
    date: result.metric_date,
    unique_visitors: result.unique_visitors || 0,
    page_views: result.page_views || 0,
    content_count: result.content_count || 0,
    product_count: result.product_count || 0,
    inquiry_count: result.inquiry_count || 0,
  }));
}

// Get metrics for a specific date
export async function getMetricsByDate(
  client: SupabaseClient<Database>,
  siteId: string,
  date: string
): Promise<SiteMetrics | null> {
  const query = client
    .from('site_metrics')
    .select('*')
    .eq('site_id', siteId)
    .eq('metric_date', date)
    .single();
  
  try {
    const { data: result, error } = await query;
    if (error) throw new SupabaseError(error.message, error.code);
    return result;
  } catch {
    return null;
  }
}

// Save or update metrics
export async function saveMetrics(
  client: SupabaseClient<Database>,
  siteId: string,
  metrics: {
    unique_visitors?: number;
    page_views?: number;
    content_count?: number;
    product_count?: number;
    inquiry_count?: number;
  },
  date?: string
): Promise<SiteMetrics> {
  const metricDate = date || new Date().toISOString().split('T')[0];
  
  const metricsData: SiteMetricsInsert = {
    site_id: siteId,
    metric_date: metricDate,
    unique_visitors: metrics.unique_visitors || 0,
    page_views: metrics.page_views || 0,
    content_count: metrics.content_count || 0,
    product_count: metrics.product_count || 0,
    inquiry_count: metrics.inquiry_count || 0,
  };
  
  // Use upsert to handle both insert and update
  const query = client
    .from('site_metrics')
    .upsert(metricsData, {
      onConflict: 'site_id,metric_date',
    })
    .select()
    .single();
  
  const { data: result, error } = await query;
  if (error) throw new SupabaseError(error.message, error.code);
  if (!result) {
    throw new Error('Failed to upsert metrics');
  }
  return result as SiteMetrics;
}

// Update specific metrics
export async function updateMetricCounts(
  client: SupabaseClient<Database>,
  siteId: string,
  updates: {
    unique_visitors?: number;
    page_views?: number;
    content_count?: number;
    product_count?: number;
    inquiry_count?: number;
  },
  date?: string
): Promise<SiteMetrics> {
  const metricDate = date || new Date().toISOString().split('T')[0];
  
  // Get existing metrics or create new
  const existing = await getMetricsByDate(client, siteId, metricDate);
  
  if (existing) {
    // Update existing metrics
    const query = client
      .from('site_metrics')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('site_id', siteId)
      .eq('metric_date', metricDate)
      .select()
      .single();
    
    const { data: result, error } = await query;
    if (error) throw new SupabaseError(error.message, error.code);
    if (!result) {
      throw new Error('Failed to update metrics');
    }
    return result as SiteMetrics;
  } else {
    // Create new metrics
    return saveMetrics(client, siteId, updates, metricDate);
  }
}

// Increment metric counts
export async function incrementMetrics(
  client: SupabaseClient<Database>,
  siteId: string,
  increments: {
    unique_visitors?: number;
    page_views?: number;
    inquiry_count?: number;
  },
  date?: string
): Promise<void> {
  const metricDate = date || new Date().toISOString().split('T')[0];
  
  // Get current metrics
  const current = await getMetricsByDate(client, siteId, metricDate);
  
  if (current) {
    const updates: any = {};
    if (increments.unique_visitors) {
      updates.unique_visitors = (current.unique_visitors || 0) + increments.unique_visitors;
    }
    if (increments.page_views) {
      updates.page_views = (current.page_views || 0) + increments.page_views;
    }
    if (increments.inquiry_count) {
      updates.inquiry_count = (current.inquiry_count || 0) + increments.inquiry_count;
    }
    
    await updateMetricCounts(client, siteId, updates, metricDate);
  } else {
    await saveMetrics(client, siteId, increments, metricDate);
  }
}

// Get metrics summary
export async function getMetricsSummary(
  client: SupabaseClient<Database>,
  siteId: string,
  days: number = 30
): Promise<{
  total_visitors: number;
  total_page_views: number;
  avg_daily_visitors: number;
  avg_daily_page_views: number;
  growth_rate: number;
}> {
  const history = await getMetricsHistory(client, siteId, days);
  
  const totals = history.reduce((acc, metric) => ({
    visitors: acc.visitors + metric.unique_visitors,
    pageViews: acc.pageViews + metric.page_views,
  }), { visitors: 0, pageViews: 0 });
  
  const avgDailyVisitors = totals.visitors / (history.length || 1);
  const avgDailyPageViews = totals.pageViews / (history.length || 1);
  
  // Calculate growth rate (compare first half to second half)
  const midPoint = Math.floor(history.length / 2);
  const firstHalf = history.slice(0, midPoint);
  const secondHalf = history.slice(midPoint);
  
  const firstHalfAvg = firstHalf.reduce((sum, m) => sum + m.unique_visitors, 0) / (firstHalf.length || 1);
  const secondHalfAvg = secondHalf.reduce((sum, m) => sum + m.unique_visitors, 0) / (secondHalf.length || 1);
  
  const growthRate = firstHalfAvg ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
  
  return {
    total_visitors: totals.visitors,
    total_page_views: totals.pageViews,
    avg_daily_visitors: Math.round(avgDailyVisitors),
    avg_daily_page_views: Math.round(avgDailyPageViews),
    growth_rate: Math.round(growthRate * 100) / 100,
  };
}

// Compare metrics between two dates
export async function compareMetrics(
  client: SupabaseClient<Database>,
  siteId: string,
  date1: string,
  date2: string
): Promise<{
  date1_metrics: SiteMetrics | null;
  date2_metrics: SiteMetrics | null;
  changes: {
    unique_visitors: number;
    page_views: number;
    content_count: number;
    product_count: number;
    inquiry_count: number;
  };
  percentages: {
    unique_visitors: number;
    page_views: number;
    content_count: number;
    product_count: number;
    inquiry_count: number;
  };
}> {
  const [metrics1, metrics2] = await Promise.all([
    getMetricsByDate(client, siteId, date1),
    getMetricsByDate(client, siteId, date2),
  ]);
  
  const calculateChange = (val1: number | null, val2: number | null) => {
    const v1 = val1 || 0;
    const v2 = val2 || 0;
    return v2 - v1;
  };
  
  const calculatePercentage = (val1: number | null, val2: number | null) => {
    const v1 = val1 || 0;
    const v2 = val2 || 0;
    if (v1 === 0) return v2 > 0 ? 100 : 0;
    return Math.round(((v2 - v1) / v1) * 10000) / 100;
  };
  
  return {
    date1_metrics: metrics1,
    date2_metrics: metrics2,
    changes: {
      unique_visitors: calculateChange(metrics1?.unique_visitors, metrics2?.unique_visitors),
      page_views: calculateChange(metrics1?.page_views, metrics2?.page_views),
      content_count: calculateChange(metrics1?.content_count, metrics2?.content_count),
      product_count: calculateChange(metrics1?.product_count, metrics2?.product_count),
      inquiry_count: calculateChange(metrics1?.inquiry_count, metrics2?.inquiry_count),
    },
    percentages: {
      unique_visitors: calculatePercentage(metrics1?.unique_visitors, metrics2?.unique_visitors),
      page_views: calculatePercentage(metrics1?.page_views, metrics2?.page_views),
      content_count: calculatePercentage(metrics1?.content_count, metrics2?.content_count),
      product_count: calculatePercentage(metrics1?.product_count, metrics2?.product_count),
      inquiry_count: calculatePercentage(metrics1?.inquiry_count, metrics2?.inquiry_count),
    },
  };
}

// Batch update metrics
export async function batchUpdateMetrics(
  client: SupabaseClient<Database>,
  siteId: string,
  metricsData: Array<{
    date: string;
    metrics: {
      unique_visitors?: number;
      page_views?: number;
      content_count?: number;
      product_count?: number;
      inquiry_count?: number;
    };
  }>
): Promise<void> {
  // Process in batches to avoid overwhelming the database
  const batchSize = 10;
  for (let i = 0; i < metricsData.length; i += batchSize) {
    const batch = metricsData.slice(i, i + batchSize);
    await Promise.all(
      batch.map(({ date, metrics }) => 
        saveMetrics(client, siteId, metrics, date)
      )
    );
  }
}

// Generate sample metrics (for development/testing)
export function generateSampleMetrics(): {
  unique_visitors: number;
  page_views: number;
  content_count: number;
  product_count: number;
  inquiry_count: number;
} {
  // Generate realistic-looking sample data
  const baseVisitors = Math.floor(Math.random() * 50) + 10;
  const pageViewMultiplier = Math.random() * 2 + 1.5;
  
  return {
    unique_visitors: baseVisitors,
    page_views: Math.floor(baseVisitors * pageViewMultiplier),
    content_count: Math.floor(Math.random() * 5) + 1,
    product_count: Math.floor(Math.random() * 3),
    inquiry_count: Math.floor(Math.random() * baseVisitors * 0.1),
  };
}