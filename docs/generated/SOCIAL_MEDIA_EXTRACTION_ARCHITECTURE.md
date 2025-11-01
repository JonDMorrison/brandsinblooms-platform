# Social Media Extraction Architecture (Phase 2E)

## Overview

This document defines the architecture for adding social media link extraction to the LLM-based scraping system. This will be implemented as Phase 2E, running in parallel with existing Phase 2 extractions (contact info, content, social proof, images).

## 1. LLM Prompt Strategy

### System Prompt
Located in: `/src/lib/scraping/prompts/social-media-extraction-prompt.ts`

**Key Instructions for the LLM:**

1. **Platform Detection**: Identify links for 10+ major platforms (Facebook, Instagram, X/Twitter, LinkedIn, TikTok, YouTube, Pinterest, Snapchat, WhatsApp, Yelp)

2. **Search Priority**:
   - Footer sections (highest priority - 80% of sites place social links here)
   - Header/navigation areas
   - Contact or "About" sections
   - "Follow us" / "Connect with us" sections
   - Sidebar widgets
   - Embedded social share sections

3. **HTML Pattern Recognition**:
   - Direct anchor links: `<a href="https://facebook.com/business">`
   - Icon links with ARIA labels: `<a aria-label="Follow us on Instagram">`
   - CSS class names: `class="social-icon facebook"`
   - Font icons (FontAwesome): `<i class="fa-facebook">`
   - Schema.org markup: `<meta property="og:url">`
   - JSON-LD social profiles
   - Data attributes: `data-social="instagram"`

4. **URL Validation Rules**:
   - Extract complete URLs or clean paths
   - **Exclude** generic sharing links (facebook.com/sharer, twitter.com/intent/tweet)
   - **Exclude** privacy/terms pages
   - **Prefer** business pages over personal profiles
   - Normalize mobile URLs (m.facebook.com → facebook.com)
   - Handle country-specific domains
   - Handle protocol-relative URLs (//facebook.com → https://facebook.com)

5. **Confidence Scoring**:
   - **0.9-1.0**: Direct link in footer/header with clear platform identification
   - **0.7-0.89**: Link in content area with social icon/class
   - **0.5-0.69**: Inferred from partial URL or context
   - **<0.5**: Low confidence, possibly incorrect

### User Prompt Builder
Function: `buildSocialMediaExtractionPrompt(params)`

**Parameters:**
- `html: string` - Preprocessed HTML content
- `url: string` - Base URL for context
- `businessName?: string` - Business name for validation (optional)

**Output:** Formatted prompt with website context and HTML content

## 2. Response Schema

### TypeScript Interface
Located in: `/src/lib/types/extraction-schemas.ts`

```typescript
interface SocialMediaExtractionResponse {
  socialLinks: Array<{
    platform: 'facebook' | 'instagram' | 'twitter' | 'x' | 'linkedin' |
              'tiktok' | 'youtube' | 'pinterest' | 'snapchat' |
              'whatsapp' | 'yelp';
    url: string;                    // Complete URL to business profile
    confidence: number;              // 0.0-1.0
    location: 'footer' | 'header' | 'content' | 'sidebar' | 'contact';
    extractionMethod: 'direct_link' | 'icon_link' | 'schema_markup' | 'inferred';
    username?: string;               // Extracted username/handle if available
    notes?: string;                  // Warnings or relevant context
  }>;

  extractionMetadata: {
    totalLinksFound: number;
    primarySocialSection?: string;   // "footer navigation" or "header"
    hasStructuredData: boolean;      // JSON-LD or schema.org present
    ambiguousLinks?: string[];       // URLs that were unclear
  };

  confidence: number;                // Overall extraction confidence
}
```

### Type Guard Function
```typescript
function hasMinimumSocialMediaData(data: SocialMediaExtractionResponse): boolean {
  return data.socialLinks.length > 0 && data.confidence >= 0.3;
}
```

## 3. Integration Pattern

### Phase 2E Extraction Function
Located in: `/src/lib/scraping/llm-extractor.ts`

```typescript
async function extractSocialMedia(
  textHtml: string,
  baseUrl: string,
  businessName?: string
): Promise<SocialMediaExtractionResponse | undefined> {
  try {
    const userPrompt = buildSocialMediaExtractionPrompt({
      html: textHtml,
      url: baseUrl,
      businessName
    });

    if (EXTRACTION_FLAGS.LOG_PROMPTS) {
      console.log('[LLM Extraction] Phase 2E prompt:', userPrompt.substring(0, 500));
    }

    const response = await generateWithOpenRouter<SocialMediaExtractionResponse>(
      userPrompt,
      SOCIAL_MEDIA_EXTRACTION_SYSTEM_PROMPT,
      PHASE2_OPTIONS,
      EXTRACTION_MODELS.TEXT
    );

    // Validate response has minimum social media data
    if (!hasMinimumSocialMediaData(response.content)) {
      console.warn('[LLM Extraction] Phase 2E returned no valid social links');
      return undefined;
    }

    return response.content;
  } catch (error: unknown) {
    const errorInfo = handleError(error);
    console.error('[LLM Extraction] Phase 2E extraction error:', errorInfo.message);
    return undefined;
  }
}
```

### Parallel Execution in Phase 2
Add to the `Promise.allSettled()` array in `extractBusinessInfoWithLLM()`:

```typescript
// Phase 2: Parallel extraction (ADD Phase 2E)
const phase2Results = await Promise.allSettled([
  extractContactInfo(textHtml, baseUrl),      // 2A
  extractContentStructure(textHtml, baseUrl), // 2B
  extractSocialProof(textHtml, baseUrl),      // 2C
  extractImages(imageHtml, baseUrl),          // 2D
  extractSocialMedia(textHtml, baseUrl, businessName) // 2E - NEW
]);
```

### Error Handling
```typescript
// Phase 2E: Social media links
if (phase2Results[4].status === 'fulfilled') {
  socialMediaData = phase2Results[4].value;
  metadata.phase2eComplete = true;

  if (EXTRACTION_FLAGS.LOG_METRICS) {
    console.log('[LLM Extraction] Phase 2E complete:');
    console.log(`  Social links found: ${socialMediaData?.socialLinks.length || 0}`);
    console.log(`  Platforms: ${socialMediaData?.socialLinks.map(l => l.platform).join(', ')}`);
    console.log(`  Confidence: ${socialMediaData?.confidence}`);
  }
} else {
  const errorInfo = handleError(phase2Results[4].reason);
  metadata.errors?.push(`Phase 2E failed: ${errorInfo.message}`);
  console.warn(`[LLM Extraction] Phase 2E failed: ${errorInfo.message}`);
}
```

### Merge into ExtractedBusinessInfo
Add to `mergeExtractionResults()` function:

```typescript
function mergeExtractionResults(
  visual?: VisualBrandAnalysisResponse,
  contact?: ContactExtractionResponse,
  content?: ContentExtractionResponse,
  socialProof?: SocialProofExtractionResponse,
  images?: ImageExtractionResponse,
  socialMedia?: SocialMediaExtractionResponse // NEW
): ExtractedBusinessInfo {
  // ... existing code ...

  // Add social media links
  if (socialMedia && hasMinimumSocialMediaData(socialMedia)) {
    result.socialMedia = socialMedia.socialLinks.map(link => ({
      platform: link.platform,
      url: link.url,
      username: link.username,
      confidence: link.confidence
    }));
  }

  return result;
}
```

## 4. Database Schema Recommendation

### Option A: JSONB Column (RECOMMENDED)
**Pros:**
- Simple, flexible schema
- Easy to add new platforms without migrations
- Natural fit for variable-length arrays
- Efficient storage with JSONB indexing

**Cons:**
- Slightly less efficient for querying specific platforms
- No foreign key constraints

**Implementation:**
```sql
-- Add to sites table
ALTER TABLE public.sites
ADD COLUMN social_media JSONB DEFAULT '[]';

-- Create GIN index for efficient queries
CREATE INDEX idx_sites_social_media
ON public.sites USING GIN (social_media);

-- Example data structure:
{
  "socialMedia": [
    {
      "platform": "facebook",
      "url": "https://facebook.com/business",
      "username": "business",
      "confidence": 0.95
    },
    {
      "platform": "instagram",
      "url": "https://instagram.com/business",
      "username": "business",
      "confidence": 0.90
    }
  ]
}

-- Query examples:
-- Find sites with Instagram
SELECT * FROM sites
WHERE social_media @> '[{"platform": "instagram"}]';

-- Find sites with any social media
SELECT * FROM sites
WHERE jsonb_array_length(social_media) > 0;
```

### Option B: Separate Table
**Pros:**
- Better normalization
- Easier to query/filter by platform
- Can add platform-specific metadata
- Foreign key constraints

**Cons:**
- More complex schema
- Additional JOINs required
- More migration overhead for new platforms

**Implementation:**
```sql
-- Create social media links table
CREATE TABLE public.site_social_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL CHECK (platform IN (
        'facebook', 'instagram', 'twitter', 'x', 'linkedin',
        'tiktok', 'youtube', 'pinterest', 'snapchat',
        'whatsapp', 'yelp'
    )),
    url TEXT NOT NULL,
    username VARCHAR(255),
    confidence DECIMAL(3, 2),
    extraction_method VARCHAR(20),
    location VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Ensure one entry per platform per site
    UNIQUE(site_id, platform)
);

-- Indexes
CREATE INDEX idx_site_social_media_site_id
ON public.site_social_media(site_id);

CREATE INDEX idx_site_social_media_platform
ON public.site_social_media(platform);

-- Query examples:
-- Get all social media for a site
SELECT * FROM site_social_media
WHERE site_id = '...';

-- Find sites with Instagram
SELECT DISTINCT s.*
FROM sites s
JOIN site_social_media sm ON s.id = sm.site_id
WHERE sm.platform = 'instagram';
```

### Recommendation: **Option A (JSONB Column)**

**Rationale:**
1. **Simpler schema**: Fewer tables to manage
2. **Flexible**: Easy to add metadata without migrations
3. **Performance**: JSONB is well-optimized in PostgreSQL
4. **Common pattern**: Matches how other scraped data is stored (business_hours is already JSONB)
5. **Atomic updates**: All social links updated together
6. **Better DX**: Easier to work with in TypeScript (single object vs JOIN queries)

## 5. Edge Cases to Handle

### LLM Extraction Layer

1. **Multiple Links to Same Platform**
   - Priority: Footer > Header > Content
   - Choose most prominent location
   - Include note if multiple found

2. **Shortened URLs**
   - Extract as-is (bit.ly, tinyurl, etc.)
   - Add note: "shortened URL - may need expansion"
   - Set confidence to 0.7 max

3. **Social Sharing vs Profile Links**
   - Exclude: `facebook.com/sharer.php`, `twitter.com/intent/tweet`
   - Include: `facebook.com/businessname`, `twitter.com/businessname`
   - Pattern matching for common share endpoints

4. **Platform Name Changes**
   - Recognize both "twitter.com" and "x.com"
   - Return platform as "x" for both
   - Note original URL in response

5. **Ambiguous Links**
   - Include in `ambiguousLinks` array
   - Set confidence < 0.5
   - Add explanatory note

6. **No Social Links Found**
   - Return empty array with metadata
   - Confidence: 0.0
   - Note: "No social media links detected"

### Application Layer

7. **Stale Data**
   - Store extraction timestamp
   - Re-scrape periodically (every 30-90 days)
   - Allow manual refresh

8. **Invalid/Dead Links**
   - Optional: Validate URLs with HEAD request
   - Track last validated timestamp
   - Mark as "unverified" if validation fails

9. **User Overrides**
   - Allow manual addition/editing of social links
   - Mark as "user_provided" vs "extracted"
   - Don't overwrite user-provided links on re-scrape

10. **Privacy Considerations**
    - Only extract public business profiles
    - Don't extract personal social media
    - Respect robots.txt and scraping policies

## 6. Implementation Checklist

- [ ] Create prompt file: `src/lib/scraping/prompts/social-media-extraction-prompt.ts`
- [ ] Add schema to: `src/lib/types/extraction-schemas.ts`
- [ ] Add extraction function to: `src/lib/scraping/llm-extractor.ts`
- [ ] Update Phase 2 parallel execution
- [ ] Update result merging logic
- [ ] Add database migration for JSONB column
- [ ] Update TypeScript database types
- [ ] Add unit tests for extraction logic
- [ ] Update API to return social media links
- [ ] Update UI to display social icons/links
- [ ] Add analytics tracking for social link clicks

## 7. Cost & Performance Impact

### Cost Analysis
- **Current Phase 2**: 4 parallel extractions
- **With Phase 2E**: 5 parallel extractions
- **Additional cost**: ~$0.0002 per scrape (negligible)
- **Total scrape cost**: ~$0.0012 (was $0.0010)

### Performance Impact
- **Parallel execution**: No latency increase
- **Phase 2 still completes in**: 10-15 seconds
- **Network overhead**: Minimal (same OpenRouter endpoint)

### Model Selection
- Use `grok-code-fast-1` (same as other Phase 2 extractions)
- Fast, cost-effective, accurate for structured extraction

## 8. Testing Strategy

### Unit Tests
```typescript
describe('Social Media Extraction', () => {
  test('extracts footer social links', async () => {
    const html = `
      <footer>
        <a href="https://facebook.com/mybusiness">Facebook</a>
        <a href="https://instagram.com/mybusiness">Instagram</a>
      </footer>
    `;
    const result = await extractSocialMedia(html, 'https://example.com');
    expect(result?.socialLinks).toHaveLength(2);
    expect(result?.socialLinks[0].platform).toBe('facebook');
  });

  test('excludes social sharing buttons', async () => {
    const html = `
      <div>
        <a href="https://facebook.com/sharer.php">Share</a>
        <a href="https://twitter.com/intent/tweet">Tweet</a>
      </div>
    `;
    const result = await extractSocialMedia(html, 'https://example.com');
    expect(result?.socialLinks).toHaveLength(0);
  });

  test('handles missing social links gracefully', async () => {
    const html = '<div>No social links here</div>';
    const result = await extractSocialMedia(html, 'https://example.com');
    expect(result).toBeUndefined();
  });
});
```

### Integration Tests
- Test against real website HTML samples
- Verify extraction across different website builders (Squarespace, Wix, WordPress)
- Test confidence scoring accuracy
- Validate platform normalization (twitter.com vs x.com)

## 9. Future Enhancements

1. **Link Validation Service**
   - Periodic background job to validate URLs
   - Mark dead/redirected links
   - Update confidence scores based on validation

2. **Platform-Specific Metadata**
   - Extract follower counts (if publicly visible)
   - Extract profile descriptions
   - Extract profile images

3. **Social Media Analytics**
   - Track which platforms are most common
   - Track extraction accuracy over time
   - A/B test different prompts

4. **User Interface Improvements**
   - Visual social media icon links on rendered sites
   - Admin dashboard showing social media presence
   - One-click social link verification

5. **Additional Platforms**
   - Discord servers
   - Telegram channels
   - Medium blogs
   - GitHub organizations
   - Dribbble/Behance portfolios

## 10. Success Metrics

- **Extraction accuracy**: >90% for sites with visible social links
- **False positive rate**: <5%
- **Coverage**: Extract links from 70%+ of scraped sites
- **Performance**: No increase in Phase 2 latency
- **Cost**: <10% increase in per-scrape cost
