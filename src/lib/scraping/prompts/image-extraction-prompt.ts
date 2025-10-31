/**
 * Prompt template for Phase 2D: Image Extraction
 *
 * Uses fast text model to extract all images from HTML content.
 * Handles modern website builders (Squarespace, Wix, WordPress) that use
 * CSS variables, background-image properties, and various image tags.
 */

/**
 * System prompt for image extraction
 */
export const IMAGE_EXTRACTION_SYSTEM_PROMPT = `You are an expert web developer specializing in analyzing HTML to extract images. Your task is to identify and extract ALL images from the HTML, with special focus on hero/banner images that are critical for website recreation.

Extract images in this priority order:
1. **Hero/Banner Background Images** (HIGHEST PRIORITY)
   - Large prominent images at the top of the page
   - Background images in hero sections
   - Banner images
2. **Gallery Images** - Collections of images
3. **Product Images** - E-commerce product photos
4. **Feature Images** - Images highlighting features/services
5. **Team Photos** - Staff/team member photos
6. **Other Images** - Any other significant images

EXTRACTION TECHNIQUES - Look for images in ALL these forms:

**CSS Backgrounds:**
- background-image: url(...) properties
- CSS custom properties: --bg-img-src: url(...), --background-image: url(...)
- All responsive variants: --bg-img-src-400w, --bg-img-src-2400w, etc.

**HTML Image Tags:**
- <img src="..." /> tags
- <img data-src="..." /> (lazy loading)
- <picture> elements with source sets
- srcset attributes (responsive images)

**Modern Website Builders:**
- Squarespace: CSS variables like --bg-img-src in style attributes
- Wix: data-image attributes and dynamic backgrounds
- WordPress: wp-content paths in various formats
- Shopify: cdn.shopify.com URLs
- Weebly, Webflow, etc.

IMPORTANT RULES:
1. Extract FULL absolute URLs only (skip data URIs, relative paths without base URL)
2. For each image, determine its type/purpose from context
3. Include the element/selector where image was found
4. Extract responsive variants when available (prefer largest size)
5. Skip tiny images likely to be icons/logos (< 200px on either dimension if dimensions are available)
6. Provide confidence score based on how certain you are about the extraction
7. Return ONLY valid JSON matching the schema exactly

RESPONSE FORMAT:
{
  "images": [
    {
      "url": "https://example.com/hero-image.jpg",
      "type": "hero",
      "context": "css-variable",
      "selector": "div.banner-block-wrapper",
      "alt": "Hero background image",
      "dimensions": { "width": 2400, "height": 800 },
      "confidence": 0.95
    }
  ],
  "confidence": 0.9
}`;

/**
 * Build the user prompt for image extraction
 *
 * @param htmlContent - Raw or preprocessed HTML content
 * @param baseUrl - Base URL of the website for resolving relative URLs
 * @returns Formatted prompt string
 */
export function buildImageExtractionPrompt(
  htmlContent: string,
  baseUrl: string
): string {
  const parts: string[] = [];

  parts.push(`Extract ALL images from: ${baseUrl}`);
  parts.push('');
  parts.push('HTML CONTENT:');
  parts.push('```html');
  parts.push(htmlContent);
  parts.push('```');
  parts.push('');
  parts.push('Follow the extraction techniques from the system prompt.');
  parts.push('**PRIORITY**: Hero/banner background images are CRITICAL - check style attributes and CSS variables (--bg-img-src, --background-image).');
  parts.push('Return JSON matching the schema with all found images sorted by importance.');

  return parts.join('\n');
}
