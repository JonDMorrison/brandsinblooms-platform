/**
 * Dual Storage Adapter for the Brands in Blooms platform
 * Provides seamless migration between Supabase Storage and S3/CDN
 * Supports fallback scenarios and environment-based storage selection
 */

import { handleError } from '@/src/lib/types/error-handling';
import { Tables, TablesInsert, TablesUpdate } from '@/src/lib/database/types';
import { supabase } from '@/src/lib/supabase/client';

// Supabase storage functions
import {
  uploadProductImage as uploadToSupabase,
  deleteProductImage as deleteFromSupabase,
  getProductImageUrl as getSupabaseImageUrl,
  validateImageFile as validateSupabaseFile,
  type StorageResult as SupabaseStorageResult
} from '@/src/lib/supabase/storage';

// S3 storage functions
import {
  uploadFileToS3,
  deleteFromS3,
  getCdnUrl,
  getSignedS3Url,
  validateFileForS3,
  generateS3Key,
  type S3UploadResult,
  type S3MultipartUploadResult,
  type S3DeleteResult
} from '@/src/lib/storage/s3-upload';

type MediaFile = Tables<'media_files'>;
type MediaFileInsert = TablesInsert<'media_files'>;
type MediaFileUpdate = TablesUpdate<'media_files'>;

/**
 * Storage provider types
 */
export type StorageProvider = 'supabase' | 's3' | 'auto';
export type StorageType = 'supabase' | 's3';

/**
 * Configuration for dual storage
 */
export interface DualStorageConfig {
  provider: StorageProvider;
  enableMigration: boolean;
  fallbackToSupabase: boolean;
  migrateOnRead: boolean;
  cdnEnabled: boolean;
}

/**
 * Upload options for dual storage
 */
export interface DualUploadOptions {
  siteId: string;
  file: File;
  resourceType?: 'products' | 'media' | 'profiles' | 'content';
  resourceId?: string;
  filename?: string;
  altText?: string;
  metadata?: Record<string, unknown>;
  onProgress?: (progress: number) => void;
  forceProvider?: StorageProvider;
}

/**
 * Unified upload result
 */
export interface DualStorageResult {
  success: boolean;
  data?: {
    url: string;
    cdnUrl?: string;
    key?: string;
    path?: string;
    storageType: StorageType;
    size: number;
    contentType: string;
    width?: number;
    height?: number;
  };
  error?: string;
  provider: StorageType;
  migrated?: boolean;
}

/**
 * Gets storage configuration from environment variables
 */
function getStorageConfig(): DualStorageConfig {
  const provider = (process.env.NEXT_PUBLIC_STORAGE_PROVIDER as StorageProvider) || 'auto';
  const enableMigration = process.env.NEXT_PUBLIC_ENABLE_STORAGE_MIGRATION === 'true';
  const fallbackToSupabase = process.env.NEXT_PUBLIC_FALLBACK_TO_SUPABASE !== 'false';
  const migrateOnRead = process.env.NEXT_PUBLIC_MIGRATE_ON_READ === 'true';
  const cdnEnabled = process.env.NEXT_PUBLIC_CDN_ENABLED === 'true';

  return {
    provider,
    enableMigration,
    fallbackToSupabase,
    migrateOnRead,
    cdnEnabled,
  };
}

/**
 * Determines which storage provider to use
 */
function determineStorageProvider(
  forceProvider?: StorageProvider,
  config?: DualStorageConfig
): StorageType {
  const storageConfig = config || getStorageConfig();
  
  if (forceProvider && forceProvider !== 'auto') {
    return forceProvider as StorageType;
  }

  switch (storageConfig.provider) {
    case 's3':
      return 's3';
    case 'supabase':
      return 'supabase';
    case 'auto':
    default:
      // Auto-detect based on environment
      const hasS3Config = !!(
        process.env.NEXT_PUBLIC_AWS_REGION &&
        process.env.NEXT_PUBLIC_S3_BUCKET
      );
      return hasS3Config ? 's3' : 'supabase';
  }
}

/**
 * Creates or updates media file record in database
 */
async function upsertMediaRecord(
  siteId: string,
  file: File,
  uploadResult: DualStorageResult,
  options: {
    altText?: string;
    metadata?: Record<string, unknown>;
    resourceType?: string;
    resourceId?: string;
  } = {}
): Promise<MediaFile | null> {
  try {
    const { altText, metadata, resourceType, resourceId } = options;
    const userId = (await supabase.auth.getUser()).data.user?.id;

    const mediaData: MediaFileInsert = {
      site_id: siteId,
      file_name: file.name,
      file_type: file.type,
      file_size_bytes: file.size,
      file_url: uploadResult.data!.url,
      cdn_url: uploadResult.data!.cdnUrl || null,
      storage_type: uploadResult.data!.storageType,
      alt_text: altText || null,
      upload_metadata: metadata ? JSON.parse(JSON.stringify({
        ...metadata,
        resourceType,
        resourceId,
        uploadedWith: 'dual-storage-adapter',
        provider: uploadResult.provider,
        migrated: uploadResult.migrated || false,
      })) : null,
      uploaded_by: userId || null,
    };

    // For S3 uploads, include S3-specific fields
    if (uploadResult.data!.storageType === 's3') {
      mediaData.s3_key = uploadResult.data!.key || null;
      mediaData.s3_bucket = process.env.NEXT_PUBLIC_S3_BUCKET || null;
    }

    const { data, error } = await supabase
      .from('media_files')
      .insert(mediaData)
      .select()
      .single();

    if (error) {
      console.error('Failed to create media record:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating media record:', handleError(error).message);
    return null;
  }
}

/**
 * Uploads file using the dual storage approach
 */
export async function uploadWithDualStorage(
  options: DualUploadOptions
): Promise<{
  success: boolean;
  result?: DualStorageResult;
  mediaRecord?: MediaFile;
  error?: string;
}> {
  const {
    siteId,
    file,
    resourceType = 'media',
    resourceId = 'general',
    filename,
    altText,
    metadata,
    onProgress,
    forceProvider,
  } = options;

  const config = getStorageConfig();
  const provider = determineStorageProvider(forceProvider, config);

  try {
    let result: DualStorageResult;

    if (provider === 's3') {
      // Upload to S3
      const s3Result = await uploadFileToS3(
        file,
        siteId,
        resourceType,
        resourceId,
        {
          filename,
          onProgress,
          metadata,
        }
      );

      if (!s3Result.success) {
        // Fallback to Supabase if configured
        if (config.fallbackToSupabase) {
          console.warn('S3 upload failed, falling back to Supabase:', s3Result.error);
          return uploadWithDualStorage({
            ...options,
            forceProvider: 'supabase',
          });
        }
        throw new Error(s3Result.error || 'S3 upload failed');
      }

      result = {
        success: true,
        data: {
          url: s3Result.data!.url,
          cdnUrl: s3Result.data!.cdnUrl,
          key: s3Result.data!.key,
          storageType: 's3' as const,
          size: file.size,
          contentType: file.type,
        },
        provider: 's3',
      };
    } else {
      // Upload to Supabase
      const supabaseResult = await uploadToSupabase(
        supabase,
        file,
        siteId,
        resourceId !== 'general' ? resourceId : undefined
      );

      if (!supabaseResult.success) {
        throw new Error(supabaseResult.error || 'Supabase upload failed');
      }

      result = {
        success: true,
        data: {
          url: supabaseResult.data!.url,
          path: supabaseResult.data!.path,
          storageType: 'supabase' as const,
          size: file.size,
          contentType: file.type,
          width: supabaseResult.data!.width,
          height: supabaseResult.data!.height,
        },
        provider: 'supabase',
      };
    }

    // Create media record
    const mediaRecord = await upsertMediaRecord(siteId, file, result, {
      altText,
      metadata,
      resourceType,
      resourceId,
    });

    return {
      success: true,
      result,
      mediaRecord: mediaRecord || undefined,
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
 * Deletes file from storage
 */
export async function deleteWithDualStorage(
  mediaFile: MediaFile
): Promise<{ success: boolean; error?: string }> {
  try {
    let deleteResult: { success: boolean; error?: string };

    if (mediaFile.storage_type === 's3' && mediaFile.s3_key) {
      // Delete from S3
      deleteResult = await deleteFromS3(mediaFile.s3_key);
    } else {
      // Delete from Supabase - extract path from URL
      const url = new URL(mediaFile.file_url);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.findIndex(part => part === 'product-images' || part === 'media');
      
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        const imagePath = pathParts.slice(bucketIndex + 1).join('/');
        deleteResult = await deleteFromSupabase(supabase, imagePath);
      } else {
        throw new Error('Could not determine storage path from URL');
      }
    }

    if (!deleteResult.success) {
      throw new Error(deleteResult.error || 'Failed to delete from storage');
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('media_files')
      .delete()
      .eq('id', mediaFile.id);

    if (dbError) {
      console.error('Failed to delete media record from database:', dbError);
      // Don't fail the entire operation if DB deletion fails
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
 * Gets the best URL for a media file (CDN if available, otherwise direct)
 */
export function getBestUrl(mediaFile: MediaFile): string {
  const config = getStorageConfig();

  // Prefer CDN URL if available and CDN is enabled
  if (config.cdnEnabled && mediaFile.cdn_url) {
    return mediaFile.cdn_url;
  }

  // For S3, generate CDN URL if configured
  if (mediaFile.storage_type === 's3' && mediaFile.s3_key && config.cdnEnabled) {
    return getCdnUrl(mediaFile.s3_key);
  }

  // Fall back to direct URL
  return mediaFile.file_url;
}

/**
 * Gets a signed URL for private files
 */
export async function getSignedUrl(
  mediaFile: MediaFile,
  expires: number = 3600
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    if (mediaFile.storage_type === 's3' && mediaFile.s3_key) {
      return getSignedS3Url(mediaFile.s3_key, expires);
    } else {
      // For Supabase, use the existing signed URL function
      const url = new URL(mediaFile.file_url);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.findIndex(part => part === 'product-images' || part === 'media');
      
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        const imagePath = pathParts.slice(bucketIndex + 1).join('/');
        const { data, error } = await supabase.storage
          .from('product-images')
          .createSignedUrl(imagePath, expires);

        if (error) throw error;
        
        return {
          success: true,
          url: data.signedUrl,
        };
      } else {
        throw new Error('Could not determine storage path from URL');
      }
    }
  } catch (error) {
    const handled = handleError(error);
    return {
      success: false,
      error: handled.message,
    };
  }
}

/**
 * Migrates a file from Supabase to S3
 */
export async function migrateFileToS3(
  mediaFile: MediaFile,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; newMediaFile?: MediaFile; error?: string }> {
  const config = getStorageConfig();
  
  if (!config.enableMigration) {
    return {
      success: false,
      error: 'Migration is not enabled',
    };
  }

  if (mediaFile.storage_type === 's3') {
    return {
      success: true,
      newMediaFile: mediaFile,
    };
  }

  try {
    // Download file from Supabase
    const response = await fetch(mediaFile.file_url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const blob = await response.blob();
    const file = new File([blob], mediaFile.file_name, {
      type: mediaFile.file_type || 'application/octet-stream',
    });

    // Upload to S3
    const s3Key = generateS3Key(
      mediaFile.site_id,
      'media',
      'migrated',
      mediaFile.file_name
    );

    const uploadResult = await uploadFileToS3(
      file,
      mediaFile.site_id,
      'media',
      'migrated',
      {
        filename: mediaFile.file_name,
        onProgress,
      }
    );

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Failed to upload to S3');
    }

    // Update media record
    const updateData: MediaFileUpdate = {
      file_url: uploadResult.data!.url,
      cdn_url: uploadResult.data!.cdnUrl || null,
      s3_key: uploadResult.data!.key,
      s3_bucket: process.env.NEXT_PUBLIC_S3_BUCKET || null,
      storage_type: 's3',
      migrated_at: new Date().toISOString(),
    };

    const { data: updatedMediaFile, error: updateError } = await supabase
      .from('media_files')
      .update(updateData)
      .eq('id', mediaFile.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Optionally delete from Supabase storage (commented out for safety)
    // const oldPath = extractPathFromSupabaseUrl(mediaFile.file_url);
    // if (oldPath) {
    //   await deleteFromSupabase(supabase, oldPath);
    // }

    return {
      success: true,
      newMediaFile: updatedMediaFile,
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
 * Automatically migrates file on read if configured
 */
export async function getUrlWithMigration(
  mediaFile: MediaFile
): Promise<{ url: string; mediaFile: MediaFile; migrated?: boolean }> {
  const config = getStorageConfig();

  // Check if we should migrate on read
  if (
    config.migrateOnRead &&
    config.enableMigration &&
    mediaFile.storage_type === 'supabase' &&
    !mediaFile.migrated_at
  ) {
    console.log(`Auto-migrating file ${mediaFile.id} to S3`);
    
    const migrationResult = await migrateFileToS3(mediaFile);
    
    if (migrationResult.success && migrationResult.newMediaFile) {
      return {
        url: getBestUrl(migrationResult.newMediaFile),
        mediaFile: migrationResult.newMediaFile,
        migrated: true,
      };
    } else {
      console.warn(`Failed to migrate file ${mediaFile.id}:`, migrationResult.error);
    }
  }

  return {
    url: getBestUrl(mediaFile),
    mediaFile,
  };
}

/**
 * Batch migration function for multiple files
 */
export async function batchMigrateFiles(
  siteId: string,
  limit: number = 10,
  onProgress?: (completed: number, total: number, current?: MediaFile) => void
): Promise<{
  success: boolean;
  migrated: number;
  failed: number;
  errors: Array<{ file: MediaFile; error: string }>;
}> {
  const config = getStorageConfig();
  
  if (!config.enableMigration) {
    return {
      success: false,
      migrated: 0,
      failed: 0,
      errors: [{ file: {} as MediaFile, error: 'Migration is not enabled' }],
    };
  }

  try {
    // Get files that need migration
    const { data: filesToMigrate, error } = await supabase
      .from('media_files')
      .select('*')
      .eq('site_id', siteId)
      .eq('storage_type', 'supabase')
      .is('migrated_at', null)
      .limit(limit);

    if (error) throw error;

    if (!filesToMigrate || filesToMigrate.length === 0) {
      return {
        success: true,
        migrated: 0,
        failed: 0,
        errors: [],
      };
    }

    let migrated = 0;
    let failed = 0;
    const errors: Array<{ file: MediaFile; error: string }> = [];

    for (let i = 0; i < filesToMigrate.length; i++) {
      const file = filesToMigrate[i];
      
      onProgress?.(i, filesToMigrate.length, file);

      const result = await migrateFileToS3(file);
      
      if (result.success) {
        migrated++;
      } else {
        failed++;
        errors.push({ file, error: result.error || 'Unknown error' });
      }
    }

    onProgress?.(filesToMigrate.length, filesToMigrate.length);

    return {
      success: true,
      migrated,
      failed,
      errors,
    };
  } catch (error) {
    const handled = handleError(error);
    return {
      success: false,
      migrated: 0,
      failed: 0,
      errors: [{ file: {} as MediaFile, error: handled.message }],
    };
  }
}

/**
 * Gets migration statistics for a site
 */
export async function getMigrationStats(siteId: string): Promise<{
  total: number;
  migrated: number;
  pending: number;
  supabase: number;
  s3: number;
  percentage: number;
}> {
  try {
    const { data, error } = await supabase
      .from('media_files')
      .select('storage_type, migrated_at', { count: 'exact' })
      .eq('site_id', siteId);

    if (error) throw error;

    const total = data.length;
    const s3 = data.filter(f => f.storage_type === 's3').length;
    const supabase = data.filter(f => f.storage_type === 'supabase').length;
    const migrated = data.filter(f => f.migrated_at).length;
    const pending = supabase - migrated;
    const percentage = total > 0 ? Math.round((s3 / total) * 100) : 0;

    return {
      total,
      migrated,
      pending,
      supabase,
      s3,
      percentage,
    };
  } catch (error) {
    console.error('Failed to get migration stats:', handleError(error).message);
    return {
      total: 0,
      migrated: 0,
      pending: 0,
      supabase: 0,
      s3: 0,
      percentage: 0,
    };
  }
}

// Export types and configuration
export { getStorageConfig, determineStorageProvider };
export type { DualStorageConfig, DualUploadOptions, DualStorageResult };