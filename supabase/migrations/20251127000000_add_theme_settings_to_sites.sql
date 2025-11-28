-- Add theme_settings JSONB column to sites table
-- This allows site owners to customize brand colors, typography, and layout styles

ALTER TABLE public.sites
ADD COLUMN IF NOT EXISTS theme_settings JSONB DEFAULT NULL;

-- Add GIN index for better JSONB query performance
CREATE INDEX IF NOT EXISTS idx_sites_theme_settings 
ON public.sites USING gin (theme_settings);

-- Add comment for documentation
COMMENT ON COLUMN public.sites.theme_settings IS 
'Site-specific theme and design settings including colors, fonts, and layout styles. Structure: { brandColor, accentColor, backgroundColor, textColor, fontFamily, borderRadius, headerStyle, footerStyle }';
