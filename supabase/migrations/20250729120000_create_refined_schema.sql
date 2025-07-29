-- Brands in Blooms Platform - Refined Schema Migration
-- Creates lean, optimized multi-tenant schema
-- Integrates with existing profiles table for smooth transition

-- =====================================================
-- UNIFIED USER SYSTEM (extends existing profiles)
-- =====================================================

-- First, update the existing profiles table to align with new schema
-- Add user_type column to existing profiles table
ALTER TABLE public.profiles ADD COLUMN user_type VARCHAR(20);

-- Update existing profiles to have site_owner type (since they're managing sites)
UPDATE public.profiles SET user_type = 'site_owner' WHERE user_type IS NULL;

-- Add constraint after update
ALTER TABLE public.profiles ADD CONSTRAINT check_user_type 
    CHECK (user_type IN ('admin', 'site_owner', 'customer'));

-- Make user_type NOT NULL after populating data
ALTER TABLE public.profiles ALTER COLUMN user_type SET NOT NULL;

-- For future migration path, document the target users table structure
-- This will eventually replace the profiles table in a future migration
/*
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('admin', 'site_owner', 'customer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
*/

-- =====================================================
-- MULTI-TENANT CORE TABLES
-- =====================================================

-- Sites table (garden center sites)
CREATE TABLE public.sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subdomain VARCHAR(63) UNIQUE NOT NULL,
    custom_domain VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Essential branding only
    logo_url TEXT,
    primary_color VARCHAR(7),
    
    -- Essential business info
    business_name VARCHAR(255),
    business_email VARCHAR(255),
    business_phone VARCHAR(50),
    business_address TEXT,
    business_hours JSONB,
    
    -- Location
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    
    is_active BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Site memberships (user-site relationships)
CREATE TABLE public.site_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- References profiles.user_id initially
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, site_id)
);

-- =====================================================
-- UNIFIED CONTENT SYSTEM
-- =====================================================

-- Single content table (replaces separate pages, blog_posts, events tables)
CREATE TABLE public.content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id),
    
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('page', 'blog_post', 'event')),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    content JSONB NOT NULL,
    meta_data JSONB DEFAULT '{}',
    
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    published_at TIMESTAMPTZ,
    
    UNIQUE(site_id, slug)
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
    
    -- Simplified categorization
    category VARCHAR(100),
    subcategory VARCHAR(100),
    
    -- Pricing
    price DECIMAL(10, 2),
    sale_price DECIMAL(10, 2),
    unit_of_measure VARCHAR(50),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    in_stock BOOLEAN DEFAULT true,
    stock_status VARCHAR(50) DEFAULT 'in_stock',
    
    -- SEO
    slug VARCHAR(255),
    meta_description TEXT,
    
    -- Flexible attributes and images as JSONB
    attributes JSONB DEFAULT '{}',
    images JSONB DEFAULT '[]',
    
    -- Import tracking
    import_source VARCHAR(50),
    import_batch_id UUID,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(site_id, sku),
    UNIQUE(site_id, slug)
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
-- ESSENTIAL SUPPORT TABLES
-- =====================================================

-- Contact inquiries (simplified)
CREATE TABLE public.contact_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    
    inquiry_type VARCHAR(50),
    related_product_id UUID REFERENCES public.products(id),
    related_content_id UUID REFERENCES public.content(id),
    
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'read', 'responded')),
    responded_at TIMESTAMPTZ,
    responded_by UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Media files (simplified)
CREATE TABLE public.media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES auth.users(id),
    
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(20) CHECK (file_type IN ('image', 'video', 'document')),
    file_size_bytes BIGINT,
    alt_text VARCHAR(255),
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Import batches (simplified for tracking CSV/PDF imports)
CREATE TABLE public.import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    imported_by UUID REFERENCES auth.users(id),
    file_name VARCHAR(255),
    file_type VARCHAR(50),
    total_rows INTEGER,
    successful_rows INTEGER,
    failed_rows INTEGER,
    error_log JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ
);

-- =====================================================
-- PERFORMANCE OPTIMIZATIONS & INDEXES
-- =====================================================

-- Essential indexes for multi-tenant queries
CREATE INDEX idx_profiles_user_type ON public.profiles(user_type) WHERE user_type IS NOT NULL;

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

-- Enable RLS on new tables
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taggings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;

-- Basic policies for site-based access
-- Note: More specific policies can be added later based on actual usage patterns

-- Allow authenticated users to read their own site memberships
CREATE POLICY "authenticated_site_memberships" ON public.site_memberships
    FOR ALL USING (auth.role() = 'authenticated');

-- Allow read access to published content for everyone
CREATE POLICY "public_content_read" ON public.content
    FOR SELECT USING (is_published = true);

-- Allow authenticated users to manage content (simplified for MVP)
CREATE POLICY "authenticated_content_manage" ON public.content
    FOR ALL USING (auth.role() = 'authenticated');

-- Allow read access to active products for everyone
CREATE POLICY "public_products_read" ON public.products
    FOR SELECT USING (is_active = true);

-- Allow authenticated users to manage products (simplified for MVP)
CREATE POLICY "authenticated_products_manage" ON public.products
    FOR ALL USING (auth.role() = 'authenticated');

-- Allow authenticated users to manage sites, tags, etc.
CREATE POLICY "authenticated_sites" ON public.sites
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_tags" ON public.tags
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_taggings" ON public.taggings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_inquiries" ON public.contact_inquiries
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_media" ON public.media_files
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_imports" ON public.import_batches
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- This migration creates the refined schema for Brands in Blooms platform
-- Next steps:
-- 1. Test the new schema with sample data
-- 2. Update application code to use new table structures
-- 3. Implement more specific RLS policies as needed
-- 4. Add updated_at triggers in a future migration if needed

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.sites IS 'Garden center sites in the multi-tenant platform';
COMMENT ON TABLE public.site_memberships IS 'User-site relationships with role-based access';
COMMENT ON TABLE public.content IS 'Unified content table for pages, blog posts, and events';
COMMENT ON TABLE public.products IS 'Simplified product catalog with JSONB attributes';
COMMENT ON TABLE public.tags IS 'Unified tagging system for all content types';
COMMENT ON TABLE public.taggings IS 'Polymorphic junction table for tags';

COMMENT ON COLUMN public.products.attributes IS 'JSONB field for flexible product attributes';
COMMENT ON COLUMN public.products.images IS 'JSONB array of product images';
COMMENT ON COLUMN public.content.content IS 'JSONB field for flexible content blocks';
COMMENT ON COLUMN public.content.meta_data IS 'JSONB field for SEO, event dates, etc.';