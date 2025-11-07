-- Migration: Fix Order Items Count
-- Description: Backfill items_count column to ensure it reflects the actual sum of quantities from order_items
-- Created: 2025-11-06

-- =============================================
-- BACKFILL ITEMS_COUNT FOR EXISTING ORDERS
-- =============================================

-- Update all orders to have the correct items_count based on the sum of quantities
-- This ensures historical data is accurate and matches what the trigger maintains going forward
UPDATE orders
SET items_count = (
    SELECT COALESCE(SUM(quantity), 0)
    FROM order_items
    WHERE order_id = orders.id
)
WHERE items_count != (
    SELECT COALESCE(SUM(quantity), 0)
    FROM order_items
    WHERE order_id = orders.id
);

-- Add a comment for documentation
COMMENT ON COLUMN orders.items_count IS 'Total quantity of items in this order (sum of all order_items quantities). Maintained automatically by update_order_items_count trigger.';
