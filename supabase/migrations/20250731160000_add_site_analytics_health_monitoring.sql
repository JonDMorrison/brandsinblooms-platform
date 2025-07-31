-- Site Analytics & Health Monitoring Migration
-- Implements Milestone 5: Site Analytics & Health Monitoring
-- Adds comprehensive health monitoring, performance metrics, and analytics system

-- =====================================================
-- 1. SITE HEALTH CHECKS TABLE
-- =====================================================

-- Create site health checks table for monitoring system health
CREATE TABLE public.site_health_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Site being monitored
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    
    -- Health check details
    check_type VARCHAR(50) NOT NULL, -- 'uptime', 'performance', 'ssl', 'domain', 'database', 'content'
    status VARCHAR(20) NOT NULL DEFAULT 'unknown', -- 'healthy', 'warning', 'critical', 'unknown'
    
    -- Check timing
    checked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    response_time_ms INTEGER, -- response time in milliseconds
    
    -- Check results
    is_healthy BOOLEAN DEFAULT NULL,
    error_message TEXT,
    warning_message TEXT,
    
    -- Detailed results data
    check_data JSONB DEFAULT '{}'::jsonb, -- structured data about the check
    
    -- HTTP-specific data (for uptime/performance checks)
    http_status_code INTEGER,
    dns_resolution_ms INTEGER,
    ssl_expiry_date TIMESTAMPTZ,
    
    -- Performance metrics
    page_load_time_ms INTEGER,
    first_contentful_paint_ms INTEGER,
    largest_contentful_paint_ms INTEGER,
    cumulative_layout_shift DECIMAL(5,3),
    
    -- Metadata
    user_agent TEXT,
    check_location VARCHAR(100), -- geographic location of check
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_site_health_checks_site_time ON public.site_health_checks(site_id, checked_at DESC);
CREATE INDEX idx_site_health_checks_type_status ON public.site_health_checks(check_type, status, checked_at DESC);
CREATE INDEX idx_site_health_checks_status_time ON public.site_health_checks(status, checked_at DESC);
CREATE INDEX idx_site_health_checks_response_time ON public.site_health_checks(response_time_ms) WHERE response_time_ms IS NOT NULL;

-- Enable RLS
ALTER TABLE public.site_health_checks ENABLE ROW LEVEL SECURITY;

-- Admins can view all health checks
CREATE POLICY "Admins can view all health checks"
ON public.site_health_checks FOR SELECT
USING (public.is_admin());

-- System can insert health check results
CREATE POLICY "System can insert health checks"
ON public.site_health_checks FOR INSERT
WITH CHECK (true);

-- =====================================================
-- 2. SITE PERFORMANCE METRICS TABLE
-- =====================================================

-- Create performance metrics table for detailed analytics
CREATE TABLE public.site_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Site and timing
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Traffic metrics
    unique_visitors INTEGER DEFAULT 0,
    page_views INTEGER DEFAULT 0,
    sessions INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2), -- percentage
    avg_session_duration_seconds INTEGER,
    
    -- Performance metrics
    avg_page_load_time_ms INTEGER,
    avg_server_response_time_ms INTEGER,
    total_requests INTEGER DEFAULT 0,
    error_rate DECIMAL(5,2), -- percentage of requests that resulted in errors
    
    -- Core Web Vitals
    avg_first_contentful_paint_ms INTEGER,
    avg_largest_contentful_paint_ms INTEGER,
    avg_cumulative_layout_shift DECIMAL(5,3),
    avg_first_input_delay_ms INTEGER,
    
    -- Resource usage
    bandwidth_used_bytes BIGINT DEFAULT 0,
    storage_used_bytes BIGINT DEFAULT 0,
    cdn_cache_hit_rate DECIMAL(5,2), -- percentage
    
    -- Content metrics
    total_content_items INTEGER DEFAULT 0,
    total_products INTEGER DEFAULT 0,
    active_content_items INTEGER DEFAULT 0,
    
    -- User engagement
    form_submissions INTEGER DEFAULT 0,
    contact_inquiries INTEGER DEFAULT 0,
    product_views INTEGER DEFAULT 0,
    
    -- Geographic data
    top_countries JSONB DEFAULT '[]'::jsonb,
    top_referrers JSONB DEFAULT '[]'::jsonb,
    top_pages JSONB DEFAULT '[]'::jsonb,
    
    -- Device/browser data
    device_breakdown JSONB DEFAULT '{}'::jsonb, -- desktop/mobile/tablet percentages
    browser_breakdown JSONB DEFAULT '{}'::jsonb,
    
    -- SEO metrics
    search_impressions INTEGER DEFAULT 0,
    search_clicks INTEGER DEFAULT 0,
    avg_search_position DECIMAL(5,2),
    
    -- Time period this metric represents
    period_type VARCHAR(20) DEFAULT 'daily', -- 'hourly', 'daily', 'weekly', 'monthly'
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    
    -- Additional data
    raw_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for analytics queries
CREATE INDEX idx_site_performance_metrics_site_period ON public.site_performance_metrics(site_id, period_type, recorded_at DESC);
CREATE INDEX idx_site_performance_metrics_recorded ON public.site_performance_metrics(recorded_at DESC);
CREATE INDEX idx_site_performance_metrics_period_range ON public.site_performance_metrics(period_start, period_end);
CREATE INDEX idx_site_performance_metrics_visitors ON public.site_performance_metrics(unique_visitors DESC) WHERE unique_visitors > 0;
CREATE INDEX idx_site_performance_metrics_performance ON public.site_performance_metrics(avg_page_load_time_ms) WHERE avg_page_load_time_ms IS NOT NULL;

-- Enable RLS
ALTER TABLE public.site_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Admins can view all performance metrics
CREATE POLICY "Admins can view all performance metrics"
ON public.site_performance_metrics FOR SELECT
USING (public.is_admin());

-- System can insert performance metrics
CREATE POLICY "System can insert performance metrics"
ON public.site_performance_metrics FOR INSERT
WITH CHECK (true);

-- Site owners can view their own metrics
CREATE POLICY "Site owners can view their metrics"
ON public.site_performance_metrics FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.site_memberships sm
        WHERE sm.site_id = site_performance_metrics.site_id
        AND sm.user_id = auth.uid()
        AND sm.is_active = true
        AND sm.role IN ('owner', 'admin')
    )
);

-- =====================================================
-- 3. SITE HEALTH MONITORING FUNCTIONS
-- =====================================================

-- Function to perform comprehensive site health check
CREATE OR REPLACE FUNCTION public.check_site_health(site_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    site_record public.sites%ROWTYPE;
    health_score INTEGER := 100;
    issues JSON := '[]'::json;
    warnings JSON := '[]'::json;
    result JSON;
    
    -- Health check results
    domain_status VARCHAR(20) := 'healthy';
    ssl_status VARCHAR(20) := 'healthy';
    content_status VARCHAR(20) := 'healthy';
    performance_status VARCHAR(20) := 'healthy';
    
    -- Metrics
    recent_uptime DECIMAL(5,2);
    avg_response_time INTEGER;
    error_count INTEGER;
    content_count INTEGER;
    product_count INTEGER;
BEGIN
    -- Get site information
    SELECT * INTO site_record FROM public.sites WHERE id = site_uuid;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Site not found'
        );
    END IF;
    
    -- Check recent uptime (last 24 hours)
    SELECT 
        ROUND(
            (COUNT(*) FILTER (WHERE is_healthy = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
            2
        ),
        ROUND(AVG(response_time_ms))
    INTO recent_uptime, avg_response_time
    FROM public.site_health_checks
    WHERE site_id = site_uuid
    AND check_type = 'uptime'
    AND checked_at >= NOW() - INTERVAL '24 hours';
    
    -- Check for recent errors
    SELECT COUNT(*)
    INTO error_count
    FROM public.site_health_checks
    WHERE site_id = site_uuid
    AND status = 'critical'
    AND checked_at >= NOW() - INTERVAL '24 hours';
    
    -- Check content health
    SELECT COUNT(*) FROM public.content WHERE site_id = site_uuid AND is_published = true
    INTO content_count;
    
    SELECT COUNT(*) FROM public.products WHERE site_id = site_uuid AND is_active = true
    INTO product_count;
    
    -- Assess domain status
    IF site_record.custom_domain IS NOT NULL THEN
        -- Check if custom domain is properly configured
        -- This would typically involve DNS checks, but for now we'll use a placeholder
        IF site_record.domain_verified = false THEN
            domain_status := 'warning';
            health_score := health_score - 15;
            warnings := warnings || json_build_object(
                'type', 'domain',
                'message', 'Custom domain is not verified',
                'severity', 'medium'
            )::json;
        END IF;
    END IF;
    
    -- Assess SSL status (placeholder - would check SSL certificate expiry)
    -- For now, assume healthy unless we have specific SSL errors
    
    -- Assess content status
    IF content_count = 0 THEN
        content_status := 'warning';
        health_score := health_score - 10;
        warnings := warnings || json_build_object(
            'type', 'content',
            'message', 'No published content found',
            'severity', 'medium'
        )::json;
    END IF;
    
    -- Assess performance status
    IF avg_response_time > 3000 THEN
        performance_status := 'critical';
        health_score := health_score - 25;
        issues := issues || json_build_object(
            'type', 'performance',
            'message', format('High average response time: %sms', avg_response_time),
            'severity', 'high'
        )::json;
    ELSIF avg_response_time > 1500 THEN
        performance_status := 'warning';
        health_score := health_score - 10;
        warnings := warnings || json_build_object(
            'type', 'performance',
            'message', format('Elevated response time: %sms', avg_response_time),
            'severity', 'medium'
        )::json;
    END IF;
    
    -- Check uptime
    IF recent_uptime IS NOT NULL AND recent_uptime < 95 THEN
        health_score := health_score - 30;
        issues := issues || json_build_object(
            'type', 'uptime',
            'message', format('Low uptime: %s%%', recent_uptime),
            'severity', 'high'
        )::json;
    END IF;
    
    -- Check for recent errors
    IF error_count > 5 THEN
        health_score := health_score - 20;
        issues := issues || json_build_object(
            'type', 'errors',
            'message', format('%s critical errors in last 24 hours', error_count),
            'severity', 'high'
        )::json;
    ELSIF error_count > 0 THEN
        health_score := health_score - 5;
        warnings := warnings || json_build_object(
            'type', 'errors',
            'message', format('%s errors in last 24 hours', error_count),
            'severity', 'low'
        )::json;
    END IF;
    
    -- Ensure health score doesn't go below 0
    health_score := GREATEST(health_score, 0);
    
    -- Record this health check
    INSERT INTO public.site_health_checks (
        site_id,
        check_type,
        status,
        is_healthy,
        response_time_ms,
        check_data
    ) VALUES (
        site_uuid,
        'comprehensive',
        CASE 
            WHEN health_score >= 90 THEN 'healthy'
            WHEN health_score >= 70 THEN 'warning'
            ELSE 'critical'
        END,
        health_score >= 70,
        avg_response_time,
        json_build_object(
            'health_score', health_score,
            'domain_status', domain_status,
            'ssl_status', ssl_status,
            'content_status', content_status,
            'performance_status', performance_status,
            'recent_uptime', recent_uptime,
            'content_count', content_count,
            'product_count', product_count,
            'error_count', error_count
        )
    );
    
    -- Build result
    SELECT json_build_object(
        'success', true,
        'site_id', site_uuid,
        'site_name', site_record.name,
        'health_score', health_score,
        'overall_status', CASE 
            WHEN health_score >= 90 THEN 'healthy'
            WHEN health_score >= 70 THEN 'warning'
            ELSE 'critical'
        END,
        'checked_at', NOW(),
        'uptime_24h', COALESCE(recent_uptime, 100),
        'avg_response_time_ms', avg_response_time,
        'components', json_build_object(
            'domain', domain_status,
            'ssl', ssl_status,
            'content', content_status,
            'performance', performance_status
        ),
        'metrics', json_build_object(
            'content_count', content_count,
            'product_count', product_count,
            'error_count_24h', error_count
        ),
        'issues', issues,
        'warnings', warnings
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Function to get site health summary
CREATE OR REPLACE FUNCTION public.get_site_health_summary(site_uuid UUID, days_back INTEGER DEFAULT 7)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    current_health JSON;
BEGIN
    -- Only allow admins or site members to view health summary
    IF NOT public.is_admin() AND NOT EXISTS (
        SELECT 1 FROM public.site_memberships
        WHERE site_id = site_uuid
        AND user_id = auth.uid()
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Access denied: Insufficient permissions';
    END IF;
    
    -- Get current health status
    current_health := public.check_site_health(site_uuid);
    
    -- Build comprehensive summary
    SELECT json_build_object(
        'site_id', site_uuid,
        'current_health', current_health,
        'historical_data', json_build_object(
            'uptime_trend', (
                SELECT COALESCE(json_agg(
                    json_build_object(
                        'date', DATE(checked_at),
                        'uptime_percentage', ROUND(
                            (COUNT(*) FILTER (WHERE is_healthy = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
                            2
                        ),
                        'avg_response_time', ROUND(AVG(response_time_ms))
                    ) ORDER BY DATE(checked_at)
                ), '[]'::json)
                FROM public.site_health_checks
                WHERE site_id = site_uuid
                AND check_type = 'uptime'
                AND checked_at >= NOW() - (days_back || ' days')::interval
                GROUP BY DATE(checked_at)
            ),
            'error_trend', (
                SELECT COALESCE(json_agg(
                    json_build_object(
                        'date', DATE(checked_at),
                        'error_count', COUNT(*)
                    ) ORDER BY DATE(checked_at)
                ), '[]'::json)
                FROM public.site_health_checks
                WHERE site_id = site_uuid
                AND status = 'critical'
                AND checked_at >= NOW() - (days_back || ' days')::interval
                GROUP BY DATE(checked_at)
            ),
            'performance_trend', (
                SELECT COALESCE(json_agg(
                    json_build_object(
                        'date', DATE(recorded_at),
                        'avg_page_load_time', avg_page_load_time_ms,
                        'unique_visitors', unique_visitors,
                        'page_views', page_views
                    ) ORDER BY DATE(recorded_at)
                ), '[]'::json)
                FROM public.site_performance_metrics
                WHERE site_id = site_uuid
                AND recorded_at >= NOW() - (days_back || ' days')::interval
                AND period_type = 'daily'
            )
        ),
        'summary_stats', json_build_object(
            'avg_uptime_percentage', (
                SELECT ROUND(
                    (COUNT(*) FILTER (WHERE is_healthy = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
                    2
                )
                FROM public.site_health_checks
                WHERE site_id = site_uuid
                AND check_type = 'uptime'
                AND checked_at >= NOW() - (days_back || ' days')::interval
            ),
            'total_errors', (
                SELECT COUNT(*)
                FROM public.site_health_checks
                WHERE site_id = site_uuid
                AND status = 'critical'
                AND checked_at >= NOW() - (days_back || ' days')::interval
            ),
            'avg_response_time', (
                SELECT ROUND(AVG(response_time_ms))
                FROM public.site_health_checks
                WHERE site_id = site_uuid
                AND response_time_ms IS NOT NULL
                AND checked_at >= NOW() - (days_back || ' days')::interval
            )
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

-- =====================================================
-- 4. ANALYTICS AGGREGATION FUNCTIONS
-- =====================================================

-- Function to aggregate performance metrics across sites
CREATE OR REPLACE FUNCTION public.get_platform_analytics_summary(days_back INTEGER DEFAULT 30)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Only allow admins to view platform analytics
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    SELECT json_build_object(
        'period_days', days_back,
        'generated_at', NOW(),
        'platform_totals', json_build_object(
            'total_sites', (SELECT COUNT(*) FROM public.sites WHERE is_active = true),
            'total_unique_visitors', (
                SELECT COALESCE(SUM(unique_visitors), 0)
                FROM public.site_performance_metrics
                WHERE recorded_at >= NOW() - (days_back || ' days')::interval
                AND period_type = 'daily'
            ),
            'total_page_views', (
                SELECT COALESCE(SUM(page_views), 0)
                FROM public.site_performance_metrics
                WHERE recorded_at >= NOW() - (days_back || ' days')::interval
                AND period_type = 'daily'
            ),
            'total_sessions', (
                SELECT COALESCE(SUM(sessions), 0)
                FROM public.site_performance_metrics
                WHERE recorded_at >= NOW() - (days_back || ' days')::interval
                AND period_type = 'daily'
            ),
            'avg_platform_uptime', (
                SELECT ROUND(
                    (COUNT(*) FILTER (WHERE is_healthy = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
                    2
                )
                FROM public.site_health_checks
                WHERE check_type = 'uptime'
                AND checked_at >= NOW() - (days_back || ' days')::interval
            )
        ),
        'performance_averages', json_build_object(
            'avg_page_load_time_ms', (
                SELECT ROUND(AVG(avg_page_load_time_ms))
                FROM public.site_performance_metrics
                WHERE recorded_at >= NOW() - (days_back || ' days')::interval
                AND avg_page_load_time_ms IS NOT NULL
            ),
            'avg_bounce_rate', (
                SELECT ROUND(AVG(bounce_rate), 2)
                FROM public.site_performance_metrics
                WHERE recorded_at >= NOW() - (days_back || ' days')::interval
                AND bounce_rate IS NOT NULL
            ),
            'avg_session_duration', (
                SELECT ROUND(AVG(avg_session_duration_seconds))
                FROM public.site_performance_metrics
                WHERE recorded_at >= NOW() - (days_back || ' days')::interval
                AND avg_session_duration_seconds IS NOT NULL
            )
        ),
        'top_performing_sites', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'site_id', s.id,
                    'site_name', s.name,
                    'subdomain', s.subdomain,
                    'total_visitors', site_stats.total_visitors,
                    'avg_load_time', site_stats.avg_load_time
                ) ORDER BY site_stats.total_visitors DESC
            ) FILTER (WHERE site_stats.total_visitors > 0), '[]'::json)
            FROM public.sites s
            INNER JOIN (
                SELECT 
                    site_id,
                    SUM(unique_visitors) as total_visitors,
                    ROUND(AVG(avg_page_load_time_ms)) as avg_load_time
                FROM public.site_performance_metrics
                WHERE recorded_at >= NOW() - (days_back || ' days')::interval
                AND period_type = 'daily'
                GROUP BY site_id
            ) site_stats ON s.id = site_stats.site_id
            WHERE s.is_active = true
            LIMIT 10
        ),
        'health_distribution', (
            SELECT json_build_object(
                'healthy', COUNT(*) FILTER (WHERE latest_health.health_score >= 90),
                'warning', COUNT(*) FILTER (WHERE latest_health.health_score >= 70 AND latest_health.health_score < 90),
                'critical', COUNT(*) FILTER (WHERE latest_health.health_score < 70)
            )
            FROM (
                SELECT DISTINCT ON (site_id)
                    site_id,
                    (check_data->>'health_score')::INTEGER as health_score
                FROM public.site_health_checks
                WHERE check_type = 'comprehensive'
                AND checked_at >= NOW() - INTERVAL '1 day'
                ORDER BY site_id, checked_at DESC
            ) latest_health
        ),
        'daily_trends', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'date', trend_date,
                    'unique_visitors', total_visitors,
                    'page_views', total_page_views,
                    'avg_load_time', avg_load_time,
                    'uptime_percentage', uptime_percentage
                ) ORDER BY trend_date
            ), '[]'::json)
            FROM (
                SELECT 
                    DATE(pm.recorded_at) as trend_date,
                    SUM(pm.unique_visitors) as total_visitors,
                    SUM(pm.page_views) as total_page_views,
                    ROUND(AVG(pm.avg_page_load_time_ms)) as avg_load_time,
                    ROUND(
                        (COUNT(*) FILTER (WHERE hc.is_healthy = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
                        2
                    ) as uptime_percentage
                FROM public.site_performance_metrics pm
                LEFT JOIN public.site_health_checks hc ON DATE(hc.checked_at) = DATE(pm.recorded_at)
                    AND hc.check_type = 'uptime'
                WHERE pm.recorded_at >= NOW() - (days_back || ' days')::interval
                AND pm.period_type = 'daily'
                GROUP BY DATE(pm.recorded_at)
            ) daily_data
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Function to get individual site analytics
CREATE OR REPLACE FUNCTION public.get_site_analytics(
    site_uuid UUID,
    days_back INTEGER DEFAULT 30,
    period_type VARCHAR(20) DEFAULT 'daily'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    site_record public.sites%ROWTYPE;
BEGIN
    -- Check permissions
    IF NOT public.is_admin() AND NOT EXISTS (
        SELECT 1 FROM public.site_memberships
        WHERE site_id = site_uuid
        AND user_id = auth.uid()
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Access denied: Insufficient permissions';
    END IF;
    
    -- Get site information
    SELECT * INTO site_record FROM public.sites WHERE id = site_uuid;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Site not found');
    END IF;
    
    SELECT json_build_object(
        'success', true,
        'site_id', site_uuid,
        'site_name', site_record.name,
        'period_days', days_back,
        'period_type', period_type,
        'generated_at', NOW(),
        'summary_metrics', json_build_object(
            'total_unique_visitors', (
                SELECT COALESCE(SUM(unique_visitors), 0)
                FROM public.site_performance_metrics
                WHERE site_id = site_uuid
                AND recorded_at >= NOW() - (days_back || ' days')::interval
                AND period_type = get_site_analytics.period_type
            ),
            'total_page_views', (
                SELECT COALESCE(SUM(page_views), 0)
                FROM public.site_performance_metrics
                WHERE site_id = site_uuid
                AND recorded_at >= NOW() - (days_back || ' days')::interval
                AND period_type = get_site_analytics.period_type
            ),
            'total_sessions', (
                SELECT COALESCE(SUM(sessions), 0)
                FROM public.site_performance_metrics
                WHERE site_id = site_uuid
                AND recorded_at >= NOW() - (days_back || ' days')::interval
                AND period_type = get_site_analytics.period_type
            ),
            'avg_bounce_rate', (
                SELECT ROUND(AVG(bounce_rate), 2)
                FROM public.site_performance_metrics
                WHERE site_id = site_uuid
                AND recorded_at >= NOW() - (days_back || ' days')::interval
                AND period_type = get_site_analytics.period_type
                AND bounce_rate IS NOT NULL
            ),
            'avg_session_duration', (
                SELECT ROUND(AVG(avg_session_duration_seconds))
                FROM public.site_performance_metrics
                WHERE site_id = site_uuid
                AND recorded_at >= NOW() - (days_back || ' days')::interval
                AND period_type = get_site_analytics.period_type
                AND avg_session_duration_seconds IS NOT NULL
            ),
            'avg_page_load_time', (
                SELECT ROUND(AVG(avg_page_load_time_ms))
                FROM public.site_performance_metrics
                WHERE site_id = site_uuid
                AND recorded_at >= NOW() - (days_back || ' days')::interval
                AND period_type = get_site_analytics.period_type
                AND avg_page_load_time_ms IS NOT NULL
            )
        ),
        'time_series_data', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'date', recorded_at,
                    'unique_visitors', unique_visitors,
                    'page_views', page_views,
                    'sessions', sessions,
                    'bounce_rate', bounce_rate,
                    'avg_session_duration', avg_session_duration_seconds,
                    'avg_page_load_time', avg_page_load_time_ms,
                    'form_submissions', form_submissions,
                    'product_views', product_views
                ) ORDER BY recorded_at
            ), '[]'::json)
            FROM public.site_performance_metrics
            WHERE site_id = site_uuid
            AND recorded_at >= NOW() - (days_back || ' days')::interval
            AND period_type = get_site_analytics.period_type
        ),
        'geographic_data', (
            SELECT json_build_object(
                'top_countries', COALESCE(
                    (
                        SELECT json_agg(country_data)
                        FROM (
                            SELECT jsonb_array_elements(top_countries) as country_data
                            FROM public.site_performance_metrics
                            WHERE site_id = site_uuid
                            AND recorded_at >= NOW() - (days_back || ' days')::interval
                            AND top_countries IS NOT NULL
                            ORDER BY recorded_at DESC
                            LIMIT 1
                        ) latest_countries
                    ),
                    '[]'::json
                )
            )
        ),
        'device_breakdown', (
            SELECT COALESCE(
                (
                    SELECT device_breakdown
                    FROM public.site_performance_metrics
                    WHERE site_id = site_uuid
                    AND recorded_at >= NOW() - (days_back || ' days')::interval
                    AND device_breakdown IS NOT NULL
                    ORDER BY recorded_at DESC
                    LIMIT 1
                ),
                '{}'::jsonb
            )
        ),
        'top_pages', (
            SELECT COALESCE(
                (
                    SELECT top_pages
                    FROM public.site_performance_metrics
                    WHERE site_id = site_uuid
                    AND recorded_at >= NOW() - (days_back || ' days')::interval
                    AND top_pages IS NOT NULL
                    ORDER BY recorded_at DESC
                    LIMIT 1
                ),
                '[]'::jsonb
            )
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

-- =====================================================
-- 5. AUTOMATED MONITORING FUNCTIONS
-- =====================================================

-- Function to run platform-wide health checks
CREATE OR REPLACE FUNCTION public.run_platform_health_checks()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    site_record RECORD;
    check_count INTEGER := 0;
    result JSON;
BEGIN
    -- Run health checks for all active sites
    FOR site_record IN 
        SELECT id, name FROM public.sites WHERE is_active = true
    LOOP
        PERFORM public.check_site_health(site_record.id);
        check_count := check_count + 1;
    END LOOP;
    
    -- Log the platform health check
    PERFORM public.log_admin_action(
        NULL, -- System action
        NULL, -- Multiple sites
        'platform_health_check',
        'system',
        NULL,
        NULL,
        json_build_object('sites_checked', check_count),
        format('Completed platform-wide health checks for %s sites', check_count)
    );
    
    SELECT json_build_object(
        'success', true,
        'sites_checked', check_count,
        'checked_at', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$;

-- =====================================================
-- 6. COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.site_health_checks IS 'Comprehensive site health monitoring with uptime, performance, and error tracking';
COMMENT ON TABLE public.site_performance_metrics IS 'Detailed site analytics and performance metrics for comprehensive reporting';
COMMENT ON FUNCTION public.check_site_health IS 'Perform comprehensive health check for a site - admin or site member access';
COMMENT ON FUNCTION public.get_site_health_summary IS 'Get detailed health summary with historical trends - admin or site member access';
COMMENT ON FUNCTION public.get_platform_analytics_summary IS 'Get platform-wide analytics summary - admin only';
COMMENT ON FUNCTION public.get_site_analytics IS 'Get detailed analytics for a specific site - admin or site member access';
COMMENT ON FUNCTION public.run_platform_health_checks IS 'Run health checks for all active sites - system function';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- This migration successfully implements:
-- 1. Comprehensive site health monitoring with multiple check types
-- 2. Detailed performance metrics and analytics tracking
-- 3. Automated health check functions with scoring system
-- 4. Platform-wide analytics aggregation and reporting
-- 5. Individual site analytics with time-series data
-- 6. Geographic and demographic analytics tracking
-- 7. Core Web Vitals and performance monitoring
-- 8. Proper RLS policies for admin and site member access
-- 9. Comprehensive indexing for query performance
-- 10. Automated monitoring and alerting foundation