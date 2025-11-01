# Phase 2D Enhancement: Comprehensive Image Type Handling

## Current State

Phase 2D (image-extraction-prompt.ts) already has a well-designed LLM prompt that extracts all image types:
- Hero/banner backgrounds
- Gallery images
- Product images
- Feature images
- Team photos
- Other images

**The extraction works well. The problem is in the merging and processing downstream.**

---

## Issue: Lost Image Types

Currently in `llm-extractor.ts`, the `mergeExtractionResults` function:

1. **Filters images by type** (lines 470-471):
```typescript
const heroImages = images.images.filter(img => img.type === 'hero');
const galleryImages = images.images.filter(img => img.type === 'gallery');
```

2. **Only processes hero and gallery** (lines 474-504):
```typescript
if (heroImages.length > 0) {
  result.heroSection.backgroundImage = heroImages[0].url;
  result.heroImages = heroImages;  // Stored but not processed
}

if (galleryImages.length > 0) {
  result.galleries = [{
    type: 'grid',
    images: galleryImages
  }];
}
```

3. **Discards product, feature, team, and other images** - they're extracted but never stored or processed.

---

## Solution: Preserve All Image Types

### Step 1: Update ExtractedBusinessInfo to Store All Types

**File**: `src/lib/scraping/content-extractor.ts`

Replace the current `heroImages` field with a comprehensive image collection:

```typescript
export interface ExtractedBusinessInfo {
  // ... existing fields ...

  // All extracted images by type (Phase 2D)
  extractedImages?: {
    hero?: Array<{
      url: string;
      context: string;
      selector: string;
      alt?: string;
      dimensions?: { width: number; height: number };
      confidence: number;
    }>;
    gallery?: Array<{
      url: string;
      context: string;
      selector: string;
      alt?: string;
      dimensions?: { width: number; height: number };
      confidence: number;
    }>;
    product?: Array<{
      url: string;
      context: string;
      selector: string;
      alt?: string;
      dimensions?: { width: number; height: number };
      confidence: number;
    }>;
    feature?: Array<{
      url: string;
      context: string;
      selector: string;
      alt?: string;
      dimensions?: { width: number; height: number };
      confidence: number;
    }>;
    team?: Array<{
      url: string;
      context: string;
      selector: string;
      alt?: string;
      dimensions?: { width: number; height: number };
      confidence: number;
    }>;
    other?: Array<{
      url: string;
      context: string;
      selector: string;
      alt?: string;
      dimensions?: { width: number; height: number };
      confidence: number;
    }>;
  };

  // Legacy fields (kept for backwards compatibility)
  // Deprecated: Use extractedImages instead
  heroImages?: Array<{
    url: string;
    context: string;
    alt?: string;
    dimensions?: { width: number; height: number };
    confidence: number;
  }>;
}
```

### Step 2: Update mergeExtractionResults in llm-extractor.ts

**File**: `src/lib/scraping/llm-extractor.ts`

Replace the image merging section (lines 468-505):

```typescript
// Process image extraction results (Phase 2D)
if (images && images.images.length > 0) {
  // Organize images by type
  const imagesByType: Record<string, typeof images.images> = {
    hero: [],
    gallery: [],
    product: [],
    feature: [],
    team: [],
    other: []
  };

  // Distribute images into type buckets
  images.images.forEach(img => {
    const type = img.type as keyof typeof imagesByType;
    if (type in imagesByType) {
      imagesByType[type].push(img);
    } else {
      imagesByType.other.push(img);
    }
  });

  // Store all image types
  result.extractedImages = {};

  // Hero images
  if (imagesByType.hero.length > 0) {
    result.extractedImages.hero = imagesByType.hero.map(img => ({
      url: img.url,
      context: img.context,
      selector: img.selector,
      alt: img.alt,
      dimensions: img.dimensions,
      confidence: img.confidence
    }));

    // Set primary hero for backwards compatibility
    if (!result.heroSection) {
      result.heroSection = {};
    }
    const primaryHero = result.extractedImages.hero.sort((a, b) => b.confidence - a.confidence)[0];
    result.heroSection.backgroundImage = primaryHero.url;

    // Also store in legacy heroImages for backwards compatibility
    result.heroImages = result.extractedImages.hero;
  }

  // Gallery images
  if (imagesByType.gallery.length > 0) {
    result.extractedImages.gallery = imagesByType.gallery.map(img => ({
      url: img.url,
      context: img.context,
      selector: img.selector,
      alt: img.alt,
      dimensions: img.dimensions,
      confidence: img.confidence
    }));

    // Create gallery structure (can be enhanced in the UI)
    result.galleries = [{
      type: 'grid',
      images: result.extractedImages.gallery.map(img => ({
        url: img.url,
        alt: img.alt,
        width: img.dimensions?.width,
        height: img.dimensions?.height
      }))
    }];
  }

  // Product images
  if (imagesByType.product.length > 0) {
    result.extractedImages.product = imagesByType.product.map(img => ({
      url: img.url,
      context: img.context,
      selector: img.selector,
      alt: img.alt,
      dimensions: img.dimensions,
      confidence: img.confidence
    }));
  }

  // Feature images
  if (imagesByType.feature.length > 0) {
    result.extractedImages.feature = imagesByType.feature.map(img => ({
      url: img.url,
      context: img.context,
      selector: img.selector,
      alt: img.alt,
      dimensions: img.dimensions,
      confidence: img.confidence
    }));
  }

  // Team images
  if (imagesByType.team.length > 0) {
    result.extractedImages.team = imagesByType.team.map(img => ({
      url: img.url,
      context: img.context,
      selector: img.selector,
      alt: img.alt,
      dimensions: img.dimensions,
      confidence: img.confidence
    }));
  }

  // Other images
  if (imagesByType.other.length > 0) {
    result.extractedImages.other = imagesByType.other.map(img => ({
      url: img.url,
      context: img.context,
      selector: img.selector,
      alt: img.alt,
      dimensions: img.dimensions,
      confidence: img.confidence
    }));
  }

  if (EXTRACTION_FLAGS.LOG_METRICS) {
    console.log('[LLM Extraction] Image extraction summary:');
    console.log(`  Hero: ${result.extractedImages.hero?.length || 0}`);
    console.log(`  Gallery: ${result.extractedImages.gallery?.length || 0}`);
    console.log(`  Product: ${result.extractedImages.product?.length || 0}`);
    console.log(`  Feature: ${result.extractedImages.feature?.length || 0}`);
    console.log(`  Team: ${result.extractedImages.team?.length || 0}`);
    console.log(`  Other: ${result.extractedImages.other?.length || 0}`);
  }
}
```

### Step 3: Update analyzeScrapedWebsite to Pass All Types

**File**: `src/lib/scraping/content-analyzer.ts`

Ensure the analyzer passes all extracted image types from the LLM extraction:

```typescript
export async function analyzeScrapedWebsite(pages: ScrapedPage[]): Promise<AnalysisResult> {
  // ... existing code ...

  // Extract business information using LLM
  const extractedInfo = await extractBusinessInfoWithLLM(
    combinedHtml,
    baseUrl,
    pages[0]?.screenshot
  );

  return {
    baseUrl,
    businessInfo: extractedInfo,  // Now includes extractedImages
    pages
  };
}
```

### Step 4: Update Site Generation to Use All Image Types

**File**: `app/api/sites/generate/route.ts`

In the scraped website processing section, collect and process all image types:

```typescript
// After analyzeScrapedWebsite() call:

if (analyzed.businessInfo.extractedImages) {
  console.log(`[${requestId}] [IMAGES] Extracted images found:`, {
    hero: analyzed.businessInfo.extractedImages.hero?.length || 0,
    gallery: analyzed.businessInfo.extractedImages.gallery?.length || 0,
    product: analyzed.businessInfo.extractedImages.product?.length || 0,
    feature: analyzed.businessInfo.extractedImages.feature?.length || 0,
    team: analyzed.businessInfo.extractedImages.team?.length || 0,
    other: analyzed.businessInfo.extractedImages.other?.length || 0
  });

  const tempSiteId = `temp-${job.id}`;

  // Flatten all images with type information
  const allImages = [
    ...(analyzed.businessInfo.extractedImages.hero || []).map(img => ({
      ...img,
      type: 'hero' as const
    })),
    ...(analyzed.businessInfo.extractedImages.gallery || []).map(img => ({
      ...img,
      type: 'gallery' as const
    })),
    ...(analyzed.businessInfo.extractedImages.product || []).map(img => ({
      ...img,
      type: 'product' as const
    })),
    ...(analyzed.businessInfo.extractedImages.feature || []).map(img => ({
      ...img,
      type: 'feature' as const
    })),
    ...(analyzed.businessInfo.extractedImages.team || []).map(img => ({
      ...img,
      type: 'team' as const
    })),
    ...(analyzed.businessInfo.extractedImages.other || []).map(img => ({
      ...img,
      type: 'other' as const
    }))
  ];

  if (allImages.length > 0) {
    console.log(`[${requestId}] [IMAGES] Processing ${allImages.length} images...`);

    // Use the unified image processor (from image-processor.ts)
    const batchResult = await batchProcessImages(
      allImages,
      tempSiteId,
      user.id,
      { parallel: 3 }
    );

    console.log(`[${requestId}] [IMAGES] Results:`, {
      success: batchResult.stats.success,
      failed: batchResult.stats.failed,
      totalSize: `${(batchResult.stats.totalSize / 1024 / 1024).toFixed(2)}MB`
    });

    // Store processed images in database
    if (batchResult.processed.length > 0) {
      await storeExtractedImages(job.id, batchResult.processed);
    }

    // Pass to background processor for site creation
    scrapedContext.processedImages = batchResult.processed;
  }
}
```

---

## Logging and Debugging

Add detailed logging to track image extraction:

```typescript
// In image-extraction-prompt.ts
if (EXTRACTION_FLAGS.LOG_METRICS) {
  console.log('[Phase 2D] Image extraction detailed breakdown:');
  response.content.images.forEach((img, idx) => {
    console.log(`  [${idx + 1}] ${img.type.toUpperCase()}`);
    console.log(`      URL: ${img.url}`);
    console.log(`      Context: ${img.context}`);
    console.log(`      Confidence: ${img.confidence}`);
    console.log(`      Selector: ${img.selector}`);
    if (img.dimensions) {
      console.log(`      Dimensions: ${img.dimensions.width}x${img.dimensions.height}`);
    }
  });
}
```

---

## Testing the Enhancement

### 1. Unit Test for Image Type Distribution

```typescript
// src/lib/scraping/__tests__/llm-extractor.test.ts

describe('Image type distribution in mergeExtractionResults', () => {
  it('should preserve all image types', () => {
    const imageResponse: ImageExtractionResponse = {
      images: [
        {
          url: 'https://example.com/hero.jpg',
          type: 'hero',
          context: 'background-image',
          selector: '.hero',
          confidence: 0.95
        },
        {
          url: 'https://example.com/product1.jpg',
          type: 'product',
          context: 'img-tag',
          selector: '.product-grid',
          confidence: 0.87
        },
        {
          url: 'https://example.com/product2.jpg',
          type: 'product',
          context: 'img-tag',
          selector: '.product-grid',
          confidence: 0.85
        },
        {
          url: 'https://example.com/team.jpg',
          type: 'team',
          context: 'img-tag',
          selector: '.team-member',
          confidence: 0.92
        }
      ],
      confidence: 0.9
    };

    // Call merge function
    const result = mergeExtractionResults(
      undefined,
      undefined,
      undefined,
      undefined,
      imageResponse
    );

    // Verify all types are preserved
    expect(result.extractedImages?.hero).toHaveLength(1);
    expect(result.extractedImages?.product).toHaveLength(2);
    expect(result.extractedImages?.team).toHaveLength(1);

    // Verify hero was set as primary
    expect(result.heroSection?.backgroundImage).toBe('https://example.com/hero.jpg');
  });
});
```

### 2. Integration Test with Scraped Website

```typescript
// Test with a real website that has multiple image types
const testWebsite = 'https://example-florist.com';  // Has hero, products, gallery, team

// Expected results:
// - 1-2 hero images from banner sections
// - 3-5 product images from product catalog
// - 4-6 gallery images from portfolio/gallery sections
// - 2-3 team images from about/team sections
```

---

## Backwards Compatibility

The enhancement maintains backwards compatibility:

1. **Legacy `heroImages` field** still populated for existing code
2. **`heroSection.backgroundImage`** still set for UI components expecting it
3. **`galleries`** array still created for gallery display
4. **New `extractedImages` structure** available for comprehensive access

This means:
- Existing components continue to work
- New components can use the comprehensive `extractedImages` object
- Gradual migration possible

---

## Migration Path

### Phase 1: Enable Image Type Preservation (Week 1)
1. Update ExtractedBusinessInfo interface
2. Update mergeExtractionResults to organize by type
3. Deploy with feature flag

### Phase 2: Extend Processing (Week 2)
1. Integrate unified image processor
2. Process all image types, not just hero
3. Store in database

### Phase 3: UI Integration (Week 3)
1. Update site editor to show extracted images
2. Allow users to select images for sections
3. Add image management interface

### Phase 4: Advanced Features (Week 4)
1. Image optimization pipeline
2. Responsive image generation
3. Analytics and performance tracking

---

## Monitoring

Track these metrics post-deployment:

```typescript
interface ImageExtractionMetrics {
  // Count of images by type
  imagesExtracted: Record<'hero' | 'gallery' | 'product' | 'feature' | 'team' | 'other', number>;

  // Processing success rate
  processingSuccessRate: number;

  // Average confidence by type
  confidenceByType: Record<string, number>;

  // Failure reasons
  failureReasons: Record<string, number>;

  // Average processing time per image
  avgProcessingTime: number;
}
```

Example logging:

```typescript
if (EXTRACTION_FLAGS.LOG_METRICS) {
  const metrics = {
    imagesExtracted: {
      hero: result.extractedImages?.hero?.length || 0,
      gallery: result.extractedImages?.gallery?.length || 0,
      product: result.extractedImages?.product?.length || 0,
      feature: result.extractedImages?.feature?.length || 0,
      team: result.extractedImages?.team?.length || 0,
      other: result.extractedImages?.other?.length || 0
    },
    totalImages: images.images.length,
    avgConfidence: images.confidence
  };

  console.log('[LLM Extraction] Image metrics:', metrics);
}
```

---

## Summary

The Phase 2D enhancement is **minimal and focused**:

1. **Update data structures** to preserve all image types
2. **Reorganize extraction results** by type
3. **Pass downstream** to processing pipeline
4. **Maintain backwards compatibility** with existing code

This unblocks the unified image processor to handle all image types, not just hero images.

