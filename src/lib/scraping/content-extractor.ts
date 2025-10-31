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
  // Detected font families (primary first)
  fonts?: string[];

  // Typography styles for different text elements
  typography?: {
    heading?: {
      fontFamily?: string;
      fontWeight?: string | number;
      textColor?: string;
      fontSize?: string;
    };
    body?: {
      fontFamily?: string;
      fontWeight?: string | number;
      textColor?: string;
      fontSize?: string;
      lineHeight?: string;
    };
    accent?: {
      fontFamily?: string;
      fontWeight?: string | number;
      textColor?: string;
    };
  };

  // Design Tokens (NEW)
  designTokens?: {
    spacing?: {
      values: string[];  // e.g., ["0.5rem", "1rem", "1.5rem", "2rem"]
      unit: 'rem' | 'px' | 'em';
    };
    borderRadius?: {
      values: string[];  // e.g., ["4px", "8px", "16px", "9999px"]
    };
    shadows?: string[];  // e.g., ["0 2px 4px rgba(0,0,0,0.1)", "0 10px 20px rgba(0,0,0,0.15)"]
  };

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

  // Hero images extracted by LLM (Phase 2D)
  heroImages?: Array<{
    url: string;
    context: string;
    alt?: string;
    dimensions?: { width: number; height: number };
    confidence: number;
  }>;

  // Gallery Data
  galleries?: Array<{
    type: 'grid' | 'carousel' | 'masonry' | 'unknown';
    images: Array<{
      url: string;
      alt?: string;
      width?: number;
      height?: number;
      aspectRatio?: string; // e.g., "16:9", "1:1", "4:3"
    }>;
    columns?: number; // For grid layouts
    title?: string; // Gallery title if available
  }>;

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

  // Cluster similar colors to avoid near-duplicates
  function hexToRgb(hex: string): [number, number, number] | null {
    const m = hex.match(/^#([0-9a-fA-F]{6})$/);
    if (!m) return null;
    const r = parseInt(m[1].slice(0,2),16);
    const g = parseInt(m[1].slice(2,4),16);
    const b = parseInt(m[1].slice(4,6),16);
    return [r,g,b];
  }
  function distance(a: string, b: string): number {
    const ra = hexToRgb(a); const rb = hexToRgb(b);
    if (!ra || !rb) return Infinity;
    const dr = ra[0]-rb[0]; const dg = ra[1]-rb[1]; const db = ra[2]-rb[2];
    return Math.sqrt(dr*dr + dg*dg + db*db);
  }
  const selected: string[] = [];
  const THRESHOLD = 30; // RGB Euclidean threshold for similarity
  for (const c of ranked) {
    if (selected.length >= 5) break;
    if (selected.every(s => distance(s, c) > THRESHOLD)) {
      selected.push(c);
    }
  }
  return selected.length > 0 ? selected : ranked.slice(0, 5);
}

/**
 * Extracts font families from the page
 */
function extractFonts($: CheerioAPI, html: string): string[] | undefined {
  const fonts = new Set<string>();

  // 1) Google Fonts link tags
  $('link[rel="stylesheet"][href*="fonts.googleapis.com"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    try {
      const url = new URL(href, 'https://example.com');
      const familyParam = url.searchParams.get('family');
      if (familyParam) {
        // Format can be: Family+Name:wght@400;700|Another+Family
        const families = familyParam.split('|').map(s => s.split(':')[0]);
        families.forEach(f => {
          const name = decodeURIComponent(f.replace(/\+/g, ' ')).trim();
          if (name) fonts.add(name);
        });
      }
    } catch {}
  });

  // 2) @font-face declarations in style tags
  const styleTags = $('style').toArray().slice(0, 8); // limit to first 8 style tags
  const fontFaceRe = /@font-face\s*{[^}]*font-family:\s*['\"]?([^;\'\"]+)['\"]?[^}]*}/gi;
  styleTags.forEach(node => {
    const css = ($(node).html() || '').toString();
    let m: RegExpExecArray | null;
    fontFaceRe.lastIndex = 0;
    while ((m = fontFaceRe.exec(css)) !== null) {
      const name = m[1].trim();
      if (name && !/^(sans-serif|serif|monospace|system-ui|emoji|cursive|fantasy)$/i.test(name)) {
        fonts.add(name.replace(/[\"']/g, ''));
      }
    }
  });

  // 3) font-family declarations (style tags + inline styles)
  const fontFamilyRe = /font-family\s*:\s*([^;]+);/gi;
  const generics = new Set(['sans-serif','serif','monospace','system-ui','emoji','cursive','fantasy']);

  // From style tags
  styleTags.forEach(node => {
    const css = ($(node).html() || '').toString();
    let m: RegExpExecArray | null;
    fontFamilyRe.lastIndex = 0;
    while ((m = fontFamilyRe.exec(css)) !== null) {
      const families = m[1].split(',').map(s => s.trim().replace(/[\"']/g, ''));
      families.forEach(f => { if (f && !generics.has(f.toLowerCase())) fonts.add(f); });
    }
  });

  // From inline styles (bounded)
  let inlineCount = 0;
  $('[style]').each((_, el) => {
    if (++inlineCount > 400) return false;
    const style = ($(el).attr('style') || '').toLowerCase();
    let m: RegExpExecArray | null;
    fontFamilyRe.lastIndex = 0;
    while ((m = fontFamilyRe.exec(style)) !== null) {
      const families = m[1].split(',').map(s => s.trim().replace(/[\"']/g, ''));
      families.forEach(f => { if (f && !generics.has(f.toLowerCase())) fonts.add(f); });
    }
  });

  const result = Array.from(fonts);
  if (result.length === 0) return undefined;

  // Heuristic: put common web fonts near end unless they are the only ones
  const deprioritize = ['arial', 'helvetica', 'times new roman', 'georgia', 'verdana', 'tahoma'];
  result.sort((a, b) => {
    const ai = deprioritize.includes(a.toLowerCase()) ? 1 : 0;
    const bi = deprioritize.includes(b.toLowerCase()) ? 1 : 0;
    return ai - bi;
  });

  return result.slice(0, 5);
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
 * Extracts spacing tokens from the page's design system
 */
function extractSpacingTokens($: CheerioAPI, html: string): ExtractedBusinessInfo['designTokens']['spacing'] {
  const spacingValues = new Map<string, number>();

  // Helper to normalize spacing values to pixels for comparison
  function toPx(value: string): number | null {
    const remMatch = value.match(/^([\d.]+)rem$/);
    const emMatch = value.match(/^([\d.]+)em$/);
    const pxMatch = value.match(/^([\d.]+)px$/);

    if (remMatch) return parseFloat(remMatch[1]) * 16; // Assuming 16px base
    if (emMatch) return parseFloat(emMatch[1]) * 16;  // Simplified, assuming 16px base
    if (pxMatch) return parseFloat(pxMatch[1]);
    return null;
  }

  // Helper to detect spacing unit preference
  function detectUnit(values: Set<string>): 'rem' | 'px' | 'em' {
    let remCount = 0, pxCount = 0, emCount = 0;
    values.forEach(v => {
      if (v.includes('rem')) remCount++;
      else if (v.includes('px')) pxCount++;
      else if (v.includes('em')) emCount++;
    });

    if (remCount >= pxCount && remCount >= emCount) return 'rem';
    if (pxCount >= emCount) return 'px';
    return 'em';
  }

  // 1. Extract from CSS variables in style tags
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  const cssVarRegex = /--([\w-]*(?:spacing|space|gap|margin|padding|p|m|size)[\w-]*)\s*:\s*([^;]+);/gi;

  let styleMatch;
  while ((styleMatch = styleRegex.exec(html)) !== null) {
    const css = styleMatch[1];
    let varMatch;
    while ((varMatch = cssVarRegex.exec(css)) !== null) {
      const value = varMatch[2].trim();
      // Only process numeric spacing values
      if (/^[\d.]+(?:rem|px|em)$/.test(value)) {
        spacingValues.set(value, (spacingValues.get(value) || 0) + 2); // CSS vars have higher weight
      }
    }
  }

  // 2. Extract from inline styles
  const MAX_INLINE_SCAN = 500;
  let inlineCount = 0;

  $('[style]').each((_, el) => {
    if (++inlineCount > MAX_INLINE_SCAN) return false;

    const style = $(el).attr('style') || '';
    // Extract padding, margin, gap values
    const spacingRegex = /(?:padding|margin|gap|row-gap|column-gap)(?:-(?:top|right|bottom|left|x|y))?\s*:\s*([\d.]+(?:rem|px|em))/gi;

    let match;
    while ((match = spacingRegex.exec(style)) !== null) {
      const value = match[1];
      spacingValues.set(value, (spacingValues.get(value) || 0) + 1);
    }
  });

  // 3. Extract from Tailwind classes if present (common spacing values)
  const tailwindSpacingMap: Record<string, string> = {
    'p-0': '0px', 'm-0': '0px',
    'p-0.5': '0.125rem', 'm-0.5': '0.125rem',
    'p-1': '0.25rem', 'm-1': '0.25rem',
    'p-1.5': '0.375rem', 'm-1.5': '0.375rem',
    'p-2': '0.5rem', 'm-2': '0.5rem',
    'p-2.5': '0.625rem', 'm-2.5': '0.625rem',
    'p-3': '0.75rem', 'm-3': '0.75rem',
    'p-3.5': '0.875rem', 'm-3.5': '0.875rem',
    'p-4': '1rem', 'm-4': '1rem',
    'p-5': '1.25rem', 'm-5': '1.25rem',
    'p-6': '1.5rem', 'm-6': '1.5rem',
    'p-7': '1.75rem', 'm-7': '1.75rem',
    'p-8': '2rem', 'm-8': '2rem',
    'p-9': '2.25rem', 'm-9': '2.25rem',
    'p-10': '2.5rem', 'm-10': '2.5rem',
    'p-11': '2.75rem', 'm-11': '2.75rem',
    'p-12': '3rem', 'm-12': '3rem',
    'p-14': '3.5rem', 'm-14': '3.5rem',
    'p-16': '4rem', 'm-16': '4rem',
    'p-20': '5rem', 'm-20': '5rem',
    'p-24': '6rem', 'm-24': '6rem',
    'p-28': '7rem', 'm-28': '7rem',
    'p-32': '8rem', 'm-32': '8rem',
    'gap-1': '0.25rem', 'gap-2': '0.5rem', 'gap-3': '0.75rem',
    'gap-4': '1rem', 'gap-5': '1.25rem', 'gap-6': '1.5rem',
    'gap-8': '2rem', 'gap-10': '2.5rem', 'gap-12': '3rem',
    'space-x-1': '0.25rem', 'space-x-2': '0.5rem', 'space-x-4': '1rem',
    'space-y-1': '0.25rem', 'space-y-2': '0.5rem', 'space-y-4': '1rem',
  };

  $('[class]').slice(0, 200).each((_, el) => {
    const classes = $(el).attr('class') || '';
    for (const [className, value] of Object.entries(tailwindSpacingMap)) {
      if (classes.includes(className)) {
        spacingValues.set(value, (spacingValues.get(value) || 0) + 0.5);
      }
    }
  });

  // Filter and sort by frequency
  const sortedValues = Array.from(spacingValues.entries())
    .filter(([value]) => {
      const px = toPx(value);
      // Filter out very large values (likely not part of spacing system)
      return px !== null && px <= 128;
    })
    .sort((a, b) => b[1] - a[1])
    .map(([value]) => value);

  if (sortedValues.length === 0) return undefined;

  // Cluster similar values to avoid near-duplicates
  const clustered: string[] = [];
  const THRESHOLD = 2; // 2px threshold for similarity

  for (const value of sortedValues) {
    const px = toPx(value);
    if (px === null) continue;

    const isSimilar = clustered.some(existing => {
      const existingPx = toPx(existing);
      return existingPx !== null && Math.abs(px - existingPx) < THRESHOLD;
    });

    if (!isSimilar) {
      clustered.push(value);
    }

    if (clustered.length >= 8) break; // Limit to 8 most common values
  }

  // Sort by actual size
  clustered.sort((a, b) => {
    const aPx = toPx(a) || 0;
    const bPx = toPx(b) || 0;
    return aPx - bPx;
  });

  const unit = detectUnit(new Set(clustered));

  return clustered.length > 0 ? { values: clustered, unit } : undefined;
}

/**
 * Extracts border radius tokens from the page's design system
 */
function extractBorderRadius($: CheerioAPI, html: string): ExtractedBusinessInfo['designTokens']['borderRadius'] {
  const radiusValues = new Map<string, number>();

  // Helper to normalize radius values
  function normalizeRadius(value: string): string | null {
    // Handle multiple values (e.g., "4px 4px 0 0")
    const parts = value.trim().split(/\s+/);
    if (parts.length > 1) {
      // Take the first value as representative
      value = parts[0];
    }

    // Check if it's a valid radius value
    if (/^[\d.]+(?:px|rem|em|%)?$/.test(value) || value === '9999px' || value === '50%') {
      // Normalize percentages to px equivalent for circles
      if (value === '50%') return '9999px'; // Treat as full rounded
      return value;
    }
    return null;
  }

  // 1. Extract from CSS variables
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  const cssVarRegex = /--([\w-]*(?:radius|rounded|corner|br)[\w-]*)\s*:\s*([^;]+);/gi;

  let styleMatch;
  while ((styleMatch = styleRegex.exec(html)) !== null) {
    const css = styleMatch[1];
    let varMatch;
    while ((varMatch = cssVarRegex.exec(css)) !== null) {
      const normalized = normalizeRadius(varMatch[2]);
      if (normalized) {
        radiusValues.set(normalized, (radiusValues.get(normalized) || 0) + 3);
      }
    }
  }

  // 2. Extract from style tags (border-radius declarations)
  const borderRadiusRegex = /border-radius\s*:\s*([^;]+);/gi;
  styleRegex.lastIndex = 0;

  while ((styleMatch = styleRegex.exec(html)) !== null) {
    const css = styleMatch[1];
    let radiusMatch;
    while ((radiusMatch = borderRadiusRegex.exec(css)) !== null) {
      const normalized = normalizeRadius(radiusMatch[1]);
      if (normalized) {
        radiusValues.set(normalized, (radiusValues.get(normalized) || 0) + 1);
      }
    }
  }

  // 3. Extract from inline styles
  const MAX_INLINE_SCAN = 400;
  let inlineCount = 0;

  const importantSelectors = 'button, .btn, .button, .card, .panel, .box, .modal, input, textarea, select, img';

  // Scan important elements first
  $(importantSelectors).each((_, el) => {
    if (++inlineCount > MAX_INLINE_SCAN) return false;

    const style = $(el).attr('style') || '';
    const radiusMatch = style.match(/border-radius\s*:\s*([^;]+)/i);

    if (radiusMatch) {
      const normalized = normalizeRadius(radiusMatch[1]);
      if (normalized) {
        radiusValues.set(normalized, (radiusValues.get(normalized) || 0) + 2);
      }
    }
  });

  // 4. Extract from Tailwind rounded classes
  const tailwindRadiusMap: Record<string, string> = {
    'rounded-none': '0px',
    'rounded-sm': '2px',
    'rounded': '4px',
    'rounded-md': '6px',
    'rounded-lg': '8px',
    'rounded-xl': '12px',
    'rounded-2xl': '16px',
    'rounded-3xl': '24px',
    'rounded-full': '9999px',
  };

  $('[class*="rounded"]').slice(0, 200).each((_, el) => {
    const classes = $(el).attr('class') || '';
    for (const [className, value] of Object.entries(tailwindRadiusMap)) {
      if (new RegExp(`\\b${className}\\b`).test(classes)) {
        radiusValues.set(value, (radiusValues.get(value) || 0) + 1);
      }
    }
  });

  // Sort by frequency and filter
  const sortedValues = Array.from(radiusValues.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([value]) => value)
    .filter(value => {
      // Filter out 0 unless it's significant
      if (value === '0px' || value === '0') {
        return radiusValues.get(value)! > 2;
      }
      return true;
    });

  // Deduplicate and limit
  const unique = Array.from(new Set(sortedValues)).slice(0, 6);

  // Sort by size (except 9999px which should be last)
  unique.sort((a, b) => {
    if (a === '9999px') return 1;
    if (b === '9999px') return -1;

    const aNum = parseFloat(a) || 0;
    const bNum = parseFloat(b) || 0;
    return aNum - bNum;
  });

  return unique.length > 0 ? { values: unique } : undefined;
}

/**
 * Extracts box shadow tokens from the page's design system
 */
function extractShadows($: CheerioAPI, html: string): ExtractedBusinessInfo['designTokens']['shadows'] {
  const shadowValues = new Map<string, number>();

  // Helper to normalize shadow values
  function normalizeShadow(value: string): string | null {
    // Clean up the shadow value
    value = value.trim();

    // Skip 'none' or 'initial' values
    if (value === 'none' || value === 'initial' || value === 'unset') return null;

    // Check if it looks like a valid shadow
    // Should have at least 2 numeric values (offset-x offset-y)
    const hasNumeric = /\d+(?:px|rem|em)?/.test(value);
    const hasColor = /(?:rgba?|hsla?|#|black|white|gray|grey)/.test(value);

    if (hasNumeric) {
      // Normalize multiple shadows (take first one as most important)
      if (value.includes(',') && !value.includes('rgba') && !value.includes('hsla')) {
        value = value.split(',')[0].trim();
      }
      return value;
    }

    return null;
  }

  // 1. Extract from CSS variables
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  const cssVarRegex = /--([\w-]*(?:shadow|elevation|drop)[\w-]*)\s*:\s*([^;]+);/gi;

  let styleMatch;
  while ((styleMatch = styleRegex.exec(html)) !== null) {
    const css = styleMatch[1];
    let varMatch;
    while ((varMatch = cssVarRegex.exec(css)) !== null) {
      const normalized = normalizeShadow(varMatch[2]);
      if (normalized) {
        shadowValues.set(normalized, (shadowValues.get(normalized) || 0) + 3);
      }
    }
  }

  // 2. Extract from style tags (box-shadow declarations)
  const boxShadowRegex = /box-shadow\s*:\s*([^;]+);/gi;
  styleRegex.lastIndex = 0;

  while ((styleMatch = styleRegex.exec(html)) !== null) {
    const css = styleMatch[1];
    let shadowMatch;
    while ((shadowMatch = boxShadowRegex.exec(css)) !== null) {
      const normalized = normalizeShadow(shadowMatch[1]);
      if (normalized) {
        shadowValues.set(normalized, (shadowValues.get(normalized) || 0) + 1);
      }
    }
  }

  // 3. Extract from inline styles on important elements
  const MAX_INLINE_SCAN = 400;
  let inlineCount = 0;

  const importantSelectors = '.card, .panel, .modal, .dropdown, .popup, .box, button, .btn, header, nav, [class*="shadow"]';

  $(importantSelectors).each((_, el) => {
    if (++inlineCount > MAX_INLINE_SCAN) return false;

    const style = $(el).attr('style') || '';
    const shadowMatch = style.match(/box-shadow\s*:\s*([^;]+)/i);

    if (shadowMatch) {
      const normalized = normalizeShadow(shadowMatch[1]);
      if (normalized) {
        shadowValues.set(normalized, (shadowValues.get(normalized) || 0) + 2);
      }
    }
  });

  // 4. Common shadow patterns (if using utility classes)
  const commonShadows: Record<string, string> = {
    'shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    'shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    'shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    'shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    'shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    'shadow-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    'shadow-inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  };

  $('[class*="shadow"]').slice(0, 200).each((_, el) => {
    const classes = $(el).attr('class') || '';
    for (const [className, value] of Object.entries(commonShadows)) {
      if (new RegExp(`\\b${className}\\b`).test(classes)) {
        shadowValues.set(value, (shadowValues.get(value) || 0) + 1);
      }
    }
  });

  // Sort by frequency
  const sortedShadows = Array.from(shadowValues.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([value]) => value);

  // Group similar shadows (avoid near-duplicates)
  const uniqueShadows: string[] = [];

  for (const shadow of sortedShadows) {
    // Simple similarity check - if shadows are very similar in structure, skip
    const isUnique = !uniqueShadows.some(existing => {
      // Check if they have similar offset values (very basic check)
      const existingParts = existing.split(/\s+/).slice(0, 2).join(' ');
      const shadowParts = shadow.split(/\s+/).slice(0, 2).join(' ');
      return existingParts === shadowParts && Math.abs(existing.length - shadow.length) < 10;
    });

    if (isUnique) {
      uniqueShadows.push(shadow);
    }

    if (uniqueShadows.length >= 5) break;
  }

  return uniqueShadows.length > 0 ? uniqueShadows : undefined;
}

/**
 * Extracts galleries from the page
 */
function extractGalleries($: CheerioAPI, baseUrl: string): ExtractedBusinessInfo['galleries'] {
  const galleries: ExtractedBusinessInfo['galleries'] = [];
  const MAX_GALLERIES = 5;
  const MAX_IMAGES_PER_GALLERY = 20;

  // Common gallery container selectors
  const gallerySelectors = [
    '.gallery',
    '.image-gallery',
    '.photo-gallery',
    '.portfolio',
    '.grid',
    '.masonry',
    '.carousel',
    '.slider',
    '.swiper',
    '[class*="gallery"]',
    '[class*="portfolio"]',
    '[class*="showcase"]',
    '.wp-block-gallery', // WordPress
    '.elementor-gallery', // Elementor
    '.slick-slider', // Slick carousel
    '.owl-carousel', // Owl carousel
    '[data-gallery]',
    '[role="gallery"]',
    '.images-container',
    '.photos',
    '.image-grid'
  ];

  // Helper function to detect gallery type
  function detectGalleryType($container: ReturnType<typeof $>): ExtractedBusinessInfo['galleries'][0]['type'] {
    const classes = $container.attr('class') || '';
    const containerHtml = $container.html() || '';

    // Check for carousel/slider
    if (classes.includes('carousel') ||
        classes.includes('slider') ||
        classes.includes('swiper') ||
        classes.includes('slick') ||
        classes.includes('owl') ||
        containerHtml.includes('carousel') ||
        $container.find('.carousel-item, .slide, .swiper-slide').length > 0) {
      return 'carousel';
    }

    // Check for masonry
    if (classes.includes('masonry') ||
        classes.includes('isotope') ||
        classes.includes('packery')) {
      return 'masonry';
    }

    // Check for grid
    if (classes.includes('grid') ||
        classes.includes('row') ||
        classes.includes('columns') ||
        $container.css('display') === 'grid' ||
        $container.css('display') === 'flex') {
      return 'grid';
    }

    return 'unknown';
  }

  // Helper function to calculate aspect ratio
  function calculateAspectRatio(width: number, height: number): string {
    if (!width || !height) return '';

    const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
    const divisor = gcd(width, height);
    const aspectWidth = width / divisor;
    const aspectHeight = height / divisor;

    // Common aspect ratios
    if (aspectWidth === 16 && aspectHeight === 9) return '16:9';
    if (aspectWidth === 4 && aspectHeight === 3) return '4:3';
    if (aspectWidth === 1 && aspectHeight === 1) return '1:1';
    if (aspectWidth === 3 && aspectHeight === 2) return '3:2';
    if (aspectWidth === 2 && aspectHeight === 3) return '2:3';

    return `${aspectWidth}:${aspectHeight}`;
  }

  // Helper function to determine columns for grid layouts
  function detectColumns($container: ReturnType<typeof $>): number | undefined {
    // Check CSS grid-template-columns
    const gridTemplateColumns = $container.css('grid-template-columns');
    if (gridTemplateColumns && gridTemplateColumns !== 'none') {
      const columns = gridTemplateColumns.split(/\s+/).filter(val => val !== 'auto').length;
      if (columns > 0) return columns;
    }

    // Check for Bootstrap/similar column classes
    const classMatch = ($container.attr('class') || '').match(/(?:col|columns?)-(\d+)/);
    if (classMatch) {
      return parseInt(classMatch[1]);
    }

    // Count images in first row (if they're in a row structure)
    const $rows = $container.find('.row, [class*="row"]').first();
    if ($rows.length) {
      const firstRowImages = $rows.children().find('img').length;
      if (firstRowImages > 0 && firstRowImages <= 6) {
        return firstRowImages;
      }
    }

    // Count direct image children if they appear to be in a grid
    const directImages = $container.children('img, figure, .gallery-item, [class*="gallery-item"]');
    if (directImages.length > 0 && directImages.length <= 6) {
      // Check if they're displayed inline or in a grid pattern
      const firstImage = directImages.first();
      const display = firstImage.css('display');
      if (display === 'inline-block' || display === 'inline' || $container.css('display') === 'grid') {
        return Math.min(directImages.length, 4); // Cap at 4 for first row
      }
    }

    // Default to 3 for grid layouts
    return 3;
  }

  // Helper function to extract gallery title
  function extractGalleryTitle($container: ReturnType<typeof $>): string | undefined {
    // Look for title immediately before the gallery
    const $prevElement = $container.prev('h1, h2, h3, h4, h5, h6, .title, .heading');
    if ($prevElement.length) {
      const title = $prevElement.text().trim();
      if (title && title.length < 200) {
        return title;
      }
    }

    // Look for title within the gallery container
    const titleSelectors = ['h2', 'h3', 'h4', '.gallery-title', '.title', '[class*="title"]'];
    for (const selector of titleSelectors) {
      const $title = $container.find(selector).first();
      if ($title.length) {
        const title = $title.text().trim();
        if (title && title.length < 200 && !title.includes('<img')) {
          return title;
        }
      }
    }

    // Check for aria-label or data attributes
    const ariaLabel = $container.attr('aria-label');
    if (ariaLabel && ariaLabel.length < 200) {
      return ariaLabel;
    }

    const dataTitle = $container.attr('data-title') || $container.attr('data-gallery-title');
    if (dataTitle && dataTitle.length < 200) {
      return dataTitle;
    }

    return undefined;
  }

  // Process each gallery selector
  for (const selector of gallerySelectors) {
    if (galleries.length >= MAX_GALLERIES) break;

    $(selector).each((_, element) => {
      if (galleries.length >= MAX_GALLERIES) return false; // Stop if we have enough galleries

      const $gallery = $(element);

      // Skip if this element is nested within an already processed gallery
      const isNested = galleries.some(g => {
        // This is a simplified check - in practice, you'd need to track processed elements
        return false;
      });
      if (isNested) return;

      // Find all images within the gallery
      const $images = $gallery.find('img');

      // Skip if no images or too few images
      if ($images.length < 2) return;

      const galleryType = detectGalleryType($gallery);
      const galleryTitle = extractGalleryTitle($gallery);
      const images: ExtractedBusinessInfo['galleries'][0]['images'] = [];

      $images.each((index, img) => {
        if (index >= MAX_IMAGES_PER_GALLERY) return false; // Stop after max images

        const $img = $(img);
        const src = $img.attr('src') || $img.attr('data-src') || $img.attr('data-lazy-src');

        if (!src) return;

        // Skip placeholder/loading images
        if (src.includes('placeholder') ||
            src.includes('loading') ||
            src.includes('spinner') ||
            src.includes('blank') ||
            src.includes('transparent') ||
            src.startsWith('data:image/gif;base64,R0lGOD')) {
          return;
        }

        // Resolve relative URLs to absolute
        let absoluteUrl: string;
        try {
          absoluteUrl = new URL(src, baseUrl).href;
        } catch {
          // If URL resolution fails, skip this image
          return;
        }

        // Extract image metadata
        const alt = $img.attr('alt')?.trim();
        const widthAttr = $img.attr('width');
        const heightAttr = $img.attr('height');

        // Parse dimensions
        let width: number | undefined;
        let height: number | undefined;

        if (widthAttr && !isNaN(parseInt(widthAttr))) {
          width = parseInt(widthAttr);
        }
        if (heightAttr && !isNaN(parseInt(heightAttr))) {
          height = parseInt(heightAttr);
        }

        // Try to get dimensions from style if not in attributes
        if (!width || !height) {
          const style = $img.attr('style') || '';
          const widthMatch = style.match(/width:\s*(\d+)px/);
          const heightMatch = style.match(/height:\s*(\d+)px/);

          if (widthMatch) width = parseInt(widthMatch[1]);
          if (heightMatch) height = parseInt(heightMatch[1]);
        }

        // Calculate aspect ratio if we have dimensions
        const aspectRatio = (width && height) ? calculateAspectRatio(width, height) : undefined;

        images.push({
          url: absoluteUrl,
          alt: alt || undefined,
          width: width || undefined,
          height: height || undefined,
          aspectRatio: aspectRatio || undefined
        });
      });

      // Only add gallery if it has valid images
      if (images.length >= 2) {
        const gallery: ExtractedBusinessInfo['galleries'][0] = {
          type: galleryType,
          images,
          title: galleryTitle
        };

        // Add columns for grid layouts
        if (galleryType === 'grid') {
          gallery.columns = detectColumns($gallery);
        }

        galleries.push(gallery);
      }
    });
  }

  // Also check for WordPress-style galleries with figure elements
  if (galleries.length < MAX_GALLERIES) {
    $('figure.gallery, .blocks-gallery, .wp-block-gallery').each((_, element) => {
      if (galleries.length >= MAX_GALLERIES) return false;

      const $gallery = $(element);
      const $figures = $gallery.find('figure');
      const images: ExtractedBusinessInfo['galleries'][0]['images'] = [];

      $figures.each((index, figure) => {
        if (index >= MAX_IMAGES_PER_GALLERY) return false;

        const $img = $(figure).find('img').first();
        if (!$img.length) return;

        const src = $img.attr('src') || $img.attr('data-src');
        if (!src || src.includes('placeholder')) return;

        try {
          const absoluteUrl = new URL(src, baseUrl).href;
          const alt = $img.attr('alt')?.trim();
          const caption = $(figure).find('figcaption').text().trim();

          images.push({
            url: absoluteUrl,
            alt: alt || caption || undefined
          });
        } catch {
          // Skip invalid URLs
        }
      });

      if (images.length >= 2) {
        galleries.push({
          type: 'grid',
          images,
          columns: detectColumns($gallery)
        });
      }
    });
  }

  return galleries.length > 0 ? galleries : undefined;
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

  // Extract design tokens
  const designTokens: ExtractedBusinessInfo['designTokens'] = {};

  const spacing = extractSpacingTokens($, html);
  if (spacing) {
    designTokens.spacing = spacing;
  }

  const borderRadius = extractBorderRadius($, html);
  if (borderRadius) {
    designTokens.borderRadius = borderRadius;
  }

  const shadows = extractShadows($, html);
  if (shadows) {
    designTokens.shadows = shadows;
  }

  return {
    emails: extractEmails($),
    phones: extractPhones($),
    addresses: extractAddresses($),
    socialLinks: extractSocialLinks($),
    logoUrl: extractLogo($, baseUrl),
    brandColors: extractBrandColorsImproved(html),
    fonts: extractFonts($, html),
    designTokens: Object.keys(designTokens).length > 0 ? designTokens : undefined,
    keyFeatures: extractKeyFeatures($),
    businessDescription: extractBusinessDescription($),
    heroSection: extractHeroSection($, baseUrl),
    galleries: extractGalleries($, baseUrl),
    siteTitle: $('title').text().trim() || undefined,
    siteDescription: $('meta[name="description"]').attr('content')?.trim() || undefined,
    favicon: $('link[rel*="icon"]').attr('href') || undefined,
    structuredContent: Object.keys(structuredContent).length > 0 ? structuredContent : undefined,
    pageContent: extractPageContent($)
  };
}
