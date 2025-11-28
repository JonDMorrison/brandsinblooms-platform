-- Add Navigation System
-- Implements menus and menu_items tables for dynamic site navigation

-- =====================================================
-- 1. MENUS TABLE
-- =====================================================

CREATE TABLE public.menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL, -- e.g., 'main', 'footer'
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(site_id, name)
);

-- =====================================================
-- 2. MENU ITEMS TABLE
-- =====================================================

CREATE TABLE public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
    
    label VARCHAR(100) NOT NULL,
    link_type VARCHAR(20) NOT NULL CHECK (link_type IN ('internal_page', 'blog_index', 'external')),
    
    -- For internal pages
    target_content_id UUID REFERENCES public.content(id) ON DELETE SET NULL,
    
    -- For external links
    url TEXT,
    
    is_primary_button BOOLEAN DEFAULT false,
    position INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- 3. INDEXES
-- =====================================================

CREATE INDEX idx_menus_site_name ON public.menus(site_id, name);
CREATE INDEX idx_menu_items_menu_position ON public.menu_items(menu_id, position);

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Menus Policies

-- Public read access (for rendering the site)
CREATE POLICY "public_menus_read" ON public.menus
    FOR SELECT USING (true);

-- Site owners/editors can manage menus
CREATE POLICY "authenticated_menus_manage" ON public.menus
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.site_memberships sm
            WHERE sm.site_id = menus.site_id 
            AND sm.user_id = auth.uid() 
            AND sm.is_active = true
            AND sm.role IN ('owner', 'editor')
        )
    );

-- Menu Items Policies

-- Public read access
CREATE POLICY "public_menu_items_read" ON public.menu_items
    FOR SELECT USING (true);

-- Site owners/editors can manage menu items
CREATE POLICY "authenticated_menu_items_manage" ON public.menu_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.menus m
            JOIN public.site_memberships sm ON sm.site_id = m.site_id
            WHERE m.id = menu_items.menu_id
            AND sm.user_id = auth.uid()
            AND sm.is_active = true
            AND sm.role IN ('owner', 'editor')
        )
    );

-- =====================================================
-- 5. TRIGGER FOR UPDATED_AT
-- =====================================================

-- Reuse existing update_updated_at_column function if available, otherwise create simple trigger
-- Assuming standard Supabase setup usually has moddatetime extension or similar, but let's be safe and use a simple function if needed.
-- Since we don't know if a generic trigger exists, we'll create a specific one or rely on application logic. 
-- For now, we'll skip the trigger creation to avoid conflicts if a global one exists, 
-- but we will ensure the application updates `updated_at`.

-- =====================================================
-- 6. COMMENTS
-- =====================================================

COMMENT ON TABLE public.menus IS 'Navigation menus for sites (e.g. main, footer)';
COMMENT ON TABLE public.menu_items IS 'Individual items within a navigation menu';
