-- Content Backup Script for Plant Shop Migration
-- Run this script before applying the plant shop content migration
-- This creates backup tables to preserve existing content data

-- Create backup table for content with timestamp
CREATE TABLE IF NOT EXISTS public.content_backup_20250910 AS 
SELECT * FROM public.content;

-- Add creation timestamp to backup table
ALTER TABLE public.content_backup_20250910 
ADD COLUMN IF NOT EXISTS backup_created_at TIMESTAMPTZ DEFAULT NOW();

-- Create backup table for any content-related metadata
CREATE TABLE IF NOT EXISTS public.content_migration_log AS (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_name VARCHAR(255) NOT NULL,
  backup_table_name VARCHAR(255) NOT NULL,
  record_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  migration_status VARCHAR(50) DEFAULT 'backup_created'
);

-- Log the backup creation
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
  'backup_created'
FROM public.content;

-- Grant appropriate permissions for backup table
GRANT SELECT ON public.content_backup_20250910 TO authenticated;
GRANT SELECT ON public.content_migration_log TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE public.content_backup_20250910 IS 'Backup of content table before plant shop content types migration on 2025-09-10';
COMMENT ON TABLE public.content_migration_log IS 'Migration tracking table for content schema changes';

-- Show backup summary
SELECT 
  'Backup created successfully' as status,
  COUNT(*) as records_backed_up,
  NOW() as backup_timestamp
FROM public.content_backup_20250910;