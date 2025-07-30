-- Migration: Add Orders, Activity Logs, and Site Metrics for Mock Data Replacement
-- Description: Complete database setup for replacing mock data with real Supabase integration

-- =============================================
-- 1. ORDERS MANAGEMENT SYSTEM
-- =============================================

-- Orders table with optimized indexing
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES auth.users(id),
    order_number VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'processing',
    total_amount DECIMAL(10, 2) NOT NULL,
    items_count INTEGER NOT NULL DEFAULT 0,
    
    -- Denormalized for performance
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    
    -- Metadata
    notes TEXT,
    shipping_address JSONB,
    billing_address JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT check_order_status CHECK (
        status IN ('processing', 'shipped', 'delivered', 'cancelled')
    ),
    UNIQUE(site_id, order_number)
);

-- Order items for future expansion
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Performance indexes
CREATE INDEX idx_orders_site_created ON orders(site_id, created_at DESC);
CREATE INDEX idx_orders_customer ON orders(customer_id, created_at DESC);
CREATE INDEX idx_orders_status_tracking ON orders(site_id, status) 
    WHERE status IN ('processing', 'shipped');
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Customer stats view for aggregated data
CREATE VIEW public.customer_stats AS
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
GROUP BY p.user_id, p.full_name, u.email, p.avatar_url;

-- =============================================
-- 2. ACTIVITY LOGGING SYSTEM
-- =============================================

CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    
    -- Activity classification
    activity_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    
    -- Display information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Optimized for timeline queries
CREATE INDEX idx_activity_timeline ON activity_logs(site_id, created_at DESC);
CREATE INDEX idx_activity_user ON activity_logs(user_id, created_at DESC) 
    WHERE user_id IS NOT NULL;

-- Automatic activity logging trigger
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log activity if the operation is performed by a user (not system)
    IF auth.uid() IS NOT NULL THEN
        INSERT INTO activity_logs (site_id, user_id, activity_type, entity_type, entity_id, title, metadata)
        VALUES (
            NEW.site_id,
            auth.uid(),
            TG_ARGV[0],
            TG_TABLE_NAME,
            NEW.id,
            TG_ARGV[1],
            jsonb_build_object(
                'table', TG_TABLE_NAME, 
                'operation', TG_OP,
                'old_status', CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
                'new_status', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN NEW.status ELSE NULL END
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply activity logging to orders table
CREATE TRIGGER log_order_activity
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION log_activity('order_update', 'Order activity');

-- =============================================
-- 3. PERFORMANCE METRICS STORAGE
-- =============================================

CREATE TABLE public.site_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Flexible JSONB storage for various metrics
    metrics JSONB NOT NULL DEFAULT '{}',
    /* Expected structure:
    {
        "performance": {"score": 87, "change": 5, "trend": "up"},
        "page_load": {"score": 92, "change": 3, "trend": "up"},
        "seo": {"score": 78, "change": -2, "trend": "down"},
        "mobile": {"score": 85, "change": 0, "trend": "neutral"},
        "security": {"score": 95, "change": 1, "trend": "up"},
        "accessibility": {"score": 72, "change": 8, "trend": "up"}
    }
    */
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(site_id, metric_date)
);

-- Fast lookup for recent metrics
CREATE INDEX idx_metrics_recent ON site_metrics(site_id, metric_date DESC);

-- Function to calculate metric trends
CREATE OR REPLACE FUNCTION calculate_metric_trend(
    current_value NUMERIC,
    previous_value NUMERIC
) RETURNS TEXT AS $$
BEGIN
    IF previous_value IS NULL OR current_value = previous_value THEN
        RETURN 'neutral';
    ELSIF current_value > previous_value THEN
        RETURN 'up';
    ELSE
        RETURN 'down';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================
-- 4. THEME SETTINGS EXTENSION
-- =============================================

-- Extend existing sites table with theme settings
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS theme_settings JSONB DEFAULT '{
    "colors": {
        "primary": "#8B5CF6",
        "secondary": "#06B6D4",
        "accent": "#F59E0B",
        "background": "#FFFFFF"
    },
    "typography": {
        "headingFont": "Inter",
        "bodyFont": "Inter",
        "fontSize": "medium"
    },
    "layout": {
        "headerStyle": "modern",
        "footerStyle": "minimal",
        "menuStyle": "horizontal"
    },
    "logo": {
        "url": null,
        "position": "left",
        "size": "medium"
    }
}';

-- Add validation constraint for theme settings
DO $$ 
BEGIN
    -- Check if constraint exists before adding
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_theme_settings' 
        AND conrelid = 'sites'::regclass
    ) THEN
        ALTER TABLE public.sites ADD CONSTRAINT valid_theme_settings CHECK (
            jsonb_typeof(theme_settings) = 'object' AND
            theme_settings ? 'colors' AND
            theme_settings ? 'typography' AND
            theme_settings ? 'layout'
        );
    END IF;
END $$;

-- =============================================
-- 5. RLS POLICIES
-- =============================================

-- Orders policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_members_manage_orders" ON orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM site_memberships 
            WHERE user_id = auth.uid() 
            AND site_id = orders.site_id
            AND role IN ('owner', 'editor')
        )
    );

CREATE POLICY "customers_view_own_orders" ON orders
    FOR SELECT USING (auth.uid() = customer_id);

-- Order items policies
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_members_manage_order_items" ON order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM orders o
            JOIN site_memberships sm ON sm.site_id = o.site_id
            WHERE o.id = order_items.order_id
            AND sm.user_id = auth.uid()
            AND sm.role IN ('owner', 'editor')
        )
    );

-- Activity logs policies
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_members_view_activity" ON activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM site_memberships 
            WHERE user_id = auth.uid() 
            AND site_id = activity_logs.site_id
        )
    );

-- Site metrics policies
ALTER TABLE public.site_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_members_manage_metrics" ON site_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM site_memberships 
            WHERE user_id = auth.uid() 
            AND site_id = site_metrics.site_id
        )
    );

-- =============================================
-- 6. HELPER FUNCTIONS
-- =============================================

-- Function to generate unique order numbers
CREATE OR REPLACE FUNCTION generate_order_number(site_prefix VARCHAR DEFAULT 'ORD')
RETURNS VARCHAR AS $$
DECLARE
    new_number VARCHAR;
    counter INTEGER := 0;
BEGIN
    LOOP
        -- Generate format: ORD-20250730-001234
        new_number := site_prefix || '-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
        
        -- Check if exists
        IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = new_number) THEN
            RETURN new_number;
        END IF;
        
        counter := counter + 1;
        IF counter > 10 THEN
            RAISE EXCEPTION 'Could not generate unique order number';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update order timestamps
CREATE OR REPLACE FUNCTION update_order_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Update status-specific timestamps
    IF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status THEN
            CASE NEW.status
                WHEN 'shipped' THEN
                    NEW.shipped_at = NOW();
                WHEN 'delivered' THEN
                    NEW.delivered_at = NOW();
                WHEN 'cancelled' THEN
                    NEW.cancelled_at = NOW();
                ELSE
                    -- No specific timestamp update
            END CASE;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp trigger to orders
CREATE TRIGGER update_order_timestamps_trigger
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_order_timestamps();

-- =============================================
-- 7. INITIAL SAMPLE DATA (Development Only)
-- =============================================

-- Note: This section should only run in development
-- Comment out or remove for production migrations

/*
-- Sample orders for testing
DO $$
DECLARE
    test_site_id UUID;
    test_customer_id UUID;
BEGIN
    -- Get first site for testing
    SELECT id INTO test_site_id FROM sites LIMIT 1;
    
    -- Get first customer profile
    SELECT user_id INTO test_customer_id FROM profiles WHERE user_type = 'customer' LIMIT 1;
    
    IF test_site_id IS NOT NULL AND test_customer_id IS NOT NULL THEN
        -- Insert sample orders
        INSERT INTO orders (site_id, customer_id, order_number, status, total_amount, items_count, customer_name, customer_email)
        VALUES 
            (test_site_id, test_customer_id, generate_order_number(), 'processing', 299.99, 3, 'John Doe', 'john@example.com'),
            (test_site_id, test_customer_id, generate_order_number(), 'shipped', 149.50, 1, 'Jane Smith', 'jane@example.com'),
            (test_site_id, test_customer_id, generate_order_number(), 'delivered', 599.00, 5, 'Bob Johnson', 'bob@example.com');
        
        -- Insert sample metrics
        INSERT INTO site_metrics (site_id, metric_date, metrics)
        VALUES 
            (test_site_id, CURRENT_DATE, '{
                "performance": {"score": 87, "change": 5, "trend": "up"},
                "page_load": {"score": 92, "change": 3, "trend": "up"},
                "seo": {"score": 78, "change": -2, "trend": "down"},
                "mobile": {"score": 85, "change": 0, "trend": "neutral"},
                "security": {"score": 95, "change": 1, "trend": "up"},
                "accessibility": {"score": 72, "change": 8, "trend": "up"}
            }');
    END IF;
END $$;
*/

-- =============================================
-- 8. GRANTS AND PERMISSIONS
-- =============================================

-- Grant necessary permissions to authenticated users
GRANT SELECT ON customer_stats TO authenticated;
GRANT ALL ON orders TO authenticated;
GRANT ALL ON order_items TO authenticated;
GRANT ALL ON activity_logs TO authenticated;
GRANT ALL ON site_metrics TO authenticated;

-- Grant usage on sequences if any
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMENT ON TABLE orders IS 'Multi-tenant order management with customer denormalization for performance';
COMMENT ON TABLE activity_logs IS 'Unified activity logging for all site actions with automatic triggers';
COMMENT ON TABLE site_metrics IS 'Daily performance metrics storage with flexible JSONB structure';
COMMENT ON COLUMN sites.theme_settings IS 'Site-specific theme customization including colors, typography, and layout';