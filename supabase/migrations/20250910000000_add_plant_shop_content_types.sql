-- Plant Shop Content Migration
-- Extends the content system to support plant shop page types and block structures
-- Maintains backward compatibility with existing content system

-- =====================================================
-- BACKUP VERIFICATION
-- =====================================================

-- Create migration log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.content_migration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_name VARCHAR(255) NOT NULL,
  backup_table_name VARCHAR(255) NOT NULL,
  record_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  migration_status VARCHAR(50) DEFAULT 'backup_created'
);

-- Verify backup exists before proceeding
DO $$
BEGIN
    -- Check if backup table exists, create if not
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_backup_20250910') THEN
        -- Create backup table
        CREATE TABLE public.content_backup_20250910 AS 
        SELECT * FROM public.content;
        
        -- Add creation timestamp
        ALTER TABLE public.content_backup_20250910 
        ADD COLUMN backup_created_at TIMESTAMPTZ DEFAULT NOW();
        
        -- Log the backup
        INSERT INTO public.content_migration_log (
            migration_name, 
            backup_table_name, 
            record_count,
            migration_status
        ) 
        SELECT 
            'plant_shop_content_types_migration',
            'content_backup_20250910',
            COUNT(*),
            'backup_created_during_migration'
        FROM public.content;
        
        RAISE NOTICE 'Backup table created during migration';
    ELSE
        RAISE NOTICE 'Backup table already exists, proceeding with migration';
    END IF;
END $$;

-- =====================================================
-- EXTEND CONTENT TYPES FOR PLANT SHOP PAGES
-- =====================================================

-- Remove existing content_type constraint
ALTER TABLE public.content DROP CONSTRAINT IF EXISTS content_content_type_check;

-- Add new constraint with plant shop page types
ALTER TABLE public.content ADD CONSTRAINT content_content_type_check 
    CHECK (content_type IN (
        -- Existing types
        'page', 'blog_post', 'event',
        -- Plant shop page types  
        'home_page', 'about_page', 'contact_page', 'privacy_page', 'terms_page',
        -- Plant shop content types
        'plant_catalog', 'plant_care_guide', 'seasonal_guide', 'product_showcase'
    ));

-- =====================================================
-- ENHANCE JSONB CONTENT INDEXING
-- =====================================================

-- Add GIN index for content JSONB queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_content_jsonb_gin ON public.content USING gin(content);

-- Add specific indexes for common plant shop content queries
CREATE INDEX IF NOT EXISTS idx_content_layout_type ON public.content 
    USING gin((content -> 'layout')) 
    WHERE content ? 'layout';

-- Index for content sections structure
CREATE INDEX IF NOT EXISTS idx_content_sections ON public.content 
    USING gin((content -> 'sections')) 
    WHERE content ? 'sections';

-- Index for content version for future migration tracking  
CREATE INDEX IF NOT EXISTS idx_content_version ON public.content 
    USING gin((content -> 'version')) 
    WHERE content ? 'version';

-- =====================================================
-- ADD PLANT-SPECIFIC METADATA SUPPORT
-- =====================================================

-- Add index for plant-specific metadata queries
CREATE INDEX IF NOT EXISTS idx_content_plant_metadata ON public.content 
    USING gin((meta_data -> 'plant_info')) 
    WHERE meta_data ? 'plant_info';

-- Index for care instructions in metadata
CREATE INDEX IF NOT EXISTS idx_content_care_metadata ON public.content 
    USING gin((meta_data -> 'care_level')) 
    WHERE meta_data ? 'care_level';

-- =====================================================
-- CONTENT VALIDATION FUNCTIONS
-- =====================================================

-- Function to validate plant shop content structure
CREATE OR REPLACE FUNCTION validate_plant_content(content_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Basic structure validation for new content format
    IF content_data ? 'version' AND content_data ? 'layout' AND content_data ? 'sections' THEN
        RETURN TRUE;
    END IF;
    
    -- Legacy content validation (backward compatibility)
    IF content_data ? 'title' OR content_data ? 'subtitle' OR content_data ? 'content' THEN
        RETURN TRUE;
    END IF;
    
    -- Empty content is valid
    IF content_data = '{}'::jsonb THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add check constraint for content validation (optional, can be enabled later)
-- ALTER TABLE public.content ADD CONSTRAINT content_structure_valid 
--     CHECK (validate_plant_content(content));

-- =====================================================
-- PLANT SHOP LAYOUT DEFAULTS
-- =====================================================

-- Function to create default plant shop page content
CREATE OR REPLACE FUNCTION create_plant_page_content(
    page_type TEXT,
    layout_type TEXT DEFAULT 'other'
)
RETURNS JSONB AS $$
DECLARE
    default_content JSONB;
BEGIN
    -- Base structure for new content format
    default_content := jsonb_build_object(
        'version', '1.0',
        'layout', layout_type,
        'sections', '{}'::jsonb,
        'settings', jsonb_build_object(
            'seo', '{}'::jsonb,
            'layout', jsonb_build_object(
                'containerWidth', 'normal',
                'spacing', 'normal'
            )
        )
    );
    
    -- Add page-specific default sections based on page type
    CASE page_type
        WHEN 'home_page' THEN
            default_content := jsonb_set(
                default_content,
                '{sections}',
                jsonb_build_object(
                    'hero', jsonb_build_object(
                        'type', 'hero',
                        'data', jsonb_build_object('content', '', 'alignment', 'center'),
                        'visible', true,
                        'order', 1
                    ),
                    'featured_plants', jsonb_build_object(
                        'type', 'plant_showcase',
                        'data', jsonb_build_object('items', '[]'::jsonb, 'columns', 3),
                        'visible', true,
                        'order', 2
                    )
                )
            );
        WHEN 'about_page' THEN
            default_content := jsonb_set(
                default_content,
                '{sections}',
                jsonb_build_object(
                    'hero', jsonb_build_object(
                        'type', 'hero',
                        'data', jsonb_build_object('content', '', 'alignment', 'center'),
                        'visible', true,
                        'order', 1
                    ),
                    'story', jsonb_build_object(
                        'type', 'richText',
                        'data', jsonb_build_object('content', ''),
                        'visible', true,
                        'order', 2
                    )
                )
            );
        WHEN 'contact_page' THEN
            default_content := jsonb_set(
                default_content,
                '{sections}',
                jsonb_build_object(
                    'header', jsonb_build_object(
                        'type', 'hero',
                        'data', jsonb_build_object('content', '', 'alignment', 'center'),
                        'visible', true,
                        'order', 1
                    ),
                    'contact_form', jsonb_build_object(
                        'type', 'form',
                        'data', jsonb_build_object(
                            'fields', jsonb_build_array(
                                jsonb_build_object('id', 'name', 'type', 'text', 'label', 'Name', 'required', true, 'order', 1),
                                jsonb_build_object('id', 'email', 'type', 'email', 'label', 'Email', 'required', true, 'order', 2),
                                jsonb_build_object('id', 'message', 'type', 'textarea', 'label', 'Message', 'required', true, 'order', 3)
                            )
                        ),
                        'visible', true,
                        'order', 2
                    )
                )
            );
        ELSE
            -- Default structure for other page types
            default_content := jsonb_set(
                default_content,
                '{sections}',
                jsonb_build_object(
                    'main_content', jsonb_build_object(
                        'type', 'richText',
                        'data', jsonb_build_object('content', ''),
                        'visible', true,
                        'order', 1
                    )
                )
            );
    END CASE;
    
    RETURN default_content;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- MIGRATION TRACKING AND VALIDATION
-- =====================================================

-- Update migration log
UPDATE public.content_migration_log 
SET migration_status = 'schema_extended', 
    created_at = NOW() 
WHERE migration_name = 'plant_shop_content_types_migration';

-- Add migration completion record
INSERT INTO public.content_migration_log (
    migration_name,
    backup_table_name,
    record_count,
    migration_status
) VALUES (
    'plant_shop_content_types_schema_complete',
    'content_backup_20250910',
    (SELECT COUNT(*) FROM public.content),
    'completed'
);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION validate_plant_content(JSONB) IS 'Validates plant shop content structure for both new and legacy formats';
COMMENT ON FUNCTION create_plant_page_content(TEXT, TEXT) IS 'Creates default content structure for plant shop page types';

-- Add column comments for new content types
COMMENT ON CONSTRAINT content_content_type_check ON public.content IS 'Extended to support plant shop page types: home_page, about_page, contact_page, privacy_page, terms_page, plant_catalog, plant_care_guide, seasonal_guide, product_showcase';

-- =====================================================
-- MIGRATION SUMMARY
-- =====================================================

-- Display migration summary
DO $$
DECLARE
    content_count INTEGER;
    new_indexes_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO content_count FROM public.content;
    SELECT COUNT(*) INTO new_indexes_count 
    FROM pg_indexes 
    WHERE tablename = 'content' 
    AND indexname LIKE 'idx_content_%';
    
    RAISE NOTICE 'Plant Shop Content Migration Completed Successfully';
    RAISE NOTICE 'Total content records: %', content_count;
    RAISE NOTICE 'Content indexes created: %', new_indexes_count;
    RAISE NOTICE 'New content types available: home_page, about_page, contact_page, privacy_page, terms_page, plant_catalog, plant_care_guide, seasonal_guide, product_showcase';
    RAISE NOTICE 'Backup table: content_backup_20250910';
END $$;