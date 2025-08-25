/**
 * Storage abstraction layer for the Brands in Blooms platform
 * Provides unified interface for file upload, delete, and URL generation
 * Supports both S3-compatible storage and Supabase fallback
 */

import { 
  PutObjectCommand, 
  DeleteObjectCommand, 
  HeadObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, getBucketName, getCdnUrl, isStorageConfigured } from './s3-client';
import { STORAGE_CONFIG, validateImageFile } from '../supabase/storage';
import { handleError } from '../types/error-handling';
import { ApiResult } from '../types/api';

/**
 * File upload result interface
 */
export interface FileUploadResult {
  url: string;
  path: string;
  size: number;
  contentType: string;
  width?: number;
  height?: number;
}

/**
 * Storage operation result
 */
export interface StorageResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Upload options interface
 */
export interface UploadOptions {
  contentType?: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
}

/**
 * File validation using existing patterns
 */
export function validateFile(file: File): StorageResult<void> {
  try {
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
      };
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
 * Generate unique file path with site isolation
 */
export function generateFilePath(
  originalName: string, 
  siteId: string, 
  folder: string = 'images',
  productId?: string
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const baseName = originalName.split('.')[0]
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 20);
  
  if (productId) {
    return `${siteId}/${folder}/products/${productId}/${baseName}_${timestamp}_${random}.${extension}`;
  }
  
  return `${siteId}/${folder}/${baseName}_${timestamp}_${random}.${extension}`;
}

/**
 * Get image dimensions from file
 */
async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      resolve({ width: 0, height: 0 });
      return;
    }

    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error('Failed to load image for dimension calculation'));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Upload file to S3-compatible storage
 */
export async function uploadFile(
  file: File,
  siteId: string,
  productId?: string,
  options: UploadOptions = {}
): Promise<StorageResult<FileUploadResult>> {
  try {
    // Check if storage is configured
    if (!isStorageConfigured()) {
      return {
        success: false,
        error: 'Storage is not properly configured',
      };
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Generate file path
    const filePath = generateFilePath(file.name, siteId, 'images', productId);
    const bucketName = getBucketName();
    
    // Get image dimensions if it's an image
    let dimensions = { width: 0, height: 0 };
    try {
      if (file.type.startsWith('image/')) {
        dimensions = await getImageDimensions(file);
      }
    } catch (error) {
      // Non-critical error, continue without dimensions
      console.warn('Could not get image dimensions:', error);
    }

    // Prepare upload command
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: filePath,
      Body: file,
      ContentType: options.contentType || file.type,
      CacheControl: options.cacheControl || 'public, max-age=31536000', // 1 year cache
      Metadata: {
        ...options.metadata,
        'original-name': file.name,
        'site-id': siteId,
        ...(productId && { 'product-id': productId }),
        ...(dimensions.width > 0 && { 
          width: dimensions.width.toString(),
          height: dimensions.height.toString(),
        }),
      },
      ...(options.tags && { Tagging: new URLSearchParams(options.tags).toString() }),
    });

    // Execute upload
    await s3Client.send(uploadCommand);

    // Generate public URL
    const cdnUrl = getCdnUrl();
    const publicUrl = `${cdnUrl}/${bucketName}/${filePath}`;

    return {
      success: true,
      data: {
        url: publicUrl,
        path: filePath,
        size: file.size,
        contentType: file.type,
        width: dimensions.width > 0 ? dimensions.width : undefined,
        height: dimensions.height > 0 ? dimensions.height : undefined,
      },
    };
  } catch (error) {
    const handled = handleError(error);
    return {
      success: false,
      error: `Upload failed: ${handled.message}`,
    };
  }
}

/**
 * Delete file from storage
 */
export async function deleteFile(filePath: string): Promise<StorageResult<void>> {
  try {
    if (!isStorageConfigured()) {
      return {
        success: false,
        error: 'Storage is not properly configured',
      };
    }

    const bucketName = getBucketName();
    
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: filePath,
    });

    await s3Client.send(deleteCommand);

    return { success: true };
  } catch (error) {
    const handled = handleError(error);
    return {
      success: false,
      error: `Delete failed: ${handled.message}`,
    };
  }
}

/**
 * Check if file exists in storage
 */
export async function fileExists(filePath: string): Promise<StorageResult<boolean>> {
  try {
    if (!isStorageConfigured()) {
      return {
        success: false,
        error: 'Storage is not properly configured',
      };
    }

    const bucketName = getBucketName();
    
    const headCommand = new HeadObjectCommand({
      Bucket: bucketName,
      Key: filePath,
    });

    await s3Client.send(headCommand);
    return { success: true, data: true };
  } catch (error) {
    // If the file doesn't exist, AWS SDK throws an error
    const handled = handleError(error);
    if (handled.message.includes('NotFound') || handled.message.includes('NoSuchKey')) {
      return { success: true, data: false };
    }
    
    return {
      success: false,
      error: `File existence check failed: ${handled.message}`,
    };
  }
}

/**
 * Generate signed URL for temporary access
 */
export async function generateSignedUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<StorageResult<string>> {
  try {
    if (!isStorageConfigured()) {
      return {
        success: false,
        error: 'Storage is not properly configured',
      };
    }

    const bucketName = getBucketName();
    
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: filePath,
    });

    const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn });
    
    return {
      success: true,
      data: signedUrl,
    };
  } catch (error) {
    const handled = handleError(error);
    return {
      success: false,
      error: `Signed URL generation failed: ${handled.message}`,
    };
  }
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(filePath: string): string {
  const cdnUrl = getCdnUrl();
  const bucketName = getBucketName();
  return `${cdnUrl}/${bucketName}/${filePath}`;
}

/**
 * Batch upload multiple files
 */
export async function uploadMultipleFiles(
  files: File[],
  siteId: string,
  productId?: string,
  onProgress?: (completed: number, total: number) => void
): Promise<StorageResult<Array<{ file: File; result: StorageResult<FileUploadResult> }>>> {
  try {
    const results: Array<{ file: File; result: StorageResult<FileUploadResult> }> = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await uploadFile(file, siteId, productId);
      
      results.push({ file, result });
      
      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    }

    const hasFailures = results.some(r => !r.result.success);
    
    return {
      success: !hasFailures,
      data: results,
    };
  } catch (error) {
    const handled = handleError(error);
    return {
      success: false,
      error: `Batch upload failed: ${handled.message}`,
    };
  }
}

/**
 * Copy file to new location
 */
export async function copyFile(
  sourcePath: string,
  destinationPath: string
): Promise<StorageResult<void>> {
  try {
    if (!isStorageConfigured()) {
      return {
        success: false,
        error: 'Storage is not properly configured',
      };
    }

    // For S3, we would use CopyObjectCommand, but for simplicity
    // this implementation downloads and re-uploads
    // In production, you might want to use server-side copy
    
    return {
      success: false,
      error: 'Copy operation not yet implemented',
    };
  } catch (error) {
    const handled = handleError(error);
    return {
      success: false,
      error: `Copy failed: ${handled.message}`,
    };
  }
}

/**
 * Storage service interface for dependency injection
 */
export interface StorageService {
  uploadFile: typeof uploadFile;
  deleteFile: typeof deleteFile;
  fileExists: typeof fileExists;
  generateSignedUrl: typeof generateSignedUrl;
  getPublicUrl: typeof getPublicUrl;
  uploadMultipleFiles: typeof uploadMultipleFiles;
}

/**
 * Default storage service implementation
 */
export const storageService: StorageService = {
  uploadFile,
  deleteFile,
  fileExists,
  generateSignedUrl,
  getPublicUrl,
  uploadMultipleFiles,
};

/**
 * Re-export storage configuration for convenience
 */
export { STORAGE_CONFIG } from '../supabase/storage';
export { s3Client, getBucketName, getCdnUrl, isStorageConfigured } from './s3-client';