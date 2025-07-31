-- =====================================================
-- Brands in Blooms Platform - Simple Seed Data
-- =====================================================
-- This creates minimal test data for development
-- This file is used to populate the database with initial data for development
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. CREATE A TEST USER (if not exists)
-- =====================================================

-- Insert a test user into auth.users if it doesn't exist
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
    '86e5fae8-203c-4cbe-9746-3389b4a05ee8',
    'admin@greenthumbgardens.com',
    crypt('password123', gen_salt('bf')), -- Test password
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- The profile will be created automatically by the trigger
-- Just update it with additional details
UPDATE public.profiles 
SET 
    username = 'greenthumb_admin',
    full_name = 'Admin User (Sarah)',
    bio = 'Platform administrator and owner of Green Thumb Gardens',
    avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    phone = '555-0100',
    role = 'admin' -- Make this user an admin
WHERE user_id = '86e5fae8-203c-4cbe-9746-3389b4a05ee8';

-- =====================================================
-- 2. CREATE A TEST SITE
-- =====================================================

INSERT INTO public.sites (
    subdomain, name, description, logo_url, primary_color,
    business_name, business_email, business_phone, business_address,
    business_hours, latitude, longitude, timezone, is_active, is_published
) VALUES (
    'greenthumb',
    'Green Thumb Gardens',
    'Your local source for quality plants, garden supplies, and expert advice since 1985.',
    'https://api.dicebear.com/7.x/shapes/svg?seed=greenthumb',
    '#10B981',
    'Green Thumb Gardens LLC',
    'info@greenthumbgardens.com',
    '555-0101',
    '123 Garden Way, Portland, OR 97201',
    '{"monday": "9:00 AM - 6:00 PM", "tuesday": "9:00 AM - 6:00 PM", "wednesday": "9:00 AM - 6:00 PM", "thursday": "9:00 AM - 7:00 PM", "friday": "9:00 AM - 7:00 PM", "saturday": "8:00 AM - 6:00 PM", "sunday": "10:00 AM - 5:00 PM"}'::jsonb,
    45.5152,
    -122.6784,
    'America/Los_Angeles',
    true,
    true
);

-- Get the site ID for reference
DO $$
DECLARE
    site_id UUID;
    user_id UUID := '86e5fae8-203c-4cbe-9746-3389b4a05ee8';
BEGIN
    SELECT id INTO site_id FROM sites WHERE subdomain = 'greenthumb' LIMIT 1;
    
    -- Create site membership
    INSERT INTO public.site_memberships (user_id, site_id, role, is_active)
    VALUES (user_id, site_id, 'owner', true);
    
    -- Create some products
    INSERT INTO public.products (
        site_id, sku, name, description, care_instructions,
        category, subcategory, price, sale_price, unit_of_measure,
        is_active, is_featured, in_stock, stock_status, slug,
        meta_description, attributes, images
    ) VALUES
        (
            site_id,
            'GTG-SUC-001',
            'Assorted Succulent Collection',
            'A beautiful collection of 6 different succulent varieties, perfect for beginners.',
            'Water sparingly, allowing soil to dry completely between waterings. Bright indirect light.',
            'Plants',
            'Succulents',
            29.99,
            24.99,
            'per collection',
            true,
            true,
            true,
            'in_stock',
            'assorted-succulent-collection',
            'Beautiful collection of 6 different succulent varieties.',
            '{"light_requirements": "Bright indirect", "water_needs": "Low", "pet_friendly": true, "size": "2-4 inches"}'::jsonb,
            '[{"url": "https://images.unsplash.com/photo-1459156212016-c812468e2115", "alt": "Succulent collection", "is_primary": true}]'::jsonb
        ),
        (
            site_id,
            'GTG-FER-002',
            'Boston Fern',
            'Classic houseplant with lush, feathery fronds.',
            'Keep soil consistently moist. High humidity preferred. Indirect light.',
            'Plants',
            'Ferns',
            34.99,
            null,
            'per plant',
            true,
            false,
            true,
            'in_stock',
            'boston-fern',
            'Boston Fern - Classic houseplant with lush fronds.',
            '{"light_requirements": "Indirect", "water_needs": "High", "pet_friendly": true, "size": "12-18 inches"}'::jsonb,
            '[{"url": "https://images.unsplash.com/photo-1593691509543-c55fb32caba6", "alt": "Boston Fern", "is_primary": true}]'::jsonb
        ),
        (
            site_id,
            'GTG-POT-003',
            'Ceramic Planter Set',
            'Set of 3 modern ceramic planters with drainage holes.',
            null,
            'Accessories',
            'Planters',
            45.99,
            null,
            'per set',
            true,
            true,
            true,
            'in_stock',
            'ceramic-planter-set',
            'Modern ceramic planter set - 3 sizes.',
            '{"material": "Ceramic", "colors": ["White", "Gray", "Terracotta"], "sizes": ["4\", 6\", 8\""], "drainage": true}'::jsonb,
            '[{"url": "https://images.unsplash.com/photo-1485955900006-10f4d324d411", "alt": "Ceramic planters", "is_primary": true}]'::jsonb
        );
    
    -- Create tags
    INSERT INTO public.tags (site_id, name, slug, description)
    VALUES
        (site_id, 'Beginner Friendly', 'beginner-friendly', 'Perfect for those new to plant care'),
        (site_id, 'Pet Safe', 'pet-safe', 'Non-toxic to cats and dogs'),
        (site_id, 'Low Light', 'low-light', 'Thrives in low light conditions');
    
    -- Create content (without author_id to avoid foreign key issues)
    INSERT INTO public.content (
        site_id, content_type, title, slug, content,
        meta_data, is_published, is_featured, published_at
    ) VALUES
        (
            site_id,
            'page',
            'About Us',
            'about',
            '{"blocks": [{"type": "heading", "content": "Our Story"}, {"type": "paragraph", "content": "Green Thumb Gardens has been serving Portland plant lovers since 1985. We are passionate about bringing the joy of gardening to everyone."}]}'::jsonb,
            '{"page_order": 1}'::jsonb,
            true,
            false,
            NOW()
        ),
        (
            site_id,
            'blog_post',
            '10 Essential Tips for Indoor Plant Care',
            '10-essential-tips-indoor-plant-care',
            '{"blocks": [{"type": "paragraph", "content": "Indoor plants can transform your living space. Here are our top tips for success."}]}'::jsonb,
            '{"excerpt": "Master indoor plant care with these tips.", "read_time": "5 min"}'::jsonb,
            true,
            true,
            NOW()
        );
    
    -- Create site metrics for today
    INSERT INTO public.site_metrics (site_id, metric_date, unique_visitors, page_views, content_count, product_count, inquiry_count)
    VALUES (
        site_id,
        CURRENT_DATE,
        150,    -- unique_visitors
        450,    -- page_views  
        2,      -- content_count (from the content we just created)
        3,      -- product_count (from the products we just created)
        0       -- inquiry_count (no inquiries yet)
    );
    
    RAISE NOTICE 'Test data created successfully!';
    RAISE NOTICE 'Site ID: %', site_id;
END $$;