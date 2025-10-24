-- Migration: Grant permissions for bulk import function
-- Description: Grant execute permission to authenticated users

GRANT EXECUTE ON FUNCTION bulk_import_products_atomic(uuid, jsonb) TO authenticated;
