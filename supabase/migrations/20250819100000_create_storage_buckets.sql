-- Create storage buckets for product images
-- This migration sets up the necessary storage infrastructure for the application

-- Insert the product-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Note: Storage object policies are managed by Supabase dashboard or through Supabase CLI
-- The policies below are provided as documentation for what needs to be configured

-- Required storage policies (to be configured in Supabase dashboard):
-- 1. Public users can view product images (SELECT)
-- 2. Authenticated users can upload product images for their sites (INSERT) 
-- 3. Authenticated users can update product images for their sites (UPDATE)
-- 4. Authenticated users can delete product images for their sites (DELETE)

-- Create a function to validate user access to upload product images
CREATE OR REPLACE FUNCTION can_upload_product_image(site_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has access to the site
  RETURN EXISTS (
    SELECT 1 FROM sites s
    WHERE s.id = site_id_param
    AND (
      s.user_id = user_id_param
      OR EXISTS (
        SELECT 1 FROM site_memberships sm
        WHERE sm.site_id = s.id
        AND sm.user_id = user_id_param
        AND sm.role IN ('owner', 'admin', 'editor')
      )
    )
  );
END;
$$;

-- Create a function to clean up temporary images older than 24 hours
CREATE OR REPLACE FUNCTION cleanup_temp_product_images()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete temporary images from product_images table
  DELETE FROM product_images
  WHERE url LIKE '%/temp/%'
  AND created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION can_upload_product_image TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_temp_product_images TO authenticated;