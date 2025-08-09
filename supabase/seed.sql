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
    ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 
     'admin@test.com', crypt('password123', gen_salt('bf')), NOW(), 
     '', '', '', '',
     '{"provider": "email", "providers": ["email"]}', '{"full_name": "Admin User"}', NOW(), NOW(), false, NULL),
    ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated',
     'owner@test.com', crypt('password123', gen_salt('bf')), NOW(),
     '', '', '', '',
     '{"provider": "email", "providers": ["email"]}', '{"full_name": "Site Owner"}', NOW(), NOW(), false, NULL),
    ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated',
     'editor@test.com', crypt('password123', gen_salt('bf')), NOW(),
     '', '', '', '',
     '{"provider": "email", "providers": ["email"]}', '{"full_name": "Editor User"}', NOW(), NOW(), false, NULL),
    ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated',
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
    ('00000000-0000-0000-0000-000000000001', 'dev', 'Development Site', 'Main development site for testing', true, true, 'Dev Corp', 'dev@test.com', '555-0100', '#3B82F6'),
    ('14a3a999-b698-437f-90a8-f89842f10d08', 'greenthumb', 'Green Thumb Gardens', 'Your local gardening experts', true, true, 'Green Thumb LLC', 'info@greenthumb.com', '555-0200', '#10B981'),
    ('55555555-5555-5555-5555-555555555555', 'techshop', 'Tech Shop Pro', 'Electronics and gadgets store', true, true, 'Tech Shop Inc', 'sales@techshop.com', '555-0300', '#8B5CF6');

-- Create site memberships
INSERT INTO site_memberships (user_id, site_id, role, is_active)
VALUES 
    -- Admin has access to all sites
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'owner', true),
    ('11111111-1111-1111-1111-111111111111', '14a3a999-b698-437f-90a8-f89842f10d08', 'owner', true),
    ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'owner', true),
    
    -- Site owner owns dev and greenthumb
    ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'owner', true),
    ('22222222-2222-2222-2222-222222222222', '14a3a999-b698-437f-90a8-f89842f10d08', 'owner', true),
    
    -- Editor can edit dev site
    ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'editor', true),
    
    -- Viewer can view dev site
    ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', 'viewer', true);

-- Create products for testing
INSERT INTO products (site_id, name, description, price, is_active, category, sku, slug, in_stock)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Test Product 1', 'A test product', 29.99, true, 'Electronics', 'TEST-001', 'test-product-1', true),
    ('00000000-0000-0000-0000-000000000001', 'Test Product 2', 'Another test product', 49.99, true, 'Books', 'TEST-002', 'test-product-2', true),
    ('14a3a999-b698-437f-90a8-f89842f10d08', 'Garden Hose', '50ft expandable garden hose', 34.99, true, 'Garden Tools', 'GARDEN-001', 'garden-hose', true),
    ('14a3a999-b698-437f-90a8-f89842f10d08', 'Plant Food', 'Organic plant fertilizer', 12.99, true, 'Fertilizers', 'FERT-001', 'plant-food', true),
    ('55555555-5555-5555-5555-555555555555', 'Laptop', 'High-performance laptop', 999.99, true, 'Computers', 'TECH-001', 'laptop', true);

-- Create content
INSERT INTO content (site_id, title, content, slug, is_published, content_type)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Welcome to Dev Site', '{"blocks": [{"type": "paragraph", "content": "This is the development site content."}]}', 'welcome', true, 'page'),
    ('00000000-0000-0000-0000-000000000001', 'About Us', '{"blocks": [{"type": "paragraph", "content": "Learn more about our development team."}]}', 'about', true, 'page'),
    ('14a3a999-b698-437f-90a8-f89842f10d08', 'Spring Gardening Tips', '{"blocks": [{"type": "paragraph", "content": "Get your garden ready for spring!"}]}', 'spring-tips', true, 'blog_post'),
    ('55555555-5555-5555-5555-555555555555', 'Latest Tech Deals', '{"blocks": [{"type": "paragraph", "content": "Check out our amazing deals!"}]}', 'deals', true, 'blog_post');

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
    ('00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'create', 'content', gen_random_uuid(), 'Created new blog post', 'User created "Spring Tips" blog post', '{"action": "create_content"}'),
    ('00000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'update', 'product', gen_random_uuid(), 'Updated product price', 'Changed price from $29.99 to $24.99', '{"action": "update_product"}'),
    ('00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'create', 'order', gen_random_uuid(), 'New order received', 'Order #001 from John Doe', '{"action": "process_order"}'),
    ('00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'update', 'site', '00000000-0000-0000-0000-000000000001', 'Site settings updated', 'Business hours changed', '{"action": "update_settings"}');

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