-- Create product_favorites table for storing user favorites
CREATE TABLE product_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, product_id, site_id)
);

-- Create index for efficient queries
CREATE INDEX idx_product_favorites_profile_site 
ON product_favorites(profile_id, site_id);

-- Enable Row Level Security
ALTER TABLE product_favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - users can manage own favorites
CREATE POLICY "Users can manage own favorites"
ON product_favorites
FOR ALL
USING (auth.uid() = profile_id);

-- Add favorite count column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS favorite_count INTEGER DEFAULT 0;

-- Create function to update product favorite count
CREATE OR REPLACE FUNCTION update_product_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products SET favorite_count = favorite_count + 1 
    WHERE id = NEW.product_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products SET favorite_count = favorite_count - 1 
    WHERE id = OLD.product_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update favorite count
CREATE TRIGGER update_favorite_count
AFTER INSERT OR DELETE ON product_favorites
FOR EACH ROW
EXECUTE FUNCTION update_product_favorite_count();