/**
 * Multipart upload support API route
 * Handles large file uploads using S3 multipart upload with session management
 */

import { NextRequest } from 'next/server';
import { 
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListPartsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, getBucketName, isStorageConfigured } from '@/lib/storage/s3-client';
import { getUser } from '@/lib/auth/server';
import { apiSuccess, apiError } from '@/lib/types/api';
import { handleError } from '@/lib/types/error-handling';
import { rateLimiters, addRateLimitHeaders } from '@/lib/security/rate-limiting';
import { validateImageFile, STORAGE_CONFIG } from '@/lib/supabase/storage';
import { generateFilePath } from '@/lib/storage/index';

/**
 * Minimum file size for multipart upload (5MB)
 */
const MULTIPART_THRESHOLD = 5 * 1024 * 1024;

/**
 * Default part size (10MB)
 */
const DEFAULT_PART_SIZE = 10 * 1024 * 1024;

/**
 * Maximum number of parts (10,000 as per S3 limit)
 */
const MAX_PARTS = 10000;

/**
 * Upload session storage (in production, use Redis or database)
 */
interface UploadSession {
  uploadId: string;
  key: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  siteId: string;
  userId: string;
  productId?: string;
  createdAt: number;
  partSize: number;
  completedParts: Array<{ partNumber: number; etag: string }>;
}

// In-memory session store (use Redis in production)
const uploadSessions = new Map<string, UploadSession>();

/**
 * Clean up expired sessions (older than 24 hours)
 */
function cleanupExpiredSessions(): void {
  const now = Date.now();
  const expiredSessionIds: string[] = [];

  uploadSessions.forEach((session, sessionId) => {
    if (now - session.createdAt > 24 * 60 * 60 * 1000) { // 24 hours
      expiredSessionIds.push(sessionId);
    }
  });

  for (const sessionId of expiredSessionIds) {
    const session = uploadSessions.get(sessionId);
    if (session) {
      // Abort the S3 multipart upload
      abortMultipartUpload(session.key, session.uploadId).catch(console.error);
      uploadSessions.delete(sessionId);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

/**
 * Abort multipart upload in S3
 */
async function abortMultipartUpload(key: string, uploadId: string): Promise<void> {
  const bucketName = getBucketName();
  const abortCommand = new AbortMultipartUploadCommand({
    Bucket: bucketName,
    Key: key,
    UploadId: uploadId,
  });
  
  await s3Client.send(abortCommand);
}

/**
 * Request interfaces
 */
interface InitiateMultipartRequest {
  fileName: string;
  contentType: string;
  fileSize: number;
  siteId: string;
  productId?: string;
  partSize?: number;
}

interface UploadPartRequest {
  sessionId: string;
  partNumber: number;
}

interface CompleteMultipartRequest {
  sessionId: string;
  parts: Array<{ partNumber: number; etag: string }>;
}

interface AbortMultipartRequest {
  sessionId: string;
}

interface ListPartsRequest {
  sessionId: string;
}

/**
 * Response interfaces
 */
interface InitiateMultipartResponse {
  sessionId: string;
  uploadId: string;
  key: string;
  partSize: number;
  totalParts: number;
  expiresIn: number;
}

interface UploadPartResponse {
  uploadUrl: string;
  partNumber: number;
  expiresIn: number;
}

interface CompleteMultipartResponse {
  publicUrl: string;
  key: string;
  location: string;
}

/**
 * Add CORS headers
 */
function addCorsHeaders(headers: Headers): void {
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    process.env.NEXT_PUBLIC_PRODUCTION_URL,
  ].filter(Boolean);

  if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push('http://localhost:3000', 'http://localhost:3001');
  }

  headers.set('Access-Control-Allow-Origin', allowedOrigins[0] || '*');
  headers.set('Access-Control-Allow-Methods', 'POST, GET, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400');
}

/**
 * Validate multipart upload request
 */
function validateMultipartRequest(data: unknown, requiredFields: string[]): {
  isValid: boolean;
  error?: string;
  data?: Record<string, unknown>;
} {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Invalid request body' };
  }

  const request = data as Record<string, unknown>;

  for (const field of requiredFields) {
    if (request[field] === undefined || request[field] === null) {
      return { isValid: false, error: `Missing required field: ${field}` };
    }
  }

  return { isValid: true, data: request };
}

/**
 * POST handler for multipart upload operations
 */
export async function POST(request: NextRequest): Promise<Response> {
  const responseHeaders = new Headers();
  addCorsHeaders(responseHeaders);

  try {
    // Check if storage is configured
    if (!isStorageConfigured()) {
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
    const rateLimitResult = rateLimiters.fileUpload(request);
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

    // Parse request body
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

    // Get action from query params or body
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || (requestBody as Record<string, unknown>)?.action;

    switch (action) {
      case 'initiate':
        return handleInitiateMultipart(requestBody, user.id, responseHeaders);
      case 'upload-part':
        return handleUploadPart(requestBody, responseHeaders);
      case 'complete':
        return handleCompleteMultipart(requestBody, responseHeaders);
      case 'abort':
        return handleAbortMultipart(requestBody, responseHeaders);
      case 'list-parts':
        return handleListParts(requestBody, responseHeaders);
      default:
        const response = apiError('Invalid action. Use: initiate, upload-part, complete, abort, or list-parts', 'INVALID_ACTION', 400);
        return new Response(response.body, {
          status: response.status,
          headers: { 
          ...Object.fromEntries(response.headers.entries()), 
          ...Object.fromEntries(responseHeaders.entries()) 
        },
        });
    }
  } catch (error) {
    const handled = handleError(error);
    console.error('Multipart upload error:', handled.message);

    const response = apiError('Multipart upload operation failed', 'MULTIPART_ERROR', 500);
    return new Response(response.body, {
      status: response.status,
      headers: { ...Object.fromEntries(response.headers), ...Object.fromEntries(responseHeaders) },
    });
  }
}

/**
 * Handle initiate multipart upload
 */
async function handleInitiateMultipart(
  requestBody: unknown,
  userId: string,
  responseHeaders: Headers
): Promise<Response> {
  const validation = validateMultipartRequest(requestBody, [
    'fileName', 'contentType', 'fileSize', 'siteId'
  ]);

  if (!validation.isValid) {
    const response = apiError(validation.error!, 'VALIDATION_ERROR', 400);
    return new Response(response.body, {
      status: response.status,
      headers: { ...Object.fromEntries(response.headers), ...Object.fromEntries(responseHeaders) },
    });
  }

  const data = validation.data as unknown as InitiateMultipartRequest;

  // Validate file size for multipart
  if (data.fileSize < MULTIPART_THRESHOLD) {
    const response = apiError(
      `File too small for multipart upload. Minimum size: ${MULTIPART_THRESHOLD / (1024 * 1024)}MB`,
      'FILE_TOO_SMALL',
      400
    );
    return new Response(response.body, {
      status: response.status,
      headers: { ...Object.fromEntries(response.headers), ...Object.fromEntries(responseHeaders) },
    });
  }

  if (data.fileSize > STORAGE_CONFIG.productImages.maxFileSize) {
    const response = apiError(
      `File too large. Maximum size: ${STORAGE_CONFIG.productImages.maxFileSize / (1024 * 1024)}MB`,
      'FILE_TOO_LARGE',
      400
    );
    return new Response(response.body, {
      status: response.status,
      headers: { ...Object.fromEntries(response.headers), ...Object.fromEntries(responseHeaders) },
    });
  }

  // Validate content type
  if (!STORAGE_CONFIG.productImages.allowedTypes.includes(data.contentType)) {
    const response = apiError(
      `Unsupported file type. Allowed types: ${STORAGE_CONFIG.productImages.allowedTypes.join(', ')}`,
      'UNSUPPORTED_TYPE',
      400
    );
    return new Response(response.body, {
      status: response.status,
      headers: { ...Object.fromEntries(response.headers), ...Object.fromEntries(responseHeaders) },
    });
  }

  // Generate file path
  const key = generateFilePath(data.fileName, data.siteId, 'images', data.productId);
  const bucketName = getBucketName();
  
  // Calculate part size and number of parts
  const partSize = data.partSize || DEFAULT_PART_SIZE;
  const totalParts = Math.ceil(data.fileSize / partSize);

  if (totalParts > MAX_PARTS) {
    const response = apiError(
      `File requires too many parts (${totalParts}). Maximum allowed: ${MAX_PARTS}`,
      'TOO_MANY_PARTS',
      400
    );
    return new Response(response.body, {
      status: response.status,
      headers: { ...Object.fromEntries(response.headers), ...Object.fromEntries(responseHeaders) },
    });
  }

  // Create multipart upload
  const createCommand = new CreateMultipartUploadCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: data.contentType,
    CacheControl: 'public, max-age=31536000, immutable',
    Metadata: {
      'original-name': data.fileName,
      'site-id': data.siteId,
      'user-id': userId,
      'upload-type': 'multipart',
      'uploaded-at': new Date().toISOString(),
      ...(data.productId && { 'product-id': data.productId }),
    },
    Tagging: new URLSearchParams({
      siteId: data.siteId,
      userId,
      uploadType: 'multipart',
      ...(data.productId && { productId: data.productId }),
    }).toString(),
  });

  const createResponse = await s3Client.send(createCommand);
  const uploadId = createResponse.UploadId!;

  // Create session
  const sessionId = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const session: UploadSession = {
    uploadId,
    key,
    fileName: data.fileName,
    contentType: data.contentType,
    fileSize: data.fileSize,
    siteId: data.siteId,
    userId,
    productId: data.productId,
    createdAt: Date.now(),
    partSize,
    completedParts: [],
  };

  uploadSessions.set(sessionId, session);

  const responseData: InitiateMultipartResponse = {
    sessionId,
    uploadId,
    key,
    partSize,
    totalParts,
    expiresIn: 24 * 60 * 60, // 24 hours
  };

  const response = apiSuccess(responseData);
  return new Response(response.body, {
    status: response.status,
    headers: { ...Object.fromEntries(response.headers), ...Object.fromEntries(responseHeaders) },
  });
}

/**
 * Handle upload part
 */
async function handleUploadPart(
  requestBody: unknown,
  responseHeaders: Headers
): Promise<Response> {
  const validation = validateMultipartRequest(requestBody, ['sessionId', 'partNumber']);
  if (!validation.isValid) {
    const response = apiError(validation.error!, 'VALIDATION_ERROR', 400);
    return new Response(response.body, {
      status: response.status,
      headers: { ...Object.fromEntries(response.headers), ...Object.fromEntries(responseHeaders) },
    });
  }

  const data = validation.data as unknown as UploadPartRequest;
  const session = uploadSessions.get(data.sessionId);

  if (!session) {
    const response = apiError('Upload session not found or expired', 'SESSION_NOT_FOUND', 404);
    return new Response(response.body, {
      status: response.status,
      headers: { ...Object.fromEntries(response.headers), ...Object.fromEntries(responseHeaders) },
    });
  }

  const bucketName = getBucketName();
  const expiresIn = 60 * 60; // 1 hour

  const uploadPartCommand = new UploadPartCommand({
    Bucket: bucketName,
    Key: session.key,
    UploadId: session.uploadId,
    PartNumber: data.partNumber,
  });

  const uploadUrl = await getSignedUrl(s3Client, uploadPartCommand, { expiresIn });

  const responseData: UploadPartResponse = {
    uploadUrl,
    partNumber: data.partNumber,
    expiresIn,
  };

  const response = apiSuccess(responseData);
  return new Response(response.body, {
    status: response.status,
    headers: { ...Object.fromEntries(response.headers), ...Object.fromEntries(responseHeaders) },
  });
}

/**
 * Handle complete multipart upload
 */
async function handleCompleteMultipart(
  requestBody: unknown,
  responseHeaders: Headers
): Promise<Response> {
  const validation = validateMultipartRequest(requestBody, ['sessionId', 'parts']);
  if (!validation.isValid) {
    const response = apiError(validation.error!, 'VALIDATION_ERROR', 400);
    return new Response(response.body, {
      status: response.status,
      headers: { ...Object.fromEntries(response.headers), ...Object.fromEntries(responseHeaders) },
    });
  }

  const data = validation.data as unknown as CompleteMultipartRequest;
  const session = uploadSessions.get(data.sessionId);

  if (!session) {
    const response = apiError('Upload session not found or expired', 'SESSION_NOT_FOUND', 404);
    return new Response(response.body, {
      status: response.status,
      headers: { ...Object.fromEntries(response.headers), ...Object.fromEntries(responseHeaders) },
    });
  }

  const bucketName = getBucketName();

  const completeCommand = new CompleteMultipartUploadCommand({
    Bucket: bucketName,
    Key: session.key,
    UploadId: session.uploadId,
    MultipartUpload: {
      Parts: data.parts.map(part => ({
        ETag: part.etag,
        PartNumber: part.partNumber,
      })),
    },
  });

  const completeResponse = await s3Client.send(completeCommand);

  // Clean up session
  uploadSessions.delete(data.sessionId);

  // Generate public URL (use relative URL to avoid path duplication)
  const publicUrl = `/api/images/${session.key}`;

  const responseData: CompleteMultipartResponse = {
    publicUrl,
    key: session.key,
    location: completeResponse.Location || publicUrl,
  };

  const response = apiSuccess(responseData);
  return new Response(response.body, {
    status: response.status,
    headers: { ...Object.fromEntries(response.headers), ...Object.fromEntries(responseHeaders) },
  });
}

/**
 * Handle abort multipart upload
 */
async function handleAbortMultipart(
  requestBody: unknown,
  responseHeaders: Headers
): Promise<Response> {
  const validation = validateMultipartRequest(requestBody, ['sessionId']);
  if (!validation.isValid) {
    const response = apiError(validation.error!, 'VALIDATION_ERROR', 400);
    return new Response(response.body, {
      status: response.status,
      headers: { ...Object.fromEntries(response.headers), ...Object.fromEntries(responseHeaders) },
    });
  }

  const data = validation.data as unknown as AbortMultipartRequest;
  const session = uploadSessions.get(data.sessionId);

  if (!session) {
    const response = apiError('Upload session not found or expired', 'SESSION_NOT_FOUND', 404);
    return new Response(response.body, {
      status: response.status,
      headers: { ...Object.fromEntries(response.headers), ...Object.fromEntries(responseHeaders) },
    });
  }

  await abortMultipartUpload(session.key, session.uploadId);
  uploadSessions.delete(data.sessionId);

  const response = apiSuccess({ message: 'Upload aborted successfully' });
  return new Response(response.body, {
    status: response.status,
    headers: { ...Object.fromEntries(response.headers), ...Object.fromEntries(responseHeaders) },
  });
}

/**
 * Handle list parts
 */
async function handleListParts(
  requestBody: unknown,
  responseHeaders: Headers
): Promise<Response> {
  const validation = validateMultipartRequest(requestBody, ['sessionId']);
  if (!validation.isValid) {
    const response = apiError(validation.error!, 'VALIDATION_ERROR', 400);
    return new Response(response.body, {
      status: response.status,
      headers: { ...Object.fromEntries(response.headers), ...Object.fromEntries(responseHeaders) },
    });
  }

  const data = validation.data as unknown as ListPartsRequest;
  const session = uploadSessions.get(data.sessionId);

  if (!session) {
    const response = apiError('Upload session not found or expired', 'SESSION_NOT_FOUND', 404);
    return new Response(response.body, {
      status: response.status,
      headers: { ...Object.fromEntries(response.headers), ...Object.fromEntries(responseHeaders) },
    });
  }

  const bucketName = getBucketName();

  const listCommand = new ListPartsCommand({
    Bucket: bucketName,
    Key: session.key,
    UploadId: session.uploadId,
  });

  const listResponse = await s3Client.send(listCommand);

  const responseData = {
    sessionId: data.sessionId,
    uploadId: session.uploadId,
    parts: listResponse.Parts?.map(part => ({
      partNumber: part.PartNumber,
      etag: part.ETag,
      size: part.Size,
      lastModified: part.LastModified,
    })) || [],
    totalParts: Math.ceil(session.fileSize / session.partSize),
  };

  const response = apiSuccess(responseData);
  return new Response(response.body, {
    status: response.status,
    headers: { ...Object.fromEntries(response.headers), ...Object.fromEntries(responseHeaders) },
  });
}

/**
 * GET handler for listing active sessions (for debugging)
 */
export async function GET(): Promise<Response> {
  const responseHeaders = new Headers();
  addCorsHeaders(responseHeaders);

  try {
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

    // Return user's active sessions (without sensitive data)
    const userSessions: Array<{
      sessionId: string;
      fileName: string;
      fileSize: number;
      siteId: string;
      productId?: string;
      createdAt: number;
      completedParts: number;
      totalParts: number;
    }> = [];
    
    uploadSessions.forEach((session, sessionId) => {
      if (session.userId === user.id) {
        userSessions.push({
          sessionId,
          fileName: session.fileName,
          fileSize: session.fileSize,
          siteId: session.siteId,
          productId: session.productId,
          createdAt: session.createdAt,
          completedParts: session.completedParts.length,
          totalParts: Math.ceil(session.fileSize / session.partSize),
        });
      }
    });

    const response = apiSuccess({ sessions: userSessions });
    return new Response(response.body, {
      status: response.status,
      headers: { ...Object.fromEntries(response.headers), ...Object.fromEntries(responseHeaders) },
    });
  } catch (error) {
    const handled = handleError(error);
    const response = apiError('Failed to list sessions', 'LIST_SESSIONS_ERROR', 500);
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