-- Migration: Add bulk import products function
-- Description: Atomic function for importing products from CSV data

-- Drop function if exists
DROP FUNCTION IF EXISTS bulk_import_products_atomic(uuid, jsonb);

-- Create the bulk import function
CREATE OR REPLACE FUNCTION bulk_import_products_atomic(
  p_site_id uuid,
  p_products jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product jsonb;
  v_product_id uuid;
  v_existing_product_id uuid;
  v_success_count integer := 0;
  v_error_count integer := 0;
  v_errors jsonb := '[]'::jsonb;
  v_result jsonb;
  v_category_id uuid;
BEGIN
  -- Validate inputs
  IF p_site_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Site ID is required'
    );
  END IF;

  IF p_products IS NULL OR jsonb_array_length(p_products) = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No products provided for import'
    );
  END IF;

  -- Process each product
  FOR v_product IN SELECT * FROM jsonb_array_elements(p_products)
  LOOP
    BEGIN
      -- Check if product exists by ID or SKU
      v_existing_product_id := NULL;

      -- First try to find by ID if provided
      IF v_product->>'id' IS NOT NULL AND v_product->>'id' != '' THEN
        SELECT id INTO v_existing_product_id
        FROM products
        WHERE id = (v_product->>'id')::uuid
          AND site_id = p_site_id;
      END IF;

      -- If not found by ID, try to find by SKU if provided
      IF v_existing_product_id IS NULL AND v_product->>'sku' IS NOT NULL AND v_product->>'sku' != '' THEN
        SELECT id INTO v_existing_product_id
        FROM products
        WHERE sku = v_product->>'sku'
          AND site_id = p_site_id;
      END IF;

      -- Handle category lookup if category name is provided
      v_category_id := NULL;
      IF v_product->>'category' IS NOT NULL AND v_product->>'category' != '' THEN
        SELECT id INTO v_category_id
        FROM product_categories
        WHERE site_id = p_site_id
          AND name = v_product->>'category'
        LIMIT 1;
      END IF;

      -- Update existing product or insert new one
      IF v_existing_product_id IS NOT NULL THEN
        -- Update existing product
        UPDATE products SET
          name = COALESCE(v_product->>'name', name),
          description = COALESCE(v_product->>'description', description),
          sku = COALESCE(v_product->>'sku', sku),
          category = COALESCE(v_product->>'category', category),
          subcategory = COALESCE(v_product->>'subcategory', subcategory),
          price = COALESCE((v_product->>'price')::numeric, price),
          compare_at_price = CASE
            WHEN v_product->>'compare_at_price' IS NOT NULL AND v_product->>'compare_at_price' != ''
            THEN (v_product->>'compare_at_price')::numeric
            ELSE compare_at_price
          END,
          inventory_count = COALESCE((v_product->>'inventory_count')::integer, inventory_count),
          in_stock = COALESCE((v_product->>'in_stock')::boolean, in_stock),
          is_active = COALESCE((v_product->>'is_active')::boolean, is_active),
          is_featured = COALESCE((v_product->>'is_featured')::boolean, is_featured),
          primary_category_id = COALESCE(v_category_id, primary_category_id),
          updated_at = now()
        WHERE id = v_existing_product_id;

        v_success_count := v_success_count + 1;
      ELSE
        -- Insert new product
        INSERT INTO products (
          site_id,
          name,
          description,
          sku,
          category,
          subcategory,
          price,
          compare_at_price,
          inventory_count,
          in_stock,
          is_active,
          is_featured,
          primary_category_id
        ) VALUES (
          p_site_id,
          v_product->>'name',
          v_product->>'description',
          v_product->>'sku',
          v_product->>'category',
          v_product->>'subcategory',
          COALESCE((v_product->>'price')::numeric, 0),
          CASE
            WHEN v_product->>'compare_at_price' IS NOT NULL AND v_product->>'compare_at_price' != ''
            THEN (v_product->>'compare_at_price')::numeric
            ELSE NULL
          END,
          COALESCE((v_product->>'inventory_count')::integer, 0),
          COALESCE((v_product->>'in_stock')::boolean, true),
          COALESCE((v_product->>'is_active')::boolean, true),
          COALESCE((v_product->>'is_featured')::boolean, false),
          v_category_id
        );

        v_success_count := v_success_count + 1;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      -- Record error and continue with next product
      v_error_count := v_error_count + 1;
      v_errors := v_errors || jsonb_build_object(
        'product_name', v_product->>'name',
        'error', SQLERRM
      );
    END;
  END LOOP;

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'successful', v_success_count,
    'failed', v_error_count,
    'errors', v_errors
  );

  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION bulk_import_products_atomic(uuid, jsonb) TO authenticated;

-- Add comment
COMMENT ON FUNCTION bulk_import_products_atomic IS 'Atomically import multiple products from CSV data. Updates existing products or creates new ones.';
