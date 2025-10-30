/**
 * Prompt template for Phase 2A: Contact Information Extraction
 *
 * Uses fast text model to extract contact details from text content.
 */

/**
 * System prompt for contact information extraction
 */
export const CONTACT_EXTRACTION_SYSTEM_PROMPT = `You are an expert data extraction specialist. Your task is to extract contact information from website text content.

Extract the following information:
1. Email addresses (validated format)
2. Phone numbers (any format, but clean and standardize)
3. Physical addresses (complete addresses)
4. Business hours (if present)
5. Social media links (with platform identification)
6. Geographic coordinates (if explicitly stated)

IMPORTANT RULES:
1. Only extract information that is clearly visible in the content
2. Validate email formats before including
3. Standardize phone numbers to include country code if possible
4. For social media, identify the platform (facebook, instagram, twitter, linkedin, etc.)
5. For business hours, parse into structured format with open/close times
6. Provide a confidence score (0-1) based on how much valid contact info was found
7. Return valid JSON that matches the schema exactly

RESPONSE FORMAT:
{
  "emails": ["email1@example.com", "email2@example.com"],
  "phones": ["+1-555-123-4567", "+1-555-987-6543"],
  "addresses": ["123 Main St, City, State ZIP"],
  "hours": {
    "monday": { "open": "09:00", "close": "17:00", "closed": false },
    "tuesday": { "open": "09:00", "close": "17:00", "closed": false },
    ...
  },
  "socialLinks": [
    { "platform": "facebook", "url": "https://facebook.com/..." },
    { "platform": "instagram", "url": "https://instagram.com/..." }
  ],
  "coordinates": { "lat": 40.7128, "lng": -74.0060 },
  "confidence": 0.85
}`;

/**
 * Build the user prompt for contact extraction
 *
 * @param textContent - Preprocessed text content (max 15KB)
 * @param baseUrl - Base URL of the website
 * @returns Formatted prompt string
 */
export function buildContactExtractionPrompt(
  textContent: string,
  baseUrl: string
): string {
  const parts: string[] = [];

  parts.push(`Extract contact information from this website: ${baseUrl}`);
  parts.push('');

  parts.push('Website text content:');
  parts.push('```');
  parts.push(textContent);
  parts.push('```');
  parts.push('');

  parts.push('Extract and structure all contact information you can find:');
  parts.push('- Email addresses (check mailto links and visible text)');
  parts.push('- Phone numbers (normalize format with country code if possible)');
  parts.push('- Physical addresses (complete with city, state, zip)');
  parts.push('- Business hours (parse into structured format)');
  parts.push('- Social media links (identify platform from URL)');
  parts.push('- Coordinates (if explicitly mentioned)');
  parts.push('');

  parts.push('Return a JSON object with the extracted data following the schema in the system prompt.');

  return parts.join('\n');
}
