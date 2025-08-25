/**
 * Image serving API route
 * Serves images from S3/CDN with proper caching headers and streaming
 */

import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, getBucketName, getCdnUrl, isStorageConfigured } from '@/lib/storage/s3-client';
import { apiError } from '@/lib/types/api';
import { handleError } from '@/lib/types/error-handling';

/**
 * Supported image formats and their MIME types
 */
const IMAGE_MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
};

/**
 * Get MIME type from file extension
 */
function getMimeType(path: string): string {
  const extension = path.toLowerCase().split('.').pop();
  return extension ? IMAGE_MIME_TYPES[extension] || 'application/octet-stream' : 'application/octet-stream';
}

/**
 * Generate ETag from file path and last modified time
 */
function generateETag(path: string, lastModified?: Date): string {
  const pathHash = Buffer.from(path).toString('base64').substring(0, 8);
  const timeHash = lastModified ? lastModified.getTime().toString(36) : Date.now().toString(36);
  return `"${pathHash}-${timeHash}"`;
}

/**
 * Check if the request is conditional and return 304 if not modified
 */
function checkConditionalRequest(
  request: NextRequest,
  etag: string,
  lastModified?: Date
): NextResponse | null {
  const ifNoneMatch = request.headers.get('if-none-match');
  const ifModifiedSince = request.headers.get('if-modified-since');

  // Check ETag
  if (ifNoneMatch) {
    if (ifNoneMatch === etag || ifNoneMatch === '*') {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'public, max-age=31536000, immutable',
          ...(lastModified && { 'Last-Modified': lastModified.toUTCString() }),
        },
      });
    }
  }

  // Check Last-Modified
  if (ifModifiedSince && lastModified) {
    const ifModifiedSinceDate = new Date(ifModifiedSince);
    if (lastModified <= ifModifiedSinceDate) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Last-Modified': lastModified.toUTCString(),
        },
      });
    }
  }

  return null;
}

/**
 * GET handler for image serving
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  try {
    // Check if storage is configured
    if (!isStorageConfigured()) {
      console.error('Storage not configured for image serving');
      return apiError('Storage service unavailable', 'STORAGE_NOT_CONFIGURED', 503);
    }

    // Extract and validate path
    const { path: pathArray } = await params;
    if (!pathArray || pathArray.length === 0) {
      return apiError('Invalid image path', 'INVALID_PATH', 400);
    }

    const imagePath = pathArray.join('/');
    
    // Basic path validation (prevent directory traversal)
    if (imagePath.includes('..') || imagePath.includes('//') || imagePath.startsWith('/')) {
      return apiError('Invalid image path', 'INVALID_PATH', 400);
    }

    // Validate file extension
    const extension = imagePath.toLowerCase().split('.').pop();
    if (!extension || !IMAGE_MIME_TYPES[extension]) {
      return apiError('Unsupported image format', 'UNSUPPORTED_FORMAT', 400);
    }

    const bucketName = getBucketName();
    const mimeType = getMimeType(imagePath);

    // Try to get object metadata first
    let objectMetadata;
    try {
      const headCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: imagePath,
      });
      
      const headResponse = await s3Client.send(headCommand);
      objectMetadata = headResponse;
    } catch (error) {
      const handled = handleError(error);
      if (handled.message.includes('NoSuchKey') || handled.message.includes('NotFound')) {
        return apiError('Image not found', 'NOT_FOUND', 404);
      }
      throw error; // Re-throw other errors
    }

    // Generate ETag
    const etag = generateETag(imagePath, objectMetadata.LastModified);

    // Check conditional requests (304 Not Modified)
    const conditionalResponse = checkConditionalRequest(request, etag, objectMetadata.LastModified);
    if (conditionalResponse) {
      return conditionalResponse;
    }

    // Get the object data
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: imagePath,
    });

    const response = await s3Client.send(getCommand);
    
    if (!response.Body) {
      return apiError('Image data not available', 'NO_DATA', 404);
    }

    // Convert the stream to a ReadableStream for the Response
    const stream = response.Body as ReadableStream;

    // Prepare response headers
    const responseHeaders = new Headers({
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'ETag': etag,
      'X-Content-Source': 'S3',
    });

    // Add optional headers if available
    if (response.ContentLength) {
      responseHeaders.set('Content-Length', response.ContentLength.toString());
    }
    
    if (objectMetadata.LastModified) {
      responseHeaders.set('Last-Modified', objectMetadata.LastModified.toUTCString());
    }

    // Add CORS headers for image serving
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, If-None-Match, If-Modified-Since');
    responseHeaders.set('Access-Control-Expose-Headers', 'ETag, Last-Modified, Content-Length');

    return new NextResponse(stream, {
      status: 200,
      headers: responseHeaders,
    });

  } catch (error) {
    const handled = handleError(error);
    const { path } = await params;
    console.error('Image serving error:', {
      path: path?.join('/'),
      error: handled.message,
      details: handled.details,
    });

    return apiError(
      'Failed to serve image',
      'IMAGE_SERVE_ERROR',
      500
    );
  }
}

/**
 * HEAD handler for image metadata
 */
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  try {
    // Check if storage is configured
    if (!isStorageConfigured()) {
      return new NextResponse(null, { status: 503 });
    }

    // Extract and validate path
    const { path: pathArray } = await params;
    if (!pathArray || pathArray.length === 0) {
      return new NextResponse(null, { status: 400 });
    }

    const imagePath = pathArray.join('/');
    
    // Basic path validation
    if (imagePath.includes('..') || imagePath.includes('//') || imagePath.startsWith('/')) {
      return new NextResponse(null, { status: 400 });
    }

    // Validate file extension
    const extension = imagePath.toLowerCase().split('.').pop();
    if (!extension || !IMAGE_MIME_TYPES[extension]) {
      return new NextResponse(null, { status: 400 });
    }

    const bucketName = getBucketName();
    const mimeType = getMimeType(imagePath);

    // Get object metadata
    const headCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: imagePath,
    });

    const response = await s3Client.send(headCommand);

    // Generate ETag
    const etag = generateETag(imagePath, response.LastModified);

    // Check conditional requests
    const conditionalResponse = checkConditionalRequest(request, etag, response.LastModified);
    if (conditionalResponse) {
      return conditionalResponse;
    }

    // Prepare response headers
    const responseHeaders = new Headers({
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'ETag': etag,
    });

    if (response.ContentLength) {
      responseHeaders.set('Content-Length', response.ContentLength.toString());
    }
    
    if (response.LastModified) {
      responseHeaders.set('Last-Modified', response.LastModified.toUTCString());
    }

    // Add CORS headers
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, If-None-Match, If-Modified-Since');

    return new NextResponse(null, {
      status: 200,
      headers: responseHeaders,
    });

  } catch (error) {
    const handled = handleError(error);
    if (handled.message.includes('NoSuchKey') || handled.message.includes('NotFound')) {
      return new NextResponse(null, { status: 404 });
    }

    console.error('Image HEAD request error:', handled.message);
    return new NextResponse(null, { status: 500 });
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, If-None-Match, If-Modified-Since',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}