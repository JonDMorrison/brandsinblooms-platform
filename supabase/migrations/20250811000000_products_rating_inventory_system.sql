-- Products Rating, Reviews & Inventory System Migration
-- Completes the Products module with missing features
-- Adds inventory tracking, reviews system, and rating calculations

-- =====================================================
-- 1. ENHANCE PRODUCTS TABLE
-- =====================================================

-- Add missing columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS inventory_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS rating DECIMAL(2, 1) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS compare_at_price DECIMAL(10, 2);

-- Add check constraints
ALTER TABLE public.products
ADD CONSTRAINT products_inventory_count_check CHECK (inventory_count >= 0),
ADD CONSTRAINT products_rating_check CHECK (rating >= 0 AND rating <= 5),
ADD CONSTRAINT products_review_count_check CHECK (review_count >= 0);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_inventory ON public.products(site_id, inventory_count) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_rating ON public.products(site_id, rating DESC) WHERE is_active = true;

-- =====================================================
-- 2. CREATE PRODUCT REVIEWS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    
    -- Review content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    
    -- Review metadata
    verified_purchase BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true,
    helpful_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure one review per user per product
    UNIQUE(product_id, profile_id)
);

-- Create indexes for review queries
CREATE INDEX idx_product_reviews_product ON public.product_reviews(product_id, is_approved, created_at DESC);
CREATE INDEX idx_product_reviews_profile ON public.product_reviews(profile_id, created_at DESC);
CREATE INDEX idx_product_reviews_site ON public.product_reviews(site_id, created_at DESC);
CREATE INDEX idx_product_reviews_rating ON public.product_reviews(product_id, rating) WHERE is_approved = true;

-- =====================================================
-- 3. CREATE PRODUCT IMAGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    
    -- Image data
    url TEXT NOT NULL,
    alt_text TEXT,
    caption TEXT,
    
    -- Image metadata
    position INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    width INTEGER,
    height INTEGER,
    size_bytes INTEGER,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for image queries
CREATE INDEX idx_product_images_product ON public.product_images(product_id, position);
CREATE INDEX idx_product_images_site ON public.product_images(site_id);

-- Create unique partial index to ensure only one primary image per product
CREATE UNIQUE INDEX idx_product_images_primary ON public.product_images(product_id) WHERE is_primary = true;

-- =====================================================
-- 4. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Product Reviews Policies
-- Users can view approved reviews for products they can access
CREATE POLICY "Users can view approved reviews"
ON public.product_reviews FOR SELECT
USING (
    is_approved = true 
    AND site_id IN (
        SELECT site_id FROM public.site_memberships 
        WHERE user_id = auth.uid()
        AND is_active = true
    )
);

-- Users can create reviews for products in their sites
CREATE POLICY "Users can create reviews"
ON public.product_reviews FOR INSERT
WITH CHECK (
    profile_id = auth.uid()
    AND site_id IN (
        SELECT site_id FROM public.site_memberships 
        WHERE user_id = auth.uid()
        AND is_active = true
    )
);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
ON public.product_reviews FOR UPDATE
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
ON public.product_reviews FOR DELETE
USING (profile_id = auth.uid());

-- Product Images Policies
-- Users can view images for products they can access
CREATE POLICY "Users can view product images"
ON public.product_images FOR SELECT
USING (
    site_id IN (
        SELECT site_id FROM public.site_memberships 
        WHERE user_id = auth.uid()
        AND is_active = true
    )
);

-- Users can manage images for products in their sites
CREATE POLICY "Users can insert product images"
ON public.product_images FOR INSERT
WITH CHECK (
    site_id IN (
        SELECT site_id FROM public.site_memberships 
        WHERE user_id = auth.uid()
        AND is_active = true
    )
);

CREATE POLICY "Users can update product images"
ON public.product_images FOR UPDATE
USING (
    site_id IN (
        SELECT site_id FROM public.site_memberships 
        WHERE user_id = auth.uid()
        AND is_active = true
    )
)
WITH CHECK (
    site_id IN (
        SELECT site_id FROM public.site_memberships 
        WHERE user_id = auth.uid()
        AND is_active = true
    )
);

CREATE POLICY "Users can delete product images"
ON public.product_images FOR DELETE
USING (
    site_id IN (
        SELECT site_id FROM public.site_memberships 
        WHERE user_id = auth.uid()
        AND is_active = true
    )
);

-- =====================================================
-- 5. RATING CALCULATION FUNCTIONS
-- =====================================================

-- Function to update product rating when reviews change
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_rating DECIMAL(2, 1);
    new_count INTEGER;
BEGIN
    -- Calculate new average rating and count
    SELECT 
        COALESCE(AVG(rating)::DECIMAL(2, 1), 0.0),
        COUNT(*)
    INTO new_rating, new_count
    FROM public.product_reviews
    WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
        AND is_approved = true;
    
    -- Update the product with new rating
    UPDATE public.products
    SET 
        rating = new_rating,
        review_count = new_count,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for rating updates
CREATE TRIGGER update_product_rating_on_review_insert
    AFTER INSERT ON public.product_reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_product_rating();

CREATE TRIGGER update_product_rating_on_review_update
    AFTER UPDATE OF rating, is_approved ON public.product_reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_product_rating();

CREATE TRIGGER update_product_rating_on_review_delete
    AFTER DELETE ON public.product_reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_product_rating();

-- =====================================================
-- 6. INVENTORY MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to safely update inventory with constraints
CREATE OR REPLACE FUNCTION public.update_product_inventory(
    p_product_id UUID,
    p_change INTEGER
)
RETURNS public.products
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_product public.products;
BEGIN
    -- Update inventory count with constraint check
    UPDATE public.products
    SET 
        inventory_count = GREATEST(0, inventory_count + p_change),
        in_stock = CASE 
            WHEN inventory_count + p_change > 0 THEN true 
            ELSE false 
        END,
        stock_status = CASE
            WHEN inventory_count + p_change <= 0 THEN 'out_of_stock'
            WHEN inventory_count + p_change <= low_stock_threshold THEN 'low_stock'
            ELSE 'in_stock'
        END,
        updated_at = NOW()
    WHERE id = p_product_id
    RETURNING * INTO updated_product;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found: %', p_product_id;
    END IF;
    
    RETURN updated_product;
END;
$$;

-- Function to check and update low stock status
CREATE OR REPLACE FUNCTION public.check_low_stock_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update stock status based on inventory count
    IF NEW.inventory_count <= 0 THEN
        NEW.in_stock := false;
        NEW.stock_status := 'out_of_stock';
    ELSIF NEW.inventory_count <= NEW.low_stock_threshold THEN
        NEW.in_stock := true;
        NEW.stock_status := 'low_stock';
    ELSE
        NEW.in_stock := true;
        NEW.stock_status := 'in_stock';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for automatic stock status updates
CREATE TRIGGER update_stock_status
    BEFORE UPDATE OF inventory_count, low_stock_threshold ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.check_low_stock_status();

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function to get product stats for dashboard
CREATE OR REPLACE FUNCTION public.get_product_stats(p_site_id UUID)
RETURNS TABLE (
    total_products BIGINT,
    active_products BIGINT,
    out_of_stock BIGINT,
    low_stock BIGINT,
    average_rating DECIMAL(2, 1),
    total_reviews BIGINT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_products,
        COUNT(*) FILTER (WHERE is_active = true)::BIGINT as active_products,
        COUNT(*) FILTER (WHERE stock_status = 'out_of_stock')::BIGINT as out_of_stock,
        COUNT(*) FILTER (WHERE stock_status = 'low_stock')::BIGINT as low_stock,
        AVG(rating)::DECIMAL(2, 1) as average_rating,
        SUM(review_count)::BIGINT as total_reviews
    FROM public.products
    WHERE site_id = p_site_id;
END;
$$;

-- =====================================================
-- 8. UPDATE TIMESTAMPS TRIGGERS
-- =====================================================

-- Create or replace the set_updated_at function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create updated_at trigger for product_reviews
CREATE TRIGGER set_product_reviews_updated_at
    BEFORE UPDATE ON public.product_reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Create updated_at trigger for product_images
CREATE TRIGGER set_product_images_updated_at
    BEFORE UPDATE ON public.product_images
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- 9. MIGRATION VERIFICATION
-- =====================================================

-- Add comment to track migration completion
COMMENT ON TABLE public.product_reviews IS 'Product reviews with ratings - Added in products_rating_inventory_system migration';
COMMENT ON TABLE public.product_images IS 'Product images with ordering - Added in products_rating_inventory_system migration';
COMMENT ON COLUMN public.products.inventory_count IS 'Current inventory count - Added in products_rating_inventory_system migration';
COMMENT ON COLUMN public.products.rating IS 'Average rating from reviews - Added in products_rating_inventory_system migration';
COMMENT ON COLUMN public.products.review_count IS 'Total number of approved reviews - Added in products_rating_inventory_system migration';