'use client';

import { useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery';
import { useSupabaseMutation } from '@/hooks/base/useSupabaseMutation';
import {
  uploadProductImage,
  uploadMultipleProductImages,
  deleteProductImage
} from '@/lib/supabase/storage';
import { useSiteId } from '@/src/contexts/SiteContext';
import { Tables, TablesInsert, TablesUpdate } from '@/lib/database/types';
import { handleError } from '@/lib/types/error-handling';
import {
  useProductPlaceholder,
  useProductPlaceholderUrl,
  type ProductPlaceholderParams
} from '@/hooks/useProductPlaceholder';

type ProductImage = Tables<'product_images'>;
type ProductImageInsert = TablesInsert<'product_images'>;
type ProductImageUpdate = TablesUpdate<'product_images'>;

// Extended types for enhanced functionality
type LegacyProductImage = {
  id: string;
  url: string;
  alt_text: string;
  position: number;
  is_primary: boolean;
  is_legacy: true;
};

type PlaceholderProductImage = {
  id: string;
  url: string;
  alt_text: string;
  position: number;
  is_primary: boolean;
  is_placeholder: true;
  is_legacy: false;
};

type EnhancedProductImage = (ProductImage & { is_legacy: false }) | LegacyProductImage | PlaceholderProductImage;

/**
 * Get product images query
 */
export function useProductImages(productId?: string) {
  const siteId = useSiteId();

  return useSupabaseQuery<ProductImage[]>(
    async (signal) => {
      if (!siteId || !productId) return [];

      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('site_id', siteId)
        .eq('product_id', productId)
        .order('position', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    {
      enabled: !!siteId && !!productId,
      staleTime: 30 * 1000,
      initialData: [],
    },
    [siteId, productId]
  );
}

/**
 * Upload single product image
 */
export function useUploadProductImage() {
  const siteId = useSiteId();

  return useSupabaseMutation<
    {
      success: boolean;
      data: { url: string; width?: number; height?: number; size?: number };
      image?: ProductImage;
    },
    {
      file: File;
      productId?: string;
      altText?: string;
      caption?: string;
      isTemporary?: boolean;
    }
  >(
    async (variables, signal) => {
      const { file, productId, altText, caption, isTemporary = false } = variables;

      if (!siteId) throw new Error('Site ID is required');

      // Upload to storage
      const uploadResult = await uploadProductImage(
        supabase,
        file,
        siteId,
        isTemporary ? undefined : productId
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      if (!uploadResult.data) {
        throw new Error('No upload data returned');
      }

      // If this is just a temporary upload, return the data
      if (isTemporary) {
        return {
          success: true,
          data: uploadResult.data,
        };
      }

      // If we have a product ID, save to database
      if (productId) {
        // Get current images count for position
        const { data: existingImages } = await supabase
          .from('product_images')
          .select('position')
          .eq('site_id', siteId)
          .eq('product_id', productId)
          .order('position', { ascending: false })
          .limit(1);

        const nextPosition = existingImages && existingImages.length > 0
          ? (existingImages[0].position || 0) + 1
          : 1;

        // Check if this should be the primary image (first image)
        const { data: imageCount } = await supabase
          .from('product_images')
          .select('id', { count: 'exact', head: true })
          .eq('site_id', siteId)
          .eq('product_id', productId);

        const isPrimary = (imageCount?.length || 0) === 0;

        // Insert image record
        const imageData: ProductImageInsert = {
          site_id: siteId,
          product_id: productId,
          url: uploadResult.data.url,
          alt_text: altText || null,
          caption: caption || null,
          position: nextPosition,
          is_primary: isPrimary,
          width: uploadResult.data.width || null,
          height: uploadResult.data.height || null,
          size_bytes: uploadResult.data.size || null,
        };

        const { data: insertedImage, error: insertError } = await supabase
          .from('product_images')
          .insert(imageData)
          .select()
          .single();

        if (insertError) throw insertError;

        return {
          success: true,
          data: uploadResult.data,
          image: insertedImage,
        };
      }

      return {
        success: true,
        data: uploadResult.data,
      };
    },
    {
      onSuccess: (result, variables) => {
        if (variables.productId) {
          toast.success('Image uploaded successfully');
        }
      },
      showErrorToast: true,
    }
  );
}

/**
 * Upload multiple product images
 */
export function useUploadMultipleProductImages() {
  const siteId = useSiteId();

  return useSupabaseMutation<
    {
      success: boolean;
      error?: string;
      results: Array<{ success: boolean; data?: { url: string; width?: number; height?: number; size?: number }; error?: string }>;
      images?: ProductImage[];
    },
    {
      files: File[];
      productId?: string;
      onProgress?: (completed: number, total: number) => void;
    }
  >(
    async (variables, signal) => {
      const { files, productId, onProgress } = variables;

      if (!siteId) throw new Error('Site ID is required');

      // Upload files to storage
      const uploadResults = await uploadMultipleProductImages(
        supabase,
        files,
        siteId,
        productId,
        onProgress
      );

      if (!uploadResults.success) {
        throw new Error(uploadResults.error);
      }

      // If no product ID, return upload results
      if (!productId) {
        return uploadResults;
      }

      // Get current position for ordering
      const { data: existingImages } = await supabase
        .from('product_images')
        .select('position')
        .eq('site_id', siteId)
        .eq('product_id', productId)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = existingImages && existingImages.length > 0
        ? (existingImages[0].position || 0) + 1
        : 1;

      // Check if this should be the first primary image
      const { data: imageCount } = await supabase
        .from('product_images')
        .select('id', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('product_id', productId);

      const shouldSetPrimary = (imageCount?.length || 0) === 0;

      // Create image records for successful uploads
      const imageInserts: ProductImageInsert[] = [];

      uploadResults.results.forEach((result, index) => {
        if (result.success && result.data) {
          imageInserts.push({
            site_id: siteId,
            product_id: productId,
            url: result.data.url,
            alt_text: null,
            caption: null,
            position: nextPosition + index,
            is_primary: shouldSetPrimary && index === 0,
            width: result.data.width || null,
            height: result.data.height || null,
            size_bytes: result.data.size || null,
          });
        }
      });

      if (imageInserts.length > 0) {
        const { data: insertedImages, error: insertError } = await supabase
          .from('product_images')
          .insert(imageInserts)
          .select();

        if (insertError) throw insertError;

        return {
          ...uploadResults,
          images: insertedImages,
        };
      }

      return uploadResults;
    },
    {
      onSuccess: (result, variables) => {
        if (variables.productId) {
          const successCount = result.results.filter(r => r.success).length;
          toast.success(`${successCount} image${successCount > 1 ? 's' : ''} uploaded successfully`);
        }
      },
      showErrorToast: true,
    }
  );
}

/**
 * Update product image metadata
 */
export function useUpdateProductImage() {
  const siteId = useSiteId();

  return useSupabaseMutation<
    ProductImage,
    {
      id: string;
      productId: string;
      updates: Partial<ProductImageUpdate>;
    }
  >(
    async (variables, signal) => {
      const { id, productId, updates } = variables;

      if (!siteId) throw new Error('Site ID is required');

      const { data, error } = await supabase
        .from('product_images')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('site_id', siteId)
        .eq('product_id', productId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Image updated successfully');
      },
      showErrorToast: true,
    }
  );
}

/**
 * Delete product image
 */
export function useDeleteProductImage() {
  const siteId = useSiteId();

  return useSupabaseMutation<
    { id: string },
    {
      id: string;
      productId: string;
      imagePath?: string;
    }
  >(
    async (variables, signal) => {
      const { id, productId, imagePath } = variables;

      if (!siteId) throw new Error('Site ID is required');

      // Get image data before deletion
      const { data: imageData } = await supabase
        .from('product_images')
        .select('url, is_primary')
        .eq('id', id)
        .eq('site_id', siteId)
        .eq('product_id', productId)
        .single();

      // Delete from database first
      const { error: dbError } = await supabase
        .from('product_images')
        .delete()
        .eq('id', id)
        .eq('site_id', siteId)
        .eq('product_id', productId);

      if (dbError) throw dbError;

      // If we deleted the primary image, set another image as primary
      if (imageData?.is_primary) {
        const { data: remainingImages } = await supabase
          .from('product_images')
          .select('id')
          .eq('site_id', siteId)
          .eq('product_id', productId)
          .order('position', { ascending: true })
          .limit(1);

        if (remainingImages && remainingImages.length > 0) {
          await supabase
            .from('product_images')
            .update({ is_primary: true })
            .eq('id', remainingImages[0].id)
            .eq('site_id', siteId)
            .eq('product_id', productId);
        }
      }

      // Extract path from URL for storage deletion
      let pathToDelete = imagePath;
      if (!pathToDelete && imageData?.url) {
        const url = new URL(imageData.url);
        const pathParts = url.pathname.split('/');
        const bucketIndex = pathParts.findIndex(part => part === 'product-images');
        if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
          pathToDelete = pathParts.slice(bucketIndex + 1).join('/');
        }
      }

      // Delete from storage (non-blocking)
      if (pathToDelete) {
        deleteProductImage(supabase, pathToDelete).catch((error) => {
          console.warn('Failed to delete image from storage:', error);
        });
      }

      return { id };
    },
    {
      onSuccess: () => {
        toast.success('Image deleted successfully');
      },
      showErrorToast: true,
    }
  );
}

/**
 * Reorder product images
 */
export function useReorderProductImages() {
  const siteId = useSiteId();

  return useSupabaseMutation<
    { success: boolean },
    {
      productId: string;
      imageUpdates: Array<{ id: string; position: number }>;
    }
  >(
    async (variables, signal) => {
      const { productId, imageUpdates } = variables;

      if (!siteId) throw new Error('Site ID is required');

      // Update positions in batch
      const updates = imageUpdates.map(({ id, position }) =>
        supabase
          .from('product_images')
          .update({ position })
          .eq('id', id)
          .eq('site_id', siteId)
          .eq('product_id', productId)
      );

      const results = await Promise.all(updates);

      // Check for errors
      const error = results.find(result => result.error)?.error;
      if (error) throw error;

      return { success: true };
    },
    {
      onSuccess: () => {
        toast.success('Images reordered successfully');
      },
      showErrorToast: true,
    }
  );
}

/**
 * Set primary image
 */
export function useSetPrimaryProductImage() {
  const siteId = useSiteId();

  return useSupabaseMutation<
    ProductImage,
    {
      imageId: string;
      productId: string;
    }
  >(
    async (variables, signal) => {
      const { imageId, productId } = variables;

      if (!siteId) throw new Error('Site ID is required');

      // First, unset all primary flags
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('site_id', siteId)
        .eq('product_id', productId);

      // Then set the new primary image
      const { data, error } = await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', imageId)
        .eq('site_id', siteId)
        .eq('product_id', productId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Primary image updated');
      },
      showErrorToast: true,
    }
  );
}

/**
 * Enhanced product images hook with placeholder support
 */
export function useProductImagesWithPlaceholders(
  productId?: string,
  placeholderParams?: ProductPlaceholderParams
) {
  const siteId = useSiteId();
  
  // Get product images
  const imagesQuery = useProductImages(productId);

  // Get product details for placeholder generation
  const productQuery = useSupabaseQuery<{
    id: string;
    name: string;
    category?: string;
    images?: unknown;
  } | null>(
    async (signal) => {
      if (!siteId || !productId) return null;

      const { data, error } = await supabase
        .from('products')
        .select('id, name, category, images')
        .eq('id', productId)
        .eq('site_id', siteId)
        .single();

      if (error) throw error;
      return data;
    },
    {
      enabled: !!siteId && !!productId,
      staleTime: 5 * 60 * 1000,
      initialData: null,
    },
    [siteId, productId]
  );

  // Generate placeholder based on product data
  const productPlaceholderParams: ProductPlaceholderParams = {
    productId,
    productName: productQuery.data?.name,
    category: productQuery.data?.category || undefined,
    ...placeholderParams,
  };

  const placeholderQuery = useProductPlaceholder(productPlaceholderParams);

  // Check for legacy images in the products.images field
  const legacyImages = useMemo((): LegacyProductImage[] => {
    if (!productQuery.data?.images) return [];
    
    try {
      const images = productQuery.data.images as unknown;
      if (Array.isArray(images)) {
        return images
          .filter((img): img is string => typeof img === 'string')
          .map((url, index) => ({
            id: `legacy-${index}`,
            url,
            alt_text: `${productQuery.data?.name || 'Product'} image ${index + 1}`,
            position: index + 1,
            is_primary: index === 0,
            is_legacy: true,
          }));
      }
    } catch (error: unknown) {
      console.warn('Failed to parse legacy images:', handleError(error).message);
    }
    
    return [];
  }, [productQuery.data?.images, productQuery.data?.name]);

  // Combine modern and legacy images
  const allImages = useMemo((): EnhancedProductImage[] => {
    const modernImages = imagesQuery.data || [];
    
    // If we have modern images, use them
    if (modernImages.length > 0) {
      return modernImages.map(img => ({ ...img, is_legacy: false }));
    }
    
    // Fall back to legacy images if no modern images
    return legacyImages;
  }, [imagesQuery.data, legacyImages]);

  // Get primary image or fallback to placeholder
  const primaryImage = useMemo((): EnhancedProductImage | null => {
    const primary = allImages.find(img => img.is_primary);
    
    if (primary) {
      return {
        ...primary,
        fallbackUrl: placeholderQuery.data?.dataUrl,
      };
    }

    // Return placeholder as primary if no images
    if (placeholderQuery.data) {
      return {
        id: 'placeholder',
        url: placeholderQuery.data.dataUrl,
        alt_text: `${productQuery.data?.name || 'Product'} placeholder`,
        position: 0,
        is_primary: true,
        is_placeholder: true,
        is_legacy: false,
      } as PlaceholderProductImage;
    }

    return null;
  }, [allImages, placeholderQuery.data, productQuery.data?.name]);

  // Enhanced error handling with placeholder fallbacks
  const hasImages = allImages.length > 0;
  const hasValidImages = allImages.some(img =>
    img.url && !('is_placeholder' in img && img.is_placeholder)
  );
  const isLoadingImages = imagesQuery.loading || productQuery.loading;
  const hasImageErrors = imagesQuery.error || productQuery.error;
  const isPlaceholderReady = !!placeholderQuery.data && !placeholderQuery.isLoading;

  return {
    // Core data
    images: allImages,
    primaryImage,
    legacyImages,
    modernImages: imagesQuery.data || [],
    
    // Placeholder data
    placeholder: placeholderQuery.data,
    placeholderUrl: placeholderQuery.data?.dataUrl,
    
    // Loading states
    isLoading: isLoadingImages,
    isLoadingPlaceholder: placeholderQuery.isLoading,
    
    // Status flags
    hasImages,
    hasValidImages,
    hasLegacyImages: legacyImages.length > 0,
    hasModernImages: (imagesQuery.data?.length || 0) > 0,
    isPlaceholderReady,
    
    // Error states
    error: hasImageErrors ? (imagesQuery.error || productQuery.error) : null,
    placeholderError: placeholderQuery.error,
    
    // Utility functions
    getImageUrl: (imageId?: string) => {
      if (!imageId) return primaryImage?.url || placeholderQuery.data?.dataUrl;
      
      const image = allImages.find(img => img.id === imageId);
      return image?.url || placeholderQuery.data?.dataUrl;
    },
    
    getImageWithFallback: (imageId?: string) => {
      const image = imageId 
        ? allImages.find(img => img.id === imageId)
        : primaryImage;
      
      return {
        ...image,
        url: image?.url || placeholderQuery.data?.dataUrl,
        fallbackUrl: placeholderQuery.data?.dataUrl,
        isUsingFallback: !image?.url && !!placeholderQuery.data?.dataUrl,
      };
    },

    // Query objects for manual handling
    imagesQuery,
    productQuery,
    placeholderQuery,
  };
}

/**
 * Get product image URL with automatic placeholder fallback
 */
export function useProductImageUrl(
  productId?: string,
  imageId?: string,
  placeholderParams?: ProductPlaceholderParams
) {
  const { getImageUrl, isLoading, error } = useProductImagesWithPlaceholders(
    productId,
    placeholderParams
  );

  return useMemo(() => ({
    url: getImageUrl(imageId),
    isLoading,
    error,
  }), [getImageUrl, imageId, isLoading, error]);
}

/**
 * Preload product images with placeholder support
 */
export function usePreloadProductImages(productIds: string[] = []) {
  const siteId = useSiteId();
  const preloadImages = useCallback(async () => {
    if (!siteId || productIds.length === 0) return;

    const preloadPromises = productIds.map(async (productId) => {
      try {
        // Preload product images by storing in localStorage
        const imagesCacheKey = `product_images_${siteId}_${productId}`;
        const productCacheKey = `product_${siteId}_${productId}`;

        // Check if already cached
        const existingImages = localStorage.getItem(imagesCacheKey);
        const existingProduct = localStorage.getItem(productCacheKey);

        if (!existingImages) {
          const { data: imagesData, error: imagesError } = await supabase
            .from('product_images')
            .select('*')
            .eq('site_id', siteId)
            .eq('product_id', productId)
            .order('position', { ascending: true });

          if (imagesError) throw imagesError;
          
          const toStore = {
            data: imagesData || [],
            timestamp: new Date().toISOString()
          };
          localStorage.setItem(imagesCacheKey, JSON.stringify(toStore));
        }

        if (!existingProduct) {
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('id, name, category, images')
            .eq('id', productId)
            .eq('site_id', siteId)
            .single();

          if (productError) throw productError;
          
          const toStore = {
            data: productData,
            timestamp: new Date().toISOString()
          };
          localStorage.setItem(productCacheKey, JSON.stringify(toStore));
        }
      } catch (error: unknown) {
        console.warn(`Failed to preload images for product ${productId}:`, handleError(error).message);
      }
    });

    await Promise.all(preloadPromises);
  }, [productIds, siteId]);

  return {
    preloadImages,
    canPreload: !!siteId && productIds.length > 0,
  };
}