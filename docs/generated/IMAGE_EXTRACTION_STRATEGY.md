# Comprehensive Image Extraction Strategy

## Executive Summary

Your LLM-first image extraction system has the right architecture but needs to be **expanded and unified**. Currently Phase 2D extracts images (with hero type support), but only hero images are being processed and uploaded. The system needs to:

1. **Expand Phase 2D** to extract ALL significant image types (not just hero/gallery)
2. **Create a unified image processor** that handles all image types through the same upload pipeline
3. **Implement categorization and storage strategy** for different image types
4. **Establish database schema** for storing extracted image metadata
5. **Prioritize intelligent processing** based on image type and context

---

## Current State Analysis

### What Works
- **Phase 2D** (image-extraction-prompt.ts) already has a well-designed LLM prompt that:
  - Extracts hero, gallery, product, feature, team, and "other" images
  - Handles CSS variables, background-image properties, img tags, and modern builders
  - Returns structured JSON with type, context, dimensions, and confidence
  - Categorizes by importance (hero priority 1, gallery priority 2, etc.)

- **Logo Processor** (logo-processor.ts) is production-grade:
  - Downloads images from external URLs
  - Validates safety (SSRF prevention)
  - Verifies file type via magic bytes
  - Uploads to S3 with presigned URLs
  - Stores in `logos/` subdirectory

- **Hero Image Processor** (hero-image-processor.ts) follows the same pattern:
  - Similar download/validation/upload flow
  - Stores in `hero-images/` subdirectory
  - Handles larger file sizes (10MB vs 5MB for logos)

### What's Missing
- **Only logo and hero images are being processed and uploaded**
  - Feature images, gallery images, product images, and team photos are extracted but not uploaded
  - This leaves 80% of extracted images unused

- **No unified image processor**
  - Each image type needs its own handler (feature-processor, product-processor, gallery-processor, etc.)
  - Or a generic image-processor that handles all types with type-specific logic

- **No database schema for extracted images**
  - Extracted image metadata is not persisted
  - Site generation jobs store raw extraction data but don't create usable image records
  - No way to query "what images were extracted for this site"

- **Limited integration in the generation flow**
  - Site generation only uses logoUrl and heroSection.backgroundImage
  - Gallery images are extracted but not integrated into the site structure
  - Feature/product images have no storage or reference point

---

## Recommended Architecture

### Phase 2D Enhancement: Comprehensive Image Extraction

**Current**: Extracts all images, filters by type during merge

**Recommended**: Keep extraction as-is, but expand processing to handle all types

### Image Processing Pipeline

```
LLM Extraction (Phase 2D)
    ↓
ImageExtractionResponse
    ├─ hero images (1-2 images)
    ├─ gallery images (3-10 images)
    ├─ product images (5-20 images)
    ├─ feature images (2-5 images)
    ├─ team images (0-3 images)
    └─ other images (0-5 images)
    ↓
Unified Image Processor
    ├─ URL validation (SSRF check)
    ├─ Download with timeout
    ├─ Magic byte verification
    ├─ Type-specific validation:
    │   ├─ Hero: min 800x400
    │   ├─ Product: min 200x200
    │   ├─ Gallery: min 150x150
    │   ├─ Feature: min 150x150
    │   └─ Team: min 100x100
    ├─ File size limits by type:
    │   ├─ Hero: 10MB
    │   ├─ Product: 5MB
    │   └─ Others: 5MB
    └─ S3 Upload
        └─ Store with type prefix:
           ├─ hero-images/{id}/image.jpg
           ├─ product-images/{id}/image.jpg
           ├─ gallery-images/{id}/image.jpg
           ├─ feature-images/{id}/image.jpg
           ├─ team-images/{id}/image.jpg
           └─ other-images/{id}/image.jpg
    ↓
Store in Database (site_extracted_images table)
    └─ Keep for:
        - Content management
        - Display in site editor
        - Analytics
        - Re-processing if needed
```

---

## Implementation Strategy

### 1. Create Unified Image Processor

**File**: `src/lib/storage/image-processor.ts`

```typescript
// Type definitions
type ImageType = 'hero' | 'gallery' | 'product' | 'feature' | 'team' | 'other';

interface ImageValidationConfig {
  maxFileSize: number;  // bytes
  minWidth?: number;
  minHeight?: number;
  supportedMimeTypes: string[];
}

interface ProcessedImage {
  originalUrl: string;
  uploadedUrl: string;
  type: ImageType;
  fileName: string;
  mimeType: string;
  fileSize: number;
  dimensions?: { width: number; height: number };
  confidence: number;
  context: string;
  selector: string;
}

// Main function
export async function downloadAndProcessImage(
  url: string,
  type: ImageType,
  siteId: string,
  userId: string
): Promise<ProcessedImage | null>

// Type-specific configs
const IMAGE_TYPE_CONFIGS: Record<ImageType, ImageValidationConfig> = {
  hero: {
    maxFileSize: 10 * 1024 * 1024,
    minWidth: 800,
    minHeight: 400,
    supportedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  product: {
    maxFileSize: 5 * 1024 * 1024,
    minWidth: 200,
    minHeight: 200,
    supportedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  gallery: {
    maxFileSize: 5 * 1024 * 1024,
    minWidth: 150,
    minHeight: 150,
    supportedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  feature: {
    maxFileSize: 5 * 1024 * 1024,
    minWidth: 150,
    minHeight: 150,
    supportedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  team: {
    maxFileSize: 3 * 1024 * 1024,
    minWidth: 100,
    minHeight: 100,
    supportedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  other: {
    maxFileSize: 5 * 1024 * 1024,
    supportedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  }
}

// Batch processing for efficiency
export async function batchProcessImages(
  images: Array<{
    url: string;
    type: ImageType;
    confidence: number;
    context: string;
    selector: string;
    alt?: string;
  }>,
  siteId: string,
  userId: string
): Promise<ProcessedImage[]>
```

### 2. Database Schema

**New table**: `site_extracted_images`

```sql
CREATE TABLE public.site_extracted_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,

  -- Original extraction data
  original_url TEXT NOT NULL,
  uploaded_url TEXT,  -- NULL if processing failed
  image_type TEXT NOT NULL CHECK (image_type IN ('hero', 'gallery', 'product', 'feature', 'team', 'other')),

  -- Metadata from extraction
  context TEXT,  -- 'background-image', 'css-variable', 'img-tag', etc.
  selector TEXT,
  alt_text TEXT,
  dimensions JSONB,  -- { width: number, height: number }

  -- Processing info
  extraction_confidence NUMERIC(3,2),  -- 0-1
  processing_status TEXT NOT NULL CHECK (processing_status IN ('pending', 'processing', 'uploaded', 'failed')),
  error_message TEXT,
  processed_at TIMESTAMP,

  -- File info (if uploaded)
  file_size INTEGER,  -- bytes
  mime_type TEXT,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_site_extracted_images_site_id ON public.site_extracted_images(site_id);
CREATE INDEX idx_site_extracted_images_type ON public.site_extracted_images(image_type);
CREATE INDEX idx_site_extracted_images_status ON public.site_extracted_images(processing_status);
CREATE INDEX idx_site_extracted_images_created_at ON public.site_extracted_images(created_at DESC);

-- Enable RLS
ALTER TABLE public.site_extracted_images ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view images from their sites
CREATE POLICY site_extracted_images_select
  ON public.site_extracted_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = site_extracted_images.site_id
      AND sites.user_id = auth.uid()
    )
  );

-- RLS Policy: Only system can insert/update
CREATE POLICY site_extracted_images_insert
  ON public.site_extracted_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = site_extracted_images.site_id
      AND sites.user_id = auth.uid()
    )
  );
```

### 3. Integration in Site Generation

**Location**: `app/api/sites/generate/route.ts`

Modify the scraped website processing section:

```typescript
// After hero image processing, add batch processing for all images
if (analyzed.businessInfo.heroImages && analyzed.businessInfo.heroImages.length > 0) {
  console.log(`[${requestId}] [IMAGE PROCESSING] Processing ${analyzed.businessInfo.heroImages.length} extracted images...`);

  const tempSiteId = `temp-${job.id}`;

  // Collect all images from extraction (currently Phase 2D returns them in heroImages)
  // TODO: Phase 2D enhancement will return all image types in separate arrays

  const allImages = [
    ...analyzed.businessInfo.heroImages.map(img => ({
      url: img.url,
      type: 'hero' as const,
      confidence: img.confidence,
      context: img.context,
      selector: 'hero-section', // Should come from LLM
      alt: img.alt
    }))
    // Will add other types here after Phase 2D enhancement:
    // ...productImages, ...galleryImages, ...featureImages, etc.
  ];

  const processedImages = await batchProcessImages(allImages, tempSiteId, user.id);

  // Store in database for reference
  await storeExtractedImages(job.id, processedImages);

  // Update generation context with uploaded URLs
  scrapedContext.extractedImages = processedImages;
}
```

### 4. Enhanced Phase 2D Extraction

The current prompt is good, but update it to explicitly handle all types:

```typescript
// Update extraction to return ALL image types, not filter to just hero/gallery

// Current merging logic filters by type - enhance this to:
// 1. Keep all image types separate during merging
// 2. Store separately in ExtractedBusinessInfo

export interface ExtractedBusinessInfo {
  // ... existing fields ...

  // Phase 2D: All extracted images by type
  extractedImages?: {
    hero?: typeof imageData.images;
    gallery?: typeof imageData.images;
    product?: typeof imageData.images;
    feature?: typeof imageData.images;
    team?: typeof imageData.images;
    other?: typeof imageData.images;
  };
}
```

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
1. Create `image-processor.ts` with unified download/validate/upload logic
2. Add `site_extracted_images` table
3. Create helper functions to store extracted images in database
4. Write tests for image processor

### Phase 2: Integration (Week 2)
1. Update site generation flow to use batch image processor
2. Modify Phase 2D merging to keep all image types separate
3. Integrate image storage in database during generation
4. Update scraping analysis to pass all image types downstream

### Phase 3: Site Editor Integration (Week 3)
1. Create API endpoints to fetch extracted images for a site
2. Add image management UI to site editor
3. Allow users to:
   - View extracted images
   - Set them to specific sections
   - Delete/replace unwanted images
   - Re-extract if needed

### Phase 4: Advanced Features (Week 4)
1. Image optimization and CDN integration
2. Responsive image generation (srcset)
3. Image analytics and usage tracking
4. Bulk image operations

---

## Benefits of This Approach

### 1. **LLM Intelligence Preserved**
- Let the LLM decide what images are significant
- No arbitrary rules or heuristics
- Confidence scores guide priority

### 2. **Unified Processing**
- Same security validation for all images
- Consistent error handling
- Single point of improvement

### 3. **Database-Backed**
- Extracted images are persistent
- Queryable and traceable
- Useful for analytics and debugging

### 4. **Flexible Storage**
- Type-specific directories in S3
- Easy to apply type-specific optimizations later
- Clear organization

### 5. **User Control**
- Users can see what was extracted
- Ability to customize site by selecting different images
- Education about what the system found

---

## Image Type Handling Details

### Hero Images (Priority 1)
- **Purpose**: Full-width hero section backgrounds
- **Size limits**: 10MB max, 800x400 minimum
- **Processing**: Resize/optimize for web if needed
- **Storage**: `hero-images/{siteId}/`
- **Integration**: Direct use in hero section

### Product Images (Priority 2)
- **Purpose**: E-commerce product displays
- **Size limits**: 5MB max, 200x200 minimum
- **Processing**: Generate thumbnails and full-size variants
- **Storage**: `product-images/{siteId}/`
- **Integration**: Product carousel/grid sections

### Gallery Images (Priority 3)
- **Purpose**: Gallery/portfolio displays
- **Size limits**: 5MB max, 150x150 minimum
- **Processing**: Create srcset for responsive display
- **Storage**: `gallery-images/{siteId}/`
- **Integration**: Gallery sections with lightbox

### Feature Images (Priority 4)
- **Purpose**: Highlight features/benefits
- **Size limits**: 5MB max, 150x150 minimum
- **Processing**: Standard optimization
- **Storage**: `feature-images/{siteId}/`
- **Integration**: Feature showcase sections

### Team Images (Priority 5)
- **Purpose**: Staff/team member photos
- **Size limits**: 3MB max, 100x100 minimum
- **Processing**: Circle crop option for profiles
- **Storage**: `team-images/{siteId}/`
- **Integration**: Team member cards

### Other Images (Priority 6)
- **Purpose**: Miscellaneous visuals
- **Size limits**: 5MB max, no minimum
- **Processing**: Basic validation
- **Storage**: `other-images/{siteId}/`
- **Integration**: As needed in content

---

## Error Handling Strategy

Each image type should have graceful degradation:

```typescript
const imageProcessingStrategy = {
  hero: {
    // Hero is critical - site may be incomplete without it
    // Continue generation but flag the issue
    criticality: 'high',
    fallback: 'skip'  // Don't use placeholder
  },
  gallery: {
    // Gallery images improve presentation but aren't critical
    criticality: 'medium',
    fallback: 'skip'  // Just don't show gallery
  },
  product: {
    criticality: 'medium',
    fallback: 'skip'  // Show product info without image
  },
  feature: {
    criticality: 'low',
    fallback: 'skip'  // Continue without feature images
  },
  team: {
    criticality: 'low',
    fallback: 'skip'  // Show team info without photos
  },
  other: {
    criticality: 'low',
    fallback: 'skip'
  }
}
```

---

## Questions Answered

### 1. Should we enhance Phase 2D to extract more image types?
**Yes, but it already does.** Phase 2D extracts hero, gallery, product, feature, team, and other images. The issue is they're not being processed. Keep the extraction as-is, expand the processing.

### 2. How do we store multiple image types in the database?
**site_extracted_images table** with:
- `image_type` column for categorization
- `processing_status` to track which ones were uploaded
- Type-specific indexes for efficient queries
- Links back to sites for RLS and querying

### 3. Should all images go through logo-processor.ts pattern?
**Yes, but unified.** Create `image-processor.ts` that:
- Shares the same download/validate/upload pipeline
- Accepts an `ImageType` parameter
- Uses type-specific validation configs
- Stores in type-specific S3 directories

### 4. How do we map extracted images to site sections?
**Two approaches:**

*Approach A: Automatic (for initial MVP)*
- Hero type → hero section background
- Gallery type → gallery section
- Product type → product section
- Feature type → feature section
- Team type → team section

*Approach B: Manual (phase 2)*
- Store extracted images in database
- Let users drag-drop into sections
- More flexible, requires UI work

---

## Success Metrics

- All extracted images are processed and uploaded (vs current ~20%)
- Site generation includes diverse image types (not just logo + hero)
- Users can customize which images are used
- Image extraction metrics tracked (success rate by type)
- Database grows with historical extraction data for analysis

---

## Next Steps

1. Review and refine the database schema with RLS requirements
2. Implement image-processor.ts with all type-specific logic
3. Create migration for site_extracted_images table
4. Integrate into site generation flow
5. Add API endpoints for image management
6. Test with various website types

