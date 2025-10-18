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

  // Hero Section
  heroSection?: {
    headline?: string;
    subheadline?: string;
    ctaText?: string;
    ctaLink?: string;
    backgroundImage?: string;
  };

  // Metadata
  siteTitle?: string;
  siteDescription?: string;
  favicon?: string;

  // Enhanced Structured Content (IMPROVED)
  structuredContent?: {
    businessHours?: Array<{
      day: string;
      hours: string;
      closed: boolean;
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
    faq?: Array<{
      question: string;
      answer: string;
    }>;
    productCategories?: Array<{
      name: string;
      description?: string;
      itemCount?: number;
    }>;
    footerContent?: {
      copyrightText?: string;
      importantLinks?: Array<{ text: string; url: string }>;
      additionalInfo?: string;
    };
  };

  // Additional extracted text for context
  pageContent?: {
    mainContent: string;
    footerText: string;
    sidebarContent?: string;
  };
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
 * Extracts physical addresses using common patterns (ENHANCED)
 */
function extractAddresses($: CheerioAPI): string[] {
  const addresses = new Set<string>();

  // Look for structured data (schema.org)
  $('[itemtype*="schema.org/PostalAddress"], [itemtype*="schema.org/LocalBusiness"]').each((_, element) => {
    const street = $(element).find('[itemprop="streetAddress"]').text().trim();
    const city = $(element).find('[itemprop="addressLocality"]').text().trim();
    const state = $(element).find('[itemprop="addressRegion"]').text().trim();
    const zip = $(element).find('[itemprop="postalCode"]').text().trim();

    if (street || city) {
      addresses.add([street, city, state, zip].filter(Boolean).join(', '));
    }
  });

  // Look for address-related elements (ENHANCED)
  const addressSelectors = [
    '[class*="address"]',
    '[id*="address"]',
    'address',
    '[class*="location"]',
    '[id*="location"]',
    'footer [class*="contact"]',
    '.footer-info',
    '.store-location'
  ];

  addressSelectors.forEach(selector => {
    $(selector).each((_, element) => {
      const text = $(element).text().trim();
      // Enhanced heuristic: contains digits and common address words
      if (text.length > 10 && text.length < 300 && /\d/.test(text) &&
          (/street|st\b|avenue|ave\b|road|rd\b|boulevard|blvd|drive|dr\b|lane|ln\b|way|circle|court|place|plaza/i.test(text))) {
        addresses.add(text);
      }
    });
  });

  return Array.from(addresses).slice(0, 3); // Increased to 3 addresses
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
  console.log('[LOGO EXTRACTION] Starting logo extraction process...');
  console.log(`[LOGO EXTRACTION] Base URL: ${baseUrl}`);

  // Debug: Log all images found in the page (first 10)
  console.log('[LOGO EXTRACTION] === DEBUG: First 10 images found in page ===');
  const allImages = $('img');
  console.log(`[LOGO EXTRACTION] Total images in page: ${allImages.length}`);

  allImages.slice(0, 10).each((index, element) => {
    const img = $(element);
    const src = img.attr('src');
    const alt = img.attr('alt');
    const className = img.attr('class');
    const parent = img.parent().prop('tagName')?.toLowerCase();
    const parentClass = img.parent().attr('class');

    console.log(`[LOGO EXTRACTION] Image ${index + 1}:`);
    console.log(`[LOGO EXTRACTION]   src: ${src || '(missing)'}`);
    console.log(`[LOGO EXTRACTION]   alt: ${alt || '(none)'}`);
    console.log(`[LOGO EXTRACTION]   class: ${className || '(none)'}`);
    console.log(`[LOGO EXTRACTION]   parent: <${parent}${parentClass ? ` class="${parentClass}"` : ''}>`);
  });
  console.log('[LOGO EXTRACTION] === END DEBUG ===');

  // Debug: Check for images in header specifically
  console.log('[LOGO EXTRACTION] === DEBUG: Checking header area ===');
  const headerSelectors = ['header', 'nav', '.header', '.navigation', '.navbar', '#header', '#navigation'];

  for (const selector of headerSelectors) {
    const headerElement = $(selector).first();
    if (headerElement.length > 0) {
      console.log(`[LOGO EXTRACTION] Found <${selector}> element`);
      const headerImages = headerElement.find('img');
      console.log(`[LOGO EXTRACTION]   Contains ${headerImages.length} images`);

      if (headerImages.length > 0) {
        headerImages.slice(0, 3).each((idx, img) => {
          const src = $(img).attr('src');
          const alt = $(img).attr('alt');
          console.log(`[LOGO EXTRACTION]     Image ${idx + 1}: src="${src || '(missing)'}", alt="${alt || '(none)'}"`);
        });
      }
    }
  }
  console.log('[LOGO EXTRACTION] === END HEADER DEBUG ===');

  // Try common logo selectors
  const logoSelectors = [
    'img[class*="logo"]',
    'img[id*="logo"]',
    '.logo img',
    '#logo img',
    'header img:first',
    '.site-logo img',
    '[class*="brand"] img',
    'a[class*="logo"] img',
    'a[id*="logo"] img',
    '.navbar-brand img',
    '.site-header img',
    '[class*="header"] img[class*="logo"]',
    'h1 img',
    '.brand img',
    'img[alt*="logo" i]',
    'img[title*="logo" i]',
    '[class*="masthead"] img',
    '.site-title img',
    '.company-logo img'
  ];

  const allCandidates: Array<{ selector: string; src: string; reason?: string }> = [];

  for (const selector of logoSelectors) {
    console.log(`[LOGO EXTRACTION] Trying selector: "${selector}"`);
    const images = $(selector).toArray();
    console.log(`[LOGO EXTRACTION]   Found ${images.length} image(s) matching selector`);

    for (let index = 0; index < images.length; index++) {
      const element = images[index];
      const img = $(element);
      const src = img.attr('src');
      const alt = img.attr('alt');
      const className = img.attr('class');
      const id = img.attr('id');

      console.log(`[LOGO EXTRACTION]   Image ${index + 1}:`);
      console.log(`[LOGO EXTRACTION]     - src: ${src || '(missing)'}`);
      console.log(`[LOGO EXTRACTION]     - alt: ${alt || '(none)'}`);
      console.log(`[LOGO EXTRACTION]     - class: ${className || '(none)'}`);
      console.log(`[LOGO EXTRACTION]     - id: ${id || '(none)'}`);

      if (!src) {
        console.log(`[LOGO EXTRACTION]     ❌ Rejected: No src attribute`);
        allCandidates.push({ selector, src: '(missing)', reason: 'No src attribute' });
        continue;
      }

      // Check if it's a data URL (base64 or SVG)
      if (src.startsWith('data:')) {
        const dataType = src.substring(5, src.indexOf(';') > 0 ? src.indexOf(';') : src.indexOf(','));
        console.log(`[LOGO EXTRACTION]     ❌ Rejected: Data URL (${dataType})`);
        allCandidates.push({ selector, src: src.substring(0, 100) + '...', reason: `Data URL (${dataType})` });
        continue;
      }

      // Check if it's an SVG file
      if (src.endsWith('.svg') || src.includes('.svg?') || src.includes('.svg#')) {
        console.log(`[LOGO EXTRACTION]     ⚠️  Warning: SVG file (may not be supported by all processors)`);
      }

      // Try to resolve the URL
      try {
        const resolvedUrl = new URL(src, baseUrl).href;
        console.log(`[LOGO EXTRACTION]     ✅ URL resolved to: ${resolvedUrl}`);

        // Additional validation
        if (resolvedUrl.includes('placeholder') ||
            resolvedUrl.includes('loading') ||
            resolvedUrl.includes('spinner') ||
            resolvedUrl.includes('blank') ||
            resolvedUrl.includes('transparent')) {
          console.log(`[LOGO EXTRACTION]     ⚠️  Warning: URL might be a placeholder`);
          allCandidates.push({ selector, src: resolvedUrl, reason: 'Possible placeholder' });
          continue;
        }

        console.log(`[LOGO EXTRACTION]     🎯 Found valid logo candidate!`);
        allCandidates.push({ selector, src: resolvedUrl });

        // Return the first valid logo found
        console.log(`[LOGO EXTRACTION] ✅ Selected logo: ${resolvedUrl}`);
        console.log(`[LOGO EXTRACTION] Total candidates evaluated: ${allCandidates.length}`);
        return resolvedUrl;
      } catch (urlError) {
        console.log(`[LOGO EXTRACTION]     ❌ Failed to resolve URL: ${urlError instanceof Error ? urlError.message : String(urlError)}`);
        allCandidates.push({ selector, src, reason: 'URL resolution failed' });
        continue;
      }
    }
  }

  // If no logo found, try looking for SVG elements
  console.log(`[LOGO EXTRACTION] No img logo found, checking for SVG logos...`);
  const svgSelectors = [
    'svg[class*="logo"]',
    '.logo svg',
    '#logo svg',
    'a[class*="logo"] svg',
    'header svg'
  ];

  for (const selector of svgSelectors) {
    const svgs = $(selector);
    if (svgs.length > 0) {
      console.log(`[LOGO EXTRACTION] Found ${svgs.length} SVG(s) matching "${selector}" - but SVG extraction not implemented`);
      allCandidates.push({ selector, src: '(inline SVG)', reason: 'Inline SVG not supported' });
    }
  }

  // Log summary
  console.log(`[LOGO EXTRACTION] ❌ No logo found after checking all selectors`);
  console.log(`[LOGO EXTRACTION] Total candidates examined: ${allCandidates.length}`);
  if (allCandidates.length > 0) {
    console.log(`[LOGO EXTRACTION] Candidates summary:`);
    allCandidates.forEach((candidate, index) => {
      console.log(`[LOGO EXTRACTION]   ${index + 1}. Selector: "${candidate.selector}"`);
      console.log(`[LOGO EXTRACTION]      URL: ${candidate.src}`);
      if (candidate.reason) {
        console.log(`[LOGO EXTRACTION]      Reason rejected: ${candidate.reason}`);
      }
    });
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

// Improved brand color extraction with weighting and context awareness
function extractBrandColorsImproved(html: string): string[] {
  const $ = load(html);

  // Color parsers and helpers
  const hex3 = /^#([0-9a-fA-F]{3})$/;
  const hex6 = /^#([0-9a-fA-F]{6})$/;
  const rgbRe = /rgba?\(\s*([\d]{1,3})\s*,\s*([\d]{1,3})\s*,\s*([\d]{1,3})(?:\s*,\s*(0|0?\.\d+|1(?:\.0)?))?\s*\)/g;
  const hslRe = /hsla?\(\s*([\d]{1,3})\s*,\s*([\d]{1,3})%\s*,\s*([\d]{1,3})%(?:\s*,\s*(0|0?\.\d+|1(?:\.0)?))?\s*\)/g;

  function expandShortHex(h: string): string {
    const m = h.match(hex3);
    if (!m) return h.toLowerCase();
    const [r, g, b] = m[1].split('');
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  function clamp(n: number) { return Math.max(0, Math.min(255, n)); }
  function rgbToHex(r: number, g: number, b: number): string {
    return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`.toLowerCase();
  }
  function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    h = (h % 360 + 360) % 360; s = s / 100; l = l / 100;
    const c = (1 - Math.abs(2*l - 1)) * s;
    const x = c * (1 - Math.abs(((h/60) % 2) - 1));
    const m = l - c/2;
    let r=0, g=0, b=0;
    if (0 <= h && h < 60) { r=c; g=x; b=0; }
    else if (60 <= h && h < 120) { r=x; g=c; b=0; }
    else if (120 <= h && h < 180) { r=0; g=c; b=x; }
    else if (180 <= h && h < 240) { r=0; g=x; b=c; }
    else if (240 <= h && h < 300) { r=x; g=0; b=c; }
    else { r=c; g=0; b=x; }
    return [Math.round((r+m)*255), Math.round((g+m)*255), Math.round((b+m)*255)];
  }
  function normalizeColor(raw: string | undefined | null): string | null {
    if (!raw) return null;
    const c = raw.trim().toLowerCase();
    if (c === 'transparent' || c === 'inherit' || c === 'currentcolor') return null;
    if (hex6.test(c)) return c;
    if (hex3.test(c)) return expandShortHex(c);
    const rgbMatch = c.match(/^rgba?\(/) ? c.match(/^rgba?\((.*)\)$/) : null;
    if (rgbMatch) {
      rgbRe.lastIndex = 0;
      const m = rgbRe.exec(c);
      if (m) return rgbToHex(parseInt(m[1],10), parseInt(m[2],10), parseInt(m[3],10));
    }
    const hslMatch = c.match(/^hsla?\(/) ? c.match(/^hsla?\((.*)\)$/) : null;
    if (hslMatch) {
      hslRe.lastIndex = 0;
      const m = hslRe.exec(c);
      if (m) {
        const [r,g,b] = hslToRgb(parseInt(m[1],10), parseInt(m[2],10), parseInt(m[3],10));
        return rgbToHex(r,g,b);
      }
    }
    return null;
  }
  function isGrayscale(hex: string): boolean {
    const m = hex.match(hex6);
    if (!m) return false;
    const r = parseInt(m[1].substring(0,2),16);
    const g = parseInt(m[1].substring(2,4),16);
    const b = parseInt(m[1].substring(4,6),16);
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    return (max - min) <= 15; // low saturation
  }

  const scores = new Map<string, number>();
  const add = (color: string | null, weight: number) => {
    if (!color) return;
    const hex = normalizeColor(color);
    if (!hex) return;
    if (['#ffffff','#000000'].includes(hex)) return;
    if (isGrayscale(hex)) return;
    scores.set(hex, (scores.get(hex) || 0) + weight);
  };

  // Limits to prevent excessive scanning on large pages
  const MAX_INLINE_ELEMENTS = 600; // scan at most 600 inline style elements
  const MAX_STYLE_TAGS = 6;        // scan at most 6 <style> tags
  const MAX_STYLE_LENGTH = 40000;  // scan at most 40KB per style block
  const MAX_MATCHES_PER_BLOCK = 500; // avoid pathological regex backtracking

  // Inline styles: strong signal. Boost if in header/hero/nav areas.
  const importantSelector = 'header, nav, .header, .navbar, .site-header, #header, #masthead, .hero, [class*="hero"], .wp-block-cover, .wp-block-cover-image';
  let inlineCount = 0;
  $('[style]').each((_, el) => {
    if (++inlineCount > MAX_INLINE_ELEMENTS) return false; // break
    let style = ($(el).attr('style') || '').toLowerCase();
    if (style.length > MAX_STYLE_LENGTH) style = style.slice(0, MAX_STYLE_LENGTH);
    const base = $(el).is(importantSelector) ? 6 : 3;
    const hexRe = /#([a-f0-9]{3}|[a-f0-9]{6})\b/gi; let m: RegExpExecArray | null;
    let matchCount = 0;
    while ((m = hexRe.exec(style)) !== null) { add(m[0], base); if (++matchCount > MAX_MATCHES_PER_BLOCK) break; }
    rgbRe.lastIndex = 0; matchCount = 0; while ((m = rgbRe.exec(style)) !== null) { add(m[0], base); if (++matchCount > MAX_MATCHES_PER_BLOCK) break; }
    hslRe.lastIndex = 0; matchCount = 0; while ((m = hslRe.exec(style)) !== null) { add(m[0], base); if (++matchCount > MAX_MATCHES_PER_BLOCK) break; }
  });

  // Style tags: weaker. Prefer CSS variables with brand-ish names.
  let styleTagCount = 0;
  $('style').each((_, el) => {
    if (++styleTagCount > MAX_STYLE_TAGS) return false; // break
    let css = ($(el).html() || '').toLowerCase();
    if (css.length > MAX_STYLE_LENGTH) css = css.slice(0, MAX_STYLE_LENGTH);
    const varRe = /(\-\-[a-z0-9-_]+)\s*:\s*([^;]+);/gi; let vm: RegExpExecArray | null;
    let varCount = 0;
    while ((vm = varRe.exec(css)) !== null) {
      if (++varCount > MAX_MATCHES_PER_BLOCK) break;
      const name = vm[1];
      const val = vm[2].trim();
      const weight = /primary|accent|brand|theme|palette|color/i.test(name) ? 6 : 2;
      const inner = val;
      const hexRe = /#([a-f0-9]{3}|[a-f0-9]{6})\b/gi; let m: RegExpExecArray | null;
      let matchCount = 0;
      while ((m = hexRe.exec(inner)) !== null) { add(m[0], weight); if (++matchCount > MAX_MATCHES_PER_BLOCK) break; }
      rgbRe.lastIndex = 0; matchCount = 0; while ((m = rgbRe.exec(inner)) !== null) { add(m[0], weight); if (++matchCount > MAX_MATCHES_PER_BLOCK) break; }
      hslRe.lastIndex = 0; matchCount = 0; while ((m = hslRe.exec(inner)) !== null) { add(m[0], weight); if (++matchCount > MAX_MATCHES_PER_BLOCK) break; }
    }
    const hexRe2 = /#([a-f0-9]{3}|[a-f0-9]{6})\b/gi; let m2: RegExpExecArray | null;
    let matchCount2 = 0;
    while ((m2 = hexRe2.exec(css)) !== null) { add(m2[0], 1); if (++matchCount2 > MAX_MATCHES_PER_BLOCK) break; }
    rgbRe.lastIndex = 0; matchCount2 = 0; while ((m2 = rgbRe.exec(css)) !== null) { add(m2[0], 1); if (++matchCount2 > MAX_MATCHES_PER_BLOCK) break; }
    hslRe.lastIndex = 0; matchCount2 = 0; while ((m2 = hslRe.exec(css)) !== null) { add(m2[0], 1); if (++matchCount2 > MAX_MATCHES_PER_BLOCK) break; }
  });

  // Meta theme-color: very strong
  $('meta[name="theme-color"]').each((_, el) => {
    const content = $(el).attr('content');
    add(content || null, 8);
  });

  const ranked = Array.from(scores.entries()).sort((a,b) => b[1]-a[1]).map(([hex]) => hex);
  if (ranked.length === 0) {
    // Fallback to basic extraction
    const simple = new Set<string>();
    const hexColorRegex = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/g;
    const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    if (styleMatches) {
      styleMatches.forEach(styleTag => {
        const matches = styleTag.match(hexColorRegex);
        if (matches) matches.forEach(color => simple.add(expandShortHex(color)));
      });
    }
    const inlineMatches = html.match(/style=\"[^\"]*\"/gi);
    if (inlineMatches) {
      inlineMatches.forEach(inlineStyle => {
        const matches = inlineStyle.match(hexColorRegex);
        if (matches) matches.forEach(color => simple.add(expandShortHex(color)));
      });
    }
    return Array.from(simple).slice(0, 5);
  }
  return ranked.slice(0, 5);
}

/**
 * Extracts key features or selling points (ENHANCED)
 */
function extractKeyFeatures($: CheerioAPI): string[] {
  const features: string[] = [];

  // Enhanced feature selectors
  const featureSelectors = [
    '[class*="feature"] li',
    '[class*="benefit"] li',
    '[class*="service"] li',
    '[class*="highlight"] li',
    '[class*="offer"] li',
    '.why-us li',
    '.reasons li',
    '[class*="advantage"] li',
    '[class*="specialt"] li'
  ];

  featureSelectors.forEach(selector => {
    $(selector).each((_, element) => {
      const text = $(element).text().trim();
      if (text.length > 5 && text.length < 300) {
        features.push(text);
      }
    });
  });

  return features.slice(0, 15); // Increased to 15 features
}

/**
 * Extracts business description from common locations (ENHANCED)
 */
function extractBusinessDescription($: CheerioAPI): string | undefined {
  // Try meta description first
  const metaDescription = $('meta[name="description"]').attr('content');
  if (metaDescription && metaDescription.length > 20) {
    return metaDescription.trim();
  }

  // Try structured data
  const schemaDescription = $('[itemtype*="schema.org/Organization"] [itemprop="description"], [itemtype*="schema.org/LocalBusiness"] [itemprop="description"]').text().trim();
  if (schemaDescription && schemaDescription.length > 20) {
    return schemaDescription;
  }

  // Enhanced description selectors
  const descriptionSelectors = [
    '[class*="description"]:first',
    '[class*="about"]:first p:first',
    '[class*="intro"]:first p:first',
    '[class*="welcome"]:first p:first',
    '.about-us p:first',
    '#about p:first',
    'main p:first'
  ];

  for (const selector of descriptionSelectors) {
    const text = $(selector).text().trim();
    if (text.length > 20 && text.length < 1000) {
      return text;
    }
  }

  return undefined;
}

/**
 * Extracts hero section content from common locations
 * This captures the main headline, subheadline, CTA, and background image
 */
function extractHeroSection($: CheerioAPI, baseUrl: string): ExtractedBusinessInfo['heroSection'] {
  const heroSection: ExtractedBusinessInfo['heroSection'] = {};

  // Common hero section selectors
  const heroSelectors = [
    '.hero',
    '#hero',
    '[class*="hero"]',
    '.banner',
    '.jumbotron',
    '.header-content',
    '.masthead',
    '[class*="landing"]',
    '[class*="showcase"]',
    'header section:first',
    'main > section:first',
    'section:first-of-type',
  ];

  // Find the hero section
  let $hero: ReturnType<typeof $> | null = null;
  for (const selector of heroSelectors) {
    const element = $(selector).first();
    if (element.length && element.find('h1, h2').length) {
      $hero = element;
      break;
    }
  }

  // If no hero section found, try to get h1 from the top of the page
  if (!$hero) {
    const firstH1 = $('body h1').first();
    if (firstH1.length) {
      $hero = firstH1.parent();
    }
  }

  if ($hero) {
    // Extract headline (h1 or first h2)
    const h1 = $hero.find('h1').first().text().trim();
    const h2AsHeadline = !h1 && $hero.find('h2').first().text().trim();
    heroSection.headline = h1 || h2AsHeadline || undefined;

    // Extract subheadline (h2 following h1, or p following h1, or elements with subtitle/tagline classes)
    if (heroSection.headline) {
      // Look for h2 if we used h1 as headline
      if (h1) {
        const h2 = $hero.find('h2').first().text().trim();
        if (h2) {
          heroSection.subheadline = h2;
        }
      }

      // If no h2, look for subtitle/tagline classes
      if (!heroSection.subheadline) {
        const subtitleSelectors = [
          '[class*="subtitle"]',
          '[class*="tagline"]',
          '[class*="subhead"]',
          '[class*="lead"]',
          '.hero p:first',
          'h1 + p',
          'h2 + p',
        ];

        for (const selector of subtitleSelectors) {
          const text = $hero.find(selector).first().text().trim();
          if (text && text.length > 10 && text.length < 200) {
            heroSection.subheadline = text;
            break;
          }
        }
      }
    }

    // Extract CTA button
    const ctaSelectors = [
      'a.btn-primary',
      'button.btn-primary',
      'a.button',
      'button.button',
      'a[class*="cta"]',
      'button[class*="cta"]',
      'a.btn:first',
      'button:first',
    ];

    for (const selector of ctaSelectors) {
      const $cta = $hero.find(selector).first();
      if ($cta.length) {
        const ctaText = $cta.text().trim();
        if (ctaText && ctaText.length > 2 && ctaText.length < 50) {
          heroSection.ctaText = ctaText;

          // Get CTA link if it's an anchor tag
          if ($cta.is('a')) {
            const href = $cta.attr('href');
            if (href) {
              try {
                heroSection.ctaLink = new URL(href, baseUrl).href;
              } catch {
                heroSection.ctaLink = href;
              }
            }
          }
          break;
        }
      }
    }

    // Extract background image
    // First check inline styles
    const styleAttr = $hero.attr('style');
    if (styleAttr) {
      const bgImageMatch = styleAttr.match(/background-image:\s*url\(['"]?([^'")]+)['"]?\)/i);
      if (bgImageMatch && bgImageMatch[1]) {
        try {
          heroSection.backgroundImage = new URL(bgImageMatch[1], baseUrl).href;
        } catch {
          heroSection.backgroundImage = bgImageMatch[1];
        }
      }
    }

    // Check for img tags in hero if no background image found
    if (!heroSection.backgroundImage) {
      const $heroImg = $hero.find('img').first();
      if ($heroImg.length) {
        const src = $heroImg.attr('src');
        if (src) {
          try {
            heroSection.backgroundImage = new URL(src, baseUrl).href;
          } catch {
            heroSection.backgroundImage = src;
          }
        }
      }
    }
  }

  // Only return the section if we found at least a headline
  return heroSection.headline ? heroSection : undefined;
}

/**
 * Extracts business hours from HTML (ENHANCED)
 */
function extractBusinessHours($: CheerioAPI): ExtractedBusinessInfo['structuredContent']['businessHours'] {
  const businessHours: Array<{ day: string; hours: string; closed: boolean }> = [];
  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const shortDayNames = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  // Try to find schema.org OpeningHoursSpecification
  const schemaHours = $('[itemtype*="schema.org/OpeningHoursSpecification"]');
  if (schemaHours.length) {
    schemaHours.each((_, element) => {
      const $el = $(element);
      const dayOfWeek = $el.find('[itemprop="dayOfWeek"]').text().trim();
      const opens = $el.find('[itemprop="opens"]').attr('content') || $el.find('[itemprop="opens"]').text().trim();
      const closes = $el.find('[itemprop="closes"]').attr('content') || $el.find('[itemprop="closes"]').text().trim();

      if (dayOfWeek) {
        businessHours.push({
          day: dayOfWeek,
          hours: opens && closes ? `${opens} - ${closes}` : 'Closed',
          closed: !opens || !closes
        });
      }
    });
  }

  // If no schema.org data, look for common hour patterns (ENHANCED)
  if (businessHours.length === 0) {
    const hoursSelectors = [
      '.hours',
      '.business-hours',
      '[class*="hours"]',
      '[id*="hours"]',
      '.opening-hours',
      '.store-hours',
      '.operation-hours',
      '.open-hours',
      'footer [class*="hour"]',
      'aside [class*="hour"]',
      '[class*="schedule"]',
      '[class*="timing"]'
    ];

    for (const selector of hoursSelectors) {
      const $hoursContainer = $(selector).first();
      if ($hoursContainer.length) {
        const hoursText = $hoursContainer.text();

        // Enhanced day-time pattern matching
        dayNames.forEach((day, index) => {
          // Try multiple patterns
          const patterns = [
            new RegExp(`(${day}|${shortDayNames[index]})\\s*:?\\s*([\\d:\\s-]+(?:am|pm)?|closed)`, 'gi'),
            new RegExp(`(${day}|${shortDayNames[index]})\\s*[-–]?\\s*([\\d:\\s-]+(?:am|pm)?|closed)`, 'gi')
          ];

          for (const dayRegex of patterns) {
            const match = dayRegex.exec(hoursText);
            if (match) {
              const hours = match[2].trim();
              businessHours.push({
                day: day.charAt(0).toUpperCase() + day.slice(1),
                hours: hours.toLowerCase() === 'closed' ? 'Closed' : hours,
                closed: hours.toLowerCase() === 'closed'
              });
              break;
            }
          }
        });

        // Also try to find table/list structures
        const $rows = $hoursContainer.find('tr, li, div[class*="day"], div[class*="hour-item"]');
        if ($rows.length) {
          $rows.each((_, row) => {
            const text = $(row).text().trim();
            dayNames.forEach((day, index) => {
              if (text.toLowerCase().includes(day) || text.toLowerCase().includes(shortDayNames[index])) {
                const timeMatch = text.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
                if (timeMatch) {
                  const existingDay = businessHours.find(h => h.day.toLowerCase() === day);
                  if (!existingDay) {
                    businessHours.push({
                      day: day.charAt(0).toUpperCase() + day.slice(1),
                      hours: `${timeMatch[1]} - ${timeMatch[2]}`,
                      closed: false
                    });
                  }
                } else if (text.toLowerCase().includes('closed')) {
                  const existingDay = businessHours.find(h => h.day.toLowerCase() === day);
                  if (!existingDay) {
                    businessHours.push({
                      day: day.charAt(0).toUpperCase() + day.slice(1),
                      hours: 'Closed',
                      closed: true
                    });
                  }
                }
              }
            });
          });
        }

        if (businessHours.length > 0) break;
      }
    }

    // Enhanced: Look for general hours patterns in full body text
    if (businessHours.length === 0) {
      const bodyText = $('body').text();

      // Pattern for day ranges (e.g., "Mon-Fri: 9am-5pm")
      const rangePattern = /(mon|monday|tue|tuesday|wed|wednesday|thu|thursday|fri|friday|sat|saturday|sun|sunday)[\s-]*(through|thru|to|-)[\s-]*(mon|monday|tue|tuesday|wed|wednesday|thu|thursday|fri|friday|sat|saturday|sun|sunday):?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/gi;
      let match;
      while ((match = rangePattern.exec(bodyText)) !== null) {
        const startDay = match[1];
        const endDay = match[3];
        const openTime = match[4];
        const closeTime = match[5];

        businessHours.push({
          day: `${startDay}-${endDay}`,
          hours: `${openTime} - ${closeTime}`,
          closed: false
        });
      }

      // Pattern for individual days
      const individualPattern = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun):?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/gi;
      while ((match = individualPattern.exec(bodyText)) !== null) {
        const day = match[1];
        const openTime = match[2];
        const closeTime = match[3];

        const fullDay = dayNames.find(d => d.startsWith(day.toLowerCase().substring(0, 3))) || day;
        const existingDay = businessHours.find(h => h.day.toLowerCase().includes(fullDay.toLowerCase()));
        if (!existingDay) {
          businessHours.push({
            day: fullDay.charAt(0).toUpperCase() + fullDay.slice(1),
            hours: `${openTime} - ${closeTime}`,
            closed: false
          });
        }
      }
    }
  }

  // Remove duplicates and limit to reasonable number
  const uniqueHours = Array.from(new Map(
    businessHours.map(h => [`${h.day}-${h.hours}`, h])
  ).values()).slice(0, 10); // Increased to 10 for better coverage

  return uniqueHours.length > 0 ? uniqueHours : undefined;
}

/**
 * Extracts services with pricing from HTML (ENHANCED)
 */
function extractServices($: CheerioAPI): ExtractedBusinessInfo['structuredContent']['services'] {
  const services: Array<{ name: string; description?: string; price?: string; duration?: string }> = [];

  // Look for schema.org Service or Product markup
  const schemaServices = $('[itemtype*="schema.org/Service"], [itemtype*="schema.org/Product"], [itemtype*="schema.org/Offer"]');
  schemaServices.each((_, element) => {
    const $el = $(element);
    const name = $el.find('[itemprop="name"]').text().trim();
    const description = $el.find('[itemprop="description"]').text().trim();
    const price = $el.find('[itemprop="price"]').text().trim() ||
                  $el.find('[itemprop="offers"] [itemprop="price"]').text().trim() ||
                  $el.find('[itemprop="priceCurrency"]').parent().text().trim();

    if (name) {
      services.push({
        name,
        description: description || undefined,
        price: price || undefined
      });
    }
  });

  // Enhanced service/pricing pattern detection
  if (services.length === 0) {
    const serviceSelectors = [
      '.service-item',
      '.price-card',
      '.pricing-item',
      '[class*="service"]',
      '[class*="pricing"]',
      '[class*="package"]',
      '[class*="plan"]',
      '[class*="product-item"]',
      '[class*="offering"]',
      '.menu-item',
      '.treatment',
      '.program-item',
      '.course-item'
    ];

    for (const selector of serviceSelectors) {
      $(selector).each((_, element) => {
        const $item = $(element);

        // Enhanced name extraction
        const nameSelectors = ['h2', 'h3', 'h4', 'h5', '.title', '.name', '.service-name', '.item-title', '.product-name', '.heading'];
        let name = '';
        for (const nameSelector of nameSelectors) {
          const found = $item.find(nameSelector).first().text().trim();
          if (found && found.length < 200) {
            name = found;
            break;
          }
        }

        // Enhanced price extraction
        const priceSelectors = ['.price', '.cost', '[class*="price"]', '.rate', '.fee', '.amount', '[class*="pricing"]'];
        let price = '';
        for (const priceSelector of priceSelectors) {
          const found = $item.find(priceSelector).first().text().trim();
          if (found && (found.includes('$') || found.includes('€') || found.includes('£') || found.match(/\d/))) {
            price = found;
            break;
          }
        }

        // Enhanced description extraction
        const descSelectors = ['p', '.description', '.desc', '.details', '.info', '.summary', '.content'];
        let description = '';
        for (const descSelector of descSelectors) {
          const found = $item.find(descSelector).first().text().trim();
          if (found && found.length > 10 && found.length < 500 && found !== name && found !== price) {
            description = found;
            break;
          }
        }

        // Enhanced duration extraction
        const durationRegex = /(\d+\s*(?:hour|hr|minute|min|day|week|month|session|class|visit)s?)/i;
        const itemText = $item.text();
        const durationMatch = itemText.match(durationRegex);
        const duration = durationMatch ? durationMatch[1] : undefined;

        if (name && (price || description)) {
          // Check if this service already exists
          const exists = services.some(s => s.name === name);
          if (!exists) {
            services.push({
              name,
              description: description || undefined,
              price: price || undefined,
              duration
            });
          }
        }
      });

      if (services.length >= 5) break; // Stop if we have enough services
    }
  }

  // Enhanced: Look for pricing tables
  if (services.length === 0) {
    $('table').each((_, table) => {
      const $table = $(table);
      const text = $table.text().toLowerCase();

      // Check if this looks like a pricing/service table
      if (text.includes('price') || text.includes('cost') || text.includes('service') || text.includes('package') || text.includes('$')) {
        const headers: string[] = [];
        $table.find('thead th, tr:first th, tr:first td').each((_, cell) => {
          headers.push($(cell).text().trim().toLowerCase());
        });

        $table.find('tbody tr, tr').each((index, row) => {
          if (index === 0 && (headers.length > 0 || $(row).find('th').length > 0)) return; // Skip header row

          const $cells = $(row).find('td, th');
          if ($cells.length >= 2) {
            const nameCell = $cells.eq(0).text().trim();
            const priceCell = $cells.eq($cells.length - 1).text().trim();
            const descCell = $cells.length > 2 ? $cells.eq(1).text().trim() : '';

            if (nameCell && nameCell.length < 200 && !nameCell.toLowerCase().includes('total')) {
              const hasPrice = priceCell && (priceCell.includes('$') || priceCell.match(/\d/));
              if (hasPrice || descCell) {
                services.push({
                  name: nameCell,
                  description: descCell || undefined,
                  price: hasPrice ? priceCell : undefined
                });
              }
            }
          }
        });
      }
    });
  }

  // Enhanced: Look for list-based services
  if (services.length === 0) {
    const listSelectors = [
      'ul.services li',
      'ul.pricing li',
      '[class*="service-list"] li',
      '[class*="offering"] li'
    ];

    for (const selector of listSelectors) {
      $(selector).each((_, item) => {
        const text = $(item).text().trim();
        // Look for service with price pattern
        const serviceMatch = text.match(/^(.+?)\s*[-–:]\s*(\$[\d,]+(?:\.\d{2})?|\d+\s*(?:dollars?|euros?|pounds?))/i);
        if (serviceMatch) {
          services.push({
            name: serviceMatch[1].trim(),
            price: serviceMatch[2].trim()
          });
        } else if (text.length > 5 && text.length < 200) {
          // Add as service name if it looks reasonable
          services.push({
            name: text
          });
        }
      });
    }
  }

  // Remove duplicates and limit
  const uniqueServices = Array.from(new Map(
    services.map(s => [s.name, s])
  ).values()).slice(0, 30); // Increased to 30 services for better coverage

  return uniqueServices.length > 0 ? uniqueServices : undefined;
}

/**
 * Extracts testimonials from HTML (ENHANCED with better null handling)
 */
function extractTestimonials($: CheerioAPI): ExtractedBusinessInfo['structuredContent']['testimonials'] {
  const testimonials: Array<{ name?: string; role?: string; content: string; rating?: number }> = [];

  // Look for schema.org Review markup
  const schemaReviews = $('[itemtype*="schema.org/Review"], [itemtype*="schema.org/UserReview"]');
  schemaReviews.each((_, element) => {
    const $el = $(element);
    const content = $el.find('[itemprop="reviewBody"], [itemprop="description"], [itemprop="text"]').text().trim();
    const author = $el.find('[itemprop="author"], [itemprop="name"]').text().trim();
    const ratingValue = $el.find('[itemprop="ratingValue"]').attr('content') ||
                       $el.find('[itemprop="ratingValue"]').text().trim();

    if (content && content.length > 10) {
      testimonials.push({
        name: author || undefined,  // Allow null/undefined names
        content,
        rating: ratingValue ? parseFloat(ratingValue) : undefined
      });
    }
  });

  // Enhanced testimonial pattern detection
  if (testimonials.length === 0) {
    const testimonialSelectors = [
      '.testimonial',
      '.review',
      '.feedback',
      '[class*="testimonial"]',
      '[class*="review"]',
      '[class*="customer-feedback"]',
      '[class*="client-review"]',
      'blockquote',
      '.quote',
      '.customer-review',
      '.user-review',
      '.rating-item'
    ];

    for (const selector of testimonialSelectors) {
      $(selector).each((_, element) => {
        const $item = $(element);

        // Enhanced content extraction
        const contentSelectors = ['p', '.content', '.text', '.quote-text', '.review-text', '.message', '.comment'];
        let content = '';
        for (const contentSelector of contentSelectors) {
          const found = $item.find(contentSelector).first().text().trim();
          if (found && found.length > 20) {
            content = found;
            break;
          }
        }

        // If no nested content found, try the element itself
        if (!content) {
          // Clone and remove author/name elements to get clean content
          const $clone = $item.clone();
          $clone.find('.author, .name, .customer, .reviewer, .by, cite, footer').remove();
          content = $clone.text().trim();
        }

        // Enhanced author name extraction
        const nameSelectors = ['.author', '.name', '.customer', '.reviewer', '.client-name', '.user-name', 'cite', 'footer', '.by'];
        let name = '';
        for (const nameSelector of nameSelectors) {
          const found = $item.find(nameSelector).first().text().trim()
            .replace(/^[-–—]\s*/, '') // Remove leading dashes
            .replace(/^by\s+/i, ''); // Remove "by" prefix
          if (found && found.length < 100) {
            name = found;
            break;
          }
        }

        // Enhanced role/company extraction
        const roleSelectors = ['.role', '.title', '.company', '.position', '.designation', '.job-title'];
        let role = '';
        for (const roleSelector of roleSelectors) {
          const found = $item.find(roleSelector).first().text().trim();
          if (found && found.length < 100) {
            role = found;
            break;
          }
        }

        // Enhanced rating extraction
        let rating: number | undefined;

        // Check for star ratings
        const starElements = $item.find('[class*="star"], [class*="rating"]');
        if (starElements.length) {
          // Count filled stars
          const filledStars = starElements.filter((_, el) => {
            const className = $(el).attr('class') || '';
            const style = $(el).attr('style') || '';
            return className.includes('filled') ||
                   className.includes('active') ||
                   className.includes('full') ||
                   className.includes('checked') ||
                   style.includes('color');
          }).length;

          if (filledStars > 0 && filledStars <= 5) {
            rating = filledStars;
          }
        }

        // Alternative: look for rating text or data attributes
        if (!rating) {
          // Check data attributes
          const dataRating = $item.attr('data-rating') || $item.find('[data-rating]').attr('data-rating');
          if (dataRating) {
            rating = parseFloat(dataRating);
          }
        }

        if (!rating) {
          // Check for rating in text
          const ratingMatch = $item.text().match(/(\d(?:\.\d)?)\s*(?:star|★|⭐|\/\s*5)/i);
          if (ratingMatch) {
            rating = parseFloat(ratingMatch[1]);
          }
        }

        // Only add if we have meaningful content
        if (content && content.length > 20 && content.length < 2000) {
          // Don't require name - allow anonymous testimonials
          testimonials.push({
            name: name || undefined,  // Explicitly allow undefined
            role: role || undefined,  // Explicitly allow undefined
            content,
            rating: rating && rating <= 5 ? rating : undefined  // Only include valid ratings
          });
        }
      });

      if (testimonials.length >= 5) break; // Stop if we have enough testimonials
    }
  }

  // Remove duplicates based on content similarity and limit
  const uniqueTestimonials = Array.from(new Map(
    testimonials.map(t => [t.content.substring(0, 100), t]) // Use first 100 chars as key
  ).values()).slice(0, 30); // Increased to 30 testimonials

  return uniqueTestimonials.length > 0 ? uniqueTestimonials : undefined;
}

/**
 * Extract FAQ section (NEW)
 */
function extractFAQ($: CheerioAPI): ExtractedBusinessInfo['structuredContent']['faq'] {
  const faqs: Array<{ question: string; answer: string }> = [];

  // Look for schema.org FAQ markup
  const schemaFAQs = $('[itemtype*="schema.org/FAQPage"], [itemtype*="schema.org/Question"]');
  schemaFAQs.each((_, element) => {
    const $el = $(element);
    const question = $el.find('[itemprop="name"]').text().trim();
    const answer = $el.find('[itemprop="acceptedAnswer"] [itemprop="text"], [itemprop="text"]').text().trim();

    if (question && answer) {
      faqs.push({ question, answer });
    }
  });

  // Look for common FAQ patterns
  if (faqs.length === 0) {
    const faqSelectors = [
      '.faq-item',
      '[class*="faq"]',
      '[class*="question-answer"]',
      '.accordion-item',
      'details',
      '[class*="qa-"]'
    ];

    for (const selector of faqSelectors) {
      $(selector).each((_, element) => {
        const $item = $(element);

        // Look for question
        const qSelectors = ['h3', 'h4', 'h5', '.question', 'summary', '[class*="question"]', 'dt'];
        let question = '';
        for (const qSelector of qSelectors) {
          const found = $item.find(qSelector).first().text().trim();
          if (found && found.includes('?')) {
            question = found;
            break;
          }
        }

        // Look for answer
        const aSelectors = ['p', '.answer', '[class*="answer"]', 'dd', '.content'];
        let answer = '';
        for (const aSelector of aSelectors) {
          const found = $item.find(aSelector).first().text().trim();
          if (found && found.length > 10 && found !== question) {
            answer = found;
            break;
          }
        }

        if (question && answer) {
          faqs.push({ question, answer });
        }
      });
    }
  }

  // Also check for definition lists
  $('dl').each((_, dl) => {
    const $dl = $(dl);
    const $dts = $dl.find('dt');
    const $dds = $dl.find('dd');

    $dts.each((index, dt) => {
      const question = $(dt).text().trim();
      const $dd = $dds.eq(index);
      if ($dd.length) {
        const answer = $dd.text().trim();
        if (question && answer && question.length < 300 && answer.length < 1000) {
          faqs.push({ question, answer });
        }
      }
    });
  });

  return faqs.length > 0 ? faqs.slice(0, 20) : undefined;
}

/**
 * Extract product categories (NEW)
 */
function extractProductCategories($: CheerioAPI): ExtractedBusinessInfo['structuredContent']['productCategories'] {
  const categories: Array<{ name: string; description?: string; itemCount?: number }> = [];

  // Look for category listings
  const categorySelectors = [
    '[class*="category"]',
    '[class*="product-type"]',
    '[class*="collection"]',
    '.catalog-section',
    '[class*="department"]',
    '.product-category'
  ];

  for (const selector of categorySelectors) {
    $(selector).each((_, element) => {
      const $item = $(element);

      // Extract category name
      const nameSelectors = ['h2', 'h3', 'h4', '.title', '.name', 'a'];
      let name = '';
      for (const nameSelector of nameSelectors) {
        const found = $item.find(nameSelector).first().text().trim();
        if (found && found.length < 100) {
          name = found;
          break;
        }
      }

      // Extract description
      const description = $item.find('p, .description').first().text().trim();

      // Try to extract item count
      const countMatch = $item.text().match(/(\d+)\s*(?:items?|products?|plants?|varieties)/i);
      const itemCount = countMatch ? parseInt(countMatch[1]) : undefined;

      if (name && !categories.some(c => c.name === name)) {
        categories.push({
          name,
          description: description || undefined,
          itemCount
        });
      }
    });
  }

  // Look in navigation for category links
  $('nav a, .menu a').each((_, link) => {
    const text = $(link).text().trim();
    const href = $(link).attr('href') || '';

    if (href.includes('category') || href.includes('collection') || href.includes('products')) {
      if (!categories.some(c => c.name === text)) {
        categories.push({ name: text });
      }
    }
  });

  return categories.length > 0 ? categories.slice(0, 15) : undefined;
}

/**
 * Extract footer content (NEW)
 */
function extractFooterContent($: CheerioAPI, baseUrl: string): ExtractedBusinessInfo['structuredContent']['footerContent'] {
  const footer = $('footer').first();
  if (!footer.length) return undefined;

  const footerContent: ExtractedBusinessInfo['structuredContent']['footerContent'] = {};

  // Extract copyright text
  const copyrightSelectors = ['.copyright', '[class*="copyright"]', 'footer p'];
  for (const selector of copyrightSelectors) {
    const text = footer.find(selector).first().text().trim();
    if (text && (text.includes('©') || text.includes('Copyright') || text.includes(new Date().getFullYear().toString()))) {
      footerContent.copyrightText = text;
      break;
    }
  }

  // Extract important links
  const importantLinks: Array<{ text: string; url: string }> = [];
  footer.find('a').each((_, link) => {
    const text = $(link).text().trim();
    const href = $(link).attr('href');
    if (text && href && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
      try {
        const url = new URL(href, baseUrl).href;
        importantLinks.push({ text, url });
      } catch {
        // Skip invalid URLs
      }
    }
  });

  if (importantLinks.length > 0) {
    footerContent.importantLinks = importantLinks.slice(0, 10);
  }

  // Extract additional info
  const additionalText = footer.clone()
    .find('script, style').remove().end()
    .text().trim()
    .substring(0, 500);

  if (additionalText && additionalText.length > 50) {
    footerContent.additionalInfo = additionalText;
  }

  return Object.keys(footerContent).length > 0 ? footerContent : undefined;
}

/**
 * Extract main page content for context (NEW)
 */
function extractPageContent($: CheerioAPI): ExtractedBusinessInfo['pageContent'] {
  // Extract main content
  const mainSelectors = ['main', 'article', '[role="main"]', '#content', '.content'];
  let mainContent = '';
  for (const selector of mainSelectors) {
    const $main = $(selector).first();
    if ($main.length) {
      mainContent = $main.clone()
        .find('script, style, nav, header, footer').remove().end()
        .text().trim()
        .substring(0, 8000); // Increased from 5000 to 8000
      break;
    }
  }

  // If no main content found, get body text
  if (!mainContent) {
    mainContent = $('body').clone()
      .find('script, style, nav, header, footer').remove().end()
      .text().trim()
      .substring(0, 8000);
  }

  // Extract footer text
  const footerText = $('footer').text().trim().substring(0, 2000);

  // Extract sidebar content if exists
  const sidebarSelectors = ['aside', '.sidebar', '[role="complementary"]'];
  let sidebarContent: string | undefined;
  for (const selector of sidebarSelectors) {
    const $sidebar = $(selector).first();
    if ($sidebar.length) {
      sidebarContent = $sidebar.text().trim().substring(0, 2000);
      break;
    }
  }

  return {
    mainContent,
    footerText,
    sidebarContent
  };
}

/**
 * Main extraction function (ENHANCED)
 */
export function extractBusinessInfo(html: string, baseUrl: string): ExtractedBusinessInfo {
  const $ = load(html);

  // Extract structured content for preservation
  const structuredContent: ExtractedBusinessInfo['structuredContent'] = {};

  const businessHours = extractBusinessHours($);
  if (businessHours) {
    structuredContent.businessHours = businessHours;
  }

  const services = extractServices($);
  if (services) {
    structuredContent.services = services;
  }

  const testimonials = extractTestimonials($);
  if (testimonials) {
    structuredContent.testimonials = testimonials;
  }

  const faq = extractFAQ($);
  if (faq) {
    structuredContent.faq = faq;
  }

  const productCategories = extractProductCategories($);
  if (productCategories) {
    structuredContent.productCategories = productCategories;
  }

  const footerContent = extractFooterContent($, baseUrl);
  if (footerContent) {
    structuredContent.footerContent = footerContent;
  }

  return {
    emails: extractEmails($),
    phones: extractPhones($),
    addresses: extractAddresses($),
    socialLinks: extractSocialLinks($),
    logoUrl: extractLogo($, baseUrl),
    brandColors: extractBrandColorsImproved(html),
    keyFeatures: extractKeyFeatures($),
    businessDescription: extractBusinessDescription($),
    heroSection: extractHeroSection($, baseUrl),
    siteTitle: $('title').text().trim() || undefined,
    siteDescription: $('meta[name="description"]').attr('content')?.trim() || undefined,
    favicon: $('link[rel*="icon"]').attr('href') || undefined,
    structuredContent: Object.keys(structuredContent).length > 0 ? structuredContent : undefined,
    pageContent: extractPageContent($)
  };
}
