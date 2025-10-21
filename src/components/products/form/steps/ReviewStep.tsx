'use client';

import { Badge } from '@/src/components/ui/badge';
import { formatPrice } from '@/src/lib/products/utils/pricing';

interface Category {
  id: string;
  name: string;
}

interface ReviewStepProps {
  formValues: {
    name?: string;
    sku?: string;
    slug?: string;
    description?: string;
    primary_category_id?: string;
    category_ids?: string[];
    price?: number;
    sale_price?: number | null;
    compare_at_price?: number | null;
    inventory_count?: number;
    low_stock_threshold?: number;
    is_active?: boolean;
    is_featured?: boolean;
    unit_of_measure?: string;
    care_instructions?: string;
  };
  images: Array<{ url: string; alt_text?: string }>;
  categories: Category[];
}

export function ReviewStep({ formValues, images, categories }: ReviewStepProps) {
  // Helper to find category name
  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Not set';
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  // Helper to get additional category names
  const getAdditionalCategories = () => {
    if (!formValues.category_ids || formValues.category_ids.length === 0) {
      return 'None';
    }
    return formValues.category_ids
      .map((id) => getCategoryName(id))
      .join(', ');
  };

  return (
    <div className="space-y-4">
      {/* Product Details */}
      <div className="rounded-lg border p-4 space-y-3">
        <h3 className="font-semibold">Product Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Name:</span>
            <p className="font-medium">{formValues.name || 'Not set'}</p>
          </div>
          <div>
            <span className="text-gray-500">SKU:</span>
            <p className="font-medium">{formValues.sku || 'Not set'}</p>
          </div>
          <div>
            <span className="text-gray-500">Slug:</span>
            <p className="font-medium">{formValues.slug || 'Auto-generated'}</p>
          </div>
          <div>
            <span className="text-gray-500">Category:</span>
            <p className="font-medium">{getCategoryName(formValues.primary_category_id)}</p>
          </div>
          {formValues.category_ids && formValues.category_ids.length > 0 && (
            <div className="col-span-2">
              <span className="text-gray-500">Additional Categories:</span>
              <p className="font-medium">{getAdditionalCategories()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Pricing */}
      <div className="rounded-lg border p-4 space-y-3">
        <h3 className="font-semibold">Pricing</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Regular Price:</span>
            <p className="font-medium">{formatPrice(formValues.price)}</p>
          </div>
          {formValues.sale_price && (
            <div>
              <span className="text-gray-500">Sale Price:</span>
              <p className="font-medium">{formatPrice(formValues.sale_price)}</p>
            </div>
          )}
          {formValues.compare_at_price && (
            <div>
              <span className="text-gray-500">Compare At Price:</span>
              <p className="font-medium">{formatPrice(formValues.compare_at_price)}</p>
            </div>
          )}
          {formValues.unit_of_measure && (
            <div>
              <span className="text-gray-500">Unit of Measure:</span>
              <p className="font-medium">{formValues.unit_of_measure}</p>
            </div>
          )}
        </div>
      </div>

      {/* Inventory */}
      <div className="rounded-lg border p-4 space-y-3">
        <h3 className="font-semibold">Inventory</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Stock:</span>
            <p className="font-medium">{formValues.inventory_count ?? 0} units</p>
          </div>
          <div>
            <span className="text-gray-500">Low Stock Alert:</span>
            <p className="font-medium">{formValues.low_stock_threshold ?? 10} units</p>
          </div>
          <div>
            <span className="text-gray-500">Status:</span>
            <div className="flex gap-2 mt-1">
              {formValues.is_active && (
                <Badge variant="default">Active</Badge>
              )}
              {formValues.is_featured && (
                <Badge variant="secondary">Featured</Badge>
              )}
              {!formValues.is_active && !formValues.is_featured && (
                <span className="text-gray-500">Inactive</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="rounded-lg border p-4 space-y-3">
        <h3 className="font-semibold">Images</h3>
        <div className="text-sm">
          <span className="text-gray-500">Total Images:</span>
          <p className="font-medium">{images.length} image(s)</p>
          {images.length > 0 && (
            <div className="mt-2 grid grid-cols-4 gap-2">
              {images.slice(0, 4).map((image, index) => (
                <img
                  key={index}
                  src={image.url}
                  alt={image.alt_text || `Product image ${index + 1}`}
                  className="w-full h-20 object-cover rounded border"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Notice */}
      <div className="rounded-lg bg-muted p-4">
        <p className="text-sm text-gray-500">
          Review your product details above. You can go back to make changes or proceed to save the product.
        </p>
      </div>
    </div>
  );
}
