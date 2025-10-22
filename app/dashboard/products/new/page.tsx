'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Package } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { toast } from 'sonner';
import { ProductForm } from '@/src/components/products/form';
import { useCreateProduct, useSkuValidation } from '@/src/hooks/useProducts';
import { useCategoriesList } from '@/src/hooks/useCategories';
import { useSiteId, useUserSites, useSiteSwitcher } from '@/src/contexts/SiteContext';
import { supabase } from '@/lib/supabase/client';
import { validateSlug } from '@/src/lib/utils/slug';
import { handleError } from '@/lib/types/error-handling';
import type { ProductFormData } from '@/src/lib/products/validation/schemas';
import type { ProductImage } from '@/src/components/products/ImageUploadS3';
import type { TablesInsert } from '@/lib/database/types';

type ProductImageInsert = TablesInsert<'product_images'>;

export default function NewProductPage() {
  const router = useRouter();
  const siteId = useSiteId();
  const { sites, loading: sitesLoading } = useUserSites();
  const { switchSite } = useSiteSwitcher();
  const createProduct = useCreateProduct();
  const validateSku = useSkuValidation();
  const { data: categories = [], isLoading: categoriesLoading } = useCategoriesList();

  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-select first site if none selected
  useEffect(() => {
    if (!siteId && sites.length > 0 && !sitesLoading) {
      const firstSiteId = sites[0].site.id;
      switchSite(firstSiteId);
    }
  }, [siteId, sites, sitesLoading, switchSite]);

  // SKU validation handler
  const handleSkuValidation = useCallback(
    async (sku: string): Promise<boolean> => {
      if (!sku) return true;
      const result = await validateSku.mutateAsync({ sku });
      return result;
    },
    [validateSku]
  );

  // Associate images with the created product
  const associateImages = async (productId: string, images: ProductImage[]) => {
    if (!siteId || images.length === 0) return;

    try {
      const imageRecords: ProductImageInsert[] = images.map((img, index) => ({
        product_id: productId,
        site_id: siteId,
        url: img.url,
        alt_text: img.alt_text || `Product image ${index + 1}`,
        caption: img.caption || null,
        position: index,
        is_primary: index === 0,
        width: img.width || null,
        height: img.height || null,
        size_bytes: img.size || null,
      }));

      const { error } = await supabase
        .from('product_images')
        .insert(imageRecords);

      if (error) {
        console.error('Failed to associate images:', error);
        throw new Error('Product created but images failed to save');
      }
    } catch (error) {
      console.error('Error associating images:', error);
      throw error;
    }
  };

  // Form submission handler
  const handleSubmit = async (data: ProductFormData) => {
    console.log('🚀 Form submitted:', data);
    setIsSubmitting(true);

    try {
      // Check if siteId is available
      if (!siteId) {
        throw new Error('Site ID is required but not available');
      }

      // Validate slug is provided
      if (!data.slug || data.slug.trim() === '') {
        toast.error('Missing URL Slug', {
          description: 'Please ensure a URL slug is generated or manually entered.',
        });
        setIsSubmitting(false);
        return;
      }

      // Validate slug uniqueness
      console.log('🔍 Validating slug:', data.slug);
      try {
        const slugValidation = await Promise.race([
          validateSlug(supabase, data.slug, siteId),
          new Promise<{ isValid: boolean; error?: string }>((_, reject) =>
            setTimeout(() => reject(new Error('Slug validation timed out')), 10000)
          ),
        ]);

        if (!slugValidation.isValid) {
          console.log('❌ Slug validation failed:', slugValidation.error);
          toast.error('Invalid URL Slug', {
            description: slugValidation.error + ' Please choose a different slug.',
          });
          setIsSubmitting(false);
          return;
        }
      } catch (error) {
        console.error('❌ Slug validation error:', error);
        // Continue anyway if validation times out
      }

      // Validate SKU one more time before submission
      console.log('🔍 Validating SKU:', data.sku);
      const skuAvailable = await validateSku.mutateAsync({ sku: data.sku });

      if (!skuAvailable) {
        toast.error('SKU Already in Use', {
          description: `The SKU "${data.sku}" is already in use. Please choose a different SKU.`,
        });
        setIsSubmitting(false);
        return;
      }

      // Create the product
      console.log('🏭 Creating product');
      const newProduct = await createProduct.mutateAsync(data);
      console.log('✅ Product created:', newProduct);

      if (!newProduct?.id) {
        throw new Error('Failed to create product - no ID returned');
      }

      // Associate images with the created product
      if (productImages.length > 0) {
        console.log('🖼️ Associating', productImages.length, 'images');
        await associateImages(newProduct.id, productImages);
        console.log('✅ Images associated successfully');
      }

      console.log('🎉 Product creation completed');
      toast.success('Product created successfully!');
      router.push('/dashboard/products');
    } catch (error: unknown) {
      console.error('Error creating product:', error);
      const errorMessage = handleError(error);

      toast.error('Failed to Create Product', {
        description: errorMessage.message || 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state while sites are loading or site is being selected
  if (sitesLoading || (!siteId && sites.length > 0)) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  // If no sites available, show error
  if (!siteId && sites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Package className="h-12 w-12 text-gray-500" />
        <div className="text-center">
          <h2 className="text-lg font-semibold">No Sites Available</h2>
          <p className="text-sm text-gray-500 mt-2">
            You need to create or be assigned to a site before adding products.
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard')}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Product</h1>
          <p className="text-gray-500">Add a new product to your catalog</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Product Form */}
      <ProductForm
        mode="create"
        categories={categories}
        categoriesLoading={categoriesLoading}
        productImages={productImages}
        onImagesChange={setProductImages}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isSubmitting={isSubmitting}
        onSkuValidate={handleSkuValidation}
      />
    </div>
  );
}
