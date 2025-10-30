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
1. HERO SECTION - The most prominent content (marked with [HERO SECTION - PROMINENT] or [MAIN HEADING - PROMINENT])
2. Site metadata (title, description, favicon)
3. Business description and tagline (use the hero content as primary source)
4. Key features or value propositions (from prominent sections near the top)
5. Image galleries (if present)
6. Main page content sections (prioritize top-of-page content)

CRITICAL RULES FOR CONTENT PRIORITIZATION:
1. **HERO SECTION IS MOST IMPORTANT** - Content marked [HERO SECTION - PROMINENT] should be used as the primary headline/subheadline
2. **H1 HEADINGS ARE PRIMARY** - Content marked [MAIN HEADING - PROMINENT] should be the main headline if no hero section exists
3. **TOP-OF-PAGE WINS** - Content appearing earlier in the document is more important than content later
4. **LARGE TEXT OVER SMALL** - Headings (# ## ###) are more important than paragraph text
5. **HOMEPAGE CONTENT ONLY** - Focus on homepage/landing page content, ignore footer/navigation boilerplate
6. Extract key features as concise bullet points (3-5 maximum, from most prominent sections)
7. For the hero section, use the LARGEST/MOST PROMINENT text as headline, supporting text as subheadline
8. Provide a confidence score (0-1) based on content clarity and completeness
9. Return valid JSON that matches the schema exactly

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
    "backgroundImage": "Hero background image URL or null"
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
  parts.push('PRIORITY 1: Hero Section');
  parts.push('- Look for content marked [HERO SECTION - PROMINENT] or [MAIN HEADING - PROMINENT]');
  parts.push('- The LARGEST heading should be the hero headline');
  parts.push('- Supporting text near the main heading should be the hero subheadline');
  parts.push('- Extract any prominent call-to-action button text and link');
  parts.push('');
  parts.push('PRIORITY 2: Site Identity');
  parts.push('- Site title and description from the top of the content');
  parts.push('- Business description (what they do) from hero or intro sections');
  parts.push('- Tagline (short memorable phrase) from prominent text');
  parts.push('');
  parts.push('PRIORITY 3: Key Features/Value Props');
  parts.push('- Extract 3-5 key features from prominent sections NEAR THE TOP of the page');
  parts.push('- Ignore footer, navigation, and content far down the page');
  parts.push('- Focus on what makes the business unique/valuable');
  parts.push('');
  parts.push('PRIORITY 4: Supporting Content');
  parts.push('- Galleries (if present and prominent)');
  parts.push('- Main content sections (only if clearly important to homepage)');
  parts.push('');

  parts.push('CRITICAL: Prioritize content based on visual hierarchy. Top-of-page, large headings, and hero sections are MOST important.');
  parts.push('IGNORE: Navigation menus, footers, sidebars, privacy links, copyright text, cookie notices.');
  parts.push('');

  parts.push('Return a JSON object with the extracted data following the schema in the system prompt.');

  return parts.join('\n');
}
