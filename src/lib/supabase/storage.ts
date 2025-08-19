/**
 * Storage bucket configuration and helper functions for the Brands in Blooms platform
 * Handles product image uploads, management, and URL generation
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database/types';
import { handleError } from '@/lib/types/error-handling';

type DatabaseClient = SupabaseClient<Database>;

/**
 * Storage bucket configuration
 */
export const STORAGE_CONFIG = {
  productImages: {
    bucketName: 'product-images',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as string[],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.avif'] as string[],
  }
} as const;

/**
 * Image compression settings
 */
export const IMAGE_OPTIMIZATION = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8,
  thumbnailSize: 300,
} as const;

/**
 * Ensures the product-images bucket exists and is properly configured
 */
export async function ensureProductImagesBucket(client: DatabaseClient): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { data: buckets, error: listError } = await client.storage.listBuckets();
    
    if (listError) {
      // If we can't list buckets, assume it exists (permissions issue)
      // The bucket should be created via migration
      console.warn('Unable to list storage buckets, assuming product-images bucket exists:', listError.message);
      return { success: true };
    }

    const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_CONFIG.productImages.bucketName);

    if (!bucketExists) {
      // Try to create the bucket
      const { error: createError } = await client.storage.createBucket(
        STORAGE_CONFIG.productImages.bucketName,
        {
          public: true,
          allowedMimeTypes: STORAGE_CONFIG.productImages.allowedTypes,
          fileSizeLimit: STORAGE_CONFIG.productImages.maxFileSize,
        }
      );

      if (createError) {
        // If creation fails with RLS error, assume bucket exists but we don't have permission to create
        if (createError.message?.includes('row-level security') || createError.message?.includes('policy')) {
          console.warn('Unable to create bucket due to RLS policy, assuming it exists:', createError.message);
          return { success: true };
        }
        throw createError;
      }
    }

    return { success: true };
  } catch (error) {
    const handled = handleError(error);
    
    // If it's an RLS/policy error, we'll assume the bucket exists
    if (handled.message.includes('row-level security') || handled.message.includes('policy')) {
      console.warn('Storage bucket check failed due to RLS, proceeding anyway:', handled.message);
      return { success: true };
    }
    
    return {
      success: false,
      error: handled.message,
    };
  }
}

/**
 * Generates a unique filename for uploaded images
 */
export function generateImageFilename(originalName: string, siteId: string, productId?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const baseName = originalName.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  
  if (productId) {
    return `${siteId}/${productId}/${baseName}_${timestamp}_${random}.${extension}`;
  }
  
  return `${siteId}/temp/${baseName}_${timestamp}_${random}.${extension}`;
}

/**
 * Validates image file before upload
 */
export function validateImageFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  // Check file size
  if (file.size > STORAGE_CONFIG.productImages.maxFileSize) {
    return {
      isValid: false,
      error: `File size must be less than ${STORAGE_CONFIG.productImages.maxFileSize / 1024 / 1024}MB`,
    };
  }

  // Check file type
  if (!STORAGE_CONFIG.productImages.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not supported. Allowed types: ${STORAGE_CONFIG.productImages.allowedTypes.join(', ')}`,
    };
  }

  // Check file extension
  const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
  if (!STORAGE_CONFIG.productImages.allowedExtensions.includes(extension)) {
    return {
      isValid: false,
      error: `File extension ${extension} is not supported. Allowed extensions: ${STORAGE_CONFIG.productImages.allowedExtensions.join(', ')}`,
    };
  }

  return { isValid: true };
}

/**
 * Compresses an image file before upload
 */
export async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions
        let { width, height } = img;
        const { maxWidth, maxHeight, quality } = IMAGE_OPTIMIZATION;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          } else {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Uploads an image file to storage
 */
export async function uploadProductImage(
  client: DatabaseClient,
  file: File,
  siteId: string,
  productId?: string
): Promise<{
  success: boolean;
  data?: {
    url: string;
    path: string;
    width: number;
    height: number;
    size: number;
  };
  error?: string;
}> {
  try {
    // Ensure bucket exists
    const bucketResult = await ensureProductImagesBucket(client);
    if (!bucketResult.success) {
      throw new Error(bucketResult.error);
    }

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Skip compression for now - use original file
    // TODO: Re-enable compression after fixing upload issues
    // const compressedFile = await compressImage(file);
    const fileToUpload = file;

    // Generate filename
    const filename = generateImageFilename(file.name, siteId, productId);
    
    console.log('Uploading to path:', filename);
    console.log('File type:', fileToUpload.type);
    console.log('File size:', fileToUpload.size);

    // Upload file
    const { data: uploadData, error: uploadError } = await client.storage
      .from(STORAGE_CONFIG.productImages.bucketName)
      .upload(filename, fileToUpload, {
        cacheControl: '3600',
        upsert: false,
        contentType: fileToUpload.type,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      console.error('Error details:', {
        message: uploadError.message,
        statusCode: (uploadError as any).statusCode,
        error: (uploadError as any).error,
      });
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = client.storage
      .from(STORAGE_CONFIG.productImages.bucketName)
      .getPublicUrl(filename);

    // Get image dimensions
    const dimensions = await getImageDimensions(fileToUpload);

    return {
      success: true,
      data: {
        url: urlData.publicUrl,
        path: filename,
        width: dimensions.width,
        height: dimensions.height,
        size: fileToUpload.size,
      },
    };
  } catch (error) {
    const handled = handleError(error);
    return {
      success: false,
      error: handled.message,
    };
  }
}

/**
 * Deletes an image from storage
 */
export async function deleteProductImage(
  client: DatabaseClient,
  imagePath: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await client.storage
      .from(STORAGE_CONFIG.productImages.bucketName)
      .remove([imagePath]);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    const handled = handleError(error);
    return {
      success: false,
      error: handled.message,
    };
  }
}

/**
 * Gets the public URL for an image
 */
export function getProductImageUrl(
  client: DatabaseClient,
  imagePath: string
): string {
  const { data } = client.storage
    .from(STORAGE_CONFIG.productImages.bucketName)
    .getPublicUrl(imagePath);

  return data.publicUrl;
}

/**
 * Generates a signed URL for temporary access
 */
export async function getSignedImageUrl(
  client: DatabaseClient,
  imagePath: string,
  expiresIn: number = 3600
): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  try {
    const { data, error } = await client.storage
      .from(STORAGE_CONFIG.productImages.bucketName)
      .createSignedUrl(imagePath, expiresIn);

    if (error) {
      throw error;
    }

    return {
      success: true,
      url: data.signedUrl,
    };
  } catch (error) {
    const handled = handleError(error);
    return {
      success: false,
      error: handled.message,
    };
  }
}

/**
 * Helper function to get image dimensions
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Batch upload multiple images
 */
export async function uploadMultipleProductImages(
  client: DatabaseClient,
  files: File[],
  siteId: string,
  productId?: string,
  onProgress?: (completed: number, total: number) => void
): Promise<{
  success: boolean;
  results: Array<{
    file: File;
    success: boolean;
    data?: {
      url: string;
      path: string;
      width: number;
      height: number;
      size: number;
    };
    error?: string;
  }>;
  error?: string;
}> {
  try {
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await uploadProductImage(client, file, siteId, productId);
      
      results.push({
        file,
        success: result.success,
        data: result.data,
        error: result.error,
      });

      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    }

    results.filter(r => r.success).length;
    const hasFailures = results.some(r => !r.success);

    return {
      success: !hasFailures,
      results,
    };
  } catch (error) {
    const handled = handleError(error);
    return {
      success: false,
      results: [],
      error: handled.message,
    };
  }
}