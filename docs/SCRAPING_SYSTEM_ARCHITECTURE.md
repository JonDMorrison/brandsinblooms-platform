# Website Scraping System Architecture

## Overview

This document provides a comprehensive technical reference for developers working on the website scraping subsystem. It covers the complete data flow, service architecture, AI/LLM integration, prompts, and code structure.

**Target Audience**: Developers making changes to the scraping system
**Last Updated**: 2025-10-17
**Related Docs**: [SCRAPING_IMPLEMENTATION.md](./SCRAPING_IMPLEMENTATION.md), [SCRAPING_SETUP.md](./SCRAPING_SETUP.md)

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Complete Data Flow](#complete-data-flow)
3. [Service Architecture](#service-architecture)
4. [Code Structure](#code-structure)
5. [AI/LLM Integration](#aillm-integration)
6. [Database Schema](#database-schema)
7. [Security Implementation](#security-implementation)
8. [Key Algorithms](#key-algorithms)
9. [Extension Points](#extension-points)

---

## System Overview

### Purpose

The scraping subsystem enables users to create new sites by importing content from existing websites. It intelligently:
- Discovers and scrapes up to 12 pages from a target website
- Extracts structured business data (contact info, branding, services, testimonials)
- Analyzes content and generates an enhanced site using AI/LLM
- Preserves authentic business messaging while modernizing design

### High-Level Architecture

```
┌──────────────┐
│   Frontend   │ (Dashboard Sites Page)
│  /dashboard  │
│    /sites    │
└──────┬───────┘
       │ POST /api/sites/generate
       │ { basedOnWebsite: "https://..." }
       ▼
┌──────────────────────────────────────────────┐
│         API Route (Async Job Creation)        │
│  /app/api/sites/generate/route.ts            │
│                                               │
│  1. Auth & Rate Limiting                     │
│  2. Input Validation & Sanitization          │
│  3. Budget Checks                            │
│  4. ┌─────────────────────────────┐         │
│     │ Optional: Website Scraping  │         │
│     │  - Page Discovery           │         │
│     │  - Content Extraction       │         │
│     │  - Logo Processing          │         │
│     └─────────────────────────────┘         │
│  5. Create Job in Database                   │
│  6. Return 202 Accepted + Job ID            │
└──────┬───────────────────────────────────────┘
       │ Triggers background processing
       ▼
┌────────────────────────────────────────────────┐
│      Background Processor (Async)              │
│  /src/lib/jobs/background-processor.ts         │
│                                                 │
│  1. Load Job from Database                     │
│  2. ┌─────────────────────────────────┐       │
│     │  AI/LLM Site Generation         │       │
│     │  - Build prompts with context   │       │
│     │  - Generate foundation (Phase 1)│       │
│     │  - Generate sections (Phase 2)  │       │
│     │  - Generate custom pages        │       │
│     └─────────────────────────────────┘       │
│  3. Content Moderation                        │
│  4. Create Site & Pages in Database           │
│  5. Update Job Status                         │
└───────────────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│  Frontend    │ Polls GET /api/sites/generate/[jobId]
│  (Polling)   │ Shows progress & redirects on completion
└──────────────┘
```

---

## Complete Data Flow

### Phase 1: User Request → Job Creation

**File**: `app/api/sites/generate/route.ts`

```typescript
// 1. User submits request
{
  prompt: "Create a modern website",
  name: "My Business",
  basedOnWebsite: "https://example.com"  // Optional URL
}

// 2. Validation & security checks
- sanitizeBusinessInfo() → src/lib/security/input-sanitization.ts
- checkRateLimit() → src/lib/security/site-generation-rate-limit.ts
- validateBudgets() → checks user & platform budgets

// 3. Scraping flow (if basedOnWebsite provided)
if (businessInfo.basedOnWebsite) {
  // 3a. Page Discovery
  const discoveryResult = await discoverAndScrapePages(
    businessInfo.basedOnWebsite
  );
  // Returns: { pages: ScrapedPage[], totalDiscovered, totalScraped }

  // 3b. Content Analysis
  const analyzedWebsite = await analyzeScrapedWebsite(
    discoveryResult.pages
  );
  // Returns: AnalyzedWebsite with extracted data

  // 3c. Logo Processing (if found)
  if (analyzedWebsite.businessInfo.logoUrl) {
    const logoResult = await downloadAndUploadLogo(
      analyzedWebsite.businessInfo.logoUrl,
      temporarySiteId,
      userId
    );
  }

  // 3d. Build ScrapedWebsiteContext
  scrapedContext = {
    baseUrl: businessInfo.basedOnWebsite,
    businessInfo: analyzedWebsite.businessInfo,
    pageContents: analyzedWebsite.pageContents,
    recommendedPages: analyzedWebsite.recommendedPages,
    contentSummary: analyzedWebsite.contentSummary
  };
}

// 4. Create job in database
const job = await createJob({
  user_id: userId,
  business_info: sanitizedBusinessInfo,
  status: 'pending'
});

// 5. Trigger background processing (fire-and-forget)
processGenerationJob(job.id, scrapedContext).catch(handleError);

// 6. Return 202 Accepted
return {
  jobId: job.id,
  status: 'pending',
  statusUrl: `/api/sites/generate/${job.id}`
};
```

### Phase 2: Page Discovery & Scraping

**File**: `src/lib/scraping/page-discovery.ts`

```typescript
async function discoverAndScrapePages(websiteUrl: string) {
  // 1. Scrape homepage
  const homepageResult = await scrapeUrl(websiteUrl);

  // 2. Extract navigation links
  const links = extractNavigationLinks(
    homepageResult.html,
    websiteUrl
  );
  // Returns: Array<{ url, pageType, priority }>

  // 3. Prioritize links
  const prioritized = prioritizeLinksForScraping(
    links,
    MAX_PAGES - 1  // Reserve slot for homepage
  );

  // 4. Scrape additional pages in parallel
  const additionalPages = await scrapeMultipleUrls(
    prioritized.map(l => l.url),
    { maxConcurrent: 3 }
  );

  return {
    pages: [homepageResult, ...additionalPages],
    totalDiscovered: links.length,
    totalScraped: additionalPages.length + 1
  };
}
```

**Priority Order** (defined in `link-extractor.ts`):
1. About Us
2. Products/Shop
3. Services
4. Contact
5. Gallery/Portfolio
6. Pricing
7. Team
8. FAQ
9. Blog
10. Legal/Privacy
11. Other pages

### Phase 3: Content Extraction

**File**: `src/lib/scraping/content-extractor.ts`

This is the most comprehensive module (1438 lines). Key extraction functions:

```typescript
function extractBusinessInfo(html: string, baseUrl: string): ExtractedBusinessInfo {
  const $ = cheerio.load(html);

  return {
    // Contact Information
    emails: extractEmails($),           // From mailto: links + text patterns
    phones: extractPhones($),           // Phone number regex patterns
    addresses: extractAddresses($),     // Address patterns + schema.org

    // Social Media
    socialLinks: extractSocialLinks($, baseUrl),
    // Platforms: Facebook, Twitter, Instagram, LinkedIn, YouTube, Pinterest, TikTok

    // Branding
    logoUrl: extractLogo($, baseUrl),   // 20+ CSS selectors
    brandColors: extractBrandColors($), // From CSS, inline styles

    // Metadata
    siteTitle: $('title').text(),
    metaDescription: $('meta[name="description"]').attr('content'),
    favicon: extractFavicon($, baseUrl),

    // Hero Section
    heroSection: {
      headline: extractHeroHeadline($),
      subheadline: extractHeroSubheadline($),
      ctaText: extractCTAText($),
      ctaLink: extractCTALink($),
      backgroundImage: extractHeroBackground($, baseUrl)
    },

    // Structured Content
    structuredContent: {
      businessHours: extractBusinessHours($),     // schema.org + patterns
      services: extractServices($),               // Tables, lists, structured data
      testimonials: extractTestimonials($),       // Reviews with ratings
      faqs: extractFAQs($),                       // Q&A patterns
      productCategories: extractProductCategories($)
    },

    // Content for LLM
    businessDescription: extractBusinessDescription($),
    keyFeatures: extractKeyFeatures($),
    tagline: extractTagline($),

    // Raw content for LLM context
    mainContent: cleanTextContent($('main, article, .content').text()),
    footerContent: cleanTextContent($('footer').text()),
    sidebarContent: cleanTextContent($('aside, .sidebar').text())
  };
}
```

**Logo Extraction Strategy** (lines 227-400):
- 20+ CSS selectors tried in priority order
- Validates against data URIs and placeholders
- Debug logging for troubleshooting
- URL resolution and normalization

**Business Hours Extraction**:
- schema.org `openingHours` markup
- Pattern matching for day/time formats
- Table parsing for structured hours

**Services Extraction**:
- Pricing tables with `$` or `price` keywords
- Service lists with descriptions
- Duration extraction (e.g., "1 hour", "30 min")

### Phase 4: Content Analysis

**File**: `src/lib/scraping/content-analyzer.ts`

```typescript
function analyzeScrapedWebsite(pages: ScrapedPage[]): AnalyzedWebsite {
  // 1. Extract info from all pages
  const allExtractedInfo = pages.map(page =>
    extractBusinessInfo(page.html, page.url)
  );

  // 2. Consolidate business info (from all pages)
  const consolidatedInfo = {
    emails: uniqueArray(allExtractedInfo.flatMap(i => i.emails)),
    phones: uniqueArray(allExtractedInfo.flatMap(i => i.phones)),
    // ... aggregate all fields
  };

  // 3. Determine most common brand colors
  const allColors = allExtractedInfo.flatMap(i => i.brandColors);
  const colorFrequency = countOccurrences(allColors);
  const primaryColors = topN(colorFrequency, 3);

  // 4. Recommend pages to generate
  const recommendedPages = inferPageTypes(pages);
  // Returns: ['about', 'services', 'contact', ...]

  // 5. Create content summary for LLM
  const contentSummary = summarizeContent(pages);

  return {
    businessInfo: consolidatedInfo,
    pageContents: pages.reduce((acc, p) => ({
      ...acc,
      [p.pageType]: cleanTextContent(p.html)
    }), {}),
    recommendedPages,
    contentSummary
  };
}
```

### Phase 5: Background Job Processing

**File**: `src/lib/jobs/background-processor.ts`

```typescript
async function processGenerationJob(
  jobId: string,
  scrapedContext?: ScrapedWebsiteContext
) {
  // 1. Load job from database
  const job = await getJob(jobId);
  await updateJobStatus(jobId, 'processing', 0);

  // 2. Generate site content with LLM
  const generatedSite = await generateSiteWithLLM(
    job.business_info,
    scrapedContext  // Enhanced with scraped data
  );

  // 3. Content moderation
  const moderationResult = await moderateContent(generatedSite);
  if (!moderationResult.passed) {
    throw new Error('Content failed moderation');
  }

  // 4. Create site in database
  const site = await createSite({
    user_id: job.user_id,
    name: generatedSite.site_name,
    // ... other fields
  });

  // 5. Create pages (standard + custom from scraped content)
  await createStandardPages(site.id, generatedSite);
  if (scrapedContext?.recommendedPages) {
    await createCustomPages(site.id, generatedSite.customPages);
  }

  // 6. Update job as completed
  await updateJobStatus(jobId, 'completed', 100, {
    site_id: site.id,
    cost_cents: calculateCost(tokenUsage),
    token_usage: tokenUsage
  });
}
```

---

## Service Architecture

### External Services

```
┌─────────────────────────────────────────────────────┐
│  Puppeteer Scraping Service (External)              │
│  https://puppeteer-api-production-7bea.up.railway.app│
│                                                       │
│  POST /fetch                                         │
│  {                                                   │
│    "url": "https://example.com",                    │
│    "hash": "md5(url:salt)"                          │
│  }                                                   │
│                                                       │
│  Returns:                                            │
│  {                                                   │
│    "html": "<html>...",                             │
│    "statusCode": 200                                │
│  }                                                   │
└─────────────────────────────────────────────────────┘
         ▲
         │ HTTPS + MD5 Auth
         │
┌────────┴─────────────────────────────────────────────┐
│  Scraping Client (Internal)                          │
│  src/lib/scraping/scraping-client.ts                 │
│                                                       │
│  - Handles authentication                            │
│  - Retry logic (exponential backoff)                │
│  - Timeout handling                                  │
│  - URL safety validation                            │
└──────────────────────────────────────────────────────┘
```

### Internal Services

```
┌─────────────────────────────────────────────────────┐
│  OpenRouter LLM Service                              │
│  src/lib/ai/openrouter-client.ts                    │
│                                                       │
│  Production LLM router supporting:                   │
│  - OpenAI (GPT-4, GPT-4 Turbo)                      │
│  - Anthropic (Claude 3.5 Sonnet)                    │
│  - Google (Gemini)                                   │
│  - Others                                            │
│                                                       │
│  Features:                                           │
│  - Automatic retries with exponential backoff        │
│  - Structured JSON output via OpenAI SDK             │
│  - Timeout handling (30s default)                   │
│  - Token usage tracking                              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  S3/Supabase Storage Service                        │
│  src/lib/storage/logo-processor.ts                  │
│                                                       │
│  Logo Processing Pipeline:                           │
│  1. Download from external URL                       │
│  2. Validate image type (magic bytes)                │
│  3. Size validation (max 5MB)                        │
│  4. Upload to S3 with presigned URLs                 │
│  5. Generate CDN URL                                 │
│                                                       │
│  Supported formats:                                  │
│  - JPEG, PNG, SVG, WebP, GIF, ICO                   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Supabase Database                                   │
│  - site_generation_jobs table                        │
│  - sites, content, media_files tables                │
│  - Row-Level Security (RLS)                          │
│  - Real-time subscriptions                           │
└─────────────────────────────────────────────────────┘
```

---

## Code Structure

### Directory Organization

```
src/lib/
├── scraping/                    # Core scraping functionality
│   ├── scraping-client.ts       # HTTP client for Puppeteer service
│   ├── page-discovery.ts        # Multi-page discovery orchestration
│   ├── link-extractor.ts        # Navigation link extraction & prioritization
│   ├── content-extractor.ts     # Business data extraction (1438 lines)
│   └── content-analyzer.ts      # Multi-page content synthesis
│
├── ai/                          # AI/LLM integration
│   ├── openrouter-client.ts     # LLM API client
│   ├── site-generator-service.ts # Site generation orchestrator
│   ├── response-parser.ts       # LLM response parsing & validation
│   ├── error-recovery.ts        # JSON repair & graceful degradation
│   └── prompts/
│       └── site-generation-prompts.ts # Prompt templates
│
├── storage/
│   └── logo-processor.ts        # Logo download & upload
│
├── security/
│   ├── input-sanitization.ts    # URL validation & HTML sanitization
│   ├── site-generation-rate-limit.ts # Rate limiting
│   └── content-moderation.ts    # Content safety checks
│
├── jobs/
│   └── background-processor.ts  # Async job processing
│
├── config/
│   └── scraping.ts              # Scraping service configuration
│
└── types/
    └── site-generation-jobs.ts  # TypeScript types

app/
├── api/sites/generate/
│   ├── route.ts                 # POST endpoint (job creation)
│   └── [jobId]/route.ts         # GET endpoint (status polling)
│
└── dashboard/sites/
    └── page.tsx                 # UI for site creation (28k lines)
```

### Key Types

**File**: `src/lib/types/site-generation-jobs.ts`

```typescript
// User input
interface BusinessInfo {
  prompt: string;
  name: string;
  industry?: string;
  location?: string;
  email?: string;
  phone?: string;
  description?: string;
  brandColors?: string;
  logoUrl?: string;
  basedOnWebsite?: string;  // Scraping trigger
  additionalDetails?: {
    address?: string;
  };
}

// Scraped website context (passed to LLM)
interface ScrapedWebsiteContext {
  baseUrl: string;
  businessInfo: {
    emails?: string[];
    phones?: string[];
    addresses?: string[];
    socialLinks?: Array<{
      platform: string;
      url: string;
    }>;
    logoUrl?: string;
    brandColors?: string[];
    siteTitle?: string;
    metaDescription?: string;
    favicon?: string;
    heroSection?: {
      headline?: string;
      subheadline?: string;
      ctaText?: string;
      ctaLink?: string;
      backgroundImage?: string;
    };
    businessDescription?: string;
    tagline?: string;
    keyFeatures?: string[];
    structuredContent?: {
      businessHours?: Array<{
        day: string;
        hours: string;
        closed?: boolean;
      }>;
      services?: Array<{
        name: string;
        description?: string;
        price?: string;
        duration?: string;
      }>;
      testimonials?: Array<{
        name?: string;
        role?: string;
        content: string;
        rating?: number;
      }>;
      faqs?: Array<{
        question: string;
        answer: string;
      }>;
      productCategories?: string[];
    };
  };
  pageContents?: Record<string, string>;  // pageType -> cleaned text
  recommendedPages?: string[];            // e.g., ['about', 'services', 'contact']
  contentSummary?: string;                // High-level summary for LLM
}

// Job tracking
interface SiteGenerationJob {
  id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;  // 0-100
  business_info: BusinessInfo;
  generated_data?: GeneratedSiteData;
  site_id?: string;
  error_message?: string;
  error_code?: string;
  cost_cents?: number;
  token_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  created_at: string;
  updated_at: string;
  completed_at?: string;
}
```

---

## AI/LLM Integration

### Two-Phase Generation Architecture

**File**: `src/lib/ai/site-generator-service.ts`

```typescript
// Phase 1: Foundation (Single LLM call)
const foundationResult = await generateFoundationWithLLM(
  businessInfo,
  scrapedContext
);
// Returns: site metadata, branding/theme, hero section

// Phase 2: Sections (Parallel LLM calls)
const sectionResults = await Promise.allSettled([
  generateAboutSection(foundationResult, scrapedContext),
  generateValuesSection(foundationResult, scrapedContext),
  generateFeaturesSection(foundationResult, scrapedContext),
  generateServicesSection(foundationResult, scrapedContext),
  generateTeamSection(foundationResult, scrapedContext),
  generateTestimonialsSection(foundationResult, scrapedContext),
  generateContactSection(foundationResult, scrapedContext)
]);

// Phase 3 (Optional): Custom pages from scraped content
if (scrapedContext?.recommendedPages) {
  const customPages = await generateCustomPages(
    scrapedContext.recommendedPages,
    scrapedContext.pageContents
  );
}
```

### LLM Temperature Settings

```typescript
const TEMPERATURE_SETTINGS = {
  foundation: 0.8,      // Creative branding decisions
  about: 0.7,
  values: 0.7,
  features: 0.7,
  services: 0.7,
  team: 0.7,
  testimonials: 0.8,    // More creative
  contact: 0.5          // Factual
};
```

### Prompt Engineering

**File**: `src/lib/ai/prompts/site-generation-prompts.ts`

#### System Prompts

```typescript
const SITE_FOUNDATION_SYSTEM_PROMPT = `You are an expert web designer and content strategist specializing in creating beautiful, effective websites for garden centers, nurseries, and plant shops.

Your role is to generate comprehensive website content that:
- Captures the authentic voice and character of the business
- Creates compelling, conversion-focused copy
- Maintains professional quality while being approachable
- Incorporates modern web design best practices

When analyzing an existing website (if provided), you should:
- PRESERVE the core messaging, brand identity, and business details
- Only make minor improvements for clarity or impact
- Maintain the authentic voice and tone of the business
- Keep exact contact information, hours, prices, and services

Return a valid JSON object matching the specified schema.`;

const PAGE_GENERATION_SYSTEM_PROMPT = `You are an expert copywriter creating specific page sections for a garden center website.

Focus on:
- Clear, scannable content
- Strong calls-to-action
- SEO-friendly structure
- Authentic business voice

If existing website content is provided, preserve key messaging while enhancing clarity and impact.`;
```

#### User Prompts with Scraped Context

```typescript
function buildFoundationPromptWithContext(
  businessInfo: BusinessInfo,
  scrapedContext?: ScrapedWebsiteContext
): string {
  let prompt = `Generate a complete website foundation for:\n\n`;
  prompt += `Business Name: ${businessInfo.name}\n`;

  if (scrapedContext) {
    prompt += `\n## EXISTING WEBSITE ANALYSIS\n\n`;

    // Business Information
    if (scrapedContext.businessInfo) {
      const info = scrapedContext.businessInfo;

      prompt += `### Business Details\n`;
      if (info.emails?.length) {
        prompt += `Email: ${info.emails.join(', ')}\n`;
      }
      if (info.phones?.length) {
        prompt += `Phone: ${info.phones.join(', ')}\n`;
      }
      if (info.addresses?.length) {
        prompt += `Address: ${info.addresses.join(', ')}\n`;
      }

      // Business hours (PRESERVE EXACTLY)
      if (info.structuredContent?.businessHours) {
        prompt += `\nBusiness Hours (PRESERVE EXACTLY):\n`;
        info.structuredContent.businessHours.forEach(h => {
          prompt += `- ${h.day}: ${h.closed ? 'Closed' : h.hours}\n`;
        });
      }

      // Services (PRESERVE EXACTLY)
      if (info.structuredContent?.services) {
        prompt += `\nServices (PRESERVE EXACTLY):\n`;
        info.structuredContent.services.forEach(s => {
          prompt += `- ${s.name}`;
          if (s.price) prompt += ` - ${s.price}`;
          if (s.duration) prompt += ` (${s.duration})`;
          if (s.description) prompt += `\n  ${s.description}`;
          prompt += `\n`;
        });
      }

      // Testimonials (PRESERVE VERBATIM)
      if (info.structuredContent?.testimonials) {
        prompt += `\nCustomer Testimonials (USE VERBATIM):\n`;
        info.structuredContent.testimonials.forEach(t => {
          prompt += `- "${t.content}"`;
          if (t.name) prompt += ` - ${t.name}`;
          if (t.role) prompt += `, ${t.role}`;
          if (t.rating) prompt += ` (${t.rating}/5 stars)`;
          prompt += `\n`;
        });
      }

      // Brand Colors
      if (info.brandColors?.length) {
        prompt += `\nBrand Colors: ${info.brandColors.join(', ')}\n`;
      }

      // Hero Section
      if (info.heroSection) {
        prompt += `\nHero Section:\n`;
        if (info.heroSection.headline) {
          prompt += `Headline: "${info.heroSection.headline}"\n`;
        }
        if (info.heroSection.subheadline) {
          prompt += `Subheadline: "${info.heroSection.subheadline}"\n`;
        }
      }
    }

    // Content Summary
    if (scrapedContext.contentSummary) {
      prompt += `\n### Content Overview\n${scrapedContext.contentSummary}\n`;
    }

    // Page Recommendations
    if (scrapedContext.recommendedPages?.length) {
      prompt += `\n### Recommended Pages\n`;
      prompt += `Generate ${scrapedContext.recommendedPages.length} pages: `;
      prompt += scrapedContext.recommendedPages.join(', ');
      prompt += `\n`;
    }
  }

  // User's additional instructions
  prompt += `\n## USER INSTRUCTIONS\n${businessInfo.prompt}\n`;

  return prompt;
}
```

### Response Parsing & Error Recovery

**File**: `src/lib/ai/response-parser.ts`

```typescript
function parseFoundationResponse(response: string): FoundationResult {
  // 1. Extract JSON from markdown code blocks or plain text
  let jsonStr = extractJSON(response);

  // 2. Attempt to parse
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (error) {
    // 3. Attempt JSON repair
    jsonStr = repairJSON(jsonStr);
    parsed = JSON.parse(jsonStr);
  }

  // 4. Validate with Zod schema
  try {
    return foundationSchema.parse(parsed);
  } catch (validationError) {
    // 5. Error recovery: adjust constraints
    return recoverFromValidationError(parsed, validationError);
  }
}
```

**File**: `src/lib/ai/error-recovery.ts`

```typescript
function repairJSON(json: string): string {
  // Fix common issues:
  // - Unclosed strings
  // - Missing closing braces/brackets
  // - Trailing commas
  // - Incomplete key-value pairs

  let repaired = json;

  // Count braces/brackets
  const openBraces = (json.match(/{/g) || []).length;
  const closeBraces = (json.match(/}/g) || []).length;
  const openBrackets = (json.match(/\[/g) || []).length;
  const closeBrackets = (json.match(/]/g) || []).length;

  // Add missing closing characters
  repaired += '}'.repeat(openBraces - closeBraces);
  repaired += ']'.repeat(openBrackets - closeBrackets);

  return repaired;
}

function recoverFromValidationError(
  data: unknown,
  error: ZodError
): FoundationResult {
  // Adjust field lengths if they exceed constraints
  // Truncate arrays to max length
  // Provide default values for required fields
  // Log warnings for developer visibility

  const recovered = { ...data };

  error.issues.forEach(issue => {
    if (issue.code === 'too_big' && issue.path) {
      const field = getFieldByPath(recovered, issue.path);
      if (typeof field === 'string') {
        setFieldByPath(recovered, issue.path,
          field.substring(0, issue.maximum));
        console.warn(`Truncated field ${issue.path} to ${issue.maximum} chars`);
      }
    }
  });

  return recovered as FoundationResult;
}
```

### Cost Tracking

```typescript
// Token costs (per 1M tokens)
const COST_PER_MILLION_PROMPT_TOKENS = 0.05;  // $0.05
const COST_PER_MILLION_COMPLETION_TOKENS = 0.10;  // $0.10

function calculateCost(tokenUsage: TokenUsage): number {
  const promptCost = (tokenUsage.prompt_tokens / 1_000_000) * COST_PER_MILLION_PROMPT_TOKENS;
  const completionCost = (tokenUsage.completion_tokens / 1_000_000) * COST_PER_MILLION_COMPLETION_TOKENS;
  return Math.round((promptCost + completionCost) * 100);  // Convert to cents
}
```

---

## Database Schema

### Tables

```sql
-- Job tracking
CREATE TABLE site_generation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  business_info JSONB NOT NULL,  -- Contains basedOnWebsite URL
  generated_data JSONB,           -- LLM output
  site_id UUID REFERENCES sites(id),
  error_message TEXT,
  error_code TEXT,
  cost_cents INTEGER,
  token_usage JSONB,              -- {prompt_tokens, completion_tokens, total_tokens}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Sites (created from jobs)
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE,
  is_active BOOLEAN DEFAULT true,
  theme_settings JSONB,           -- Brand colors, fonts, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Page content
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id),
  content_type VARCHAR(50),       -- 'landing', 'about', 'contact', 'blog_post', 'other'
  title VARCHAR(500),
  slug VARCHAR(255),
  content JSONB NOT NULL,         -- Flexible content structure (sections, blocks)
  meta_data JSONB,                -- SEO, custom fields
  is_published BOOLEAN DEFAULT false,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media (logos, images)
CREATE TABLE media_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id),
  uploaded_by UUID REFERENCES auth.users(id),
  file_name TEXT,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50),          -- 'image', 'video', 'document'
  file_size_bytes BIGINT,
  alt_text VARCHAR(255),
  storage_type VARCHAR(50),       -- 'supabase', 's3'
  s3_bucket TEXT,
  s3_key TEXT,
  cdn_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes

```sql
-- Job queries
CREATE INDEX idx_site_generation_jobs_user
  ON site_generation_jobs(user_id, created_at DESC);

CREATE INDEX idx_site_generation_jobs_status
  ON site_generation_jobs(status, created_at DESC);

CREATE INDEX idx_site_generation_jobs_active
  ON site_generation_jobs(status, updated_at DESC)
  WHERE status IN ('pending', 'processing');

-- Site queries
CREATE INDEX idx_sites_user ON sites(user_id);
CREATE INDEX idx_sites_domain ON sites(domain) WHERE domain IS NOT NULL;

-- Content queries
CREATE INDEX idx_content_site_type ON content(site_id, content_type);
CREATE INDEX idx_content_published ON content(site_id, is_published, sort_order);
```

### Helper Functions

```sql
-- Get job statistics for a user
CREATE FUNCTION get_job_statistics(p_user_id UUID)
RETURNS TABLE (
  total_jobs BIGINT,
  pending_jobs BIGINT,
  completed_jobs BIGINT,
  failed_jobs BIGINT,
  total_cost_cents BIGINT,
  avg_completion_time_seconds NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_jobs,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_jobs,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_jobs,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_jobs,
    COALESCE(SUM(cost_cents), 0) as total_cost_cents,
    AVG(EXTRACT(EPOCH FROM (completed_at - created_at)))
      FILTER (WHERE completed_at IS NOT NULL) as avg_completion_time_seconds
  FROM site_generation_jobs
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Cleanup old jobs (admin function)
CREATE FUNCTION cleanup_old_generation_jobs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM site_generation_jobs
  WHERE status IN ('completed', 'failed')
    AND completed_at < NOW() - (days_to_keep || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
```

---

## Security Implementation

### 1. SSRF Protection

**File**: `src/lib/security/input-sanitization.ts`

```typescript
function validateUrlForScraping(url: string): void {
  // Parse URL
  const parsed = new URL(url);

  // 1. Protocol check
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP and HTTPS protocols allowed');
  }

  // 2. Hostname checks
  const hostname = parsed.hostname.toLowerCase();

  // Block localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    throw new Error('Cannot scrape localhost');
  }

  // Block private IP ranges
  const privateRanges = [
    /^10\./,                    // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16.0.0/12
    /^192\.168\./,              // 192.168.0.0/16
    /^169\.254\./,              // 169.254.0.0/16 (link-local)
    /^::1$/,                    // IPv6 localhost
    /^fc00:/,                   // IPv6 private
    /^fe80:/                    // IPv6 link-local
  ];

  if (privateRanges.some(regex => regex.test(hostname))) {
    throw new Error('Cannot scrape private IP addresses');
  }

  // 3. DNS resolution check (optional, async)
  // Could add real-time DNS resolution to catch DNS rebinding attacks
}
```

### 2. Rate Limiting

**File**: `src/lib/security/site-generation-rate-limit.ts`

```typescript
const RATE_LIMITS = {
  development: {
    scrapingMaxPerHour: 10,
    scrapingMaxPerDay: 50
  },
  production: {
    scrapingMaxPerHour: 3,
    scrapingMaxPerDay: 10
  }
};

async function checkScrapingRateLimit(userId: string): Promise<void> {
  const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  const limits = RATE_LIMITS[env];

  // Count recent scraping jobs
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recentJobs = await db
    .from('site_generation_jobs')
    .select('created_at')
    .eq('user_id', userId)
    .neq('business_info->basedOnWebsite', null)  // Only scraping jobs
    .gte('created_at', dayAgo.toISOString());

  const hourlyCount = recentJobs.filter(j =>
    new Date(j.created_at) > hourAgo
  ).length;

  if (hourlyCount >= limits.scrapingMaxPerHour) {
    throw new RateLimitError(
      `Rate limit exceeded: ${limits.scrapingMaxPerHour} scraping requests per hour`
    );
  }

  if (recentJobs.length >= limits.scrapingMaxPerDay) {
    throw new RateLimitError(
      `Rate limit exceeded: ${limits.scrapingMaxPerDay} scraping requests per day`
    );
  }
}
```

### 3. Content Moderation

**File**: `src/lib/security/content-moderation.ts`

```typescript
async function moderateScrapedContent(
  content: ExtractedBusinessInfo
): Promise<ModerationResult> {
  const issues: string[] = [];

  // 1. Check for malicious HTML/scripts
  const allText = [
    content.mainContent,
    content.footerContent,
    content.sidebarContent
  ].join(' ');

  if (/<script[\s\S]*?>/i.test(allText)) {
    issues.push('Potential XSS: script tags detected');
  }

  // 2. Check for inappropriate content
  const inappropriatePatterns = [
    /\b(viagra|cialis|casino|poker)\b/i,
    // Add more patterns as needed
  ];

  if (inappropriatePatterns.some(p => p.test(allText))) {
    issues.push('Potentially inappropriate content detected');
  }

  // 3. Check content length (spam detection)
  if (allText.length > 500000) {  // 500KB
    issues.push('Excessive content length');
  }

  return {
    passed: issues.length === 0,
    issues,
    sanitizedContent: sanitizeHTML(content)
  };
}

function sanitizeHTML(content: ExtractedBusinessInfo): ExtractedBusinessInfo {
  // Remove dangerous HTML while preserving structure
  // Use a library like DOMPurify or custom regex
  return {
    ...content,
    mainContent: stripDangerousHTML(content.mainContent),
    footerContent: stripDangerousHTML(content.footerContent),
    sidebarContent: stripDangerousHTML(content.sidebarContent)
  };
}
```

### 4. Input Sanitization

```typescript
function sanitizeBusinessInfo(info: BusinessInfo): BusinessInfo {
  return {
    ...info,
    prompt: sanitizeText(info.prompt, 5000),
    name: sanitizeText(info.name, 255),
    industry: info.industry ? sanitizeText(info.industry, 100) : undefined,
    location: info.location ? sanitizeText(info.location, 255) : undefined,
    email: info.email ? sanitizeEmail(info.email) : undefined,
    phone: info.phone ? sanitizePhone(info.phone) : undefined,
    description: info.description ? sanitizeText(info.description, 2000) : undefined,
    basedOnWebsite: info.basedOnWebsite ? sanitizeUrl(info.basedOnWebsite) : undefined
  };
}

function sanitizeText(text: string, maxLength: number): string {
  return text
    .trim()
    .substring(0, maxLength)
    .replace(/[<>]/g, '');  // Remove angle brackets
}

function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  validateUrlForScraping(trimmed);  // Throws if invalid
  return trimmed;
}
```

---

## Key Algorithms

### Link Prioritization Algorithm

**File**: `src/lib/scraping/link-extractor.ts:prioritizeLinksForScraping`

```typescript
const PAGE_TYPE_PRIORITY = {
  'about': 1,
  'products': 2,
  'shop': 2,
  'services': 3,
  'catalog': 4,
  'contact': 5,
  'gallery': 6,
  'portfolio': 6,
  'pricing': 7,
  'team': 8,
  'faq': 9,
  'blog': 10,
  'legal': 11,
  'other': 12
};

function prioritizeLinksForScraping(
  links: NavigationLink[],
  maxPages: number
): NavigationLink[] {
  // 1. Score each link
  const scored = links.map(link => ({
    ...link,
    score: calculateLinkScore(link)
  }));

  // 2. Sort by score (lower is better)
  scored.sort((a, b) => a.score - b.score);

  // 3. Take top N
  return scored.slice(0, maxPages);
}

function calculateLinkScore(link: NavigationLink): number {
  const baseScore = PAGE_TYPE_PRIORITY[link.pageType] || 100;

  // Boost score for exact matches in URL
  let urlBoost = 0;
  if (link.url.includes(link.pageType)) {
    urlBoost = -10;  // Negative = higher priority
  }

  // Penalize deep URLs
  const depth = link.url.split('/').length - 3;  // -3 for protocol://domain
  const depthPenalty = depth * 5;

  return baseScore + urlBoost + depthPenalty;
}
```

### Color Extraction & Frequency Analysis

**File**: `src/lib/scraping/content-extractor.ts:extractBrandColors`

```typescript
function extractBrandColors(html: string): string[] {
  const $ = cheerio.load(html);
  const colors: string[] = [];

  // 1. Extract from inline styles
  $('[style]').each((_, elem) => {
    const style = $(elem).attr('style') || '';
    const colorMatches = style.match(/#[0-9a-f]{6}|#[0-9a-f]{3}/gi);
    if (colorMatches) {
      colors.push(...colorMatches);
    }
  });

  // 2. Extract from <style> tags
  $('style').each((_, elem) => {
    const css = $(elem).html() || '';
    const colorMatches = css.match(/#[0-9a-f]{6}|#[0-9a-f]{3}/gi);
    if (colorMatches) {
      colors.push(...colorMatches);
    }
  });

  // 3. Normalize to 6-digit hex
  const normalized = colors.map(normalizeHexColor);

  // 4. Count frequency
  const frequency = new Map<string, number>();
  normalized.forEach(color => {
    frequency.set(color, (frequency.get(color) || 0) + 1);
  });

  // 5. Filter out common colors (white, black, gray)
  const filtered = Array.from(frequency.entries())
    .filter(([color]) => !isCommonColor(color))
    .sort((a, b) => b[1] - a[1])  // Sort by frequency
    .map(([color]) => color);

  // 6. Return top 5 unique colors
  return [...new Set(filtered)].slice(0, 5);
}

function normalizeHexColor(hex: string): string {
  hex = hex.toLowerCase();
  if (hex.length === 4) {
    // #abc -> #aabbcc
    return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  return hex;
}

function isCommonColor(hex: string): boolean {
  const common = ['#ffffff', '#000000', '#f0f0f0', '#e0e0e0', '#cccccc'];
  return common.includes(hex);
}
```

---

## Extension Points

### Adding New Content Extractors

To extract new types of content:

1. **Add extraction function** in `src/lib/scraping/content-extractor.ts`:

```typescript
function extractNewFeature($: CheerioAPI, baseUrl: string): NewFeatureType {
  // Use CSS selectors to find relevant elements
  const elements = $('.new-feature-selector');

  // Extract and transform data
  const results = elements.map((_, elem) => {
    return {
      title: $(elem).find('.title').text().trim(),
      // ... other fields
    };
  }).get();

  return results;
}
```

2. **Add to `ExtractedBusinessInfo` type** in `src/lib/types/site-generation-jobs.ts`:

```typescript
interface ExtractedBusinessInfo {
  // ... existing fields
  newFeature?: NewFeatureType;
}
```

3. **Call in `extractBusinessInfo()`**:

```typescript
return {
  // ... existing extractions
  newFeature: extractNewFeature($, baseUrl)
};
```

4. **Update prompts** in `src/lib/ai/prompts/site-generation-prompts.ts`:

```typescript
if (scrapedContext.businessInfo.newFeature) {
  prompt += `\nNew Feature Data:\n`;
  prompt += JSON.stringify(scrapedContext.businessInfo.newFeature, null, 2);
}
```

### Adding New Page Types

To support new page type priorities:

1. **Update `PAGE_TYPE_PRIORITY`** in `src/lib/scraping/link-extractor.ts`:

```typescript
const PAGE_TYPE_PRIORITY = {
  // ... existing
  'new-page-type': 3,  // Choose appropriate priority
};
```

2. **Add detection pattern** in `inferPageType()`:

```typescript
if (/new-page-pattern/i.test(url) || /new-keyword/i.test(linkText)) {
  return 'new-page-type';
}
```

### Customizing LLM Behavior

To modify how the LLM processes scraped data:

1. **Adjust system prompts** in `src/lib/ai/prompts/site-generation-prompts.ts`
2. **Modify temperature settings** in `src/lib/ai/site-generator-service.ts`
3. **Update response schemas** in `src/lib/ai/response-parser.ts`

### Adding New External Services

To integrate a new scraping service:

1. **Create new client** in `src/lib/scraping/`:

```typescript
// new-scraper-client.ts
export async function scrapeWithNewService(url: string): Promise<ScrapedPage> {
  // Implement service-specific logic
}
```

2. **Update configuration** in `src/lib/config/scraping.ts`
3. **Modify `scrapeUrl()`** in `src/lib/scraping/scraping-client.ts` to use new service

---

## Performance Considerations

### Parallel Processing

- **Page scraping**: Up to 3 concurrent requests (`scrapeMultipleUrls` with `maxConcurrent: 3`)
- **LLM section generation**: All 7 sections generated in parallel (Phase 2)
- **Logo processing**: Async, doesn't block job creation

### Timeouts

- **Scraping**: 30s per page (configurable)
- **LLM calls**: 30s default (OpenRouter client)
- **Overall job**: No hard limit, but typically completes in 60-120s

### Caching

Currently no caching. Potential improvements:
- Cache scraped pages for 1 hour (reduce redundant scraping)
- Cache LLM responses for identical inputs
- CDN caching for processed logos

---

## Monitoring & Debugging

### Key Metrics to Track

1. **Scraping Success Rate**: % of successful scraping attempts
2. **Average Scraping Duration**: Time to scrape all pages
3. **LLM Generation Time**: Phase 1 + Phase 2 duration
4. **Job Completion Rate**: % of jobs that complete successfully
5. **Rate Limit Hits**: Frequency of rate limit errors
6. **SSRF Blocks**: Frequency of blocked URLs (security monitoring)

### Logging Points

```typescript
// Scraping client
console.log('Scraping URL:', url);
console.log('Scraping result:', { statusCode, contentLength });

// Content extractor
console.log('Logo extraction attempt:', { selectors: 20, found: logoUrl });
console.log('Business hours extracted:', businessHours.length);

// Content analyzer
console.log('Scraped pages analyzed:', pages.length);
console.log('Recommended pages:', recommendedPages);

// LLM generation
console.log('LLM prompt tokens:', tokenUsage.prompt_tokens);
console.log('LLM completion tokens:', tokenUsage.completion_tokens);
console.log('Generation cost (cents):', costCents);

// Job completion
console.log('Job completed:', { jobId, siteId, duration, cost });
```

### Debugging Tips

1. **Logo not found**: Check console for logo extraction debug logs
2. **Services not extracted**: Verify HTML structure matches selectors
3. **LLM response malformed**: Check `response-parser.ts` error recovery logs
4. **Scraping timeout**: Increase `SCRAPING_SERVICE_TIMEOUT` in env
5. **Rate limit hit**: Check `site_generation_jobs` table for recent jobs

---

## Related Files Reference

| Component | File Path | Lines | Purpose |
|-----------|-----------|-------|---------|
| API Endpoint | `app/api/sites/generate/route.ts` | 496 | Job creation & scraping orchestration |
| Status Endpoint | `app/api/sites/generate/[jobId]/route.ts` | ~150 | Job status polling |
| UI Component | `app/dashboard/sites/page.tsx` | 28,330 | Site creation interface |
| Scraping Client | `src/lib/scraping/scraping-client.ts` | 187 | HTTP client for Puppeteer service |
| Page Discovery | `src/lib/scraping/page-discovery.ts` | 112 | Multi-page discovery |
| Link Extractor | `src/lib/scraping/link-extractor.ts` | ~200 | Navigation link extraction |
| Content Extractor | `src/lib/scraping/content-extractor.ts` | 1,438 | Business data extraction |
| Content Analyzer | `src/lib/scraping/content-analyzer.ts` | ~150 | Multi-page synthesis |
| LLM Client | `src/lib/ai/openrouter-client.ts` | ~200 | OpenRouter API integration |
| Site Generator | `src/lib/ai/site-generator-service.ts` | ~500 | Site generation orchestration |
| Prompts | `src/lib/ai/prompts/site-generation-prompts.ts` | ~300 | Prompt templates |
| Response Parser | `src/lib/ai/response-parser.ts` | ~400 | LLM response parsing |
| Error Recovery | `src/lib/ai/error-recovery.ts` | ~200 | JSON repair & validation |
| Logo Processor | `src/lib/storage/logo-processor.ts` | ~300 | Logo download & upload |
| Input Sanitization | `src/lib/security/input-sanitization.ts` | ~200 | URL/HTML sanitization |
| Rate Limiting | `src/lib/security/site-generation-rate-limit.ts` | ~150 | Rate limit enforcement |
| Content Moderation | `src/lib/security/content-moderation.ts` | ~150 | Content safety checks |
| Background Processor | `src/lib/jobs/background-processor.ts` | ~400 | Async job processing |
| Types | `src/lib/types/site-generation-jobs.ts` | ~300 | TypeScript type definitions |
| Config | `src/lib/config/scraping.ts` | ~50 | Scraping service config |

---

## Conclusion

This document provides a complete technical reference for the website scraping subsystem. For step-by-step implementation details, see [SCRAPING_IMPLEMENTATION.md](./SCRAPING_IMPLEMENTATION.md). For setup instructions, see [SCRAPING_SETUP.md](./SCRAPING_SETUP.md).

**Questions or issues?** Check the troubleshooting sections in the related documentation or review the code files listed in the reference table above.
