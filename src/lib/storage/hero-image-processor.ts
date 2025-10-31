/**
 * Hero Image Processor
 *
 * Downloads hero/background images from external URLs and uploads them to S3 storage.
 * Used during AI site generation to automatically process scraped hero images.
 *
 * Similar to logo-processor.ts but optimized for larger hero/background images.
 */

import { handleError } from '../types/error-handling';
import { getPresignedUploadUrl } from './s3-upload';
import { generateFilePath } from './index';

/**
 * Supported image MIME types for hero images
 * Note: Excluding SVG and ICO as they're not suitable for hero backgrounds
 */
const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

/**
 * Maximum file size for hero image downloads (10MB)
 * Larger than logos since hero images are typically full-width backgrounds
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Download timeout in milliseconds (30 seconds)
 */
const DOWNLOAD_TIMEOUT = 30000;

/**
 * Minimum dimensions for hero images
 * Ensures image is large enough for full-width hero sections
 */
const MIN_WIDTH = 800;
const MIN_HEIGHT = 400;

/**
 * Magic byte signatures for common image formats
 * Used to verify file type beyond just content-type header
 */
const MAGIC_BYTES: Record<string, Uint8Array[]> = {
  'image/jpeg': [
    new Uint8Array([0xFF, 0xD8, 0xFF]), // JPEG
  ],
  'image/png': [
    new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), // PNG
  ],
  'image/gif': [
    new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]), // GIF87a
    new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]), // GIF89a
  ],
  'image/webp': [
    new Uint8Array([0x52, 0x49, 0x46, 0x46]), // RIFF (WebP starts with RIFF)
  ],
};

/**
 * Validates URL safety (prevents SSRF attacks)
 */
function isUrlSafe(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Only allow HTTP(S) protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      console.warn(`[HeroImageProcessor] Rejected non-HTTP(S) URL: ${url}`);
      return false;
    }

    // Reject localhost and private IPs
    const hostname = parsed.hostname.toLowerCase();

    // Check for localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      console.warn(`[HeroImageProcessor] Rejected localhost URL: ${url}`);
      return false;
    }

    // Check for private IP ranges (basic check)
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipPattern.test(hostname)) {
      const parts = hostname.split('.').map(Number);
      // 10.0.0.0/8
      if (parts[0] === 10) {
        console.warn(`[HeroImageProcessor] Rejected private IP (10.x): ${url}`);
        return false;
      }
      // 172.16.0.0/12
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
        console.warn(`[HeroImageProcessor] Rejected private IP (172.16-31.x): ${url}`);
        return false;
      }
      // 192.168.0.0/16
      if (parts[0] === 192 && parts[1] === 168) {
        console.warn(`[HeroImageProcessor] Rejected private IP (192.168.x): ${url}`);
        return false;
      }
    }

    return true;
  } catch (error: unknown) {
    console.error(`[HeroImageProcessor] URL validation error: ${handleError(error).message}`);
    return false;
  }
}

/**
 * Detects image MIME type from magic bytes
 */
function detectImageType(buffer: Buffer): string | null {
  for (const [mimeType, signatures] of Object.entries(MAGIC_BYTES)) {
    for (const signature of signatures) {
      const bufferStart = buffer.subarray(0, signature.length);
      if (bufferStart.every((byte, i) => byte === signature[i])) {
        return mimeType;
      }
    }
  }
  return null;
}

/**
 * Gets file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return extensions[mimeType] || 'jpg';
}

/**
 * Downloads an image from a URL with security validation
 *
 * @param url - URL of the image to download
 * @returns Object containing buffer, contentType, and fileName
 * @throws Error if download fails or image is invalid
 */
async function downloadImage(
  url: string
): Promise<{ buffer: Buffer; contentType: string; fileName: string }> {
  // Validate URL safety
  if (!isUrlSafe(url)) {
    console.error(`[HERO IMAGE DOWNLOAD] ❌ URL failed safety validation: ${url}`);
    throw new Error('URL failed safety validation');
  }

  console.log(`[HeroImageProcessor] Downloading from: ${url}`);

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'BrandsInBlooms/1.0 (Site Generator Bot)',
      },
    });

    if (!response.ok) {
      console.error(`[HERO IMAGE DOWNLOAD] ❌ HTTP error: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Check content-length before downloading
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_FILE_SIZE) {
      console.error(`[HERO IMAGE DOWNLOAD] ❌ Image too large: ${contentLength} bytes (max ${MAX_FILE_SIZE})`);
      throw new Error(`Image too large: ${contentLength} bytes (max ${MAX_FILE_SIZE})`);
    }

    // Get content type
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Download the image
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Verify size after download (in case content-length was wrong)
    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error(`Image too large: ${buffer.length} bytes (max ${MAX_FILE_SIZE})`);
    }

    // Detect actual image type from magic bytes
    const detectedType = detectImageType(buffer);
    const finalContentType = detectedType || contentType;

    // Validate it's a supported image type
    if (!SUPPORTED_IMAGE_TYPES.includes(finalContentType as typeof SUPPORTED_IMAGE_TYPES[number])) {
      console.error(`[HERO IMAGE DOWNLOAD] ❌ Unsupported image type: ${finalContentType}`);
      console.error(`[HERO IMAGE DOWNLOAD]    Supported types: ${SUPPORTED_IMAGE_TYPES.join(', ')}`);
      throw new Error(`Unsupported image type: ${finalContentType}`);
    }

    console.log(
      `[HeroImageProcessor] Downloaded ${buffer.length} bytes, type: ${finalContentType}`
    );

    // Extract filename from URL
    let fileName = 'hero';
    try {
      const urlPath = new URL(url).pathname;
      const segments = urlPath.split('/');
      const lastSegment = segments[segments.length - 1];
      if (lastSegment && lastSegment.includes('.')) {
        fileName = lastSegment.split('.')[0] || 'hero';
        // Sanitize filename: remove non-alphanumeric characters, limit length
        fileName = fileName.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50);
      }
    } catch {
      // Use default 'hero' name if URL parsing fails
    }

    // Add proper extension
    fileName = `${fileName}.${getExtensionFromMimeType(finalContentType)}`;

    return {
      buffer,
      contentType: finalContentType,
      fileName,
    };
  } catch (error: unknown) {
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error(`[HERO IMAGE DOWNLOAD] ❌ Download timeout after ${DOWNLOAD_TIMEOUT}ms`);
        throw new Error(`Download timeout after ${DOWNLOAD_TIMEOUT}ms`);
      }
    }
    // Re-throw other errors (they'll be logged by the caller)
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Uploads image buffer to S3 using presigned URL
 *
 * @param buffer - Image data as Buffer
 * @param contentType - MIME type of the image
 * @param filePath - S3 file path (key)
 * @param siteId - Site ID for presigned URL request
 * @param userId - User ID for metadata
 * @returns Public URL of the uploaded image
 */
async function uploadToS3(
  buffer: Buffer,
  contentType: string,
  filePath: string,
  siteId: string,
  userId: string
): Promise<string> {
  console.log(`[HeroImageProcessor] Getting presigned URL for: ${filePath}`);

  // Get presigned URL from our API
  const presignedResult = await getPresignedUploadUrl({
    key: filePath,
    fileName: filePath,
    contentType,
    contentLength: buffer.length,
    siteId,
    metadata: {
      'original-source': 'ai-generation-hero',
      'processor': 'hero-image-processor',
      'user-id': userId,
    },
  });

  if (!presignedResult.success || !presignedResult.data) {
    throw new Error('Failed to get presigned upload URL');
  }

  console.log(`[HeroImageProcessor] Uploading to S3...`);

  // Upload to S3 using presigned URL
  const uploadResponse = await fetch(presignedResult.data.uploadUrl, {
    method: 'PUT',
    body: buffer,
    headers: {
      'Content-Type': contentType,
      'Content-Length': buffer.length.toString(),
    },
  });

  if (!uploadResponse.ok) {
    throw new Error(
      `S3 upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`
    );
  }

  // Return the public URL
  const publicUrl = presignedResult.data.url;
  console.log(`[HeroImageProcessor] Upload successful: ${publicUrl}`);

  return publicUrl;
}

/**
 * Downloads a hero image from URL and uploads it to S3 storage
 *
 * Main entry point for hero image processing during site generation.
 *
 * @param url - URL of the hero image to process
 * @param siteId - Site ID (or temp job ID) for file path generation
 * @param userId - User ID for metadata and security
 * @param options - Optional configuration
 * @returns Public URL of the uploaded image, or null if processing fails
 *
 * @example
 * ```typescript
 * const heroUrl = await downloadAndUploadHeroImage(
 *   'https://example.com/hero-background.jpg',
 *   'temp-job-abc123',
 *   'user-xyz'
 * );
 * ```
 */
export async function downloadAndUploadHeroImage(
  url: string,
  siteId: string,
  userId: string,
  options?: {
    minWidth?: number;
    minHeight?: number;
    maxFileSize?: number;
  }
): Promise<string | null> {
  console.log(`[HERO IMAGE DOWNLOAD] Starting download and upload process...`);
  console.log(`[HERO IMAGE DOWNLOAD] Source URL: ${url}`);
  console.log(`[HERO IMAGE DOWNLOAD] Site ID: ${siteId}`);

  try {
    // Use provided options or defaults
    const minWidth = options?.minWidth ?? MIN_WIDTH;
    const minHeight = options?.minHeight ?? MIN_HEIGHT;

    console.log(`[HERO IMAGE DOWNLOAD] Downloading image from source...`);
    // Download the image
    const { buffer, contentType, fileName } = await downloadImage(url);
    console.log(`[HERO IMAGE DOWNLOAD] ✅ Download successful`);
    console.log(`[HERO IMAGE DOWNLOAD]    File: ${fileName}`);
    console.log(`[HERO IMAGE DOWNLOAD]    Type: ${contentType}`);
    console.log(`[HERO IMAGE DOWNLOAD]    Size: ${(buffer.length / 1024).toFixed(2)} KB`);

    // Note: We can't easily validate dimensions without a library like sharp
    // For now, we trust the LLM to provide appropriately sized images
    // TODO: Consider adding dimension validation with sharp if needed

    // Generate S3 file path: {siteId}/hero-images/{fileName}
    const filePath = generateFilePath(fileName, siteId, 'hero-images');
    console.log(`[HERO IMAGE DOWNLOAD] Uploading to S3: ${filePath}`);

    // Upload to S3
    const publicUrl = await uploadToS3(buffer, contentType, filePath, siteId, userId);
    console.log(`[HERO IMAGE DOWNLOAD] ✅ Upload successful: ${publicUrl}`);

    return publicUrl;
  } catch (error: unknown) {
    const errorInfo = handleError(error);
    console.error(`[HERO IMAGE DOWNLOAD] ❌ Failed to process hero image`);
    console.error(`[HERO IMAGE DOWNLOAD]    Source URL: ${url}`);
    console.error(`[HERO IMAGE DOWNLOAD]    Error: ${errorInfo.message}`);
    // Return null instead of throwing - allows site generation to continue
    return null;
  }
}

/**
 * Batch processes multiple hero images in parallel
 *
 * @param images - Array of image URLs with associated site IDs
 * @param userId - User ID for metadata
 * @returns Array of results with original URL and processed URL (or null if failed)
 */
export async function batchProcessHeroImages(
  images: Array<{ url: string; siteId: string }>,
  userId: string
): Promise<Array<{ original: string; processed: string | null }>> {
  const results = await Promise.all(
    images.map(async ({ url, siteId }) => {
      const processed = await downloadAndUploadHeroImage(url, siteId, userId);
      return { original: url, processed };
    })
  );

  return results;
}
