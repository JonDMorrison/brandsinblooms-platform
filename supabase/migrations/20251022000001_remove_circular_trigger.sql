-- =====================================================
-- Migration: Remove Circular Trigger Dependency
-- Description: Removes sync_primary_category_assignment trigger that causes infinite recursion
-- Author: Claude
-- Date: 2025-10-22
-- =====================================================

-- Problem: Two triggers create a circular dependency causing stack overflow:
--
-- 1. sync_primary_category_assignment_trigger (on products table)
--    Fires on: INSERT OR UPDATE OF primary_category_id
--    Action: INSERT/UPDATE product_category_assignments
--
-- 2. manage_primary_category (on product_category_assignments table)
--    Fires on: INSERT OR UPDATE OF is_primary
--    Action: UPDATE products.primary_category_id
--
-- Flow creates infinite loop:
--   INSERT product → trigger 1 fires → INSERT assignment → trigger 2 fires
--   → UPDATE product → trigger 1 fires → UPDATE assignment → trigger 2 fires
--   → UPDATE product → ... STACK OVERFLOW
--
-- Solution: Remove sync_primary_category_assignment_trigger (redundant)
-- The manage_primary_category trigger is sufficient to maintain consistency.
-- The application layer already handles both the product and assignment creation.

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS sync_primary_category_assignment_trigger ON products;

-- Drop the function (no longer needed)
DROP FUNCTION IF EXISTS sync_primary_category_assignment();

-- Add comment explaining why this trigger was removed
COMMENT ON TABLE products IS
'Product catalog with multi-tenant support.
IMPORTANT: Do NOT add sync_primary_category_assignment trigger - it creates circular
dependency with manage_primary_category trigger on product_category_assignments table.
The application layer handles both product and assignment creation.';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify the trigger is gone
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'sync_primary_category_assignment_trigger'
  ) THEN
    RAISE EXCEPTION 'sync_primary_category_assignment_trigger still exists!';
  END IF;

  RAISE NOTICE 'SUCCESS: Circular trigger removed successfully';
END $$;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
