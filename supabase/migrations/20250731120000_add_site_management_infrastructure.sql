-- Site Management Infrastructure Migration
-- Implements Milestone 1: Site List & Search Infrastructure
-- Adds admin management fields, metrics tracking, and site statistics functions

-- =====================================================
-- 1. EXTEND SITES TABLE FOR ADMIN MANAGEMENT
-- =====================================================

-- Add admin management fields to sites table
ALTER TABLE public.sites 
ADD COLUMN admin_notes TEXT,
ADD COLUMN last_activity_at TIMESTAMPTZ,
ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Update existing sites to have reasonable last_activity_at values
UPDATE public.sites 
SET last_activity_at = GREATEST(created_at, updated_at)
WHERE last_activity_at IS NULL;

-- =====================================================
-- 2. SITE METRICS TRACKING TABLE
-- =====================================================

-- Create site metrics table for tracking site performance
CREATE TABLE public.site_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    unique_visitors INTEGER DEFAULT 0,
    page_views INTEGER DEFAULT 0,
    content_count INTEGER DEFAULT 0,
    product_count INTEGER DEFAULT 0,
    inquiry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(site_id, metric_date)
);

-- =====================================================
-- 3. INDEXES FOR ADMIN QUERIES
-- =====================================================

-- Create indexes for efficient admin queries
CREATE INDEX idx_sites_created_at ON public.sites(created_at DESC);
CREATE INDEX idx_sites_last_activity ON public.sites(last_activity_at DESC NULLS LAST);
CREATE INDEX idx_sites_created_by ON public.sites(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX idx_sites_admin_search ON public.sites USING gin(to_tsvector('english', name || ' ' || subdomain || ' ' || COALESCE(custom_domain, '') || ' ' || COALESCE(business_name, ''))) WHERE is_active = true;

-- Site metrics indexes
CREATE INDEX idx_site_metrics_date ON public.site_metrics(site_id, metric_date DESC);
CREATE INDEX idx_site_metrics_site ON public.site_metrics(site_id, created_at DESC);

-- =====================================================
-- 4. ADMIN FUNCTIONS FOR SITE STATISTICS
-- =====================================================

-- Function to get comprehensive site summary statistics
CREATE OR REPLACE FUNCTION public.get_site_summary_stats(site_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    site_exists BOOLEAN;
BEGIN
    -- Only allow admins to access this function
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Check if site exists
    SELECT EXISTS(SELECT 1 FROM public.sites WHERE id = site_uuid) INTO site_exists;
    IF NOT site_exists THEN
        RAISE EXCEPTION 'Site not found: %', site_uuid;
    END IF;
    
    -- Build comprehensive statistics
    SELECT json_build_object(
        'site_id', site_uuid,
        'total_content', (SELECT COUNT(*) FROM public.content WHERE site_id = site_uuid),
        'published_content', (SELECT COUNT(*) FROM public.content WHERE site_id = site_uuid AND is_published = true),
        'draft_content', (SELECT COUNT(*) FROM public.content WHERE site_id = site_uuid AND is_published = false),
        'featured_content', (SELECT COUNT(*) FROM public.content WHERE site_id = site_uuid AND is_featured = true),
        'total_products', (SELECT COUNT(*) FROM public.products WHERE site_id = site_uuid),
        'active_products', (SELECT COUNT(*) FROM public.products WHERE site_id = site_uuid AND is_active = true),
        'featured_products', (SELECT COUNT(*) FROM public.products WHERE site_id = site_uuid AND is_featured = true),
        'out_of_stock_products', (SELECT COUNT(*) FROM public.products WHERE site_id = site_uuid AND in_stock = false),
        'total_inquiries', (SELECT COUNT(*) FROM public.contact_inquiries WHERE site_id = site_uuid),
        'recent_inquiries', (SELECT COUNT(*) FROM public.contact_inquiries WHERE site_id = site_uuid AND created_at > NOW() - INTERVAL '30 days'),
        'unread_inquiries', (SELECT COUNT(*) FROM public.contact_inquiries WHERE site_id = site_uuid AND status = 'new'),
        'site_owners', (SELECT COUNT(*) FROM public.site_memberships WHERE site_id = site_uuid AND role = 'owner' AND is_active = true),
        'total_members', (SELECT COUNT(*) FROM public.site_memberships WHERE site_id = site_uuid AND is_active = true),
        'media_files', (SELECT COUNT(*) FROM public.media_files WHERE site_id = site_uuid),
        'import_batches', (SELECT COUNT(*) FROM public.import_batches WHERE site_id = site_uuid),
        'last_content_update', (SELECT MAX(updated_at) FROM public.content WHERE site_id = site_uuid),
        'last_product_update', (SELECT MAX(updated_at) FROM public.products WHERE site_id = site_uuid),
        'last_inquiry', (SELECT MAX(created_at) FROM public.contact_inquiries WHERE site_id = site_uuid),
        'generated_at', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Function to get all sites with basic stats for admin listing
CREATE OR REPLACE FUNCTION public.get_all_sites_with_stats(
    search_query TEXT DEFAULT NULL,
    status_filter TEXT DEFAULT NULL,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    base_query TEXT;
    where_conditions TEXT[];
BEGIN
    -- Only allow admins to access this function
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Build WHERE conditions
    where_conditions := ARRAY[]::TEXT[];
    
    -- Search query condition
    IF search_query IS NOT NULL AND LENGTH(trim(search_query)) > 0 THEN
        where_conditions := array_append(where_conditions, 
            format('(s.name ILIKE %L OR s.subdomain ILIKE %L OR s.custom_domain ILIKE %L OR s.business_name ILIKE %L)', 
                   '%' || search_query || '%', 
                   '%' || search_query || '%', 
                   '%' || search_query || '%', 
                   '%' || search_query || '%'));
    END IF;
    
    -- Status filter condition
    IF status_filter = 'active' THEN
        where_conditions := array_append(where_conditions, 's.is_active = true');
    ELSIF status_filter = 'inactive' THEN
        where_conditions := array_append(where_conditions, 's.is_active = false');
    ELSIF status_filter = 'published' THEN
        where_conditions := array_append(where_conditions, 's.is_published = true');
    ELSIF status_filter = 'draft' THEN
        where_conditions := array_append(where_conditions, 's.is_published = false');
    END IF;
    
    -- Build the query
    base_query := format('
        SELECT json_agg(
            json_build_object(
                ''id'', s.id,
                ''name'', s.name,
                ''subdomain'', s.subdomain,
                ''custom_domain'', s.custom_domain,
                ''business_name'', s.business_name,
                ''business_email'', s.business_email,
                ''is_active'', s.is_active,
                ''is_published'', s.is_published,
                ''created_at'', s.created_at,
                ''updated_at'', s.updated_at,
                ''last_activity_at'', s.last_activity_at,
                ''admin_notes'', s.admin_notes,
                ''owner_count'', COALESCE(sm.owner_count, 0),
                ''content_count'', COALESCE(c.content_count, 0),
                ''product_count'', COALESCE(p.product_count, 0),
                ''inquiry_count'', COALESCE(ci.inquiry_count, 0),
                ''recent_inquiries'', COALESCE(ci.recent_count, 0)
            ) ORDER BY s.created_at DESC
        ) as sites,
        COUNT(*) OVER() as total_count
        FROM public.sites s
        LEFT JOIN (
            SELECT site_id, COUNT(*) as owner_count
            FROM public.site_memberships 
            WHERE role = ''owner'' AND is_active = true
            GROUP BY site_id
        ) sm ON sm.site_id = s.id
        LEFT JOIN (
            SELECT site_id, COUNT(*) as content_count
            FROM public.content
            GROUP BY site_id
        ) c ON c.site_id = s.id
        LEFT JOIN (
            SELECT site_id, COUNT(*) as product_count
            FROM public.products
            GROUP BY site_id
        ) p ON p.site_id = s.id
        LEFT JOIN (
            SELECT site_id, 
                   COUNT(*) as inquiry_count,
                   COUNT(CASE WHEN created_at > NOW() - INTERVAL ''30 days'' THEN 1 END) as recent_count
            FROM public.contact_inquiries
            GROUP BY site_id
        ) ci ON ci.site_id = s.id
        %s
        ORDER BY s.created_at DESC
        LIMIT %s OFFSET %s',
        CASE 
            WHEN array_length(where_conditions, 1) > 0 
            THEN 'WHERE ' || array_to_string(where_conditions, ' AND ')
            ELSE ''
        END,
        limit_count,
        offset_count
    );
    
    -- Execute the query
    EXECUTE base_query INTO result;
    
    RETURN COALESCE(result, '{"sites": [], "total_count": 0}'::json);
END;
$$;

-- Function to update site status with admin logging
CREATE OR REPLACE FUNCTION public.admin_update_site_status(
    site_uuid UUID,
    new_is_active BOOLEAN DEFAULT NULL,
    new_is_published BOOLEAN DEFAULT NULL,
    notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    site_exists BOOLEAN;
    changes_count INTEGER;
BEGIN
    -- Only allow admins to access this function
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Check if site exists
    SELECT EXISTS(SELECT 1 FROM public.sites WHERE id = site_uuid) INTO site_exists;
    IF NOT site_exists THEN
        RAISE EXCEPTION 'Site not found: %', site_uuid;
    END IF;
    
    -- Update site with provided changes
    UPDATE public.sites 
    SET 
        is_active = COALESCE(new_is_active, is_active),
        is_published = COALESCE(new_is_published, is_published),
        admin_notes = COALESCE(notes, admin_notes),
        updated_at = NOW(),
        last_activity_at = NOW()
    WHERE id = site_uuid
    AND (
        is_active IS DISTINCT FROM COALESCE(new_is_active, is_active) OR
        is_published IS DISTINCT FROM COALESCE(new_is_published, is_published) OR
        admin_notes IS DISTINCT FROM COALESCE(notes, admin_notes)
    );
    
    -- Check if any changes were made
    GET DIAGNOSTICS changes_count = ROW_COUNT;
    
    RETURN changes_count > 0;
END;
$$;

-- =====================================================
-- 5. ROW LEVEL SECURITY FOR NEW TABLES
-- =====================================================

-- Enable RLS on site_metrics table
ALTER TABLE public.site_metrics ENABLE ROW LEVEL SECURITY;

-- Admin can access all site metrics
CREATE POLICY "Admins can manage site metrics"
ON public.site_metrics FOR ALL
USING (public.is_admin());

-- Site owners can view metrics for their sites
CREATE POLICY "Site owners can view site metrics"
ON public.site_metrics FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.site_memberships sm
        WHERE sm.site_id = site_metrics.site_id 
        AND sm.user_id = auth.uid() 
        AND sm.role = 'owner'
        AND sm.is_active = true
    )
);

-- =====================================================
-- 6. TRIGGER FOR UPDATING LAST_ACTIVITY_AT
-- =====================================================

-- Function to update last_activity_at when site-related content changes
CREATE OR REPLACE FUNCTION public.update_site_last_activity()
RETURNS TRIGGER AS $$
DECLARE
    target_site_id UUID;
BEGIN
    -- Get site_id from the modified record
    IF TG_TABLE_NAME = 'content' THEN
        target_site_id := COALESCE(NEW.site_id, OLD.site_id);
    ELSIF TG_TABLE_NAME = 'products' THEN
        target_site_id := COALESCE(NEW.site_id, OLD.site_id);
    ELSIF TG_TABLE_NAME = 'contact_inquiries' THEN
        target_site_id := COALESCE(NEW.site_id, OLD.site_id);
    END IF;
    
    -- Update the site's last_activity_at
    IF target_site_id IS NOT NULL THEN
        UPDATE public.sites 
        SET last_activity_at = NOW()
        WHERE id = target_site_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update last_activity_at
CREATE TRIGGER trigger_update_site_activity_content
    AFTER INSERT OR UPDATE OR DELETE ON public.content
    FOR EACH ROW EXECUTE FUNCTION public.update_site_last_activity();

CREATE TRIGGER trigger_update_site_activity_products
    AFTER INSERT OR UPDATE OR DELETE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_site_last_activity();

CREATE TRIGGER trigger_update_site_activity_inquiries
    AFTER INSERT OR UPDATE OR DELETE ON public.contact_inquiries
    FOR EACH ROW EXECUTE FUNCTION public.update_site_last_activity();

-- =====================================================
-- 7. COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION public.get_site_summary_stats(UUID) IS 'Get comprehensive statistics for a specific site - admin only';
COMMENT ON FUNCTION public.get_all_sites_with_stats(TEXT, TEXT, INTEGER, INTEGER) IS 'Get all sites with basic stats, search and filtering - admin only';
COMMENT ON FUNCTION public.admin_update_site_status(UUID, BOOLEAN, BOOLEAN, TEXT) IS 'Update site status and admin notes - admin only';
COMMENT ON FUNCTION public.update_site_last_activity() IS 'Trigger function to update site last_activity_at when content changes';

COMMENT ON TABLE public.site_metrics IS 'Daily metrics tracking for site performance and analytics';
COMMENT ON COLUMN public.sites.admin_notes IS 'Private admin notes about the site';
COMMENT ON COLUMN public.sites.last_activity_at IS 'Timestamp of last activity (content, product, or inquiry changes)';
COMMENT ON COLUMN public.sites.created_by IS 'Admin user who created this site (if created via admin panel)';

-- =====================================================
-- 8. INITIAL DATA SETUP
-- =====================================================

-- Initialize site metrics for existing sites with current counts
INSERT INTO public.site_metrics (site_id, metric_date, content_count, product_count, inquiry_count)
SELECT 
    s.id as site_id,
    CURRENT_DATE as metric_date,
    COALESCE(c.content_count, 0) as content_count,
    COALESCE(p.product_count, 0) as product_count,
    COALESCE(i.inquiry_count, 0) as inquiry_count
FROM public.sites s
LEFT JOIN (
    SELECT site_id, COUNT(*) as content_count
    FROM public.content
    GROUP BY site_id
) c ON c.site_id = s.id
LEFT JOIN (
    SELECT site_id, COUNT(*) as product_count
    FROM public.products
    GROUP BY site_id
) p ON p.site_id = s.id
LEFT JOIN (
    SELECT site_id, COUNT(*) as inquiry_count
    FROM public.contact_inquiries
    GROUP BY site_id
) i ON i.site_id = s.id
ON CONFLICT (site_id, metric_date) DO UPDATE SET
    content_count = EXCLUDED.content_count,
    product_count = EXCLUDED.product_count,
    inquiry_count = EXCLUDED.inquiry_count,
    updated_at = NOW();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- This migration successfully implements Milestone 1:
-- 1. Extended sites table with admin management fields
-- 2. Created site_metrics table for performance tracking
-- 3. Added optimized indexes for admin queries
-- 4. Implemented comprehensive site statistics functions
-- 5. Created admin-only functions with proper security
-- 6. Added automatic activity tracking with triggers
-- 7. Initialized historical metrics data

-- Next steps:
-- 1. Create admin sites service API layer
-- 2. Generate updated TypeScript types
-- 3. Implement React components for site management
-- 4. Test all admin functions and queries