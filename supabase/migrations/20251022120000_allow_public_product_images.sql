-- =====================================================
-- Fix Product Images RLS for Public Access
-- =====================================================
--
-- Problem: Current SELECT policy blocks logged-out users from viewing
-- product images because auth.uid() returns NULL for anonymous users.
-- This prevents product images from displaying on customer sites.
--
-- Solution: Allow public read access to product images for active products,
-- while maintaining write protection (INSERT/UPDATE/DELETE still require
-- site membership).
--
-- Migration created: 2025-10-22
-- =====================================================

-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view product images" ON public.product_images;

-- Create new public-readable SELECT policy
-- Allows anyone (including logged-out users) to view product images
-- for active products, while write operations still require authentication
CREATE POLICY "Public can view active product images"
ON public.product_images FOR SELECT
USING (
    -- Allow access to images for active products
    -- This enables customer sites to display product images
    EXISTS (
        SELECT 1 FROM public.products
        WHERE products.id = product_images.product_id
        AND products.is_active = true
    )
    OR
    -- Site members can view all product images (active or inactive)
    -- This allows site owners to preview inactive products in dashboard
    site_id IN (
        SELECT site_id FROM public.site_memberships
        WHERE user_id = auth.uid()
        AND is_active = true
    )
);

-- Add comment for clarity
COMMENT ON POLICY "Public can view active product images" ON public.product_images IS
'Allows public read access to product images for active products. Site members can view all images. Write operations still require site membership.';
