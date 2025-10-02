# Website Scraping Testing Guide

## Overview

This document provides a comprehensive testing guide for the website scraping feature in the LLM site generator. The scraping system extracts business information, branding, and content from existing websites to enhance AI-generated sites.

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [Scraping Service Tests](#scraping-service-tests)
3. [Page Discovery Tests](#page-discovery-tests)
4. [Content Extraction Tests](#content-extraction-tests)
5. [LLM Integration Tests](#llm-integration-tests)
6. [Error Handling Tests](#error-handling-tests)
7. [Security Tests](#security-tests)
8. [Test Websites](#test-websites)
9. [Edge Case Scenarios](#edge-case-scenarios)
10. [Manual Testing Procedures](#manual-testing-procedures)

---

## Environment Setup

### Prerequisites

1. **Configure environment variables** in `.env.local`:

```bash
# Scraping Service Configuration
SCRAPING_SERVICE_URL=https://puppeteer-api-production-7bea.up.railway.app
SCRAPING_SERVICE_SALT=your-secret-salt-here
SCRAPING_SERVICE_TIMEOUT=30000  # 30 seconds
SCRAPING_SERVICE_MAX_RETRIES=2
```

2. **Verify scraping service is accessible**:

```bash
curl -X POST https://puppeteer-api-production-7bea.up.railway.app/health
```

3. **Start development server**:

```bash
pnpm dev
```

### Testing Tools

- **Browser DevTools**: Monitor network requests and responses
- **Postman/cURL**: Test API endpoints directly
- **Console Logs**: Enable verbose logging for scraping operations

---

## Scraping Service Tests

### Test Suite 1: Basic Scraping

#### Test 1.1: Valid Website URL Scrapes Successfully
- **Objective**: Verify that a valid, public website URL can be scraped without errors
- **Test URL**: `https://www.example.com`
- **Steps**:
  1. Call the scraping service with a valid URL
  2. Verify response contains `success: true`
  3. Verify HTML content is returned
  4. Verify metadata (title, description) is extracted
- **Expected Result**: Success response with HTML content
- **File**: `src/lib/scraping/scraping-client.ts` → `scrapeUrl()`

```typescript
// Example test call
const result = await scrapeUrl('https://www.example.com');
assert(result.success === true);
assert(result.html && result.html.length > 0);
assert(result.metadata?.title);
```

#### Test 1.2: Invalid URL Returns Proper Error
- **Objective**: Verify that invalid URLs are rejected with clear error messages
- **Test URLs**:
  - `invalid-url`
  - `ftp://example.com`
  - `javascript:alert(1)`
  - `http://`
- **Steps**:
  1. Attempt to scrape with each invalid URL
  2. Verify error is thrown
  3. Verify error message is descriptive
- **Expected Result**: Clear validation error before network request
- **File**: `src/lib/scraping/scraping-client.ts` → `validateScrapingUrl()`

#### Test 1.3: Localhost URL is Blocked
- **Objective**: Prevent SSRF attacks by blocking localhost URLs
- **Test URLs**:
  - `http://localhost:3000`
  - `http://127.0.0.1`
  - `http://0.0.0.0`
- **Steps**:
  1. Attempt to scrape localhost URL
  2. Verify error is thrown with "Cannot scrape localhost" message
- **Expected Result**: Validation error preventing localhost access
- **Security Impact**: Critical - prevents server-side request forgery

#### Test 1.4: Private IP URL is Blocked
- **Objective**: Prevent SSRF attacks by blocking internal network IPs
- **Test URLs**:
  - `http://192.168.1.1`
  - `http://10.0.0.1`
  - `http://172.16.0.1`
- **Steps**:
  1. Attempt to scrape private IP URL
  2. Verify error is thrown with "Cannot scrape localhost or internal IPs" message
- **Expected Result**: Validation error preventing internal network access
- **Security Impact**: Critical - prevents internal network scanning

#### Test 1.5: Timeout Handling Works
- **Objective**: Verify that slow websites timeout gracefully
- **Test Approach**: Use a website that intentionally delays responses
- **Steps**:
  1. Configure short timeout (e.g., 5000ms)
  2. Attempt to scrape slow website
  3. Verify timeout error is caught
  4. Verify request is aborted
- **Expected Result**: Timeout error after configured duration
- **File**: `src/lib/scraping/scraping-client.ts` → `scrapeUrl()` with AbortController

#### Test 1.6: Retry Logic Activates on Failure
- **Objective**: Verify exponential backoff retry mechanism
- **Test Approach**: Simulate network failure or 500 error
- **Steps**:
  1. Configure max retries to 2
  2. Mock or use unreliable endpoint
  3. Monitor retry attempts (should be 3 total: initial + 2 retries)
  4. Verify exponential backoff delays (1s, 2s)
- **Expected Result**: 3 attempts with increasing delays before final failure
- **File**: `src/lib/scraping/scraping-client.ts` → `scrapeUrl()` retry loop

#### Test 1.7: MD5 Hash Authentication is Correct
- **Objective**: Verify MD5 hash generation matches service expectations
- **Test Data**:
  - URL: `https://www.example.com`
  - Salt: `test-salt-123`
  - Expected Hash: MD5 of `https://www.example.com:test-salt-123`
- **Steps**:
  1. Generate hash for test URL
  2. Verify hash format (32 character lowercase hex)
  3. Verify hash is deterministic (same input = same hash)
  4. Verify hash changes when URL or salt changes
- **Expected Result**: Correct MD5 hash in lowercase hex format
- **File**: `src/lib/scraping/scraping-client.ts` → `generateScrapingHash()`

```typescript
// Example hash validation
const hash = generateScrapingHash('https://www.example.com');
assert(/^[a-f0-9]{32}$/.test(hash)); // Lowercase hex, 32 chars
```

---

## Page Discovery Tests

### Test Suite 2: Navigation and Page Identification

#### Test 2.1: Homepage is Always Scraped First
- **Objective**: Ensure homepage is prioritized in scraping order
- **Test URL**: Any multi-page website
- **Steps**:
  1. Initiate site scraping with base URL
  2. Verify first page scraped is the homepage
  3. Check scraping order in logs
- **Expected Result**: Homepage scraped before any other pages
- **File**: `src/lib/scraping/page-discovery.ts` → `discoverPages()`

#### Test 2.2: Navigation Links are Extracted Correctly
- **Objective**: Verify extraction of navigation links from common HTML structures
- **Test Cases**:
  - `<nav>` tag with links
  - `<header>` with navigation
  - `<ul class="menu">` structure
  - Footer navigation
- **Steps**:
  1. Scrape website with various navigation patterns
  2. Verify all internal navigation links are extracted
  3. Verify external links are excluded
  4. Verify link text is captured
- **Expected Result**: All internal navigation links found
- **File**: `src/lib/scraping/link-extractor.ts` → `extractNavigationLinks()`

#### Test 2.3: Page Types are Inferred Correctly
- **Objective**: Verify correct page type classification
- **Test Pages**:
  - `/about` → `about`
  - `/contact` → `contact`
  - `/services` → `services`
  - `/team` → `team`
  - `/blog` → `blog`
  - `/products` → `products`
  - `/faq` → `faq`
- **Steps**:
  1. Extract links from navigation
  2. Verify page type inference based on URL and link text
  3. Test edge cases (e.g., `/about-us`, `/contact-us`)
- **Expected Result**: Correct page type assigned to each link
- **File**: `src/lib/scraping/link-extractor.ts` → `inferPageType()`

```typescript
// Example page type inference tests
assert(inferPageType('/about-us', 'About Us') === 'about');
assert(inferPageType('/contact', 'Get in Touch') === 'contact');
assert(inferPageType('/our-services', 'Services') === 'services');
```

#### Test 2.4: Prioritization Works
- **Objective**: Verify pages are scraped in order of importance
- **Expected Order**: `about` > `contact` > `services` > `team` > `products` > `blog` > `faq` > `other`
- **Steps**:
  1. Provide website with 10+ navigation links
  2. Verify scraping order matches priority
  3. Verify max pages limit respects priority
- **Expected Result**: High-priority pages scraped first
- **File**: `src/lib/scraping/page-discovery.ts` → `prioritizePages()`

#### Test 2.5: Max Pages Limit is Enforced
- **Objective**: Prevent excessive scraping by enforcing page limit
- **Test Data**: Website with 20+ pages, limit set to 5
- **Steps**:
  1. Configure max pages limit
  2. Initiate scraping
  3. Verify exactly 5 pages are scraped
  4. Verify homepage + 4 highest priority pages
- **Expected Result**: Exactly configured number of pages scraped
- **File**: `src/lib/config/scraping.ts` → `maxPagesPerSite`

#### Test 2.6: Duplicate URLs are Deduplicated
- **Objective**: Prevent scraping the same page multiple times
- **Test Cases**:
  - Same URL with/without trailing slash: `/about` vs `/about/`
  - Same URL with fragments: `/contact#form` vs `/contact`
  - Same URL with query params: `/page?id=1` vs `/page?id=2`
- **Steps**:
  1. Extract links that normalize to same URL
  2. Verify deduplication logic
  3. Verify only one version is scraped
- **Expected Result**: Each unique page scraped only once
- **File**: `src/lib/scraping/link-extractor.ts` → `normalizeUrl()`

---

## Content Extraction Tests

### Test Suite 3: Business Information Extraction

#### Test 3.1: Emails are Extracted from mailto Links
- **Objective**: Extract email addresses from `mailto:` links
- **Test HTML**: `<a href="mailto:info@example.com">Contact Us</a>`
- **Steps**:
  1. Parse HTML with mailto links
  2. Verify email addresses are extracted
  3. Test multiple emails on same page
- **Expected Result**: All email addresses from mailto links found
- **File**: `src/lib/scraping/content-extractor.ts` → `extractContactInfo()`

#### Test 3.2: Emails are Extracted from Text Content
- **Objective**: Extract email addresses from page text using regex
- **Test Cases**:
  - Standard format: `contact@example.com`
  - Subdomain: `info@mail.example.com`
  - Plus addressing: `user+tag@example.com`
  - Numbers: `support123@example.com`
- **Steps**:
  1. Parse HTML with various email formats in text
  2. Verify regex extraction
  3. Verify deduplication
- **Expected Result**: All valid emails extracted, no false positives
- **File**: `src/lib/scraping/content-extractor.ts` → email regex pattern

#### Test 3.3: Phones are Extracted from tel Links
- **Objective**: Extract phone numbers from `tel:` links
- **Test HTML**: `<a href="tel:+1-555-123-4567">Call Us</a>`
- **Steps**:
  1. Parse HTML with tel links
  2. Verify phone numbers are extracted
  3. Test various formats (with/without country code)
- **Expected Result**: All phone numbers from tel links found
- **File**: `src/lib/scraping/content-extractor.ts` → `extractContactInfo()`

#### Test 3.4: Phones are Extracted from Text Content
- **Objective**: Extract phone numbers from page text using regex
- **Test Cases**:
  - US format: `(555) 123-4567`
  - International: `+1-555-123-4567`
  - Simple: `555-123-4567`
  - Dots: `555.123.4567`
- **Steps**:
  1. Parse HTML with various phone formats in text
  2. Verify regex extraction
  3. Verify normalization
- **Expected Result**: All valid phone numbers extracted
- **File**: `src/lib/scraping/content-extractor.ts` → phone regex pattern

#### Test 3.5: Addresses are Extracted
- **Objective**: Extract physical addresses using schema.org and heuristics
- **Test Cases**:
  - **Schema.org**: `<div itemscope itemtype="http://schema.org/PostalAddress">`
  - **Heuristic**: Text containing street, city, state, zip
- **Steps**:
  1. Test with schema.org markup
  2. Test with plain text address
  3. Verify address components (street, city, state, zip)
- **Expected Result**: Addresses extracted from both sources
- **File**: `src/lib/scraping/content-extractor.ts` → `extractAddress()`

#### Test 3.6: Social Links are Identified
- **Objective**: Extract social media profile URLs
- **Test Platforms**: Facebook, Twitter, Instagram, LinkedIn, YouTube, TikTok
- **Steps**:
  1. Parse HTML with social media links
  2. Verify platform identification
  3. Test various URL formats (www, mobile, short URLs)
- **Expected Result**: All major social platforms identified
- **File**: `src/lib/scraping/content-extractor.ts` → `extractSocialLinks()`

```typescript
// Example social link patterns
const socialPatterns = {
  facebook: /facebook\.com|fb\.com/i,
  twitter: /twitter\.com|x\.com/i,
  instagram: /instagram\.com/i,
  linkedin: /linkedin\.com/i,
  youtube: /youtube\.com|youtu\.be/i,
};
```

#### Test 3.7: Logo is Found
- **Objective**: Extract site logo from common selectors
- **Test Selectors**:
  - `<img class="logo" />`
  - `<img alt="Logo" />`
  - `<a class="logo"><img /></a>`
  - `<div class="site-branding"><img /></div>`
- **Steps**:
  1. Test each selector pattern
  2. Verify logo URL is extracted
  3. Test fallback to favicon
- **Expected Result**: Logo URL found from primary or fallback selector
- **File**: `src/lib/scraping/content-extractor.ts` → `extractLogo()`

#### Test 3.8: Brand Colors are Extracted
- **Objective**: Extract primary and accent colors from CSS
- **Test Approach**:
  - Analyze CSS custom properties (`:root { --primary-color: #...}`)
  - Analyze most common colors in stylesheets
  - Extract colors from header/hero sections
- **Steps**:
  1. Parse CSS and inline styles
  2. Identify most prominent colors
  3. Verify color format (hex, rgb, hsl)
- **Expected Result**: 2-3 primary brand colors identified
- **File**: `src/lib/scraping/content-analyzer.ts` → `extractBrandColors()`

#### Test 3.9: Key Features are Identified
- **Objective**: Extract product/service features from page content
- **Test Approach**:
  - Analyze `<ul>` lists in features sections
  - Identify headings with feature-related keywords
  - Extract from cards/grid layouts
- **Steps**:
  1. Parse common feature section patterns
  2. Extract feature titles and descriptions
  3. Limit to top 5-10 features
- **Expected Result**: Key business features extracted
- **File**: `src/lib/scraping/content-analyzer.ts` → `extractFeatures()`

#### Test 3.10: Business Description is Extracted
- **Objective**: Extract business description from meta tags and page content
- **Test Sources**:
  - `<meta name="description" content="..." />`
  - `<meta property="og:description" content="..." />`
  - First paragraph of main content
  - About page content
- **Steps**:
  1. Test meta tag extraction
  2. Test content extraction fallback
  3. Verify description length (50-300 characters)
- **Expected Result**: Concise business description extracted
- **File**: `src/lib/scraping/content-analyzer.ts` → `extractBusinessDescription()`

---

## LLM Integration Tests

### Test Suite 4: AI Generation with Scraped Context

#### Test 4.1: Scraped Context is Included in Prompt
- **Objective**: Verify scraped data is passed to LLM in prompt
- **Steps**:
  1. Scrape a test website
  2. Inspect LLM prompt before generation
  3. Verify scraped contact info, colors, features are included
- **Expected Result**: All scraped data present in prompt
- **File**: `src/lib/ai/site-generator-service.ts` → prompt construction

#### Test 4.2: LLM Uses Scraped Contact Info
- **Objective**: Verify generated site uses scraped email, phone, address
- **Steps**:
  1. Scrape website with contact info
  2. Generate site with scraping enabled
  3. Verify generated contact page matches scraped data
- **Expected Result**: Exact or improved contact information used
- **File**: Generated site's contact page content

#### Test 4.3: LLM Uses Scraped Brand Colors
- **Objective**: Verify generated site uses scraped color palette
- **Steps**:
  1. Scrape website with distinct brand colors
  2. Generate site with scraping enabled
  3. Verify site configuration uses similar colors
- **Expected Result**: Color scheme reflects scraped brand colors
- **File**: Site configuration `primaryColor`, `secondaryColor` fields

#### Test 4.4: LLM Improves/Modernizes Scraped Content
- **Objective**: Verify LLM enhances scraped content rather than copying verbatim
- **Steps**:
  1. Scrape website with outdated or verbose content
  2. Generate site with scraping enabled
  3. Compare scraped vs generated content
- **Expected Result**: Content is refined, modernized, and concise
- **Assessment**: Manual review of generated content quality

#### Test 4.5: LLM Generates Appropriate Number of Pages
- **Objective**: Verify LLM creates similar page structure to scraped site
- **Steps**:
  1. Scrape website with 5 pages
  2. Generate site with scraping enabled
  3. Verify generated site has similar page count
- **Expected Result**: Generated site has comparable pages (±2)
- **File**: `src/lib/ai/site-generator-service.ts` → page count logic

#### Test 4.6: Custom Pages are Created Based on Scraped Pages
- **Objective**: Verify LLM creates pages matching scraped site structure
- **Steps**:
  1. Scrape website with unique pages (e.g., "Portfolio", "Testimonials")
  2. Generate site with scraping enabled
  3. Verify similar custom pages are created
- **Expected Result**: Generated site includes analogous pages
- **File**: Generated site's page structure

---

## Error Handling Tests

### Test Suite 5: Graceful Failure and Fallbacks

#### Test 5.1: Scraping Failure Falls Back to Prompt-Only
- **Objective**: Verify site generation continues when scraping fails
- **Steps**:
  1. Provide invalid or unreachable URL
  2. Initiate site generation
  3. Verify scraping error is logged
  4. Verify generation continues with prompt only
  5. Verify user receives successful site (without scraped data)
- **Expected Result**: Site generated successfully without scraped context
- **File**: `app/api/sites/generate/route.ts` → error handling

#### Test 5.2: Partial Scraping Success Continues Generation
- **Objective**: Verify generation proceeds with partial scraped data
- **Scenarios**:
  - Homepage scraped, other pages fail
  - Contact info extracted, but no logo found
  - Some pages timeout, others succeed
- **Steps**:
  1. Simulate partial scraping failure
  2. Verify generation uses available data
  3. Verify missing data doesn't block generation
- **Expected Result**: Site generated with available scraped data
- **File**: `src/lib/scraping/page-discovery.ts` → partial results handling

#### Test 5.3: User is Informed of Scraping Issues
- **Objective**: Verify user receives feedback about scraping status
- **Steps**:
  1. Trigger scraping failure
  2. Check generation job status/logs
  3. Verify user-facing message indicates scraping issue
- **Expected Result**: Clear messaging about scraping status
- **File**: Generation job status messages

#### Test 5.4: Job Completes Successfully Even if Scraping Fails
- **Objective**: Verify job doesn't fail due to scraping errors
- **Steps**:
  1. Initiate generation with invalid scraping URL
  2. Monitor job status
  3. Verify job reaches "completed" status (not "failed")
  4. Verify site is created
- **Expected Result**: Job completes, site is generated
- **File**: `app/api/sites/generate/route.ts` → job completion logic

---

## Security Tests

### Test Suite 6: Security and Validation

#### Test 6.1: URL Validation Blocks Malicious URLs
- **Objective**: Prevent SSRF and other URL-based attacks
- **Malicious URLs**:
  - `http://localhost:3000/admin`
  - `http://127.0.0.1:22`
  - `http://169.254.169.254/latest/meta-data/` (AWS metadata)
  - `file:///etc/passwd`
  - `http://192.168.1.1/router/admin`
- **Steps**:
  1. Attempt to scrape each malicious URL
  2. Verify all are blocked with appropriate errors
- **Expected Result**: All malicious URLs rejected before network request
- **Security Impact**: CRITICAL - prevents server-side request forgery
- **File**: `src/lib/scraping/scraping-client.ts` → `validateScrapingUrl()`

#### Test 6.2: Scraped HTML is Sanitized
- **Objective**: Prevent XSS attacks from scraped content
- **Test Approach**: Mock scraping response with malicious HTML
- **Malicious Content**:
  - `<script>alert('XSS')</script>`
  - `<img src=x onerror="alert('XSS')" />`
  - `<iframe src="javascript:alert('XSS')"></iframe>`
- **Steps**:
  1. Process scraped HTML through extraction
  2. Verify scripts are removed or escaped
  3. Verify event handlers are removed
- **Expected Result**: All executable code stripped from scraped content
- **Security Impact**: HIGH - prevents XSS in generated sites
- **File**: Content extraction and sanitization logic

#### Test 6.3: Content Moderation Catches Malicious Content
- **Objective**: Prevent generation of inappropriate or malicious sites
- **Test Cases**:
  - Scraped site with adult content
  - Scraped site with hate speech
  - Scraped site with phishing indicators
- **Steps**:
  1. Process scraped content through moderation
  2. Verify flagged content is detected
  3. Verify generation is blocked or sanitized
- **Expected Result**: Inappropriate content flagged and handled
- **Security Impact**: HIGH - prevents platform abuse
- **File**: Content moderation integration (if implemented)

#### Test 6.4: Rate Limiting Prevents Abuse
- **Objective**: Prevent excessive scraping requests
- **Test Approach**: Rapid-fire scraping requests
- **Steps**:
  1. Make 20+ scraping requests in quick succession
  2. Verify rate limiting kicks in
  3. Verify appropriate error response (429 Too Many Requests)
- **Expected Result**: Rate limiting enforced after threshold
- **Security Impact**: MEDIUM - prevents DoS and abuse
- **File**: API route rate limiting middleware

---

## Test Websites

### Good Test Cases

These websites are recommended for positive testing scenarios:

#### 1. Simple Business Site
- **Example**: Local bakery, coffee shop, or restaurant
- **Characteristics**: 3-5 pages, simple navigation, clear contact info
- **Tests**: Basic scraping, contact extraction, simple navigation

#### 2. Multi-Page Corporate Site
- **Example**: Consulting firm, law office, or agency
- **Characteristics**: 8-12 pages, hierarchical navigation, team page
- **Tests**: Page prioritization, multiple page scraping, team extraction

#### 3. Garden Center Website (Domain-Specific)
- **Example**: Local nursery or landscaping company
- **Characteristics**: Product catalog, services, seasonal content
- **Tests**: Domain-specific content, product extraction, feature identification

#### 4. Site with Blog
- **Example**: Business blog, news site
- **Characteristics**: Blog section with multiple posts
- **Tests**: Blog page detection and exclusion (avoid scraping all posts)

#### 5. Site with Team Page
- **Example**: Agency or startup with team profiles
- **Characteristics**: Team member profiles with photos and bios
- **Tests**: Team member extraction, photo handling

### Suggested Public Test URLs

**Note**: Use responsibly and respect robots.txt

- Simple sites: Check for small business websites in your local area
- Well-structured: Wikipedia pages (good semantic HTML)
- E-commerce: Small Shopify/WooCommerce stores
- Portfolios: Personal portfolio sites from developer communities

---

## Edge Case Scenarios

### Challenging Test Cases

#### 1. Site with No Navigation
- **Characteristics**: Single-page site or no `<nav>` element
- **Expected Behavior**: Scrape homepage only, no additional pages discovered
- **Test File**: `src/lib/scraping/link-extractor.ts`

#### 2. Site with Dynamic Navigation (JavaScript-Rendered)
- **Characteristics**: React/Vue/Angular SPA with client-side routing
- **Expected Behavior**:
  - If scraping service executes JS: Links should be discovered
  - If HTML-only: Fallback to homepage scraping
- **Test File**: `src/lib/scraping/scraping-client.ts` (depends on puppeteer config)

#### 3. Site with Non-Standard URLs
- **Test Cases**:
  - Query parameters: `/page?id=123`
  - Fragments: `/page#section`
  - Uppercase: `/About-Us`
- **Expected Behavior**: URL normalization handles all cases
- **Test File**: `src/lib/scraping/link-extractor.ts` → `normalizeUrl()`

#### 4. Site with Broken Links (404s)
- **Characteristics**: Navigation contains links to non-existent pages
- **Expected Behavior**:
  - 404 pages are skipped
  - Other pages continue scraping
  - No fatal error
- **Test File**: Error handling in `scrapeMultipleUrls()`

#### 5. Site that Times Out
- **Characteristics**: Extremely slow server or large page size
- **Expected Behavior**:
  - Timeout after configured duration
  - Retry logic attempts 2 more times
  - Graceful failure if all retries fail
- **Test File**: `src/lib/scraping/scraping-client.ts` → timeout logic

#### 6. Site that Blocks Scrapers
- **Characteristics**: User-Agent detection, CAPTCHA, or bot protection
- **Expected Behavior**:
  - Scraping service should use realistic User-Agent
  - If blocked: Error response
  - Fallback to prompt-only generation
- **Test File**: Scraping service configuration (external)

---

## Manual Testing Procedures

### Procedure 1: End-to-End Site Generation with Scraping

**Objective**: Test the complete flow from URL input to generated site

**Steps**:

1. **Prepare Test Website**
   - Choose a test URL (e.g., `https://www.example.com`)
   - Document expected data (contact info, colors, page structure)

2. **Initiate Generation**
   - Navigate to site creation form
   - Enter site details
   - Provide `based_on_website` URL
   - Submit generation request

3. **Monitor Scraping Process**
   - Open browser DevTools → Network tab
   - Watch for POST request to `/api/sites/generate`
   - Check server logs for scraping activity:
     ```bash
     # In terminal running dev server
     # Look for log messages like:
     # [Scraping] Starting scrape for https://www.example.com
     # [Scraping] Discovered 5 pages
     # [Scraping] Extracted contact info: email, phone, address
     ```

4. **Verify Scraped Data**
   - Check generation job status endpoint
   - Verify scraped data is logged or stored
   - Compare scraped data to source website

5. **Review Generated Site**
   - Wait for generation to complete
   - Review generated pages
   - Verify contact info matches scraped data
   - Verify brand colors are similar
   - Verify page structure reflects scraped site

6. **Compare Prompt-Only vs Scraped**
   - Generate same site without `based_on_website` URL
   - Compare quality and accuracy
   - Document improvements from scraping

**Success Criteria**:
- Scraping completes without errors
- Generated site uses scraped contact info
- Generated site reflects scraped brand identity
- Generated site has similar page structure

---

### Procedure 2: Testing Error Scenarios

**Objective**: Verify graceful handling of scraping failures

**Test Cases**:

#### 2.1: Invalid URL
```bash
# Test via API (using cURL or Postman)
curl -X POST http://localhost:3001/api/sites/generate \
  -H "Content-Type: application/json" \
  -d '{
    "siteName": "Test Site",
    "prompt": "A bakery website",
    "basedOnWebsite": "invalid-url"
  }'
```

**Expected**:
- Validation error returned immediately
- Site not created

#### 2.2: Unreachable URL
```bash
curl -X POST http://localhost:3001/api/sites/generate \
  -H "Content-Type: application/json" \
  -d '{
    "siteName": "Test Site",
    "prompt": "A bakery website",
    "basedOnWebsite": "https://nonexistent-domain-12345.com"
  }'
```

**Expected**:
- Scraping fails after retries
- Generation continues with prompt only
- Job completes successfully

#### 2.3: Localhost URL (Security Test)
```bash
curl -X POST http://localhost:3001/api/sites/generate \
  -H "Content-Type: application/json" \
  -d '{
    "siteName": "Test Site",
    "prompt": "A bakery website",
    "basedOnWebsite": "http://localhost:3000"
  }'
```

**Expected**:
- Validation error: "Cannot scrape localhost or internal IPs"
- No network request made
- Site not created

---

### Procedure 3: Testing Content Extraction

**Objective**: Verify accuracy of extracted business information

**Steps**:

1. **Choose Test Website with Known Data**
   - Select website with visible contact info
   - Document expected values:
     - Email: `contact@example.com`
     - Phone: `(555) 123-4567`
     - Address: `123 Main St, City, ST 12345`
     - Social: Facebook, Instagram links

2. **Run Scraping in Isolation**
   ```typescript
   // Create test script: test-scraping.ts
   import { scrapeUrl } from '@/lib/scraping/scraping-client';
   import { extractContactInfo } from '@/lib/scraping/content-extractor';
   import { extractBrandColors } from '@/lib/scraping/content-analyzer';

   const testUrl = 'https://www.example.com';

   const result = await scrapeUrl(testUrl);
   if (result.success && result.html) {
     const contact = extractContactInfo(result.html, testUrl);
     const colors = extractBrandColors(result.html);

     console.log('Contact Info:', contact);
     console.log('Brand Colors:', colors);
   }
   ```

3. **Run Test Script**
   ```bash
   npx tsx test-scraping.ts
   ```

4. **Verify Extracted Data**
   - Compare console output to expected values
   - Check for false positives (incorrect emails/phones)
   - Verify color formats are valid hex/rgb

5. **Test Edge Cases**
   - Website with no contact info → Should return empty arrays
   - Website with multiple emails → Should return all unique emails
   - Website with obfuscated contact info → May miss some data

**Success Criteria**:
- All visible contact info extracted
- No false positives
- Brand colors match visual inspection

---

### Procedure 4: Testing Security Protections

**Objective**: Verify SSRF and XSS protections are working

**Security Tests**:

#### 4.1: SSRF Prevention

Test each of these malicious URLs and verify they are blocked:

```bash
# Test 1: Localhost
curl -X POST http://localhost:3001/api/sites/generate \
  -H "Content-Type: application/json" \
  -d '{"basedOnWebsite": "http://localhost:22"}'

# Test 2: Private IP
curl -X POST http://localhost:3001/api/sites/generate \
  -H "Content-Type: application/json" \
  -d '{"basedOnWebsite": "http://192.168.1.1"}'

# Test 3: AWS Metadata (common SSRF target)
curl -X POST http://localhost:3001/api/sites/generate \
  -H "Content-Type: application/json" \
  -d '{"basedOnWebsite": "http://169.254.169.254/latest/meta-data/"}'

# Test 4: File protocol
curl -X POST http://localhost:3001/api/sites/generate \
  -H "Content-Type: application/json" \
  -d '{"basedOnWebsite": "file:///etc/passwd"}'
```

**Expected**: All requests return validation errors, no network requests made

#### 4.2: XSS Prevention

1. Mock scraping service to return malicious HTML:
   ```html
   <div>
     <script>alert('XSS')</script>
     <img src=x onerror="alert('XSS')">
     Email: test@example.com
   </div>
   ```

2. Process through content extraction
3. Verify scripts are stripped
4. Verify email is still extracted

**Success Criteria**:
- All SSRF attempts blocked
- Malicious scripts removed from scraped content
- Legitimate data still extracted

---

### Procedure 5: Performance and Load Testing

**Objective**: Verify system handles scraping under load

**Steps**:

1. **Single Large Site**
   - Scrape site with 50+ pages
   - Verify max pages limit enforced (should scrape only 5)
   - Verify completion time is reasonable (<60s)

2. **Concurrent Scraping Requests**
   - Trigger 5 site generations simultaneously (all with scraping)
   - Monitor server resource usage
   - Verify all complete successfully
   - Verify no deadlocks or race conditions

3. **Slow Website**
   - Scrape website with slow response times
   - Verify timeout handling
   - Verify retry logic doesn't cause excessive delays

**Success Criteria**:
- Max pages limit prevents excessive scraping
- Concurrent requests handled gracefully
- Timeouts prevent indefinite hangs

---

## Testing Checklist Summary

### Pre-Launch Testing Checklist

Use this checklist before deploying scraping feature to production:

- [ ] **Scraping Service Tests**
  - [ ] Valid URL scrapes successfully
  - [ ] Invalid URL returns proper error
  - [ ] Localhost URL blocked
  - [ ] Private IP URL blocked
  - [ ] Timeout handling works
  - [ ] Retry logic activates
  - [ ] MD5 hash authentication correct

- [ ] **Page Discovery Tests**
  - [ ] Homepage scraped first
  - [ ] Navigation links extracted
  - [ ] Page types inferred correctly
  - [ ] Prioritization works
  - [ ] Max pages limit enforced
  - [ ] Duplicate URLs deduplicated

- [ ] **Content Extraction Tests**
  - [ ] Emails extracted (mailto & text)
  - [ ] Phones extracted (tel & text)
  - [ ] Addresses extracted
  - [ ] Social links identified
  - [ ] Logo found
  - [ ] Brand colors extracted
  - [ ] Features identified
  - [ ] Business description extracted

- [ ] **LLM Integration Tests**
  - [ ] Scraped context in prompt
  - [ ] LLM uses contact info
  - [ ] LLM uses brand colors
  - [ ] LLM improves content
  - [ ] Appropriate page count
  - [ ] Custom pages created

- [ ] **Error Handling Tests**
  - [ ] Scraping failure falls back
  - [ ] Partial success continues
  - [ ] User informed of issues
  - [ ] Job completes on scraping failure

- [ ] **Security Tests**
  - [ ] URL validation blocks malicious URLs
  - [ ] HTML sanitized
  - [ ] Content moderation (if applicable)
  - [ ] Rate limiting enforced

**Total Test Cases**: 42

---

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue 1: "Scraping service connection failed"
- **Cause**: `SCRAPING_SERVICE_URL` not configured or service is down
- **Solution**:
  - Verify environment variable is set
  - Test service health endpoint
  - Check network connectivity

#### Issue 2: "MD5 hash authentication failed"
- **Cause**: Incorrect `SCRAPING_SERVICE_SALT` or hash generation logic
- **Solution**:
  - Verify salt matches service configuration
  - Test hash generation manually
  - Check for encoding issues (UTF-8)

#### Issue 3: "No pages discovered"
- **Cause**: Website has no navigation or non-standard structure
- **Solution**:
  - Expected behavior for single-page sites
  - Verify homepage is still scraped
  - Check for JavaScript-rendered navigation

#### Issue 4: "Contact info not extracted"
- **Cause**: Contact info in non-standard format or embedded in images
- **Solution**:
  - Verify regex patterns match format
  - Check if info is in JavaScript (not in HTML)
  - Consider manual fallback for critical test cases

#### Issue 5: "Generation fails when scraping fails"
- **Cause**: Missing error handling in generation flow
- **Solution**:
  - Verify try-catch blocks around scraping calls
  - Ensure fallback to prompt-only generation
  - Check job status updates

---

## Test Coverage Summary

### Coverage by Component

| Component | Test Cases | Priority |
|-----------|-----------|----------|
| Scraping Service | 7 | Critical |
| Page Discovery | 6 | High |
| Content Extraction | 10 | High |
| LLM Integration | 6 | High |
| Error Handling | 4 | Critical |
| Security | 4 | Critical |
| **Total** | **42** | - |

### Risk Assessment

**Critical (Must Pass)**:
- Security tests (SSRF prevention)
- Error handling (graceful degradation)
- Basic scraping (valid URL flow)

**High (Should Pass)**:
- Content extraction (contact info, branding)
- Page discovery (navigation, prioritization)
- LLM integration (context usage)

**Medium (Nice to Have)**:
- Edge cases (dynamic navigation, non-standard URLs)
- Performance (load testing)

---

## Continuous Testing

### Automated Testing Recommendations

While this document focuses on manual testing, consider implementing:

1. **Unit Tests**:
   - URL validation logic
   - Content extraction regex patterns
   - Page type inference

2. **Integration Tests**:
   - Mock scraping service responses
   - Test extraction from known HTML fixtures
   - Verify LLM prompt construction

3. **E2E Tests**:
   - Full generation flow with mock scraping service
   - Error scenarios with network failures
   - Security tests with malicious inputs

### CI/CD Integration

Add to your deployment pipeline:

```bash
# Pre-deployment tests
pnpm test:scraping        # Run scraping unit tests
pnpm test:scraping:e2e    # Run E2E tests with mock service
pnpm lint                 # Verify code quality
pnpm typecheck            # Verify type safety
```

---

## Additional Resources

### Related Documentation
- `/docs/SCRAPING_SETUP.md` - Environment setup and configuration
- `LLM_SITE_GENERATOR_WEBSITE_SCRAPING_PLAN.md` - Full implementation plan
- `/src/lib/scraping/README.md` - Scraping module documentation (if exists)

### External References
- Puppeteer API documentation: https://pptr.dev/
- Schema.org markup: https://schema.org/
- OWASP SSRF Prevention: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html

---

## Feedback and Improvements

This testing document should be updated as:
- New features are added to scraping system
- Edge cases are discovered in production
- User feedback reveals common issues
- Security vulnerabilities are identified

**Last Updated**: 2025-10-01
**Version**: 1.0.0
**Maintainer**: Development Team
