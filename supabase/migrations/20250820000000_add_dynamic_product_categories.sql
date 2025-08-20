-- =====================================================
-- Migration: Dynamic Product Categories System
-- Description: Implements hierarchical, database-driven product categories
-- Author: Claude
-- Date: 2025-08-20
-- =====================================================

-- =====================================================
-- 1. CREATE CATEGORIES TABLE WITH HIERARCHICAL SUPPORT
-- =====================================================

-- Main categories table with hierarchical support
CREATE TABLE public.product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
    
    -- Basic Information
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Visual Elements
    image_url TEXT,
    icon TEXT, -- Emoji or icon name
    color VARCHAR(7), -- Hex color for UI
    
    -- Hierarchy Management
    path TEXT NOT NULL, -- Materialized path for efficient queries
    level INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- SEO
    meta_title TEXT,
    meta_description TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    UNIQUE(site_id, slug),
    CONSTRAINT check_max_depth CHECK (level <= 5),
    CONSTRAINT check_valid_color CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Create indexes for performance
CREATE INDEX idx_categories_site_parent ON product_categories(site_id, parent_id);
CREATE INDEX idx_categories_site_path ON product_categories(site_id, path);
CREATE INDEX idx_categories_site_active ON product_categories(site_id, is_active) WHERE is_active = true;
CREATE INDEX idx_categories_sort ON product_categories(site_id, parent_id, sort_order);
CREATE INDEX idx_categories_slug ON product_categories(site_id, slug);

-- =====================================================
-- 2. CREATE PRODUCT-CATEGORY JUNCTION TABLE
-- =====================================================

-- Junction table for many-to-many product-category relationships
CREATE TABLE public.product_category_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure unique product-category pairs
    UNIQUE(product_id, category_id)
);

-- Create indexes for query performance
CREATE INDEX idx_assignments_product ON product_category_assignments(product_id);
CREATE INDEX idx_assignments_category ON product_category_assignments(category_id);
CREATE INDEX idx_assignments_primary ON product_category_assignments(product_id, is_primary) WHERE is_primary = true;

-- =====================================================
-- 3. UPDATE PRODUCTS TABLE
-- =====================================================

-- Add primary category reference to products for backwards compatibility
ALTER TABLE public.products 
ADD COLUMN primary_category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL;

CREATE INDEX idx_products_primary_category ON products(primary_category_id);

-- =====================================================
-- 4. CREATE TRIGGER FUNCTIONS
-- =====================================================

-- Function to update category path and level automatically
CREATE OR REPLACE FUNCTION update_category_path()
RETURNS TRIGGER AS $$
DECLARE
    parent_path TEXT;
    parent_level INTEGER;
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.path = '/' || NEW.slug;
        NEW.level = 0;
    ELSE
        -- Get parent path and level
        SELECT path, level INTO parent_path, parent_level
        FROM product_categories
        WHERE id = NEW.parent_id AND site_id = NEW.site_id;
        
        IF parent_path IS NULL THEN
            RAISE EXCEPTION 'Parent category not found or belongs to different site';
        END IF;
        
        NEW.path = parent_path || '/' || NEW.slug;
        NEW.level = parent_level + 1;
    END IF;
    
    -- Update timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for path updates
CREATE TRIGGER before_category_insert_update
BEFORE INSERT OR UPDATE OF parent_id, slug ON product_categories
FOR EACH ROW EXECUTE FUNCTION update_category_path();

-- Function to prevent circular references
CREATE OR REPLACE FUNCTION prevent_category_cycles()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id IS NOT NULL THEN
        -- Check if this would create a cycle
        IF EXISTS (
            WITH RECURSIVE ancestors AS (
                SELECT id, parent_id FROM product_categories WHERE id = NEW.parent_id
                UNION ALL
                SELECT c.id, c.parent_id 
                FROM product_categories c
                JOIN ancestors a ON c.id = a.parent_id
            )
            SELECT 1 FROM ancestors WHERE id = NEW.id LIMIT 1
        ) THEN
            RAISE EXCEPTION 'Category hierarchy would create a circular reference';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent cycles
CREATE TRIGGER before_category_parent_update
BEFORE UPDATE OF parent_id ON product_categories
FOR EACH ROW WHEN (OLD.parent_id IS DISTINCT FROM NEW.parent_id)
EXECUTE FUNCTION prevent_category_cycles();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON product_categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to ensure only one primary category per product
CREATE OR REPLACE FUNCTION ensure_single_primary_category()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = true THEN
        -- Remove primary flag from other assignments
        UPDATE product_category_assignments
        SET is_primary = false
        WHERE product_id = NEW.product_id 
        AND id != NEW.id
        AND is_primary = true;
        
        -- Update product's primary category
        UPDATE products
        SET primary_category_id = NEW.category_id
        WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for primary category management
CREATE TRIGGER manage_primary_category
AFTER INSERT OR UPDATE OF is_primary ON product_category_assignments
FOR EACH ROW WHEN (NEW.is_primary = true)
EXECUTE FUNCTION ensure_single_primary_category();

-- =====================================================
-- 5. CREATE UTILITY FUNCTIONS
-- =====================================================

-- Function to get category hierarchy with product counts
CREATE OR REPLACE FUNCTION get_category_tree(p_site_id UUID)
RETURNS TABLE (
    id UUID,
    parent_id UUID,
    name VARCHAR(255),
    slug VARCHAR(255),
    description TEXT,
    image_url TEXT,
    icon TEXT,
    color VARCHAR(7),
    path TEXT,
    level INTEGER,
    sort_order INTEGER,
    is_active BOOLEAN,
    product_count BIGINT,
    children_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE category_tree AS (
        -- Root categories
        SELECT 
            c.id,
            c.parent_id,
            c.name,
            c.slug,
            c.description,
            c.image_url,
            c.icon,
            c.color,
            c.path,
            c.level,
            c.sort_order,
            c.is_active
        FROM product_categories c
        WHERE c.site_id = p_site_id AND c.parent_id IS NULL
        
        UNION ALL
        
        -- Child categories
        SELECT 
            c.id,
            c.parent_id,
            c.name,
            c.slug,
            c.description,
            c.image_url,
            c.icon,
            c.color,
            c.path,
            c.level,
            c.sort_order,
            c.is_active
        FROM product_categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
        WHERE c.site_id = p_site_id
    ),
    category_counts AS (
        SELECT 
            ct.id,
            COUNT(DISTINCT pca.product_id) as product_count,
            COUNT(DISTINCT child.id) as children_count
        FROM category_tree ct
        LEFT JOIN product_category_assignments pca ON pca.category_id = ct.id
        LEFT JOIN product_categories child ON child.parent_id = ct.id
        GROUP BY ct.id
    )
    SELECT 
        ct.*,
        COALESCE(cc.product_count, 0) as product_count,
        COALESCE(cc.children_count, 0) as children_count
    FROM category_tree ct
    LEFT JOIN category_counts cc ON cc.id = ct.id
    ORDER BY ct.level, ct.sort_order, ct.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get category ancestors (breadcrumb)
CREATE OR REPLACE FUNCTION get_category_ancestors(p_category_id UUID)
RETURNS TABLE (
    id UUID,
    parent_id UUID,
    name VARCHAR(255),
    slug VARCHAR(255),
    level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE ancestors AS (
        SELECT 
            c.id,
            c.parent_id,
            c.name,
            c.slug,
            c.level
        FROM product_categories c
        WHERE c.id = p_category_id
        
        UNION ALL
        
        SELECT 
            c.id,
            c.parent_id,
            c.name,
            c.slug,
            c.level
        FROM product_categories c
        INNER JOIN ancestors a ON c.id = a.parent_id
    )
    SELECT * FROM ancestors
    ORDER BY level ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to reassign products when deleting a category
CREATE OR REPLACE FUNCTION reassign_category_products(
    p_category_id UUID,
    p_new_category_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    affected_count INTEGER;
BEGIN
    IF p_new_category_id IS NOT NULL THEN
        -- Reassign to new category
        UPDATE product_category_assignments
        SET category_id = p_new_category_id
        WHERE category_id = p_category_id
        AND NOT EXISTS (
            SELECT 1 FROM product_category_assignments pca2
            WHERE pca2.product_id = product_category_assignments.product_id
            AND pca2.category_id = p_new_category_id
        );
        
        -- Update primary category references
        UPDATE products
        SET primary_category_id = p_new_category_id
        WHERE primary_category_id = p_category_id;
    ELSE
        -- Remove assignments
        DELETE FROM product_category_assignments
        WHERE category_id = p_category_id;
        
        -- Clear primary category references
        UPDATE products
        SET primary_category_id = NULL
        WHERE primary_category_id = p_category_id;
    END IF;
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_category_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_categories
CREATE POLICY "Users can view their site categories"
ON product_categories FOR SELECT
USING (
    site_id IN (
        SELECT sm.site_id 
        FROM site_memberships sm
        WHERE sm.user_id = auth.uid() 
        AND sm.is_active = true
    )
);

CREATE POLICY "Users can manage their site categories"
ON product_categories FOR ALL
USING (
    site_id IN (
        SELECT sm.site_id 
        FROM site_memberships sm
        WHERE sm.user_id = auth.uid() 
        AND sm.is_active = true
        AND sm.role IN ('owner', 'editor')
    )
);

-- RLS Policies for product_category_assignments
CREATE POLICY "Users can view their product assignments"
ON product_category_assignments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM products p
        JOIN site_memberships sm ON sm.site_id = p.site_id
        WHERE p.id = product_id 
        AND sm.user_id = auth.uid()
        AND sm.is_active = true
    )
);

CREATE POLICY "Users can manage their product assignments"
ON product_category_assignments FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM products p
        JOIN site_memberships sm ON sm.site_id = p.site_id
        WHERE p.id = product_id 
        AND sm.user_id = auth.uid()
        AND sm.is_active = true
        AND sm.role IN ('owner', 'editor')
    )
);

-- =====================================================
-- 7. DATA MIGRATION FROM EXISTING CATEGORIES
-- =====================================================

-- Function to migrate existing category data
CREATE OR REPLACE FUNCTION migrate_existing_categories()
RETURNS void AS $$
DECLARE
    v_site RECORD;
    v_category RECORD;
    v_category_id UUID;
    v_subcategory_id UUID;
BEGIN
    -- Process each site
    FOR v_site IN SELECT DISTINCT id FROM sites LOOP
        -- Get unique categories from products
        FOR v_category IN 
            SELECT DISTINCT 
                category,
                subcategory
            FROM products 
            WHERE site_id = v_site.id 
            AND category IS NOT NULL
            ORDER BY category, subcategory
        LOOP
            -- Create main category if not exists
            INSERT INTO product_categories (
                site_id, 
                name, 
                slug, 
                parent_id,
                path,
                level,
                sort_order
            )
            VALUES (
                v_site.id,
                v_category.category,
                LOWER(REPLACE(v_category.category, ' ', '-')),
                NULL,
                '/' || LOWER(REPLACE(v_category.category, ' ', '-')),
                0,
                0
            )
            ON CONFLICT (site_id, slug) DO UPDATE
            SET updated_at = NOW()
            RETURNING id INTO v_category_id;
            
            -- Create subcategory if exists
            IF v_category.subcategory IS NOT NULL THEN
                INSERT INTO product_categories (
                    site_id,
                    name,
                    slug,
                    parent_id,
                    path,
                    level,
                    sort_order
                )
                VALUES (
                    v_site.id,
                    v_category.subcategory,
                    LOWER(REPLACE(v_category.subcategory, ' ', '-')),
                    v_category_id,
                    '/' || LOWER(REPLACE(v_category.category, ' ', '-')) || '/' || LOWER(REPLACE(v_category.subcategory, ' ', '-')),
                    1,
                    0
                )
                ON CONFLICT (site_id, slug) DO UPDATE
                SET 
                    parent_id = v_category_id,
                    updated_at = NOW()
                RETURNING id INTO v_subcategory_id;
                
                -- Assign products to subcategory
                INSERT INTO product_category_assignments (product_id, category_id, is_primary)
                SELECT 
                    p.id,
                    v_subcategory_id,
                    true
                FROM products p
                WHERE p.site_id = v_site.id
                AND p.category = v_category.category
                AND p.subcategory = v_category.subcategory
                ON CONFLICT DO NOTHING;
                
                -- Update primary category on products
                UPDATE products
                SET primary_category_id = v_subcategory_id
                WHERE site_id = v_site.id
                AND category = v_category.category
                AND subcategory = v_category.subcategory;
            ELSE
                -- Assign products to main category only
                INSERT INTO product_category_assignments (product_id, category_id, is_primary)
                SELECT 
                    p.id,
                    v_category_id,
                    true
                FROM products p
                WHERE p.site_id = v_site.id
                AND p.category = v_category.category
                AND p.subcategory IS NULL
                ON CONFLICT DO NOTHING;
                
                -- Update primary category on products
                UPDATE products
                SET primary_category_id = v_category_id
                WHERE site_id = v_site.id
                AND category = v_category.category
                AND subcategory IS NULL;
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute migration
SELECT migrate_existing_categories();

-- =====================================================
-- 8. CREATE VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for categories with product counts
CREATE OR REPLACE VIEW category_product_counts AS
SELECT 
    c.id,
    c.site_id,
    c.name,
    c.slug,
    c.parent_id,
    c.path,
    c.level,
    c.is_active,
    COUNT(DISTINCT pca.product_id) as product_count,
    COUNT(DISTINCT pca.product_id) FILTER (WHERE p.is_active = true) as active_product_count
FROM product_categories c
LEFT JOIN product_category_assignments pca ON pca.category_id = c.id
LEFT JOIN products p ON p.id = pca.product_id
GROUP BY c.id, c.site_id, c.name, c.slug, c.parent_id, c.path, c.level, c.is_active;

-- View for product categories flat list
CREATE OR REPLACE VIEW product_categories_expanded AS
SELECT 
    p.id as product_id,
    p.site_id,
    p.name as product_name,
    p.sku,
    c.id as category_id,
    c.name as category_name,
    c.slug as category_slug,
    c.path as category_path,
    pca.is_primary,
    pca.sort_order
FROM products p
LEFT JOIN product_category_assignments pca ON pca.product_id = p.id
LEFT JOIN product_categories c ON c.id = pca.category_id
WHERE p.is_active = true AND c.is_active = true;

-- =====================================================
-- 9. GRANTS AND PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT ALL ON product_categories TO authenticated;
GRANT ALL ON product_category_assignments TO authenticated;
GRANT SELECT ON category_product_counts TO authenticated;
GRANT SELECT ON product_categories_expanded TO authenticated;

-- Grant execute permissions on utility functions
GRANT EXECUTE ON FUNCTION get_category_tree(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_category_ancestors(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reassign_category_products(UUID, UUID) TO authenticated;

-- =====================================================
-- 10. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE product_categories IS 'Hierarchical product categories with multi-tenant support';
COMMENT ON TABLE product_category_assignments IS 'Many-to-many relationship between products and categories';

COMMENT ON COLUMN product_categories.path IS 'Materialized path for efficient hierarchical queries';
COMMENT ON COLUMN product_categories.level IS 'Depth level in hierarchy (0 = root)';
COMMENT ON COLUMN product_categories.icon IS 'Emoji or icon identifier for UI display';
COMMENT ON COLUMN product_categories.color IS 'Hex color code for category styling';

COMMENT ON COLUMN product_category_assignments.is_primary IS 'Indicates if this is the main category for the product';

COMMENT ON FUNCTION get_category_tree(UUID) IS 'Returns complete category hierarchy for a site with product counts';
COMMENT ON FUNCTION get_category_ancestors(UUID) IS 'Returns breadcrumb path for a category';
COMMENT ON FUNCTION reassign_category_products(UUID, UUID) IS 'Reassigns or removes products when deleting a category';

-- =====================================================
-- END OF MIGRATION
-- =====================================================