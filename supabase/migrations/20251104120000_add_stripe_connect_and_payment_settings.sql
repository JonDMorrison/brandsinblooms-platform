-- Migration: Add Stripe Connect and Payment Settings
-- Description: Enable Stripe Connect for multi-tenant payment processing with site-specific tax and shipping configuration

-- =============================================
-- 1. ADD STRIPE CONNECT COLUMNS TO SITES TABLE
-- =============================================

-- Add Stripe Connect account tracking to sites
ALTER TABLE public.sites
ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_account_status VARCHAR(50) DEFAULT 'not_connected',
ADD COLUMN IF NOT EXISTS stripe_onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_connected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stripe_disconnected_at TIMESTAMPTZ;

-- Create index for Stripe account lookups
CREATE INDEX IF NOT EXISTS idx_sites_stripe_account_id ON sites(stripe_account_id) WHERE stripe_account_id IS NOT NULL;

-- Add constraint for valid account status
ALTER TABLE public.sites DROP CONSTRAINT IF EXISTS check_stripe_account_status;
ALTER TABLE public.sites ADD CONSTRAINT check_stripe_account_status CHECK (
    stripe_account_status IN ('not_connected', 'pending', 'active', 'restricted', 'disabled')
);

-- =============================================
-- 2. CREATE SITE PAYMENT SETTINGS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.site_payment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE UNIQUE NOT NULL,

    -- Tax Configuration
    tax_enabled BOOLEAN DEFAULT true NOT NULL,
    default_tax_rate DECIMAL(5, 2) DEFAULT 8.00 NOT NULL CHECK (default_tax_rate >= 0 AND default_tax_rate <= 100),
    tax_by_state JSONB DEFAULT '{}' NOT NULL,
    tax_inclusive BOOLEAN DEFAULT false NOT NULL,

    -- Shipping Configuration
    shipping_enabled BOOLEAN DEFAULT true NOT NULL,
    free_shipping_threshold DECIMAL(10, 2) DEFAULT 100.00 CHECK (free_shipping_threshold >= 0),
    flat_rate_shipping DECIMAL(10, 2) DEFAULT 10.00 NOT NULL CHECK (flat_rate_shipping >= 0),
    shipping_by_region JSONB DEFAULT '[]' NOT NULL,

    -- Payment Settings
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    minimum_order_amount DECIMAL(10, 2) DEFAULT 0.00 CHECK (minimum_order_amount >= 0),

    -- Platform Commission (optional - for marketplace model)
    platform_commission_enabled BOOLEAN DEFAULT false NOT NULL,
    platform_commission_type VARCHAR(20) DEFAULT 'none' NOT NULL,
    platform_commission_value DECIMAL(10, 2) DEFAULT 0 CHECK (platform_commission_value >= 0),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT check_commission_type CHECK (
        platform_commission_type IN ('none', 'percentage', 'fixed')
    ),
    CONSTRAINT check_currency_code CHECK (
        currency ~ '^[A-Z]{3}$'
    )
);

-- Create index for efficient site lookups
CREATE INDEX IF NOT EXISTS idx_site_payment_settings_site_id ON site_payment_settings(site_id);

-- Add comments for documentation
COMMENT ON TABLE site_payment_settings IS 'Site-specific payment, tax, and shipping configuration for Stripe Connect';
COMMENT ON COLUMN site_payment_settings.tax_by_state IS 'JSON object mapping state codes to tax rates, e.g., {"CA": 9.5, "NY": 8.875}';
COMMENT ON COLUMN site_payment_settings.shipping_by_region IS 'JSON array of regional shipping rates, e.g., [{"region": "CA", "rate": 15.00}]';
COMMENT ON COLUMN site_payment_settings.platform_commission_value IS 'Commission amount as percentage (0-100) or fixed dollar amount depending on type';

-- =============================================
-- 3. ADD STRIPE PAYMENT INTENT ID TO ORDERS
-- =============================================

-- Add Stripe PaymentIntent tracking to orders for webhook processing
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);

-- Create index for fast webhook lookups
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent ON orders(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

-- Create unique constraint to prevent duplicate payment intents
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS unique_stripe_payment_intent;
ALTER TABLE public.orders ADD CONSTRAINT unique_stripe_payment_intent UNIQUE (stripe_payment_intent_id);

-- =============================================
-- 4. CREATE WEBHOOK EVENTS LOG TABLE
-- =============================================

-- Track all Stripe webhook events for debugging and audit
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    stripe_account_id VARCHAR(255),
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false NOT NULL,
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Foreign keys (nullable as not all events relate to orders)
    related_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    related_site_id UUID REFERENCES sites(id) ON DELETE SET NULL
);

-- Indexes for webhook event queries
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_stripe_event_id ON stripe_webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_type ON stripe_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed ON stripe_webhook_events(processed, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_stripe_account ON stripe_webhook_events(stripe_account_id) WHERE stripe_account_id IS NOT NULL;

COMMENT ON TABLE stripe_webhook_events IS 'Audit log of all Stripe webhook events for debugging and idempotency';

-- =============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on new tables
ALTER TABLE public.site_payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- ===== RLS Policies for site_payment_settings =====

-- Site owners can manage their payment settings
CREATE POLICY "site_owners_manage_payment_settings" ON site_payment_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM site_memberships
            WHERE site_id = site_payment_settings.site_id
            AND user_id = auth.uid()
            AND role = 'owner'
        )
    );

-- Public can view payment settings (needed for checkout calculations)
CREATE POLICY "public_view_payment_settings" ON site_payment_settings
    FOR SELECT USING (true);

-- ===== RLS Policies for stripe_webhook_events =====

-- Only admins can view webhook events (sensitive data)
CREATE POLICY "admins_view_webhook_events" ON stripe_webhook_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Service role can insert webhook events
CREATE POLICY "service_insert_webhook_events" ON stripe_webhook_events
    FOR INSERT WITH CHECK (true);

-- =============================================
-- 6. FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to automatically create payment settings for new sites
CREATE OR REPLACE FUNCTION create_default_payment_settings()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create if site doesn't already have payment settings
    INSERT INTO site_payment_settings (site_id)
    VALUES (NEW.id)
    ON CONFLICT (site_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create payment settings on site creation
DROP TRIGGER IF EXISTS create_default_payment_settings_trigger ON sites;
CREATE TRIGGER create_default_payment_settings_trigger
    AFTER INSERT ON sites
    FOR EACH ROW EXECUTE FUNCTION create_default_payment_settings();

-- Function to update payment settings updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_payment_settings_updated_at_trigger ON site_payment_settings;
CREATE TRIGGER update_payment_settings_updated_at_trigger
    BEFORE UPDATE ON site_payment_settings
    FOR EACH ROW EXECUTE FUNCTION update_payment_settings_updated_at();

-- =============================================
-- 7. HELPER FUNCTIONS
-- =============================================

-- Function to get payment settings for a site (with defaults if not found)
CREATE OR REPLACE FUNCTION get_site_payment_settings(p_site_id UUID)
RETURNS TABLE (
    tax_enabled BOOLEAN,
    default_tax_rate DECIMAL,
    tax_by_state JSONB,
    tax_inclusive BOOLEAN,
    shipping_enabled BOOLEAN,
    free_shipping_threshold DECIMAL,
    flat_rate_shipping DECIMAL,
    shipping_by_region JSONB,
    currency VARCHAR,
    minimum_order_amount DECIMAL,
    platform_commission_enabled BOOLEAN,
    platform_commission_type VARCHAR,
    platform_commission_value DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(sps.tax_enabled, true),
        COALESCE(sps.default_tax_rate, 8.00),
        COALESCE(sps.tax_by_state, '{}'::jsonb),
        COALESCE(sps.tax_inclusive, false),
        COALESCE(sps.shipping_enabled, true),
        COALESCE(sps.free_shipping_threshold, 100.00),
        COALESCE(sps.flat_rate_shipping, 10.00),
        COALESCE(sps.shipping_by_region, '[]'::jsonb),
        COALESCE(sps.currency, 'USD'),
        COALESCE(sps.minimum_order_amount, 0.00),
        COALESCE(sps.platform_commission_enabled, false),
        COALESCE(sps.platform_commission_type, 'none'),
        COALESCE(sps.platform_commission_value, 0.00)
    FROM site_payment_settings sps
    WHERE sps.site_id = p_site_id;

    -- If no settings found, return defaults
    IF NOT FOUND THEN
        RETURN QUERY SELECT
            true,
            8.00::decimal,
            '{}'::jsonb,
            false,
            true,
            100.00::decimal,
            10.00::decimal,
            '[]'::jsonb,
            'USD'::varchar,
            0.00::decimal,
            false,
            'none'::varchar,
            0.00::decimal;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check if site can accept payments (Stripe connected and enabled)
CREATE OR REPLACE FUNCTION can_site_accept_payments(p_site_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_stripe_enabled BOOLEAN;
BEGIN
    SELECT
        stripe_account_id IS NOT NULL
        AND stripe_charges_enabled = true
        AND stripe_account_status = 'active'
    INTO v_stripe_enabled
    FROM sites
    WHERE id = p_site_id;

    RETURN COALESCE(v_stripe_enabled, false);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =============================================
-- 8. SEED DEFAULT PAYMENT SETTINGS FOR EXISTING SITES
-- =============================================

-- Create default payment settings for all existing sites that don't have them
INSERT INTO site_payment_settings (site_id)
SELECT id FROM sites
WHERE id NOT IN (SELECT site_id FROM site_payment_settings)
ON CONFLICT (site_id) DO NOTHING;

-- =============================================
-- 9. GRANTS
-- =============================================

-- Grant permissions
GRANT ALL ON site_payment_settings TO authenticated;
GRANT SELECT ON stripe_webhook_events TO authenticated;
GRANT INSERT ON stripe_webhook_events TO service_role;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_site_payment_settings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_site_accept_payments(UUID) TO authenticated;

-- =============================================
-- 10. COMMENTS
-- =============================================

COMMENT ON COLUMN sites.stripe_account_id IS 'Stripe Connect account ID for this site';
COMMENT ON COLUMN sites.stripe_account_status IS 'Current status of Stripe Connect account';
COMMENT ON COLUMN sites.stripe_charges_enabled IS 'Whether the Stripe account can accept charges';
COMMENT ON COLUMN sites.stripe_payouts_enabled IS 'Whether the Stripe account can receive payouts';
COMMENT ON COLUMN orders.stripe_payment_intent_id IS 'Stripe PaymentIntent ID for webhook processing and refunds';
COMMENT ON FUNCTION can_site_accept_payments IS 'Check if a site can accept payments (Stripe connected and active)';
COMMENT ON FUNCTION get_site_payment_settings IS 'Get payment settings for a site with defaults if not configured';
