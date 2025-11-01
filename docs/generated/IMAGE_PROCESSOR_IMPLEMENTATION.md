# Image Processor Implementation Guide

This document provides production-ready code patterns for implementing comprehensive image extraction and processing.

---

## 1. Unified Image Processor (`src/lib/storage/image-processor.ts`)

This replaces the need for separate logo-processor and hero-image-processor, though those can remain for backwards compatibility.

### Core Type Definitions

```typescript
export type ImageType = 'hero' | 'gallery' | 'product' | 'feature' | 'team' | 'logo' | 'other';
export type ImageContext = 'background-image' | 'css-variable' | 'img-tag' | 'picture-element' | 'data-attribute' | 'manual';
export type ProcessingStatus = 'pending' | 'processing' | 'uploaded' | 'failed' | 'skipped';

export interface ImageValidationConfig {
  /** Maximum file size in bytes */
  maxFileSize: number;
  /** Minimum width in pixels (optional) */
  minWidth?: number;
  /** Minimum height in pixels (optional) */
  minHeight?: number;
  /** Supported MIME types */
  supportedMimeTypes: readonly string[];
}

export interface ExtractedImageData {
  /** Full absolute URL of the image */
  url: string;
  /** Image type/purpose */
  type: ImageType;
  /** How the image was found in the HTML */
  context: ImageContext;
  /** CSS selector or element description */
  selector: string;
  /** Alt text if available */
  alt?: string;
  /** Image dimensions if detected */
  dimensions?: {
    width: number;
    height: number;
  };
  /** Extraction confidence (0-1) */
  confidence: number;
}

export interface ProcessedImage extends ExtractedImageData {
  /** Internal URL after upload */
  uploadedUrl: string;
  /** Sanitized filename used in storage */
  fileName: string;
  /** Detected MIME type */
  mimeType: string;
  /** File size in bytes */
  fileSize: number;
  /** When processing completed */
  processedAt: Date;
}

export interface ImageProcessingResult {
  success: boolean;
  image?: ProcessedImage;
  error?: string;
  errorCode?: 'URL_UNSAFE' | 'DOWNLOAD_FAILED' | 'TYPE_UNSUPPORTED' | 'FILE_TOO_LARGE' | 'VALIDATION_FAILED' | 'UPLOAD_FAILED' | 'INVALID_INPUT';
}

export interface BatchProcessingResult {
  processed: ProcessedImage[];
  failed: Array<{
    original: ExtractedImageData;
    error: string;
    errorCode: ImageProcessingResult['errorCode'];
  }>;
  stats: {
    total: number;
    success: number;
    failed: number;
    skipped: number;
    totalSize: number;
  };
}
```

### Type-Specific Configurations

```typescript
export const IMAGE_TYPE_CONFIGS: Record<ImageType, ImageValidationConfig> = {
  hero: {
    maxFileSize: 10 * 1024 * 1024,  // 10MB
    minWidth: 800,
    minHeight: 400,
    supportedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp'
    ]
  },
  product: {
    maxFileSize: 5 * 1024 * 1024,   // 5MB
    minWidth: 200,
    minHeight: 200,
    supportedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp'
    ]
  },
  gallery: {
    maxFileSize: 5 * 1024 * 1024,   // 5MB
    minWidth: 150,
    minHeight: 150,
    supportedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp'
    ]
  },
  feature: {
    maxFileSize: 5 * 1024 * 1024,   // 5MB
    minWidth: 150,
    minHeight: 150,
    supportedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp'
    ]
  },
  team: {
    maxFileSize: 3 * 1024 * 1024,   // 3MB
    minWidth: 100,
    minHeight: 100,
    supportedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp'
    ]
  },
  logo: {
    maxFileSize: 5 * 1024 * 1024,   // 5MB
    supportedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/svg+xml',
      'image/webp',
      'image/gif',
      'image/x-icon',
      'image/vnd.microsoft.icon'
    ]
  },
  other: {
    maxFileSize: 5 * 1024 * 1024,   // 5MB
    supportedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif'
    ]
  }
};

export const MAGIC_BYTES: Record<string, Uint8Array[]> = {
  'image/jpeg': [new Uint8Array([0xFF, 0xD8, 0xFF])],
  'image/png': [new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])],
  'image/gif': [
    new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]), // GIF87a
    new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])  // GIF89a
  ],
  'image/webp': [new Uint8Array([0x52, 0x49, 0x46, 0x46])], // RIFF
  'image/svg+xml': [
    new Uint8Array([0x3C, 0x73, 0x76, 0x67]),             // <svg
    new Uint8Array([0x3C, 0x3F, 0x78, 0x6D, 0x6C])        // <?xml
  ],
  'image/x-icon': [new Uint8Array([0x00, 0x00, 0x01, 0x00])] // ICO
};

const DOWNLOAD_TIMEOUT = 30000;  // 30 seconds
```

### Helper Functions

```typescript
import { handleError } from '@/lib/types/error-handling';
import { getPresignedUploadUrl } from './s3-upload';
import { generateFilePath } from './index';

/**
 * Validates URL safety (SSRF prevention)
 */
function isUrlSafe(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Only allow HTTPS (require for security)
    if (parsed.protocol !== 'https:') {
      console.warn(`[ImageProcessor] Rejected non-HTTPS URL: ${url}`);
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Reject localhost and loopback
    if (/^(localhost|127\.0\.0\.\d|::1)$/i.test(hostname)) {
      console.warn(`[ImageProcessor] Rejected localhost URL: ${url}`);
      return false;
    }

    // Reject private IP ranges
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/.test(hostname)) {
      console.warn(`[ImageProcessor] Rejected private IP URL: ${url}`);
      return false;
    }

    return true;
  } catch (error: unknown) {
    console.warn(`[ImageProcessor] Invalid URL: ${url}`);
    return false;
  }
}

/**
 * Detects MIME type from magic bytes
 */
function detectImageType(buffer: Uint8Array): string | null {
  for (const [mimeType, signatures] of Object.entries(MAGIC_BYTES)) {
    for (const signature of signatures) {
      if (buffer.length >= signature.length) {
        const match = Array.from(signature).every(
          (byte, i) => buffer[i] === byte
        );
        if (match) {
          // Special case for WebP
          if (mimeType === 'image/webp' && buffer.length >= 12) {
            const webpSig = new Uint8Array([0x57, 0x45, 0x42, 0x50]); // WEBP
            const isWebP = Array.from(webpSig).every(
              (byte, i) => buffer[8 + i] === byte
            );
            if (isWebP) return mimeType;
            continue;
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
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'image/x-icon': 'ico',
    'image/vnd.microsoft.icon': 'ico'
  };
  return extensions[mimeType] || 'bin';
}

/**
 * Downloads image with security validation and timeout
 */
async function downloadImage(url: string): Promise<{
  buffer: Uint8Array;
  contentType: string;
  fileName: string;
} | null> {
  if (!isUrlSafe(url)) {
    console.error(`[ImageProcessor] URL failed safety validation: ${url}`);
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT);

  try {
    console.log(`[ImageProcessor] Downloading from: ${url}`);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'BrandsInBlooms/1.0 (Image Processor)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[ImageProcessor] HTTP ${response.status}: ${response.statusText}`);
      return null;
    }

    // Check content-length before downloading
    const contentLength = response.headers.get('content-length');
    const maxSize = 10 * 1024 * 1024; // 10MB global max
    if (contentLength && parseInt(contentLength, 10) > maxSize) {
      console.error(`[ImageProcessor] Image too large: ${contentLength} bytes`);
      return null;
    }

    // Download
    const arrayBuffer = await response.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Verify size after download
    if (buffer.length > maxSize) {
      console.error(`[ImageProcessor] Downloaded file too large: ${buffer.length} bytes`);
      return null;
    }

    if (buffer.length === 0) {
      console.error(`[ImageProcessor] Downloaded file is empty`);
      return null;
    }

    // Detect actual type
    const detectedType = detectImageType(buffer);
    const contentType = response.headers.get('content-type')?.toLowerCase().split(';')[0];
    const finalContentType = detectedType || contentType || 'application/octet-stream';

    console.log(`[ImageProcessor] Downloaded ${buffer.length} bytes, type: ${finalContentType}`);

    // Extract filename
    let fileName = 'image';
    try {
      const urlPath = new URL(url).pathname;
      const lastSegment = urlPath.split('/').pop();
      if (lastSegment?.includes('.')) {
        fileName = lastSegment.split('.')[0].replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50);
      }
    } catch {
      // Use default
    }

    fileName = `${fileName}.${getExtensionFromMimeType(finalContentType)}`;

    return { buffer, contentType: finalContentType, fileName };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    const errorInfo = handleError(error);

    if (errorInfo.message.includes('abort')) {
      console.error(`[ImageProcessor] Download timeout after ${DOWNLOAD_TIMEOUT}ms`);
    } else {
      console.error(`[ImageProcessor] Download error: ${errorInfo.message}`);
    }

    return null;
  }
}

/**
 * Validates configuration for image type
 */
function validateImageConfig(
  buffer: Uint8Array,
  contentType: string,
  config: ImageValidationConfig,
  imageType: ImageType
): { valid: boolean; error?: string } {
  // Check file size
  if (buffer.length > config.maxFileSize) {
    return {
      valid: false,
      error: `File too large for ${imageType}: ${buffer.length} bytes (max ${config.maxFileSize})`
    };
  }

  // Check MIME type
  if (!config.supportedMimeTypes.includes(contentType)) {
    return {
      valid: false,
      error: `Unsupported type for ${imageType}: ${contentType}`
    };
  }

  // Check dimensions (if available and required)
  // Note: Dimension checking requires image processing library like sharp
  // For now, we rely on LLM providing appropriate images
  // TODO: Add dimension validation with sharp if needed

  return { valid: true };
}

/**
 * Uploads image buffer to S3
 */
async function uploadToS3(
  buffer: Uint8Array,
  contentType: string,
  fileName: string,
  imageType: ImageType,
  siteId: string,
  userId: string
): Promise<string | null> {
  try {
    const filePath = generateFilePath(fileName, siteId, `${imageType}-images`);

    const presignedResult = await getPresignedUploadUrl({
      key: filePath,
      fileName: filePath,
      siteId,
      contentType,
      contentLength: buffer.length,
      metadata: {
        'original-source': 'ai-generation',
        'processor': 'image-processor',
        'image-type': imageType,
        'user-id': userId,
      },
    });

    if (!presignedResult.success || !presignedResult.data) {
      console.error(`[ImageProcessor] Failed to get presigned URL`);
      return null;
    }

    const uploadResponse = await fetch(presignedResult.data.uploadUrl, {
      method: 'PUT',
      body: buffer,
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
      },
    });

    if (!uploadResponse.ok) {
      console.error(`[ImageProcessor] S3 upload failed: ${uploadResponse.status}`);
      return null;
    }

    const publicUrl = presignedResult.data.url;
    console.log(`[ImageProcessor] ${imageType} image uploaded: ${publicUrl}`);

    return publicUrl;
  } catch (error: unknown) {
    const errorInfo = handleError(error);
    console.error(`[ImageProcessor] Upload error: ${errorInfo.message}`);
    return null;
  }
}
```

### Main Processing Function

```typescript
/**
 * Main entry point: Download and process a single image
 *
 * @param imageData - Extracted image data from LLM
 * @param siteId - Site ID for file path generation
 * @param userId - User ID for metadata
 * @returns Processed image or null if failed
 */
export async function downloadAndProcessImage(
  imageData: ExtractedImageData,
  siteId: string,
  userId: string
): Promise<ImageProcessingResult> {
  try {
    // Validate input
    if (!imageData.url) {
      return {
        success: false,
        error: 'Missing image URL',
        errorCode: 'INVALID_INPUT'
      };
    }

    const config = IMAGE_TYPE_CONFIGS[imageData.type];
    if (!config) {
      return {
        success: false,
        error: `Unknown image type: ${imageData.type}`,
        errorCode: 'INVALID_INPUT'
      };
    }

    // Download
    const downloadResult = await downloadImage(imageData.url);
    if (!downloadResult) {
      return {
        success: false,
        error: 'Failed to download image',
        errorCode: 'DOWNLOAD_FAILED'
      };
    }

    // Validate against type-specific config
    const validation = validateImageConfig(
      downloadResult.buffer,
      downloadResult.contentType,
      config,
      imageData.type
    );

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        errorCode: 'VALIDATION_FAILED'
      };
    }

    // Upload to S3
    const uploadedUrl = await uploadToS3(
      downloadResult.buffer,
      downloadResult.contentType,
      downloadResult.fileName,
      imageData.type,
      siteId,
      userId
    );

    if (!uploadedUrl) {
      return {
        success: false,
        error: 'Failed to upload to S3',
        errorCode: 'UPLOAD_FAILED'
      };
    }

    const processed: ProcessedImage = {
      ...imageData,
      uploadedUrl,
      fileName: downloadResult.fileName,
      mimeType: downloadResult.contentType,
      fileSize: downloadResult.buffer.length,
      processedAt: new Date()
    };

    return { success: true, image: processed };
  } catch (error: unknown) {
    const errorInfo = handleError(error);
    return {
      success: false,
      error: errorInfo.message,
      errorCode: 'UPLOAD_FAILED'
    };
  }
}

/**
 * Batch process multiple images with parallel execution and error resilience
 */
export async function batchProcessImages(
  images: ExtractedImageData[],
  siteId: string,
  userId: string,
  options?: {
    parallel?: number; // Concurrent downloads (default: 3)
    stopOnError?: boolean; // Stop if any fail (default: false)
  }
): Promise<BatchProcessingResult> {
  const concurrency = options?.parallel ?? 3;
  const stopOnError = options?.stopOnError ?? false;

  console.log(`[ImageProcessor] Processing ${images.length} images with concurrency ${concurrency}`);

  const result: BatchProcessingResult = {
    processed: [],
    failed: [],
    stats: {
      total: images.length,
      success: 0,
      failed: 0,
      skipped: 0,
      totalSize: 0
    }
  };

  // Process with queue to respect concurrency limits
  const queue = [...images];
  const inFlight: Promise<ImageProcessingResult>[] = [];

  while (queue.length > 0 || inFlight.length > 0) {
    // Start new downloads up to concurrency limit
    while (inFlight.length < concurrency && queue.length > 0) {
      const image = queue.shift()!;
      const promise = downloadAndProcessImage(image, siteId, userId);
      inFlight.push(promise);
    }

    // Wait for at least one to complete
    if (inFlight.length > 0) {
      const index = await Promise.race(
        inFlight.map((p, i) => p.then(() => i))
      );

      const [completedPromise] = inFlight.splice(index, 1);
      const processingResult = await completedPromise;

      if (processingResult.success && processingResult.image) {
        result.processed.push(processingResult.image);
        result.stats.success++;
        result.stats.totalSize += processingResult.image.fileSize;

        console.log(
          `[ImageProcessor] ✅ ${processingResult.image.type}: ${processingResult.image.fileName}`
        );
      } else {
        const originalImage = images.find(img => img.url === queue[0]?.url) || images[0];
        result.failed.push({
          original: originalImage,
          error: processingResult.error || 'Unknown error',
          errorCode: processingResult.errorCode || 'UPLOAD_FAILED'
        });
        result.stats.failed++;

        console.warn(
          `[ImageProcessor] ❌ ${originalImage.type}: ${processingResult.error}`
        );

        if (stopOnError) {
          console.error('[ImageProcessor] Stopping batch due to error');
          break;
        }
      }
    }
  }

  console.log(
    `[ImageProcessor] Batch complete: ${result.stats.success} succeeded, ${result.stats.failed} failed`
  );

  return result;
}
```

---

## 2. Database Schema (Migration)

**File**: `supabase/migrations/20250[DATE]_add_site_extracted_images.sql`

```sql
-- Create site_extracted_images table
CREATE TABLE public.site_extracted_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,

  -- Original extraction data
  original_url TEXT NOT NULL,
  uploaded_url TEXT,  -- NULL if processing failed
  image_type TEXT NOT NULL CHECK (image_type IN ('hero', 'gallery', 'product', 'feature', 'team', 'logo', 'other')),

  -- Metadata from LLM extraction
  context TEXT NOT NULL,  -- 'background-image', 'css-variable', 'img-tag', 'picture-element', 'data-attribute'
  selector TEXT NOT NULL,
  alt_text TEXT,
  dimensions JSONB,  -- { width: number, height: number }

  -- Processing info
  extraction_confidence NUMERIC(3,2) NOT NULL DEFAULT 0.8,  -- 0-1
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'uploaded', 'failed', 'skipped')),
  error_message TEXT,
  processed_at TIMESTAMP,

  -- File info (if uploaded successfully)
  file_size INTEGER,  -- bytes
  mime_type TEXT,
  file_name TEXT,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_site_extracted_images_site_id ON public.site_extracted_images(site_id);
CREATE INDEX idx_site_extracted_images_type ON public.site_extracted_images(image_type);
CREATE INDEX idx_site_extracted_images_status ON public.site_extracted_images(processing_status);
CREATE INDEX idx_site_extracted_images_created_at ON public.site_extracted_images(created_at DESC);
CREATE INDEX idx_site_extracted_images_site_type_status ON public.site_extracted_images(site_id, image_type, processing_status);

-- Row Level Security
ALTER TABLE public.site_extracted_images ENABLE ROW LEVEL SECURITY;

-- Policy: Users can select extracted images from their sites
CREATE POLICY site_extracted_images_select
  ON public.site_extracted_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = site_extracted_images.site_id
      AND sites.user_id = auth.uid()
    )
  );

-- Policy: System/API can insert (users indirectly through site generation)
CREATE POLICY site_extracted_images_insert
  ON public.site_extracted_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = site_extracted_images.site_id
      AND sites.user_id = auth.uid()
    )
  );

-- Policy: Users can update (for future manual edits)
CREATE POLICY site_extracted_images_update
  ON public.site_extracted_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = site_extracted_images.site_id
      AND sites.user_id = auth.uid()
    )
  );

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_site_extracted_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_site_extracted_images_updated_at
  BEFORE UPDATE ON public.site_extracted_images
  FOR EACH ROW
  EXECUTE FUNCTION update_site_extracted_images_updated_at();

-- Comments
COMMENT ON TABLE public.site_extracted_images IS 'Stores metadata for images extracted from source websites during site generation';
COMMENT ON COLUMN public.site_extracted_images.image_type IS 'Categorization of image purpose: hero, gallery, product, feature, team, logo, or other';
COMMENT ON COLUMN public.site_extracted_images.processing_status IS 'Current status of image processing: pending, processing, uploaded, failed, or skipped';
COMMENT ON COLUMN public.site_extracted_images.extraction_confidence IS 'Confidence score from LLM extraction (0-1)';
COMMENT ON COLUMN public.site_extracted_images.uploaded_url IS 'Internal S3 URL after successful processing, NULL if failed';
```

---

## 3. Database Helper Functions

**File**: `src/lib/database/extracted-images.ts`

```typescript
import { createSupabaseClient } from '@/lib/supabase/server';
import type { ProcessedImage } from '@/lib/storage/image-processor';

/**
 * Store extracted images in database
 */
export async function storeExtractedImages(
  siteId: string,
  images: ProcessedImage[]
): Promise<boolean> {
  if (images.length === 0) return true;

  const supabase = await createSupabaseClient();

  try {
    const { error } = await supabase
      .from('site_extracted_images')
      .insert(
        images.map(img => ({
          site_id: siteId,
          original_url: img.url,
          uploaded_url: img.uploadedUrl,
          image_type: img.type,
          context: img.context,
          selector: img.selector,
          alt_text: img.alt,
          dimensions: img.dimensions,
          extraction_confidence: img.confidence,
          processing_status: 'uploaded',
          file_size: img.fileSize,
          mime_type: img.mimeType,
          file_name: img.fileName,
          processed_at: img.processedAt.toISOString()
        }))
      );

    if (error) {
      console.error('Failed to store extracted images:', error);
      return false;
    }

    return true;
  } catch (error: unknown) {
    console.error('Error storing extracted images:', error);
    return false;
  }
}

/**
 * Get extracted images for a site
 */
export async function getExtractedImages(
  siteId: string,
  imageType?: string
) {
  const supabase = await createSupabaseClient();

  let query = supabase
    .from('site_extracted_images')
    .select('*')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false });

  if (imageType) {
    query = query.eq('image_type', imageType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch extracted images:', error);
    return null;
  }

  return data;
}

/**
 * Get images by processing status
 */
export async function getImagesByStatus(
  siteId: string,
  status: 'pending' | 'processing' | 'uploaded' | 'failed' | 'skipped'
) {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from('site_extracted_images')
    .select('*')
    .eq('site_id', siteId)
    .eq('processing_status', status);

  if (error) {
    console.error(`Failed to fetch ${status} images:`, error);
    return null;
  }

  return data;
}

/**
 * Update image processing status
 */
export async function updateImageStatus(
  imageId: string,
  status: 'pending' | 'processing' | 'uploaded' | 'failed' | 'skipped',
  options?: {
    uploadedUrl?: string;
    errorMessage?: string;
  }
) {
  const supabase = await createSupabaseClient();

  const update: Record<string, unknown> = {
    processing_status: status,
    processed_at: new Date().toISOString()
  };

  if (options?.uploadedUrl) {
    update.uploaded_url = options.uploadedUrl;
  }

  if (options?.errorMessage) {
    update.error_message = options.errorMessage;
  }

  const { error } = await supabase
    .from('site_extracted_images')
    .update(update)
    .eq('id', imageId);

  if (error) {
    console.error('Failed to update image status:', error);
    return false;
  }

  return true;
}
```

---

## 4. Integration in Site Generation

**Location**: `app/api/sites/generate/route.ts`

Replace the current manual hero image processing with unified approach:

```typescript
// After analyzeScrapedWebsite call, add:

if (analyzed.businessInfo.extractedImages) {
  console.log(`[${requestId}] [IMAGE PROCESSING] Processing extracted images...`);

  const tempSiteId = `temp-${job.id}`;

  // Collect all extracted images
  const allImages = [
    ...(analyzed.businessInfo.extractedImages.hero || []),
    ...(analyzed.businessInfo.extractedImages.gallery || []),
    ...(analyzed.businessInfo.extractedImages.product || []),
    ...(analyzed.businessInfo.extractedImages.feature || []),
    ...(analyzed.businessInfo.extractedImages.team || []),
    ...(analyzed.businessInfo.extractedImages.other || [])
  ];

  if (allImages.length > 0) {
    const batchResult = await batchProcessImages(
      allImages,
      tempSiteId,
      user.id,
      { parallel: 3, stopOnError: false }
    );

    console.log(
      `[${requestId}] [IMAGE PROCESSING] Processed: ${batchResult.stats.success} success, ` +
      `${batchResult.stats.failed} failed, total size: ${(batchResult.stats.totalSize / 1024 / 1024).toFixed(2)}MB`
    );

    // Pass processed images to background processor
    scrapedContext.processedImages = batchResult.processed;
  }
}
```

---

## 5. Type Extensions

Update `src/lib/types/site-generation-jobs.ts`:

```typescript
import type { ProcessedImage } from '@/lib/storage/image-processor';

export interface ScrapedWebsiteContext {
  // ... existing fields ...

  /** Processed images from site generation */
  processedImages?: ProcessedImage[];

  /** Extracted image data before processing */
  extractedImages?: {
    hero?: Array<{ url: string; confidence: number; context: string; selector: string }>;
    gallery?: Array<{ url: string; confidence: number; context: string; selector: string }>;
    product?: Array<{ url: string; confidence: number; context: string; selector: string }>;
    feature?: Array<{ url: string; confidence: number; context: string; selector: string }>;
    team?: Array<{ url: string; confidence: number; context: string; selector: string }>;
    other?: Array<{ url: string; confidence: number; context: string; selector: string }>;
  };
}
```

---

## 6. API Endpoints for Image Management

**File**: `app/api/sites/[siteId]/images/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase/api-server';
import { apiSuccess, apiError } from '@/lib/types/api';
import { getExtractedImages, getImagesByStatus } from '@/lib/database/extracted-images';

export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const supabase = await createClientFromRequest(request);

    // Auth check (verify user owns site)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401);
    }

    // Check site ownership
    const { data: site } = await supabase
      .from('sites')
      .select('id')
      .eq('id', params.siteId)
      .eq('user_id', user.id)
      .single();

    if (!site) {
      return apiError('Site not found', 'NOT_FOUND', 404);
    }

    // Get images
    const imageType = request.nextUrl.searchParams.get('type');
    const status = request.nextUrl.searchParams.get('status') as any;

    let images;
    if (status) {
      images = await getImagesByStatus(params.siteId, status);
    } else if (imageType) {
      images = await getExtractedImages(params.siteId, imageType);
    } else {
      images = await getExtractedImages(params.siteId);
    }

    return apiSuccess({ images });
  } catch (error: unknown) {
    console.error('Error fetching images:', error);
    return apiError('Failed to fetch images', 'INTERNAL_ERROR', 500);
  }
}
```

---

## Testing

### Unit Tests for Image Processor

```typescript
// src/lib/storage/__tests__/image-processor.test.ts

import { IMAGE_TYPE_CONFIGS, isUrlSafe, detectImageType } from '../image-processor';

describe('Image Processor', () => {
  describe('URL Safety', () => {
    it('should reject non-HTTPS URLs', () => {
      expect(isUrlSafe('http://example.com')).toBe(false);
    });

    it('should reject localhost URLs', () => {
      expect(isUrlSafe('https://localhost/image.jpg')).toBe(false);
      expect(isUrlSafe('https://127.0.0.1/image.jpg')).toBe(false);
    });

    it('should reject private IPs', () => {
      expect(isUrlSafe('https://192.168.1.1/image.jpg')).toBe(false);
      expect(isUrlSafe('https://10.0.0.1/image.jpg')).toBe(false);
    });

    it('should accept valid public HTTPS URLs', () => {
      expect(isUrlSafe('https://example.com/image.jpg')).toBe(true);
      expect(isUrlSafe('https://cdn.example.com/image.jpg')).toBe(true);
    });
  });

  describe('Image Type Configs', () => {
    it('should have correct size limits for each type', () => {
      expect(IMAGE_TYPE_CONFIGS.hero.maxFileSize).toBe(10 * 1024 * 1024);
      expect(IMAGE_TYPE_CONFIGS.logo.maxFileSize).toBe(5 * 1024 * 1024);
    });

    it('should have minimum dimensions for types that need them', () => {
      expect(IMAGE_TYPE_CONFIGS.hero.minWidth).toBe(800);
      expect(IMAGE_TYPE_CONFIGS.hero.minHeight).toBe(400);
      expect(IMAGE_TYPE_CONFIGS.logo.minWidth).toBeUndefined();
    });
  });
});
```

---

## Deployment Checklist

- [ ] Review and run database migration
- [ ] Update TypeScript types and interfaces
- [ ] Implement image-processor.ts
- [ ] Add database helper functions
- [ ] Update site generation flow to use unified processor
- [ ] Add API endpoints for image management
- [ ] Write and run unit tests
- [ ] Load test with batch processing
- [ ] Deploy to staging environment
- [ ] Test with various website types
- [ ] Monitor error rates and performance
- [ ] Deploy to production
- [ ] Add monitoring/alerts for image processing failures

