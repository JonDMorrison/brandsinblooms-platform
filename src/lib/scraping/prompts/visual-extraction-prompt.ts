/**
 * Prompt template for Phase 1: Visual Brand Analysis
 *
 * Uses vision-capable model to extract brand identity from homepage
 * screenshot and HTML structure.
 */

/**
 * System prompt for visual brand analysis
 */
export const VISUAL_EXTRACTION_SYSTEM_PROMPT = `You are an expert brand designer and visual analyst. Your task is to analyze a website's homepage and extract its visual brand identity using BOTH visual cues and HTML structure context.

You will receive:
1. A screenshot of the homepage (if available)
2. The simplified HTML structure showing key visual elements

Your goal is to identify:
- Primary brand colors (hex codes)
- Logo image URL (if present) - USE CONTEXT, not just keywords
- Font families used
- Design tokens (spacing, border-radius, shadows)
- Overall visual style and mood

LOGO DETECTION PHILOSOPHY:
You are skilled at identifying brand identity markers even when they lack obvious "logo" keywords. Use your understanding of:
- Website layout conventions (headers, footers, navigation patterns)
- Visual prominence and positioning (top of page, linked to homepage)
- Brand consistency (images that appear to represent the company)
- Common HTML patterns (even in non-semantic markup like <div class="footer-wrapper">)

IMPORTANT RULES:
1. Extract ONLY colors that appear to be intentional brand colors (not grays, blacks, whites unless they're clearly primary brand colors)
2. Look for colors in: headers, buttons, links, navigation, hero sections, CTAs
3. Return colors in uppercase hex format: #FF5733
4. For logos: Look EVERYWHERE - headers, footers, navigation. Don't rely solely on "logo" keywords.
5. Provide a confidence score (0-1) based on how clear the brand identity is
6. If you cannot identify clear brand colors, return an empty array but still provide a confidence score
7. Return valid JSON that matches the schema exactly

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
  parts.push('PRIORITY 2: Logo - COMPREHENSIVE SEARCH');
  parts.push('Search THOROUGHLY for logos in multiple locations and formats:');
  parts.push('');
  parts.push('LOCATION PRIORITY (check ALL locations, prefer earlier):');
  parts.push('  1. Header/Navigation area (most common)');
  parts.push('  2. Footer area (VERY common fallback - check thoroughly!)');
  parts.push('  3. Top of page before main content');
  parts.push('  4. Any other prominent brand identity location');
  parts.push('');
  parts.push('IDENTIFICATION STRATEGIES (use ALL):');
  parts.push('  A. Keyword-based:');
  parts.push('     - img tags with "logo", "brand", "identity" in class/id/alt/src/title');
  parts.push('     - Links with text like "home", "homepage" that contain images');
  parts.push('     - Elements with company/site name in alt text or aria-labels');
  parts.push('');
  parts.push('  B. Context-based (IMPORTANT for non-semantic HTML):');
  parts.push('     - Images in header/nav that appear to be brand marks');
  parts.push('     - Images in footer areas that match the site name or brand');
  parts.push('     - First significant image in header or footer regions');
  parts.push('     - Images with aspect ratios typical of logos (wide/horizontal)');
  parts.push('');
  parts.push('  C. Structural patterns:');
  parts.push('     - Linked images at top of navigation');
  parts.push('     - Images in elements with "footer-wrapper", "site-footer", "footer" class');
  parts.push('     - Brand images in copyright or contact sections');
  parts.push('');
  parts.push('FORMAT PREFERENCES:');
  parts.push('  - Prefer SVG or PNG logos over favicon');
  parts.push('  - Prefer larger images over tiny icons');
  parts.push('  - If multiple logos found, prefer header/nav over footer');
  parts.push('  - Return the COMPLETE absolute or relative URL');
  parts.push('');
  parts.push('EXAMPLE - Finding logos in non-semantic HTML:');
  parts.push('  <!-- Even without semantic <footer> tag, you can identify logos: -->');
  parts.push('  <div class="footer-wrapper">');
  parts.push('    <img src="../images/Arts_logo_white_footer.png" alt="Arts Nursery Logo">');
  parts.push('  </div>');
  parts.push('  ');
  parts.push('  This IS a logo because:');
  parts.push('  - In footer region (wrapper context)');
  parts.push('  - Alt text confirms it\'s a logo');
  parts.push('  - Filename contains "logo"');
  parts.push('  - Represents brand identity');
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
