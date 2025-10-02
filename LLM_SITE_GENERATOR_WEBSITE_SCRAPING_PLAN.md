# Website-Based Site Generation: Implementation Plan

## Executive Summary

This document outlines a comprehensive plan to enhance the existing LLM-powered site generator with **website scraping capabilities**. This feature allows users to provide an existing website URL as input, which the system will intelligently analyze and scrape to extract business information, branding, content, and structure. This scraped data enhances the LLM's ability to generate high-quality, contextually accurate sites.

**Key Capabilities:**
- Accept optional `based_on_website` URL parameter
- Intelligently discover and scrape relevant pages (homepage, about, contact, services, etc.)
- Extract structured business data (contact info, hours, location, branding)
- Analyze brand identity (colors, fonts, logo, tone)
- Allow LLM to generate variable page counts based on scraped content
- Graceful fallback to prompt-only generation if scraping fails

---

## Milestone 1: Scraping Service Integration

### 1.1 Environment Configuration

**New Environment Variables** (`.env.local`, `.env.production`):
```bash
# Scraping Service Configuration
SCRAPING_SERVICE_URL=https://puppeteer-api-production-7bea.up.railway.app
SCRAPING_SERVICE_SALT=your-secret-salt-here
SCRAPING_SERVICE_TIMEOUT=30000  # 30 seconds
SCRAPING_SERVICE_MAX_RETRIES=2
```

**Implementation Files:**
- Create `/src/lib/config/scraping.ts`:
  ```typescript
  export const scrapingConfig = {
    serviceUrl: process.env.SCRAPING_SERVICE_URL,
    salt: process.env.SCRAPING_SERVICE_SALT,
    timeout: parseInt(process.env.SCRAPING_SERVICE_TIMEOUT || '30000'),
    maxRetries: parseInt(process.env.SCRAPING_SERVICE_MAX_RETRIES || '2'),
    maxPagesPerSite: 5, // Limit pages to scrape
  } as const;

  if (!scrapingConfig.serviceUrl || !scrapingConfig.salt) {
    throw new Error('Missing required scraping service configuration');
  }
  ```

### 1.2 HTTP Client for Scraping Service

**Create `/src/lib/scraping/scraping-client.ts`:**

```typescript
import crypto from 'crypto';
import { scrapingConfig } from '@/lib/config/scraping';
import { handleError } from '@/lib/types/error-handling';

interface ScrapingRequest {
  url: string;
  timeout?: number;
}

interface ScrapingResponse {
  success: boolean;
  url: string;
  html?: string;
  screenshot?: string; // Base64 encoded screenshot
  metadata?: {
    title?: string;
    description?: string;
    favicon?: string;
  };
  error?: string;
}

/**
 * Generates MD5 hash for scraping service authentication
 */
function generateScrapingHash(url: string): string {
  const payload = `${url}:${scrapingConfig.salt}`;
  return crypto.createHash('md5').update(payload).digest('hex').toLowerCase();
}

/**
 * Validates URL for scraping safety
 */
function validateScrapingUrl(url: string): void {
  try {
    const parsedUrl = new URL(url);

    // Block localhost and internal IPs
    if (parsedUrl.hostname === 'localhost' ||
        parsedUrl.hostname === '127.0.0.1' ||
        parsedUrl.hostname.startsWith('192.168.') ||
        parsedUrl.hostname.startsWith('10.') ||
        parsedUrl.hostname.startsWith('172.')) {
      throw new Error('Cannot scrape localhost or internal IPs');
    }

    // Only allow HTTP/HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Only HTTP and HTTPS URLs are allowed');
    }

    // Must have valid hostname
    if (!parsedUrl.hostname || parsedUrl.hostname.length < 3) {
      throw new Error('Invalid hostname');
    }
  } catch (error: unknown) {
    throw new Error(`Invalid URL for scraping: ${handleError(error).message}`);
  }
}

/**
 * Scrapes a single URL using the external scraping service
 */
export async function scrapeUrl(
  url: string,
  options: { timeout?: number; retries?: number } = {}
): Promise<ScrapingResponse> {
  validateScrapingUrl(url);

  const timeout = options.timeout || scrapingConfig.timeout;
  const maxRetries = options.retries || scrapingConfig.maxRetries;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const hash = generateScrapingHash(url);
      const requestBody: ScrapingRequest = { url, timeout };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout + 5000); // 5s buffer

      const response = await fetch(`${scrapingConfig.serviceUrl}/fetch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          hash,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Scraping service returned ${response.status}: ${errorText}`);
      }

      const data = await response.json() as ScrapingResponse;

      if (!data.success) {
        throw new Error(data.error || 'Scraping failed without error message');
      }

      return data;
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on validation errors
      if (lastError.message.includes('Invalid URL')) {
        throw lastError;
      }

      // Retry on network/timeout errors
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
        continue;
      }
    }
  }

  throw lastError || new Error('Scraping failed after retries');
}

/**
 * Scrapes multiple URLs in parallel with concurrency limit
 */
export async function scrapeMultipleUrls(
  urls: string[],
  options: { concurrency?: number } = {}
): Promise<Map<string, ScrapingResponse>> {
  const concurrency = options.concurrency || 3;
  const results = new Map<string, ScrapingResponse>();

  // Process URLs in batches
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const responses = await Promise.allSettled(
      batch.map(url => scrapeUrl(url))
    );

    responses.forEach((result, index) => {
      const url = batch[index];
      if (result.status === 'fulfilled') {
        results.set(url, result.value);
      } else {
        results.set(url, {
          success: false,
          url,
          error: result.reason?.message || 'Unknown error'
        });
      }
    });
  }

  return results;
}
```

**Key Design Decisions:**
- MD5 hash authentication matches external service requirements
- URL validation prevents SSRF attacks
- Exponential backoff retry logic for resilience
- Timeout protection with AbortController
- Concurrent scraping with configurable concurrency limit

---

## Milestone 2: Intelligent Page Discovery

### 2.1 Navigation Link Extraction

**Create `/src/lib/scraping/link-extractor.ts`:**

```typescript
import { load } from 'cheerio';
import type { CheerioAPI } from 'cheerio';

interface ExtractedLink {
  href: string;
  text: string;
  isInternal: boolean;
  pageType?: 'about' | 'contact' | 'services' | 'team' | 'blog' | 'products' | 'faq' | 'privacy' | 'terms' | 'other';
}

/**
 * Normalizes a URL by removing fragments, trailing slashes, and query params
 */
function normalizeUrl(url: string, baseUrl: string): string {
  try {
    const fullUrl = new URL(url, baseUrl);
    // Remove fragments and trailing slashes
    fullUrl.hash = '';
    let path = fullUrl.pathname.replace(/\/+$/, '');
    if (!path) path = '/';
    return `${fullUrl.origin}${path}`;
  } catch {
    return '';
  }
}

/**
 * Determines if a URL is internal to the base domain
 */
function isInternalUrl(url: string, baseUrl: string): boolean {
  try {
    const parsedUrl = new URL(url, baseUrl);
    const parsedBase = new URL(baseUrl);
    return parsedUrl.hostname === parsedBase.hostname;
  } catch {
    return false;
  }
}

/**
 * Infers page type from URL path and link text
 */
function inferPageType(href: string, text: string): ExtractedLink['pageType'] {
  const combined = `${href} ${text}`.toLowerCase();

  const patterns: Array<[RegExp, ExtractedLink['pageType']]> = [
    [/\b(about|our-story|who-we-are|mission|vision)\b/, 'about'],
    [/\b(contact|get-in-touch|reach-us|location)\b/, 'contact'],
    [/\b(services|what-we-do|offerings|solutions)\b/, 'services'],
    [/\b(team|staff|people|our-team|meet-the-team)\b/, 'team'],
    [/\b(blog|news|articles|insights)\b/, 'blog'],
    [/\b(products|shop|store|catalog)\b/, 'products'],
    [/\b(faq|help|support|questions)\b/, 'faq'],
    [/\b(privacy|privacy-policy)\b/, 'privacy'],
    [/\b(terms|terms-of-service|tos)\b/, 'terms'],
  ];

  for (const [pattern, type] of patterns) {
    if (pattern.test(combined)) {
      return type;
    }
  }

  return 'other';
}

/**
 * Extracts navigation links from HTML
 */
export function extractNavigationLinks(html: string, baseUrl: string): ExtractedLink[] {
  const $ = load(html);
  const links: ExtractedLink[] = [];
  const seen = new Set<string>();

  // Find links in navigation elements
  const navSelectors = [
    'nav a',
    'header a',
    '[role="navigation"] a',
    '.nav a',
    '.navigation a',
    '.menu a',
    '.navbar a',
  ];

  navSelectors.forEach(selector => {
    $(selector).each((_, element) => {
      const $link = $(element);
      const href = $link.attr('href');
      const text = $link.text().trim();

      if (!href || !text) return;

      const normalizedUrl = normalizeUrl(href, baseUrl);
      if (!normalizedUrl || seen.has(normalizedUrl)) return;

      // Skip non-HTTP links (mailto, tel, javascript, etc.)
      if (!normalizedUrl.startsWith('http')) return;

      const isInternal = isInternalUrl(normalizedUrl, baseUrl);
      if (!isInternal) return; // Only track internal links

      // Skip homepage (we already have it)
      const baseNormalized = normalizeUrl(baseUrl, baseUrl);
      if (normalizedUrl === baseNormalized) return;

      seen.add(normalizedUrl);

      links.push({
        href: normalizedUrl,
        text,
        isInternal,
        pageType: inferPageType(normalizedUrl, text),
      });
    });
  });

  return links;
}

/**
 * Prioritizes links for scraping based on page type
 */
export function prioritizeLinksForScraping(
  links: ExtractedLink[],
  maxPages: number = 5
): ExtractedLink[] {
  // Priority order for page types
  const priorityOrder: Array<ExtractedLink['pageType']> = [
    'about',
    'contact',
    'services',
    'team',
    'products',
    'faq',
    'blog',
    'privacy',
    'terms',
    'other',
  ];

  // Sort by priority
  const sorted = [...links].sort((a, b) => {
    const aPriority = priorityOrder.indexOf(a.pageType || 'other');
    const bPriority = priorityOrder.indexOf(b.pageType || 'other');
    return aPriority - bPriority;
  });

  // Take top N by priority
  return sorted.slice(0, maxPages);
}
```

### 2.2 Page Discovery Orchestrator

**Create `/src/lib/scraping/page-discovery.ts`:**

```typescript
import { scrapeUrl, scrapeMultipleUrls } from './scraping-client';
import { extractNavigationLinks, prioritizeLinksForScraping } from './link-extractor';
import { scrapingConfig } from '@/lib/config/scraping';

export interface DiscoveredPage {
  url: string;
  pageType: 'homepage' | 'about' | 'contact' | 'services' | 'team' | 'blog' | 'products' | 'faq' | 'privacy' | 'terms' | 'other';
  html: string;
  metadata?: {
    title?: string;
    description?: string;
  };
  scrapedAt: Date;
}

export interface PageDiscoveryResult {
  baseUrl: string;
  pages: DiscoveredPage[];
  errors: Array<{ url: string; error: string }>;
  totalPagesFound: number;
  totalPagesScraped: number;
}

/**
 * Discovers and scrapes relevant pages from a website
 */
export async function discoverAndScrapePages(
  websiteUrl: string
): Promise<PageDiscoveryResult> {
  const errors: Array<{ url: string; error: string }> = [];
  const pages: DiscoveredPage[] = [];

  // Step 1: Scrape homepage
  let homepageResponse;
  try {
    homepageResponse = await scrapeUrl(websiteUrl);

    if (homepageResponse.success && homepageResponse.html) {
      pages.push({
        url: websiteUrl,
        pageType: 'homepage',
        html: homepageResponse.html,
        metadata: homepageResponse.metadata,
        scrapedAt: new Date(),
      });
    } else {
      throw new Error(homepageResponse.error || 'Failed to scrape homepage');
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors.push({ url: websiteUrl, error: errorMessage });

    // If homepage fails, abort entirely
    return {
      baseUrl: websiteUrl,
      pages: [],
      errors,
      totalPagesFound: 0,
      totalPagesScraped: 0,
    };
  }

  // Step 2: Extract navigation links from homepage
  const navLinks = extractNavigationLinks(homepageResponse.html!, websiteUrl);

  // Step 3: Prioritize links for scraping
  const prioritized = prioritizeLinksForScraping(navLinks, scrapingConfig.maxPagesPerSite - 1); // -1 for homepage

  // Step 4: Scrape prioritized pages in parallel
  if (prioritized.length > 0) {
    const urlsToScrape = prioritized.map(link => link.url);
    const responses = await scrapeMultipleUrls(urlsToScrape, { concurrency: 3 });

    responses.forEach((response, url) => {
      const link = prioritized.find(l => l.url === url);

      if (response.success && response.html) {
        pages.push({
          url,
          pageType: link?.pageType || 'other',
          html: response.html,
          metadata: response.metadata,
          scrapedAt: new Date(),
        });
      } else {
        errors.push({ url, error: response.error || 'Unknown error' });
      }
    });
  }

  return {
    baseUrl: websiteUrl,
    pages,
    errors,
    totalPagesFound: navLinks.length + 1, // +1 for homepage
    totalPagesScraped: pages.length,
  };
}
```

**Key Features:**
- Scrapes homepage first (critical path)
- Extracts navigation links using Cheerio
- Prioritizes pages by type (about > contact > services > etc.)
- Limits total pages scraped (cost control)
- Parallel scraping with concurrency control
- Graceful error handling with partial success

---

## Milestone 3: Content Extraction & Analysis

### 3.1 Structured Data Extraction

**Create `/src/lib/scraping/content-extractor.ts`:**

```typescript
import { load } from 'cheerio';
import type { CheerioAPI } from 'cheerio';

export interface ExtractedBusinessInfo {
  // Contact Information
  emails: string[];
  phones: string[];
  addresses: string[];

  // Business Hours
  hours?: Record<string, { open: string | null; close: string | null; closed: boolean }>;

  // Social Media
  socialLinks: Array<{ platform: string; url: string }>;

  // Location
  coordinates?: { lat: number; lng: number };

  // Branding
  logoUrl?: string;
  brandColors: string[];

  // Content
  businessDescription?: string;
  tagline?: string;
  keyFeatures: string[];

  // Metadata
  siteTitle?: string;
  siteDescription?: string;
  favicon?: string;
}

/**
 * Extracts email addresses from HTML
 */
function extractEmails($: CheerioAPI): string[] {
  const emails = new Set<string>();
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

  // Check mailto links
  $('a[href^="mailto:"]').each((_, element) => {
    const href = $(element).attr('href');
    if (href) {
      const email = href.replace('mailto:', '').split('?')[0];
      if (email && emailRegex.test(email)) {
        emails.add(email.toLowerCase());
      }
    }
  });

  // Check text content
  const bodyText = $('body').text();
  const matches = bodyText.match(emailRegex);
  if (matches) {
    matches.forEach(email => {
      // Filter out common false positives
      if (!email.endsWith('.png') && !email.endsWith('.jpg') && !email.includes('example')) {
        emails.add(email.toLowerCase());
      }
    });
  }

  return Array.from(emails).slice(0, 5); // Limit to 5
}

/**
 * Extracts phone numbers from HTML
 */
function extractPhones($: CheerioAPI): string[] {
  const phones = new Set<string>();

  // Check tel links
  $('a[href^="tel:"]').each((_, element) => {
    const href = $(element).attr('href');
    if (href) {
      const phone = href.replace('tel:', '').trim();
      phones.add(phone);
    }
  });

  // Check text content with common phone patterns
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const bodyText = $('body').text();
  const matches = bodyText.match(phoneRegex);
  if (matches) {
    matches.forEach(phone => phones.add(phone.trim()));
  }

  return Array.from(phones).slice(0, 3); // Limit to 3
}

/**
 * Extracts physical addresses using common patterns
 */
function extractAddresses($: CheerioAPI): string[] {
  const addresses = new Set<string>();

  // Look for structured data (schema.org)
  $('[itemtype*="schema.org/PostalAddress"]').each((_, element) => {
    const street = $(element).find('[itemprop="streetAddress"]').text().trim();
    const city = $(element).find('[itemprop="addressLocality"]').text().trim();
    const state = $(element).find('[itemprop="addressRegion"]').text().trim();
    const zip = $(element).find('[itemprop="postalCode"]').text().trim();

    if (street || city) {
      addresses.add([street, city, state, zip].filter(Boolean).join(', '));
    }
  });

  // Look for address-related elements
  const addressSelectors = [
    '[class*="address"]',
    '[id*="address"]',
    'address',
  ];

  addressSelectors.forEach(selector => {
    $(selector).each((_, element) => {
      const text = $(element).text().trim();
      // Simple heuristic: contains digits and common address words
      if (text.length > 10 && text.length < 200 && /\d/.test(text) &&
          (/street|st\b|avenue|ave\b|road|rd\b|boulevard|blvd|drive|dr\b/i.test(text))) {
        addresses.add(text);
      }
    });
  });

  return Array.from(addresses).slice(0, 2); // Limit to 2
}

/**
 * Extracts social media links
 */
function extractSocialLinks($: CheerioAPI): Array<{ platform: string; url: string }> {
  const socialLinks: Array<{ platform: string; url: string }> = [];
  const platforms = [
    { name: 'facebook', pattern: /facebook\.com/ },
    { name: 'twitter', pattern: /twitter\.com|x\.com/ },
    { name: 'instagram', pattern: /instagram\.com/ },
    { name: 'linkedin', pattern: /linkedin\.com/ },
    { name: 'youtube', pattern: /youtube\.com/ },
    { name: 'pinterest', pattern: /pinterest\.com/ },
    { name: 'tiktok', pattern: /tiktok\.com/ },
  ];

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (!href) return;

    for (const { name, pattern } of platforms) {
      if (pattern.test(href)) {
        socialLinks.push({ platform: name, url: href });
        break;
      }
    }
  });

  // Deduplicate by platform (keep first occurrence)
  const seen = new Set<string>();
  return socialLinks.filter(link => {
    if (seen.has(link.platform)) return false;
    seen.add(link.platform);
    return true;
  });
}

/**
 * Extracts logo URL from page
 */
function extractLogo($: CheerioAPI, baseUrl: string): string | undefined {
  // Try common logo selectors
  const logoSelectors = [
    'img[class*="logo"]',
    'img[id*="logo"]',
    '.logo img',
    '#logo img',
    'header img:first',
    '.site-logo img',
    '[class*="brand"] img',
  ];

  for (const selector of logoSelectors) {
    const img = $(selector).first();
    if (img.length) {
      const src = img.attr('src');
      if (src) {
        try {
          return new URL(src, baseUrl).href;
        } catch {
          return undefined;
        }
      }
    }
  }

  return undefined;
}

/**
 * Extracts brand colors from CSS
 */
function extractBrandColors(html: string): string[] {
  const colors = new Set<string>();
  const hexColorRegex = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/g;

  // Extract from style tags
  const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  if (styleMatches) {
    styleMatches.forEach(styleTag => {
      const matches = styleTag.match(hexColorRegex);
      if (matches) {
        matches.forEach(color => colors.add(color.toLowerCase()));
      }
    });
  }

  // Extract from inline styles
  const inlineMatches = html.match(/style="[^"]*"/gi);
  if (inlineMatches) {
    inlineMatches.forEach(inlineStyle => {
      const matches = inlineStyle.match(hexColorRegex);
      if (matches) {
        matches.forEach(color => colors.add(color.toLowerCase()));
      }
    });
  }

  // Filter out common colors (white, black, gray)
  const commonColors = ['#ffffff', '#fff', '#000000', '#000', '#cccccc', '#ccc'];
  const filtered = Array.from(colors).filter(color => !commonColors.includes(color));

  return filtered.slice(0, 5); // Top 5 unique colors
}

/**
 * Extracts key features or selling points
 */
function extractKeyFeatures($: CheerioAPI): string[] {
  const features: string[] = [];

  // Look for feature lists
  const featureSelectors = [
    '[class*="feature"] li',
    '[class*="benefit"] li',
    '[class*="service"] li',
    '[class*="highlight"] li',
  ];

  featureSelectors.forEach(selector => {
    $(selector).each((_, element) => {
      const text = $(element).text().trim();
      if (text.length > 5 && text.length < 200) {
        features.push(text);
      }
    });
  });

  return features.slice(0, 10); // Top 10 features
}

/**
 * Extracts business description from common locations
 */
function extractBusinessDescription($: CheerioAPI): string | undefined {
  // Try meta description first
  const metaDescription = $('meta[name="description"]').attr('content');
  if (metaDescription && metaDescription.length > 20) {
    return metaDescription.trim();
  }

  // Try structured data
  const schemaDescription = $('[itemtype*="schema.org/Organization"] [itemprop="description"]').text().trim();
  if (schemaDescription && schemaDescription.length > 20) {
    return schemaDescription;
  }

  // Try common description elements
  const descriptionSelectors = [
    '[class*="description"]:first',
    '[class*="about"]:first p:first',
    '[class*="intro"]:first p:first',
  ];

  for (const selector of descriptionSelectors) {
    const text = $(selector).text().trim();
    if (text.length > 20 && text.length < 500) {
      return text;
    }
  }

  return undefined;
}

/**
 * Main extraction function
 */
export function extractBusinessInfo(html: string, baseUrl: string): ExtractedBusinessInfo {
  const $ = load(html);

  return {
    emails: extractEmails($),
    phones: extractPhones($),
    addresses: extractAddresses($),
    socialLinks: extractSocialLinks($),
    logoUrl: extractLogo($, baseUrl),
    brandColors: extractBrandColors(html),
    keyFeatures: extractKeyFeatures($),
    businessDescription: extractBusinessDescription($),
    siteTitle: $('title').text().trim() || undefined,
    siteDescription: $('meta[name="description"]').attr('content')?.trim() || undefined,
    favicon: $('link[rel*="icon"]').attr('href') || undefined,
  };
}
```

### 3.2 Content Analysis & Synthesis

**Create `/src/lib/scraping/content-analyzer.ts`:**

```typescript
import type { DiscoveredPage } from './page-discovery';
import { extractBusinessInfo, type ExtractedBusinessInfo } from './content-extractor';
import { load } from 'cheerio';

export interface AnalyzedWebsite {
  baseUrl: string;
  businessInfo: ExtractedBusinessInfo;
  pageContents: Map<string, string>; // pageType -> cleaned text content
  recommendedPages: string[]; // Page types to generate based on what was found
  contentSummary: string; // High-level summary for LLM context
}

/**
 * Cleans and extracts main text content from HTML
 */
function extractCleanText(html: string): string {
  const $ = load(html);

  // Remove unwanted elements
  $('script, style, nav, header, footer, iframe, noscript').remove();

  // Extract main content area if identifiable
  const mainSelectors = ['main', '[role="main"]', '#content', '.content', 'article'];
  let mainContent = '';

  for (const selector of mainSelectors) {
    const content = $(selector).first().text();
    if (content.length > mainContent.length) {
      mainContent = content;
    }
  }

  // Fallback to body if no main content found
  if (!mainContent || mainContent.length < 100) {
    mainContent = $('body').text();
  }

  // Clean whitespace
  return mainContent
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim()
    .slice(0, 5000); // Limit to 5000 chars per page
}

/**
 * Recommends which page types to generate based on discovered content
 */
function recommendPagesToGenerate(pages: DiscoveredPage[]): string[] {
  const found = new Set(pages.map(p => p.pageType));
  const recommended: string[] = ['home']; // Always generate home

  // If about page found, generate about
  if (found.has('about')) {
    recommended.push('about');
  }

  // If contact page found, generate contact
  if (found.has('contact')) {
    recommended.push('contact');
  }

  // If services found, generate services
  if (found.has('services')) {
    recommended.push('services');
  }

  // If team found, generate team
  if (found.has('team')) {
    recommended.push('team');
  }

  // If FAQ found, generate FAQ
  if (found.has('faq')) {
    recommended.push('faq');
  }

  // Always generate contact if not found (required)
  if (!recommended.includes('contact')) {
    recommended.push('contact');
  }

  // Always generate about if not found (required)
  if (!recommended.includes('about')) {
    recommended.push('about');
  }

  return recommended;
}

/**
 * Creates a content summary for LLM context
 */
function createContentSummary(
  businessInfo: ExtractedBusinessInfo,
  pageContents: Map<string, string>
): string {
  const parts: string[] = [];

  if (businessInfo.siteTitle) {
    parts.push(`Site Title: ${businessInfo.siteTitle}`);
  }

  if (businessInfo.businessDescription) {
    parts.push(`Description: ${businessInfo.businessDescription}`);
  }

  if (businessInfo.keyFeatures.length > 0) {
    parts.push(`Key Features: ${businessInfo.keyFeatures.slice(0, 5).join(', ')}`);
  }

  pageContents.forEach((content, pageType) => {
    const preview = content.slice(0, 500);
    parts.push(`\n${pageType.toUpperCase()} Page Preview:\n${preview}...`);
  });

  return parts.join('\n\n');
}

/**
 * Analyzes scraped pages and synthesizes content
 */
export function analyzeScrapedWebsite(pages: DiscoveredPage[]): AnalyzedWebsite {
  if (pages.length === 0) {
    throw new Error('No pages to analyze');
  }

  const homepage = pages.find(p => p.pageType === 'homepage');
  if (!homepage) {
    throw new Error('Homepage not found in scraped pages');
  }

  // Extract business info from homepage
  const businessInfo = extractBusinessInfo(homepage.html, homepage.url);

  // Extract clean text from each page
  const pageContents = new Map<string, string>();
  pages.forEach(page => {
    const cleanText = extractCleanText(page.html);
    if (cleanText.length > 50) { // Only include if substantial content
      pageContents.set(page.pageType, cleanText);
    }
  });

  // Recommend pages to generate
  const recommendedPages = recommendPagesToGenerate(pages);

  // Create summary
  const contentSummary = createContentSummary(businessInfo, pageContents);

  return {
    baseUrl: homepage.url,
    businessInfo,
    pageContents,
    recommendedPages,
    contentSummary,
  };
}
```

**Key Capabilities:**
- Extracts emails, phones, addresses using regex and DOM parsing
- Finds social media links for all major platforms
- Extracts logo from common selectors
- Analyzes CSS for brand colors
- Identifies key features from list elements
- Cleans and normalizes text content
- Recommends which pages to generate based on discovered content
- Creates concise summary for LLM prompt enhancement

---

## Milestone 4: Enhanced LLM Integration

### 4.1 Updated Request Schema

**Update `/src/lib/types/site-generation-jobs.ts`:**

```typescript
export interface BusinessInfo {
  // Existing fields
  prompt: string;
  name: string;
  industry?: string;
  location?: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  brandColors?: string;
  additionalDetails?: Record<string, unknown>;

  // NEW: Website scraping field
  basedOnWebsite?: string; // Optional URL to scrape
}

// NEW: Scraped website data for LLM context
export interface ScrapedWebsiteContext {
  baseUrl: string;
  businessInfo: {
    emails?: string[];
    phones?: string[];
    addresses?: string[];
    socialLinks?: Array<{ platform: string; url: string }>;
    logoUrl?: string;
    brandColors?: string[];
  };
  pageContents?: Record<string, string>; // pageType -> text content
  recommendedPages?: string[];
  contentSummary?: string;
}
```

### 4.2 Enhanced Prompt Builder

**Update `/src/lib/ai/prompts/site-generation-prompts.ts`:**

```typescript
/**
 * Builds enhanced foundation prompt with scraped website context
 */
export function buildFoundationPromptWithContext(
  businessInfo: BusinessInfo,
  scrapedContext?: ScrapedWebsiteContext
): string {
  const sections: string[] = [];

  // User's original request
  sections.push(`User Request: ${businessInfo.prompt}`);
  sections.push('');

  // Basic business information
  sections.push('Business Information:');
  sections.push(`- Name: ${businessInfo.name}`);
  if (businessInfo.industry) sections.push(`- Industry: ${businessInfo.industry}`);
  if (businessInfo.location) sections.push(`- Location: ${businessInfo.location}`);
  if (businessInfo.description) sections.push(`- Description: ${businessInfo.description}`);

  // Use scraped contact info if available, otherwise use provided
  if (scrapedContext?.businessInfo.emails?.length) {
    sections.push(`- Email: ${scrapedContext.businessInfo.emails[0]}`);
  } else if (businessInfo.email) {
    sections.push(`- Email: ${businessInfo.email}`);
  }

  if (scrapedContext?.businessInfo.phones?.length) {
    sections.push(`- Phone: ${scrapedContext.businessInfo.phones[0]}`);
  } else if (businessInfo.phone) {
    sections.push(`- Phone: ${businessInfo.phone}`);
  }

  if (businessInfo.website) sections.push(`- Existing Website: ${businessInfo.website}`);
  sections.push('');

  // Scraped website context (if available)
  if (scrapedContext) {
    sections.push('=== EXISTING WEBSITE ANALYSIS ===');
    sections.push('The user has an existing website that we analyzed. Use this information to create a better, modernized version of their site.');
    sections.push('');

    // Branding from existing site
    if (scrapedContext.businessInfo.brandColors?.length) {
      sections.push('Existing Brand Colors (use as inspiration):');
      scrapedContext.businessInfo.brandColors.forEach(color => {
        sections.push(`- ${color}`);
      });
      sections.push('');
    }

    if (scrapedContext.businessInfo.logoUrl) {
      sections.push(`Existing Logo: ${scrapedContext.businessInfo.logoUrl}`);
      sections.push('(You can reference this logo URL in your output)');
      sections.push('');
    }

    // Social media presence
    if (scrapedContext.businessInfo.socialLinks?.length) {
      sections.push('Social Media Links:');
      scrapedContext.businessInfo.socialLinks.forEach(({ platform, url }) => {
        sections.push(`- ${platform}: ${url}`);
      });
      sections.push('');
    }

    // Additional contact info
    if (scrapedContext.businessInfo.addresses?.length) {
      sections.push('Business Address:');
      scrapedContext.businessInfo.addresses.forEach(addr => {
        sections.push(`- ${addr}`);
      });
      sections.push('');
    }

    // Content summary
    if (scrapedContext.contentSummary) {
      sections.push('Content from Existing Website:');
      sections.push(scrapedContext.contentSummary);
      sections.push('');
      sections.push('Use this content as inspiration, but improve the copy, modernize the language, and make it more engaging. Do not copy verbatim.');
      sections.push('');
    }

    // Recommended pages
    if (scrapedContext.recommendedPages?.length) {
      sections.push('Recommended Pages to Generate:');
      sections.push(scrapedContext.recommendedPages.join(', '));
      sections.push('');
    }
  }

  // Additional details
  if (businessInfo.additionalDetails && Object.keys(businessInfo.additionalDetails).length > 0) {
    sections.push('Additional Details:');
    Object.entries(businessInfo.additionalDetails).forEach(([key, value]) => {
      sections.push(`- ${key}: ${JSON.stringify(value)}`);
    });
    sections.push('');
  }

  sections.push('Generate the site foundation (metadata, branding, theme, hero section) as a structured JSON object matching the schema provided in the system prompt.');

  return sections.join('\n');
}
```

### 4.3 Dynamic Page Generation Schema

**Update `/src/lib/types/site-generation-jobs.ts`:**

```typescript
export interface GeneratedSiteData {
  site_name: string;
  tagline: string;
  description: string;

  // Core sections (always generated)
  hero: HeroSection;
  about: AboutSection;
  contact: ContactSection;
  branding: SiteBranding;
  seo: SeoMetadata;

  // Optional sections (conditionally generated)
  values?: ValuesSection;
  features?: FeaturesSection;
  services?: ServicesSection;
  team?: TeamSection;
  testimonials?: TestimonialsSection;
  faq?: FaqSection; // NEW

  // NEW: Dynamic pages based on scraped content
  customPages?: CustomPageSection[]; // NEW
}

// NEW: Custom page section for flexible page generation
export interface CustomPageSection {
  pageType: string; // 'services', 'team', 'faq', etc.
  title: string;
  slug: string;
  content: {
    headline?: string;
    description?: string;
    items?: Array<{
      title: string;
      description?: string;
      content?: string;
      image?: string;
      icon?: string;
    }>;
    richText?: string;
  };
}
```

### 4.4 Updated System Prompt

**Update `/src/lib/ai/prompts/site-generation-prompts.ts`:**

Add to `SITE_FOUNDATION_SYSTEM_PROMPT`:

```typescript
export const SITE_FOUNDATION_SYSTEM_PROMPT = `
You are an expert web designer and content strategist specializing in the garden and plant industry. Your task is to generate a complete website structure in valid JSON format based on a user's business description.

**IMPORTANT: If the user provided an existing website URL, you will receive analysis of that site. Use this information to:**
1. Preserve accurate business information (contact details, hours, location)
2. Draw inspiration from the existing brand colors and visual identity
3. Improve and modernize the content and messaging
4. Maintain consistency with their established brand while enhancing it
5. Use the existing logo URL if provided

**Dynamic Page Generation:**
- Based on the user's request and any existing website analysis, you may generate between 3 and 8 pages
- Required pages: Home, About, Contact (always generate these)
- Optional pages: Services, Team, FAQ, Testimonials, Blog, Products (generate if relevant)
- If an existing website had specific pages (e.g., "Plant Care Guide", "Our Process"), consider generating equivalent pages

**Instructions:**

1. **Analyze the User's Prompt:** Carefully read the user's description and any existing website analysis to understand their business, services, target audience, and brand aesthetic.

2. **Generate Core Site Details:**
   - site_name: Creative and relevant name for the website
   - tagline: Compelling tagline (5-10 words)
   - description: Business description (50-150 words)
   - branding: Complete theme object with colors, fonts, layout
     - If existing brand colors provided, use similar colors (modernized)
     - If existing logo provided, include logoUrl in branding
   - seo: Optimized title, description, keywords

3. **Generate Required Sections:**
   - hero: Homepage hero with headline, subheadline, features, CTAs
   - about: Company story, mission, vision (use existing site content as inspiration)
   - contact: Contact information (prefer scraped data if available)
   - testimonials: Customer testimonials or social proof

4. **Generate Optional Sections (if relevant):**
   - values: Core values (if company emphasizes values)
   - features: Key features or benefits
   - services: Service offerings (if scraped site had services page)
   - team: Team members (if scraped site had team page)
   - faq: Frequently asked questions (if scraped site had FAQ)

5. **Generate Custom Pages (if applicable):**
   - If the existing website had unique pages (e.g., "Process", "Portfolio"), generate equivalent customPages
   - Each custom page should have: pageType, title, slug, and structured content

6. **Output Format:** Single valid JSON object matching the schema. No explanations, markdown, or extra text.

... [rest of existing system prompt]
`;
```

---

## Milestone 5: Integration with Generation Pipeline

### 5.1 Update API Route

**Update `/app/api/sites/generate/route.ts`:**

```typescript
import { discoverAndScrapePages } from '@/lib/scraping/page-discovery';
import { analyzeScrapedWebsite } from '@/lib/scraping/content-analyzer';
import type { ScrapedWebsiteContext } from '@/lib/types/site-generation-jobs';

export async function POST(request: NextRequest) {
  try {
    // ... existing auth, rate limiting, validation ...

    const body = await request.json();
    const { businessInfo } = body;

    // Sanitize input
    const sanitized = sanitizeBusinessInfo(businessInfo);

    // NEW: Handle website scraping if URL provided
    let scrapedContext: ScrapedWebsiteContext | undefined;

    if (sanitized.basedOnWebsite) {
      try {
        // Update job status to indicate scraping
        await updateJobStatus({
          jobId,
          status: 'processing',
          progress: 5,
        });

        // Discover and scrape pages
        const discovery = await discoverAndScrapePages(sanitized.basedOnWebsite);

        if (discovery.pages.length === 0) {
          throw new Error('Failed to scrape website - no pages retrieved');
        }

        // Analyze scraped content
        const analyzed = analyzeScrapedWebsite(discovery.pages);

        // Build context for LLM
        scrapedContext = {
          baseUrl: analyzed.baseUrl,
          businessInfo: {
            emails: analyzed.businessInfo.emails,
            phones: analyzed.businessInfo.phones,
            addresses: analyzed.businessInfo.addresses,
            socialLinks: analyzed.businessInfo.socialLinks,
            logoUrl: analyzed.businessInfo.logoUrl,
            brandColors: analyzed.businessInfo.brandColors,
          },
          pageContents: Object.fromEntries(analyzed.pageContents),
          recommendedPages: analyzed.recommendedPages,
          contentSummary: analyzed.contentSummary,
        };

        // Update job with scraping results
        await updateJobStatus({
          jobId,
          status: 'processing',
          progress: 15,
          metadata: {
            scrapedPagesCount: discovery.totalPagesScraped,
            scrapingErrors: discovery.errors.length,
          },
        });
      } catch (scrapingError: unknown) {
        // Log scraping failure but continue with prompt-only generation
        console.error('Website scraping failed:', scrapingError);

        await updateJobStatus({
          jobId,
          status: 'processing',
          progress: 10,
          metadata: {
            scrapingFailed: true,
            scrapingError: scrapingError instanceof Error ? scrapingError.message : 'Unknown error',
          },
        });

        // Continue without scraped context
        scrapedContext = undefined;
      }
    }

    // Create job with scraped context
    await updateJob(jobId, {
      business_info: sanitized,
      scraped_context: scrapedContext, // Store for debugging/audit
    });

    // Trigger background processing with scraped context
    processGenerationJob(jobId, scrapedContext).catch(err => {
      console.error('Background processing failed:', err);
    });

    return apiSuccess({
      jobId,
      statusUrl: `/api/sites/generate/${jobId}`,
      message: scrapedContext
        ? 'Site generation started with website analysis'
        : 'Site generation started',
    }, 202);

  } catch (error: unknown) {
    return apiError(handleError(error).message, 500);
  }
}
```

### 5.2 Update Background Processor

**Update `/src/lib/jobs/background-processor.ts`:**

```typescript
import { buildFoundationPromptWithContext } from '@/lib/ai/prompts/site-generation-prompts';
import type { ScrapedWebsiteContext } from '@/lib/types/site-generation-jobs';

export async function processGenerationJob(
  jobId: string,
  scrapedContext?: ScrapedWebsiteContext
): Promise<void> {
  try {
    // Fetch job
    const job = await getJob(jobId);
    if (!job) throw new Error('Job not found');

    // Update to processing
    await updateJobStatus({ jobId, status: 'processing', progress: 20 });

    // Generate site content with scraped context
    const generatedData = await generateSiteContent(
      job.business_info,
      scrapedContext // Pass scraped context to LLM
    );

    // ... rest of existing processing logic ...

  } catch (error: unknown) {
    // ... error handling ...
  }
}
```

### 5.3 Update Site Generator Service

**Update `/src/lib/ai/site-generator-service.ts`:**

```typescript
import { buildFoundationPromptWithContext } from './prompts/site-generation-prompts';
import type { ScrapedWebsiteContext } from '@/lib/types/site-generation-jobs';

export async function generateSiteContent(
  businessInfo: BusinessInfo,
  scrapedContext?: ScrapedWebsiteContext
): Promise<GeneratedSiteData> {

  // Phase 1: Generate foundation with scraped context
  const foundationPrompt = buildFoundationPromptWithContext(businessInfo, scrapedContext);

  const foundationResponse = await generateWithOpenRouter({
    systemPrompt: SITE_FOUNDATION_SYSTEM_PROMPT,
    userPrompt: foundationPrompt,
    temperature: 0.7,
  });

  const foundation = parseFoundationResponse(foundationResponse);

  // Phase 2: Generate page sections (existing logic)
  // ... existing parallel section generation ...

  // NEW: If scraped context recommends additional pages, generate them
  const customPages: CustomPageSection[] = [];

  if (scrapedContext?.recommendedPages?.length) {
    const additionalPageTypes = scrapedContext.recommendedPages.filter(
      type => !['home', 'about', 'contact'].includes(type)
    );

    for (const pageType of additionalPageTypes.slice(0, 3)) { // Limit to 3 additional
      try {
        const customPagePrompt = buildCustomPagePrompt(
          pageType,
          businessInfo,
          foundation.branding,
          scrapedContext.pageContents?.[pageType]
        );

        const customPageResponse = await generateWithOpenRouter({
          systemPrompt: CUSTOM_PAGE_SYSTEM_PROMPT,
          userPrompt: customPagePrompt,
          temperature: 0.7,
        });

        const customPage = parseCustomPageResponse(customPageResponse, pageType);
        customPages.push(customPage);
      } catch (error) {
        console.error(`Failed to generate custom page: ${pageType}`, error);
        // Continue with other pages
      }
    }
  }

  // Combine all generated data
  return {
    ...foundation,
    about,
    contact,
    testimonials,
    values,
    features,
    services,
    team,
    customPages: customPages.length > 0 ? customPages : undefined,
  };
}
```

---

## Milestone 6: Dynamic Page Creation

### 6.1 Update Site Creator

**Update `/src/lib/sites/site-creator.ts`:**

```typescript
export async function createSiteFromGenerated(
  data: GeneratedSiteData,
  userId: string,
  logoUrl?: string
): Promise<string> {

  // ... existing site creation logic ...

  // Create standard pages (Home, About, Contact)
  const homePageId = await createPage(siteId, createHomePageContent(data), 10);
  const aboutPageId = await createPage(siteId, createAboutPageContent(data), 20);
  const contactPageId = await createPage(siteId, createContactPageContent(data), 80);

  // NEW: Create custom pages if provided
  if (data.customPages && data.customPages.length > 0) {
    let sortOrder = 30; // Start after About (20)

    for (const customPage of data.customPages) {
      try {
        await createPage(siteId, createCustomPageContent(customPage), sortOrder);
        sortOrder += 10;
      } catch (error) {
        console.error(`Failed to create custom page: ${customPage.slug}`, error);
        // Continue with other pages
      }
    }
  }

  // NEW: Update navigation to include custom pages
  const navigationItems = [
    { label: 'Home', href: '/home' },
    { label: 'About', href: '/about' },
  ];

  // Add custom page links
  if (data.customPages) {
    data.customPages.forEach(page => {
      navigationItems.push({
        label: page.title,
        href: `/${page.slug}`,
      });
    });
  }

  navigationItems.push({ label: 'Contact', href: '/contact' });

  // Update site with dynamic navigation
  await supabase
    .from('sites')
    .update({
      theme_settings: {
        ...themeSettings,
        navigation: {
          items: navigationItems,
          style: 'horizontal',
        },
      },
    })
    .eq('id', siteId);

  return siteId;
}

/**
 * Creates content for a custom page
 */
function createCustomPageContent(customPage: CustomPageSection): PageContent {
  return {
    title: customPage.title,
    slug: customPage.slug,
    content_type: 'page',
    is_published: true,
    content: {
      version: '1.0',
      layout: 'custom',
      sections: {
        header: {
          type: 'hero',
          order: 1,
          visible: true,
          data: {
            headline: customPage.content.headline || customPage.title,
            subheadline: customPage.content.description,
          },
        },
        content: {
          type: 'richText',
          order: 2,
          visible: true,
          data: {
            content: customPage.content.richText || '',
            items: customPage.content.items || [],
          },
        },
      },
    },
  };
}
```

---

## Milestone 7: Security & Validation

### 7.1 Input Validation

**Update `/src/lib/security/input-sanitization.ts`:**

```typescript
/**
 * Validates website URL for scraping
 */
export function validateWebsiteUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);

    // Only HTTP/HTTPS
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP/HTTPS URLs are allowed' };
    }

    // Block localhost and private IPs
    const hostname = parsed.hostname.toLowerCase();
    const blockedHosts = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '[::1]',
    ];

    if (blockedHosts.includes(hostname)) {
      return { valid: false, error: 'Cannot scrape localhost' };
    }

    if (hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.16.') ||
        hostname.startsWith('172.17.') ||
        hostname.startsWith('172.18.') ||
        hostname.startsWith('172.19.') ||
        hostname.startsWith('172.20.') ||
        hostname.startsWith('172.21.') ||
        hostname.startsWith('172.22.') ||
        hostname.startsWith('172.23.') ||
        hostname.startsWith('172.24.') ||
        hostname.startsWith('172.25.') ||
        hostname.startsWith('172.26.') ||
        hostname.startsWith('172.27.') ||
        hostname.startsWith('172.28.') ||
        hostname.startsWith('172.29.') ||
        hostname.startsWith('172.30.') ||
        hostname.startsWith('172.31.')) {
      return { valid: false, error: 'Cannot scrape private network IPs' };
    }

    // Must have valid TLD
    if (!hostname.includes('.')) {
      return { valid: false, error: 'URL must have a valid domain' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Sanitizes scraped HTML content
 */
export function sanitizeScrapedHtml(html: string): string {
  // Remove script tags and event handlers
  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');

  // Limit size to prevent DoS
  if (sanitized.length > 1_000_000) { // 1MB max
    sanitized = sanitized.slice(0, 1_000_000);
  }

  return sanitized;
}
```

### 7.2 Rate Limiting for Scraping

**Update `/src/lib/security/site-generation-rate-limit.ts`:**

```typescript
// Add scraping-specific rate limits
const SCRAPING_RATE_LIMITS = {
  maxScrapingRequestsPerHour: 5, // Max 5 website scrapings per hour
  maxPagesPerSite: 5, // Max 5 pages scraped per site
  scrapingTimeout: 30000, // 30s timeout per page
} as const;

export async function checkScrapingRateLimit(
  userId: string
): Promise<{ allowed: boolean; resetAt?: Date }> {
  const key = `scraping:${userId}`;
  const window = 60 * 60 * 1000; // 1 hour

  const count = await getRequestCount(key, window);

  if (count >= SCRAPING_RATE_LIMITS.maxScrapingRequestsPerHour) {
    return {
      allowed: false,
      resetAt: new Date(Date.now() + window),
    };
  }

  await incrementRequestCount(key, window);

  return { allowed: true };
}
```

### 7.3 Content Moderation

**Update `/src/lib/security/content-moderation.ts`:**

```typescript
/**
 * Validates scraped content for malicious patterns
 */
export function moderateScrapedContent(data: ScrapedWebsiteContext): boolean {
  // Check all text fields
  const textFields = [
    data.contentSummary,
    ...Object.values(data.pageContents || {}),
    ...(data.businessInfo.emails || []),
    ...(data.businessInfo.phones || []),
    ...(data.businessInfo.addresses || []),
  ];

  for (const text of textFields) {
    if (text && !validateGeneratedContent(text)) {
      return false;
    }
  }

  // Validate URLs
  if (data.businessInfo.logoUrl && !isSafeUrl(data.businessInfo.logoUrl)) {
    return false;
  }

  for (const social of data.businessInfo.socialLinks || []) {
    if (!isSafeUrl(social.url)) {
      return false;
    }
  }

  return true;
}

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}
```

---

## Milestone 8: Error Handling & Resilience

### 8.1 Graceful Degradation

**Key Principles:**
1. **Scraping failure should NOT fail generation** - Fall back to prompt-only mode
2. **Partial scraping success is acceptable** - Use whatever data was retrieved
3. **Provide user feedback** - Inform user which pages were/weren't scraped
4. **Log all failures** - Track scraping issues for debugging

**Implementation in `/app/api/sites/generate/route.ts`:**

```typescript
// Scraping wrapped in try-catch with fallback
try {
  scrapedContext = await scrapeAndAnalyze(url);
} catch (error) {
  // Log but continue
  console.error('Scraping failed, falling back to prompt-only:', error);
  await updateJobMetadata(jobId, {
    scrapingFailed: true,
    scrapingError: error.message,
  });
  scrapedContext = undefined; // Continue without scraped data
}
```

### 8.2 Retry Logic

**Scraping retries:**
- Homepage scraping: 2 retries with exponential backoff
- Secondary pages: 1 retry, but continue if fails
- Timeout protection: 30s per page, 5s buffer for HTTP request

**LLM retries:**
- Existing retry logic (2 retries per section) applies
- Custom pages get same retry treatment

### 8.3 User Feedback

**Update job metadata to include scraping details:**

```typescript
interface JobMetadata {
  scrapingAttempted?: boolean;
  scrapedPagesCount?: number;
  scrapingErrors?: number;
  scrapingFailedPages?: string[];
  scrapingDuration?: number; // milliseconds
}
```

**Return in status endpoint:**

```json
{
  "jobId": "...",
  "status": "completed",
  "progress": 100,
  "metadata": {
    "scrapingAttempted": true,
    "scrapedPagesCount": 4,
    "scrapingErrors": 1,
    "scrapingFailedPages": ["/team"],
    "scrapingDuration": 12500
  }
}
```

---

## Milestone 9: Testing & Validation

### 9.1 Manual Testing Checklist

**Scraping Service:**
- [ ] Valid website URL scrapes successfully
- [ ] Invalid URL returns proper error
- [ ] Localhost URL is blocked
- [ ] Private IP URL is blocked
- [ ] Timeout handling works (test with slow site)
- [ ] Retry logic activates on failure
- [ ] MD5 hash authentication is correct

**Page Discovery:**
- [ ] Homepage is always scraped first
- [ ] Navigation links are extracted correctly
- [ ] Page types are inferred correctly (about, contact, etc.)
- [ ] Prioritization works (about > contact > services)
- [ ] Max pages limit is enforced
- [ ] Duplicate URLs are deduplicated

**Content Extraction:**
- [ ] Emails are extracted from mailto links
- [ ] Emails are extracted from text content
- [ ] Phones are extracted from tel links
- [ ] Phones are extracted from text content
- [ ] Addresses are extracted (schema.org and heuristics)
- [ ] Social links are identified for major platforms
- [ ] Logo is found from common selectors
- [ ] Brand colors are extracted from CSS
- [ ] Key features are identified
- [ ] Business description is extracted

**LLM Integration:**
- [ ] Scraped context is included in prompt
- [ ] LLM uses scraped contact info
- [ ] LLM uses scraped brand colors
- [ ] LLM improves/modernizes scraped content
- [ ] LLM generates appropriate number of pages
- [ ] Custom pages are created based on scraped pages

**Error Handling:**
- [ ] Scraping failure falls back to prompt-only
- [ ] Partial scraping success continues generation
- [ ] User is informed of scraping issues
- [ ] Job completes successfully even if scraping fails

**Security:**
- [ ] URL validation blocks malicious URLs
- [ ] Scraped HTML is sanitized
- [ ] Content moderation catches malicious content
- [ ] Rate limiting prevents abuse

### 9.2 Test Websites

**Good test cases:**
- Simple business site (e.g., local bakery)
- Multi-page corporate site (e.g., consulting firm)
- Garden center website (domain-specific)
- Site with blog (test blog page handling)
- Site with team page (test team extraction)

**Edge cases:**
- Site with no navigation (fallback to homepage only)
- Site with dynamic navigation (JavaScript-rendered)
- Site with non-standard URLs (query params, fragments)
- Site with broken links (404s)
- Site that times out
- Site that blocks scrapers (User-Agent detection)

---

## Milestone 10: Documentation & Deployment

### 10.1 Environment Setup Documentation

**Update `README.md` or create `docs/SCRAPING_SETUP.md`:**

```markdown
# Website Scraping Configuration

The LLM site generator supports generating sites based on existing websites. This requires configuration of the scraping service.

## Environment Variables

Add the following to your `.env.local` file:

```bash
# Scraping Service
SCRAPING_SERVICE_URL=https://puppeteer-api-production-7bea.up.railway.app
SCRAPING_SERVICE_SALT=your-secret-salt-here
SCRAPING_SERVICE_TIMEOUT=30000
SCRAPING_SERVICE_MAX_RETRIES=2
```

### Getting the Salt

The salt is used for MD5 authentication with the scraping service. Contact the infrastructure team or check the shared secrets vault.

### Testing the Configuration

Run the following to test your scraping service connection:

```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "hash": "YOUR_HASH_HERE"}' \
  $SCRAPING_SERVICE_URL/fetch
```

Calculate the hash: `md5(https://example.com:YOUR_SALT)` (lowercased)

## Usage

Users can provide an optional `basedOnWebsite` URL when generating a site:

```json
{
  "businessInfo": {
    "prompt": "Modernize my garden center website",
    "name": "Green Thumb Gardens",
    "basedOnWebsite": "https://oldgardensite.com"
  }
}
```

The system will:
1. Scrape the homepage and up to 4 additional pages
2. Extract business information (contact, hours, branding)
3. Analyze content and structure
4. Use this data to enhance the LLM prompt
5. Generate an improved, modernized version of the site
```

### 10.2 API Documentation

**Update API documentation** (if using OpenAPI/Swagger):

```yaml
components:
  schemas:
    BusinessInfo:
      properties:
        # ... existing properties ...
        basedOnWebsite:
          type: string
          format: uri
          description: Optional URL of existing website to analyze and modernize
          example: https://example.com
```

### 10.3 Deployment Checklist

- [ ] Environment variables configured in production
- [ ] Scraping service URL is accessible from production environment
- [ ] Rate limits are configured appropriately
- [ ] Monitoring/alerting set up for scraping failures
- [ ] Cost tracking includes scraping service costs (if applicable)
- [ ] Error logging captures scraping issues
- [ ] User-facing documentation updated

---

## Implementation Summary

### Files Created (New)

1. `/src/lib/config/scraping.ts` - Scraping service configuration
2. `/src/lib/scraping/scraping-client.ts` - HTTP client for scraping service
3. `/src/lib/scraping/link-extractor.ts` - Navigation link extraction
4. `/src/lib/scraping/page-discovery.ts` - Page discovery orchestrator
5. `/src/lib/scraping/content-extractor.ts` - Structured data extraction
6. `/src/lib/scraping/content-analyzer.ts` - Content analysis & synthesis

### Files Modified (Updates)

1. `/src/lib/types/site-generation-jobs.ts` - Add `basedOnWebsite`, `ScrapedWebsiteContext`, `CustomPageSection`
2. `/src/lib/ai/prompts/site-generation-prompts.ts` - Add `buildFoundationPromptWithContext`, update system prompts
3. `/src/lib/ai/site-generator-service.ts` - Add scraped context parameter, custom page generation
4. `/src/lib/sites/site-creator.ts` - Add custom page creation, dynamic navigation
5. `/src/lib/security/input-sanitization.ts` - Add URL validation, HTML sanitization
6. `/src/lib/security/site-generation-rate-limit.ts` - Add scraping rate limits
7. `/src/lib/security/content-moderation.ts` - Add scraped content moderation
8. `/app/api/sites/generate/route.ts` - Add scraping orchestration
9. `/src/lib/jobs/background-processor.ts` - Pass scraped context to LLM

### Dependencies Added

```json
{
  "dependencies": {
    "cheerio": "^1.0.0-rc.12"
  }
}
```

### Database Schema Changes

**None required** - Existing `site_generation_jobs.business_info` JSONB field can store `basedOnWebsite`. Optionally add `scraped_context` JSONB column for audit/debugging.

---

## Success Criteria

**Feature is complete when:**

1. ✅ Users can provide optional `basedOnWebsite` URL
2. ✅ System intelligently discovers and scrapes up to 5 pages
3. ✅ Business information is accurately extracted (contact, hours, location)
4. ✅ Brand identity is analyzed (colors, logo, tone)
5. ✅ LLM generates enhanced content based on scraped data
6. ✅ Custom pages are created based on discovered content
7. ✅ Navigation is dynamically updated to include custom pages
8. ✅ Scraping failures gracefully fall back to prompt-only mode
9. ✅ Security measures prevent SSRF and malicious content
10. ✅ Rate limiting prevents abuse of scraping service
11. ✅ All error cases are handled with appropriate user feedback
12. ✅ Documentation is complete and deployment-ready

---

## Future Enhancements (Out of Scope)

- **Screenshot analysis**: Use AI vision models to analyze site design
- **Competitor analysis**: Scrape multiple competitor sites for inspiration
- **SEO data extraction**: Extract keywords, meta tags for SEO optimization
- **A/B testing**: Generate multiple variations based on same scraped data
- **Incremental updates**: Allow users to rescrape and update existing sites
- **Custom scraping rules**: User-defined selectors for specific sites

---

**End of Implementation Plan**
