# Image Extraction Implementation Quickstart

Quick reference for implementing the comprehensive image extraction strategy.

---

## Document Navigation

| Document | Purpose | Read If... |
|----------|---------|-----------|
| **IMAGE_EXTRACTION_SUMMARY.md** | Executive overview | You want the big picture (5 min read) |
| **IMAGE_EXTRACTION_STRATEGY.md** | Detailed strategy and architecture | You're planning the implementation (15 min read) |
| **PHASE_2D_ENHANCEMENT.md** | Data flow changes | You're implementing Phase 2D updates (10 min read) |
| **IMAGE_PROCESSOR_IMPLEMENTATION.md** | Production-ready code | You're writing the processor code (30 min read) |
| **IMPLEMENTATION_QUICKSTART.md** | This file - quick reference | You need quick command/checklist reference |

---

## Three-Part Implementation

```
PART 1: Phase 2D Enhancement (preserve all image types)
         └─ Files: content-extractor.ts, llm-extractor.ts
         └─ Time: 1-2 days
         └─ Risk: Low (data structure changes only)

PART 2: Unified Image Processor (download & upload all types)
         └─ Files: image-processor.ts (new), image-processor.test.ts (new)
         └─ Time: 3-4 days
         └─ Risk: Medium (new processor pattern)

PART 3: Database & Integration (persist and use images)
         └─ Files: migration, extracted-images.ts (new), generate/route.ts
         └─ Time: 3-4 days
         └─ Risk: Medium (schema migration, integration points)
```

---

## Development Checklist

### Prerequisite Knowledge
- [ ] Read IMAGE_EXTRACTION_SUMMARY.md (overview)
- [ ] Understand current logo-processor.ts and hero-image-processor.ts
- [ ] Familiar with Supabase RLS and migrations
- [ ] Know how site generation flow works

### Part 1: Phase 2D Enhancement

**Files to modify**:
- `src/lib/scraping/content-extractor.ts`
- `src/lib/scraping/llm-extractor.ts`

**Checklist**:
```
[ ] Add extractedImages field to ExtractedBusinessInfo interface
    Type: Record<'hero'|'gallery'|'product'|'feature'|'team'|'other', ...>

[ ] Update mergeExtractionResults function
    - Distribute images by type into buckets
    - Store all types in result.extractedImages
    - Keep legacy heroImages for backwards compatibility
    - Keep heroSection.backgroundImage for UI compatibility

[ ] Add logging for image type distribution
    - Log count of each type
    - Log confidence averages

[ ] Run linting and typecheck
    $ pnpm lint
    $ pnpm typecheck

[ ] Write unit test for image type distribution
    File: src/lib/scraping/__tests__/llm-extractor.test.ts

[ ] Test with real website extraction
    $ pnpm dev
    # Generate site from scraped website, verify all types captured
```

**Success Criteria**:
- All 6 image types (hero, gallery, product, feature, team, other) preserved
- Backwards compatibility maintained (heroImages still works)
- Logging shows image counts by type
- Tests pass

---

### Part 2: Unified Image Processor

**New file to create**:
- `src/lib/storage/image-processor.ts`

**Optional (for backwards compatibility)**:
- Update `logo-processor.ts` to use `image-processor.ts` internally
- Update `hero-image-processor.ts` to use `image-processor.ts` internally

**Checklist**:
```
[ ] Create image-processor.ts with:
    - Type definitions (ImageType, ImageValidationConfig, ProcessedImage, etc.)
    - Configuration for each image type (max size, min dimensions, MIME types)
    - Helper functions:
      * isUrlSafe() - SSRF prevention
      * detectImageType() - Magic byte detection
      * downloadImage() - Download with timeout
      * validateImageConfig() - Type-specific validation
      * uploadToS3() - S3 upload
    - Main functions:
      * downloadAndProcessImage() - Single image
      * batchProcessImages() - Parallel batch

[ ] Add magic bytes and extension mappings
    - JPEG, PNG, WebP, GIF, SVG, ICO support
    - getExtensionFromMimeType() helper

[ ] Type-specific configurations:
    - Hero: 10MB, 800x400 min
    - Product: 5MB, 200x200 min
    - Gallery: 5MB, 150x150 min
    - Feature: 5MB, 150x150 min
    - Team: 3MB, 100x100 min
    - Logo: 5MB, no min dimensions
    - Other: 5MB, no min dimensions

[ ] Batch processing with queue:
    - Concurrency limit (default 3)
    - Error resilience (continue on failures)
    - Detailed logging

[ ] Run linting and typecheck
    $ pnpm lint
    $ pnpm typecheck

[ ] Write unit tests
    File: src/lib/storage/__tests__/image-processor.test.ts
    Test: URL safety, image detection, batch processing

[ ] Integration test
    - Process mix of image types
    - Verify S3 uploads go to correct directories
    - Verify error handling

[ ] Performance test
    - Time batch of 10 images
    - Verify concurrency is working
    - Check memory usage
```

**Success Criteria**:
- All image types processed with type-specific validation
- URL safety validation prevents SSRF attacks
- Batch processing respects concurrency limit
- S3 uploads to type-specific directories (hero-images/, product-images/, etc.)
- Errors are logged but don't stop batch
- Tests pass

---

### Part 3: Database & Integration

**New files**:
- `supabase/migrations/20250[DATE]_add_site_extracted_images.sql`
- `src/lib/database/extracted-images.ts` (helpers)

**Modified files**:
- `app/api/sites/generate/route.ts` (add image processing)
- `src/lib/types/site-generation-jobs.ts` (add processedImages)

**Checklist**:
```
[ ] Create database migration
    Table: site_extracted_images
    Columns: id, site_id, original_url, uploaded_url, image_type,
             context, selector, alt_text, dimensions, extraction_confidence,
             processing_status, error_message, file_size, mime_type, file_name,
             created_at, updated_at

    Indexes: site_id, image_type, processing_status
    RLS: Enable and create policies
    Triggers: auto update_at

[ ] Test migration locally
    $ pnpm supabase:start
    $ pnpm supabase:migrations:apply
    # Verify table created with correct schema

[ ] Create database helpers (extracted-images.ts)
    Functions:
    - storeExtractedImages() - Save processed images
    - getExtractedImages() - Query by site
    - getImagesByStatus() - Query by processing status
    - updateImageStatus() - Update after processing

[ ] Integrate with site generation (generate/route.ts)
    After analyzeScrapedWebsite():
    - Collect all image types from extractedImages
    - Call batchProcessImages()
    - Store results with storeExtractedImages()
    - Pass to scrapedContext for background processor

[ ] Update type definitions
    File: src/lib/types/site-generation-jobs.ts
    Add: processedImages field to ScrapedWebsiteContext

[ ] Add image management API endpoint
    File: app/api/sites/[siteId]/images/route.ts
    Methods: GET (with type/status filters)

[ ] Run linting and typecheck
    $ pnpm lint
    $ pnpm typecheck

[ ] Integration test
    - Generate site from scraped website
    - Verify images processed and stored
    - Query API for images
    - Verify correct site_id relationship

[ ] Database test
    - Insert test images
    - Verify RLS policies work
    - Test indexes for performance

[ ] End-to-end test
    - Full site generation flow
    - All image types processed
    - Images stored in database
    - Images available via API
```

**Success Criteria**:
- Migration applied without errors
- Table created with correct schema and RLS
- All image types stored in database with correct status
- API returns images for a site
- User can only see images from their own sites (RLS)
- Processing errors logged but don't crash generation
- Performance acceptable (<1sec total for typical 10-image batch)

---

## Code References

### Key Files to Understand First

1. **Current image processing**:
   - `src/lib/storage/logo-processor.ts` - Pattern to follow
   - `src/lib/storage/hero-image-processor.ts` - Similar pattern

2. **LLM extraction**:
   - `src/lib/scraping/llm-extractor.ts` - How extraction works
   - `src/lib/scraping/prompts/image-extraction-prompt.ts` - What LLM extracts

3. **Site generation**:
   - `app/api/sites/generate/route.ts` - Where integration happens
   - `src/lib/jobs/background-processor.ts` - Background processing

### Function Signatures to Implement

```typescript
// image-processor.ts main functions
export async function downloadAndProcessImage(
  imageData: ExtractedImageData,
  siteId: string,
  userId: string
): Promise<ImageProcessingResult>

export async function batchProcessImages(
  images: ExtractedImageData[],
  siteId: string,
  userId: string,
  options?: { parallel?: number; stopOnError?: boolean }
): Promise<BatchProcessingResult>

// extracted-images.ts database helpers
export async function storeExtractedImages(
  siteId: string,
  images: ProcessedImage[]
): Promise<boolean>

export async function getExtractedImages(
  siteId: string,
  imageType?: string
)

// API endpoint in generate/route.ts
// Call batchProcessImages after analyzeScrapedWebsite
const batchResult = await batchProcessImages(
  allImages,
  tempSiteId,
  user.id,
  { parallel: 3 }
)
```

---

## Testing Commands

```bash
# Type checking (required before commit)
pnpm typecheck

# Linting (required before commit)
pnpm lint

# Run all tests
pnpm test:all

# Run specific test file
pnpm jest src/lib/storage/__tests__/image-processor.test.ts

# Run tests in watch mode during development
pnpm jest --watch src/lib/storage/__tests__/image-processor.test.ts

# Test database migration locally
pnpm supabase:start
pnpm supabase:migrations:list
pnpm supabase:db:push

# Full dev environment
pnpm dev:all
```

---

## Debugging Tips

### Phase 2D: Verify image types are preserved

```typescript
// In llm-extractor.ts after image extraction
if (EXTRACTION_FLAGS.LOG_METRICS) {
  console.log('Phase 2D extracted images:');
  result.extractedImages && Object.entries(result.extractedImages).forEach(([type, imgs]) => {
    console.log(`  ${type}: ${imgs?.length || 0}`);
  });
}

// Check database
SELECT image_type, COUNT(*) FROM site_extracted_images
GROUP BY image_type;
```

### Image Processor: Check processing progress

```typescript
// Add logging in batchProcessImages
console.log(`[ImageProcessor] Processing: ${index + 1}/${images.length}`);

// Check S3 structure
aws s3 ls s3://your-bucket/temp-{jobId}/ --recursive

// Check database for failures
SELECT image_type, processing_status, error_message, COUNT(*)
FROM site_extracted_images
WHERE site_id = 'xyz'
GROUP BY image_type, processing_status, error_message;
```

### Integration: Trace site generation flow

```typescript
// Enable verbose logging
process.env.NEXT_PUBLIC_DEBUG_EXTRACTION = 'true'

// Check console output for:
// [${requestId}] [IMAGES] Processing {count} images...
// [ImageProcessor] Downloading from: {url}
// [ImageProcessor] ✅ {type}: {fileName}
// [ImageProcessor] Batch complete: {success} succeeded, {failed} failed
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **Phase 2D tests fail** | Verify extractedImages field added to interface; check merging logic |
| **Image processor timeout** | Increase DOWNLOAD_TIMEOUT (default 30s); check network issues |
| **S3 upload fails** | Verify presigned URL generation works; check S3 bucket permissions |
| **Database migration fails** | Run rollback; check Supabase logs; verify SQL syntax |
| **RLS policy blocks queries** | Verify auth.uid() matches user_id in sites table |
| **Batch processing slow** | Reduce concurrency limit; check network bandwidth; optimize image size |

---

## Performance Targets

After implementation, these should be achievable:

```
Image Processing Performance:
  • Download: <2 sec per image (typical)
  • Validation: <100ms per image
  • Upload to S3: <3 sec per image
  • Total per image: ~5-6 seconds

Batch Processing (10 images):
  • Concurrent: 3 downloads
  • Total time: 20-30 seconds
  • Memory: <50MB for 10-image batch

Database Operations:
  • Store 10 images: <500ms
  • Query by site: <100ms
  • RLS check: <50ms per query

Site Generation Impact:
  • Time to scrape: +30-40 sec for image processing
  • Total generation: Similar to before (parallel processing)
```

---

## Staging Verification Checklist

Before going to production:

```
[ ] Generated site includes hero image from extracted images
[ ] Gallery images appear in gallery sections
[ ] Product images appear in product sections
[ ] All image types visible in API (/api/sites/{id}/images)
[ ] Database correctly stores all image metadata
[ ] Errors gracefully handled (generation continues if 1 image fails)
[ ] Performance acceptable (<2 min total for site generation)
[ ] S3 storage correctly organized by type
[ ] Logging provides visibility into processing
[ ] RLS prevents users from seeing other users' images
[ ] No regression in logo or hero image processing
```

---

## Rollback Plan

If issues arise:

```
Immediate (revert to previous behavior):
1. Remove Phase 2D changes (revert heroImages logic)
2. Comment out batchProcessImages calls
3. Deploy previous version

If migration fails:
1. Rollback migration: pnpm supabase:migrations:rollback
2. Drop site_extracted_images table
3. Redeploy without database changes

If performance degrades:
1. Reduce concurrency: batchProcessImages(..., { parallel: 1 })
2. Process images asynchronously instead of during generation
3. Implement queue system (Bullmq, etc.)
```

---

## Success Metrics Dashboard

Track these after launch:

```sql
-- Images extracted vs processed
SELECT
  image_type,
  COUNT(*) as extracted,
  SUM(CASE WHEN uploaded_url IS NOT NULL THEN 1 ELSE 0 END) as processed,
  ROUND(100.0 * SUM(CASE WHEN uploaded_url IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM site_extracted_images
GROUP BY image_type;

-- Processing status breakdown
SELECT
  processing_status,
  COUNT(*) as count
FROM site_extracted_images
GROUP BY processing_status;

-- Failure analysis
SELECT
  image_type,
  COUNT(*) as failures
FROM site_extracted_images
WHERE processing_status = 'failed'
GROUP BY image_type;

-- Storage usage
SELECT
  image_type,
  COUNT(*) as count,
  ROUND(SUM(file_size) / 1024 / 1024 / 1024, 2) as size_gb
FROM site_extracted_images
WHERE uploaded_url IS NOT NULL
GROUP BY image_type;
```

---

## Timeline Estimate

```
Week 1: Phase 2D Enhancement
  Mon-Tue: Code changes (~4 hours)
  Wed: Testing and debugging (~3 hours)
  Thu: Code review and refinements (~2 hours)
  Fri: Staging deployment (~1 hour)

Week 2: Image Processor
  Mon-Tue: Implementation (~8 hours)
  Wed: Testing and optimization (~4 hours)
  Thu: Performance tuning (~2 hours)
  Fri: Code review (~2 hours)

Week 3: Integration
  Mon: Database migration (~2 hours)
  Tue: Site generation integration (~4 hours)
  Wed: Testing with real sites (~4 hours)
  Thu: Performance testing (~3 hours)
  Fri: Staging validation (~2 hours)

Week 4: Polish & Deployment
  Mon-Tue: API endpoints and UI (optional) (~6 hours)
  Wed: Monitoring/alerting setup (~3 hours)
  Thu: Final testing and docs (~3 hours)
  Fri: Production deployment (~2 hours)
```

**Total: 60-70 engineering hours over 4 weeks**

---

## Resources & Links

**Documentation in this repo**:
- IMAGE_EXTRACTION_SUMMARY.md
- IMAGE_EXTRACTION_STRATEGY.md
- PHASE_2D_ENHANCEMENT.md
- IMAGE_PROCESSOR_IMPLEMENTATION.md

**Code references**:
- `src/lib/storage/logo-processor.ts` - Pattern to follow
- `app/api/sites/generate/route.ts` - Integration point
- `src/lib/scraping/llm-extractor.ts` - Data flow

**Supabase docs**:
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Migrations](https://supabase.com/docs/guides/cli/managing-migrations)

**Relevant Node libraries**:
- `node-fetch` - HTTP requests (already in project)
- `sharp` - Image processing (optional, for optimization)
- `node-queue` - Task queuing (optional, for async processing)

---

## Questions?

Refer back to:
- **"Why this approach?"** → IMAGE_EXTRACTION_SUMMARY.md
- **"How does it fit together?"** → IMAGE_EXTRACTION_STRATEGY.md
- **"What code do I write?"** → IMAGE_PROCESSOR_IMPLEMENTATION.md
- **"How do I implement Phase 2D?"** → PHASE_2D_ENHANCEMENT.md

