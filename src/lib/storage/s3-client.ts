/**
 * S3-compatible storage client configuration for the Brands in Blooms platform
 * Supports both development (MinIO) and production (Cloudflare R2) environments
 */

import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { handleError } from '../types/error-handling';

/**
 * Storage environment configuration
 */
export interface StorageConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  endpoint?: string;
  bucketName: string;
  forcePathStyle?: boolean;
  cdnUrl?: string;
}

/**
 * Get storage configuration based on environment
 * Priority: R2 config (if present) > MinIO config (if present) > MinIO defaults
 */
function getStorageConfig(): StorageConfig {
  // Check for R2 configuration first (works in both dev and prod)
  const accountId = process.env.R2_ACCOUNT_ID;

  if (accountId && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME) {
    // Cloudflare R2 configuration
    console.log('[S3 Client] Using Cloudflare R2 configuration');
    return {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      region: 'auto', // R2 uses 'auto' as the region
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      bucketName: process.env.R2_BUCKET_NAME,
      forcePathStyle: false,
      cdnUrl: process.env.NEXT_PUBLIC_CDN_URL || `https://${accountId}.r2.cloudflarestorage.com`,
    };
  }

  // Fall back to MinIO for local development
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    console.log('[S3 Client] Using MinIO configuration for local development');
    return {
      accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
      region: process.env.MINIO_REGION || 'us-east-1',
      endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
      bucketName: process.env.MINIO_BUCKET_NAME || 'local-images',
      forcePathStyle: true, // Required for MinIO
      cdnUrl: process.env.NEXT_PUBLIC_CDN_URL || 'http://localhost:9000',
    };
  }

  // Production without R2 config - this should not happen
  throw new Error('Storage not configured: R2_ACCOUNT_ID and related credentials are required');
}

/**
 * Validate required environment variables
 */
function validateStorageConfig(config: StorageConfig): void {
  const requiredFields: Array<keyof StorageConfig> = ['accessKeyId', 'secretAccessKey', 'region', 'bucketName'];
  
  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`Storage configuration missing: ${field}`);
    }
  }
}

/**
 * Create S3 client configuration
 */
function createS3ClientConfig(): S3ClientConfig {
  try {
    const config = getStorageConfig();
    validateStorageConfig(config);

    const clientConfig: S3ClientConfig = {
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    };

    // Add endpoint and path style configuration
    if (config.endpoint) {
      clientConfig.endpoint = config.endpoint;
    }

    if (config.forcePathStyle) {
      clientConfig.forcePathStyle = config.forcePathStyle;
    }

    return clientConfig;
  } catch (error) {
    const handled = handleError(error);
    throw new Error(`Failed to create S3 client configuration: ${handled.message}`);
  }
}

/**
 * Storage configuration instance
 */
export const storageConfig = (() => {
  try {
    return getStorageConfig();
  } catch (error) {
    const handled = handleError(error);
    console.error('Storage configuration error:', handled.message);
    // Return minimal config to prevent app crash
    return {
      accessKeyId: '',
      secretAccessKey: '',
      region: 'us-east-1',
      bucketName: 'fallback-bucket',
    };
  }
})();

/**
 * S3 client instance
 */
export const s3Client = (() => {
  try {
    return new S3Client(createS3ClientConfig());
  } catch (error) {
    const handled = handleError(error);
    console.error('Failed to initialize S3 client:', handled.message);
    // Return a minimal client that will fail gracefully
    return new S3Client({
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'fallback',
        secretAccessKey: 'fallback',
      },
    });
  }
})();

/**
 * Get the configured bucket name
 */
export const getBucketName = (): string => storageConfig.bucketName;

/**
 * Get the CDN URL for serving files
 */
export const getCdnUrl = (): string => {
  return storageConfig.cdnUrl || (storageConfig.endpoint || '');
};

/**
 * Check if storage is properly configured
 */
export const isStorageConfigured = (): boolean => {
  try {
    const config = getStorageConfig();
    validateStorageConfig(config);
    return true;
  } catch {
    return false;
  }
};

/**
 * Storage client configuration export for testing and debugging
 */
export const getClientConfig = (): StorageConfig => storageConfig;