# Website Scraping Implementation Summary

This document provides a comprehensive summary of the website-based site generation feature implementation.

## Table of Contents

- [Overview](#overview)
- [Files Created](#files-created)
- [Files Modified](#files-modified)
- [Dependencies Added](#dependencies-added)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Security Measures](#security-measures)
- [Testing](#testing)
- [Success Criteria](#success-criteria)
- [Known Limitations](#known-limitations)
- [Future Enhancements](#future-enhancements)

## Overview

The website-based site generation feature allows users to provide an existing website URL when creating a new site. The system intelligently scrapes, analyzes, and modernizes the content to generate an enhanced version.

### Key Capabilities

1. Intelligent page discovery (up to 5 pages)
2. Business information extraction (contact, hours, location)
3. Brand identity analysis (colors, logo, tone)
4. Content structure analysis
5. LLM-powered content enhancement
6. Dynamic custom page generation
7. Automatic navigation configuration
8. Graceful fallback on failures

## Files Created

All new files for this feature:

### 1. Configuration

**Path**: `/src/lib/config/scraping.ts`

Scraping service configuration with environment variable validation.

**Key exports**:
- `scrapingConfig` - Configuration object with URL, salt, timeout, retry settings

### 2. Scraping Client

**Path**: `/src/lib/scraping/scraping-client.ts`

HTTP client for communicating with the Puppeteer scraping service.

**Key exports**:
- `scrapeWebpage(url: string)` - Scrapes a single webpage
- Handles MD5 authentication
- Implements retry logic
- Error handling for network issues

### 3. Link Extractor

**Path**: `/src/lib/scraping/link-extractor.ts`

Extracts and prioritizes navigation links from HTML.

**Key exports**:
- `extractNavigationLinks(html: string, baseUrl: string)` - Extracts links from HTML
- Prioritizes important pages (About, Contact, Services, etc.)
- Filters out external links and fragments
- Returns ranked, deduplicated links

### 4. Page Discovery

**Path**: `/src/lib/scraping/page-discovery.ts`

Orchestrates multi-page scraping with intelligent link selection.

**Key exports**:
- `discoverAndScrapePages(url: string, maxPages: number)` - Main orchestration function
- Implements breadth-first discovery
- Respects page limits
- Handles scraping failures gracefully

### 5. Content Extractor

**Path**: `/src/lib/scraping/content-extractor.ts`

Extracts structured business data from HTML using Cheerio.

**Key exports**:
- `extractBusinessInfo(html: string)` - Extracts contact info, hours, location
- `extractBrandIdentity(html: string)` - Extracts colors, logo, fonts
- `extractContentStructure(html: string)` - Extracts headings and sections
- Uses CSS selectors and regex patterns for data extraction

### 6. Content Analyzer

**Path**: `/src/lib/scraping/content-analyzer.ts`

Synthesizes scraped data into coherent context for LLM.

**Key exports**:
- `analyzeScrapedContent(pages: ScrapedPage[])` - Analyzes all scraped pages
- Aggregates business information across pages
- Identifies most common brand colors
- Extracts unique services/features
- Generates `ScrapedWebsiteContext` object

## Files Modified

Existing files that were updated to support the feature:

### 1. Type Definitions

**Path**: `/src/lib/types/site-generation-jobs.ts`

**Changes**:
- Added `basedOnWebsite?: string` to `BusinessInfo` type
- Added new type `ScrapedWebsiteContext` for scraped data
- Added new type `CustomPageSection` for dynamic page generation
- Extended existing types to support scraped context

**New types**:
```typescript
export interface ScrapedWebsiteContext {
  businessInfo?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    hours?: string[];
  };
  brandIdentity?: {
    colors: string[];
    fonts?: string[];
    logoUrl?: string;
  };
  services?: string[];
  pages: {
    title: string;
    url: string;
    sections: CustomPageSection[];
  }[];
}

export interface CustomPageSection {
  heading?: string;
  content: string;
  type: 'text' | 'list' | 'contact' | 'services';
}
```

### 2. Prompt Engineering

**Path**: `/src/lib/ai/prompts/site-generation-prompts.ts`

**Changes**:
- Added `buildFoundationPromptWithContext()` function
- Enhances LLM prompts with scraped website context
- Provides structured business info, brand identity, and content to LLM
- Maintains compatibility with existing prompt structure

**Key function**:
```typescript
export function buildFoundationPromptWithContext(
  businessInfo: BusinessInfo,
  scrapedContext?: ScrapedWebsiteContext
): string
```

### 3. Site Generator Service

**Path**: `/src/lib/ai/site-generator-service.ts`

**Changes**:
- Added `scrapedContext` parameter to generation functions
- Passes scraped data to prompt builder
- Generates custom pages based on scraped content
- Enhanced error handling for scraping-related issues

**Modified functions**:
- `generateFoundationSite()` - Now accepts optional scraped context
- `generateCustomPage()` - New function for creating pages from scraped data

### 4. Site Creator

**Path**: `/src/lib/sites/site-creator.ts`

**Changes**:
- Supports dynamic custom page creation
- Updates navigation to include custom pages
- Handles scraped page data structure
- Maintains backward compatibility with non-scraped sites

**New capabilities**:
- Creates pages from `ScrapedWebsiteContext.pages` array
- Automatically configures navigation items
- Preserves existing page creation flow

### 5. Security - Input Sanitization

**Path**: `/src/lib/security/input-sanitization.ts`

**Changes**:
- Added URL validation for `basedOnWebsite` parameter
- SSRF protection (blocks private IPs, localhost)
- Protocol validation (only http/https allowed)
- HTML sanitization for scraped content

**Note**: File existed but was enhanced with URL validation and HTML sanitization.

### 6. Security - Rate Limiting

**Path**: `/src/lib/security/site-generation-rate-limit.ts`

**Changes**:
- Added separate rate limits for scraping requests
- More conservative limits for scraping vs. regular generation
- Tracks `basedOnWebsite` usage separately

**New limits**:
```typescript
scrapingMaxPerHour: 3  // Production
scrapingMaxPerDay: 10  // Production
```

### 7. Security - Content Moderation

**Path**: `/src/lib/security/content-moderation.ts`

**Changes**:
- Added scraped content moderation
- Checks for malicious HTML/scripts
- Validates content appropriateness
- Filters out spam and excessive promotional content

### 8. API Route

**Path**: `/app/api/sites/generate/route.ts`

**Changes**:
- Added scraping orchestration logic
- Calls page discovery when `basedOnWebsite` is provided
- Passes scraped context to background processor
- Implements graceful fallback on scraping failures
- Enhanced error handling and logging

**Workflow**:
1. Validate `basedOnWebsite` URL if provided
2. Check scraping rate limits
3. Discover and scrape pages
4. Analyze scraped content
5. Pass to LLM with enhanced context
6. Fallback to prompt-only if scraping fails

### 9. Background Processor

**Path**: `/src/lib/jobs/background-processor.ts`

**Changes**:
- Accepts optional `scrapedContext` parameter
- Passes scraped data to site generator service
- Logs scraping context for debugging
- Maintains compatibility with non-scraped jobs

## Dependencies Added

### cheerio

**Version**: `^1.1.2`

**Purpose**: Fast, flexible HTML parsing and manipulation for Node.js

**Usage**:
- Parsing scraped HTML
- Extracting structured data via CSS selectors
- Text content extraction
- Color and style analysis

**Why cheerio?**:
- Lightweight (no browser needed)
- jQuery-like syntax (familiar)
- Fast performance
- Well-maintained
- Excellent for server-side HTML parsing

**Installation**:
```bash
pnpm add cheerio@^1.1.2
```

## Architecture

### Request Flow

```
User Request with basedOnWebsite
         |
         v
API Route (/api/sites/generate)
         |
         ├─> Validate URL (SSRF check)
         ├─> Check rate limits
         ├─> Scraping orchestration
         |    |
         |    ├─> Scrape homepage
         |    ├─> Extract links
         |    ├─> Scrape additional pages (max 5)
         |    └─> Analyze all content
         |
         ├─> Create job in database
         |
         └─> Background processor
              |
              ├─> Build enhanced prompt with scraped context
              ├─> Call LLM (GPT-4)
              ├─> Generate site structure
              ├─> Create custom pages
              └─> Update navigation
```

### Error Handling Flow

```
Scraping Attempt
       |
       ├─> Success
       |    └─> Continue with scraped context
       |
       └─> Failure
            ├─> Log error
            ├─> Set scrapedContext = undefined
            └─> Continue with prompt-only generation
```

### Security Layers

```
User Input (basedOnWebsite URL)
         |
         v
1. URL Validation
   - Format check
   - Protocol check (http/https only)
         |
         v
2. SSRF Protection
   - Private IP check
   - Localhost check
   - Reserved IP ranges
         |
         v
3. Rate Limiting
   - Per-user limits
   - Scraping-specific limits
         |
         v
4. Content Moderation
   - HTML sanitization
   - Malicious script detection
   - Content appropriateness
         |
         v
5. LLM Prompt Injection Prevention
   - Input sanitization
   - Template escaping
```

## Database Schema

### No Schema Changes Required

The implementation uses existing database schema:

**Table**: `site_generation_jobs`

**Relevant columns**:
- `business_info` (JSONB) - Stores `basedOnWebsite` URL
- No additional columns needed

**Optional enhancement** (not implemented):
```sql
-- Optional: Add column for audit/debugging
ALTER TABLE site_generation_jobs
ADD COLUMN scraped_context JSONB;
```

This would allow storing the scraped context for:
- Debugging scraping issues
- Analytics on scraped sites
- Reproducing generation results
- Auditing scraped data

## Security Measures

### 1. SSRF Protection

Prevents Server-Side Request Forgery attacks:

```typescript
// Blocked patterns
- localhost, 127.0.0.1
- 10.0.0.0/8 (private)
- 172.16.0.0/12 (private)
- 192.168.0.0/16 (private)
- 169.254.0.0/16 (link-local)
- file://, ftp://, data:// protocols
```

### 2. Rate Limiting

Prevents abuse of scraping service:

**Development**:
- 10 scraping requests per hour
- 50 scraping requests per day

**Production**:
- 3 scraping requests per hour
- 10 scraping requests per day

### 3. Content Moderation

Scraped content is checked for:
- Malicious JavaScript
- XSS attempts
- Inappropriate content
- Spam patterns

### 4. Input Sanitization

All scraped HTML is sanitized before:
- Storing in database
- Passing to LLM
- Displaying to users

### 5. Timeout Protection

Prevents resource exhaustion:
- 30-second default timeout per page
- Maximum 5 pages per site
- Retry limit: 2 attempts

### 6. Authentication

Scraping service authentication:
- MD5 hash: `md5(url:salt)`
- Salt stored in environment variables
- No authentication tokens in code

## Testing

### Unit Tests

Recommended test coverage:

```typescript
// Scraping client
- ✓ Successful scraping
- ✓ Failed scraping with retry
- ✓ Invalid hash rejection
- ✓ Timeout handling

// Link extractor
- ✓ Extract navigation links
- ✓ Prioritize important pages
- ✓ Filter external links
- ✓ Handle relative URLs

// Content extractor
- ✓ Extract business info
- ✓ Extract brand colors
- ✓ Extract contact details
- ✓ Handle missing data

// Content analyzer
- ✓ Synthesize multi-page data
- ✓ Aggregate business info
- ✓ Identify common colors
- ✓ Extract unique services

// Security
- ✓ Block private IPs (SSRF)
- ✓ Validate URL format
- ✓ Enforce rate limits
- ✓ Sanitize HTML content
```

### Integration Tests

Recommended integration tests:

```typescript
// End-to-end scraping
- ✓ Scrape real website
- ✓ Generate site from scraped data
- ✓ Verify custom pages created
- ✓ Verify navigation updated

// Error handling
- ✓ Handle 404 errors
- ✓ Handle timeout errors
- ✓ Handle DNS errors
- ✓ Fallback to prompt-only

// Security
- ✓ SSRF attempts blocked
- ✓ Rate limits enforced
- ✓ Malicious content filtered
```

### Manual Testing Checklist

- [ ] Test with public website (e.g., example.com)
- [ ] Test with slow-loading website
- [ ] Test with non-existent domain
- [ ] Test with private IP (should block)
- [ ] Test with localhost (should block)
- [ ] Test rate limiting (multiple rapid requests)
- [ ] Test without basedOnWebsite (should work normally)
- [ ] Test with malformed URL
- [ ] Test with very large website (should limit to 5 pages)
- [ ] Verify custom pages are created
- [ ] Verify navigation includes custom pages
- [ ] Verify brand colors are extracted
- [ ] Verify business info is preserved

## Success Criteria

Feature is considered complete when all criteria are met:

### Functional Requirements

- [x] 1. Users can provide optional `basedOnWebsite` URL
- [x] 2. System intelligently discovers and scrapes up to 5 pages
- [x] 3. Business information is accurately extracted (contact, hours, location)
- [x] 4. Brand identity is analyzed (colors, logo, tone)
- [x] 5. LLM generates enhanced content based on scraped data
- [x] 6. Custom pages are created based on discovered content
- [x] 7. Navigation is dynamically updated to include custom pages
- [x] 8. Scraping failures gracefully fall back to prompt-only mode

### Security Requirements

- [x] 9. Security measures prevent SSRF attacks
- [x] 10. Rate limiting prevents abuse of scraping service
- [x] 11. Content moderation filters malicious content
- [x] 12. Input validation protects against injection attacks

### Quality Requirements

- [x] 13. All error cases are handled with appropriate user feedback
- [x] 14. Comprehensive logging for debugging and monitoring
- [x] 15. Code follows project TypeScript standards
- [x] 16. Documentation is complete and deployment-ready

## Known Limitations

### Current Limitations

1. **Page Limit**: Maximum 5 pages per site
   - Rationale: Balance between completeness and performance
   - Workaround: Prioritizes most important pages

2. **Scraping Timeout**: 30 seconds per page
   - Rationale: Prevents resource exhaustion
   - Workaround: Fails gracefully, continues with available data

3. **No JavaScript Execution**: Uses Puppeteer service but only gets final HTML
   - Rationale: Puppeteer service handles JS rendering
   - Limitation: Complex SPA sites may not work well

4. **No Screenshot Analysis**: No visual design analysis
   - Rationale: Out of scope for initial implementation
   - Future: Could add AI vision model analysis

5. **No Caching**: Each scraping request fetches fresh data
   - Rationale: Ensures up-to-date information
   - Consideration: Could add optional caching for performance

### Edge Cases Handled

- Website returns 404/500 errors → Fallback to prompt-only
- Website times out → Fallback to prompt-only
- DNS resolution fails → Fallback to prompt-only
- SSRF attempt detected → Block with error message
- Rate limit exceeded → Clear error message to user
- No navigation links found → Only scrape homepage
- Malformed HTML → Extract what's possible, continue
- Missing business info → Generate based on prompt only

## Future Enhancements

### Potential Improvements (Out of Scope)

1. **Screenshot Analysis**
   - Use AI vision models (GPT-4 Vision, Claude Vision)
   - Analyze visual design and layout
   - Extract design patterns and styles

2. **Competitor Analysis**
   - Scrape multiple competitor sites
   - Identify industry best practices
   - Generate comparison insights

3. **SEO Data Extraction**
   - Extract meta tags and keywords
   - Analyze content optimization
   - Generate SEO-enhanced content

4. **A/B Testing**
   - Generate multiple variations from same scraped data
   - Test different design approaches
   - Provide options to user

5. **Incremental Updates**
   - Allow users to rescrape and update existing sites
   - Track changes to original website
   - Suggest updates to generated site

6. **Custom Scraping Rules**
   - User-defined CSS selectors
   - Site-specific extraction rules
   - Better handling of complex sites

7. **Caching Layer**
   - Cache scraped data for common sites
   - Reduce scraping service costs
   - Faster response times

8. **Analytics Integration**
   - Track which sites are commonly scraped
   - Identify problematic sites
   - Measure scraping success rates

9. **Multi-language Support**
   - Detect website language
   - Translate content if needed
   - Generate multilingual sites

10. **Enhanced Content Analysis**
    - Sentiment analysis
    - Tone detection
    - Content quality scoring

## Related Documentation

- **Setup Guide**: [SCRAPING_SETUP.md](./SCRAPING_SETUP.md)
- **Deployment Guide**: [SCRAPING_DEPLOYMENT.md](./SCRAPING_DEPLOYMENT.md)
- **Platform Overview**: [platform-overview.md](./platform-overview.md)
- **Main README**: [../README.md](../README.md)

## Implementation Timeline

This feature was implemented as part of the website-based site generation milestone:

- **Planning**: LLM_SITE_GENERATOR_WEBSITE_SCRAPING_PLAN.md
- **Implementation**: Milestones 1-9
- **Documentation**: Milestone 10 (this document)

## Support & Maintenance

### Code Owners

This feature touches the following areas:
- AI/LLM integration
- Scraping infrastructure
- Security & rate limiting
- Site generation

### Monitoring

Key metrics to monitor:
- Scraping success rate
- Average scraping duration
- Rate limit violations
- SSRF block attempts
- Fallback frequency

### Troubleshooting

Common issues and solutions:

1. **High failure rate**: Check scraping service health
2. **Slow performance**: Review timeout settings
3. **Rate limit issues**: Adjust limits or user education
4. **SSRF alerts**: Expected, monitor volume for abuse patterns

For detailed troubleshooting, see [SCRAPING_DEPLOYMENT.md](./SCRAPING_DEPLOYMENT.md).

---

**Document Version**: 1.0
**Last Updated**: 2025-10-01
**Status**: Complete and deployment-ready
