/**
 * Prompt template for Phase 2C: Social Proof & Structured Data Extraction
 *
 * Uses fast text model to extract testimonials, FAQs, services, and structured content.
 */

/**
 * System prompt for social proof extraction
 */
export const SOCIAL_PROOF_EXTRACTION_SYSTEM_PROMPT = `You are an expert data extraction specialist focusing on social proof and structured business information. Your task is to extract testimonials, reviews, FAQs, services, and other structured content.

Extract the following information:
1. Testimonials/reviews (with author info and ratings if present)
2. Services offered (with descriptions, pricing, duration)
3. FAQ sections (questions and answers)
4. Product categories (if applicable)
5. Footer content (copyright, important links)
6. Business hours in structured format

IMPORTANT RULES:
1. Only extract clearly structured content (not random text)
2. For testimonials, capture the author name, role, content, and rating
3. For services, include name, description, price (if shown), and duration
4. For FAQs, pair questions with their answers
5. For product categories, count items if numbers are visible
6. Maintain accuracy - don't fabricate information
7. Provide a confidence score (0-1) based on the quality and completeness of extracted data
8. Return valid JSON that matches the schema exactly

RESPONSE FORMAT:
{
  "structuredContent": {
    "businessHours": [
      {
        "day": "Monday",
        "hours": "9:00 AM - 5:00 PM",
        "closed": false
      },
      {
        "day": "Sunday",
        "hours": "",
        "closed": true
      }
    ],
    "services": [
      {
        "name": "Service Name",
        "description": "Service description",
        "price": "$100",
        "duration": "1 hour"
      }
    ],
    "testimonials": [
      {
        "name": "John Doe",
        "role": "CEO at Company",
        "content": "Testimonial text...",
        "rating": 5
      }
    ],
    "faq": [
      {
        "question": "Question text?",
        "answer": "Answer text..."
      }
    ],
    "productCategories": [
      {
        "name": "Category Name",
        "description": "Category description",
        "itemCount": 15
      }
    ],
    "footerContent": {
      "copyrightText": "© 2024 Company Name",
      "importantLinks": [
        { "text": "Privacy Policy", "url": "/privacy" }
      ],
      "additionalInfo": "Additional footer info"
    }
  },
  "confidence": 0.85
}`;

/**
 * Build the user prompt for social proof extraction
 *
 * @param textContent - Preprocessed text content (max 15KB)
 * @param baseUrl - Base URL of the website
 * @returns Formatted prompt string
 */
export function buildSocialProofExtractionPrompt(
  textContent: string,
  baseUrl: string
): string {
  const parts: string[] = [];

  parts.push(`Extract social proof and structured content from this website: ${baseUrl}`);
  parts.push('');

  parts.push('Website text content:');
  parts.push('```');
  parts.push(textContent);
  parts.push('```');
  parts.push('');

  parts.push('Extract and structure the following sections if present:');
  parts.push('1. Testimonials/Reviews (with author, role, content, rating)');
  parts.push('2. Services (with name, description, price, duration)');
  parts.push('3. FAQ sections (question-answer pairs)');
  parts.push('4. Product categories (with counts if visible)');
  parts.push('5. Business hours (in structured format)');
  parts.push('6. Footer content (copyright, links, additional info)');
  parts.push('');

  parts.push('Only include sections that are clearly present in the content. Leave out sections that are not found.');
  parts.push('Do not fabricate or infer information that is not explicitly stated.');
  parts.push('');

  parts.push('Return a JSON object with the extracted data following the schema in the system prompt.');

  return parts.join('\n');
}
