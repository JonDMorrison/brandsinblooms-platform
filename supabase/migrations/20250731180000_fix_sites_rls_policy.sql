-- Fix Sites RLS Policy Migration
-- Allows anonymous users to read active sites for domain resolution

-- =====================================================
-- SITES TABLE RLS POLICY FIX
-- =====================================================

-- The current policy only allows authenticated users to access sites,
-- but site resolution needs to work for anonymous users accessing
-- the domain for the first time (before any authentication)

-- Drop the overly restrictive authenticated-only policy
DROP POLICY IF EXISTS "authenticated_sites" ON public.sites;

-- Create a public read policy for active sites
-- This allows anonymous users to resolve domains to sites
CREATE POLICY "public_read_active_sites" ON public.sites
    FOR SELECT 
    USING (is_active = true AND is_published = true);

-- Create an authenticated write policy for site management
-- This allows authenticated users to manage their sites
CREATE POLICY "authenticated_manage_sites" ON public.sites
    FOR ALL 
    USING (auth.role() = 'authenticated');

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON POLICY "public_read_active_sites" ON public.sites IS 
'Allows anonymous users to read active and published sites for domain resolution and public access';

COMMENT ON POLICY "authenticated_manage_sites" ON public.sites IS 
'Allows authenticated users to create, read, update, and delete sites';

-- =====================================================
-- MIGRATION NOTES
-- =====================================================

-- This migration fixes the 406 Not Acceptable error that occurs when
-- anonymous users try to access a site. The middleware needs to resolve
-- domains to sites before any authentication takes place.
--
-- Security considerations:
-- - Only active and published sites are visible to anonymous users
-- - Full site management still requires authentication
-- - Site content and products have their own separate RLS policies

-- Log the policy update
DO $$
BEGIN
    RAISE NOTICE 'Sites RLS policy updated successfully';
    RAISE NOTICE 'Anonymous users can now read active, published sites';
    RAISE NOTICE 'Site management still requires authentication';
END $$;