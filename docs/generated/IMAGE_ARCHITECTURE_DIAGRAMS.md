# Image Extraction Architecture Diagrams

Visual representations of the three-part enhancement strategy.

---

## 1. Current State (Problem)

```
Website HTML
    ↓
┌─────────────────────────────────────────────────────────┐
│ Phase 2D: Image Extraction (LLM-powered)               │
│ • Identifies hero images                               │
│ • Identifies gallery images                            │
│ • Identifies product images                            │
│ • Identifies feature images                            │
│ • Identifies team photos                               │
│ • Identifies other images                              │
└─────────────────────────────────────────────────────────┘
    ↓
ImageExtractionResponse: 50+ images, 6 types
    ↓
┌─────────────────────────────────────────────────────────┐
│ Merge Results                                            │
│ ❌ Only hero images stored in heroImages[]              │
│ ❌ Gallery stored but not processed                     │
│ ❌ Product, feature, team images DISCARDED             │
│ ❌ Other images DISCARDED                              │
└─────────────────────────────────────────────────────────┘
    ↓
Site Generation
    ├─ Uses logoUrl (processed)
    ├─ Uses heroSection.backgroundImage (processed)
    └─ Ignores product, feature, team images
            (never downloaded or uploaded)
    ↓
Result: Beautiful hero, sad gallery/products
```

---

## 2. New State (Solution)

### Data Flow: Part 1 - Phase 2D Enhancement

```
Website HTML
    ↓
┌─────────────────────────────────────────────────────────┐
│ Phase 2D: Extract ALL Image Types (unchanged)          │
└─────────────────────────────────────────────────────────┘
    ↓
ImageExtractionResponse: 50+ images, 6 types
    ↓
┌─────────────────────────────────────────────────────────┐
│ ENHANCED Merge Results                                  │
│ ✅ Organize by type: hero, gallery, product,           │
│    feature, team, other                                │
│ ✅ Store all in extractedImages object                 │
│ ✅ Keep legacy heroImages for backwards compat         │
│ ✅ Keep heroSection.backgroundImage for UI             │
└─────────────────────────────────────────────────────────┘
    ↓
ExtractedBusinessInfo with:
  ├─ extractedImages.hero[]: [url, context, selector, ...]
  ├─ extractedImages.gallery[]: [url, context, selector, ...]
  ├─ extractedImages.product[]: [url, context, selector, ...]
  ├─ extractedImages.feature[]: [url, context, selector, ...]
  ├─ extractedImages.team[]: [url, context, selector, ...]
  └─ extractedImages.other[]: [url, context, selector, ...]
    ↓
Site Generation continues
    ├─ Pass all image types downstream
    └─ Enable Part 2 processing
```

### Data Flow: Part 2 - Unified Image Processor

```
extractedImages with all 6 types
    ↓
┌─────────────────────────────────────────────────────────┐
│ Batch Image Processor                                   │
│ Input: 50 images, 6 types                              │
└─────────────────────────────────────────────────────────┘
    ↓
    ├─── [Parallel: concurrency=3] ───┐
    │                                  │
    ↓                                  ↓
┌──────────────────────┐      ┌──────────────────────┐
│ Image #1 (hero)     │      │ Image #2 (product)   │
│ 1. Validate URL     │      │ 1. Validate URL      │
│ 2. Download         │      │ 2. Download          │
│ 3. Detect type      │      │ 3. Detect type       │
│ 4. Validate config  │      │ 4. Validate config   │
│ 5. Upload to S3     │      │ 5. Upload to S3      │
│ 6. Return URL       │      │ 6. Return URL        │
└──────────────────────┘      └──────────────────────┘
    ↓                                  ↓
┌──────────────────────┐      ┌──────────────────────┐
│ Image #3 (gallery)   │      │ Image #4 (team)      │
│ [processing...]      │      │ [waiting...]         │
└──────────────────────┘      └──────────────────────┘
    ↓                                  ↓
    └─── [All Complete] ───────────────┘
                ↓
ProcessedImages[]:
  ├─ { url, uploadedUrl, type, fileName, mimeType, fileSize, ... }
  ├─ { url, uploadedUrl, type, fileName, mimeType, fileSize, ... }
  ├─ { url, uploadedUrl, type, fileName, mimeType, fileSize, ... }
  └─ ... (all 50 images with results)
                ↓
    S3 Directory Structure:
    ├─ temp-{jobId}/hero-images/hero-1.jpg
    ├─ temp-{jobId}/hero-images/hero-2.jpg
    ├─ temp-{jobId}/product-images/product-1.jpg
    ├─ temp-{jobId}/product-images/product-2.jpg
    ├─ temp-{jobId}/gallery-images/gallery-1.jpg
    ├─ temp-{jobId}/feature-images/feature-1.jpg
    ├─ temp-{jobId}/team-images/team-1.jpg
    └─ temp-{jobId}/other-images/other-1.jpg
```

### Data Flow: Part 3 - Database Storage & Integration

```
ProcessedImages[]
    ↓
┌──────────────────────────────────────┐
│ Store in Database                    │
│ site_extracted_images table          │
└──────────────────────────────────────┘
    ↓
Database Rows:
┌────────┬──────┬────────┬─────────────┬──────────────┬──────────┐
│ id     │ type │ status │ original    │ uploaded_url │ ...      │
├────────┼──────┼────────┼─────────────┼──────────────┼──────────┤
│ uuid-1 │ hero │uploaded│ https://... │ /api/images/...
│ uuid-2 │ prod │uploaded│ https://... │ /api/images/...
│ uuid-3 │ gall │uploaded│ https://... │ /api/images/...
│ uuid-4 │ team │failed  │ https://... │ NULL         │ (error)  │
└────────┴──────┴────────┴─────────────┴──────────────┴──────────┘
    ↓
    ├─ Pass processed images to background processor
    ├─ Available via API: GET /api/sites/{siteId}/images
    ├─ Visible in site editor for customization
    └─ Queryable for analytics/debugging
                ↓
         Site is created with:
         ├─ Hero images in hero sections
         ├─ Product images in product sections
         ├─ Gallery images in gallery sections
         ├─ Feature images in feature sections
         ├─ Team images in team sections
         └─ Other images as needed
```

---

## 3. Component Architecture

### Processing Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│                    UNIFIED IMAGE PROCESSOR                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  INPUT: ExtractedImageData[]                                │
│  {                                                          │
│    url,              // https://example.com/image.jpg      │
│    type,             // 'hero' | 'product' | ...           │
│    context,          // 'background-image' | 'img-tag' | ..│
│    selector,         // CSS selector from LLM              │
│    alt,              // alt text if available               │
│    dimensions,       // { width, height } if detected       │
│    confidence        // 0-1 score from LLM                 │
│  }                                                          │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ STEP 1: URL Safety Validation (SSRF Prevention)             │
│         • Check HTTPS only                                  │
│         • Reject localhost, 127.0.0.1                       │
│         • Reject private IPs (10.x, 172.16-31.x, 192.168.x)│
│         ↓                                                    │
│ STEP 2: Download with Timeout (30 sec)                      │
│         • HTTP GET with User-Agent                          │
│         • Abort if timeout                                  │
│         • Check Content-Length before downloading           │
│         ↓                                                    │
│ STEP 3: Magic Byte Detection                                │
│         • Detect actual MIME type from file header          │
│         • Support: JPEG, PNG, WebP, GIF, SVG, ICO          │
│         ↓                                                    │
│ STEP 4: Type-Specific Validation                            │
│         • Hero: max 10MB, min 800x400 (vision needed)       │
│         • Product: max 5MB, min 200x200                     │
│         • Gallery: max 5MB, min 150x150                     │
│         • Feature: max 5MB, min 150x150                     │
│         • Team: max 3MB, min 100x100                        │
│         • Other: max 5MB, no min dimensions                 │
│         ↓                                                    │
│ STEP 5: S3 Upload with Presigned URL                        │
│         • Get presigned URL from API                        │
│         • PUT to S3 using presigned URL                     │
│         • Metadata: image-type, processor, user-id          │
│         ↓                                                    │
│ OUTPUT: ProcessedImage | null                               │
│ {                                                           │
│   ...extracted,         // original data                    │
│   uploadedUrl,          // internal S3 URL                  │
│   fileName,             // sanitized filename               │
│   mimeType,             // detected MIME type               │
│   fileSize,             // bytes                            │
│   processedAt           // timestamp                        │
│ }                                                           │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ ERROR HANDLING: Log and continue                            │
│ • URL_UNSAFE: Skip image, log reason                        │
│ • DOWNLOAD_FAILED: Skip image, log error                    │
│ • VALIDATION_FAILED: Skip image, log reason                 │
│ • UPLOAD_FAILED: Skip image, log error                      │
│ • Continue with next image in batch                         │
└──────────────────────────────────────────────────────────────┘
```

### Batch Processing with Concurrency

```
Input: 50 images, concurrency=3

Queue: [img1, img2, img3, img4, img5, ..., img50]

Timeline:
─────────────────────────────────────────────────────────────
t=0s    [DOWNLOAD] img1          [WAIT]        [WAIT]
        [DOWNLOAD] img2          [WAIT]        [WAIT]
        [DOWNLOAD] img3          [WAIT]        [WAIT]

t=1s    [VALIDATE] img1          [DOWNLOAD] img4     [WAIT]
        [DOWNLOAD] img2          [DOWNLOAD] img5     [WAIT]
        [DOWNLOAD] img3          [WAIT]              [WAIT]

t=2s    [UPLOAD]   img1          [VALIDATE] img4     [DOWNLOAD] img6
        [VALIDATE] img2          [DOWNLOAD] img5     [WAIT]
        [DOWNLOAD] img3          [WAIT]              [WAIT]

t=3s    [DONE]     img1          [UPLOAD]   img4     [VALIDATE] img6
        [UPLOAD]   img2          [VALIDATE] img5     [DOWNLOAD] img7
        [VALIDATE] img3          [DOWNLOAD] img6     [WAIT]

...continues in parallel...

t=25s   [DONE]     img48         [DONE]     img49    [DONE] img50

Result: 50 images processed in ~25 seconds (vs 150s serially)
```

---

## 4. Database Schema

```
┌──────────────────────────────────────────────────────┐
│           site_extracted_images TABLE                 │
├──────────────────────────────────────────────────────┤
│ id (UUID PK)                                          │
│ site_id (FK → sites)           [indexed]             │
│                                                      │
│ EXTRACTION DATA:                                      │
│ original_url (TEXT)            [the URL extracted]   │
│ uploaded_url (TEXT)            [S3 URL after upload] │
│ image_type (TEXT)              [indexed]             │
│   ENUM: hero|gallery|product|feature|team|other     │
│ context (TEXT)                 [how found]           │
│   background-image, css-variable, img-tag, etc      │
│ selector (TEXT)                [CSS selector]        │
│ alt_text (TEXT)                [alt attribute]       │
│ dimensions (JSONB)             [{ width, height }]   │
│ extraction_confidence (0-1)    [LLM confidence]      │
│                                                      │
│ PROCESSING STATUS:                                   │
│ processing_status (TEXT)       [indexed]             │
│   ENUM: pending|processing|uploaded|failed|skipped  │
│ error_message (TEXT)           [if failed]           │
│ processed_at (TIMESTAMP)       [completion time]     │
│                                                      │
│ FILE INFO (if uploaded):                             │
│ file_size (INTEGER)            [bytes]               │
│ mime_type (TEXT)               [detected type]       │
│ file_name (TEXT)               [sanitized name]      │
│                                                      │
│ METADATA:                                             │
│ created_at (TIMESTAMP)         [auto NOW()]          │
│ updated_at (TIMESTAMP)         [auto NOW()]          │
│                                                      │
├──────────────────────────────────────────────────────┤
│ INDEXES:                                              │
│ • site_id                      [FK relationship]     │
│ • image_type                   [filtering by type]   │
│ • processing_status            [tracking progress]   │
│ • created_at DESC              [latest first]        │
│ • (site_id, image_type, status) [compound query]     │
│                                                      │
├──────────────────────────────────────────────────────┤
│ ROW LEVEL SECURITY:                                   │
│ • Users can view images from their own sites         │
│ • Query: EXISTS (SELECT 1 FROM sites               │
│          WHERE sites.id = site_extracted_images...  │
│          AND sites.user_id = auth.uid())            │
│                                                      │
├──────────────────────────────────────────────────────┤
│ EXAMPLE QUERIES:                                      │
│                                                      │
│ Get all images for a site:                          │
│ SELECT * FROM site_extracted_images                 │
│ WHERE site_id = 'xyz'                               │
│ ORDER BY created_at DESC;                           │
│                                                      │
│ Get by type:                                        │
│ SELECT * FROM site_extracted_images                 │
│ WHERE site_id = 'xyz' AND image_type = 'hero';     │
│                                                      │
│ Get failures:                                       │
│ SELECT * FROM site_extracted_images                 │
│ WHERE site_id = 'xyz'                               │
│ AND processing_status = 'failed';                   │
│                                                      │
│ Success rate by type:                               │
│ SELECT image_type,                                  │
│   COUNT(*) as total,                                │
│   SUM(CASE WHEN uploaded_url IS NOT NULL            │
│            THEN 1 ELSE 0 END) as uploaded,          │
│   ROUND(100.0 * SUM(...) / COUNT(*), 2) as pct     │
│ FROM site_extracted_images                          │
│ WHERE site_id = 'xyz'                               │
│ GROUP BY image_type;                                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 5. Integration Points

### Site Generation Flow

```
POST /api/sites/generate
    ↓
[1] Parse input, create job
    ↓
[2] Scrape website (if basedOnWebsite provided)
    ├─ discoverAndScrapePages()
    └─ analyzeScrapedWebsite()
        ├─ extractBusinessInfoWithLLM()
        │   ├─ Phase 1: Visual brand
        │   ├─ Phase 2A: Contact
        │   ├─ Phase 2B: Content
        │   ├─ Phase 2C: Social proof
        │   └─ Phase 2D: Images (ALL TYPES) ← ENHANCED
        │       └─ mergeExtractionResults()
        │           └─ extractedImages.{hero,gallery,product,...}
        └─ Return analyzed.businessInfo with ALL image types
    ↓
[3] PROCESS IMAGES ← NEW STEP
    ├─ Collect all image types from extractedImages
    ├─ batchProcessImages(
    │   allImages,           // 50 images of 6 types
    │   tempSiteId,
    │   userId,
    │   { parallel: 3 }      // 3 concurrent downloads
    │ )
    ├─ Each image:
    │   ├─ Validate URL safety
    │   ├─ Download (timeout: 30s)
    │   ├─ Verify magic bytes
    │   ├─ Validate type-specific config
    │   ├─ Upload to S3 (type-specific dir)
    │   └─ Return ProcessedImage
    └─ Result: BatchProcessingResult with success/failure breakdown
    ↓
[4] STORE IN DATABASE ← NEW STEP
    ├─ storeExtractedImages(jobId, processedImages)
    └─ site_extracted_images table now populated
    ↓
[5] Background processing (unchanged)
    ├─ generateSiteContent()
    ├─ moderateContent()
    ├─ createSiteFromGenerated()
    └─ Site created with:
        ├─ Hero images in hero sections
        ├─ Product images in product sections
        └─ Other images as configured
    ↓
[6] Return 202 Accepted
```

---

## 6. File Structure

```
src/lib/storage/
├─ image-processor.ts           ← UNIFIED PROCESSOR (new)
│  ├─ Types & Interfaces
│  ├─ Type Configurations (size/MIME limits per type)
│  ├─ Helper Functions
│  │  ├─ isUrlSafe()
│  │  ├─ detectImageType()
│  │  ├─ downloadImage()
│  │  ├─ validateImageConfig()
│  │  └─ uploadToS3()
│  └─ Main Functions
│     ├─ downloadAndProcessImage()
│     └─ batchProcessImages()
│
├─ logo-processor.ts            ← Legacy (can wrap image-processor)
└─ hero-image-processor.ts       ← Legacy (can wrap image-processor)

src/lib/database/
└─ extracted-images.ts          ← DATABASE HELPERS (new)
   ├─ storeExtractedImages()
   ├─ getExtractedImages()
   ├─ getImagesByStatus()
   └─ updateImageStatus()

src/lib/scraping/
├─ llm-extractor.ts             ← PHASE 2D ENHANCEMENT
│  └─ mergeExtractionResults()   ← Organize by image type
│
└─ content-extractor.ts         ← TYPE UPDATE
   └─ ExtractedBusinessInfo     ← Add extractedImages field

app/api/sites/
├─ generate/route.ts            ← INTEGRATION POINT
│  └─ Call batchProcessImages() after analyzeScrapedWebsite()
│
└─ [siteId]/images/route.ts      ← NEW ENDPOINT
   └─ GET /api/sites/{siteId}/images

supabase/migrations/
└─ 20250[DATE]_add_site_extracted_images.sql ← NEW SCHEMA
   └─ site_extracted_images table with RLS
```

---

## 7. Success Metrics

### Before Implementation
```
Extracted Images:  50 total, 6 types
Processed Images:  2-3 (hero + gallery)
Uploaded to S3:    2-3
Site Generation:   Uses only hero image
Usefulness:        ~5% of extracted data
```

### After Implementation
```
Extracted Images:  50 total, 6 types
Processed Images:  45-48 (success rate ~90%)
Uploaded to S3:    45-48
Site Generation:   Uses all 6 types
Usefulness:        ~90% of extracted data
```

### Performance Targets
```
Single Image Processing:   5-6 seconds
Batch of 10 Images:       20-30 seconds (3 concurrent)
Processing Success Rate:  90%+ (non-critical failures don't stop job)
Database Storage Impact:  <100ms to store 50 images
API Response Time:        <200ms for image queries
```

