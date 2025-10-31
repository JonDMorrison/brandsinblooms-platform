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
  "typography": {
    "heading": {
      "fontFamily": "Font Name",
      "fontWeight": "700 or bold or 600",
      "textColor": "#HEX",
      "fontSize": "2rem or 32px"
    },
    "body": {
      "fontFamily": "Font Name",
      "fontWeight": "400 or normal",
      "textColor": "#HEX",
      "fontSize": "1rem or 16px",
      "lineHeight": "1.5 or 24px"
    },
    "accent": {
      "fontFamily": "Font Name (can be same as heading)",
      "fontWeight": "500 or medium or 600",
      "textColor": "#HEX (often a brand color)"
    }
  },
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
  parts.push('- Look for img tags with "logo" in class/id/alt/src in these locations (in order):');
  parts.push('  1. Header/navigation area (highest priority)');
  parts.push('  2. Footer area (common fallback location)');
  parts.push('  3. Any other prominent location');
  parts.push('- Prefer SVG or PNG logos over favicon');
  parts.push('- If multiple logos found, prefer the one from header/nav over footer');
  parts.push('- Return the full URL to the logo image');
  parts.push('');
  parts.push('PRIORITY 3: Typography from Prominent Text');
  parts.push('Extract detailed typography for THREE text categories:');
  parts.push('');
  parts.push('3A. HEADING typography (h1, h2, large titles):');
  parts.push('  - Font family name');
  parts.push('  - Font weight (e.g., "700", "bold", "600")');
  parts.push('  - Text color in hex format');
  parts.push('  - Font size (e.g., "2rem", "32px", "2.5rem")');
  parts.push('');
  parts.push('3B. BODY typography (paragraphs, main text):');
  parts.push('  - Font family name (may differ from heading)');
  parts.push('  - Font weight (typically "400" or "normal")');
  parts.push('  - Text color in hex format (usually darker/neutral)');
  parts.push('  - Font size (e.g., "1rem", "16px")');
  parts.push('  - Line height (e.g., "1.5", "24px")');
  parts.push('');
  parts.push('3C. ACCENT typography (buttons, links, emphasis):');
  parts.push('  - Font family name (often matches heading)');
  parts.push('  - Font weight (e.g., "500", "600", "medium")');
  parts.push('  - Text color (often uses brand color)');
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
