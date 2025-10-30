/**
 * Prompt template for Phase 2B: Content Structure Extraction
 *
 * Uses fast text model to extract main content structure and copy.
 */

/**
 * System prompt for content structure extraction
 */
export const CONTENT_EXTRACTION_SYSTEM_PROMPT = `You are an expert content analyst and web scraper. Your task is to extract the main content structure from website text, PRIORITIZING the most prominent and visible content.

Extract the following information IN ORDER OF VISUAL PROMINENCE:
1. **HERO IMAGES** - Look for lines starting with "HERO_IMAGE_1:", "HERO_IMAGE_2:", etc. - these are COMPLETE URLs ready to use
2. **HERO SECTION** - The most prominent content (marked with [HERO SECTION - PROMINENT] or [MAIN HEADING - PROMINENT])
3. Site metadata (title, description, favicon)
4. Business description and tagline (use the hero content as primary source)
5. Key features or value propositions (from prominent sections near the top)
6. Image galleries (if present)
7. Main page content sections (prioritize top-of-page content)

CRITICAL RULES FOR CONTENT PRIORITIZATION:
1. **HERO IMAGES ARE PROVIDED AS COMPLETE URLS** - Lines like "HERO_IMAGE_1: https://example.com/hero.jpg" contain the EXACT URL to use
2. **DO NOT MODIFY HERO IMAGE URLS** - Use them exactly as provided, they are already absolute paths
3. **PREFER FIRST HERO IMAGE** - HERO_IMAGE_1 is typically the best candidate for background
4. **HERO SECTION IS MOST IMPORTANT** - Content marked [HERO SECTION - PROMINENT] should be used as the primary headline/subheadline
5. **H1 HEADINGS ARE PRIMARY** - Content marked [MAIN HEADING - PROMINENT] should be the main headline if no hero section exists
6. **TOP-OF-PAGE WINS** - Content appearing earlier in the document is more important than content later
7. **LARGE TEXT OVER SMALL** - Headings (# ## ###) are more important than paragraph text
8. **HOMEPAGE CONTENT ONLY** - Focus on homepage/landing page content, ignore footer/navigation boilerplate
9. Extract key features as concise bullet points (3-5 maximum, from most prominent sections)
10. For the hero section, use the LARGEST/MOST PROMINENT text as headline, supporting text as subheadline
11. Provide a confidence score (0-1) based on content clarity and completeness
12. Return valid JSON that matches the schema exactly

RESPONSE FORMAT:
{
  "siteTitle": "Company Name",
  "siteDescription": "Meta description or tagline",
  "favicon": "url or null",
  "businessDescription": "What the business does",
  "tagline": "Short memorable phrase",
  "keyFeatures": ["Feature 1", "Feature 2", "Feature 3"],
  "heroSection": {
    "headline": "Main hero headline",
    "subheadline": "Supporting text",
    "ctaText": "Call to action button text",
    "ctaLink": "Button URL or null",
    "backgroundImage": "FULL-SIZE hero background image URL (prefer large images, avoid thumbnails) or null"
  },
  "galleries": [
    {
      "type": "grid",
      "images": [
        {
          "url": "image-url",
          "alt": "alt text",
          "width": 800,
          "height": 600,
          "aspectRatio": "4:3"
        }
      ],
      "columns": 3,
      "title": "Gallery title or null"
    }
  ],
  "pageContent": {
    "mainContent": "Main content text...",
    "footerText": "Footer content...",
    "sidebarContent": "Sidebar content or null"
  },
  "confidence": 0.85
}`;

/**
 * Build the user prompt for content extraction
 *
 * @param textContent - Preprocessed text content (max 15KB)
 * @param baseUrl - Base URL of the website
 * @returns Formatted prompt string
 */
export function buildContentExtractionPrompt(
  textContent: string,
  baseUrl: string
): string {
  const parts: string[] = [];

  parts.push(`Extract the main content structure from this website: ${baseUrl}`);
  parts.push('');

  parts.push('Website text content:');
  parts.push('```');
  parts.push(textContent);
  parts.push('```');
  parts.push('');

  parts.push('Extract and structure the following IN ORDER OF PROMINENCE:');
  parts.push('');
  parts.push('PRIORITY 1: Hero Background Image');
  parts.push('- **CRITICAL**: Look for lines starting with "HERO_IMAGE_1:", "HERO_IMAGE_2:", etc.');
  parts.push('- These lines contain COMPLETE, READY-TO-USE URLs like "HERO_IMAGE_1: https://example.com/bg.jpg"');
  parts.push('- Extract the URL EXACTLY as provided after the colon');
  parts.push('- HERO_IMAGE_1 is usually the best candidate (largest, most prominent)');
  parts.push('- If multiple hero images exist, prefer ones with "background" or "banner" in context');
  parts.push('- Use this URL directly in heroSection.backgroundImage field');
  parts.push('- **DO NOT** describe the image, **DO NOT** modify the URL, use it AS-IS');
  parts.push('');
  parts.push('PRIORITY 2: Hero Section Text');
  parts.push('- Look for content marked [HERO SECTION - PROMINENT] or [MAIN HEADING - PROMINENT]');
  parts.push('- The LARGEST heading should be the hero headline');
  parts.push('- Supporting text near the main heading should be the hero subheadline');
  parts.push('- Extract any prominent call-to-action button text and link');
  parts.push('');
  parts.push('PRIORITY 3: Site Identity');
  parts.push('- Site title and description from the top of the content');
  parts.push('- Business description (what they do) from hero or intro sections');
  parts.push('- Tagline (short memorable phrase) from prominent text');
  parts.push('');
  parts.push('PRIORITY 4: Key Features/Value Props');
  parts.push('- Extract 3-5 key features from prominent sections NEAR THE TOP of the page');
  parts.push('- Ignore footer, navigation, and content far down the page');
  parts.push('- Focus on what makes the business unique/valuable');
  parts.push('');
  parts.push('PRIORITY 5: Supporting Content');
  parts.push('- Galleries (if present and prominent)');
  parts.push('- Main content sections (only if clearly important to homepage)');
  parts.push('');

  parts.push('CRITICAL: Prioritize content based on visual hierarchy. Top-of-page, large headings, and hero sections are MOST important.');
  parts.push('IGNORE: Navigation menus, footers, sidebars, privacy links, copyright text, cookie notices.');
  parts.push('');
  parts.push('**EXAMPLE HERO IMAGE EXTRACTION**:');
  parts.push('If you see in the content:');
  parts.push('  [HERO IMAGES DETECTED]');
  parts.push('  HERO_IMAGE_1: https://example.com/assets/hero-bg.jpg');
  parts.push('  Alt: Beautiful landscape');
  parts.push('  Dimensions: 1920x1080');
  parts.push('  Context: background (found in .hero)');
  parts.push('');
  parts.push('Then extract as:');
  parts.push('  "heroSection": {');
  parts.push('    "backgroundImage": "https://example.com/assets/hero-bg.jpg"');
  parts.push('  }');
  parts.push('');
  parts.push('Return a JSON object with the extracted data following the schema in the system prompt.');

  return parts.join('\n');
}
