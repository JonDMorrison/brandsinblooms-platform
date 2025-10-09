-- Fix Content Type Alignment
-- Aligns content_type column with layout field in JSONB content
-- Changes content_type from specific types (privacy_page, plant_care_guide, etc.)
-- to semantic layout types (landing, about, contact, other)

-- =====================================================
-- BACKUP EXISTING DATA
-- =====================================================

DO $$
BEGIN
    -- Create backup table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_backup_20251009') THEN
        CREATE TABLE public.content_backup_20251009 AS
        SELECT * FROM public.content;

        ALTER TABLE public.content_backup_20251009
        ADD COLUMN backup_created_at TIMESTAMPTZ DEFAULT NOW();

        RAISE NOTICE 'Backup table created: content_backup_20251009';
    ELSE
        RAISE NOTICE 'Backup table already exists, proceeding with migration';
    END IF;
END $$;

-- =====================================================
-- UPDATE CONSTRAINT: Drop old constraint first
-- =====================================================

-- Drop old constraint BEFORE data migration to allow new values
ALTER TABLE public.content DROP CONSTRAINT IF EXISTS content_content_type_check;

-- =====================================================
-- DATA MIGRATION: Align content_type with layout
-- =====================================================

-- First, update pages based on their layout in content JSONB
-- This ensures layout field takes precedence

UPDATE public.content
SET content_type = 'landing'
WHERE content->>'layout' = 'landing'
AND content_type != 'landing';

UPDATE public.content
SET content_type = 'about'
WHERE content->>'layout' = 'about'
AND content_type != 'about';

UPDATE public.content
SET content_type = 'contact'
WHERE content->>'layout' = 'contact'
AND content_type != 'contact';

-- Handle 'other' layout explicitly
UPDATE public.content
SET content_type = 'other'
WHERE content->>'layout' = 'other'
AND content_type != 'other';

-- Migrate all remaining page-like content_types to 'other'
-- This includes: page, privacy_page, terms_page, seasonal_guide, plant_care_guide,
-- product_showcase, plant_catalog, home_page, about_page, contact_page
UPDATE public.content
SET content_type = 'other'
WHERE content_type IN (
    'page',
    'privacy_page',
    'terms_page',
    'seasonal_guide',
    'plant_care_guide',
    'product_showcase',
    'plant_catalog',
    'home_page',
    'about_page',
    'contact_page'
)
-- Don't override if layout already set it to landing/about/contact
AND content_type NOT IN ('landing', 'about', 'contact', 'other', 'blog_post', 'event');

-- =====================================================
-- ADD NEW CONSTRAINT: Allow only semantic layout types
-- =====================================================

-- Add new constraint with semantic layout types only
ALTER TABLE public.content ADD CONSTRAINT content_content_type_check
    CHECK (content_type IN (
        -- Page layout types (aligned with content.layout field)
        'landing',      -- Home/landing pages
        'about',        -- About pages
        'contact',      -- Contact pages
        'other',        -- All other pages (privacy, terms, guides, etc.)
        -- Content types
        'blog_post',    -- Blog articles
        'event'         -- Event pages
    ));

-- =====================================================
-- VALIDATION: Verify migration success
-- =====================================================

DO $$
DECLARE
    invalid_count INTEGER;
    total_count INTEGER;
    landing_count INTEGER;
    about_count INTEGER;
    contact_count INTEGER;
    other_count INTEGER;
    blog_count INTEGER;
    event_count INTEGER;
BEGIN
    -- Check for any invalid content_type values
    SELECT COUNT(*) INTO invalid_count
    FROM public.content
    WHERE content_type NOT IN ('landing', 'about', 'contact', 'other', 'blog_post', 'event');

    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Migration failed: % records have invalid content_type values', invalid_count;
    END IF;

    -- Get counts by type
    SELECT COUNT(*) INTO total_count FROM public.content;
    SELECT COUNT(*) INTO landing_count FROM public.content WHERE content_type = 'landing';
    SELECT COUNT(*) INTO about_count FROM public.content WHERE content_type = 'about';
    SELECT COUNT(*) INTO contact_count FROM public.content WHERE content_type = 'contact';
    SELECT COUNT(*) INTO other_count FROM public.content WHERE content_type = 'other';
    SELECT COUNT(*) INTO blog_count FROM public.content WHERE content_type = 'blog_post';
    SELECT COUNT(*) INTO event_count FROM public.content WHERE content_type = 'event';

    RAISE NOTICE '=== Content Type Migration Summary ===';
    RAISE NOTICE 'Total content records: %', total_count;
    RAISE NOTICE 'Landing pages: %', landing_count;
    RAISE NOTICE 'About pages: %', about_count;
    RAISE NOTICE 'Contact pages: %', contact_count;
    RAISE NOTICE 'Other pages: %', other_count;
    RAISE NOTICE 'Blog posts: %', blog_count;
    RAISE NOTICE 'Events: %', event_count;
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Backup table: content_backup_20251009';
END $$;

-- =====================================================
-- ADD DOCUMENTATION
-- =====================================================

COMMENT ON CONSTRAINT content_content_type_check ON public.content IS
'Content types aligned with layout: landing, about, contact, other (for all other pages), blog_post, event';

-- =====================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- =====================================================

-- To rollback this migration:
-- 1. DROP CONSTRAINT content_content_type_check;
-- 2. Restore data: INSERT INTO content SELECT * FROM content_backup_20251009 ON CONFLICT (id) DO UPDATE SET content_type = EXCLUDED.content_type;
-- 3. Re-apply old constraint from migration 20250910000000_add_plant_shop_content_types.sql
