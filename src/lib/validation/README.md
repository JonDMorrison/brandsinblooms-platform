# LLM Output Validation with Zod

Comprehensive runtime validation for LLM-generated site content using Zod schemas.

## Overview

This validation system provides:
- **Runtime type safety** beyond TypeScript's compile-time checking
- **Detailed validation** with constraints on lengths, formats, and arrays
- **Automatic error recovery** for common LLM output issues
- **Human-readable error messages** for debugging

## Quick Start

```typescript
import {
  validateFoundationData,
  validateSection,
  HeroSectionSchema
} from '@/lib/validation';

// Validate foundation data (Phase 1 output)
const result = validateFoundationData(llmOutput);
if (result.success) {
  console.log('Valid data:', result.data);
} else {
  console.error('Errors:', result.errors);
}

// Validate individual section
const heroResult = validateSection(heroData, HeroSectionSchema);
```

## Available Schemas

### Section Schemas

- `HeroSectionSchema` - Hero section with headline, subheadline, CTA
- `AboutSectionSchema` - About section with content paragraphs
- `ValuesSectionSchema` - Values section with 2-8 value items
- `FeaturesSectionSchema` - Features section with 2-12 features
- `ServicesSectionSchema` - Services section with 1-20 services
- `TeamSectionSchema` - Team section with 1-50 members
- `TestimonialsSectionSchema` - Testimonials with 1-20 testimonials
- `ContactSectionSchema` - Contact section with email validation

### Other Schemas

- `SiteBrandingSchema` - Colors (hex validation), fonts, logo
- `SeoMetadataSchema` - Title (60 char max), description (160 char max)
- `FoundationDataSchema` - Complete Phase 1 output
- `GeneratedSiteDataSchema` - Complete site with all sections

## Validation Constraints

### String Lengths

```typescript
// Hero section
headline: 3-100 characters
subheadline: 3-200 characters
cta_text: 2-30 characters

// SEO
title: 10-60 characters (optimal for search engines)
description: 50-160 characters (optimal for search engines)
```

### Array Lengths

```typescript
values: 2-8 items
features: 2-12 items
services: 1-20 items
team members: 1-50 items
testimonials: 1-20 items
```

### Format Validation

```typescript
// Hex colors: #RRGGBB format
primary_color: /^#[0-9A-Fa-f]{6}$/

// Email validation
email: valid email format

// Rating: 1-5 stars
rating: integer from 1 to 5
```

## Error Recovery

The system includes automatic error recovery for common issues:

### 1. Malformed Hex Colors

```typescript
// Before: "ff5733" or "F57"
// After:  "#FF5733" or "#FF5577"

const fixed = fixHexColors(data);
```

### 2. Excessive Text Length

```typescript
// Automatically truncates text that exceeds limits
const fixed = truncateExcessiveText(data, {
  headline: 100,
  description: 500
});
```

### 3. Array Length Violations

```typescript
// Truncates or pads arrays to meet constraints
const fixed = sanitizeArrayLengths(data, {
  values: { min: 2, max: 8 }
});
```

### 4. Missing Required Fields

```typescript
// Fills missing fields with sensible defaults
const fixed = fillMissingRequiredFields(partial, defaults);
```

## Usage Examples

### Example 1: Validate Foundation Data

```typescript
import { validateFoundationData } from '@/lib/validation';

const llmOutput = {
  site_name: "Acme Corp",
  tagline: "Quality products since 1990",
  description: "We make the best products in the industry",
  hero: {
    headline: "Welcome to Acme",
    subheadline: "Discover our products",
    cta_text: "Shop Now"
  },
  branding: {
    primary_color: "#FF5733"
  },
  seo: {
    title: "Acme Corp - Quality Products",
    description: "Premium products for your needs"
  }
};

const result = validateFoundationData(llmOutput);
if (result.success) {
  // TypeScript knows result.data is FoundationData
  const { site_name, branding } = result.data;
  console.log(`Site: ${site_name}, Color: ${branding.primary_color}`);
} else {
  // Log validation errors
  result.errors.forEach(error => console.error(error));
}
```

### Example 2: Validate with Error Recovery

```typescript
import {
  validateSection,
  recoverFromValidationError,
  HeroSectionSchema
} from '@/lib/validation';

const invalidHero = {
  headline: "Very long headline that exceeds the 100 character limit...",
  subheadline: "Tagline",
  cta_text: "Click"
};

// First attempt validation
const result = validateSection(invalidHero, HeroSectionSchema);
if (!result.success) {
  // Attempt recovery
  const recovered = recoverFromValidationError(
    invalidHero,
    HeroSectionSchema,
    {
      maxLengths: {
        headline: 100,
        subheadline: 200,
        cta_text: 30
      }
    }
  );

  if (recovered) {
    console.log('Recovery successful:', recovered);
  }
}
```

### Example 3: Batch Validation

```typescript
import { batchValidate, HeroSectionSchema, AboutSectionSchema } from '@/lib/validation';

const results = batchValidate([
  { data: heroData, schema: HeroSectionSchema, name: 'hero' },
  { data: aboutData, schema: AboutSectionSchema, name: 'about' }
]);

const failures = results.filter(r => !r.success);
if (failures.length > 0) {
  failures.forEach(({ name, errors }) => {
    console.error(`${name} validation failed:`, errors);
  });
}
```

### Example 4: Custom Validation with Recovery

```typescript
import { validateWithRecovery, ValuesSectionSchema } from '@/lib/validation';

const result = validateWithRecovery(
  data,
  ValuesSectionSchema,
  (d) => {
    // Custom recovery logic
    if (typeof d === 'object' && d !== null) {
      const fixed = { ...d };
      // Fix common issues
      if (Array.isArray(fixed.values) && fixed.values.length > 8) {
        fixed.values = fixed.values.slice(0, 8);
      }
      return fixed;
    }
    return d;
  }
);
```

## Integration with Response Parser

The validation system is integrated into the response parser:

```typescript
// In src/lib/ai/response-parser.ts
export function parseFoundationResponse(response: string): FoundationData | null {
  const json = extractJsonFromResponse(response);

  // Zod validation
  const zodResult = validateFoundationData(json);
  if (zodResult.success) {
    return zodResult.data;
  }

  // Automatic error recovery
  const recovered = recoverFromValidationError(json, FoundationDataSchema, {
    maxLengths: { headline: 100, /* ... */ }
  });

  return recovered;
}
```

## Error Messages

Zod provides detailed, path-specific error messages:

```typescript
// Example error output
[
  "hero.headline: Headline must be at least 3 characters",
  "branding.primary_color: Must be a valid hex color code (e.g., #FF5733)",
  "values: Must include at least 2 values",
  "seo.description: SEO description must be at least 50 characters"
]
```

## Type Safety

All schemas export inferred TypeScript types:

```typescript
import type { HeroSection, FoundationData } from '@/lib/validation';

// These types match the Zod schemas exactly
const hero: HeroSection = {
  headline: "Welcome",
  subheadline: "Discover more",
  cta_text: "Get Started"
};
```

## Best Practices

1. **Always validate LLM output** before saving to database
2. **Use error recovery** for better UX (salvage partial data)
3. **Log validation failures** for monitoring and improvement
4. **Keep constraints realistic** (e.g., 160 char description is SEO optimal)
5. **Provide defaults** for optional fields when using recovery

## Testing

```typescript
import { HeroSectionSchema } from '@/lib/validation';

describe('HeroSection validation', () => {
  it('validates correct hero section', () => {
    const valid = {
      headline: "Welcome",
      subheadline: "Discover our products",
      cta_text: "Get Started"
    };

    const result = HeroSectionSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects too-short headline', () => {
    const invalid = {
      headline: "Hi",  // Too short
      subheadline: "Discover our products",
      cta_text: "Get Started"
    };

    const result = HeroSectionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
```

## Migration from Type Guards

The new Zod validation **complements** existing type guards:

```typescript
// Before (type guards only)
if (isHeroSection(data)) {
  // Use data
}

// Now (Zod + type guards for backward compatibility)
const zodResult = validateSection(data, HeroSectionSchema);
if (zodResult.success) {
  // Use zodResult.data (validated with constraints)
}
```

## Performance

- Validation is fast (microseconds for typical payloads)
- Schemas are cached after first use
- Error recovery adds minimal overhead (only runs on validation failure)

## Future Enhancements

Potential additions:
- [ ] Async validation for URL/email existence checks
- [ ] Custom error messages per project
- [ ] Validation metrics/monitoring dashboard
- [ ] AI-powered smart recovery (learn from failures)