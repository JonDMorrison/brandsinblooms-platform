import { load } from 'cheerio';

interface ExtractedLink {
  href: string;
  text: string;
  isInternal: boolean;
  pageType?: 'about' | 'contact' | 'services' | 'team' | 'blog' | 'products' | 'shop' | 'catalog' | 'gallery' | 'portfolio' | 'pricing' | 'faq' | 'privacy' | 'terms' | 'other';
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
 * Infers page type from URL path and link text (ENHANCED)
 */
function inferPageType(href: string, text: string): ExtractedLink['pageType'] {
  const combined = `${href} ${text}`.toLowerCase();

  const patterns: Array<[RegExp, ExtractedLink['pageType']]> = [
    // Prioritize product/shopping pages for gardening sites
    [/\b(products?|shop|store|catalog|collection|categories|plants?|flowers?|seeds?|supplies|inventory)\b/, 'products'],
    [/\b(shop|shopping|buy|purchase|order)\b/, 'shop'],
    [/\b(catalog|catalogue|listings?)\b/, 'catalog'],
    [/\b(gallery|portfolio|showcase|photos?|images?|work)\b/, 'gallery'],
    [/\b(portfolio|projects?|case-studies)\b/, 'portfolio'],
    [/\b(pricing|prices?|rates?|packages?|plans?|cost)\b/, 'pricing'],

    // Standard pages
    [/\b(about|our-story|who-we-are|mission|vision|history)\b/, 'about'],
    [/\b(contact|get-in-touch|reach-us|location|visit-us|find-us)\b/, 'contact'],
    [/\b(services?|what-we-do|offerings?|solutions?|programs?)\b/, 'services'],
    [/\b(team|staff|people|our-team|meet-the-team|employees?)\b/, 'team'],
    [/\b(blog|news|articles?|insights?|posts?|updates?)\b/, 'blog'],
    [/\b(faq|help|support|questions?|q-?and-?a)\b/, 'faq'],
    [/\b(privacy|privacy-policy)\b/, 'privacy'],
    [/\b(terms|terms-of-service|tos|terms-conditions)\b/, 'terms'],
  ];

  for (const [pattern, type] of patterns) {
    if (pattern.test(combined)) {
      return type;
    }
  }

  return 'other';
}

/**
 * Extracts navigation links from HTML (ENHANCED)
 */
export function extractNavigationLinks(html: string, baseUrl: string): ExtractedLink[] {
  const $ = load(html);
  const links: ExtractedLink[] = [];
  const seen = new Set<string>();

  // Enhanced navigation selectors to find more links
  const navSelectors = [
    'nav a',
    'header a',
    '[role="navigation"] a',
    '.nav a',
    '.navigation a',
    '.menu a',
    '.navbar a',
    '.main-menu a',
    '.primary-menu a',
    '.site-nav a',
    '.top-menu a',
    'aside a',
    '.sidebar a',
    'footer a:not([href^="mailto:"]):not([href^="tel:"])', // Include footer links
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

  // Also look for important links in main content area
  const contentSelectors = [
    'main a',
    'article a',
    '.content a',
    '#content a'
  ];

  contentSelectors.forEach(selector => {
    $(selector).each((_, element) => {
      const $link = $(element);
      const href = $link.attr('href');
      const text = $link.text().trim();

      if (!href || !text) return;

      const normalizedUrl = normalizeUrl(href, baseUrl);
      if (!normalizedUrl || seen.has(normalizedUrl)) return;

      // Skip non-HTTP links
      if (!normalizedUrl.startsWith('http')) return;

      const isInternal = isInternalUrl(normalizedUrl, baseUrl);
      if (!isInternal) return;

      const baseNormalized = normalizeUrl(baseUrl, baseUrl);
      if (normalizedUrl === baseNormalized) return;

      // Only add content links if they're likely important pages
      const pageType = inferPageType(normalizedUrl, text);
      if (pageType !== 'other' || text.toLowerCase().includes('shop') ||
          text.toLowerCase().includes('product') || text.toLowerCase().includes('catalog')) {
        seen.add(normalizedUrl);
        links.push({
          href: normalizedUrl,
          text,
          isInternal,
          pageType,
        });
      }
    });
  });

  return links;
}

/**
 * Prioritizes links for scraping based on page type (ENHANCED)
 * Now prioritizes product/shopping pages for gardening/retail sites
 */
export function prioritizeLinksForScraping(
  links: ExtractedLink[],
  maxPages: number = 5
): ExtractedLink[] {
  // Enhanced priority order - product pages are now higher priority
  const priorityOrder: Array<ExtractedLink['pageType']> = [
    'about',        // Keep about as top priority for business info
    'products',     // High priority for product pages
    'shop',         // High priority for shop pages
    'services',     // Services are important
    'catalog',      // Product catalogs
    'contact',      // Contact info
    'gallery',      // Visual content
    'portfolio',    // Work showcase
    'pricing',      // Pricing information
    'team',         // Team info
    'faq',          // FAQ sections
    'blog',         // Blog content
    'privacy',      // Legal pages (lower priority)
    'terms',        // Legal pages (lower priority)
    'other',        // Everything else
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