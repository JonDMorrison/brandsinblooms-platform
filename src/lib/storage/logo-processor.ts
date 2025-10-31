/**
 * Logo Processor
 *
 * Downloads logos from external URLs and uploads them to S3 storage.
 * Used during AI site generation to automatically process scraped logos.
 */

import { handleError } from '../types/error-handling';
import { getPresignedUploadUrl } from './s3-upload';
import { generateFilePath } from './index';

/**
 * Supported image MIME types for logos
 */
const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/svg+xml',
  'image/webp',
  'image/gif',
  'image/x-icon',
  'image/vnd.microsoft.icon',
] as const;

/**
 * Maximum file size for logo downloads (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Download timeout in milliseconds (30 seconds)
 */
const DOWNLOAD_TIMEOUT = 30000;

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
  'image/svg+xml': [
    new Uint8Array([0x3C, 0x73, 0x76, 0x67]), // <svg
    new Uint8Array([0x3C, 0x3F, 0x78, 0x6D, 0x6C]), // <?xml
  ],
  'image/x-icon': [
    new Uint8Array([0x00, 0x00, 0x01, 0x00]), // ICO
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
      console.warn(`[LogoProcessor] Rejected non-HTTP(S) URL: ${url}`);
      return false;
    }

    // Reject localhost and private IPs
    const hostname = parsed.hostname.toLowerCase();

    // Check for localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      console.warn(`[LogoProcessor] Rejected localhost URL: ${url}`);
      return false;
    }

    // Check for private IP ranges (basic check)
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipPattern.test(hostname)) {
      const parts = hostname.split('.').map(Number);
      // 10.0.0.0/8
      if (parts[0] === 10) {
        console.warn(`[LogoProcessor] Rejected private IP (10.x): ${url}`);
        return false;
      }
      // 172.16.0.0/12
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
        console.warn(`[LogoProcessor] Rejected private IP (172.16-31.x): ${url}`);
        return false;
      }
      // 192.168.0.0/16
      if (parts[0] === 192 && parts[1] === 168) {
        console.warn(`[LogoProcessor] Rejected private IP (192.168.x): ${url}`);
        return false;
      }
      // 169.254.0.0/16 (link-local)
      if (parts[0] === 169 && parts[1] === 254) {
        console.warn(`[LogoProcessor] Rejected link-local IP: ${url}`);
        return false;
      }
    }

    return true;
  } catch {
    console.warn(`[LogoProcessor] Invalid URL: ${url}`);
    return false;
  }
}

/**
 * Detects image type from buffer using magic bytes
 */
function detectImageType(buffer: ArrayBuffer): string | null {
  const bytes = new Uint8Array(buffer);

  for (const [mimeType, signatures] of Object.entries(MAGIC_BYTES)) {
    for (const signature of signatures) {
      if (bytes.length >= signature.length) {
        let match = true;
        for (let i = 0; i < signature.length; i++) {
          if (bytes[i] !== signature[i]) {
            match = false;
            break;
          }
        }
        if (match) {
          // Special case for WebP (needs additional check)
          if (mimeType === 'image/webp') {
            // Check for WEBP signature at offset 8
            if (bytes.length >= 12) {
              const webpSig = new Uint8Array([0x57, 0x45, 0x42, 0x50]); // WEBP
              let isWebP = true;
              for (let i = 0; i < webpSig.length; i++) {
                if (bytes[8 + i] !== webpSig[i]) {
                  isWebP = false;
                  break;
                }
              }
              if (isWebP) return mimeType;
            }
            continue; // Not WebP, check next
          }
          return mimeType;
        }
      }
    }
  }

  return null;
}

/**
 * Gets file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExtension: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/svg+xml': 'svg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/x-icon': 'ico',
    'image/vnd.microsoft.icon': 'ico',
  };

  return mimeToExtension[mimeType] || 'png';
}

/**
 * Downloads an image from a URL with timeout and validation
 */
async function downloadImage(url: string): Promise<{
  buffer: ArrayBuffer;
  contentType: string;
  fileName: string;
} | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT);

  try {
    console.log(`[LogoProcessor] Downloading from: ${url}`);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'BrandsInBloomsPlatform/1.0 (Logo Processor)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[LogoProcessor] Download failed with status ${response.status}`);
      return null;
    }

    // Check content-type header
    const contentType = response.headers.get('content-type')?.toLowerCase().split(';')[0] || '';

    // Get content length if available
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_FILE_SIZE) {
      console.error(`[LogoProcessor] File too large: ${contentLength} bytes`);
      return null;
    }

    // Download the image
    const buffer = await response.arrayBuffer();

    // Validate size
    if (buffer.byteLength > MAX_FILE_SIZE) {
      console.error(`[LogoProcessor] Downloaded file too large: ${buffer.byteLength} bytes`);
      return null;
    }

    if (buffer.byteLength === 0) {
      console.error(`[LogoProcessor] Downloaded file is empty`);
      return null;
    }

    // Detect actual image type from magic bytes
    const detectedType = detectImageType(buffer);
    if (!detectedType) {
      console.error(`[LogoProcessor] Could not detect image type from file content`);
      return null;
    }

    // Use detected type if content-type is missing or generic
    const finalContentType = SUPPORTED_IMAGE_TYPES.includes(contentType as any)
      ? contentType
      : detectedType;

    if (!SUPPORTED_IMAGE_TYPES.includes(finalContentType as any)) {
      console.error(`[LogoProcessor] Unsupported image type: ${finalContentType}`);
      return null;
    }

    // Generate filename from URL or use default
    let fileName = 'logo';
    try {
      const urlPath = new URL(url).pathname;
      const segments = urlPath.split('/');
      const lastSegment = segments[segments.length - 1];
      if (lastSegment && lastSegment.includes('.')) {
        fileName = lastSegment.split('.')[0] || 'logo';
        // Sanitize filename
        fileName = fileName.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50);
      }
    } catch {
      // Ignore URL parsing errors for filename
    }

    fileName = `${fileName}.${getExtensionFromMimeType(finalContentType)}`;

    console.log(`[LogoProcessor] Downloaded ${buffer.byteLength} bytes, type: ${finalContentType}`);

    return {
      buffer,
      contentType: finalContentType,
      fileName,
    };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    const errorInfo = handleError(error);

    if (errorInfo.message.includes('abort')) {
      console.error(`[LogoProcessor] Download timeout after ${DOWNLOAD_TIMEOUT}ms`);
    } else {
      console.error(`[LogoProcessor] Download error: ${errorInfo.message}`);
    }

    return null;
  }
}

/**
 * Uploads an image buffer to S3 using presigned URL
 */
async function uploadToS3(
  buffer: ArrayBuffer,
  contentType: string,
  fileName: string,
  siteId: string,
  userId: string
): Promise<string | null> {
  try {
    console.log(`[LogoProcessor] Uploading ${fileName} to S3...`);

    // Generate file path
    const filePath = generateFilePath(fileName, siteId, 'logos');

    // Get presigned URL
    const presignedResult = await getPresignedUploadUrl({
      key: filePath,
      fileName: filePath,
      siteId,
      contentType,
      contentLength: buffer.byteLength,
      metadata: {
        'original-source': 'ai-generation',
        'processor': 'logo-processor',
        'user-id': userId,
      },
    });

    if (!presignedResult.success || !presignedResult.data) {
      console.error(`[LogoProcessor] Failed to get presigned URL: ${presignedResult.error}`);
      return null;
    }

    // Upload directly to S3 using the presigned URL
    const uploadResponse = await fetch(presignedResult.data.uploadUrl, {
      method: 'PUT',
      body: buffer,
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.byteLength.toString(),
      },
    });

    if (!uploadResponse.ok) {
      console.error(`[LogoProcessor] S3 upload failed with status ${uploadResponse.status}`);
      return null;
    }

    // Return the public URL
    const publicUrl = presignedResult.data.url;
    console.log(`[LogoProcessor] Upload successful: ${publicUrl}`);

    return publicUrl;
  } catch (error: unknown) {
    const errorInfo = handleError(error);
    console.error(`[LogoProcessor] Upload error: ${errorInfo.message}`);
    return null;
  }
}

/**
 * Main function to download and upload a logo
 *
 * @param externalUrl - External URL of the logo to download
 * @param siteId - Site ID for organizing the upload
 * @param userId - User ID for tracking
 * @returns Internal URL of the uploaded logo, or null if failed
 */
export async function downloadAndUploadLogo(
  externalUrl: string,
  siteId: string,
  userId: string
): Promise<string | null> {
  try {
    // Validate URL safety
    if (!isUrlSafe(externalUrl)) {
      console.error(`[LogoProcessor] Unsafe URL rejected: ${externalUrl}`);
      return null;
    }

    // Download the image
    const downloadResult = await downloadImage(externalUrl);
    if (!downloadResult) {
      console.error(`[LogoProcessor] Failed to download logo from: ${externalUrl}`);
      return null;
    }

    // Upload to S3
    const uploadedUrl = await uploadToS3(
      downloadResult.buffer,
      downloadResult.contentType,
      downloadResult.fileName,
      siteId,
      userId
    );

    if (!uploadedUrl) {
      console.error(`[LogoProcessor] Failed to upload logo to S3`);
      return null;
    }

    console.log(`[LogoProcessor] Successfully processed logo: ${externalUrl} -> ${uploadedUrl}`);
    return uploadedUrl;

  } catch (error: unknown) {
    const errorInfo = handleError(error);
    console.error(`[LogoProcessor] Unexpected error: ${errorInfo.message}`);
    return null;
  }
}

/**
 * Batch process multiple logos (useful for future enhancements)
 */
export async function batchProcessLogos(
  logos: Array<{ url: string; siteId: string }>,
  userId: string
): Promise<Array<{ original: string; processed: string | null }>> {
  const results = await Promise.all(
    logos.map(async ({ url, siteId }) => {
      const processed = await downloadAndUploadLogo(url, siteId, userId);
      return { original: url, processed };
    })
  );

  return results;
}