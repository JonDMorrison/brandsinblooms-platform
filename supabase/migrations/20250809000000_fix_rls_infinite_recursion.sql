-- Fix infinite recursion in RLS policies
-- The core issue: site_memberships policies cannot reference site_memberships table
-- Solution: Use simpler, direct checks without self-references

-- First, drop all problematic policies
DROP POLICY IF EXISTS "users_view_site_memberships" ON public.site_memberships;
DROP POLICY IF EXISTS "owners_manage_site_memberships" ON public.site_memberships;
DROP POLICY IF EXISTS "Site owners can manage site memberships" ON public.site_memberships;

-- Create non-recursive policies for site_memberships

-- 1. Users can view their own membership records
CREATE POLICY "users_view_own_memberships_simple" ON public.site_memberships
    FOR SELECT
    USING (auth.uid() = user_id);

-- 2. Users can insert their own membership records (for invitations, etc.)
CREATE POLICY "users_insert_own_memberships" ON public.site_memberships
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 3. Users with owner role can manage all memberships for their sites
-- We'll handle this at the application level with proper checks
-- For now, users can only update/delete their own records
CREATE POLICY "users_update_own_memberships" ON public.site_memberships
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_memberships" ON public.site_memberships
    FOR DELETE
    USING (auth.uid() = user_id);

-- 4. Admins can do everything (using profiles table to avoid recursion)
CREATE POLICY "admins_all_access_memberships_fixed" ON public.site_memberships
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Fix site_metrics policy to avoid site_memberships recursion
DROP POLICY IF EXISTS "site_members_manage_metrics" ON public.site_metrics;

-- Simplified policy: users can only manage metrics if they're admins
-- Site ownership will be checked at application level
CREATE POLICY "site_metrics_access" ON public.site_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'site_owner')
        )
    );

-- Fix activity_logs policy  
DROP POLICY IF EXISTS "site_members_view_activity" ON public.activity_logs;

CREATE POLICY "activity_logs_access" ON public.activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'site_owner')
        )
    );

-- Fix site_performance_metrics if it exists
DROP POLICY IF EXISTS "site_members_manage_performance_metrics" ON public.site_performance_metrics;

CREATE POLICY "performance_metrics_access" ON public.site_performance_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'site_owner')
        )
    );

-- Ensure service role can always bypass
DROP POLICY IF EXISTS "service_role_bypass_metrics" ON public.site_metrics;
CREATE POLICY "service_role_bypass_metrics" ON public.site_metrics
    FOR ALL
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_bypass_activity" ON public.activity_logs;
CREATE POLICY "service_role_bypass_activity" ON public.activity_logs
    FOR ALL
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_bypass_performance" ON public.site_performance_metrics;
CREATE POLICY "service_role_bypass_performance" ON public.site_performance_metrics
    FOR ALL
    USING (auth.role() = 'service_role');

-- Add a helper function to check site membership without recursion
-- This can be used in application code
CREATE OR REPLACE FUNCTION public.user_has_site_access(p_site_id UUID, p_role TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_access BOOLEAN;
BEGIN
    -- Check if user is admin
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    ) INTO v_has_access;
    
    IF v_has_access THEN
        RETURN TRUE;
    END IF;
    
    -- Check site membership
    IF p_role IS NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.site_memberships
            WHERE site_id = p_site_id
            AND user_id = auth.uid()
            AND is_active = true
        ) INTO v_has_access;
    ELSE
        SELECT EXISTS (
            SELECT 1 FROM public.site_memberships
            WHERE site_id = p_site_id
            AND user_id = auth.uid()
            AND role = p_role
            AND is_active = true
        ) INTO v_has_access;
    END IF;
    
    RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;