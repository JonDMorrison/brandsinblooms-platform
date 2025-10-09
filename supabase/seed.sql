-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Clean up existing data (be careful with this in production!)
TRUNCATE TABLE 
    order_shipments,
    order_payments,
    order_status_history,
    order_items,
    orders,
    activity_logs,
    site_performance_metrics,
    site_metrics,
    content,
    products,
    site_memberships,
    sites,
    profiles
CASCADE;

-- Reset auth.users 
DELETE FROM auth.users;

-- Create test users with properly formatted auth schema and all required fields
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    is_sso_user,
    deleted_at
) VALUES 
    ('00000000-0000-0000-0000-000000000000'::uuid, '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 
     'admin@test.com', crypt('password123', gen_salt('bf')), NOW(), 
     '', '', '', '',
     '{"provider": "email", "providers": ["email"]}', '{"full_name": "Admin User"}', NOW(), NOW(), false, NULL),
    ('00000000-0000-0000-0000-000000000000'::uuid, '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated',
     'owner@test.com', crypt('password123', gen_salt('bf')), NOW(),
     '', '', '', '',
     '{"provider": "email", "providers": ["email"]}', '{"full_name": "Site Owner"}', NOW(), NOW(), false, NULL),
    ('00000000-0000-0000-0000-000000000000'::uuid, '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated',
     'editor@test.com', crypt('password123', gen_salt('bf')), NOW(),
     '', '', '', '',
     '{"provider": "email", "providers": ["email"]}', '{"full_name": "Editor User"}', NOW(), NOW(), false, NULL),
    ('00000000-0000-0000-0000-000000000000'::uuid, '44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated',
     'viewer@test.com', crypt('password123', gen_salt('bf')), NOW(),
     '', '', '', '',
     '{"provider": "email", "providers": ["email"]}', '{"full_name": "Viewer User"}', NOW(), NOW(), false, NULL);

-- Create/update profiles (trigger will create them, but we update with additional details)
UPDATE profiles SET 
    full_name = 'Admin User',
    username = 'admin',
    role = 'admin',
    bio = 'Platform administrator'
WHERE user_id = '11111111-1111-1111-1111-111111111111';

UPDATE profiles SET 
    full_name = 'Site Owner',
    username = 'siteowner',
    role = 'site_owner',
    bio = 'Owns multiple sites'
WHERE user_id = '22222222-2222-2222-2222-222222222222';

UPDATE profiles SET 
    full_name = 'Editor User',
    username = 'editor',
    role = 'user',
    bio = 'Content editor'
WHERE user_id = '33333333-3333-3333-3333-333333333333';

UPDATE profiles SET 
    full_name = 'Viewer User',
    username = 'viewer',
    role = 'user',
    bio = 'Read-only access'
WHERE user_id = '44444444-4444-4444-4444-444444444444';

-- Create sites
INSERT INTO sites (id, subdomain, name, description, is_active, is_published, business_name, business_email, business_phone, primary_color)
VALUES 
    ('00000000-0000-0000-0000-000000000001'::uuid, 'dev', 'Development Site', 'Main development site for testing', true, true, 'Dev Corp', 'dev@test.com', '555-0100', '#3B82F6'),
    ('14a3a999-b698-437f-90a8-f89842f10d08'::uuid, 'greenthumb', 'Green Thumb Gardens', 'Your local gardening experts', true, true, 'Green Thumb LLC', 'info@greenthumb.com', '555-0200', '#10B981'),
    ('55555555-5555-5555-5555-555555555555'::uuid, 'techshop', 'Tech Shop Pro', 'Electronics and gadgets store', true, true, 'Tech Shop Inc', 'sales@techshop.com', '555-0300', '#8B5CF6');

-- Create site memberships
INSERT INTO site_memberships (user_id, site_id, role, is_active)
VALUES 
    -- Admin has access to all sites
    ('11111111-1111-1111-1111-111111111111'::uuid, '00000000-0000-0000-0000-000000000001', 'owner', true),
    ('11111111-1111-1111-1111-111111111111'::uuid, '14a3a999-b698-437f-90a8-f89842f10d08', 'owner', true),
    ('11111111-1111-1111-1111-111111111111'::uuid, '55555555-5555-5555-5555-555555555555', 'owner', true),
    
    -- Site owner owns dev and greenthumb
    ('22222222-2222-2222-2222-222222222222'::uuid, '00000000-0000-0000-0000-000000000001', 'owner', true),
    ('22222222-2222-2222-2222-222222222222'::uuid, '14a3a999-b698-437f-90a8-f89842f10d08', 'owner', true),
    
    -- Editor can edit dev site
    ('33333333-3333-3333-3333-333333333333'::uuid, '00000000-0000-0000-0000-000000000001', 'editor', true),
    
    -- Viewer can view dev site
    ('44444444-4444-4444-4444-444444444444'::uuid, '00000000-0000-0000-0000-000000000001', 'viewer', true);

-- Create products for testing
INSERT INTO products (site_id, name, description, price, is_active, category, sku, slug, in_stock)
VALUES 
    ('00000000-0000-0000-0000-000000000001'::uuid, 'Test Product 1', 'A test product', 29.99, true, 'Electronics', 'TEST-001', 'test-product-1', true),
    ('00000000-0000-0000-0000-000000000001'::uuid, 'Test Product 2', 'Another test product', 49.99, true, 'Books', 'TEST-002', 'test-product-2', true),
    ('14a3a999-b698-437f-90a8-f89842f10d08'::uuid, 'Garden Hose', '50ft expandable garden hose', 34.99, true, 'Garden Tools', 'GARDEN-001', 'garden-hose', true),
    ('14a3a999-b698-437f-90a8-f89842f10d08'::uuid, 'Plant Food', 'Organic plant fertilizer', 12.99, true, 'Fertilizers', 'FERT-001', 'plant-food', true),
    ('55555555-5555-5555-5555-555555555555'::uuid, 'Laptop', 'High-performance laptop', 999.99, true, 'Computers', 'TECH-001', 'laptop', true);

-- Create content
-- Generated by scripts/generate-seed-content.ts
-- Ensures seeded sites have comprehensive page sets matching newly created sites
-- Run `pnpm generate-seed-content` to regenerate this section

-- NOTE: This content section was auto-generated. To update:
-- 1. Modify templates in src/lib/content/seed-templates.ts
-- 2. Run: pnpm generate-seed-content > supabase/seed-content-generated.sql
-- 3. Copy the INSERT statement from that file to here

INSERT INTO content (site_id, title, content, slug, is_published, content_type, sort_order, author_id)
VALUES
    ('00000000-0000-0000-0000-000000000001'::uuid, 'Home', '{"version":"1.0","layout":"landing","sections":{"hero":{"type":"hero","order":1,"visible":true,"data":{"headline":"Welcome to Development Site","subheadline":"Building the future of multi-tenant web platforms","ctaText":"Get Started","ctaLink":"/contact","secondaryCtaText":"Learn More","secondaryCtaLink":"/about","features":["Rapid development environment","Complete feature testing","Multi-tenant architecture","Production-ready templates"]}},"features":{"type":"features","order":2,"visible":true,"data":{"headline":"Why Choose Us","description":"A comprehensive testing environment for the Brands in Blooms platform, featuring all available page types and content templates.","features":["Comprehensive testing environment","All feature types available","Real-world usage examples"]},"settings":{"backgroundColor":"alternate"}},"cta":{"type":"cta","order":3,"visible":true,"data":{"headline":"Ready to Get Started?","description":"Join us at Dev Corp and experience the difference.","ctaText":"Contact Us Today","ctaLink":"/contact"},"settings":{"backgroundColor":"primary"}}}}', 'home', true, 'landing', 10, '11111111-1111-1111-1111-111111111111'::uuid),
    ('00000000-0000-0000-0000-000000000001'::uuid, 'About', '{"version":"1.0","layout":"about","sections":{"header":{"type":"header","order":1,"visible":true,"data":{"headline":"About Development Site","subheadline":"Dev Corp was created to provide developers with a comprehensive testing environment that mirrors real-world multi-tenant applications. Our platform demonstrates best practices in modern web development."},"settings":{"backgroundColor":"default"}},"values":{"type":"features","order":2,"visible":true,"data":{"headline":"Our Mission","description":"To empower developers with robust, production-ready templates and testing environments.","features":["Innovation in web development","Developer experience first","Open source collaboration"]},"settings":{"backgroundColor":"alternate"}},"team":{"type":"richText","order":3,"visible":true,"data":{"headline":"Our Team","content":"<p>Our team brings together years of experience and passion for web development and platform engineering. We''re committed to providing you with the best possible experience.</p>"},"settings":{"backgroundColor":"default"}}}}', 'about', true, 'about', 20, '11111111-1111-1111-1111-111111111111'),
    ('00000000-0000-0000-0000-000000000001'::uuid, 'Contact', '{"version":"1.0","layout":"contact","sections":{"header":{"type":"header","order":1,"visible":true,"data":{"headline":"Get in Touch","subheadline":"We''d love to hear from you. Contact Dev Corp today."},"settings":{"backgroundColor":"default"}},"contactForm":{"type":"contactForm","order":2,"visible":true,"data":{"headline":"Send Us a Message","description":"Fill out the form below and we''ll get back to you as soon as possible."},"settings":{"backgroundColor":"default"}},"contactInfo":{"type":"richText","order":3,"visible":true,"data":{"headline":"Other Ways to Reach Us","content":"<p><strong>Location:</strong> Silicon Valley</p>\n<p><strong>Email:</strong> Contact us through the form above</p>\n<p><strong>Hours:</strong> Monday-Friday, 9:00 AM - 5:00 PM PST</p>"},"settings":{"backgroundColor":"alternate"}}}}', 'contact', true, 'contact', 80, '11111111-1111-1111-1111-111111111111'),
    -- NOTE: Privacy and Terms content truncated for brevity in seed.sql
    -- Full templates available in src/lib/content/seed-templates.ts
    ('00000000-0000-0000-0000-000000000001'::uuid, 'Privacy Policy', '{"version":"1.0","layout":"other"}', 'privacy', true, 'other', 90, '11111111-1111-1111-1111-111111111111'),
    ('00000000-0000-0000-0000-000000000001'::uuid, 'Terms of Service', '{"version":"1.0","layout":"other"}', 'terms', true, 'other', 100, '11111111-1111-1111-1111-111111111111'),
    ('14a3a999-b698-437f-90a8-f89842f10d08'::uuid, 'Home', '{"version":"1.0","layout":"landing","sections":{"hero":{"type":"hero","order":1,"visible":true,"data":{"headline":"Welcome to Green Thumb Gardens","subheadline":"Growing green, naturally","ctaText":"Get Started","ctaLink":"/contact","secondaryCtaText":"Learn More","secondaryCtaLink":"/about","features":["Expert horticultural guidance","Premium plant selection","Comprehensive care resources","Local climate expertise"]}},"features":{"type":"features","order":2,"visible":true,"data":{"headline":"Why Choose Us","description":"Your trusted local gardening experts, offering premium plants, expert care advice, and sustainable gardening solutions for the Pacific Northwest.","features":["Over 20 years of horticultural expertise","Locally sourced, sustainably grown plants","Free lifetime plant care support"]},"settings":{"backgroundColor":"alternate"}},"cta":{"type":"cta","order":3,"visible":true,"data":{"headline":"Ready to Get Started?","description":"Join us at Green Thumb LLC and experience the difference.","ctaText":"Contact Us Today","ctaLink":"/contact"},"settings":{"backgroundColor":"primary"}}}}', 'home', true, 'landing', 10, '11111111-1111-1111-1111-111111111111'),
    ('14a3a999-b698-437f-90a8-f89842f10d08'::uuid, 'About', '{"version":"1.0","layout":"about","sections":{"header":{"type":"header","order":1,"visible":true,"data":{"headline":"About Green Thumb Gardens","subheadline":"Founded by master horticulturists in Portland, Oregon, Green Thumb LLC has been serving the local community for over two decades. We believe that everyone can cultivate a thriving garden with the right guidance and quality plants."},"settings":{"backgroundColor":"default"}},"values":{"type":"features","order":2,"visible":true,"data":{"headline":"Our Mission","description":"To make sustainable gardening accessible to everyone through expert guidance and premium plants.","features":["Sustainability and organic practices","Local community engagement","Horticultural education"]},"settings":{"backgroundColor":"alternate"}},"team":{"type":"richText","order":3,"visible":true,"data":{"headline":"Our Team","content":"<p>Our team brings together years of experience and passion for horticulture and sustainable gardening. We''re committed to providing you with the best possible experience.</p>"},"settings":{"backgroundColor":"default"}}}}', 'about', true, 'about', 20, '11111111-1111-1111-1111-111111111111'),
    ('14a3a999-b698-437f-90a8-f89842f10d08'::uuid, 'Contact', '{"version":"1.0","layout":"contact","sections":{"header":{"type":"header","order":1,"visible":true,"data":{"headline":"Get in Touch","subheadline":"We''d love to hear from you. Contact Green Thumb LLC today."},"settings":{"backgroundColor":"default"}},"contactForm":{"type":"contactForm","order":2,"visible":true,"data":{"headline":"Send Us a Message","description":"Fill out the form below and we''ll get back to you as soon as possible."},"settings":{"backgroundColor":"default"}},"contactInfo":{"type":"richText","order":3,"visible":true,"data":{"headline":"Other Ways to Reach Us","content":"<p><strong>Location:</strong> Portland, Oregon</p>\n<p><strong>Email:</strong> Contact us through the form above</p>\n<p><strong>Hours:</strong> Monday-Friday, 9:00 AM - 5:00 PM PST</p>"},"settings":{"backgroundColor":"alternate"}}}}', 'contact', true, 'contact', 80, '11111111-1111-1111-1111-111111111111'),
    ('14a3a999-b698-437f-90a8-f89842f10d08'::uuid, 'Privacy Policy', '{"version":"1.0","layout":"other"}', 'privacy', true, 'other', 90, '11111111-1111-1111-1111-111111111111'),
    ('14a3a999-b698-437f-90a8-f89842f10d08'::uuid, 'Terms of Service', '{"version":"1.0","layout":"other"}', 'terms', true, 'other', 100, '11111111-1111-1111-1111-111111111111'),
    ('14a3a999-b698-437f-90a8-f89842f10d08'::uuid, 'Seasonal Plant Care Guide', '{"version":"1.0","layout":"other"}', 'seasonal-guide', true, 'other', 110, '11111111-1111-1111-1111-111111111111'),
    ('14a3a999-b698-437f-90a8-f89842f10d08'::uuid, 'About Our Company', '{"version":"1.0","layout":"other"}', 'company', true, 'other', 120, '11111111-1111-1111-1111-111111111111'),
    ('14a3a999-b698-437f-90a8-f89842f10d08'::uuid, 'Watering 101', '{"version":"1.0","layout":"other"}', 'watering', true, 'other', 130, '11111111-1111-1111-1111-111111111111'),
    ('14a3a999-b698-437f-90a8-f89842f10d08'::uuid, 'Light Requirements Explained', '{"version":"1.0","layout":"other"}', 'lighting', true, 'other', 140, '11111111-1111-1111-1111-111111111111'),
    ('14a3a999-b698-437f-90a8-f89842f10d08'::uuid, 'Soil & Repotting Guide', '{"version":"1.0","layout":"other"}', 'soil', true, 'other', 150, '11111111-1111-1111-1111-111111111111'),
    ('14a3a999-b698-437f-90a8-f89842f10d08'::uuid, 'Common Pests & Problems', '{"version":"1.0","layout":"other"}', 'pests', true, 'other', 160, '11111111-1111-1111-1111-111111111111'),
    ('55555555-5555-5555-5555-555555555555'::uuid, 'Home', '{"version":"1.0","layout":"landing","sections":{"hero":{"type":"hero","order":1,"visible":true,"data":{"headline":"Welcome to Tech Shop Pro","subheadline":"Technology made simple","ctaText":"Get Started","ctaLink":"/contact","secondaryCtaText":"Learn More","secondaryCtaLink":"/about","features":["Latest technology products","Expert tech support","Competitive pricing","Fast, reliable shipping"]}},"features":{"type":"features","order":2,"visible":true,"data":{"headline":"Why Choose Us","description":"Your one-stop shop for cutting-edge electronics, gadgets, and tech accessories. Expert support and competitive prices on all the latest technology.","features":["Latest tech from top brands","Expert product recommendations","Hassle-free returns and warranty"]},"settings":{"backgroundColor":"alternate"}},"cta":{"type":"cta","order":3,"visible":true,"data":{"headline":"Ready to Get Started?","description":"Join us at Tech Shop Inc and experience the difference.","ctaText":"Contact Us Today","ctaLink":"/contact"},"settings":{"backgroundColor":"primary"}}}}', 'home', true, 'landing', 10, '11111111-1111-1111-1111-111111111111'),
    ('55555555-5555-5555-5555-555555555555'::uuid, 'About', '{"version":"1.0","layout":"about","sections":{"header":{"type":"header","order":1,"visible":true,"data":{"headline":"About Tech Shop Pro","subheadline":"Tech Shop Inc started in Austin, Texas with a simple goal: make technology accessible to everyone. We curate the best tech products and provide expert guidance to help you make informed decisions."},"settings":{"backgroundColor":"default"}},"values":{"type":"features","order":2,"visible":true,"data":{"headline":"Our Mission","description":"To democratize technology by providing expert advice and competitive prices.","features":["Customer education and support","Quality over quantity","Innovation and accessibility"]},"settings":{"backgroundColor":"alternate"}},"team":{"type":"richText","order":3,"visible":true,"data":{"headline":"Our Team","content":"<p>Our team brings together years of experience and passion for technology and customer service. We''re committed to providing you with the best possible experience.</p>"},"settings":{"backgroundColor":"default"}}}}', 'about', true, 'about', 20, '11111111-1111-1111-1111-111111111111'),
    ('55555555-5555-5555-5555-555555555555'::uuid, 'Contact', '{"version":"1.0","layout":"contact","sections":{"header":{"type":"header","order":1,"visible":true,"data":{"headline":"Get in Touch","subheadline":"We''d love to hear from you. Contact Tech Shop Inc today."},"settings":{"backgroundColor":"default"}},"contactForm":{"type":"contactForm","order":2,"visible":true,"data":{"headline":"Send Us a Message","description":"Fill out the form below and we''ll get back to you as soon as possible."},"settings":{"backgroundColor":"default"}},"contactInfo":{"type":"richText","order":3,"visible":true,"data":{"headline":"Other Ways to Reach Us","content":"<p><strong>Location:</strong> Austin, Texas</p>\n<p><strong>Email:</strong> Contact us through the form above</p>\n<p><strong>Hours:</strong> Monday-Friday, 9:00 AM - 5:00 PM CST</p>"},"settings":{"backgroundColor":"alternate"}}}}', 'contact', true, 'contact', 80, '11111111-1111-1111-1111-111111111111'),
    ('55555555-5555-5555-5555-555555555555'::uuid, 'Privacy Policy', '{"version":"1.0","layout":"other"}', 'privacy', true, 'other', 90, '11111111-1111-1111-1111-111111111111'::uuid),
    ('55555555-5555-5555-5555-555555555555'::uuid, 'Terms of Service', '{"version":"1.0","layout":"other"}', 'terms', true, 'other', 100, '11111111-1111-1111-1111-111111111111'::uuid);

-- Orders table requires customer_id from auth.users - skip for now as it's complex

-- Create site metrics (historical data for charts)
-- Only using columns that exist: unique_visitors, page_views, content_count, product_count, inquiry_count
INSERT INTO site_metrics (site_id, metric_date, unique_visitors, page_views, content_count, product_count, inquiry_count)
VALUES 
    -- Current week data for dev site
    ('00000000-0000-0000-0000-000000000001', CURRENT_DATE, 45, 150, 2, 2, 5),
    ('00000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '1 day', 38, 120, 2, 2, 3),
    ('00000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '2 days', 55, 180, 2, 2, 8),
    ('00000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '3 days', 62, 200, 2, 2, 10),
    ('00000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '4 days', 30, 95, 2, 2, 2),
    ('00000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '5 days', 35, 110, 2, 2, 4),
    ('00000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '6 days', 42, 140, 2, 2, 6),
    
    -- Last week data
    ('00000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '7 days', 48, 160, 2, 2, 7),
    ('00000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '14 days', 40, 130, 2, 2, 5),
    
    -- Month ago data for comparison
    ('00000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '30 days', 32, 100, 2, 2, 3),
    
    -- Data for other sites
    ('14a3a999-b698-437f-90a8-f89842f10d08', CURRENT_DATE, 65, 200, 1, 2, 12),
    ('55555555-5555-5555-5555-555555555555', CURRENT_DATE, 110, 350, 1, 1, 20);

-- Create site performance metrics (using correct column names)
INSERT INTO site_performance_metrics (site_id, unique_visitors, page_views, sessions, bounce_rate, avg_session_duration_seconds, avg_page_load_time_ms, recorded_at)
VALUES 
    -- Recent performance data for dev site
    ('00000000-0000-0000-0000-000000000001', 45, 150, 50, 35.5, 185, 1200, NOW()),
    ('00000000-0000-0000-0000-000000000001', 42, 140, 48, 36.2, 180, 1300, NOW() - INTERVAL '1 hour'),
    ('00000000-0000-0000-0000-000000000001', 50, 165, 55, 32.8, 195, 1100, NOW() - INTERVAL '2 hours'),
    
    -- Performance data for other sites
    ('14a3a999-b698-437f-90a8-f89842f10d08', 65, 200, 70, 28.5, 220, 1000, NOW()),
    ('55555555-5555-5555-5555-555555555555', 110, 350, 120, 25.0, 250, 1500, NOW());

-- Create activity logs (using correct columns)
INSERT INTO activity_logs (site_id, user_id, activity_type, entity_type, entity_id, title, description, metadata)
VALUES 
    ('00000000-0000-0000-0000-000000000001'::uuid, '22222222-2222-2222-2222-222222222222', 'create', 'content', gen_random_uuid(), 'Created new blog post', 'User created "Spring Tips" blog post', '{"action": "create_content"}'),
    ('00000000-0000-0000-0000-000000000001'::uuid, '33333333-3333-3333-3333-333333333333', 'update', 'product', gen_random_uuid(), 'Updated product price', 'Changed price from $29.99 to $24.99', '{"action": "update_product"}'),
    ('00000000-0000-0000-0000-000000000001'::uuid, '22222222-2222-2222-2222-222222222222', 'create', 'order', gen_random_uuid(), 'New order received', 'Order #001 from John Doe', '{"action": "process_order"}'),
    ('00000000-0000-0000-0000-000000000001'::uuid, '22222222-2222-2222-2222-222222222222', 'update', 'site', '00000000-0000-0000-0000-000000000001'::uuid, 'Site settings updated', 'Business hours changed', '{"action": "update_settings"}');

-- Output confirmation
DO $$
BEGIN
    RAISE NOTICE 'Test data created successfully!';
    RAISE NOTICE 'Site ID: 00000000-0000-0000-0000-000000000001';
    RAISE NOTICE '';
    RAISE NOTICE 'Test users (password for all: password123):';
    RAISE NOTICE '  Admin: admin@test.com (role: admin)';
    RAISE NOTICE '  Owner: owner@test.com (role: site_owner)';
    RAISE NOTICE '  Editor: editor@test.com (role: user, site role: editor)';
    RAISE NOTICE '  Viewer: viewer@test.com (role: user, site role: viewer)';
    RAISE NOTICE '';
    RAISE NOTICE 'Sites created:';
    RAISE NOTICE '  - dev (Development Site)';
    RAISE NOTICE '  - greenthumb (Green Thumb Gardens)';
    RAISE NOTICE '  - techshop (Tech Shop Pro)';
END $$;