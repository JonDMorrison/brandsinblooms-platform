'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { toast } from 'sonner';
import { ProductForm } from '@/src/components/products/form';
import { useProduct, useUpdateProduct } from '@/src/hooks/useProducts';
import { useCategoriesList } from '@/src/hooks/useCategories';
import { useCurrentSite } from '@/src/contexts/SiteContext';
import { useProductImages } from '@/src/hooks/useProductImages';
import type { ProductFormData } from '@/src/lib/products/validation/schemas';
import type { ProductImage } from '@/src/components/products/ImageUploadS3';

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const router = useRouter();
  const [productId, setProductId] = useState<string | null>(null);
  const { site } = useCurrentSite();

  // Resolve params
  useEffect(() => {
    async function getParams() {
      const resolvedParams = await params;
      setProductId(resolvedParams.id);
    }
    getParams();
  }, [params]);

  const { data: product, loading, error } = useProduct(productId || '');
  const updateProduct = useUpdateProduct();
  const { data: categories = [], isLoading: categoriesLoading } = useCategoriesList();
  const { data: productImages = [], loading: imagesLoading } = useProductImages(productId || '');

  const [images, setImages] = useState<ProductImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update images state when productImages load
  useEffect(() => {
    if (productImages.length > 0) {
      setImages(productImages.map((img: ProductImage) => ({
        ...img,
        position: img.position ?? 0,
        is_primary: img.is_primary ?? false,
      })));
    }
  }, [productImages]);

  // Form submission handler
  const handleSubmit = async (data: ProductFormData) => {
    if (!productId) {
      toast.error('Product ID is missing');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateProduct.mutateAsync({ id: productId, ...data });
      toast.success('Product updated successfully!');
      router.push('/dashboard/products');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (!productId || loading || imagesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
            <p className="text-gray-500">Loading product details...</p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading product...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state - product not found or other error
  if (error || !product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
            <p className="text-gray-500">Product not found</p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <span>Product not found or could not be loaded</span>
            </div>
            <div className="mt-4 text-center">
              <Button onClick={() => router.push('/dashboard/products')}>
                Go to Products
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare initial data for the form
  const initialData: Partial<ProductFormData> = {
    name: product.name || '',
    description: product.description || '',
    sku: product.sku || '',
    slug: product.slug || '',
    primary_category_id: product.primary_category_id || '',
    category_ids: [], // TODO: Load from product_category_assignments if needed
    price: product.price || 0,
    sale_price: product.sale_price || null,
    compare_at_price: product.compare_at_price || null,
    inventory_count: product.inventory_count || 0,
    low_stock_threshold: product.low_stock_threshold || 10,
    unit_of_measure: product.unit_of_measure || '',
    care_instructions: product.care_instructions || '',
    is_active: product.is_active ?? true,
    is_featured: product.is_featured ?? false,
    meta_description: product.meta_description || '',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-gray-500">Update product details</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Product Form */}
      <ProductForm
        mode="edit"
        initialData={initialData}
        categories={categories}
        categoriesLoading={categoriesLoading}
        productImages={images}
        onImagesChange={setImages}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isSubmitting={isSubmitting}
        productId={productId}
      />
    </div>
  );
}
