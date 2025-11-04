-- =====================================================
-- SOUL BLOOM SANCTUARY - CONSOLIDATED SEED DATA
-- =====================================================
-- Single source of truth for local development
-- Created: 2025-11-04
-- Purpose: Complete, realistic seed data for Soul Bloom Sanctuary plant store
--
-- CONTENTS:
--   1. Database Reset & Setup
--   2. Users (3 users: Admin, Owner, User)
--   3. Site (Soul Bloom Sanctuary)
--   4. Site Memberships (User-Site relationships)
--   5. Product Categories (5 categories)
--   6. Products (18 plant products)
--   7. Content Pages (5 essential pages)
--
-- DEFAULT CREDENTIALS (password for all users: password123):
--   - admin@test.com (Admin role, site owner)
--   - owner@test.com (Site Owner role, site owner)
--   - user@test.com (User role, site viewer)
--
-- SITE ACCESS:
--   - Subdomain: soul-bloom-sanctuary
--   - Local URL: http://soul-bloom-sanctuary.blooms.local:3001
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- 1. DATABASE RESET & CLEANUP
-- =====================================================

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
    product_favorites,
    taggings,
    tags,
    contact_inquiries,
    content,
    products,
    product_categories,
    site_memberships,
    sites,
    profiles
CASCADE;

-- Reset auth.users
DELETE FROM auth.users;

-- =====================================================
-- 2. USERS (3 users: Admin, Owner, User)
-- =====================================================

-- Insert users into auth.users with password: password123
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
    -- Admin User
    (
        '00000000-0000-0000-0000-000000000000'::uuid,
        '11111111-1111-1111-1111-111111111111'::uuid,
        'authenticated',
        'authenticated',
        'admin@test.com',
        crypt('password123', gen_salt('bf')),
        NOW(),
        '', '', '', '',
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Admin User"}',
        NOW(),
        NOW(),
        false,
        NULL
    ),
    -- Owner User
    (
        '00000000-0000-0000-0000-000000000000'::uuid,
        '22222222-2222-2222-2222-222222222222'::uuid,
        'authenticated',
        'authenticated',
        'owner@test.com',
        crypt('password123', gen_salt('bf')),
        NOW(),
        '', '', '', '',
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Site Owner"}',
        NOW(),
        NOW(),
        false,
        NULL
    ),
    -- Regular User
    (
        '00000000-0000-0000-0000-000000000000'::uuid,
        '33333333-3333-3333-3333-333333333333'::uuid,
        'authenticated',
        'authenticated',
        'user@test.com',
        crypt('password123', gen_salt('bf')),
        NOW(),
        '', '', '', '',
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Regular User"}',
        NOW(),
        NOW(),
        false,
        NULL
    );

-- Update profiles with additional details (profiles are created by trigger)
-- Wait a moment for trigger to create profiles, then update them
UPDATE profiles SET
    full_name = 'Admin User',
    username = 'admin',
    role = 'admin',
    bio = 'Platform administrator with full access'
WHERE user_id = '11111111-1111-1111-1111-111111111111';

UPDATE profiles SET
    full_name = 'Site Owner',
    username = 'owner',
    role = 'admin',
    bio = 'Owner of Soul Bloom Sanctuary'
WHERE user_id = '22222222-2222-2222-2222-222222222222';

UPDATE profiles SET
    full_name = 'Regular User',
    username = 'user',
    role = 'user',
    bio = 'Regular site viewer'
WHERE user_id = '33333333-3333-3333-3333-333333333333';

-- =====================================================
-- 3. SITE (Soul Bloom Sanctuary)
-- =====================================================

INSERT INTO sites (
    id,
    subdomain,
    name,
    description,
    logo_url,
    primary_color,
    business_name,
    business_email,
    business_phone,
    business_address,
    business_hours,
    timezone,
    theme_settings,
    social_media,
    is_active,
    is_published,
    created_at,
    updated_at
)
VALUES (
    'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
    'soul-bloom-sanctuary',
    'Soul Bloom Sanctuary',
    'Your sanctuary for beautiful, healthy plants. We offer premium indoor plants, outdoor specimens, succulents, and expert care guidance to help your garden thrive.',
    NULL, -- Logo can be added later
    '#10b981', -- Green primary color
    'Soul Bloom Sanctuary LLC',
    'info@soulbloomsanctuary.com',
    '(555) 123-4567',
    '123 Garden Lane, Portland, OR 97201',
    '{
        "monday": {"open": "09:00", "close": "18:00", "closed": false},
        "tuesday": {"open": "09:00", "close": "18:00", "closed": false},
        "wednesday": {"open": "09:00", "close": "18:00", "closed": false},
        "thursday": {"open": "09:00", "close": "18:00", "closed": false},
        "friday": {"open": "09:00", "close": "18:00", "closed": false},
        "saturday": {"open": "10:00", "close": "17:00", "closed": false},
        "sunday": {"open": "10:00", "close": "16:00", "closed": false}
    }'::jsonb,
    'America/Los_Angeles',
    '{
        "colors": {
            "primary": "#10b981",
            "secondary": "#059669",
            "accent": "#84cc16",
            "background": "#ffffff",
            "text": "#1f2937",
            "muted": "#6b7280"
        },
        "typography": {
            "headingFont": "Inter",
            "bodyFont": "Inter",
            "fontSize": "medium"
        },
        "layout": {
            "containerWidth": "normal",
            "spacing": "normal",
            "borderRadius": "medium"
        },
        "logo": {
            "position": "left",
            "size": "medium"
        }
    }'::jsonb,
    '[
        {
            "platform": "instagram",
            "url": "https://instagram.com/soulbloomsanctuary",
            "username": "soulbloomsanctuary",
            "confidence": 1.0
        },
        {
            "platform": "facebook",
            "url": "https://facebook.com/soulbloomsanctuary",
            "username": "soulbloomsanctuary",
            "confidence": 1.0
        }
    ]'::jsonb,
    true,
    true,
    NOW(),
    NOW()
);

-- =====================================================
-- 4. SITE MEMBERSHIPS (User-Site Relationships)
-- =====================================================

INSERT INTO site_memberships (user_id, site_id, role, is_active, created_at)
VALUES
    -- Admin has owner access
    (
        '11111111-1111-1111-1111-111111111111'::uuid,
        'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
        'owner',
        true,
        NOW()
    ),
    -- Owner has owner access
    (
        '22222222-2222-2222-2222-222222222222'::uuid,
        'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
        'owner',
        true,
        NOW()
    ),
    -- User has viewer access
    (
        '33333333-3333-3333-3333-333333333333'::uuid,
        'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
        'viewer',
        true,
        NOW()
    );

-- =====================================================
-- 5. PRODUCT CATEGORIES (5 categories)
-- =====================================================

INSERT INTO product_categories (
    id,
    site_id,
    name,
    slug,
    description,
    icon,
    color,
    path,
    level,
    sort_order,
    is_active,
    created_at,
    updated_at
)
VALUES
    -- Indoor Plants
    (
        'c1111111-1111-1111-1111-111111111111'::uuid,
        'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
        'Indoor Plants',
        'indoor-plants',
        'Bring life to your indoor spaces with our beautiful selection of houseplants. Perfect for homes, offices, and any interior environment.',
        '🌿',
        '#4ade80',
        'indoor-plants',
        0,
        1,
        true,
        NOW(),
        NOW()
    ),
    -- Outdoor Plants
    (
        'c2222222-2222-2222-2222-222222222222'::uuid,
        'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
        'Outdoor Plants',
        'outdoor-plants',
        'Hardy plants perfect for gardens, patios, and outdoor spaces. Transform your landscape with our curated selection.',
        '🌳',
        '#22c55e',
        'outdoor-plants',
        0,
        2,
        true,
        NOW(),
        NOW()
    ),
    -- Succulents & Cacti
    (
        'c3333333-3333-3333-3333-333333333333'::uuid,
        'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
        'Succulents & Cacti',
        'succulents-cacti',
        'Low-maintenance desert beauties that thrive with minimal care. Perfect for beginners and busy plant lovers.',
        '🌵',
        '#84cc16',
        'succulents-cacti',
        0,
        3,
        true,
        NOW(),
        NOW()
    ),
    -- Herbs
    (
        'c4444444-4444-4444-4444-444444444444'::uuid,
        'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
        'Herbs',
        'herbs',
        'Fresh culinary and medicinal herbs for your kitchen garden. Grow your own flavorful seasonings at home.',
        '🌱',
        '#10b981',
        'herbs',
        0,
        4,
        true,
        NOW(),
        NOW()
    ),
    -- Plant Care
    (
        'c5555555-5555-5555-5555-555555555555'::uuid,
        'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
        'Plant Care',
        'plant-care',
        'Everything you need to keep your plants thriving. Quality soil, fertilizers, pots, and accessories.',
        '🧰',
        '#14b8a6',
        'plant-care',
        0,
        5,
        true,
        NOW(),
        NOW()
    );

-- =====================================================
-- 6. PRODUCTS (18 plant products)
-- =====================================================

INSERT INTO products (
    site_id,
    name,
    slug,
    description,
    price,
    compare_at_price,
    sku,
    category,
    primary_category_id,
    care_instructions,
    is_active,
    is_featured,
    in_stock,
    inventory_count,
    stock_status,
    rating,
    review_count,
    unit_of_measure,
    width,
    height,
    depth,
    dimension_unit,
    weight,
    weight_unit,
    created_at,
    updated_at
)
VALUES

-- ==================== INDOOR PLANTS (6 products) ====================

-- 1. Monstera Deliciosa
(
    'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
    'Monstera Deliciosa',
    'monstera-deliciosa',
    'The iconic Swiss Cheese Plant with stunning split leaves. A statement piece that adds tropical vibes to any room. Grows large and impressive with proper care.',
    45.99,
    59.99,
    'PLANT-MON-001',
    'Indoor Plants',
    'c1111111-1111-1111-1111-111111111111'::uuid,
    'Water when top 2 inches of soil are dry. Bright, indirect light. Wipe leaves monthly. Prefers humidity 60%+.',
    true,
    true,
    true,
    25,
    'in-stock',
    4.8,
    127,
    'each',
    10.0,
    24.0,
    10.0,
    'in',
    3.5,
    'lb',
    NOW(),
    NOW()
),

-- 2. Golden Pothos
(
    'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
    'Golden Pothos',
    'golden-pothos',
    'Nearly indestructible trailing plant perfect for beginners. Beautiful heart-shaped leaves with golden variegation. Excellent air purifier.',
    18.99,
    NULL,
    'PLANT-POT-001',
    'Indoor Plants',
    'c1111111-1111-1111-1111-111111111111'::uuid,
    'Water every 1-2 weeks. Tolerates low to bright indirect light. Trim to encourage bushiness. Easy care.',
    true,
    false,
    true,
    40,
    'in-stock',
    4.9,
    203,
    'each',
    6.0,
    8.0,
    6.0,
    'in',
    1.5,
    'lb',
    NOW(),
    NOW()
),

-- 3. Snake Plant (Sansevieria)
(
    'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
    'Snake Plant (Sansevieria)',
    'snake-plant-sansevieria',
    'Architectural beauty with upright sword-like leaves. One of the best air-purifying plants. Thrives on neglect - perfect for busy people.',
    28.99,
    NULL,
    'PLANT-SNK-001',
    'Indoor Plants',
    'c1111111-1111-1111-1111-111111111111'::uuid,
    'Water every 2-3 weeks. Tolerates low light to full sun. Drought tolerant. Avoid overwatering.',
    true,
    true,
    true,
    32,
    'in-stock',
    4.7,
    156,
    'each',
    8.0,
    18.0,
    8.0,
    'in',
    2.8,
    'lb',
    NOW(),
    NOW()
),

-- 4. Peace Lily
(
    'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
    'Peace Lily',
    'peace-lily',
    'Elegant plant with glossy leaves and beautiful white flowers. Excellent air purifier. Tells you when it needs water by drooping slightly.',
    32.99,
    NULL,
    'PLANT-PCE-001',
    'Indoor Plants',
    'c1111111-1111-1111-1111-111111111111'::uuid,
    'Water when soil feels dry. Low to medium indirect light. Mist leaves weekly. Blooms with proper care.',
    true,
    false,
    true,
    28,
    'in-stock',
    4.6,
    89,
    'each',
    9.0,
    16.0,
    9.0,
    'in',
    2.5,
    'lb',
    NOW(),
    NOW()
),

-- 5. Fiddle Leaf Fig
(
    'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
    'Fiddle Leaf Fig',
    'fiddle-leaf-fig',
    'The designer favorite with large, violin-shaped leaves. Makes a dramatic statement in modern interiors. Premium quality, ready to become your centerpiece.',
    89.99,
    119.99,
    'PLANT-FIG-001',
    'Indoor Plants',
    'c1111111-1111-1111-1111-111111111111'::uuid,
    'Water weekly when top inch is dry. Bright, indirect light. Rotate weekly. Wipe leaves to prevent dust buildup.',
    true,
    true,
    true,
    15,
    'in-stock',
    4.5,
    72,
    'each',
    12.0,
    36.0,
    12.0,
    'in',
    8.0,
    'lb',
    NOW(),
    NOW()
),

-- 6. ZZ Plant
(
    'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
    'ZZ Plant (Zamioculcas)',
    'zz-plant-zamioculcas',
    'Glossy, waxy leaves that look almost artificial. Extremely drought tolerant and low maintenance. Perfect for offices or low-light spaces.',
    34.99,
    NULL,
    'PLANT-ZZ-001',
    'Indoor Plants',
    'c1111111-1111-1111-1111-111111111111'::uuid,
    'Water every 2-3 weeks. Low to bright indirect light. Very drought tolerant. Minimal care required.',
    true,
    false,
    true,
    22,
    'in-stock',
    4.8,
    134,
    'each',
    8.0,
    14.0,
    8.0,
    'in',
    2.2,
    'lb',
    NOW(),
    NOW()
),

-- ==================== OUTDOOR PLANTS (4 products) ====================

-- 7. Lavender Plant
(
    'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
    'English Lavender',
    'english-lavender',
    'Fragrant purple blooms and silvery foliage. Attracts pollinators and repels pests. Perfect for borders, containers, or herb gardens.',
    16.99,
    NULL,
    'PLANT-LAV-001',
    'Outdoor Plants',
    'c2222222-2222-2222-2222-222222222222'::uuid,
    'Full sun 6-8 hours daily. Well-draining soil. Water when dry. Prune after flowering. Hardy perennial.',
    true,
    true,
    true,
    35,
    'in-stock',
    4.7,
    98,
    'each',
    8.0,
    12.0,
    8.0,
    'in',
    2.0,
    'lb',
    NOW(),
    NOW()
),

-- 8. Hydrangea
(
    'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
    'Blue Hydrangea',
    'blue-hydrangea',
    'Stunning blue blooms that create a show-stopping display. Large flower clusters perfect for cutting. Color intensity depends on soil pH.',
    42.99,
    54.99,
    'PLANT-HYD-001',
    'Outdoor Plants',
    'c2222222-2222-2222-2222-222222222222'::uuid,
    'Partial shade to full sun. Keep soil moist. Acidic soil for blue blooms. Prune in late winter. Mulch roots.',
    true,
    true,
    true,
    18,
    'in-stock',
    4.6,
    76,
    'each',
    14.0,
    22.0,
    14.0,
    'in',
    5.5,
    'lb',
    NOW(),
    NOW()
),

-- 9. Japanese Maple
(
    'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
    'Japanese Maple Tree',
    'japanese-maple-tree',
    'Ornamental tree with delicate lace-like leaves. Stunning fall color transformation. Perfect focal point for any garden or large container.',
    124.99,
    149.99,
    'PLANT-MAP-001',
    'Outdoor Plants',
    'c2222222-2222-2222-2222-222222222222'::uuid,
    'Partial shade. Protect from harsh afternoon sun. Regular watering. Mulch base. Prune in winter.',
    true,
    true,
    true,
    12,
    'in-stock',
    4.9,
    45,
    'each',
    18.0,
    48.0,
    18.0,
    'in',
    15.0,
    'lb',
    NOW(),
    NOW()
),

-- 10. Hostas
(
    'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
    'Mixed Hosta Collection',
    'mixed-hosta-collection',
    'Shade-loving perennials with gorgeous foliage. Mix of green and variegated varieties. Perfect for filling in shady spots under trees.',
    22.99,
    NULL,
    'PLANT-HOS-001',
    'Outdoor Plants',
    'c2222222-2222-2222-2222-222222222222'::uuid,
    'Shade to partial shade. Keep soil moist. Slug control important. Divide every 3-4 years. Hardy perennial.',
    true,
    false,
    true,
    30,
    'in-stock',
    4.5,
    67,
    'each',
    10.0,
    14.0,
    10.0,
    'in',
    3.0,
    'lb',
    NOW(),
    NOW()
),

-- ==================== SUCCULENTS & CACTI (4 products) ====================

-- 11. Aloe Vera
(
    'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
    'Aloe Vera Plant',
    'aloe-vera-plant',
    'Medicinal succulent known for soothing properties. Easy care and fast growing. Gel inside leaves great for minor burns and skin care.',
    14.99,
    NULL,
    'PLANT-ALO-001',
    'Succulents & Cacti',
    'c3333333-3333-3333-3333-333333333333'::uuid,
    'Bright indirect light. Water every 3 weeks. Well-draining cactus soil. Drought tolerant. Don''t overwater.',
    true,
    true,
    true,
    45,
    'in-stock',
    4.8,
    187,
    'each',
    6.0,
    10.0,
    6.0,
    'in',
    1.8,
    'lb',
    NOW(),
    NOW()
),

-- 12. Jade Plant
(
    'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
    'Jade Plant (Money Tree)',
    'jade-plant-money-tree',
    'Classic succulent with thick, glossy leaves. Symbol of good luck and prosperity. Grows into a beautiful miniature tree with age.',
    19.99,
    NULL,
    'PLANT-JAD-001',
    'Succulents & Cacti',
    'c3333333-3333-3333-3333-333333333333'::uuid,
    'Bright light. Water when soil completely dry. Well-draining soil. Prune to shape. Long-lived plant.',
    true,
    false,
    true,
    38,
    'in-stock',
    4.7,
    142,
    'each',
    6.0,
    8.0,
    6.0,
    'in',
    2.5,
    'lb',
    NOW(),
    NOW()
),

-- 13. Echeveria Mix
(
    'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
    'Echeveria Succulent Mix',
    'echeveria-succulent-mix',
    'Collection of colorful rosette-shaped succulents. Perfect for arrangements, terrariums, or individual pots. Stunning variety of colors.',
    12.99,
    NULL,
    'PLANT-ECH-001',
    'Succulents & Cacti',
    'c3333333-3333-3333-3333-333333333333'::uuid,
    'Bright light to full sun. Water every 2-3 weeks. Excellent drainage required. Avoid water on leaves.',
    true,
    false,
    true,
    50,
    'in-stock',
    4.6,
    95,
    'each',
    4.0,
    3.0,
    4.0,
    'in',
    0.5,
    'lb',
    NOW(),
    NOW()
),

-- 14. Barrel Cactus
(
    'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
    'Golden Barrel Cactus',
    'golden-barrel-cactus',
    'Spherical cactus with golden spines creating a stunning geometric form. Slow-growing desert beauty. Perfect statement piece.',
    36.99,
    NULL,
    'PLANT-BAR-001',
    'Succulents & Cacti',
    'c3333333-3333-3333-3333-333333333333'::uuid,
    'Full sun preferred. Water monthly in summer, every 2 months in winter. Cactus soil. Minimal care needed.',
    true,
    false,
    true,
    20,
    'in-stock',
    4.7,
    58,
    'each',
    8.0,
    10.0,
    8.0,
    'in',
    4.0,
    'lb',
    NOW(),
    NOW()
),

-- ==================== HERBS (3 products) ====================

-- 15. Basil
(
    'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
    'Sweet Basil Plant',
    'sweet-basil-plant',
    'Essential culinary herb with aromatic leaves. Perfect for Italian cooking, pesto, and salads. Grows quickly and produces abundantly.',
    8.99,
    NULL,
    'PLANT-BAS-001',
    'Herbs',
    'c4444444-4444-4444-4444-444444444444'::uuid,
    'Full sun 6-8 hours. Water regularly, keep moist. Pinch flowers to encourage leaf growth. Harvest regularly.',
    true,
    true,
    true,
    48,
    'in-stock',
    4.8,
    164,
    'each',
    5.0,
    8.0,
    5.0,
    'in',
    0.8,
    'lb',
    NOW(),
    NOW()
),

-- 16. Rosemary
(
    'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
    'Rosemary Plant',
    'rosemary-plant',
    'Fragrant Mediterranean herb with needle-like leaves. Perfect for cooking, teas, and aromatherapy. Can be trained as topiary.',
    11.99,
    NULL,
    'PLANT-ROS-001',
    'Herbs',
    'c4444444-4444-4444-4444-444444444444'::uuid,
    'Full sun. Well-draining soil. Water when dry. Drought tolerant once established. Prune to shape.',
    true,
    false,
    true,
    35,
    'in-stock',
    4.7,
    112,
    'each',
    6.0,
    10.0,
    6.0,
    'in',
    1.2,
    'lb',
    NOW(),
    NOW()
),

-- 17. Mint
(
    'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
    'Peppermint Plant',
    'peppermint-plant',
    'Refreshing herb perfect for teas, mojitos, and desserts. Vigorous grower with cool, minty fragrance. Best grown in containers to control spread.',
    9.99,
    NULL,
    'PLANT-MIN-001',
    'Herbs',
    'c4444444-4444-4444-4444-444444444444'::uuid,
    'Partial shade to sun. Keep soil moist. Contain roots or it will spread. Harvest frequently to promote growth.',
    true,
    false,
    true,
    42,
    'in-stock',
    4.6,
    128,
    'each',
    5.0,
    7.0,
    5.0,
    'in',
    0.9,
    'lb',
    NOW(),
    NOW()
),

-- ==================== PLANT CARE (1 product) ====================

-- 18. Premium Potting Mix
(
    'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
    'Premium Potting Mix',
    'premium-potting-mix',
    'Professional-grade soil blend for all indoor plants. Rich in organic matter with perfect drainage. Contains perlite, peat moss, and worm castings.',
    24.99,
    NULL,
    'CARE-MIX-001',
    'Plant Care',
    'c5555555-5555-5555-5555-555555555555'::uuid,
    'Mix into existing soil or use for repotting. Suitable for most houseplants. Store in cool, dry place.',
    true,
    false,
    true,
    50,
    'in-stock',
    4.9,
    215,
    '5 lb bag',
    12.0,
    16.0,
    6.0,
    'in',
    5.0,
    'lb',
    NOW(),
    NOW()
);

-- =====================================================
-- 7. CONTENT PAGES (5 essential pages)
-- =====================================================

INSERT INTO content (
    site_id,
    author_id,
    content_type,
    title,
    slug,
    content,
    is_published,
    is_featured,
    sort_order,
    created_at,
    updated_at,
    published_at
)
VALUES

-- Home Page (Landing)
(
    'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'landing',
    'Home',
    'home',
    '{
        "version": "1.0",
        "layout": "landing",
        "sections": {
            "hero": {
                "type": "hero",
                "order": 1,
                "visible": true,
                "data": {
                    "headline": "Welcome to Soul Bloom Sanctuary",
                    "subheadline": "Your sanctuary for beautiful, healthy plants",
                    "ctaText": "Shop Plants",
                    "ctaLink": "/products",
                    "secondaryCtaText": "Learn More",
                    "secondaryCtaLink": "/about"
                }
            },
            "features": {
                "type": "features",
                "order": 2,
                "visible": true,
                "data": {
                    "headline": "Why Choose Soul Bloom Sanctuary",
                    "description": "We provide premium plants and expert guidance to help your garden thrive.",
                    "features": [
                        "Carefully curated plant selection",
                        "Expert care instructions included",
                        "Healthy, thriving plants guaranteed"
                    ]
                },
                "settings": {
                    "backgroundColor": "alternate"
                }
            },
            "cta": {
                "type": "cta",
                "order": 3,
                "visible": true,
                "data": {
                    "headline": "Ready to Start Your Plant Journey?",
                    "description": "Browse our collection and find your perfect plant companion.",
                    "ctaText": "Shop Now",
                    "ctaLink": "/products"
                },
                "settings": {
                    "backgroundColor": "primary"
                }
            }
        }
    }'::jsonb,
    true,
    true,
    10,
    NOW(),
    NOW(),
    NOW()
),

-- About Page
(
    'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'about',
    'About',
    'about',
    '{
        "version": "1.0",
        "layout": "about",
        "sections": {
            "header": {
                "type": "header",
                "order": 1,
                "visible": true,
                "data": {
                    "headline": "About Soul Bloom Sanctuary",
                    "subheadline": "We believe every space deserves the beauty and serenity that plants bring. Our mission is to help you create your own sanctuary filled with thriving, healthy plants."
                },
                "settings": {
                    "backgroundColor": "default"
                }
            },
            "values": {
                "type": "features",
                "order": 2,
                "visible": true,
                "data": {
                    "headline": "Our Values",
                    "description": "Quality plants, expert guidance, and customer care are at the heart of everything we do.",
                    "features": [
                        "Quality: Only the healthiest plants",
                        "Expertise: Care guides with every purchase",
                        "Sustainability: Eco-friendly practices"
                    ]
                },
                "settings": {
                    "backgroundColor": "alternate"
                }
            }
        }
    }'::jsonb,
    true,
    false,
    20,
    NOW(),
    NOW(),
    NOW()
),

-- Contact Page
(
    'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'contact',
    'Contact',
    'contact',
    '{
        "version": "1.0",
        "layout": "contact",
        "sections": {
            "header": {
                "type": "header",
                "order": 1,
                "visible": true,
                "data": {
                    "headline": "Get in Touch",
                    "subheadline": "Have questions about our plants or need care advice? We''re here to help!"
                },
                "settings": {
                    "backgroundColor": "default"
                }
            },
            "contactForm": {
                "type": "contactForm",
                "order": 2,
                "visible": true,
                "data": {
                    "headline": "Send Us a Message",
                    "description": "Fill out the form below and we''ll get back to you as soon as possible."
                },
                "settings": {
                    "backgroundColor": "default"
                }
            },
            "contactInfo": {
                "type": "richText",
                "order": 3,
                "visible": true,
                "data": {
                    "headline": "Other Ways to Reach Us",
                    "content": "<p><strong>Location:</strong> 123 Garden Lane, Portland, OR 97201</p><p><strong>Email:</strong> info@soulbloomsanctuary.com</p><p><strong>Phone:</strong> (555) 123-4567</p><p><strong>Hours:</strong> Monday-Friday: 9am-6pm, Saturday: 10am-5pm, Sunday: 10am-4pm</p>"
                },
                "settings": {
                    "backgroundColor": "alternate"
                }
            }
        }
    }'::jsonb,
    true,
    false,
    80,
    NOW(),
    NOW(),
    NOW()
),

-- Privacy Policy
(
    'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'other',
    'Privacy Policy',
    'privacy',
    '{
        "version": "1.0",
        "layout": "other",
        "sections": {
            "header": {
                "type": "header",
                "order": 1,
                "visible": true,
                "data": {
                    "headline": "Privacy Policy",
                    "subheadline": "Last Updated: November 4, 2025"
                }
            },
            "content": {
                "type": "richText",
                "order": 2,
                "visible": true,
                "data": {
                    "content": "<h2>Information We Collect</h2><p>We collect information you provide directly to us when you make a purchase, create an account, or contact us for support.</p><h2>How We Use Your Information</h2><p>We use the information we collect to process orders, provide customer support, and improve our services.</p><h2>Contact Us</h2><p>If you have questions about this Privacy Policy, please contact us at info@soulbloomsanctuary.com</p>"
                }
            }
        }
    }'::jsonb,
    true,
    false,
    90,
    NOW(),
    NOW(),
    NOW()
),

-- Terms of Service
(
    'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'other',
    'Terms of Service',
    'terms',
    '{
        "version": "1.0",
        "layout": "other",
        "sections": {
            "header": {
                "type": "header",
                "order": 1,
                "visible": true,
                "data": {
                    "headline": "Terms of Service",
                    "subheadline": "Last Updated: November 4, 2025"
                }
            },
            "content": {
                "type": "richText",
                "order": 2,
                "visible": true,
                "data": {
                    "content": "<h2>Agreement to Terms</h2><p>By accessing our website, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p><h2>Use License</h2><p>We grant you a limited license to access and use our website for personal, non-commercial purposes.</p><h2>Contact Us</h2><p>If you have questions about these Terms, please contact us at info@soulbloomsanctuary.com</p>"
                }
            }
        }
    }'::jsonb,
    true,
    false,
    100,
    NOW(),
    NOW(),
    NOW()
);

-- =====================================================
-- 8. COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Soul Bloom Sanctuary seed data created successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'SITE INFORMATION:';
    RAISE NOTICE '  Site ID: aaaaaaaa-bbbb-cccc-dddd-111111111111';
    RAISE NOTICE '  Subdomain: soul-bloom-sanctuary';
    RAISE NOTICE '  Local URL: http://soul-bloom-sanctuary.blooms.local:3001';
    RAISE NOTICE '';
    RAISE NOTICE 'TEST USERS (password for all: password123):';
    RAISE NOTICE '  1. admin@test.com (Admin role, site owner)';
    RAISE NOTICE '  2. owner@test.com (Site Owner role, site owner)';
    RAISE NOTICE '  3. user@test.com (User role, site viewer)';
    RAISE NOTICE '';
    RAISE NOTICE 'DATABASE CONTENTS:';
    RAISE NOTICE '  - 3 users created';
    RAISE NOTICE '  - 1 site created (Soul Bloom Sanctuary)';
    RAISE NOTICE '  - 3 site memberships configured';
    RAISE NOTICE '  - 5 product categories created';
    RAISE NOTICE '  - 18 products created';
    RAISE NOTICE '  - 5 content pages created';
    RAISE NOTICE '';
    RAISE NOTICE 'To update this seed data, edit: supabase/seed-soul-bloom.sql';
    RAISE NOTICE '========================================';
END $$;
