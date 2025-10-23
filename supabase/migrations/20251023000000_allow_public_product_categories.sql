-- =====================================================
-- Fix Product Categories RLS for Public Access
-- =====================================================
--
-- Problem: Current SELECT policy blocks logged-out users from viewing
-- product categories because auth.uid() returns NULL for anonymous users.
-- This prevents categories from displaying on customer sites.
--
-- Solution: Allow public read access to active product categories,
-- while maintaining write protection (INSERT/UPDATE/DELETE still require
-- site membership).
--
-- Migration created: 2025-10-23
-- =====================================================

-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view their site categories" ON public.product_categories;

-- Create new public-readable SELECT policy
-- Allows anyone (including logged-out users) to view active product categories
-- for customer sites, while write operations still require authentication
CREATE POLICY "Public can view active product categories"
ON public.product_categories FOR SELECT
USING (
    -- Allow access to active categories
    -- This enables customer sites to display category navigation
    is_active = true
    OR
    -- Site members can view all categories (active or inactive)
    -- This allows site owners to preview inactive categories in dashboard
    site_id IN (
        SELECT site_id FROM public.site_memberships
        WHERE user_id = auth.uid()
        AND is_active = true
    )
);

-- Add comment for clarity
COMMENT ON POLICY "Public can view active product categories" ON public.product_categories IS
'Allows public read access to active product categories. Site members can view all categories. Write operations still require site membership.';

-- =====================================================
-- Fix Product Category Assignments RLS for Public Access
-- =====================================================
--
-- Product category assignments also need public read access so that
-- customer sites can display which products belong to which categories.
--

-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view their product assignments" ON public.product_category_assignments;

-- Create new public-readable SELECT policy
-- Allows anyone to view category assignments for active products
CREATE POLICY "Public can view active product category assignments"
ON public.product_category_assignments FOR SELECT
USING (
    -- Allow access to assignments for active products in active categories
    EXISTS (
        SELECT 1 FROM public.products p
        JOIN public.product_categories pc ON pc.id = product_category_assignments.category_id
        WHERE p.id = product_category_assignments.product_id
        AND p.is_active = true
        AND pc.is_active = true
    )
    OR
    -- Site members can view all assignments
    EXISTS (
        SELECT 1 FROM public.products p
        JOIN public.site_memberships sm ON sm.site_id = p.site_id
        WHERE p.id = product_category_assignments.product_id
        AND sm.user_id = auth.uid()
        AND sm.is_active = true
    )
);

-- Add comment for clarity
COMMENT ON POLICY "Public can view active product category assignments" ON public.product_category_assignments IS
'Allows public read access to category assignments for active products and categories. Site members can view all assignments. Write operations still require site membership.';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
