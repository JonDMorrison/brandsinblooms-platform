-- Add full-text search capabilities to content table
-- Enhances the existing basic search with proper ranking and better performance

-- =====================================================
-- FULL-TEXT SEARCH ENHANCEMENTS
-- =====================================================

-- Drop existing basic search index to replace with enhanced version
DROP INDEX IF EXISTS idx_content_search;

-- Add a generated tsvector column for full-text search on the content table
ALTER TABLE content ADD COLUMN IF NOT EXISTS search_vector tsvector 
  GENERATED ALWAYS AS (
    to_tsvector('english', 
      coalesce(title, '') || ' ' || 
      coalesce(meta_data->>'description', '') || ' ' ||
      coalesce(content->>'text', '')
    )
  ) STORED;

-- Create a GIN index on the search vector for fast full-text search
CREATE INDEX IF NOT EXISTS content_search_idx ON content USING GIN (search_vector);

-- =====================================================
-- SEARCH RPC FUNCTION
-- =====================================================

-- Create an RPC function for ranked global content search
CREATE OR REPLACE FUNCTION search_content_global(
  search_query text,
  site_id_param uuid,
  result_limit int DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  title text,
  content_type text,
  slug text,
  excerpt text,
  is_published boolean,
  relevance real,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title::text,
    c.content_type::text,
    c.slug::text,
    LEFT(coalesce(c.meta_data->>'description', c.content->>'text', ''), 150)::text as excerpt,
    c.is_published,
    ts_rank(c.search_vector, plainto_tsquery('english', search_query)) as relevance,
    c.updated_at
  FROM content c
  WHERE 
    c.site_id = site_id_param AND
    c.search_vector @@ plainto_tsquery('english', search_query)
  ORDER BY relevance DESC, c.updated_at DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECURITY POLICIES
-- =====================================================

-- Drop existing policy if it exists and recreate
DROP POLICY IF EXISTS "authenticated_search_content" ON content;

-- Add RLS policy for the RPC function to allow authenticated users to search
CREATE POLICY "authenticated_search_content" ON content
  FOR SELECT USING (auth.role() = 'authenticated');

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN content.search_vector IS 'Generated tsvector for full-text search combining title, description, and content text';
COMMENT ON FUNCTION search_content_global IS 'Performs ranked full-text search across content with relevance scoring';