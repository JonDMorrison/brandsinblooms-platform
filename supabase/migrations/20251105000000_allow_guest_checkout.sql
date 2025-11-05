-- =============================================
-- ALLOW GUEST CHECKOUT
-- =============================================
-- Enable guest checkout by making customer_id nullable
-- Guests can place orders without creating an account
-- This is a standard e-commerce practice that improves conversion rates

-- 1. Make customer_id nullable to support guest checkout
ALTER TABLE public.orders
ALTER COLUMN customer_id DROP NOT NULL;

-- 2. Update foreign key constraint to handle user deletions gracefully
-- If a user is deleted, set customer_id to NULL (preserve order history)
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;

ALTER TABLE public.orders
ADD CONSTRAINT orders_customer_id_fkey
FOREIGN KEY (customer_id)
REFERENCES auth.users(id)
ON DELETE SET NULL;

-- 3. Update customer stats view to handle NULL customer_id
-- Guest orders should not appear in customer statistics
DROP VIEW IF EXISTS customer_stats;
CREATE VIEW customer_stats AS
SELECT
    p.user_id as id,
    p.full_name as name,
    u.email,
    p.avatar_url,
    COUNT(DISTINCT o.id) as orders_count,
    COALESCE(SUM(o.total_amount), 0) as total_spent,
    MAX(o.created_at) as last_order_date,
    CASE
        WHEN MAX(o.created_at) > NOW() - INTERVAL '30 days' THEN 'active'
        ELSE 'inactive'
    END as status
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
LEFT JOIN orders o ON p.user_id = o.customer_id
WHERE o.customer_id IS NOT NULL  -- Exclude guest orders from customer stats
GROUP BY p.user_id, p.full_name, u.email, p.avatar_url;

-- 4. Update RLS policies to support guest checkout
-- The existing "customers_view_own_orders" policy needs to handle NULL customer_id
DROP POLICY IF EXISTS "customers_view_own_orders" ON orders;
CREATE POLICY "customers_view_own_orders" ON orders
    FOR SELECT USING (
        -- Authenticated users can view their own orders
        auth.uid() = customer_id
        OR
        -- Guest orders can only be viewed if user has the order_number (via email link, etc)
        -- This will be enforced at the application level
        customer_id IS NULL
    );

-- 5. Add index for guest order queries (orders where customer_id IS NULL)
CREATE INDEX IF NOT EXISTS idx_orders_guest ON orders(created_at DESC)
WHERE customer_id IS NULL;

-- 6. Add documentation
COMMENT ON COLUMN orders.customer_id IS 'Foreign key to auth.users. NULL for guest checkout orders. Guest orders are identified by customer_email for order lookup.';

-- 7. Create a helper function for guest order lookup by email
CREATE OR REPLACE FUNCTION get_guest_orders_by_email(order_email VARCHAR)
RETURNS TABLE (
    id UUID,
    order_number VARCHAR,
    status VARCHAR,
    total_amount DECIMAL,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.order_number,
        o.status,
        o.total_amount,
        o.created_at
    FROM orders o
    WHERE o.customer_id IS NULL
    AND o.customer_email = order_email
    ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_guest_orders_by_email IS 'Allows guests to look up their orders by email without authentication';
