# Structured Content Extraction Implementation

## Summary
Implemented structured extraction functions to better preserve authentic content from scraped websites. This ensures that critical business information like hours, services with pricing, and customer testimonials are preserved exactly as found on the original website.

## Files Modified

### 1. `/src/lib/scraping/content-extractor.ts`
- **Added `extractBusinessHours()` function**: Extracts business hours from schema.org markup, common HTML patterns, and text patterns
- **Added `extractServices()` function**: Extracts services with names, descriptions, prices, and durations from various HTML structures
- **Added `extractTestimonials()` function**: Extracts customer testimonials with names, roles, content, and ratings
- **Updated `ExtractedBusinessInfo` interface**: Added `structuredContent` field to store preserved data
- **Updated `extractBusinessInfo()` function**: Now calls all new extraction functions

### 2. `/src/lib/types/site-generation-jobs.ts`
- **Updated `ScrapedWebsiteContext` interface**: Added `structuredContent` field within `businessInfo` to pass extracted data to the LLM

### 3. `/src/lib/ai/prompts/site-generation-prompts.ts`
- **Updated `buildFoundationPromptWithContext()` function**:
  - Added strong preservation instructions for business hours, services, and testimonials
  - Includes warnings to NOT modify or create fake content
- **Updated `buildPagePrompt()` function**:
  - Added structured content for contact section (business hours)
  - Added structured content for services section (exact services with pricing)
  - Added structured content for testimonials section (real customer reviews)

### 4. `/app/api/sites/generate/route.ts`
- **Updated scraping context building**: Now includes `structuredContent` in the `scrapedContext` passed to the LLM
- **Added logging**: Logs extraction of structured content for debugging

## Key Features

### Business Hours Extraction
- Looks for schema.org OpeningHoursSpecification
- Searches for common hour patterns (Mon-Fri: 9am-5pm, etc.)
- Checks for table structures with days and times
- Handles "Closed" days properly
- Common selectors: `.hours`, `.business-hours`, `[class*="hours"]`, footer sections

### Services with Pricing Extraction
- Looks for service lists, pricing tables, cards
- Extracts service name, description, price
- Handles different price formats ($X, $X/hour, From $X, etc.)
- Looks for schema.org Service or Product markup
- Common selectors: `.services`, `.pricing`, `.price-card`, `.service-item`

### Testimonials Extraction
- Looks for testimonial/review sections
- Extracts customer name, content, role/company
- Handles rating stars if present
- Looks for schema.org Review markup
- Common selectors: `.testimonial`, `.review`, `.feedback`, `blockquote`

## LLM Prompt Instructions

The prompts now include strong preservation directives:

### For Business Hours
- "BUSINESS HOURS (USE EXACTLY AS PROVIDED)"
- "DO NOT change these hours or create different hours"

### For Services
- "PRESERVE NAMES AND PRICES EXACTLY"
- "Service names and prices MUST be used exactly as shown"

### For Testimonials
- "USE VERBATIM"
- "NEVER create fake testimonials. Use these real ones exactly as provided"

## Testing

Created a test script at `/test-structured-extraction.js` to validate the extraction functions work correctly with sample HTML.

## Benefits

1. **Authenticity**: Preserves real business information exactly as provided
2. **Trust**: Uses actual customer testimonials instead of generated ones
3. **Accuracy**: Maintains correct business hours and service pricing
4. **Legal Compliance**: Avoids creating false claims or fake reviews
5. **Customer Experience**: Ensures generated site matches expectations set by original site

## Usage

When a website URL is provided during site generation:
1. The scraper extracts structured content using the new functions
2. This content is passed to the LLM with strong preservation instructions
3. The LLM uses the exact content in the generated site
4. Critical information like hours, prices, and reviews remain authentic

## Next Steps

Potential enhancements could include:
- Extraction of team member information
- FAQ extraction
- Product catalog extraction with detailed pricing
- Event/workshop schedule extraction
- Menu extraction for restaurants
- Appointment booking information extraction