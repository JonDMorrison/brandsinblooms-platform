-- Migration: Enhance Orders Module for Complete Functionality
-- Description: Upgrade existing orders tables with additional fields and features

-- =============================================
-- 1. ENHANCE ORDERS TABLE
-- =============================================

-- Add missing columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS internal_notes TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

-- Update status constraint to include more statuses
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS check_order_status;
ALTER TABLE public.orders ADD CONSTRAINT check_order_status CHECK (
    status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')
);

-- Add payment status constraint
ALTER TABLE public.orders ADD CONSTRAINT check_payment_status CHECK (
    payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partial')
);

-- Update the total_amount calculation trigger
CREATE OR REPLACE FUNCTION calculate_order_total()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate total if subtotal exists
    IF NEW.subtotal IS NOT NULL THEN
        NEW.total_amount = NEW.subtotal + 
                          COALESCE(NEW.tax_amount, 0) + 
                          COALESCE(NEW.shipping_amount, 0) - 
                          COALESCE(NEW.discount_amount, 0);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for automatic total calculation
DROP TRIGGER IF EXISTS calculate_order_total_trigger ON orders;
CREATE TRIGGER calculate_order_total_trigger
    BEFORE INSERT OR UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION calculate_order_total();

-- =============================================
-- 2. ENHANCE ORDER ITEMS TABLE
-- =============================================

-- Add missing columns to order_items table
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS variant_info JSONB,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add constraint for positive quantities
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS check_positive_quantity;
ALTER TABLE public.order_items ADD CONSTRAINT check_positive_quantity CHECK (quantity > 0);

-- =============================================
-- 3. CREATE ORDER STATUS HISTORY TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status VARCHAR(20),
    to_status VARCHAR(20) NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for efficient history queries
CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id, created_at DESC);

-- =============================================
-- 4. CREATE ORDER PAYMENTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.order_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    transaction_id VARCHAR(255),
    provider_response JSONB,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT check_payment_status CHECK (
        status IN ('pending', 'processing', 'completed', 'failed', 'refunded')
    )
);

-- Index for payment lookups
CREATE INDEX IF NOT EXISTS idx_order_payments_order ON order_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_transaction ON order_payments(transaction_id) WHERE transaction_id IS NOT NULL;

-- =============================================
-- 5. CREATE ORDER SHIPMENTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.order_shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    carrier VARCHAR(100),
    tracking_number VARCHAR(255),
    tracking_url TEXT,
    status VARCHAR(50) DEFAULT 'preparing',
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for shipment tracking
CREATE INDEX IF NOT EXISTS idx_order_shipments_order ON order_shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_shipments_tracking ON order_shipments(tracking_number) WHERE tracking_number IS NOT NULL;

-- =============================================
-- 6. ENHANCED TRIGGERS AND FUNCTIONS
-- =============================================

-- Function to log order status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO order_status_history (order_id, from_status, to_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
        
        -- Update status-specific timestamps
        CASE NEW.status
            WHEN 'completed' THEN
                NEW.completed_at = NOW();
            WHEN 'delivered' THEN
                NEW.delivered_at = NOW();
                NEW.completed_at = COALESCE(NEW.completed_at, NOW());
            WHEN 'cancelled' THEN
                NEW.cancelled_at = NOW();
            WHEN 'refunded' THEN
                NEW.refunded_at = NOW();
                NEW.cancelled_at = COALESCE(NEW.cancelled_at, NOW());
            WHEN 'shipped' THEN
                NEW.shipped_at = NOW();
            ELSE
                -- No specific timestamp update
        END CASE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply status change logging
DROP TRIGGER IF EXISTS log_order_status_change_trigger ON orders;
CREATE TRIGGER log_order_status_change_trigger
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION log_order_status_change();

-- Function to update order items count
CREATE OR REPLACE FUNCTION update_order_items_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE orders 
        SET items_count = (
            SELECT COALESCE(SUM(quantity), 0) 
            FROM order_items 
            WHERE order_id = NEW.order_id
        )
        WHERE id = NEW.order_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE orders 
        SET items_count = (
            SELECT COALESCE(SUM(quantity), 0) 
            FROM order_items 
            WHERE order_id = OLD.order_id
        )
        WHERE id = OLD.order_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply items count update trigger
DROP TRIGGER IF EXISTS update_order_items_count_trigger ON order_items;
CREATE TRIGGER update_order_items_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_order_items_count();

-- =============================================
-- 7. CREATE USEFUL VIEWS
-- =============================================

-- Orders with full details view
CREATE OR REPLACE VIEW public.orders_with_details AS
SELECT 
    o.*,
    p.full_name as customer_full_name,
    p.avatar_url as customer_avatar_url,
    u.email as customer_email_verified,
    COUNT(DISTINCT oi.id) as unique_items_count,
    COALESCE(SUM(oi.quantity), 0) as total_items,
    s.name as site_name,
    COALESCE(s.custom_domain, s.subdomain || '.brandsinblooms.com') as site_domain,
    (
        SELECT COUNT(*) 
        FROM order_status_history 
        WHERE order_id = o.id
    ) as status_changes_count,
    (
        SELECT to_status 
        FROM order_status_history 
        WHERE order_id = o.id 
        ORDER BY created_at DESC 
        LIMIT 1
    ) as latest_status,
    CASE 
        WHEN o.payment_status = 'paid' AND o.status IN ('delivered', 'completed') THEN 'completed'
        WHEN o.status = 'cancelled' OR o.status = 'refunded' THEN 'cancelled'
        WHEN o.payment_status = 'failed' THEN 'payment_failed'
        WHEN o.status = 'shipped' THEN 'in_transit'
        WHEN o.status = 'processing' THEN 'processing'
        ELSE 'pending'
    END as order_state
FROM orders o
LEFT JOIN profiles p ON o.customer_id = p.user_id
LEFT JOIN auth.users u ON o.customer_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN sites s ON o.site_id = s.id
GROUP BY o.id, p.full_name, p.avatar_url, u.email, s.name, s.subdomain, s.custom_domain;

-- Order statistics by site
CREATE OR REPLACE VIEW public.order_stats_by_site AS
SELECT 
    site_id,
    COUNT(*) as total_orders,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
    COUNT(*) FILTER (WHERE status = 'processing') as processing_orders,
    COUNT(*) FILTER (WHERE status = 'shipped') as shipped_orders,
    COUNT(*) FILTER (WHERE status = 'delivered') as delivered_orders,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
    COUNT(*) FILTER (WHERE status = 'refunded') as refunded_orders,
    COUNT(*) FILTER (WHERE payment_status = 'paid') as paid_orders,
    COUNT(*) FILTER (WHERE payment_status = 'pending') as unpaid_orders,
    SUM(total_amount) as total_revenue,
    SUM(total_amount) FILTER (WHERE payment_status = 'paid') as paid_revenue,
    AVG(total_amount) as average_order_value,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as orders_last_24h,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as orders_last_7d,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as orders_last_30d,
    MAX(created_at) as last_order_date
FROM orders
GROUP BY site_id;

-- =============================================
-- 8. UPDATE RLS POLICIES
-- =============================================

-- Enable RLS on new tables
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_shipments ENABLE ROW LEVEL SECURITY;

-- Policies for order_status_history
CREATE POLICY "site_members_view_order_history" ON order_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders o
            JOIN site_memberships sm ON sm.site_id = o.site_id
            WHERE o.id = order_status_history.order_id
            AND sm.user_id = auth.uid()
        )
    );

CREATE POLICY "site_members_insert_order_history" ON order_status_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders o
            JOIN site_memberships sm ON sm.site_id = o.site_id
            WHERE o.id = order_status_history.order_id
            AND sm.user_id = auth.uid()
            AND sm.role IN ('owner', 'editor')
        )
    );

-- Policies for order_payments
CREATE POLICY "site_members_manage_order_payments" ON order_payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM orders o
            JOIN site_memberships sm ON sm.site_id = o.site_id
            WHERE o.id = order_payments.order_id
            AND sm.user_id = auth.uid()
            AND sm.role IN ('owner', 'editor')
        )
    );

-- Policies for order_shipments
CREATE POLICY "site_members_manage_order_shipments" ON order_shipments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM orders o
            JOIN site_memberships sm ON sm.site_id = o.site_id
            WHERE o.id = order_shipments.order_id
            AND sm.user_id = auth.uid()
            AND sm.role IN ('owner', 'editor')
        )
    );

-- =============================================
-- 9. CREATE HELPER FUNCTIONS
-- =============================================

-- Function to get order summary statistics
CREATE OR REPLACE FUNCTION get_order_summary_stats(p_site_id UUID, p_date_range INTERVAL DEFAULT INTERVAL '30 days')
RETURNS TABLE (
    total_orders BIGINT,
    total_revenue DECIMAL,
    average_order_value DECIMAL,
    conversion_rate DECIMAL,
    pending_orders BIGINT,
    processing_orders BIGINT,
    shipped_orders BIGINT,
    delivered_orders BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_orders,
        COALESCE(SUM(total_amount), 0)::DECIMAL as total_revenue,
        COALESCE(AVG(total_amount), 0)::DECIMAL as average_order_value,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (COUNT(*) FILTER (WHERE payment_status = 'paid')::DECIMAL / COUNT(*)::DECIMAL * 100)
            ELSE 0
        END as conversion_rate,
        COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_orders,
        COUNT(*) FILTER (WHERE status = 'processing')::BIGINT as processing_orders,
        COUNT(*) FILTER (WHERE status = 'shipped')::BIGINT as shipped_orders,
        COUNT(*) FILTER (WHERE status = 'delivered')::BIGINT as delivered_orders
    FROM orders
    WHERE site_id = p_site_id
    AND created_at >= NOW() - p_date_range;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to search orders
CREATE OR REPLACE FUNCTION search_orders(
    p_site_id UUID,
    p_search_term TEXT DEFAULT NULL,
    p_status VARCHAR DEFAULT NULL,
    p_payment_status VARCHAR DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    order_number VARCHAR,
    customer_name VARCHAR,
    customer_email VARCHAR,
    status VARCHAR,
    payment_status VARCHAR,
    total_amount DECIMAL,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.order_number,
        o.customer_name,
        o.customer_email,
        o.status,
        o.payment_status,
        o.total_amount,
        o.created_at
    FROM orders o
    WHERE o.site_id = p_site_id
    AND (p_search_term IS NULL OR (
        o.order_number ILIKE '%' || p_search_term || '%' OR
        o.customer_name ILIKE '%' || p_search_term || '%' OR
        o.customer_email ILIKE '%' || p_search_term || '%'
    ))
    AND (p_status IS NULL OR o.status = p_status)
    AND (p_payment_status IS NULL OR o.payment_status = p_payment_status)
    ORDER BY o.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================
-- 10. GRANTS AND PERMISSIONS
-- =============================================

-- Grant permissions on new tables and views
GRANT ALL ON order_status_history TO authenticated;
GRANT ALL ON order_payments TO authenticated;
GRANT ALL ON order_shipments TO authenticated;
GRANT SELECT ON orders_with_details TO authenticated;
GRANT SELECT ON order_stats_by_site TO authenticated;

-- =============================================
-- 11. COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE order_status_history IS 'Audit trail for order status changes';
COMMENT ON TABLE order_payments IS 'Payment transactions associated with orders';
COMMENT ON TABLE order_shipments IS 'Shipment tracking information for orders';
COMMENT ON VIEW orders_with_details IS 'Comprehensive order view with customer and item details';
COMMENT ON VIEW order_stats_by_site IS 'Aggregated order statistics by site';
COMMENT ON FUNCTION get_order_summary_stats IS 'Get summary statistics for orders within a date range';
COMMENT ON FUNCTION search_orders IS 'Search and filter orders with pagination';