-- =====================================================
-- ADD SOCIAL MEDIA LINKS TO SITES TABLE
-- =====================================================
-- Migration to add social media profile URLs extracted from scraped websites
-- Part of Phase 2E: Social Media Extraction
--
-- Stores social media links as JSONB array for flexibility and efficient querying
-- Each link includes platform, URL, username, and confidence score
--
-- Example structure:
-- [
--   {
--     "platform": "facebook",
--     "url": "https://facebook.com/mybusiness",
--     "username": "mybusiness",
--     "confidence": 0.95
--   },
--   {
--     "platform": "instagram",
--     "url": "https://instagram.com/mybusiness",
--     "username": "mybusiness",
--     "confidence": 0.90
--   }
-- ]

-- Add social_media column to sites table
ALTER TABLE public.sites
ADD COLUMN social_media JSONB DEFAULT '[]' NOT NULL;

-- Add GIN index for efficient JSONB queries
-- This allows fast queries like: WHERE social_media @> '[{"platform": "instagram"}]'
CREATE INDEX idx_sites_social_media
ON public.sites USING GIN (social_media);

-- Add column comment for documentation
COMMENT ON COLUMN public.sites.social_media IS
'Extracted social media profile URLs from website scraping (Phase 2E).
Stores array of objects with platform, url, username, and confidence score.
Indexed with GIN for efficient platform-specific queries.';

-- =====================================================
-- HELPER FUNCTIONS FOR QUERYING SOCIAL MEDIA
-- =====================================================

-- Function to get all sites with a specific social media platform
CREATE OR REPLACE FUNCTION public.get_sites_with_social_platform(
    platform_name TEXT
)
RETURNS TABLE (
    site_id UUID,
    site_name VARCHAR(255),
    social_url TEXT,
    social_username TEXT,
    confidence DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id as site_id,
        s.name as site_name,
        (elem->>'url')::TEXT as social_url,
        (elem->>'username')::TEXT as social_username,
        (elem->>'confidence')::DECIMAL as confidence
    FROM public.sites s,
         jsonb_array_elements(s.social_media) elem
    WHERE elem->>'platform' = platform_name
    ORDER BY s.name;
END;
$$;

-- Function to get social media statistics
CREATE OR REPLACE FUNCTION public.get_social_media_stats()
RETURNS TABLE (
    platform TEXT,
    site_count BIGINT,
    avg_confidence DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only allow admins to access this function
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    RETURN QUERY
    SELECT
        elem->>'platform' as platform,
        COUNT(DISTINCT s.id) as site_count,
        ROUND(AVG((elem->>'confidence')::DECIMAL), 2) as avg_confidence
    FROM public.sites s,
         jsonb_array_elements(s.social_media) elem
    WHERE jsonb_array_length(s.social_media) > 0
    GROUP BY elem->>'platform'
    ORDER BY site_count DESC;
END;
$$;

-- Add helpful comment explaining usage
COMMENT ON FUNCTION public.get_sites_with_social_platform IS
'Returns all sites that have a profile on the specified social media platform.
Usage: SELECT * FROM get_sites_with_social_platform(''instagram'');';

COMMENT ON FUNCTION public.get_social_media_stats IS
'Returns statistics about social media platform usage across all sites.
Requires admin privileges. Shows platform name, number of sites, and average confidence score.';

-- =====================================================
-- EXAMPLE QUERIES
-- =====================================================

-- Example 1: Find all sites with Instagram
-- SELECT * FROM sites WHERE social_media @> '[{"platform": "instagram"}]';

-- Example 2: Count sites by social media platform
-- SELECT
--   elem->>'platform' as platform,
--   COUNT(*) as site_count
-- FROM sites, jsonb_array_elements(social_media) elem
-- GROUP BY elem->>'platform'
-- ORDER BY site_count DESC;

-- Example 3: Find sites with multiple social media platforms
-- SELECT
--   id,
--   name,
--   jsonb_array_length(social_media) as platform_count
-- FROM sites
-- WHERE jsonb_array_length(social_media) > 3
-- ORDER BY platform_count DESC;

-- Example 4: Get all social links for a specific site
-- SELECT
--   elem->>'platform' as platform,
--   elem->>'url' as url,
--   elem->>'username' as username,
--   (elem->>'confidence')::DECIMAL as confidence
-- FROM sites, jsonb_array_elements(social_media) elem
-- WHERE id = 'your-site-id-here'
-- ORDER BY (elem->>'confidence')::DECIMAL DESC;

-- Example 5: Find sites missing social media
-- SELECT id, name, business_name
-- FROM sites
-- WHERE jsonb_array_length(social_media) = 0
--   AND is_active = true;

-- Example 6: Find high-confidence Instagram profiles
-- SELECT
--   s.name,
--   elem->>'url' as instagram_url,
--   elem->>'username' as handle
-- FROM sites s, jsonb_array_elements(s.social_media) elem
-- WHERE elem->>'platform' = 'instagram'
--   AND (elem->>'confidence')::DECIMAL > 0.8
-- ORDER BY (elem->>'confidence')::DECIMAL DESC;
