import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database/types';
import { 
  SiteMetrics, 
  SiteMetricsInsert,
  MetricData 
} from '@/lib/database/aliases';
import { MetricsData } from '@/lib/database/json-types';
import { SupabaseError } from '../errors';

export interface MetricsHistory {
  date: string;
  metrics: MetricsData;
}

// Get current metrics (today's or most recent)
export async function getCurrentMetrics(
  client: SupabaseClient<Database>,
  siteId: string
): Promise<MetricsData | null> {
  const today = new Date().toISOString().split('T')[0];
  
  // Try to get today's metrics first
  let query = client
    .from('site_metrics')
    .select('metrics')
    .eq('site_id', siteId)
    .eq('metric_date', today)
    .single();
  
  try {
    const { data: result, error } = await query;
    if (error) throw new SupabaseError(error.message, error.code);
    return (result && 'metrics' in result) ? result.metrics as MetricsData : null;
  } catch (error) {
    // If no metrics for today, get the most recent
    const recentQuery = client
      .from('site_metrics')
      .select('metrics')
      .eq('site_id', siteId)
      .order('metric_date', { ascending: false })
      .limit(1)
      .single();
    
    try {
      const { data: result, error: recentError } = await recentQuery;
      if (recentError) throw new SupabaseError(recentError.message, recentError.code);
      return (result && 'metrics' in result) ? result.metrics as MetricsData : null;
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
    .select('metric_date, metrics')
    .eq('site_id', siteId)
    .gte('metric_date', startDate.toISOString().split('T')[0])
    .lte('metric_date', endDate.toISOString().split('T')[0])
    .order('metric_date', { ascending: true });
  
  const { data: results, error } = await query;
  if (error) throw new SupabaseError(error.message, error.code);
  
  return results.map(result => ({
    date: result.metric_date,
    metrics: result.metrics as MetricsData,
  }));
}

// Get metrics for a specific date
export async function getMetricsByDate(
  client: SupabaseClient<Database>,
  siteId: string,
  date: string
): Promise<MetricsData | null> {
  const query = client
    .from('site_metrics')
    .select('metrics')
    .eq('site_id', siteId)
    .eq('metric_date', date)
    .single();
  
  try {
    const { data: result, error } = await query;
    if (error) throw new SupabaseError(error.message, error.code);
    return (result && 'metrics' in result) ? result.metrics as MetricsData : null;
  } catch {
    return null;
  }
}

// Save or update metrics
export async function saveMetrics(
  client: SupabaseClient<Database>,
  siteId: string,
  metrics: MetricsData,
  date?: string
): Promise<SiteMetrics> {
  const metricDate = date || new Date().toISOString().split('T')[0];
  
  // Calculate trends based on previous day's data
  const previousDate = new Date(metricDate);
  previousDate.setDate(previousDate.getDate() - 1);
  const previousMetrics = await getMetricsByDate(
    client, 
    siteId, 
    previousDate.toISOString().split('T')[0]
  );
  
  // Calculate trends for each metric
  const metricsWithTrends = calculateMetricTrends(metrics, previousMetrics);
  
  const metricsData: SiteMetricsInsert = {
    site_id: siteId,
    metric_date: metricDate,
    metrics: metricsWithTrends,
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

// Calculate metric trends
function calculateMetricTrends(
  current: MetricsData,
  previous: MetricsData | null
): MetricsData {
  if (!previous) {
    // If no previous data, all trends are neutral
    const result: MetricsData = {};
    for (const [key, metric] of Object.entries(current)) {
      if (metric && typeof metric === 'object' && 'score' in metric) {
        result[key as keyof MetricsData] = {
          ...metric,
          trend: 'neutral',
        };
      }
    }
    return result;
  }
  
  const result: MetricsData = {};
  
  for (const [key, currentMetric] of Object.entries(current)) {
    const previousMetric = previous[key as keyof MetricsData];
    
    if (currentMetric && typeof currentMetric === 'object' && 'score' in currentMetric) {
      const currentScore = currentMetric.score;
      const previousScore = previousMetric && typeof previousMetric === 'object' && 'score' in previousMetric 
        ? (previousMetric as any).score
        : currentScore;
      
      const change = currentScore - previousScore;
      const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
      
      result[key as keyof MetricsData] = {
        score: currentScore,
        change: Math.abs(change),
        trend,
      };
    }
  }
  
  return result;
}

// Get metrics summary (averages, trends, etc.)
export async function getMetricsSummary(
  client: SupabaseClient<Database>,
  siteId: string,
  days: number = 30
): Promise<{
  averages: MetricsData;
  trends: Record<keyof MetricsData, 'improving' | 'declining' | 'stable'>;
  bestDay: { date: string; score: number };
  worstDay: { date: string; score: number };
}> {
  const history = await getMetricsHistory(client, siteId, days);
  
  if (history.length === 0) {
    return {
      averages: {},
      trends: {} as any,
      bestDay: { date: '', score: 0 },
      worstDay: { date: '', score: 0 },
    };
  }
  
  // Calculate averages
  const sums: Record<string, { score: number; count: number }> = {};
  const trends: Record<string, number[]> = {};
  let bestDay = { date: '', score: 0 };
  let worstDay = { date: '', score: 100 };
  
  history.forEach(({ date, metrics }) => {
    let dayScore = 0;
    let metricCount = 0;
    
    Object.entries(metrics).forEach(([key, metric]) => {
      if (metric && typeof metric === 'object' && 'score' in metric) {
        // Track sums for averages
        if (!sums[key]) {
          sums[key] = { score: 0, count: 0 };
        }
        sums[key].score += (metric as any).score;
        sums[key].count += 1;
        
        // Track scores for trend analysis
        if (!trends[key]) {
          trends[key] = [];
        }
        trends[key].push((metric as any).score);
        
        // Calculate day score
        dayScore += (metric as any).score;
        metricCount += 1;
      }
    });
    
    // Track best/worst days
    const avgDayScore = metricCount > 0 ? dayScore / metricCount : 0;
    if (avgDayScore > bestDay.score) {
      bestDay = { date, score: avgDayScore };
    }
    if (avgDayScore < worstDay.score) {
      worstDay = { date, score: avgDayScore };
    }
  });
  
  // Calculate averages
  const averages: MetricsData = {};
  Object.entries(sums).forEach(([key, { score, count }]) => {
    averages[key as keyof MetricsData] = {
      score: Math.round(score / count),
      change: 0,
      trend: 'neutral',
    };
  });
  
  // Analyze trends
  const trendAnalysis: Record<keyof MetricsData, 'improving' | 'declining' | 'stable'> = {} as any;
  Object.entries(trends).forEach(([key, scores]) => {
    if (scores.length < 2) {
      trendAnalysis[key as keyof MetricsData] = 'stable';
      return;
    }
    
    // Simple linear regression to determine trend
    const n = scores.length;
    const sumX = (n * (n + 1)) / 2;
    const sumY = scores.reduce((a, b) => a + b, 0);
    const sumXY = scores.reduce((sum, y, x) => sum + (x + 1) * y, 0);
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    trendAnalysis[key as keyof MetricsData] = 
      slope > 0.5 ? 'improving' : 
      slope < -0.5 ? 'declining' : 
      'stable';
  });
  
  return {
    averages,
    trends: trendAnalysis,
    bestDay,
    worstDay,
  };
}

// Generate sample metrics (for development/testing)
export function generateSampleMetrics(): MetricsData {
  const randomScore = (min: number, max: number) => 
    Math.floor(Math.random() * (max - min + 1)) + min;
  
  const randomChange = () => Math.floor(Math.random() * 10) - 5;
  
  const metrics: MetricsData = {
    performance: {
      score: randomScore(70, 95),
      change: randomChange(),
      trend: 'neutral',
    },
    page_load: {
      score: randomScore(80, 98),
      change: randomChange(),
      trend: 'neutral',
    },
    seo: {
      score: randomScore(60, 85),
      change: randomChange(),
      trend: 'neutral',
    },
    mobile: {
      score: randomScore(75, 90),
      change: randomChange(),
      trend: 'neutral',
    },
    security: {
      score: randomScore(85, 100),
      change: randomChange(),
      trend: 'neutral',
    },
    accessibility: {
      score: randomScore(65, 80),
      change: randomChange(),
      trend: 'neutral',
    },
  };
  
  // Set trends based on change
  Object.values(metrics).forEach(metric => {
    if (metric && typeof metric === 'object' && 'change' in metric && 'trend' in metric) {
      (metric as any).trend = (metric as any).change > 0 ? 'up' : (metric as any).change < 0 ? 'down' : 'neutral';
    }
  });
  
  return metrics;
}

// Batch update metrics for multiple dates
export async function batchUpdateMetrics(
  client: SupabaseClient<Database>,
  siteId: string,
  metricsData: Array<{ date: string; metrics: MetricsData }>
): Promise<SiteMetrics[]> {
  const inserts = metricsData.map(({ date, metrics }) => ({
    site_id: siteId,
    metric_date: date,
    metrics,
  }));
  
  const query = client
    .from('site_metrics')
    .upsert(inserts, {
      onConflict: 'site_id,metric_date',
    })
    .select();
  
  const { data, error } = await query;
  if (error) throw new SupabaseError(error.message, error.code);
  return data as SiteMetrics[];
}

// Get metric comparison between dates
export async function compareMetrics(
  client: SupabaseClient<Database>,
  siteId: string,
  date1: string,
  date2: string
): Promise<{
  date1Metrics: MetricsData | null;
  date2Metrics: MetricsData | null;
  comparison: Record<keyof MetricsData, {
    difference: number;
    percentageChange: number;
    improved: boolean;
  }>;
}> {
  const [metrics1, metrics2] = await Promise.all([
    getMetricsByDate(client, siteId, date1),
    getMetricsByDate(client, siteId, date2),
  ]);
  
  const comparison: any = {};
  
  if (metrics1 && metrics2) {
    const metricKeys: (keyof MetricsData)[] = [
      'performance', 'page_load', 'seo', 'mobile', 'security', 'accessibility'
    ];
    
    metricKeys.forEach(key => {
      const m1 = metrics1[key];
      const m2 = metrics2[key];
      
      if (m1 && m2 && 'score' in m1 && 'score' in m2) {
        const difference = m2.score - m1.score;
        const percentageChange = m1.score !== 0 
          ? ((difference / m1.score) * 100) 
          : 0;
        
        comparison[key] = {
          difference,
          percentageChange: Math.round(percentageChange * 10) / 10,
          improved: difference > 0,
        };
      }
    });
  }
  
  return {
    date1Metrics: metrics1,
    date2Metrics: metrics2,
    comparison,
  };
}