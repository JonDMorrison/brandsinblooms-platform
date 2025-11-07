-- Migration: Add decrement_product_inventory function for webhook usage
-- Created: 2025-11-07
-- Description: Creates a convenience function for decrementing product inventory
--              Called by Stripe webhook when orders are paid

-- =====================================================
-- CREATE DECREMENT INVENTORY FUNCTION
-- =====================================================

/**
 * Decrement product inventory by a specific quantity
 * This is a convenience wrapper around update_product_inventory
 * Used by the Stripe webhook handler when orders are successfully paid
 *
 * @param p_product_id - UUID of the product
 * @param p_quantity - Positive integer quantity to decrement
 * @returns Updated product record
 */
CREATE OR REPLACE FUNCTION public.decrement_product_inventory(
    p_product_id UUID,
    p_quantity INTEGER
)
RETURNS public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_product public.products;
BEGIN
    -- Validate quantity is positive
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be positive, got: %', p_quantity;
    END IF;

    -- Use the existing update_product_inventory function with negative change
    -- This ensures consistent inventory management logic
    SELECT * INTO v_product
    FROM public.update_product_inventory(p_product_id, -p_quantity);

    RETURN v_product;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the entire webhook processing
        RAISE WARNING 'Failed to decrement inventory for product %: %', p_product_id, SQLERRM;
        RAISE;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.decrement_product_inventory(UUID, INTEGER) IS
'Decrements product inventory by specified quantity. Called by Stripe webhook on successful payment.';

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION public.decrement_product_inventory(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_product_inventory(UUID, INTEGER) TO service_role;
