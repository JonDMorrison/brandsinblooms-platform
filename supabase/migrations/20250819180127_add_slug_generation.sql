-- Migration: Add slug generation support for products
-- Description: Ensures unique slug constraints and adds database-level slug generation function

-- Ensure the slug column exists and has proper constraints
DO $$ 
BEGIN
  -- Check if slug column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.products 
    ADD COLUMN slug VARCHAR(255);
  END IF;
END $$;

-- Drop existing constraint if it exists (to avoid errors)
ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS unique_slug_per_site;

-- Add unique constraint for slug per site
ALTER TABLE public.products 
ADD CONSTRAINT unique_slug_per_site 
UNIQUE (site_id, slug);

-- Create index for faster slug lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_products_slug 
ON public.products(slug);

-- Create index for slug pattern matching (for finding slugs with suffixes)
CREATE INDEX IF NOT EXISTS idx_products_site_slug 
ON public.products(site_id, slug);

-- Database function to sanitize and generate slugs
CREATE OR REPLACE FUNCTION sanitize_slug(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  -- Convert to lowercase
  result := lower(input_text);
  
  -- Remove accents/diacritics by converting to ASCII
  result := unaccent(result);
  
  -- Replace non-alphanumeric characters with hyphens
  result := regexp_replace(result, '[^a-z0-9\s-]', '', 'g');
  
  -- Replace spaces and underscores with hyphens
  result := regexp_replace(result, '[\s_]+', '-', 'g');
  
  -- Remove multiple consecutive hyphens
  result := regexp_replace(result, '-+', '-', 'g');
  
  -- Remove leading and trailing hyphens
  result := trim(both '-' from result);
  
  -- Truncate to 100 characters
  IF length(result) > 100 THEN
    result := substring(result from 1 for 100);
    -- Remove any trailing hyphen from truncation
    result := trim(trailing '-' from result);
  END IF;
  
  -- Return empty string as NULL (will trigger fallback in trigger)
  IF result = '' OR result IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate unique slug for a product
CREATE OR REPLACE FUNCTION generate_unique_slug(
  p_name TEXT,
  p_site_id UUID,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
  slug_exists BOOLEAN;
BEGIN
  -- Generate base slug
  base_slug := sanitize_slug(p_name);
  
  -- If base slug is null or empty, generate fallback
  IF base_slug IS NULL OR base_slug = '' THEN
    base_slug := 'product-' || extract(epoch from now())::bigint || '-' || floor(random() * 1000)::int;
  END IF;
  
  final_slug := base_slug;
  
  -- Check if slug exists (excluding current product if editing)
  LOOP
    IF p_exclude_id IS NOT NULL THEN
      SELECT EXISTS(
        SELECT 1 FROM public.products 
        WHERE site_id = p_site_id 
        AND slug = final_slug 
        AND id != p_exclude_id
      ) INTO slug_exists;
    ELSE
      SELECT EXISTS(
        SELECT 1 FROM public.products 
        WHERE site_id = p_site_id 
        AND slug = final_slug
      ) INTO slug_exists;
    END IF;
    
    EXIT WHEN NOT slug_exists;
    
    -- Append counter and try again
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
    
    -- Safety check to prevent infinite loops
    IF counter > 1000 THEN
      final_slug := base_slug || '-' || extract(epoch from now())::bigint;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-generate slug on insert/update
CREATE OR REPLACE FUNCTION auto_generate_product_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate slug if it's NULL or empty
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    -- Generate unique slug from product name
    NEW.slug := generate_unique_slug(NEW.name, NEW.site_id, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_generate_product_slug ON public.products;

-- Create trigger for auto-generating slugs on insert
CREATE TRIGGER trigger_auto_generate_product_slug
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_product_slug();

-- Note: We don't add the trigger for UPDATE to avoid overwriting manually set slugs
-- The application layer will handle slug updates when needed

-- Enable the unaccent extension if not already enabled
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION sanitize_slug(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION generate_unique_slug(TEXT, UUID, UUID) TO authenticated, service_role;

-- Add comment to slug column
COMMENT ON COLUMN public.products.slug IS 'URL-friendly identifier for the product, unique within each site';

-- Migrate existing products without slugs
-- This will be handled by a separate script to avoid blocking the migration
-- See: scripts/generate-existing-slugs.ts