/**
 * HTML preprocessing utilities for LLM extraction
 *
 * Prepares HTML content for different extraction phases:
 * - Phase 1: Strips to structure for vision model
 * - Phase 2: Extracts text content for text model
 */

import { load } from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import { HTML_LIMITS } from '../llm-extractor-config';

/**
 * Preprocess HTML for image extraction (Phase 2D)
 *
 * Creates focused HTML that preserves structure and style attributes
 * for LLM to analyze and extract images. This is TRUE LLM-first extraction:
 * the LLM analyzes raw HTML structure, not pre-extracted URLs.
 *
 * Preserves:
 * - HTML structure (div, section, header tags)
 * - Style attributes with background-image and CSS variables
 * - Image tags with src, srcset, data-src attributes
 * - Class/ID attributes for context
 *
 * Removes:
 * - Scripts, noscript, iframes
 * - Large text content (keeps structure, removes verbose text)
 * - Non-visual elements
 *
 * @param html - Raw HTML content
 * @returns Focused HTML structure for image extraction (max 10KB)
 */
export function preprocessHtmlForImageExtraction(html: string): string {
  const $ = load(html);

  // Remove non-visual elements
  $('script, noscript, iframe, audio, canvas, nav, footer').remove();

  // Focus on image-rich areas - collect elements that likely contain images
  const imageRichElements: string[] = [];

  // Selectors for elements that commonly contain hero/banner images
  const heroSelectors = [
    'header', '[role="banner"]',
    '.hero', '[class*="hero"]', '[id*="hero"]',
    '.banner', '[class*="banner"]', '[id*="banner"]',
    '.jumbotron',
    'section:first-of-type',
    '[class*="landing"]',
    '[class*="intro"]',
    '.w-block-banner', '.w-image-block',  // Squarespace
    '[data-block-purpose*="banner"]',      // Squarespace
    '[class*="HeroBanner"]',               // Wix
  ];

  // Collect hero sections
  heroSelectors.forEach(selector => {
    $(selector).each((_, el) => {
      const $el = $(el);
      const style = $el.attr('style') || '';
      const hasBackground = style.includes('background') || style.includes('--bg');
      const hasImages = $el.find('img, picture').length > 0;

      if (hasBackground || hasImages) {
        // Clean element: keep structure but minimize text
        $el.find('*').each((_, child) => {
          $(child).contents().filter((_, node) => node.type === 'text').each((_, textNode) => {
            const text = $(textNode).text().trim();
            if (text.length > 30) {
              $(textNode).replaceWith('[text]');
            }
          });
        });

        imageRichElements.push($el.toString());
      }
    });
  });

  // Collect standalone images and galleries
  $('img, picture, figure, [class*="gallery"]').each((_, el) => {
    const $el = $(el);
    const parent = $el.parent();

    // Only add if not already captured in hero sections
    const alreadyCaptured = imageRichElements.some(html =>
      html.includes($el.attr('src') || '') ||
      html.includes($el.attr('class') || '')
    );

    if (!alreadyCaptured) {
      imageRichElements.push(parent.toString().substring(0, 500));
    }
  });

  // Build final HTML
  let result = imageRichElements.join('\n');

  // Add any relevant global styles (background-related CSS)
  $('style').each((_, style) => {
    const css = $(style).text();
    if (css.includes('background') || css.includes('--bg')) {
      result = `<style>${css.substring(0, 1000)}</style>\n${result}`;
    }
  });

  // Size limit enforcement (10KB - optimized for faster processing)
  if (result.length > HTML_LIMITS.IMAGE_HTML_MAX_SIZE) {
    result = result.substring(0, HTML_LIMITS.IMAGE_HTML_MAX_SIZE);
  }

  return result;
}

/**
 * Preprocess HTML for vision model analysis
 *
 * Strips HTML down to structural elements while preserving:
 * - Semantic structure (header, nav, main, section, footer)
 * - Style attributes and inline styles (for colors, fonts)
 * - Class names (for identifying key elements)
 * - Image src and alt attributes
 * - Link elements for fonts
 *
 * @param html - Raw HTML content
 * @returns Simplified HTML structure (max 10KB)
 */
export function preprocessHtmlForVision(html: string): string {
  const $ = load(html);

  // Remove elements that don't contribute to visual analysis
  $('script, noscript, iframe, video, audio, canvas').remove();

  // Remove all text content but keep structure
  $('*').each((_, element) => {
    const $el = $(element);

    // Keep text only in style tags and certain attributes
    if (element.type === 'tag' && element.name !== 'style') {
      // Remove text nodes but keep the element structure
      $el.contents().filter((_, node) => node.type === 'text').remove();
    }
  });

  // Keep only relevant attributes
  $('*').each((_, element) => {
    const $el = $(element);

    // Type guard to check if element has attribs
    if (element.type === 'tag' && 'attribs' in element) {
      const attributes = element.attribs;

      // List of attributes to keep
      const keepAttributes = ['class', 'id', 'style', 'src', 'alt', 'href', 'rel', 'type'];

      // Remove all other attributes
      Object.keys(attributes).forEach(attr => {
        if (!keepAttributes.includes(attr)) {
          $el.removeAttr(attr);
        }
      });
    }
  });

  // Extract the processed HTML
  let processedHtml = $.html();

  // If still too large, further reduce by keeping only key sections
  if (processedHtml.length > HTML_LIMITS.VISUAL_HTML_MAX_SIZE) {
    processedHtml = extractKeyStructure($);
  }

  // Truncate if still too large
  if (processedHtml.length > HTML_LIMITS.VISUAL_HTML_MAX_SIZE) {
    processedHtml = processedHtml.substring(0, HTML_LIMITS.VISUAL_HTML_MAX_SIZE);
  }

  return processedHtml;
}

/**
 * Extract key structural elements when HTML is too large
 * Prioritizes sections critical for logo detection (header, nav, footer)
 */
function extractKeyStructure($: CheerioAPI): string {
  const parts: string[] = [];
  const maxSize = HTML_LIMITS.VISUAL_HTML_MAX_SIZE;

  // Extract head styles and links (compact)
  const styleContent = $('head style').text();
  if (styleContent) {
    parts.push(`<style>${styleContent.substring(0, 1000)}</style>`);
  }

  const fontLinks = $('head link[rel="stylesheet"], head link[href*="font"]').slice(0, 3);
  fontLinks.each((_, el) => {
    parts.push($(el).toString());
  });

  // PRIORITY 1: Header/Nav (critical for logo detection)
  const criticalSelectors = [
    'header',
    'nav',
    '[role="banner"]',
    '[role="navigation"]',
    '.header',
    '.navbar'
  ];

  criticalSelectors.forEach(selector => {
    const element = $(selector).first();
    if (element.length) {
      const html = element.toString();
      // Limit each section to 2KB to leave room for footer
      parts.push(html.length > 2048 ? html.substring(0, 2048) + '...' : html);
    }
  });

  // PRIORITY 2: Footer (critical for logo detection - often has logos)
  const footer = $('footer').first();
  if (footer.length) {
    const html = footer.toString();
    // Limit footer to 3KB
    parts.push(html.length > 3072 ? html.substring(0, 3072) + '...' : html);
  }

  // PRIORITY 3: Main content sections (if space allows)
  const currentSize = parts.join('\n').length;
  if (currentSize < maxSize * 0.7) { // Only if we have 30% space left
    const secondarySelectors = [
      'main',
      '[role="main"]',
      '.hero',
      '.banner'
    ];

    secondarySelectors.forEach(selector => {
      const element = $(selector).first();
      if (element.length && parts.join('\n').length < maxSize * 0.9) {
        const html = element.toString();
        // Limit each section to 1KB
        parts.push(html.length > 1024 ? html.substring(0, 1024) + '...' : html);
      }
    });
  }

  return parts.join('\n');
}

/**
 * Preprocess HTML for text model analysis
 *
 * Extracts clean text content while preserving:
 * - Semantic structure hints
 * - Link text and URLs
 * - Hero image URLs (CRITICAL for background extraction)
 * - Image alt text
 * - Heading hierarchy
 * - List structures
 *
 * @param html - Raw HTML content
 * @param baseUrl - Base URL for resolving relative image paths (REQUIRED for hero images)
 * @returns Clean text content (max 15KB)
 */
export function preprocessHtmlForText(html: string, baseUrl?: string): string {
  const $ = load(html);

  // Remove elements that don't contribute to content
  $('script, style, noscript, iframe, video, audio, canvas, svg, nav, header.site-header, .cookie-banner, .advertisement').remove();

  const parts: string[] = [];

  // Extract title
  const title = $('title').text().trim();
  if (title) {
    parts.push(`TITLE: ${title}`);
  }

  // Extract meta description
  const description = $('meta[name="description"]').attr('content');
  if (description) {
    parts.push(`DESCRIPTION: ${description}`);
  }

  // NOTE: Image extraction is now handled by Phase 2D with preprocessHtmlForImageExtraction()
  // This function focuses on text content only

  // Extract main content with structure hints
  const contentSelectors = [
    'main',
    '[role="main"]',
    'article',
    '.content',
    '#content',
    '.main-content',
    'body'
  ];

  let mainContent = '';
  for (const selector of contentSelectors) {
    const element = $(selector).first();
    if (element.length && element.text().length > 100) {
      mainContent = extractStructuredText(element, $, baseUrl);
      break;
    }
  }

  if (mainContent) {
    parts.push('\nMAIN CONTENT:');
    parts.push(mainContent);
  }

  // Extract footer
  const footer = $('footer').first();
  if (footer.length) {
    parts.push('\nFOOTER:');
    parts.push(cleanText(footer.text()));
  }

  // Join and limit size
  let result = parts.join('\n\n');

  // Truncate if too large
  if (result.length > HTML_LIMITS.TEXT_HTML_MAX_SIZE) {
    result = result.substring(0, HTML_LIMITS.TEXT_HTML_MAX_SIZE);
  }

  return result;
}

/**
 * Extract hero images from HTML with full URLs
 * Returns array of hero image candidates with metadata
 */
interface HeroImageCandidate {
  url: string;
  context: string;  // 'background' | 'img' | 'picture'
  selector: string;  // CSS selector that found it
  alt?: string;
  width?: number;
  height?: number;
}

function extractHeroImages(element: ReturnType<CheerioAPI>, $: CheerioAPI, baseUrl?: string): HeroImageCandidate[] {
  const images: HeroImageCandidate[] = [];
  console.log('[IMAGE EXTRACTION] Starting hero image extraction...');

  const heroSelectors = [
    '.hero', '[class*="hero"]', '[id*="hero"]',
    '.banner', '[class*="banner"]',
    '.jumbotron',
    'section:first-of-type',
    '[class*="landing"]',
    '[class*="intro"]',
    '[class*="header-image"]',
    '[class*="background"]',
    // Modern website builders (Squarespace, Wix, Weebly, etc.)
    '.w-block-banner',           // Squarespace
    '.w-image-block',            // Squarespace
    '[data-block-purpose*="banner"]',  // Squarespace
    '.banner-block-wrapper',     // Squarespace
    '.Header__hero',             // Squarespace
    '[class*="HeroBanner"]',     // Wix
    '[class*="hero-image"]',     // Common pattern
  ];

  heroSelectors.forEach(selector => {
    element.find(selector).first().each((_, hero) => {
      const $hero = $(hero);

      // Check for background images in inline style
      const style = $hero.attr('style');
      if (style) {
        // Check for traditional background-image
        const bgMatch = style.match(/background(?:-image)?:\s*url\(['"]?([^'")]+)['"]?\)/i);
        if (bgMatch && bgMatch[1]) {
          let url = bgMatch[1];
          // Resolve relative URLs
          if (baseUrl && !url.startsWith('http')) {
            url = resolveUrl(url, baseUrl);
          }
          images.push({
            url,
            context: 'background',
            selector,
            alt: 'Hero background image',
          });
        }

        // Check for CSS custom properties (CSS variables) with URLs
        // Modern website builders (Squarespace, Wix, etc.) often use CSS variables for responsive images
        // Example: --bg-img-src: url("..."), --bg-img-src-2400w: url("...")
        const cssVarRegex = /--[\w-]+:\s*url\(['"]?([^'")]+)['"]?\)/gi;
        const cssVarMatches = Array.from(style.matchAll(cssVarRegex));
        const cssVarImages = new Map<string, string>(); // Track unique URLs to avoid duplicates

        cssVarMatches.forEach(match => {
          const varName = match[0].split(':')[0];
          let url = match[1];

          // Resolve relative URLs
          if (baseUrl && !url.startsWith('http')) {
            url = resolveUrl(url, baseUrl);
          }

          // Avoid duplicate URLs from responsive variants
          if (!cssVarImages.has(url)) {
            cssVarImages.set(url, varName);
          }
        });

        // Add unique CSS variable images
        // Prefer the base --bg-img-src over responsive variants if available
        Array.from(cssVarImages.entries()).forEach(([url, varName]) => {
          images.push({
            url,
            context: 'background',
            selector: `${selector} [CSS var: ${varName}]`,
            alt: 'Hero background image (CSS variable)',
          });
        });
      }

      // Check for <img> tags in hero section
      $hero.find('img').each((_, img) => {
        const $img = $(img);
        let src = $img.attr('src') || $img.attr('data-src');  // Handle lazy loading
        if (src) {
          // Resolve relative URLs
          if (baseUrl && !src.startsWith('http') && !src.startsWith('data:')) {
            src = resolveUrl(src, baseUrl);
          }
          const alt = $img.attr('alt');
          const width = $img.attr('width') ? parseInt($img.attr('width')!) : undefined;
          const height = $img.attr('height') ? parseInt($img.attr('height')!) : undefined;

          // Skip tiny images (likely icons/logos)
          if (width && height && (width < 200 || height < 200)) {
            console.log(`[IMAGE EXTRACTION] Skipped small image (${width}x${height}): ${src.substring(0, 60)}...`);
            return;
          }

          images.push({
            url: src,
            context: 'img',
            selector: `${selector} img`,
            alt,
            width,
            height,
          });
        }
      });

      // Check for <picture> elements
      $hero.find('picture source, picture img').each((_, source) => {
        const $source = $(source);
        let srcset = $source.attr('srcset') || $source.attr('src');
        if (srcset) {
          // Parse srcset to get largest image
          const urls = srcset.split(',').map(s => s.trim().split(/\s+/)[0]);
          let url = urls[urls.length - 1];  // Last is typically largest
          if (baseUrl && !url.startsWith('http') && !url.startsWith('data:')) {
            url = resolveUrl(url, baseUrl);
          }
          images.push({
            url,
            context: 'picture',
            selector: `${selector} picture`,
            alt: $source.attr('alt'),
          });
        }
      });
    });
  });

  // Log results
  if (images.length > 0) {
    console.log(`[IMAGE EXTRACTION] ✅ Found ${images.length} hero image(s):`);
    images.forEach((img, idx) => {
      console.log(`  ${idx + 1}. ${img.url.substring(0, 80)}${img.url.length > 80 ? '...' : ''}`);
      console.log(`     Context: ${img.context} | Selector: ${img.selector}`);
      if (img.width && img.height) {
        console.log(`     Dimensions: ${img.width}x${img.height}`);
      }
    });
  } else {
    console.log('[IMAGE EXTRACTION] ⚠️  No hero images found in HTML');
    console.log('[IMAGE EXTRACTION] Checked selectors:', heroSelectors.join(', '));
    if (process.env.NODE_ENV === 'development') {
      console.log('[IMAGE EXTRACTION] 💡 TIP: Check saved HTML in .tmp/scrapes/ for manual inspection');
    }
  }

  return images;
}

/**
 * Resolve relative URLs to absolute
 */
function resolveUrl(url: string, baseUrl: string): string {
  try {
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    if (url.startsWith('/')) {
      const base = new URL(baseUrl);
      return `${base.origin}${url}`;
    }
    if (url.startsWith('http')) {
      return url;
    }
    // Relative path
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}

/**
 * Extract text with structural context
 * Prioritizes prominent content (hero sections, large headings, top-of-page content)
 */
function extractStructuredText(element: ReturnType<CheerioAPI>, $: CheerioAPI, baseUrl?: string): string {
  const parts: string[] = [];

  // First, extract hero/prominent sections with special markers
  const heroSelectors = [
    '.hero', '[class*="hero"]', '[id*="hero"]',
    '.banner', '[class*="banner"]',
    '.jumbotron',
    'section:first-of-type',
    '[class*="landing"]',
    '[class*="intro"]'
  ];

  // NOTE: Hero images are now extracted at the top level in preprocessHtmlForText()
  // from the entire document, not just the main content area.
  // This ensures we catch hero images in header elements.

  heroSelectors.forEach(selector => {
    element.find(selector).first().each((_, hero) => {
      const $hero = $(hero);
      const heroText = cleanText($hero.text());
      if (heroText && heroText.length > 30) {
        parts.push(`[HERO SECTION - PROMINENT]\n${heroText}\n`);
      }
    });
  });

  // Process child elements recursively
  element.children().each((_, child) => {
    const $child = $(child);
    const tagName = child.type === 'tag' ? child.name : '';

    // Headings - mark h1 as most prominent
    if (tagName.match(/^h[1-6]$/)) {
      const level = tagName[1];
      const text = cleanText($child.text());
      if (text) {
        const prefix = level === '1' ? '[MAIN HEADING - PROMINENT] ' : '';
        parts.push(`${prefix}${'#'.repeat(Number(level))} ${text}`);
      }
    }
    // Lists
    else if (tagName === 'ul' || tagName === 'ol') {
      $child.find('li').each((_, li) => {
        const text = cleanText($(li).text());
        if (text) {
          parts.push(`- ${text}`);
        }
      });
    }
    // Links
    else if (tagName === 'a') {
      const text = cleanText($child.text());
      const href = $child.attr('href');
      if (text && href) {
        parts.push(`[${text}](${href})`);
      }
    }
    // Paragraphs and divs
    else if (tagName === 'p' || tagName === 'div' || tagName === 'section') {
      const text = cleanText($child.text());
      if (text && text.length > 20) {
        parts.push(text);
      } else if ($child.children().length > 0) {
        // Recurse into children
        const childText = extractStructuredText($child, $);
        if (childText) {
          parts.push(childText);
        }
      }
    }
    // Images
    else if (tagName === 'img') {
      const alt = $child.attr('alt');
      const src = $child.attr('src');
      if (alt || src) {
        parts.push(`[Image: ${alt || 'no alt'} - ${src || 'no src'}]`);
      }
    }
  });

  return parts.join('\n');
}

/**
 * Clean and normalize text
 */
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
}

/**
 * Extract favicon URL from HTML
 */
export function extractFavicon(html: string, baseUrl: string): string | undefined {
  const $ = load(html);

  // Check various favicon link types
  const faviconSelectors = [
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="apple-touch-icon"]',
  ];

  for (const selector of faviconSelectors) {
    const href = $(selector).attr('href');
    if (href) {
      // Convert relative URLs to absolute
      if (href.startsWith('http')) {
        return href;
      } else if (href.startsWith('//')) {
        return `https:${href}`;
      } else if (href.startsWith('/')) {
        const url = new URL(baseUrl);
        return `${url.origin}${href}`;
      } else {
        return `${baseUrl}/${href}`;
      }
    }
  }

  // Default favicon location
  const url = new URL(baseUrl);
  return `${url.origin}/favicon.ico`;
}
