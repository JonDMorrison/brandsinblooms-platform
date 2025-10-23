-- =====================================================
-- Migration: Fix Category Trigger Recursion
-- Description: Fixes stack overflow in ensure_single_primary_category trigger
-- Author: Claude
-- Date: 2025-10-22
-- =====================================================

-- Problem: The ensure_single_primary_category() trigger function causes
-- infinite recursion due to RLS policy evaluation during UPDATE statements.
-- When the function updates product_category_assignments, RLS policies are
-- evaluated, which can create circular references causing stack overflow.

-- Solution: Use SECURITY DEFINER to run the function with elevated privileges
-- that bypass RLS checks, preventing the circular evaluation.

-- Drop and recreate the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION ensure_single_primary_category()
RETURNS TRIGGER
SECURITY DEFINER  -- Run with definer's (postgres) privileges to bypass RLS
SET search_path = public, pg_temp  -- Security best practice: explicit search path
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only proceed if this is being set as primary
    IF NEW.is_primary = true THEN
        -- Remove primary flag from other assignments for this product
        -- This UPDATE will bypass RLS due to SECURITY DEFINER
        UPDATE product_category_assignments
        SET is_primary = false
        WHERE product_id = NEW.product_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND is_primary = true;

        -- Update product's primary category reference
        -- This UPDATE will also bypass RLS due to SECURITY DEFINER
        UPDATE products
        SET primary_category_id = NEW.category_id
        WHERE id = NEW.product_id;
    END IF;

    RETURN NEW;
END;
$$;

-- Add comment explaining the SECURITY DEFINER usage
COMMENT ON FUNCTION ensure_single_primary_category() IS
'Ensures only one category assignment per product is marked as primary.
Uses SECURITY DEFINER to bypass RLS and prevent infinite recursion during policy evaluation.';

-- Verify the trigger still exists (it should, but let's be explicit)
-- The trigger was created in 20250820000000_add_dynamic_product_categories.sql
-- We're not recreating it, just fixing the function it calls

-- Grant execute permissions (redundant but safe)
GRANT EXECUTE ON FUNCTION ensure_single_primary_category() TO authenticated, service_role;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
