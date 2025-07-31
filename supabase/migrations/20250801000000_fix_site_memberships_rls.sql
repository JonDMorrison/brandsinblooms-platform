-- Fix infinite recursion in site_memberships RLS policies
-- This migration replaces the basic authenticated policy with more specific policies

-- Drop existing policy that's causing infinite recursion
DROP POLICY IF EXISTS "authenticated_site_memberships" ON public.site_memberships;

-- Create specific RLS policies for site_memberships

-- 1. Users can view their own memberships
CREATE POLICY "users_view_own_memberships" ON public.site_memberships
    FOR SELECT
    USING (auth.uid() = user_id);

-- 2. Users can view memberships for sites they belong to
CREATE POLICY "users_view_site_memberships" ON public.site_memberships
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.site_memberships sm2
            WHERE sm2.site_id = site_memberships.site_id
            AND sm2.user_id = auth.uid()
            AND sm2.is_active = true
        )
    );

-- 3. Site owners can manage memberships for their sites
CREATE POLICY "owners_manage_site_memberships" ON public.site_memberships
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.site_memberships sm2
            WHERE sm2.site_id = site_memberships.site_id
            AND sm2.user_id = auth.uid()
            AND sm2.role = 'owner'
            AND sm2.is_active = true
        )
    );

-- 4. Admins can do everything
CREATE POLICY "admins_all_access_memberships" ON public.site_memberships
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- 5. Service role bypass
CREATE POLICY "service_role_bypass_memberships" ON public.site_memberships
    FOR ALL
    USING (auth.role() = 'service_role');