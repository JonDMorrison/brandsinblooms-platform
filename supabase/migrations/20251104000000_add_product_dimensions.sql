-- Add product dimensions and weight fields
-- Migration: 20251104000000_add_product_dimensions

-- Add dimension fields (width, height, depth) with unit
ALTER TABLE public.products
  ADD COLUMN width DECIMAL(10, 2),
  ADD COLUMN height DECIMAL(10, 2),
  ADD COLUMN depth DECIMAL(10, 2),
  ADD COLUMN dimension_unit VARCHAR(10) DEFAULT 'in';

-- Add weight field with unit
ALTER TABLE public.products
  ADD COLUMN weight DECIMAL(10, 2),
  ADD COLUMN weight_unit VARCHAR(10) DEFAULT 'lb';

-- Add check constraints for valid units
ALTER TABLE public.products
  ADD CONSTRAINT check_dimension_unit
    CHECK (dimension_unit IN ('in', 'cm', 'mm', 'ft', 'm'));

ALTER TABLE public.products
  ADD CONSTRAINT check_weight_unit
    CHECK (weight_unit IN ('lb', 'kg', 'oz', 'g'));

-- Add check constraints for positive values
ALTER TABLE public.products
  ADD CONSTRAINT check_width_positive
    CHECK (width IS NULL OR width >= 0);

ALTER TABLE public.products
  ADD CONSTRAINT check_height_positive
    CHECK (height IS NULL OR height >= 0);

ALTER TABLE public.products
  ADD CONSTRAINT check_depth_positive
    CHECK (depth IS NULL OR depth >= 0);

ALTER TABLE public.products
  ADD CONSTRAINT check_weight_positive
    CHECK (weight IS NULL OR weight >= 0);

-- Add comments for documentation
COMMENT ON COLUMN public.products.width IS 'Product width in specified dimension_unit';
COMMENT ON COLUMN public.products.height IS 'Product height in specified dimension_unit';
COMMENT ON COLUMN public.products.depth IS 'Product depth/length in specified dimension_unit';
COMMENT ON COLUMN public.products.dimension_unit IS 'Unit of measure for dimensions (in, cm, mm, ft, m)';
COMMENT ON COLUMN public.products.weight IS 'Product weight in specified weight_unit';
COMMENT ON COLUMN public.products.weight_unit IS 'Unit of measure for weight (lb, kg, oz, g)';
