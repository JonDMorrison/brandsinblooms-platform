-- Fix 400 and 406 errors for notifications and site_performance_metrics tables
-- This migration addresses:
-- 1. Missing foreign key relationship between notifications and profiles
-- 2. Overly restrictive RLS policies on site_performance_metrics

-- =====================================================
-- 1. FIX NOTIFICATIONS FOREIGN KEY RELATIONSHIP
-- =====================================================

-- Add foreign key constraint from notifications.user_id to profiles.user_id
-- This enables the Supabase foreign key join syntax user:profiles!user_id(...)
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- First ensure the profiles table has all users from notifications
INSERT INTO public.profiles (user_id, created_at, updated_at)
SELECT DISTINCT n.user_id, NOW(), NOW()
FROM public.notifications n
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = n.user_id
)
ON CONFLICT (user_id) DO NOTHING;

-- Now add the foreign key to profiles instead of auth.users
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

-- =====================================================
-- 2. FIX SITE_PERFORMANCE_METRICS RLS POLICIES
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Site owners can view their metrics" ON public.site_performance_metrics;
DROP POLICY IF EXISTS "Admins can view all performance metrics" ON public.site_performance_metrics;
DROP POLICY IF EXISTS "System can insert performance metrics" ON public.site_performance_metrics;

-- Create more permissive read policy for site_performance_metrics
-- Allow any authenticated user who is a member of the site to read metrics
CREATE POLICY "site_members_view_metrics" ON public.site_performance_metrics
    FOR SELECT
    USING (
        -- User has membership to the site
        EXISTS (
            SELECT 1 FROM public.site_memberships sm
            WHERE sm.site_id = site_performance_metrics.site_id
            AND sm.user_id = auth.uid()
            AND sm.is_active = true
        )
        OR
        -- User is admin
        public.is_admin()
    );

-- Allow system to insert metrics (for background jobs)
CREATE POLICY "system_insert_metrics" ON public.site_performance_metrics
    FOR INSERT
    WITH CHECK (true);

-- Allow system to update metrics
CREATE POLICY "system_update_metrics" ON public.site_performance_metrics
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- 3. FIX NOTIFICATION CATEGORIES
-- =====================================================

-- The categories in the check constraint don't match what the app is using
-- Let's update the constraint to be more flexible
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_category_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_category_check 
CHECK (category IN (
    'order', 'orders',  -- Support both singular and plural
    'product', 'products',
    'system',
    'marketing',
    'security',
    'messages',  -- Add missing category
    'payments',  -- Add missing category
    'content'    -- Add missing category
));

-- =====================================================
-- 4. ENSURE DEFAULT DATA EXISTS
-- =====================================================

-- Make sure the default site has at least one performance metric entry
-- This prevents 406 errors when querying empty tables
INSERT INTO public.site_performance_metrics (
    site_id,
    recorded_at,
    unique_visitors,
    page_views,
    sessions,
    bounce_rate,
    avg_session_duration_seconds,
    avg_page_load_time_ms,
    period_type,
    period_start,
    period_end
) 
SELECT 
    '00000000-0000-0000-0000-000000000001'::uuid,
    NOW(),
    0,
    0,
    0,
    0.0,
    0,
    0,
    'daily',
    DATE_TRUNC('day', NOW()),
    DATE_TRUNC('day', NOW()) + INTERVAL '1 day'
WHERE NOT EXISTS (
    SELECT 1 FROM public.site_performance_metrics
    WHERE site_id = '00000000-0000-0000-0000-000000000001'::uuid
);

-- =====================================================
-- 5. GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Ensure authenticated users have proper permissions
GRANT SELECT ON public.site_performance_metrics TO authenticated;
GRANT SELECT ON public.notifications TO authenticated;

-- =====================================================
-- 6. CREATE HELPER VIEW FOR NOTIFICATIONS WITH USER INFO
-- =====================================================

-- Create a view that properly joins notifications with profiles
-- This avoids the foreign key join issue in queries
CREATE OR REPLACE VIEW public.notifications_with_user AS
SELECT 
    n.*,
    p.user_id as profile_user_id,
    p.full_name,
    p.email,
    p.avatar_url
FROM public.notifications n
LEFT JOIN public.profiles p ON n.user_id = p.user_id;

-- Grant access to the view
GRANT SELECT ON public.notifications_with_user TO authenticated;

-- Add RLS to the view (inherited from base tables)
ALTER VIEW public.notifications_with_user SET (security_invoker = true);

-- =====================================================
-- 7. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON VIEW public.notifications_with_user IS 'Notifications joined with user profile information';
COMMENT ON CONSTRAINT notifications_user_id_fkey ON public.notifications IS 'Foreign key to profiles table for proper join support';