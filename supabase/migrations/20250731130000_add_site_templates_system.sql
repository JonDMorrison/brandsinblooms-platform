-- Site Templates System Migration
-- Implements Milestone 2: Site Creation & Configuration
-- Adds site templates table and creation functions for template-based site creation

-- =====================================================
-- 1. SITE TEMPLATES TABLE
-- =====================================================

-- Create site templates table for pre-built templates
CREATE TABLE public.site_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'business',
    preview_image_url TEXT,
    template_config JSON NOT NULL,
    default_content JSON,
    default_products JSON,
    default_business_hours JSON,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- 2. INDEXES AND CONSTRAINTS
-- =====================================================

CREATE INDEX idx_site_templates_category ON public.site_templates(category);
CREATE INDEX idx_site_templates_active ON public.site_templates(is_active) WHERE is_active = true;
CREATE INDEX idx_site_templates_slug ON public.site_templates(slug);

-- =====================================================
-- 3. ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on site templates
ALTER TABLE public.site_templates ENABLE ROW LEVEL SECURITY;

-- Admins can manage all templates
CREATE POLICY "Admins can manage site templates"
ON public.site_templates FOR ALL
USING (public.is_admin());

-- Public can view active templates (for template selection)
CREATE POLICY "Anyone can view active templates"
ON public.site_templates FOR SELECT
USING (is_active = true);

-- =====================================================
-- 4. SITE CREATION FUNCTION
-- =====================================================

-- Function to create a site with template
CREATE OR REPLACE FUNCTION public.create_site_with_template(
    template_slug VARCHAR(100),
    site_name VARCHAR(255),
    site_subdomain VARCHAR(63),
    owner_email VARCHAR(255),
    business_info JSON DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    template_record public.site_templates%ROWTYPE;
    new_site_id UUID;
    owner_user_id UUID;
    owner_profile_id UUID;
    result JSON;
BEGIN
    -- Only allow admins to create sites
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Validate template exists and is active
    SELECT * INTO template_record 
    FROM public.site_templates 
    WHERE slug = template_slug AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found or inactive: %', template_slug;
    END IF;
    
    -- Check subdomain availability
    IF EXISTS (SELECT 1 FROM public.sites WHERE subdomain = site_subdomain) THEN
        RAISE EXCEPTION 'Subdomain already exists: %', site_subdomain;
    END IF;
    
    -- Find or validate owner by email
    SELECT user_id INTO owner_user_id
    FROM auth.users 
    WHERE email = owner_email;
    
    IF owner_user_id IS NULL THEN
        RAISE EXCEPTION 'Owner email not found in system: %', owner_email;
    END IF;
    
    -- Get owner profile
    SELECT user_id INTO owner_profile_id
    FROM public.profiles 
    WHERE user_id = owner_user_id;
    
    IF owner_profile_id IS NULL THEN
        RAISE EXCEPTION 'Owner profile not found for user: %', owner_email;
    END IF;
    
    -- Create the site
    INSERT INTO public.sites (
        name,
        subdomain,
        description,
        business_name,
        business_email,
        business_hours,
        primary_color,
        created_by,
        is_active,
        is_published
    ) VALUES (
        site_name,
        site_subdomain,
        template_record.description,
        COALESCE((business_info->>'business_name')::VARCHAR, site_name),
        COALESCE((business_info->>'business_email')::VARCHAR, owner_email),
        COALESCE(business_info->'business_hours', template_record.default_business_hours),
        COALESCE((business_info->>'primary_color')::VARCHAR, (template_record.template_config->>'primary_color')::VARCHAR),
        auth.uid(),
        true,
        false
    ) RETURNING id INTO new_site_id;
    
    -- Create site membership for owner
    INSERT INTO public.site_memberships (
        site_id,
        user_id,
        role,
        is_active
    ) VALUES (
        new_site_id,
        owner_user_id,
        'owner',
        true
    );
    
    -- Create default content from template
    IF template_record.default_content IS NOT NULL THEN
        INSERT INTO public.content (
            site_id,
            title,
            slug,
            content_type,
            content,
            is_published,
            sort_order
        )
        SELECT 
            new_site_id,
            (content_item->>'title')::VARCHAR,
            (content_item->>'slug')::VARCHAR,
            (content_item->>'content_type')::VARCHAR,
            content_item->'content',
            COALESCE((content_item->>'is_published')::BOOLEAN, false),
            COALESCE((content_item->>'sort_order')::INTEGER, 0)
        FROM json_array_elements(template_record.default_content) AS content_item;
    END IF;
    
    -- Create default products from template
    IF template_record.default_products IS NOT NULL THEN
        INSERT INTO public.products (
            site_id,
            name,
            slug,
            description,
            category,
            price,
            is_active,
            is_featured,
            in_stock
        )
        SELECT 
            new_site_id,
            (product_item->>'name')::VARCHAR,
            (product_item->>'slug')::VARCHAR,
            (product_item->>'description')::TEXT,
            (product_item->>'category')::VARCHAR,
            COALESCE((product_item->>'price')::DECIMAL, 0),
            COALESCE((product_item->>'is_active')::BOOLEAN, true),
            COALESCE((product_item->>'is_featured')::BOOLEAN, false),
            COALESCE((product_item->>'in_stock')::BOOLEAN, true)
        FROM json_array_elements(template_record.default_products) AS product_item;
    END IF;
    
    -- Initialize site metrics
    INSERT INTO public.site_metrics (
        site_id,
        metric_date,
        content_count,
        product_count,
        inquiry_count
    ) VALUES (
        new_site_id,
        CURRENT_DATE,
        COALESCE(json_array_length(template_record.default_content), 0),
        COALESCE(json_array_length(template_record.default_products), 0),
        0
    );
    
    -- Build result
    SELECT json_build_object(
        'site_id', new_site_id,
        'site_name', site_name,
        'subdomain', site_subdomain,
        'template_used', template_slug,
        'owner_email', owner_email,
        'created_at', NOW(),
        'content_created', COALESCE(json_array_length(template_record.default_content), 0),
        'products_created', COALESCE(json_array_length(template_record.default_products), 0)
    ) INTO result;
    
    RETURN result;
END;
$$;

-- =====================================================
-- 5. TEMPLATE MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to get all available templates
CREATE OR REPLACE FUNCTION public.get_site_templates(
    category_filter VARCHAR(50) DEFAULT NULL,
    active_only BOOLEAN DEFAULT true
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    where_clause TEXT := '';
BEGIN
    -- Build WHERE clause
    IF active_only THEN
        where_clause := 'WHERE is_active = true';
    ELSE
        where_clause := 'WHERE 1=1';
    END IF;
    
    IF category_filter IS NOT NULL THEN
        where_clause := where_clause || ' AND category = ' || quote_literal(category_filter);
    END IF;
    
    -- Execute query
    EXECUTE format('
        SELECT COALESCE(json_agg(
            json_build_object(
                ''id'', id,
                ''name'', name,
                ''slug'', slug,
                ''description'', description,
                ''category'', category,
                ''preview_image_url'', preview_image_url,
                ''template_config'', template_config,
                ''is_active'', is_active,
                ''created_at'', created_at
            ) ORDER BY name
        ), ''[]''::json) as templates
        FROM public.site_templates
        %s
    ', where_clause) INTO result;
    
    RETURN result;
END;
$$;

-- Function to check subdomain availability
CREATE OR REPLACE FUNCTION public.check_subdomain_availability(
    subdomain_to_check VARCHAR(63)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if subdomain exists
    RETURN NOT EXISTS (
        SELECT 1 FROM public.sites 
        WHERE subdomain = subdomain_to_check
    );
END;
$$;

-- =====================================================
-- 6. TEMPLATE DATA INSERTION
-- =====================================================

-- Insert Garden Center Basic template
INSERT INTO public.site_templates (
    name,
    slug,
    description,
    category,
    preview_image_url,
    template_config,
    default_content,
    default_products,
    default_business_hours
) VALUES (
    'Garden Center Basic',
    'garden-center-basic',
    'A clean, professional template perfect for garden centers and landscaping businesses. Features product showcases, service pages, and contact forms.',
    'garden_center',
    '/templates/garden-center-basic-preview.jpg',
    '{
        "primary_color": "#22c55e",
        "secondary_color": "#16a34a",
        "font_family": "Inter",
        "layout_style": "modern",
        "header_style": "centered",
        "navigation_style": "horizontal"
    }',
    '[
        {
            "title": "Welcome to Your Garden Center",
            "slug": "home",
            "content_type": "page",
            "content": {
                "blocks": [
                    {
                        "type": "hero",
                        "content": {
                            "title": "Beautiful Gardens Start Here",
                            "subtitle": "Discover premium plants, expert advice, and everything you need to create your perfect outdoor space.",
                            "button_text": "Shop Now",
                            "button_link": "/products"
                        }
                    },
                    {
                        "type": "features",
                        "content": {
                            "title": "Why Choose Us",
                            "features": [
                                {
                                    "title": "Expert Advice",
                                    "description": "Our knowledgeable staff helps you choose the right plants for your space."
                                },
                                {
                                    "title": "Quality Plants",
                                    "description": "We source only the healthiest plants from trusted local growers."
                                },
                                {
                                    "title": "Full Service",
                                    "description": "From selection to planting, we provide complete garden solutions."
                                }
                            ]
                        }
                    }
                ]
            },
            "is_published": true,
            "sort_order": 1
        },
        {
            "title": "About Us",
            "slug": "about",
            "content_type": "page",
            "content": {
                "blocks": [
                    {
                        "type": "text",
                        "content": {
                            "title": "Our Story",
                            "text": "Founded with a passion for helping people create beautiful outdoor spaces, our garden center has been serving the community for over 20 years. We believe that everyone deserves a thriving garden, and we are here to make that dream a reality."
                        }
                    }
                ]
            },
            "is_published": true,
            "sort_order": 2
        },
        {
            "title": "Services",
            "slug": "services",
            "content_type": "page",
            "content": {
                "blocks": [
                    {
                        "type": "services",
                        "content": {
                            "title": "Our Services",
                            "services": [
                                {
                                    "title": "Garden Design",
                                    "description": "Professional landscape design tailored to your space and style."
                                },
                                {
                                    "title": "Plant Installation",
                                    "description": "Expert planting services to ensure your garden thrives."
                                },
                                {
                                    "title": "Maintenance",
                                    "description": "Ongoing care to keep your garden looking its best year-round."
                                }
                            ]
                        }
                    }
                ]
            },
            "is_published": true,
            "sort_order": 3
        },
        {
            "title": "Contact Us",
            "slug": "contact",
            "content_type": "page",
            "content": {
                "blocks": [
                    {
                        "type": "contact",
                        "content": {
                            "title": "Get In Touch",
                            "subtitle": "Ready to start your garden journey? Contact us today!"
                        }
                    }
                ]
            },
            "is_published": true,
            "sort_order": 4
        }
    ]',
    '[
        {
            "name": "Fiddle Leaf Fig",
            "slug": "fiddle-leaf-fig",
            "description": "A stunning indoor plant with large, glossy leaves that make a bold statement in any room.",
            "category": "indoor_plants",
            "price": 49.99,
            "is_active": true,
            "is_featured": true,
            "in_stock": true
        },
        {
            "name": "Snake Plant",
            "slug": "snake-plant",
            "description": "Low-maintenance succulent perfect for beginners. Tolerates low light and infrequent watering.",
            "category": "indoor_plants",
            "price": 24.99,
            "is_active": true,
            "is_featured": false,
            "in_stock": true
        },
        {
            "name": "Lavender Plant",
            "slug": "lavender-plant",
            "description": "Fragrant perennial herb perfect for gardens and containers. Attracts pollinators and deters pests.",
            "category": "herbs",
            "price": 12.99,
            "is_active": true,
            "is_featured": true,
            "in_stock": true
        },
        {
            "name": "Rose Bush - Red",
            "slug": "rose-bush-red",
            "description": "Classic red roses that bloom throughout the growing season. Perfect for gardens and cutting.",
            "category": "flowers",
            "price": 32.99,
            "is_active": true,
            "is_featured": false,
            "in_stock": true
        }
    ]',
    '{
        "monday": {"open": "08:00", "close": "18:00", "closed": false},
        "tuesday": {"open": "08:00", "close": "18:00", "closed": false},
        "wednesday": {"open": "08:00", "close": "18:00", "closed": false},
        "thursday": {"open": "08:00", "close": "18:00", "closed": false},
        "friday": {"open": "08:00", "close": "18:00", "closed": false},
        "saturday": {"open": "08:00", "close": "17:00", "closed": false},
        "sunday": {"open": "09:00", "close": "16:00", "closed": false}
    }'
);

-- Insert Plant Nursery template
INSERT INTO public.site_templates (
    name,
    slug,
    description,
    category,
    preview_image_url,
    template_config,
    default_content,
    default_products,
    default_business_hours
) VALUES (
    'Plant Nursery Professional',
    'plant-nursery-professional',
    'A comprehensive template designed for plant nurseries and wholesale operations. Includes detailed product catalogs, growing guides, and bulk ordering features.',
    'nursery',
    '/templates/plant-nursery-professional-preview.jpg',
    '{
        "primary_color": "#059669",
        "secondary_color": "#047857",
        "font_family": "Inter",
        "layout_style": "professional",
        "header_style": "left_aligned",
        "navigation_style": "horizontal"
    }',
    '[
        {
            "title": "Professional Plant Nursery",
            "slug": "home",
            "content_type": "page",
            "content": {
                "blocks": [
                    {
                        "type": "hero",
                        "content": {
                            "title": "Premium Plants for Professionals",
                            "subtitle": "Supplying landscape professionals, garden centers, and serious gardeners with the highest quality plants since 1985.",
                            "button_text": "View Catalog",
                            "button_link": "/products"
                        }
                    },
                    {
                        "type": "stats",
                        "content": {
                            "stats": [
                                {"label": "Plant Varieties", "value": "2000+"},
                                {"label": "Years Experience", "value": "35+"},
                                {"label": "Satisfied Customers", "value": "500+"},
                                {"label": "Growing Acres", "value": "50+"}
                            ]
                        }
                    }
                ]
            },
            "is_published": true,
            "sort_order": 1
        },
        {
            "title": "Our Nursery",
            "slug": "about",
            "content_type": "page",
            "content": {
                "blocks": [
                    {
                        "type": "text",
                        "content": {
                            "title": "Three Generations of Growing Excellence",
                            "text": "Our family-owned nursery has been cultivating premium plants for over three decades. We specialize in native species, drought-tolerant varieties, and hard-to-find specimens that landscape professionals and discerning gardeners demand."
                        }
                    }
                ]
            },
            "is_published": true,
            "sort_order": 2
        },
        {
            "title": "Growing Guides",
            "slug": "growing-guides",
            "content_type": "page",
            "content": {
                "blocks": [
                    {
                        "type": "text",
                        "content": {
                            "title": "Expert Growing Information",
                            "text": "Access our comprehensive library of growing guides, planting calendars, and care instructions developed by our horticulture experts."
                        }
                    }
                ]
            },
            "is_published": true,
            "sort_order": 3
        },
        {
            "title": "Wholesale Inquiries",
            "slug": "wholesale",
            "content_type": "page",
            "content": {
                "blocks": [
                    {
                        "type": "contact",
                        "content": {
                            "title": "Wholesale & Trade Sales",
                            "subtitle": "Special pricing available for landscape professionals, garden centers, and volume purchasers."
                        }
                    }
                ]
            },
            "is_published": true,
            "sort_order": 4
        }
    ]',
    '[
        {
            "name": "California Native Oak - Coast Live Oak",
            "slug": "coast-live-oak",
            "description": "Majestic native oak tree, drought tolerant once established. Excellent for large landscapes and wildlife habitat.",
            "category": "native_trees",
            "price": 89.99,
            "is_active": true,
            "is_featured": true,
            "in_stock": true
        },
        {
            "name": "Purple Sage",
            "slug": "purple-sage",
            "description": "Drought-tolerant native shrub with silvery foliage and purple flower spikes. Perfect for xeriscaping.",
            "category": "native_shrubs",
            "price": 16.99,
            "is_active": true,
            "is_featured": true,
            "in_stock": true
        },
        {
            "name": "Japanese Maple - Bloodgood",
            "slug": "japanese-maple-bloodgood",
            "description": "Stunning ornamental tree with deep red foliage. Excellent specimen plant for gardens and containers.",
            "category": "ornamental_trees",
            "price": 124.99,
            "is_active": true,
            "is_featured": false,
            "in_stock": true
        },
        {
            "name": "Agave Century Plant",
            "slug": "agave-century-plant",
            "description": "Dramatic succulent with blue-green rosettes. Extremely drought tolerant and architectural.",
            "category": "succulents",
            "price": 34.99,
            "is_active": true,
            "is_featured": false,
            "in_stock": true
        },
        {
            "name": "California Poppy Seeds",
            "slug": "california-poppy-seeds",
            "description": "Native wildflower seeds perfect for naturalizing. Bright orange blooms attract butterflies.",
            "category": "seeds",
            "price": 4.99,
            "is_active": true,
            "is_featured": false,
            "in_stock": true
        }
    ]',
    '{
        "monday": {"open": "07:00", "close": "16:00", "closed": false},
        "tuesday": {"open": "07:00", "close": "16:00", "closed": false},
        "wednesday": {"open": "07:00", "close": "16:00", "closed": false},
        "thursday": {"open": "07:00", "close": "16:00", "closed": false},
        "friday": {"open": "07:00", "close": "16:00", "closed": false},
        "saturday": {"open": "08:00", "close": "15:00", "closed": false},
        "sunday": {"open": "closed", "close": "closed", "closed": true}
    }'
);

-- =====================================================
-- 7. COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.site_templates IS 'Pre-built site templates for quick site creation with default content and configuration';
COMMENT ON FUNCTION public.create_site_with_template(VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSON) IS 'Create a new site using a template with default content and products - admin only';
COMMENT ON FUNCTION public.get_site_templates(VARCHAR, BOOLEAN) IS 'Get available site templates with optional filtering';
COMMENT ON FUNCTION public.check_subdomain_availability(VARCHAR) IS 'Check if a subdomain is available for use';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- This migration successfully implements template system for site creation:
-- 1. Created site_templates table with comprehensive template data
-- 2. Added template-based site creation function
-- 3. Included default content and products for templates
-- 4. Created template management functions
-- 5. Added subdomain availability checking
-- 6. Inserted sample templates (Garden Center Basic, Plant Nursery Professional)
-- 7. Proper RLS policies for security