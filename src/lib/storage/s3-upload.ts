/**
 * S3 Upload utilities for the Brands in Blooms platform
 * Handles S3 presigned URLs, multipart uploads, and direct S3 operations
 */

import { handleError } from '@/src/lib/types/error-handling';
import { Tables } from '@/src/lib/database/types';

type MediaFile = Tables<'media_files'>;

/**
 * S3 configuration and settings
 */
export const S3_CONFIG = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  bucket: process.env.NEXT_PUBLIC_S3_BUCKET || '',
  cdnUrl: process.env.NEXT_PUBLIC_CDN_URL || '',
  maxFileSize: 100 * 1024 * 1024, // 100MB
  multipartThreshold: 10 * 1024 * 1024, // 10MB - files larger than this use multipart upload
  allowedTypes: [
    'image/jpeg',
    'image/png', 
    'image/webp',
    'image/avif',
    'image/gif',
    'video/mp4',
    'video/webm',
    'application/pdf',
    'text/plain',
    'application/json',
  ] as string[],
} as const;

/**
 * Upload progress callback type
 */
export type UploadProgressCallback = (progress: number) => void;

/**
 * S3 upload result
 */
export interface S3UploadResult {
  success: boolean;
  data?: {
    key: string;
    url: string;
    cdnUrl?: string;
    etag: string;
    size: number;
    contentType: string;
  };
  error?: string;
}

/**
 * S3 multipart upload result
 */
export interface S3MultipartUploadResult {
  success: boolean;
  data?: {
    key: string;
    url: string;
    cdnUrl?: string;
    uploadId: string;
    etag: string;
    size: number;
    contentType: string;
  };
  error?: string;
}

/**
 * S3 delete result
 */
export interface S3DeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Presigned URL configuration
 */
export interface PresignedUrlConfig {
  key: string;
  fileName: string;
  siteId: string;
  productId?: string;
  contentType: string;
  contentLength: number;
  expires?: number; // seconds, defaults to 3600 (1 hour)
  metadata?: Record<string, string>;
}

/**
 * Multipart upload configuration
 */
export interface MultipartUploadConfig {
  fileName: string;
  siteId: string;
  productId?: string;
  contentType: string;
  contentLength: number;
  partSize?: number; // bytes, defaults to 10MB
  metadata?: Record<string, string>;
}

/**
 * Generates a unique S3 key for a file
 */
export function generateS3Key(
  siteId: string,
  resourceType: 'products' | 'media' | 'profiles' | 'content',
  resourceId: string,
  filename: string,
  options?: {
    timestamp?: boolean;
    randomSuffix?: boolean;
  }
): string {
  const { timestamp = true, randomSuffix = true } = options || {};
  
  // Clean the filename
  const cleanFilename = filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
  
  // Extract extension
  const parts = cleanFilename.split('.');
  const extension = parts.length > 1 ? `.${parts.pop()}` : '';
  const baseName = parts.join('.').substring(0, 50); // Limit base name length
  
  // Build key components
  const keyParts = [siteId, resourceType, resourceId];
  
  // Add timestamp and random suffix if requested
  let finalFilename = baseName;
  if (timestamp) {
    finalFilename += `_${Date.now()}`;
  }
  if (randomSuffix) {
    finalFilename += `_${Math.random().toString(36).substring(2, 8)}`;
  }
  finalFilename += extension;
  
  keyParts.push(finalFilename);
  
  return keyParts.join('/');
}

/**
 * Validates file for S3 upload
 */
export function validateFileForS3(file: File): { isValid: boolean; error?: string } {
  // Check file size
  if (file.size > S3_CONFIG.maxFileSize) {
    return {
      isValid: false,
      error: `File size must be less than ${S3_CONFIG.maxFileSize / 1024 / 1024}MB`,
    };
  }

  // Check file type
  if (!S3_CONFIG.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not supported. Allowed types: ${S3_CONFIG.allowedTypes.join(', ')}`,
    };
  }

  return { isValid: true };
}

/**
 * Gets a presigned URL for direct S3 upload with retry logic
 */
export async function getPresignedUploadUrl(
  config: PresignedUrlConfig,
  maxRetries: number = 3
): Promise<{
  success: boolean;
  data?: {
    uploadUrl: string;
    fields: Record<string, string>;
    url: string;
    cdnUrl?: string;
  };
  error?: string;
}> {
  let lastError: Error | null = null;

  // Retry loop with exponential backoff
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const requestBody = {
      fileName: config.fileName,
      key: config.key,  // Send the exact S3 key if provided
      contentType: config.contentType,
      fileSize: config.contentLength,
      siteId: config.siteId,
      productId: config.productId,
      metadata: config.metadata,
    };

    // Use relative URL - works on any domain
    const apiUrl = '/api/upload/presigned';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get presigned URL: ${response.statusText}`);
    }

    // Parse JSON response with error handling
    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      throw new Error(`Failed to parse presigned URL response: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
    }

    // Comprehensive response validation
    // Check that result is an object
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid response from presigned URL API: not an object');
    }

    // Check for API error first
    if (!result.success) {
      throw new Error(result.error || 'Presigned URL API returned an error');
    }

    // CRITICAL FIX: Validate data exists when success=true
    if (!result.data || typeof result.data !== 'object') {
      throw new Error('Invalid response: success=true but data is missing or invalid');
    }

    // Validate required fields exist in data
    const requiredFields = ['uploadUrl', 'publicUrl'];
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      if (!result.data[field] || typeof result.data[field] !== 'string') {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      throw new Error(`Invalid response: missing required fields: ${missingFields.join(', ')}`);
    }

    // Successfully validated response - return formatted data
    return {
      success: true,
      data: {
        uploadUrl: result.data.uploadUrl,
        fields: result.data.fields || {},
        url: result.data.publicUrl,  // Map publicUrl to url for compatibility
        cdnUrl: result.data.publicUrl, // Use publicUrl as cdnUrl since API handles CDN logic
      },
    };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  // All retries failed
  const handled = handleError(lastError || new Error('Unknown error'));

  return {
    success: false,
    error: `Failed after ${maxRetries} attempts: ${handled.message}`,
  };
}

/**
 * Uploads a file directly to S3 using presigned URL
 * Uses PUT method for PutObjectCommand presigned URLs
 */
export async function uploadToS3(
  file: File,
  uploadUrl: string,
  fields: Record<string, string>, // Kept for backwards compatibility but not used with PUT presigned URLs
  onProgress?: UploadProgressCallback,
  publicUrl?: string, // Optional publicUrl from presigned response (preferred over reconstructing)
  key?: string // Optional key from presigned response
): Promise<S3UploadResult> {
  try {
    // Validate file
    const validation = validateFileForS3(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Upload with progress tracking using PUT method for presigned URLs
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Use key and publicUrl from presigned response if provided (preferred)
          // Otherwise extract key from upload URL path
          let finalKey = key;
          let finalPublicUrl = publicUrl;
          let finalCdnUrl = publicUrl; // Use publicUrl as cdnUrl since API handles CDN logic

          if (!finalKey || !finalPublicUrl) {
            // Fallback: extract key from upload URL path
            // URL format for path-style: http(s)://host/bucket/key
            // URL format for virtual-hosted: http(s)://bucket.host/key
            const urlObj = new URL(uploadUrl);
            const pathParts = urlObj.pathname.split('/').filter(Boolean);

            // For path-style URLs (MinIO/S3): /{bucket}/{key...}
            // Skip the first part (bucket) and join the rest as the key
            finalKey = pathParts.length > 1 ? pathParts.slice(1).join('/') : pathParts.join('/');

            // Generate public URL using API proxy pattern
            finalPublicUrl = `/api/images/${finalKey}`;

            // Generate CDN URL if configured
            finalCdnUrl = S3_CONFIG.cdnUrl ? `${S3_CONFIG.cdnUrl}/${finalKey}` : undefined;
          }

          resolve({
            success: true,
            data: {
              key: finalKey,
              url: finalPublicUrl,
              cdnUrl: finalCdnUrl,
              etag: xhr.getResponseHeader('ETag')?.replace(/"/g, '') || '',
              size: file.size,
              contentType: file.type,
            },
          });
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed due to network error'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload was aborted'));
      });

      // Use PUT method for presigned URL uploads (required for PutObjectCommand)
      xhr.open('PUT', uploadUrl, true);

      // Set Content-Type header to match the presigned URL signature
      xhr.setRequestHeader('Content-Type', file.type);

      // Note: Content-Length is automatically set by the browser based on the body
      // and must NOT be set manually with XHR as it will cause errors

      // Send raw file as body (not FormData)
      xhr.send(file);
    });
  } catch (error) {
    const handled = handleError(error);
    return {
      success: false,
      error: handled.message,
    };
  }
}

/**
 * Initiates a multipart upload for large files
 */
export async function initializeMultipartUpload(
  config: MultipartUploadConfig
): Promise<{
  success: boolean;
  data?: {
    uploadId: string;
    key: string;
  };
  error?: string;
}> {
  try {
    const response = await fetch('/api/upload/multipart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'initiate',
        fileName: config.fileName,
        contentType: config.contentType,
        fileSize: config.contentLength,
        siteId: config.siteId,
        productId: config.productId,
        partSize: config.partSize,
        metadata: config.metadata,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to initialize multipart upload: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to initialize multipart upload');
    }

    return {
      success: true,
      data: {
        uploadId: result.data.sessionId, // API returns sessionId, not uploadId
        key: result.data.key,
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
 * Uploads a file part in multipart upload
 */
export async function uploadMultipartPart(
  file: File,
  uploadId: string,
  key: string,
  partNumber: number,
  start: number,
  end: number,
  onProgress?: UploadProgressCallback
): Promise<{
  success: boolean;
  data?: {
    partNumber: number;
    etag: string;
  };
  error?: string;
}> {
  try {
    // Get presigned URL for this part
    const response = await fetch('/api/upload/multipart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'upload-part',
        sessionId: uploadId, // The multipart API uses sessionId instead of uploadId
        partNumber,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get part upload URL: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get part upload URL');
    }

    // Extract part from file
    const part = file.slice(start, end);
    
    // Upload the part
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const etag = xhr.getResponseHeader('ETag')?.replace(/"/g, '') || '';
          resolve({
            success: true,
            data: {
              partNumber,
              etag,
            },
          });
        } else {
          reject(new Error(`Part upload failed with status ${xhr.status}: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Part upload failed due to network error'));
      });

      xhr.open('PUT', result.data.uploadUrl, true);
      xhr.send(part);
    });
  } catch (error) {
    const handled = handleError(error);
    return {
      success: false,
      error: handled.message,
    };
  }
}

/**
 * Completes a multipart upload
 */
export async function completeMultipartUpload(
  uploadId: string,
  key: string,
  parts: Array<{ partNumber: number; etag: string }>
): Promise<S3MultipartUploadResult> {
  try {
    const response = await fetch('/api/upload/multipart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'complete',
        sessionId: uploadId, // The multipart API uses sessionId instead of uploadId
        parts: parts.sort((a, b) => a.partNumber - b.partNumber),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to complete multipart upload: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to complete multipart upload');
    }

    return {
      success: true,
      data: {
        key: result.data.key,
        url: result.data.publicUrl || result.data.url,
        cdnUrl: result.data.cdnUrl,
        uploadId,
        etag: result.data.etag || '',
        size: 0, // Size info not returned by API
        contentType: '', // Content type not returned by API
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
 * Aborts a multipart upload
 */
export async function abortMultipartUpload(
  uploadId: string,
  key: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/upload/multipart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'abort',
        sessionId: uploadId, // The multipart API uses sessionId instead of uploadId
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to abort multipart upload: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to abort multipart upload');
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
 * Uploads a large file using multipart upload
 */
export async function uploadLargeFileToS3(
  file: File,
  siteId: string,
  productId?: string,
  options?: {
    partSize?: number;
    onProgress?: UploadProgressCallback;
    metadata?: Record<string, string>;
  }
): Promise<S3MultipartUploadResult> {
  const { 
    partSize = S3_CONFIG.multipartThreshold, 
    onProgress,
    metadata 
  } = options || {};

  try {
    // Validate file
    const validation = validateFileForS3(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Initialize multipart upload
    const initResult = await initializeMultipartUpload({
      fileName: file.name,
      siteId,
      productId,
      contentType: file.type,
      contentLength: file.size,
      partSize,
      metadata,
    });

    if (!initResult.success || !initResult.data) {
      throw new Error(initResult.error || 'Failed to initialize upload');
    }

    const { uploadId, key } = initResult.data;
    
    try {
      // Calculate parts
      const totalParts = Math.ceil(file.size / partSize);
      const parts: Array<{ partNumber: number; etag: string }> = [];
      
      // Upload parts
      for (let i = 0; i < totalParts; i++) {
        const partNumber = i + 1;
        const start = i * partSize;
        const end = Math.min(start + partSize, file.size);
        
        const partResult = await uploadMultipartPart(
          file,
          uploadId,
          key,
          partNumber,
          start,
          end,
          onProgress ? (progress) => {
            const overallProgress = ((i + progress / 100) / totalParts) * 100;
            onProgress(overallProgress);
          } : undefined
        );

        if (!partResult.success || !partResult.data) {
          throw new Error(partResult.error || `Failed to upload part ${partNumber}`);
        }

        parts.push({
          partNumber: partResult.data.partNumber,
          etag: partResult.data.etag,
        });
      }

      // Complete multipart upload
      const completeResult = await completeMultipartUpload(uploadId, key, parts);
      
      if (!completeResult.success) {
        throw new Error(completeResult.error || 'Failed to complete upload');
      }

      return completeResult;
    } catch (error) {
      // Abort the multipart upload on error
      await abortMultipartUpload(uploadId, key).catch(() => {
        // Silently handle abort failures
      });
      throw error;
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
 * Deletes an object from S3
 */
export async function deleteFromS3(key: string): Promise<S3DeleteResult> {
  try {
    const response = await fetch('/api/storage/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key }),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete file');
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
 * Gets the CDN URL for an S3 object
 */
export function getCdnUrl(key: string): string {
  if (S3_CONFIG.cdnUrl) {
    return `${S3_CONFIG.cdnUrl}/${key}`;
  }
  // Fallback to direct S3 URL
  return `https://${S3_CONFIG.bucket}.s3.${S3_CONFIG.region}.amazonaws.com/${key}`;
}

/**
 * Gets a signed URL for private S3 objects
 */
export async function getSignedS3Url(
  key: string,
  expires: number = 3600
): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  try {
    const response = await fetch('/api/storage/signed-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key, expires }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get signed URL: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to generate signed URL');
    }

    return {
      success: true,
      url: result.data.url,
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
 * High-level upload function that chooses between regular and multipart upload
 */
export async function uploadFileToS3(
  file: File,
  siteId: string,
  resourceType: 'products' | 'media' | 'profiles' | 'content',
  resourceId: string,
  options?: {
    filename?: string;
    onProgress?: UploadProgressCallback;
    metadata?: Record<string, string>;
  }
): Promise<S3UploadResult | S3MultipartUploadResult> {
  const { filename, onProgress, metadata } = options || {};

  // Validate siteId is provided
  if (!siteId || siteId.trim() === '') {
    return {
      success: false,
      error: 'siteId is required for S3 uploads',
    };
  }

  // Generate S3 key
  const key = generateS3Key(siteId, resourceType, resourceId, filename || file.name);
  
  // Choose upload method based on file size
  if (file.size > S3_CONFIG.multipartThreshold) {
    return uploadLargeFileToS3(file, siteId, resourceId, { onProgress, metadata });
  } else {
    // Get presigned URL and upload
    const presignedResult = await getPresignedUploadUrl({
      key,
      fileName: filename || file.name,
      siteId,
      productId: resourceId,
      contentType: file.type,
      contentLength: file.size,
      metadata,
    });

    if (!presignedResult.success || !presignedResult.data) {
      return {
        success: false,
        error: presignedResult.error || 'Failed to get upload URL',
      };
    }

    return uploadToS3(
      file,
      presignedResult.data.uploadUrl,
      presignedResult.data.fields,
      onProgress,
      presignedResult.data.url, // Pass publicUrl from presigned response
      key // Pass the key we generated
    );
  }
}