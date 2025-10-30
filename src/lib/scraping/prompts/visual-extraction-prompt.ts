/**
 * Prompt template for Phase 1: Visual Brand Analysis
 *
 * Uses vision-capable model to extract brand identity from homepage
 * screenshot and HTML structure.
 */

/**
 * System prompt for visual brand analysis
 */
export const VISUAL_EXTRACTION_SYSTEM_PROMPT = `You are an expert brand designer and visual analyst. Your task is to analyze a website's homepage and extract its visual brand identity.

You will receive:
1. A screenshot of the homepage (if available)
2. The simplified HTML structure showing key visual elements

Your goal is to identify:
- Primary brand colors (hex codes)
- Logo image URL (if present)
- Font families used
- Design tokens (spacing, border-radius, shadows)
- Overall visual style and mood

IMPORTANT RULES:
1. Extract ONLY colors that appear to be intentional brand colors (not grays, blacks, whites unless they're clearly primary brand colors)
2. Look for colors in: headers, buttons, links, navigation, hero sections, CTAs
3. Return colors in uppercase hex format: #FF5733
4. Provide a confidence score (0-1) based on how clear the brand identity is
5. If you cannot identify clear brand colors, return an empty array but still provide a confidence score
6. Return valid JSON that matches the schema exactly

RESPONSE FORMAT:
Return a JSON object with this exact structure:
{
  "brandColors": ["#COLOR1", "#COLOR2", ...],
  "logoUrl": "url or null",
  "fonts": ["Font Family 1", "Font Family 2", ...],
  "designTokens": {
    "spacing": {
      "values": ["0.5rem", "1rem", ...],
      "unit": "rem"
    },
    "borderRadius": {
      "values": ["4px", "8px", ...]
    },
    "shadows": ["0 2px 4px rgba(0,0,0,0.1)", ...]
  },
  "visualStyle": {
    "theme": "modern|classic|minimal|bold|elegant",
    "mood": "professional, friendly, etc."
  },
  "confidence": 0.85
}`;

/**
 * Build the user prompt for visual brand analysis
 *
 * @param html - Preprocessed HTML structure (max 10KB)
 * @param baseUrl - Base URL of the website
 * @param screenshot - Optional base64-encoded screenshot
 * @returns Formatted prompt string
 */
export function buildVisualExtractionPrompt(
  html: string,
  baseUrl: string,
  screenshot?: string
): string {
  const parts: string[] = [];

  parts.push(`Analyze the brand identity of this website: ${baseUrl}`);
  parts.push('');

  if (screenshot) {
    parts.push('A screenshot of the homepage has been provided. Use it to identify:');
    parts.push('- Color palette from visible UI elements');
    parts.push('- Logo placement and styling');
    parts.push('- Typography choices');
    parts.push('- Overall visual design patterns');
    parts.push('');
  }

  parts.push('Here is the simplified HTML structure:');
  parts.push('```html');
  parts.push(html);
  parts.push('```');
  parts.push('');

  parts.push('Focus on extracting IN ORDER OF VISUAL PROMINENCE:');
  parts.push('');
  parts.push('PRIORITY 1: Brand Colors from Most Visible Elements');
  parts.push('- Colors from HERO section backgrounds, buttons, and CTAs (highest priority)');
  parts.push('- Colors from LARGE headings and prominent text');
  parts.push('- Logo colors (if logo is present)');
  parts.push('- Header/navigation background and accent colors');
  parts.push('- Return 2-4 PRIMARY brand colors in hex format (#RRGGBB)');
  parts.push('- IGNORE: body text colors, subtle grays, pure white/black unless clearly brand colors');
  parts.push('');
  parts.push('PRIORITY 2: Logo');
  parts.push('- Look for img tags in header/nav with "logo" in class/id/alt/src');
  parts.push('- Prefer SVG or PNG logos over favicon');
  parts.push('- Return the full URL to the logo image');
  parts.push('');
  parts.push('PRIORITY 3: Typography from Prominent Text');
  parts.push('- Font families used in LARGE HEADINGS (h1, h2)');
  parts.push('- Font families used in hero section');
  parts.push('- Body text font (secondary priority)');
  parts.push('');
  parts.push('PRIORITY 4: Design Patterns');
  parts.push('- Spacing, border-radius, shadows from prominent UI elements');
  parts.push('- Focus on buttons, cards, and hero sections');
  parts.push('');

  parts.push('CRITICAL: Extract colors and styles from the MOST VISIBLE and PROMINENT elements first. Hero sections and large CTAs reveal the true brand identity.');
  parts.push('');

  parts.push('Provide your analysis as a JSON object following the schema in the system prompt.');

  return parts.join('\n');
}
