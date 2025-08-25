-- Migration: Add S3 Storage Support
-- Description: Adds columns to support dual storage (Supabase + S3/CDN) during migration period
-- Author: System
-- Date: 2025-08-26

-- ============================================================================
-- PRODUCT IMAGES TABLE MODIFICATIONS
-- ============================================================================

-- Add storage type and S3 key columns to product_images
ALTER TABLE product_images 
ADD COLUMN IF NOT EXISTS storage_type TEXT DEFAULT 'supabase' 
  CHECK (storage_type IN ('supabase', 's3')),
ADD COLUMN IF NOT EXISTS s3_key TEXT,
ADD COLUMN IF NOT EXISTS s3_bucket TEXT,
ADD COLUMN IF NOT EXISTS cdn_url TEXT,
ADD COLUMN IF NOT EXISTS upload_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS migrated_at TIMESTAMP WITH TIME ZONE;

-- Add index for storage type queries
CREATE INDEX IF NOT EXISTS idx_product_images_storage_type 
ON product_images(storage_type);

-- Add index for migration tracking
CREATE INDEX IF NOT EXISTS idx_product_images_migrated_at 
ON product_images(migrated_at) 
WHERE migrated_at IS NOT NULL;

-- ============================================================================
-- MEDIA FILES TABLE MODIFICATIONS
-- ============================================================================

-- Add storage type and S3 key columns to media_files
ALTER TABLE media_files 
ADD COLUMN IF NOT EXISTS storage_type TEXT DEFAULT 'supabase' 
  CHECK (storage_type IN ('supabase', 's3')),
ADD COLUMN IF NOT EXISTS s3_key TEXT,
ADD COLUMN IF NOT EXISTS s3_bucket TEXT,
ADD COLUMN IF NOT EXISTS cdn_url TEXT,
ADD COLUMN IF NOT EXISTS upload_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS migrated_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for media_files
CREATE INDEX IF NOT EXISTS idx_media_files_storage_type 
ON media_files(storage_type);

CREATE INDEX IF NOT EXISTS idx_media_files_migrated_at 
ON media_files(migrated_at) 
WHERE migrated_at IS NOT NULL;

-- ============================================================================
-- SITES TABLE MODIFICATIONS (for logo storage)
-- ============================================================================

-- Add storage type and S3 key columns for site logos
ALTER TABLE sites 
ADD COLUMN IF NOT EXISTS logo_storage_type TEXT DEFAULT 'supabase' 
  CHECK (logo_storage_type IN ('supabase', 's3')),
ADD COLUMN IF NOT EXISTS logo_s3_key TEXT,
ADD COLUMN IF NOT EXISTS logo_s3_bucket TEXT,
ADD COLUMN IF NOT EXISTS logo_cdn_url TEXT,
ADD COLUMN IF NOT EXISTS logo_migrated_at TIMESTAMP WITH TIME ZONE;

-- Add index for logo storage queries
CREATE INDEX IF NOT EXISTS idx_sites_logo_storage_type 
ON sites(logo_storage_type);

-- ============================================================================
-- PROFILES TABLE MODIFICATIONS (for avatar storage)
-- ============================================================================

-- Add storage type and S3 key columns for profile avatars
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_storage_type TEXT DEFAULT 'supabase' 
  CHECK (avatar_storage_type IN ('supabase', 's3')),
ADD COLUMN IF NOT EXISTS avatar_s3_key TEXT,
ADD COLUMN IF NOT EXISTS avatar_s3_bucket TEXT,
ADD COLUMN IF NOT EXISTS avatar_cdn_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_migrated_at TIMESTAMP WITH TIME ZONE;

-- Add index for avatar storage queries
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_storage_type 
ON profiles(avatar_storage_type);

-- ============================================================================
-- PRODUCT CATEGORIES TABLE MODIFICATIONS (for category images)
-- ============================================================================

-- Add storage type and S3 key columns for category images
ALTER TABLE product_categories 
ADD COLUMN IF NOT EXISTS image_storage_type TEXT DEFAULT 'supabase' 
  CHECK (image_storage_type IN ('supabase', 's3')),
ADD COLUMN IF NOT EXISTS image_s3_key TEXT,
ADD COLUMN IF NOT EXISTS image_s3_bucket TEXT,
ADD COLUMN IF NOT EXISTS image_cdn_url TEXT,
ADD COLUMN IF NOT EXISTS image_migrated_at TIMESTAMP WITH TIME ZONE;

-- Add index for category image storage queries
CREATE INDEX IF NOT EXISTS idx_product_categories_image_storage_type 
ON product_categories(image_storage_type);

-- ============================================================================
-- HELPER FUNCTIONS FOR URL GENERATION
-- ============================================================================

-- Function to get the appropriate image URL based on storage type
CREATE OR REPLACE FUNCTION get_image_url(
  storage_type TEXT,
  supabase_url TEXT,
  cdn_url TEXT
) RETURNS TEXT AS $$
BEGIN
  -- If CDN URL is available and storage type is S3, use CDN
  IF storage_type = 's3' AND cdn_url IS NOT NULL THEN
    RETURN cdn_url;
  END IF;
  
  -- Otherwise fall back to Supabase URL
  RETURN supabase_url;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate S3 key from site and resource IDs
CREATE OR REPLACE FUNCTION generate_s3_key(
  site_id UUID,
  resource_type TEXT,
  resource_id UUID,
  filename TEXT
) RETURNS TEXT AS $$
BEGIN
  RETURN CONCAT(
    site_id::TEXT, '/',
    resource_type, '/',
    resource_id::TEXT, '/',
    filename
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- MIGRATION TRACKING TABLE
-- ============================================================================

-- Create table to track migration progress
CREATE TABLE IF NOT EXISTS storage_migration_log (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  old_storage_type TEXT NOT NULL,
  new_storage_type TEXT NOT NULL,
  old_url TEXT,
  new_url TEXT,
  s3_key TEXT,
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'rolled_back')),
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(table_name, record_id)
);

-- Add indexes for migration log
CREATE INDEX IF NOT EXISTS idx_storage_migration_log_status 
ON storage_migration_log(status);

CREATE INDEX IF NOT EXISTS idx_storage_migration_log_created_at 
ON storage_migration_log(created_at);

-- ============================================================================
-- BACKWARD COMPATIBILITY VIEWS
-- ============================================================================

-- Create view for product images that handles both storage types
CREATE OR REPLACE VIEW v_product_images_compatible AS
SELECT 
  id,
  product_id,
  site_id,
  COALESCE(cdn_url, url) as url,
  position,
  is_primary,
  alt_text,
  caption,
  created_at,
  updated_at,
  storage_type,
  s3_key,
  cdn_url
FROM product_images;

-- Create view for media files that handles both storage types
CREATE OR REPLACE VIEW v_media_files_compatible AS
SELECT 
  id,
  site_id,
  uploaded_by,
  COALESCE(cdn_url, file_url) as file_url,
  file_name,
  file_type,
  file_size_bytes,
  alt_text,
  created_at,
  storage_type,
  s3_key,
  cdn_url
FROM media_files;

-- ============================================================================
-- RLS POLICY UPDATES
-- ============================================================================

-- Update RLS policies to handle both storage types
-- Note: Existing policies remain unchanged as they work on row level

-- Add policy for storage migration log (admin only)
ALTER TABLE storage_migration_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage storage migration log"
ON storage_migration_log
FOR ALL
USING (public.is_admin());

-- ============================================================================
-- MIGRATION HELPER FUNCTIONS
-- ============================================================================

-- Function to mark an image as migrated
CREATE OR REPLACE FUNCTION mark_image_migrated(
  p_table_name TEXT,
  p_record_id UUID,
  p_s3_key TEXT,
  p_s3_bucket TEXT,
  p_cdn_url TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_success BOOLEAN := FALSE;
BEGIN
  -- Update the appropriate table based on table name
  CASE p_table_name
    WHEN 'product_images' THEN
      UPDATE product_images 
      SET 
        storage_type = 's3',
        s3_key = p_s3_key,
        s3_bucket = p_s3_bucket,
        cdn_url = p_cdn_url,
        migrated_at = CURRENT_TIMESTAMP
      WHERE id = p_record_id;
      
    WHEN 'media_files' THEN
      UPDATE media_files 
      SET 
        storage_type = 's3',
        s3_key = p_s3_key,
        s3_bucket = p_s3_bucket,
        cdn_url = p_cdn_url,
        migrated_at = CURRENT_TIMESTAMP
      WHERE id = p_record_id;
      
    WHEN 'sites' THEN
      UPDATE sites 
      SET 
        logo_storage_type = 's3',
        logo_s3_key = p_s3_key,
        logo_s3_bucket = p_s3_bucket,
        logo_cdn_url = p_cdn_url,
        logo_migrated_at = CURRENT_TIMESTAMP
      WHERE id = p_record_id;
      
    WHEN 'profiles' THEN
      UPDATE profiles 
      SET 
        avatar_storage_type = 's3',
        avatar_s3_key = p_s3_key,
        avatar_s3_bucket = p_s3_bucket,
        avatar_cdn_url = p_cdn_url,
        avatar_migrated_at = CURRENT_TIMESTAMP
      WHERE id = p_record_id;
      
    WHEN 'product_categories' THEN
      UPDATE product_categories 
      SET 
        image_storage_type = 's3',
        image_s3_key = p_s3_key,
        image_s3_bucket = p_s3_bucket,
        image_cdn_url = p_cdn_url,
        image_migrated_at = CURRENT_TIMESTAMP
      WHERE id = p_record_id;
      
    ELSE
      RAISE EXCEPTION 'Unknown table name: %', p_table_name;
  END CASE;
  
  -- Update migration log
  INSERT INTO storage_migration_log (
    table_name,
    record_id,
    old_storage_type,
    new_storage_type,
    new_url,
    s3_key,
    status,
    started_at,
    completed_at
  ) VALUES (
    p_table_name,
    p_record_id,
    'supabase',
    's3',
    p_cdn_url,
    p_s3_key,
    'completed',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (table_name, record_id) 
  DO UPDATE SET
    new_storage_type = 's3',
    new_url = p_cdn_url,
    s3_key = p_s3_key,
    status = 'completed',
    completed_at = CURRENT_TIMESTAMP;
  
  v_success := TRUE;
  RETURN v_success;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error in migration log
    INSERT INTO storage_migration_log (
      table_name,
      record_id,
      old_storage_type,
      new_storage_type,
      status,
      error_message,
      started_at
    ) VALUES (
      p_table_name,
      p_record_id,
      'supabase',
      's3',
      'failed',
      SQLERRM,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (table_name, record_id) 
    DO UPDATE SET
      status = 'failed',
      error_message = SQLERRM;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to rollback a migrated image
CREATE OR REPLACE FUNCTION rollback_image_migration(
  p_table_name TEXT,
  p_record_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Update the appropriate table based on table name
  CASE p_table_name
    WHEN 'product_images' THEN
      UPDATE product_images 
      SET 
        storage_type = 'supabase',
        migrated_at = NULL
      WHERE id = p_record_id;
      
    WHEN 'media_files' THEN
      UPDATE media_files 
      SET 
        storage_type = 'supabase',
        migrated_at = NULL
      WHERE id = p_record_id;
      
    WHEN 'sites' THEN
      UPDATE sites 
      SET 
        logo_storage_type = 'supabase',
        logo_migrated_at = NULL
      WHERE id = p_record_id;
      
    WHEN 'profiles' THEN
      UPDATE profiles 
      SET 
        avatar_storage_type = 'supabase',
        avatar_migrated_at = NULL
      WHERE id = p_record_id;
      
    WHEN 'product_categories' THEN
      UPDATE product_categories 
      SET 
        image_storage_type = 'supabase',
        image_migrated_at = NULL
      WHERE id = p_record_id;
      
    ELSE
      RAISE EXCEPTION 'Unknown table name: %', p_table_name;
  END CASE;
  
  -- Update migration log
  UPDATE storage_migration_log 
  SET 
    status = 'rolled_back',
    completed_at = CURRENT_TIMESTAMP
  WHERE table_name = p_table_name 
    AND record_id = p_record_id;
  
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION STATISTICS FUNCTIONS
-- ============================================================================

-- Function to get migration statistics
CREATE OR REPLACE FUNCTION get_migration_stats()
RETURNS TABLE (
  table_name TEXT,
  total_records BIGINT,
  migrated_records BIGINT,
  pending_records BIGINT,
  failed_records BIGINT,
  migration_percentage NUMERIC(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      'product_images' as tbl,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE storage_type = 's3') as migrated
    FROM product_images
    
    UNION ALL
    
    SELECT 
      'media_files' as tbl,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE storage_type = 's3') as migrated
    FROM media_files
    
    UNION ALL
    
    SELECT 
      'sites' as tbl,
      COUNT(*) FILTER (WHERE logo_url IS NOT NULL) as total,
      COUNT(*) FILTER (WHERE logo_storage_type = 's3') as migrated
    FROM sites
    
    UNION ALL
    
    SELECT 
      'profiles' as tbl,
      COUNT(*) FILTER (WHERE avatar_url IS NOT NULL) as total,
      COUNT(*) FILTER (WHERE avatar_storage_type = 's3') as migrated
    FROM profiles
    
    UNION ALL
    
    SELECT 
      'product_categories' as tbl,
      COUNT(*) FILTER (WHERE image_url IS NOT NULL) as total,
      COUNT(*) FILTER (WHERE image_storage_type = 's3') as migrated
    FROM product_categories
  ),
  log_stats AS (
    SELECT 
      table_name,
      COUNT(*) FILTER (WHERE status = 'failed') as failed
    FROM storage_migration_log
    GROUP BY table_name
  )
  SELECT 
    s.tbl as table_name,
    s.total as total_records,
    s.migrated as migrated_records,
    s.total - s.migrated as pending_records,
    COALESCE(l.failed, 0) as failed_records,
    CASE 
      WHEN s.total = 0 THEN 0
      ELSE ROUND((s.migrated::NUMERIC / s.total::NUMERIC) * 100, 2)
    END as migration_percentage
  FROM stats s
  LEFT JOIN log_stats l ON s.tbl = l.table_name
  ORDER BY s.tbl;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT ON v_product_images_compatible TO authenticated;
GRANT SELECT ON v_media_files_compatible TO authenticated;
GRANT EXECUTE ON FUNCTION get_image_url TO authenticated;
GRANT EXECUTE ON FUNCTION generate_s3_key TO authenticated;

-- Grant admin permissions for migration functions
GRANT EXECUTE ON FUNCTION mark_image_migrated TO authenticated;
GRANT EXECUTE ON FUNCTION rollback_image_migration TO authenticated;
GRANT EXECUTE ON FUNCTION get_migration_stats TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN product_images.storage_type IS 'Storage backend type: supabase or s3';
COMMENT ON COLUMN product_images.s3_key IS 'S3 object key for CDN storage';
COMMENT ON COLUMN product_images.cdn_url IS 'Full CDN URL for direct image access';
COMMENT ON COLUMN product_images.migrated_at IS 'Timestamp when image was migrated to S3';

COMMENT ON TABLE storage_migration_log IS 'Tracks the progress of storage migration from Supabase to S3';
COMMENT ON FUNCTION get_image_url IS 'Returns the appropriate image URL based on storage type';
COMMENT ON FUNCTION mark_image_migrated IS 'Marks an image as successfully migrated to S3 storage';
COMMENT ON FUNCTION get_migration_stats IS 'Returns migration statistics for all image tables';