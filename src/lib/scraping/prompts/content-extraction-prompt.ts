/**
 * Prompt template for Phase 2B: Content Structure Extraction
 *
 * Uses fast text model to extract main content structure and copy.
 */

/**
 * System prompt for content structure extraction
 */
export const CONTENT_EXTRACTION_SYSTEM_PROMPT = `You are an expert content analyst and web scraper. Your task is to extract the main content structure from website text.

Extract the following information:
1. Site metadata (title, description, favicon)
2. Business description and tagline
3. Key features or value propositions
4. Hero section content
5. Image galleries (if present)
6. Main page content sections

IMPORTANT RULES:
1. Extract the most prominent and important content first
2. Identify the hero section (usually the first major content area)
3. Extract key features as concise bullet points
4. For galleries, identify the type (grid, carousel, masonry) and image details
5. Preserve the hierarchy and structure of content
6. Provide a confidence score (0-1) based on content clarity and completeness
7. Return valid JSON that matches the schema exactly

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

  parts.push('Extract and structure the following:');
  parts.push('1. Site metadata (title, description)');
  parts.push('2. Hero section (headline, subheadline, CTA)');
  parts.push('3. Business description and tagline');
  parts.push('4. Key features or value propositions (3-5 items)');
  parts.push('5. Gallery information (if image sections are present)');
  parts.push('6. Main content sections');
  parts.push('');

  parts.push('Focus on the most prominent and important content. Ignore navigation, footers, and boilerplate text.');
  parts.push('');

  parts.push('Return a JSON object with the extracted data following the schema in the system prompt.');

  return parts.join('\n');
}
