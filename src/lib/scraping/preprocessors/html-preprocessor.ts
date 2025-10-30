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
 */
function extractKeyStructure($: CheerioAPI): string {
  const parts: string[] = [];

  // Extract head styles and links
  const styleContent = $('head style').text();
  if (styleContent) {
    parts.push(`<style>${styleContent.substring(0, 2000)}</style>`);
  }

  const fontLinks = $('head link[rel="stylesheet"], head link[href*="font"]');
  fontLinks.each((_, el) => {
    parts.push($(el).toString());
  });

  // Extract key body sections
  const keySelectors = [
    'header',
    'nav',
    '[role="banner"]',
    '[role="navigation"]',
    '.header',
    '.navbar',
    'main',
    '[role="main"]',
    '.hero',
    '.banner',
    'footer'
  ];

  keySelectors.forEach(selector => {
    const element = $(selector).first();
    if (element.length) {
      parts.push(element.toString());
    }
  });

  return parts.join('\n');
}

/**
 * Preprocess HTML for text model analysis
 *
 * Extracts clean text content while preserving:
 * - Semantic structure hints
 * - Link text and URLs
 * - Image alt text
 * - Heading hierarchy
 * - List structures
 *
 * @param html - Raw HTML content
 * @returns Clean text content (max 15KB)
 */
export function preprocessHtmlForText(html: string): string {
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
      mainContent = extractStructuredText(element, $);
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
 * Extract text with structural context
 */
function extractStructuredText(element: ReturnType<CheerioAPI>, $: CheerioAPI): string {
  const parts: string[] = [];

  // Process child elements recursively
  element.children().each((_, child) => {
    const $child = $(child);
    const tagName = child.type === 'tag' ? child.name : '';

    // Headings
    if (tagName.match(/^h[1-6]$/)) {
      const level = tagName[1];
      const text = cleanText($child.text());
      if (text) {
        parts.push(`${'#'.repeat(Number(level))} ${text}`);
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
