-- Development Seed Data Migration
-- Creates default site for local development to prevent site resolution errors

-- =====================================================
-- DEVELOPMENT SITE SETUP
-- =====================================================

-- Insert development site with 'dev' subdomain
-- This resolves the "Site with subdomain 'dev' not found" error in fresh installs
INSERT INTO public.sites (
    id,
    subdomain,
    name,
    description,
    business_name,
    business_email,
    primary_color,
    is_active,
    is_published,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'dev',
    'Development Site',
    'Default development site for localhost testing',
    'Dev Garden Center',
    'dev@example.com',
    '#10b981',
    true,
    true,
    NOW(),
    NOW()
) ON CONFLICT (subdomain) DO NOTHING;

-- Add some sample content for the development site
INSERT INTO public.content (
    id,
    site_id,
    content_type,
    title,
    slug,
    content,
    meta_data,
    is_published,
    is_featured,
    created_at,
    updated_at,
    published_at
) VALUES (
    '00000000-0000-0000-0000-000000000010'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'page',
    'Welcome to Development',
    'home',
    '{"blocks": [{"type": "hero", "content": {"title": "Welcome to Development Site", "subtitle": "This is a development environment for testing the Brands in Blooms platform."}}]}',
    '{"meta_title": "Development Site", "meta_description": "Development environment for Brands in Blooms platform"}',
    true,
    true,
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (site_id, slug) DO NOTHING;

-- Add a sample product for testing
INSERT INTO public.products (
    id,
    site_id,
    sku,
    name,
    description,
    category,
    price,
    slug,
    is_active,
    is_featured,
    in_stock,
    attributes,
    images,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000020'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'DEV-PLANT-001',
    'Development Test Plant',
    'A sample plant for testing the development environment.',
    'Indoor Plants',
    29.99,
    'development-test-plant',
    true,
    true,
    true,
    '{"light": "bright indirect", "water": "weekly", "difficulty": "easy"}',
    '[]',
    NOW(),
    NOW()
) ON CONFLICT (site_id, sku) DO NOTHING;

-- =====================================================
-- DEVELOPMENT SITE CONFIGURATION
-- =====================================================

-- Comment for documentation
COMMENT ON TABLE public.sites IS 'Garden center sites in the multi-tenant platform. Includes development seed data for localhost testing.';

-- Log the creation of development data
DO $$
BEGIN
    RAISE NOTICE 'Development seed data migration completed successfully';
    RAISE NOTICE 'Created development site with subdomain "dev" for localhost testing';
    RAISE NOTICE 'Access at: http://localhost:3001 (will resolve to subdomain "dev")';
END $$;