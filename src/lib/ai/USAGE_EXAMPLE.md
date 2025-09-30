# Site Generator Service - Usage Examples

This document provides examples of how to use the LLM-powered site generation system.

## Overview

The site generation system uses a two-phase approach:
- **Phase 1**: Generate site foundation (metadata + theme + hero) in one LLM call
- **Phase 2**: Generate page sections in parallel (About, Values, Features, Services, Team, Testimonials, Contact)

## Basic Usage

```typescript
import { generateSiteContent } from '@/lib/ai/site-generator-service';
import { type BusinessInfo } from '@/lib/types/site-generation-jobs';

const businessInfo: BusinessInfo = {
  prompt: "Create a modern, welcoming website for my garden center",
  name: "Green Thumb Gardens",
  industry: "garden center",
  location: "Portland, OR",
  description: "Family-owned garden center specializing in native plants and organic gardening",
  email: "hello@greenthumbgardens.com",
  phone: "(503) 555-1234",
  website: "https://greenthumbgardens.com"
};

// Generate complete site
const result = await generateSiteContent(businessInfo);

// Access generated data
console.log('Site name:', result.data.site_name);
console.log('Tagline:', result.data.tagline);
console.log('Primary color:', result.data.branding.primary_color);
console.log('Hero headline:', result.data.hero.headline);

// Check cost and usage
console.log('Total cost:', result.totalCostCents / 100, 'dollars');
console.log('Total tokens:', result.tokenUsage.total_tokens);
console.log('API calls made:', result.totalCalls);

// Handle partial failures
if (result.failedSections.length > 0) {
  console.warn('Some sections failed to generate:', result.failedSections);
}
```

## Minimal Example

```typescript
// Minimal business info - system will fill in reasonable defaults
const minimalInfo: BusinessInfo = {
  prompt: "Create a website for my plant shop called Urban Jungle",
  name: "Urban Jungle"
};

const result = await generateSiteContent(minimalInfo);
// Will generate with placeholder contact info and generic industry content
```

## Using Individual Generation Functions

You can also use the individual generation functions for more control:

### Generate Foundation Only

```typescript
import { generateFoundation } from '@/lib/ai/site-generator-service';

const foundation = await generateFoundation(businessInfo);

console.log('Site metadata:', {
  name: foundation.site_name,
  tagline: foundation.tagline,
  description: foundation.description
});

console.log('Branding:', foundation.branding);
console.log('SEO:', foundation.seo);
console.log('Hero:', foundation.hero);
```

### Generate Specific Sections

```typescript
import {
  generateAboutSection,
  generateValuesSection,
  generateContactSection
} from '@/lib/ai/site-generator-service';

// First, generate foundation to get theme
const foundation = await generateFoundation(businessInfo);

// Then generate specific sections
const about = await generateAboutSection(businessInfo, foundation.branding);
const values = await generateValuesSection(businessInfo, foundation.branding);
const contact = await generateContactSection(businessInfo, foundation.branding);

if (about) {
  console.log('About title:', about.title);
  console.log('Content paragraphs:', about.content.length);
}

if (values) {
  console.log('Values:', values.values.map(v => v.title));
}
```

## Error Handling

```typescript
try {
  const result = await generateSiteContent(businessInfo);

  // Check for partial failures
  if (result.failedSections.length > 0) {
    console.warn('Failed sections:', result.failedSections);
    // You can retry failed sections individually or use defaults
  }

  // Save to database
  await saveSiteToDatabase(result.data);

} catch (error) {
  // Foundation generation failed - this is critical
  console.error('Site generation failed completely:', error);

  if (isOpenRouterError(error)) {
    switch (error.type) {
      case OpenRouterErrorType.AUTHENTICATION_ERROR:
        console.error('Invalid API key');
        break;
      case OpenRouterErrorType.RATE_LIMIT_ERROR:
        console.error('Rate limit exceeded - retry later');
        break;
      case OpenRouterErrorType.TIMEOUT_ERROR:
        console.error('Request timed out - retry with longer timeout');
        break;
      default:
        console.error('API error:', error.message);
    }
  }
}
```

## Accessing Generated Data

### Site Metadata
```typescript
const { site_name, tagline, description } = result.data;
const { title, description: metaDesc, keywords } = result.data.seo;
```

### Branding
```typescript
const { primary_color, secondary_color, accent_color, font_family } = result.data.branding;
```

### Hero Section
```typescript
const { headline, subheadline, cta_text, background_image } = result.data.hero;
```

### About Section
```typescript
const { title, content, mission, vision } = result.data.about;
// content is an array of paragraphs with markdown formatting
content.forEach(paragraph => {
  console.log(paragraph); // May include **bold** and other markdown
});
```

### Values Section (Optional)
```typescript
if (result.data.values) {
  const { title, subtitle, values } = result.data.values;
  values.forEach(value => {
    console.log(value.title, value.description, value.icon);
  });
}
```

### Features Section (Optional)
```typescript
if (result.data.features) {
  const { title, subtitle, features } = result.data.features;
  features.forEach(feature => {
    console.log(feature.title, feature.description, feature.icon);
  });
}
```

### Services Section (Optional)
```typescript
if (result.data.services) {
  const { title, subtitle, services } = result.data.services;
  services.forEach(service => {
    console.log(service.name, service.description);
    if (service.price) console.log('Price:', service.price);
    if (service.duration) console.log('Duration:', service.duration);
  });
}
```

### Team Section (Optional)
```typescript
if (result.data.team) {
  const { title, subtitle, members } = result.data.team;
  members.forEach(member => {
    console.log(member.name, member.role);
    console.log(member.bio);
  });
}
```

### Testimonials Section (Optional)
```typescript
if (result.data.testimonials) {
  const { title, subtitle, testimonials } = result.data.testimonials;
  testimonials.forEach(testimonial => {
    console.log(testimonial.name, testimonial.content);
    if (testimonial.rating) console.log('Rating:', testimonial.rating);
  });
}
```

### Contact Section
```typescript
const { title, email, phone, address, hours, additionalInfo } = result.data.contact;
if (additionalInfo) {
  console.log('Parking:', additionalInfo.parking);
  console.log('Accessibility:', additionalInfo.accessibility);
}
```

## Integration with Job Queue

```typescript
import { generateSiteContent } from '@/lib/ai/site-generator-service';
import { updateJobStatus, updateJobResult, updateJobError } from '@/lib/services/site-generation-jobs';

async function processSiteGenerationJob(jobId: string, businessInfo: BusinessInfo) {
  try {
    // Mark job as processing
    await updateJobStatus({ jobId, status: 'processing', progress: 0 });

    // Generate site content
    const result = await generateSiteContent(businessInfo);

    // Save generated site to database (your implementation)
    const siteId = await saveSiteToDatabase(result.data);

    // Update job with success
    await updateJobResult({
      jobId,
      siteId,
      generatedData: result.data,
      costCents: result.totalCostCents,
      tokenUsage: result.tokenUsage
    });

  } catch (error) {
    const errorInfo = handleError(error);
    await updateJobError({
      jobId,
      errorMessage: errorInfo.message,
      errorCode: errorInfo.code
    });
  }
}
```

## Cost Estimation

Current pricing (x-ai/grok-code-fast-1):
- Prompt tokens: $0.05 per 1M tokens
- Completion tokens: $0.10 per 1M tokens

Typical generation costs:
- Foundation (Phase 1): ~500-1000 tokens (~$0.0001)
- Each section (Phase 2): ~1000-2000 tokens (~$0.0002)
- Complete site (8 sections): ~$0.002 (0.2 cents)

```typescript
// Cost is automatically calculated
const result = await generateSiteContent(businessInfo);
console.log('Cost in dollars:', result.totalCostCents / 100);
console.log('Cost per section:', result.totalCostCents / result.totalCalls, 'cents');
```

## Custom Prompts

You can use the prompt building functions directly:

```typescript
import {
  buildFoundationPrompt,
  buildPagePrompt
} from '@/lib/ai/prompts/site-generation-prompts';

// Build custom foundation prompt
const foundationPrompt = buildFoundationPrompt({
  prompt: "Create an elegant, sophisticated website",
  name: "Luxury Botanicals",
  industry: "high-end plant shop",
  location: "Beverly Hills, CA"
});

// Build custom section prompts
const aboutPrompt = buildPagePrompt('about', businessInfo, branding);
const contactPrompt = buildPagePrompt('contact', businessInfo, branding);
```

## Response Parsing

You can also use the response parsers directly:

```typescript
import {
  parseFoundationResponse,
  parseAboutSectionResponse,
  extractJsonFromResponse
} from '@/lib/ai/response-parser';

// Parse raw LLM response
const rawResponse = `Here's the site foundation:\n\`\`\`json\n{...}\n\`\`\``;
const foundation = parseFoundationResponse(rawResponse);

if (!foundation) {
  console.error('Failed to parse response');
}

// Extract JSON from markdown
const json = extractJsonFromResponse(rawResponse);
```

## Type Guards

Validate data structures:

```typescript
import {
  isFoundationData,
  isAboutSection,
  isGeneratedSiteData
} from '@/lib/types/type-guards';

// Validate unknown data
function processData(data: unknown) {
  if (isGeneratedSiteData(data)) {
    // TypeScript now knows data is GeneratedSiteData
    console.log(data.site_name);
  }
}
```