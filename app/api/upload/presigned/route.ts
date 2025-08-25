/**
 * Presigned URL generation API route
 * Generates secure presigned URLs for direct S3 uploads with validation and rate limiting
 */

import { NextRequest } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, getBucketName, isStorageConfigured } from '@/lib/storage/s3-client';
import { getUser } from '@/lib/auth/server';
import { apiSuccess, apiError, ApiResult } from '@/lib/types/api';
import { handleError } from '@/lib/types/error-handling';
import { rateLimiters, addRateLimitHeaders } from '@/lib/security/rate-limiting';
import { validateImageFile, STORAGE_CONFIG } from '@/lib/supabase/storage';
import { generateFilePath } from '@/lib/storage/index';

/**
 * Request body interface for presigned URL generation
 */
interface PresignedUrlRequest {
  fileName: string;
  contentType: string;
  fileSize: number;
  siteId: string;
  productId?: string;
  metadata?: Record<string, string>;
}

/**
 * Response interface for presigned URL
 */
interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
  fields?: Record<string, string>;
  expiresIn: number;
  maxFileSize: number;
  publicUrl: string;
}

/**
 * Validate file upload request
 */
function validateUploadRequest(data: unknown): {
  isValid: boolean;
  error?: string;
  data?: PresignedUrlRequest;
} {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Invalid request body' };
  }

  const request = data as Record<string, unknown>;

  // Validate required fields
  const requiredFields = ['fileName', 'contentType', 'fileSize', 'siteId'];
  for (const field of requiredFields) {
    if (!request[field] || typeof request[field] !== 'string') {
      if (field === 'fileSize' && typeof request[field] === 'number') {
        continue; // fileSize can be a number
      }
      return { isValid: false, error: `Missing or invalid ${field}` };
    }
  }

  const fileName = request.fileName as string;
  const contentType = request.contentType as string;
  const fileSize = typeof request.fileSize === 'number' ? request.fileSize : parseInt(request.fileSize as string, 10);
  const siteId = request.siteId as string;
  const productId = request.productId as string | undefined;
  const metadata = request.metadata as Record<string, string> | undefined;

  // Validate file size
  if (isNaN(fileSize) || fileSize <= 0) {
    return { isValid: false, error: 'Invalid file size' };
  }

  if (fileSize > STORAGE_CONFIG.productImages.maxFileSize) {
    return { 
      isValid: false, 
      error: `File size exceeds maximum allowed size of ${STORAGE_CONFIG.productImages.maxFileSize / (1024 * 1024)}MB` 
    };
  }

  // Validate file name
  if (!fileName || fileName.length > 255) {
    return { isValid: false, error: 'Invalid file name' };
  }

  // Validate content type
  if (!STORAGE_CONFIG.productImages.allowedTypes.includes(contentType)) {
    return { 
      isValid: false, 
      error: `Unsupported file type. Allowed types: ${STORAGE_CONFIG.productImages.allowedTypes.join(', ')}` 
    };
  }

  // Create mock file object for validation
  const mockFile = {
    name: fileName,
    type: contentType,
    size: fileSize,
  } as File;

  const validation = validateImageFile(mockFile);
  if (!validation.isValid) {
    return { isValid: false, error: validation.error };
  }

  return {
    isValid: true,
    data: {
      fileName,
      contentType,
      fileSize,
      siteId,
      productId,
      metadata,
    },
  };
}

/**
 * Add CORS headers for upload API
 */
function addCorsHeaders(headers: Headers): void {
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    process.env.NEXT_PUBLIC_PRODUCTION_URL,
  ].filter(Boolean);

  // In development, allow localhost variations
  if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push('http://localhost:3000', 'http://localhost:3001');
  }

  headers.set('Access-Control-Allow-Origin', allowedOrigins[0] || '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400'); // 24 hours
}

/**
 * POST handler for presigned URL generation
 */
export async function POST(request: NextRequest): Promise<Response> {
  const responseHeaders = new Headers();
  addCorsHeaders(responseHeaders);

  try {
    // Check if storage is configured
    if (!isStorageConfigured()) {
      console.error('Storage not configured for presigned URL generation');
      const response = apiError('Storage service unavailable', 'STORAGE_NOT_CONFIGURED', 503);
      return new Response(response.body, {
        status: response.status,
        headers: { 
          ...Object.fromEntries(response.headers.entries()), 
          ...Object.fromEntries(responseHeaders.entries()) 
        },
      });
    }

    // Check authentication
    const user = await getUser();
    if (!user) {
      const response = apiError('Authentication required', 'UNAUTHORIZED', 401);
      return new Response(response.body, {
        status: response.status,
        headers: { 
          ...Object.fromEntries(response.headers.entries()), 
          ...Object.fromEntries(responseHeaders.entries()) 
        },
      });
    }

    // Apply rate limiting
    const rateLimitResult = rateLimiters.presignedUrl(request);
    addRateLimitHeaders(responseHeaders, rateLimitResult);

    if (!rateLimitResult.allowed) {
      const response = apiError(
        'Too many upload requests. Please try again later.',
        'RATE_LIMIT_EXCEEDED',
        429
      );
      return new Response(response.body, {
        status: response.status,
        headers: { 
          ...Object.fromEntries(response.headers.entries()), 
          ...Object.fromEntries(responseHeaders.entries()) 
        },
      });
    }

    // Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      const response = apiError('Invalid JSON in request body', 'INVALID_JSON', 400);
      return new Response(response.body, {
        status: response.status,
        headers: { 
          ...Object.fromEntries(response.headers.entries()), 
          ...Object.fromEntries(responseHeaders.entries()) 
        },
      });
    }

    const validation = validateUploadRequest(requestBody);
    if (!validation.isValid) {
      const response = apiError(validation.error!, 'VALIDATION_ERROR', 400);
      return new Response(response.body, {
        status: response.status,
        headers: { 
          ...Object.fromEntries(response.headers.entries()), 
          ...Object.fromEntries(responseHeaders.entries()) 
        },
      });
    }

    const uploadRequest = validation.data!;

    // Generate unique file path
    const filePath = generateFilePath(
      uploadRequest.fileName,
      uploadRequest.siteId,
      'images',
      uploadRequest.productId
    );

    const bucketName = getBucketName();
    const expiresIn = 5 * 60; // 5 minutes

    // Prepare metadata and tags
    const metadata = {
      'original-name': uploadRequest.fileName,
      'site-id': uploadRequest.siteId,
      'user-id': user.id,
      'uploaded-at': new Date().toISOString(),
      ...uploadRequest.metadata,
      ...(uploadRequest.productId && { 'product-id': uploadRequest.productId }),
    };

    const tags = {
      siteId: uploadRequest.siteId,
      userId: user.id,
      uploadType: 'presigned',
      ...(uploadRequest.productId && { productId: uploadRequest.productId }),
    };

    // Create presigned URL
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: filePath,
      ContentType: uploadRequest.contentType,
      ContentLength: uploadRequest.fileSize,
      CacheControl: 'public, max-age=31536000, immutable',
      Metadata: metadata,
      Tagging: new URLSearchParams(tags).toString(),
    });

    const uploadUrl = await getSignedUrl(s3Client, putCommand, { 
      expiresIn,
      signableHeaders: new Set(['host', 'content-type', 'content-length']),
    });

    // Generate public URL for after upload
    // Return a relative URL to avoid issues with Next.js Image component
    const publicUrl = `/api/images/${filePath}`;

    const responseData: PresignedUrlResponse = {
      uploadUrl,
      key: filePath,
      expiresIn,
      maxFileSize: STORAGE_CONFIG.productImages.maxFileSize,
      publicUrl,
    };

    const response = apiSuccess(responseData);
    return new Response(response.body, {
      status: response.status,
      headers: { ...Object.fromEntries(response.headers), ...Object.fromEntries(responseHeaders) },
    });

  } catch (error) {
    const handled = handleError(error);
    console.error('Presigned URL generation error:', {
      userId: (await getUser().catch(() => null))?.id,
      error: handled.message,
      details: handled.details,
    });

    const response = apiError(
      'Failed to generate upload URL',
      'PRESIGNED_URL_ERROR',
      500
    );
    return new Response(response.body, {
      status: response.status,
      headers: { ...Object.fromEntries(response.headers), ...Object.fromEntries(responseHeaders) },
    });
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(): Promise<Response> {
  const headers = new Headers();
  addCorsHeaders(headers);
  
  return new Response(null, {
    status: 200,
    headers,
  });
}