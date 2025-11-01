# Social Media Extraction - Executive Summary

## What This Adds

Phase 2E adds automatic extraction of social media profile links from scraped websites, running in parallel with existing extractions (contact info, content, social proof, images).

## Key Design Decisions

### 1. LLM-Based Extraction (Not Regex)
**Why:** Website builders constantly change their HTML structure. The LLM understands context and intent, making extraction self-healing and builder-agnostic.

**Platforms Detected:** Facebook, Instagram, X/Twitter, LinkedIn, TikTok, YouTube, Pinterest, Snapchat, WhatsApp, Yelp

### 2. Database Storage: JSONB Column (Not Separate Table)
**Schema:**
```sql
ALTER TABLE sites ADD COLUMN social_media JSONB DEFAULT '[]';
```

**Why JSONB:**
- Simpler schema (fewer JOINs)
- Flexible (easy to add new platforms without migrations)
- Performant (PostgreSQL JSONB is well-optimized)
- Consistent (matches pattern for business_hours)
- Atomic updates (all links updated together)

**Example Data:**
```json
{
  "social_media": [
    {
      "platform": "facebook",
      "url": "https://facebook.com/mybusiness",
      "username": "mybusiness",
      "confidence": 0.95
    },
    {
      "platform": "instagram",
      "url": "https://instagram.com/mybusiness",
      "username": "mybusiness",
      "confidence": 0.90
    }
  ]
}
```

### 3. Parallel Execution (No Latency Impact)
Phase 2E runs alongside existing Phase 2 extractions:
- Phase 2A: Contact info
- Phase 2B: Content structure
- Phase 2C: Social proof
- Phase 2D: Images
- **Phase 2E: Social media (NEW)**

All execute in parallel via `Promise.allSettled()`, so total extraction time remains 10-15 seconds.

### 4. Cost-Effective
- **Model:** `grok-code-fast-1` (same as other Phase 2 extractions)
- **Cost per scrape:** ~$0.0002 additional (negligible)
- **Total scrape cost:** ~$0.0012 (was $0.0010)

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    SCRAPING FLOW                          │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
        ┌────────────────────────────────────┐
        │   Phase 1: Visual Analysis         │
        │   (brand colors, logo, fonts)      │
        └────────────────────────────────────┘
                           │
                           ▼
        ┌────────────────────────────────────┐
        │   Phase 2: Parallel Extraction     │
        │                                     │
        │   ┌──────────┬──────────┬────────┐ │
        │   │ Contact  │ Content  │ Social │ │
        │   │   Info   │Structure │ Proof  │ │
        │   └──────────┴──────────┴────────┘ │
        │   ┌──────────┬──────────┐          │
        │   │  Images  │  Social  │          │
        │   │          │  Media   │  NEW     │
        │   └──────────┴──────────┘          │
        └────────────────────────────────────┘
                           │
                           ▼
        ┌────────────────────────────────────┐
        │   Merge Results → Database         │
        └────────────────────────────────────┘
```

## How It Works

### Input (HTML Preprocessed Text)
```html
<footer>
  <nav class="social-links">
    <a href="https://facebook.com/mybusiness" aria-label="Facebook">
      <i class="fa-facebook"></i>
    </a>
    <a href="https://instagram.com/mybusiness" aria-label="Instagram">
      <i class="fa-instagram"></i>
    </a>
  </nav>
</footer>
```

### LLM Analysis
The LLM:
1. Searches footer, header, and content sections
2. Identifies platform types from URLs and icons
3. Extracts URLs and usernames
4. Filters out social sharing buttons
5. Scores confidence based on location and clarity

### Output (Structured JSON)
```json
{
  "socialLinks": [
    {
      "platform": "facebook",
      "url": "https://facebook.com/mybusiness",
      "username": "mybusiness",
      "confidence": 0.95,
      "location": "footer",
      "extractionMethod": "direct_link"
    },
    {
      "platform": "instagram",
      "url": "https://instagram.com/mybusiness",
      "username": "mybusiness",
      "confidence": 0.92,
      "location": "footer",
      "extractionMethod": "icon_link"
    }
  ],
  "extractionMetadata": {
    "totalLinksFound": 2,
    "primarySocialSection": "footer navigation",
    "hasStructuredData": false
  },
  "confidence": 0.93
}
```

## Edge Cases Handled

1. **Multiple links to same platform** - Chooses most prominent (footer > header > content)
2. **Social sharing vs profile links** - Filters out sharing buttons (facebook.com/sharer)
3. **Platform name changes** - Recognizes both twitter.com and x.com
4. **Shortened URLs** - Extracts but notes as unverified
5. **No links found** - Returns empty array gracefully
6. **Invalid/ambiguous links** - Lower confidence score with explanatory notes

## Files Created

### Core Implementation
1. **Prompt File:** `/src/lib/scraping/prompts/social-media-extraction-prompt.ts`
   - System prompt with extraction rules
   - User prompt builder function

2. **Type Definitions:** `/src/lib/types/extraction-schemas.ts`
   - `SocialMediaExtractionResponse` interface
   - `hasMinimumSocialMediaData()` type guard
   - Updated `ExtractionMetadata`

3. **Database Migration:** `/supabase/migrations/20251101000000_add_social_media_to_sites.sql`
   - Adds `social_media JSONB` column to `sites` table
   - Creates GIN index for efficient queries
   - Includes helper functions and example queries

### Documentation
4. **Architecture Doc:** `SOCIAL_MEDIA_EXTRACTION_ARCHITECTURE.md`
   - Comprehensive design specification
   - Edge cases and testing strategy
   - Cost/performance analysis

5. **Implementation Guide:** `SOCIAL_MEDIA_IMPLEMENTATION_GUIDE.md`
   - Step-by-step instructions
   - Code snippets for each change
   - Verification checklist
   - Troubleshooting guide

6. **This Summary:** `SOCIAL_MEDIA_EXTRACTION_SUMMARY.md`
   - High-level overview
   - Key decisions and rationale

## Implementation Checklist

**Phase 1: Core Extraction** (Required)
- [ ] Add prompt file (already created)
- [ ] Update extraction schemas (already created)
- [ ] Add `extractSocialMedia()` function to llm-extractor.ts
- [ ] Update Phase 2 parallel execution
- [ ] Add result extraction logic
- [ ] Update merge function
- [ ] Update import statements

**Phase 2: Data Storage** (Required)
- [ ] Run database migration
- [ ] Regenerate TypeScript types (`pnpm generate-types`)
- [ ] Update `ExtractedBusinessInfo` type

**Phase 3: Testing** (Recommended)
- [ ] Create unit tests
- [ ] Test with real website HTML samples
- [ ] Verify extraction across different website builders
- [ ] Check database records

**Phase 4: Integration** (Optional)
- [ ] Update API to return social media links
- [ ] Add UI components to display social icons
- [ ] Add click tracking analytics

## Expected Outcomes

### Extraction Success Rate
- **Sites with visible social links:** 90%+ extraction accuracy
- **Sites without social links:** Graceful handling (empty array)
- **False positive rate:** <5%

### Performance Metrics
- **Latency:** No increase (parallel execution)
- **Phase 2 duration:** Still 10-15 seconds
- **Cost increase:** ~$0.0002 per scrape (20% increase, but negligible absolute cost)

### Database Queries
```sql
-- Find sites with Instagram
SELECT * FROM sites
WHERE social_media @> '[{"platform": "instagram"}]';

-- Count sites by platform
SELECT
  elem->>'platform' as platform,
  COUNT(*) as site_count
FROM sites, jsonb_array_elements(social_media) elem
GROUP BY elem->>'platform'
ORDER BY site_count DESC;

-- Get all social links for a site
SELECT
  elem->>'platform' as platform,
  elem->>'url' as url,
  elem->>'username' as username
FROM sites, jsonb_array_elements(social_media) elem
WHERE id = 'your-site-id';
```

## Integration Points

### 1. Scraping API
The extraction runs automatically during website scraping. No changes needed to API endpoints.

### 2. Generated Sites
Social media links can be displayed:
- In site footer
- On contact page
- As floating social icons
- In header navigation

### 3. Admin Dashboard
Potential uses:
- Show social media presence statistics
- Validate extracted links
- Manually add/edit social links
- Track which platforms are most common

## Next Steps After Implementation

1. **Monitor Phase 2E completion rate** - Check logs to ensure extraction is working
2. **Validate sample extractions** - Manually verify accuracy on 10-20 sites
3. **Add social icons to templates** - Display links on generated sites
4. **Track analytics** - Monitor which platforms are most popular
5. **Optimize prompts** - Refine based on extraction accuracy data

## Questions?

- **Full design spec:** See `SOCIAL_MEDIA_EXTRACTION_ARCHITECTURE.md`
- **Step-by-step guide:** See `SOCIAL_MEDIA_IMPLEMENTATION_GUIDE.md`
- **Code examples:** All files already created in `/src/lib/scraping/`
- **Database schema:** See migration in `/supabase/migrations/`

## Quick Start

To implement Phase 2E:

1. Review the implementation guide
2. Run the database migration
3. Add the extraction function to llm-extractor.ts
4. Update Phase 2 execution and merge logic
5. Test with a real website scrape
6. Verify social_media column is populated

Total implementation time: **1-2 hours** (assuming familiarity with codebase)
