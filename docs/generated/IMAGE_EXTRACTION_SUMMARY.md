# Image Extraction Strategy: Executive Summary

## The Situation

Your LLM-first image extraction system works but is **only partially utilized**:
- Phase 2D extracts all image types (hero, gallery, product, feature, team, other)
- Only logos and hero images are downloaded, processed, and uploaded
- Gallery, product, feature, and team images are extracted but discarded
- **Result: 80% of useful visual content is being thrown away**

---

## The Problem

### 1. Information Loss in Data Flow
```
LLM Extraction → Merges to ExtractedBusinessInfo → Site Generation
  ✅ Extracts 50+ images of all types
  ❌ Keeps only hero in heroImages array
  ❌ Discards product, feature, team images
  ❌ Gallery stored but not processed
```

### 2. Limited Processing
- Only 2 image processors exist: `logo-processor.ts` and `hero-image-processor.ts`
- No processors for the other 4+ image types
- New images are never downloaded or uploaded to S3
- Extracted URLs remain external/unusable

### 3. No Database Schema
- Extracted image metadata is never persisted
- No way to query "what images were extracted for this site?"
- No audit trail or re-processing capability
- Site editor has no image library to work with

---

## The Solution

### Architecture: Three-Part Enhancement

```
┌─────────────────────────────────────────────────────────┐
│ PART 1: PHASE 2D ENHANCEMENT (Data Flow)               │
│ • Preserve all image types in data structures           │
│ • Organize extraction results by type                   │
│ • Keep backwards compatibility                          │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ PART 2: UNIFIED IMAGE PROCESSOR (Processing)            │
│ • Single processor for all image types                  │
│ • Type-specific validation configs                      │
│ • Batch processing with concurrency control             │
│ • S3 storage in type-specific directories               │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ PART 3: DATABASE SCHEMA (Persistence)                   │
│ • site_extracted_images table                           │
│ • Track processing status and results                   │
│ • Enable image management in site editor                │
│ • Support analytics and debugging                       │
└─────────────────────────────────────────────────────────┘
```

---

## Questions Answered

| Question | Answer | Implementation |
|----------|--------|-----------------|
| **Enhance Phase 2D?** | Minimally - reorganize data, not extraction | PHASE_2D_ENHANCEMENT.md |
| **Store multiple types?** | Yes, new table `site_extracted_images` | IMAGE_PROCESSOR_IMPLEMENTATION.md (Section 2) |
| **Unified processor?** | Yes, `image-processor.ts` handles all types | IMAGE_PROCESSOR_IMPLEMENTATION.md (Section 1) |
| **Map to sections?** | Two approaches: auto (MVP) or manual (phase 2) | IMAGE_EXTRACTION_STRATEGY.md (Section: Questions Answered) |

---

## Implementation Overview

### Part 1: Phase 2D Enhancement (1-2 days)
**Files to modify**:
- `src/lib/scraping/content-extractor.ts` - Add extractedImages field
- `src/lib/scraping/llm-extractor.ts` - Organize images by type

**What changes**:
```typescript
// Before: only heroImages preserved
heroImages?: Array<{ url, context, alt, ... }>

// After: all types preserved
extractedImages?: {
  hero?: [...],
  gallery?: [...],
  product?: [...],
  feature?: [...],
  team?: [...],
  other?: [...]
}
```

### Part 2: Unified Image Processor (3-4 days)
**New file**: `src/lib/storage/image-processor.ts`

**What it does**:
1. Unified download → validate → upload pipeline
2. Type-specific validation configs (size, dimensions, MIME types)
3. Batch processing with concurrency control
4. S3 storage in type-specific directories
5. Comprehensive error handling

**Key functions**:
- `downloadAndProcessImage()` - Single image processing
- `batchProcessImages()` - Parallel batch processing with queue management
- Type validation helpers
- Safe URL validation (SSRF prevention)

### Part 3: Database & Integration (3-4 days)
**New table**: `site_extracted_images`
- Stores metadata for all extracted images
- Tracks processing status (pending → uploaded → failed)
- Enables RLS for user access
- Persists extraction confidence and context

**Files to modify**:
- `app/api/sites/generate/route.ts` - Call batch processor
- `src/lib/jobs/site-generation-jobs.ts` - Add image storage
- New API endpoints for image management

**Migration file**: `supabase/migrations/20250[DATE]_add_site_extracted_images.sql`

---

## Implementation Phases

### Week 1: Phase 2D Enhancement
```
Mon-Tue: Update data structures to preserve all types
Wed: Update merging logic to organize by type
Thu: Add logging and metrics
Fri: Test and code review
```

### Week 2: Unified Image Processor
```
Mon-Tue: Implement image-processor.ts
Wed: Integrate with database helpers
Thu: Add error handling and logging
Fri: Unit tests and review
```

### Week 3: Site Generation Integration
```
Mon: Update generate/route.ts to use batch processor
Tue: Test with real websites
Wed: Performance testing (concurrency limits)
Thu: Fix issues, optimize
Fri: Staging deployment
```

### Week 4: Polish & Features
```
Mon-Tue: API endpoints for image management
Wed: Site editor UI integration (optional)
Thu: Analytics/monitoring setup
Fri: Production deployment
```

---

## Benefits

### For Users
- Sites include more diverse, higher-quality images
- Site editor can access full extracted image library
- Ability to customize which images are used
- Better visual representation of brand

### For System
- Unified, maintainable code for all image types
- Database persistence for debugging and analytics
- Scalable batch processing (3 concurrent downloads)
- Type-specific optimization opportunities

### For Business
- Reduced manual work in site customization
- Better AI-generated sites without human intervention
- Data for improving LLM extraction quality
- Foundation for image optimization and CDN integration

---

## Key Metrics to Track

Post-deployment, monitor:

```
Image Extraction Metrics:
  • Images extracted per site (by type)
  • Extraction confidence (avg by type)
  • Processing success rate
  • Time to process all images

Image Processing Metrics:
  • Download success rate
  • Validation failure reasons
  • Upload success rate
  • Processing time per image
  • Total storage used (by type)

System Health:
  • API error rates
  • Database query performance
  • S3 upload performance
  • Concurrent processing load
```

---

## Files Provided

### Documentation
1. **IMAGE_EXTRACTION_STRATEGY.md** - High-level strategy and architecture
2. **PHASE_2D_ENHANCEMENT.md** - Detailed Phase 2D data flow changes
3. **IMAGE_PROCESSOR_IMPLEMENTATION.md** - Production-ready code patterns
4. **IMAGE_EXTRACTION_SUMMARY.md** - This executive summary

### Code Locations (when implemented)
- `src/lib/storage/image-processor.ts` - Unified processor
- `src/lib/database/extracted-images.ts` - Database helpers
- `supabase/migrations/[timestamp]_add_site_extracted_images.sql` - Schema
- `app/api/sites/[siteId]/images/route.ts` - Image management API

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| **Phase 2D changes break existing code** | Keep legacy heroImages field; maintain backwards compatibility |
| **Batch processing overwhelms S3** | Start with concurrency=3; monitor and adjust based on metrics |
| **URL validation too strict** | Whitelist test domains; log all rejections for tuning |
| **Database migration fails** | Test on staging first; include rollback plan |
| **Processing takes too long** | Implement async job queue if needed; set configurable timeouts |

---

## Next Steps

1. **Review** this strategy and the three supporting documents
2. **Validate** the approach with team (backend, frontend, product)
3. **Refine** database schema based on RLS requirements
4. **Create tickets** for each implementation phase
5. **Schedule** implementation (4 weeks total, can overlap with other work)
6. **Deploy** to staging environment for testing with real websites

---

## Key Insights

### Why This Approach Works

1. **LLM Intelligence Preserved**
   - Don't replace LLM with heuristics
   - Let AI decide what images matter
   - Use confidence scores to prioritize

2. **Unified Processing Pipeline**
   - Reuse logo-processor security patterns
   - Consistent error handling across all types
   - Single point for optimization

3. **Database-First Design**
   - Extracted images are queryable and persistent
   - Enables future features (re-extraction, optimization)
   - Better debugging and analytics

4. **Backwards Compatible**
   - Existing code continues to work
   - Gradual migration to new structures
   - No risky cutover needed

### Why Current Approach Falls Short

- **Information loss**: Extraction works but results discarded
- **Scattered implementation**: Different processors for different types
- **No persistence**: Can't query what was extracted
- **Limited scalability**: Hard to add new image type handling

---

## Success Criteria

After implementation, verify:

- ✅ All extracted image types (hero, gallery, product, feature, team) are processed
- ✅ >90% of extracted images are successfully uploaded to S3
- ✅ Database tracks extraction and processing for all images
- ✅ Site generation completes in similar time (not significantly slower)
- ✅ No degradation in hero image processing (still works as before)
- ✅ New image types available in site editor for customization

---

## Conclusion

Your image extraction system has the right LLM-first philosophy and solid logo/hero processing patterns. The enhancement extends these strengths to handle ALL extracted image types comprehensively:

- **Simple data structure changes** in Phase 2D
- **Unified processor pattern** for consistency and maintainability
- **Database schema** for persistence and auditability
- **Progressive implementation** with minimal risk

**Timeline**: 4 weeks of engineering to unlock 80% more image utilization.

