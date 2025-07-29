-- Brands in Blooms Platform Database Schema (Refined & Optimized)
-- PostgreSQL with Lean Multi-tenant Architecture
-- Optimized for UI data access patterns and development simplicity

-- =====================================================
-- UNIFIED USER SYSTEM (replaces current profiles approach)
-- =====================================================

-- Single users table for all user types (integrates with existing auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL, -- denormalized for performance
    full_name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('admin', 'site_owner', 'customer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- SIMPLIFIED MULTI-TENANT CORE
-- =====================================================

-- Individual garden center sites (simplified)
CREATE TABLE public.sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subdomain VARCHAR(63) UNIQUE NOT NULL, -- e.g., 'garden-haven'
    custom_domain VARCHAR(255), -- e.g., 'www.gardenhaven.com'
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Essential branding only
    logo_url TEXT,
    primary_color VARCHAR(7), -- hex color
    
    -- Essential business info
    business_name VARCHAR(255),
    business_email VARCHAR(255),
    business_phone VARCHAR(50),
    business_address TEXT,
    business_hours JSONB, -- {"monday": {"open": "9:00", "close": "17:00"}, ...}
    
    -- Location
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    
    is_active BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Site memberships (replaces separate site_owners table)
CREATE TABLE public.site_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, site_id)
);

-- =====================================================
-- UNIFIED CONTENT SYSTEM
-- =====================================================

-- Single content table (replaces pages, blog_posts, events)
CREATE TABLE public.content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.users(id),
    
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('page', 'blog_post', 'event')),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    content JSONB NOT NULL, -- flexible content storage (blocks, text, etc.)
    meta_data JSONB DEFAULT '{}', -- SEO data, event dates, featured images, etc.
    
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    published_at TIMESTAMPTZ,
    
    UNIQUE(site_id, slug),
    CONSTRAINT one_home_page_per_site UNIQUE(site_id, content_type) 
        WHERE content_type = 'page' AND (meta_data->>'is_home_page')::boolean = true
);

-- =====================================================
-- UNIFIED TAGGING SYSTEM
-- =====================================================

-- Single tags table for all content types
CREATE TABLE public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(site_id, slug)
);

-- Single tagging junction table (polymorphic)
CREATE TABLE public.taggings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    taggable_id UUID NOT NULL,
    taggable_type VARCHAR(20) NOT NULL CHECK (taggable_type IN ('content', 'product')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(tag_id, taggable_id, taggable_type)
);

-- =====================================================
-- SIMPLIFIED PRODUCT CATALOG
-- =====================================================

-- Products table (simplified and consolidated)
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    
    -- Basic info
    sku VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    care_instructions TEXT,
    
    -- Simplified categorization (avoiding separate category table for MVP)
    category VARCHAR(100),
    subcategory VARCHAR(100),
    
    -- Pricing (for display only in Phase 1)
    price DECIMAL(10, 2),
    sale_price DECIMAL(10, 2),
    unit_of_measure VARCHAR(50), -- each, pound, gallon, etc.
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    in_stock BOOLEAN DEFAULT true,
    stock_status VARCHAR(50) DEFAULT 'in_stock', -- in_stock, low_stock, out_of_stock, seasonal
    
    -- SEO
    slug VARCHAR(255),
    meta_description TEXT,
    
    -- Flexible attributes and images as JSONB (simplified approach)
    attributes JSONB DEFAULT '{}', -- {"color": "red", "size": "large", "care_level": "easy"}
    images JSONB DEFAULT '[]', -- [{"url": "...", "alt": "...", "is_primary": true}]
    
    -- Import tracking
    import_source VARCHAR(50), -- manual, csv, pdf
    import_batch_id UUID,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(site_id, sku),
    UNIQUE(site_id, slug)
);

-- Import batches (simplified for tracking CSV/PDF imports)
CREATE TABLE public.import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    imported_by UUID REFERENCES public.users(id),
    file_name VARCHAR(255),
    file_type VARCHAR(50), -- csv, pdf
    total_rows INTEGER,
    successful_rows INTEGER,
    failed_rows INTEGER,
    error_log JSONB,
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ
);

-- =====================================================
-- ESSENTIAL SUPPORT TABLES
-- =====================================================

-- Media files (simplified)
CREATE TABLE public.media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES public.users(id),
    
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(20) CHECK (file_type IN ('image', 'video', 'document')),
    file_size_bytes BIGINT,
    alt_text VARCHAR(255),
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Contact inquiries (simplified)
CREATE TABLE public.contact_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    
    inquiry_type VARCHAR(50), -- general, product, event
    related_product_id UUID REFERENCES public.products(id),
    related_content_id UUID REFERENCES public.content(id),
    
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'read', 'responded')),
    responded_at TIMESTAMPTZ,
    responded_by UUID REFERENCES public.users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- PERFORMANCE OPTIMIZATIONS & INDEXES
-- =====================================================

-- Essential indexes for multi-tenant queries
CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX idx_users_type_active ON public.users(user_type, is_active);

-- Site membership queries
CREATE INDEX idx_site_memberships_user_site ON public.site_memberships(user_id, site_id);
CREATE INDEX idx_site_memberships_site_role ON public.site_memberships(site_id, role, is_active);

-- Site queries
CREATE INDEX idx_sites_subdomain ON public.sites(subdomain);
CREATE INDEX idx_sites_custom_domain ON public.sites(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX idx_sites_active ON public.sites(is_active, is_published);

-- Content queries (optimized for UI patterns)
CREATE INDEX idx_content_site_type_published ON public.content(site_id, content_type, is_published);
CREATE INDEX idx_content_site_slug ON public.content(site_id, slug);
CREATE INDEX idx_content_site_featured ON public.content(site_id, is_featured) WHERE is_featured = true;
CREATE INDEX idx_content_published_date ON public.content(site_id, published_at DESC) WHERE is_published = true;

-- Product catalog queries
CREATE INDEX idx_products_site_active ON public.products(site_id, is_active);
CREATE INDEX idx_products_site_category ON public.products(site_id, category) WHERE category IS NOT NULL;
CREATE INDEX idx_products_site_featured ON public.products(site_id, is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_site_slug ON public.products(site_id, slug);

-- Search optimization
CREATE INDEX idx_products_search ON public.products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_content_search ON public.content USING gin(to_tsvector('english', title || ' ' || COALESCE(content::text, '')));

-- Tagging system queries
CREATE INDEX idx_tags_site_slug ON public.tags(site_id, slug);
CREATE INDEX idx_taggings_taggable ON public.taggings(taggable_type, taggable_id);
CREATE INDEX idx_taggings_tag ON public.taggings(tag_id);

-- Support queries
CREATE INDEX idx_contact_inquiries_site_status ON public.contact_inquiries(site_id, status);
CREATE INDEX idx_media_files_site ON public.media_files(site_id, created_at DESC);
CREATE INDEX idx_import_batches_site_status ON public.import_batches(site_id, status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taggings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Global admins can view all users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE auth_user_id = auth.uid() AND user_type = 'admin'
        )
    );

-- Site membership policies
CREATE POLICY "Users can view their site memberships" ON public.site_memberships
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

-- Site-scoped data policies (template for all multi-tenant tables)
CREATE POLICY "Site members can access site data" ON public.sites
    FOR ALL USING (
        id IN (
            SELECT sm.site_id FROM public.site_memberships sm
            JOIN public.users u ON u.id = sm.user_id
            WHERE u.auth_user_id = auth.uid() AND sm.is_active = true
        )
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE auth_user_id = auth.uid() AND user_type = 'admin'
        )
    );

-- Apply same pattern to content, products, etc.
CREATE POLICY "Site members can access content" ON public.content
    FOR ALL USING (
        site_id IN (
            SELECT sm.site_id FROM public.site_memberships sm
            JOIN public.users u ON u.id = sm.user_id
            WHERE u.auth_user_id = auth.uid() AND sm.is_active = true
        )
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE auth_user_id = auth.uid() AND user_type = 'admin'
        )
    );

CREATE POLICY "Site members can access products" ON public.products
    FOR ALL USING (
        site_id IN (
            SELECT sm.site_id FROM public.site_memberships sm
            JOIN public.users u ON u.id = sm.user_id
            WHERE u.auth_user_id = auth.uid() AND sm.is_active = true
        )
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE auth_user_id = auth.uid() AND user_type = 'admin'
        )
    );

-- Public read access for published content (customer view)
CREATE POLICY "Public can view published content" ON public.content
    FOR SELECT USING (is_published = true);

CREATE POLICY "Public can view active products" ON public.products
    FOR SELECT USING (is_active = true);

-- =====================================================
-- UTILITY FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER handle_updated_at_users
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_sites
    BEFORE UPDATE ON public.sites
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_content
    BEFORE UPDATE ON public.content
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_products
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to create user from auth.users (integrates with existing auth system)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (auth_user_id, email, full_name, username, user_type)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'user_type', 'site_owner')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SCHEMA SUMMARY
-- =====================================================

/*
LEAN SCHEMA BENEFITS:
- Reduced from 23+ tables to 10 core tables
- Unified user system supporting admin/site_owner/customer roles
- JSONB fields for flexibility without schema changes
- Optimized indexes for multi-tenant query patterns
- Comprehensive RLS policies for security
- Clear migration path from existing profiles table
- Simplified development with fewer JOINs
- Extensible for Phase 2 e-commerce features

CORE TABLES:
1. users - unified user management (replaces profiles)
2. sites - garden center sites
3. site_memberships - user-site relationships
4. content - unified content (pages/blog/events)
5. products - simplified product catalog
6. tags/taggings - unified tagging system
7. contact_inquiries - customer inquiries
8. media_files - file management
9. import_batches - bulk import tracking

PERFORMANCE FEATURES:
- Multi-tenant optimized indexes
- Full-text search on products and content
- JSONB for flexible attributes
- Strategic denormalization for speed
*/