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
