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
