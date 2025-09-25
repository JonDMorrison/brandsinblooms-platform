# LLM-Driven Site Generator: Implementation Plan

## 1. Codebase Analysis & Findings

An analysis of the codebase and Supabase migrations reveals the following about the "Brands in Blooms" platform:

*   **Product:** It is a multi-tenant e-commerce platform, primarily designed for garden centers and plant shops. The system allows administrators to create and manage individual, domain-based websites for different businesses.
*   **Site Structure:** The `sites` table is the core of the multi-tenancy, defining each site's unique identity (name, subdomain, custom domain, etc.). New sites are instantiated from `site_templates`, which provide a baseline of configuration, pages, and products.
*   **Content Model:** Page content is stored in the `content` table's `content` column, which is a `JSONB` field. A recent migration (`20250910000000_add_plant_shop_content_types.sql`) introduced a more structured, section-based format for this JSON, which includes `version`, `layout`, and `sections` (containing sections like `hero`, `richText`, `features`). The `content_type` column categorizes pages (e.g., `home_page`, `about_page`, `plant_catalog`).
*   **Products:** The `products` table holds site-specific product information, including name, description, price, category, and images.
*   **Dynamic Pages:** The application uses a combination of the `sites` table's domain information and the `content` table's `slug` to construct and render page URLs. The `app/[...slug]/page.tsx` component is responsible for fetching the corresponding data and rendering the page dynamically.
*   **Existing Infrastructure:** The platform already has `create_site_with_template` and `validate_plant_content` functions that can be leveraged for the LLM integration.

### Implication for LLM Site Generator

The LLM's primary responsibility will be to **generate the `JSONB` data** for the `content` and `products` tables based on a natural language prompt. This generated JSON must strictly adhere to the new, structured format to be compatible with the frontend components.

---

## 2. Detailed Implementation Plan

Based on the codebase analysis and the requirements discussed in the project meeting, here is a comprehensive plan to implement the LLM-driven site generator.

### 2.1. High-Level Summary

The feature will enable users to generate a complete e-commerce website by providing a natural language description of their business. This is achieved via a new API endpoint that orchestrates a call to a Large Language Model (LLM). The LLM, guided by a detailed system prompt, will return a structured JSON object defining the entire site—including theme settings, page content, and a product catalog. This JSON is then parsed and persisted to the database to instantiate the new site.

**Critical Requirements:**
- **Security:** Input sanitization, output validation, and content moderation are mandatory
- **Performance:** Async job processing required due to 10-30 second LLM response times
- **Rate Limiting:** User-based limits to prevent abuse (3 generations/hour recommended)
- **Cost Control:** Daily budget limits and cost tracking per user

### 2.2. Proposed Architecture

1.  **Frontend:** A new UI component, likely integrated into the user onboarding flow, will capture the user's natural language business description and desired subdomain.
2.  **API Layer (Next.js):** Two new API routes will be created:
    *   **`POST /api/generate-site`**: Initiates generation, returns job ID immediately (202 Accepted)
    *   **`GET /api/generation-status/[jobId]`**: Allows polling for generation status
    *   Input sanitization and rate limiting will be enforced at this layer
    *   Will leverage existing `apiSuccess` and `apiError` patterns
3.  **Background Processing:** Async job queue for LLM API calls
    *   Prevents timeouts and improves UX
    *   Allows for retry logic on failures
    *   Tracks job status in database
4.  **Database Layer (Supabase):** Leverage existing infrastructure:
    *   **Option A (Recommended):** Reuse `create_site_with_template` function by formatting LLM output as template data
    *   **Option B:** Create new `create_site_from_llm_json` function if specialized handling needed
    *   All operations within single transaction for atomicity
    *   Use `validate_plant_content` function for content validation

### 2.3. API Endpoint Specifications

#### Primary Endpoint: `POST /api/generate-site`
*   **Authentication:** Protected. Requires authenticated Supabase user session.
*   **Authorization:** Admin-only initially, can be expanded to all users with proper rate limiting
*   **Rate Limiting:** 3 requests per hour per user
*   **Request Body:**
    ```json
    {
      "prompt": "A detailed description of the user's business (max 2000 chars)...",
      "siteSubdomain": "user-chosen-subdomain"
    }
    ```
*   **Success Response (`202 Accepted`):**
    ```json
    {
      "jobId": "uuid-of-generation-job",
      "statusUrl": "/api/generation-status/uuid-of-generation-job",
      "message": "Site generation started. Poll statusUrl for updates."
    }
    ```
*   **Error Responses:**
    - `400`: Invalid input or subdomain taken
    - `429`: Rate limit exceeded
    - `403`: Insufficient permissions
    - `500`: Server error

#### Status Endpoint: `GET /api/generation-status/[jobId]`
*   **Authentication:** Protected. User must own the job.
*   **Response:**
    ```json
    {
      "jobId": "uuid",
      "status": "pending|processing|completed|failed",
      "progress": 50,
      "result": {
        "siteId": "uuid-of-created-site",
        "subdomain": "chosen-subdomain"
      },
      "error": "Error message if failed"
    }
    ```

### 2.4. Generated JSON Specification

The LLM must be prompted to generate a single, valid JSON object with the following structure. This schema is derived directly from the `site_templates` table and the latest `content` table format.

```json
{
  "site": {
    "name": "Generated Site Name",
    "businessName": "Official Business Name",
    "businessEmail": "contact@business.com",
    "businessHours": {
      "monday": {"open": "09:00", "close": "17:00", "closed": false},
      "tuesday": {"open": "09:00", "close": "17:00", "closed": false},
      "wednesday": {"open": "09:00", "close": "17:00", "closed": false},
      "thursday": {"open": "09:00", "close": "17:00", "closed": false},
      "friday": {"open": "09:00", "close": "17:00", "closed": false},
      "saturday": {"open": "10:00", "close": "16:00", "closed": false},
      "sunday": {"open": null, "close": null, "closed": true}
    },
    "theme": {
      "primaryColor": "#34D399",
      "secondaryColor": "#059669",
      "fontFamily": "Inter",
      "layoutStyle": "modern"
    }
  },
  "pages": [
    {
      "title": "Home",
      "slug": "home",
      "contentType": "home_page",
      "isPublished": true,
      "sortOrder": 1,
      "content": {
        "version": "1.0",
        "layout": "home",
        "sections": {
          "hero": {
            "type": "hero",
            "data": {
              "title": "Welcome to [Business Name]",
              "subtitle": "A catchy tagline about the business.",
              "buttonText": "Shop Our Products",
              "buttonLink": "/products"
            },
            "visible": true,
            "order": 1
          },
          "features": {
            "type": "features",
            "data": {
              "title": "Why Choose Us",
              "features": [
                {"title": "Feature One", "description": "Description of feature one."},
                {"title": "Feature Two", "description": "Description of feature two."},
                {"title": "Feature Three", "description": "Description of feature three."}
              ]
            },
            "visible": true,
            "order": 2
          }
        }
      }
    },
    {
      "title": "About Us",
      "slug": "about",
      "contentType": "about_page",
      "isPublished": true,
      "sortOrder": 2,
      "content": {
        "version": "1.0",
        "layout": "about",
        "sections": {
          "story": {
            "type": "richText",
            "data": {
              "content": "Detailed story about the business."
            },
            "visible": true,
            "order": 1
          }
        }
      }
    },
    {
      "title": "Contact Us",
      "slug": "contact",
      "contentType": "contact_page",
      "isPublished": true,
      "sortOrder": 3,
      "content": {
        "version": "1.0",
        "layout": "contact",
        "sections": {
          "contact_form": {
            "type": "form",
            "data": {
              "title": "Get In Touch"
            },
            "visible": true,
            "order": 1
          }
        }
      }
    },
    {
      "title": "Privacy Policy",
      "slug": "privacy",
      "contentType": "privacy_page",
      "isPublished": true,
      "sortOrder": 98,
      "content": {
        "version": "1.0",
        "layout": "legal",
        "sections": {
          "legal_text": {
            "type": "richText",
            "data": {
              "content": "Generic but comprehensive privacy policy text."
            },
            "visible": true,
            "order": 1
          }
        }
      }
    },
    {
      "title": "Terms of Service",
      "slug": "terms",
      "contentType": "terms_page",
      "isPublished": true,
      "sortOrder": 99,
      "content": {
        "version": "1.0",
        "layout": "legal",
        "sections": {
          "legal_text": {
            "type": "richText",
            "data": {
              "content": "Generic but comprehensive terms of service text."
            },
            "visible": true,
            "order": 1
          }
        }
      }
    }
  ],
  "products": [
    {
      "name": "Product One Name",
      "slug": "product-one-name",
      "description": "Detailed description of the first product.",
      "category": "Product Category",
      "price": 29.99,
      "isActive": true,
      "isFeatured": true,
      "inStock": true,
      "images": [
        {"url": "https://placehold.co/600x400/EEE/31343C?text=Product+One", "alt": "Image of Product One"}
      ]
    },
    {
      "name": "Product Two Name",
      "slug": "product-two-name",
      "description": "Detailed description of the second product.",
      "category": "Product Category",
      "price": 39.99,
      "isActive": true,
      "isFeatured": false,
      "inStock": true,
      "images": [
        {"url": "https://placehold.co/600x400/EEE/31343C?text=Product+Two", "alt": "Image of Product Two"}
      ]
    }
  ]
}
```

### 2.5. Security and Validation Implementation

#### Input Sanitization
```typescript
const sanitizeUserPrompt = (prompt: string): string => {
  return prompt
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
    .replace(/\{\{.*?\}\}/g, '') // Remove template injection attempts
    .replace(/\[INST\]|\/\[INST\]/g, '') // Remove common injection markers
    .slice(0, 2000); // Enforce length limit
};
```

#### Output Validation Schema (Zod)
```typescript
import { z } from 'zod';

const ContentSectionSchema = z.object({
  type: z.string(),
  data: z.record(z.unknown()),
  visible: z.boolean(),
  order: z.number().min(1).max(100)
});

const PageContentSchema = z.object({
  version: z.literal('1.0'),
  layout: z.string(),
  sections: z.record(ContentSectionSchema)
});

const LLMGeneratedSiteSchema = z.object({
  site: z.object({
    name: z.string().min(1).max(100),
    businessName: z.string().max(100),
    businessEmail: z.string().email(),
    businessHours: z.record(z.object({
      open: z.string().nullable(),
      close: z.string().nullable(),
      closed: z.boolean()
    })),
    theme: z.object({
      primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i),
      secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i),
      fontFamily: z.enum(['Inter', 'Roboto', 'Open Sans']),
      layoutStyle: z.enum(['modern', 'classic', 'minimal'])
    })
  }),
  pages: z.array(z.object({
    title: z.string().max(100),
    slug: z.string().regex(/^[a-z0-9\-]+$/),
    contentType: z.enum(['home_page', 'about_page', 'contact_page', 'privacy_page', 'terms_page']),
    isPublished: z.boolean(),
    sortOrder: z.number().min(1).max(100),
    content: PageContentSchema
  })).max(10), // Limit pages to prevent DoS
  products: z.array(z.object({
    name: z.string().max(100),
    slug: z.string().regex(/^[a-z0-9\-]+$/),
    description: z.string().max(1000),
    price: z.number().positive().max(999999),
    category: z.string().max(50),
    isActive: z.boolean(),
    isFeatured: z.boolean(),
    inStock: z.boolean(),
    images: z.array(z.object({
      url: z.string().url(),
      alt: z.string().max(200)
    })).max(5)
  })).max(20) // Limit products
});
```

#### Content Moderation
```typescript
const validateGeneratedContent = (content: string): boolean => {
  const blockedPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers
    /data:text\/html/i,
    /<iframe/i,
    /<embed/i,
    /<object/i
  ];
  return !blockedPatterns.some(pattern => pattern.test(content));
};
```

#### Rate Limiting Implementation
```typescript
const llmRateLimit = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // 3 generations per hour per user
  keyGenerator: (userId: string) => `llm-gen:${userId}`,
  costTracking: true,
  dailyBudget: 100 // $100/day platform limit
};
```

### 2.6. System Prompt for LLM

```
You are an expert website designer and content strategist for e-commerce businesses, specializing in the garden and plant industry. Your task is to generate a complete website structure in a single, valid JSON object based on a user's business description.

**Instructions:**

1.  **Analyze the User's Prompt:** Carefully read the user's description to understand their business name, industry, products, target audience, and desired brand aesthetic.
2.  **Generate Core Site Details:**
    *   `site.name`: A creative and relevant name for the website.
    *   `site.businessName`: The official business name from the prompt.
    *   `site.businessEmail`: A plausible contact email (e.g., `contact@[businessname].com`).
    *   `site.businessHours`: Generate a standard business schedule unless otherwise specified.
    *   `site.theme`: Choose a `primaryColor` and `secondaryColor` (in hex format) that match the brand's aesthetic. Use "Inter" for `fontFamily` and "modern" for `layoutStyle`.
3.  **Generate Standard Pages:** Create a JSON object for each of the following pages in the `pages` array: **Home, About Us, Contact Us, Privacy Policy, and Terms of Service**.
    *   The `slug` must be URL-friendly (e.g., "about-us").
    *   The `contentType` must match the page type (e.g., `home_page`, `about_page`).
    *   The `content` object must follow the specified `sections` structure. Populate the `title`, `subtitle`, and `description` fields with compelling, well-written copy that is tailored to the user's business. For legal pages, generate standard boilerplate text.
4.  **Generate Products:** Create a list of 3-5 sample products in the `products` array.
    *   Infer product `name`, `description`, and `category` from the user's prompt.
    *   Generate a realistic `price`.
    *   Generate a URL-friendly `slug` for each product.
    *   For `images`, use a placeholder URL format: `https://placehold.co/600x400/EEE/31343C?text=[Product+Name]`, replacing `[Product+Name]` with the actual product name.
5.  **Output Format:** The final output MUST be a single, valid JSON object that strictly adheres to the provided schema. Do not include any text, explanations, or markdown formatting outside of the JSON object itself.

**JSON Schema:**
<PASTE THE FULL JSON SPECIFICATION FROM SECTION 2.4 HERE>

**Example User Prompt:**
"I'm starting an online store called 'Petal & Stem'. We are a boutique plant shop in San Francisco specializing in rare and exotic indoor plants for city dwellers. We focus on high-quality, low-maintenance plants for apartments and small spaces. Our brand is modern, minimalist, and a bit luxurious."

**Begin Generation.**
```

### 2.7. Implementation Steps

1.  **Database Layer:**
    *   **Option A (Recommended):** Leverage existing `create_site_with_template` function
        ```typescript
        // Transform LLM output to template format
        const templateData = {
          template_slug: 'llm-generated',
          site_name: llmResult.site.name,
          site_subdomain: subdomain,
          owner_email: userEmail,
          business_info: llmResult.site
        };
        await supabase.rpc('create_site_with_template', templateData);
        ```
    *   **Option B:** Create new migration with enhanced validation
        ```sql
        CREATE OR REPLACE FUNCTION public.create_site_from_llm_json(
            data JSONB,
            owner_id UUID,
            site_subdomain TEXT
        )
        RETURNS JSON
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
            -- Validate limits
            IF jsonb_array_length(data->'pages') > 10 THEN
                RAISE EXCEPTION 'Too many pages';
            END IF;

            -- Use advisory lock
            PERFORM pg_advisory_xact_lock(hashtext('site_creation'));

            -- Validate content structure
            IF NOT validate_plant_content(data->'pages'->0->'content') THEN
                RAISE EXCEPTION 'Invalid content structure';
            END IF;

            -- Insert with transaction
            -- ... implementation details
        END;
        $$;
        ```

2.  **Job Queue Implementation (`app/api/generate-site/route.ts`):**
    ```typescript
    import { sanitizeUserPrompt } from '@/lib/security/sanitization';
    import { LLMGeneratedSiteSchema } from '@/lib/validation/schemas';
    import { createGenerationJob, queueJob } from '@/lib/jobs';

    export async function POST(request: NextRequest) {
      // Rate limiting check
      const rateLimitResult = await checkRateLimit(user.id);
      if (!rateLimitResult.allowed) {
        return apiError('Rate limit exceeded', 429);
      }

      // Input sanitization
      const sanitizedPrompt = sanitizeUserPrompt(body.prompt);

      // Create job
      const jobId = crypto.randomUUID();
      await createGenerationJob({
        id: jobId,
        userId: user.id,
        prompt: sanitizedPrompt,
        subdomain: body.siteSubdomain,
        status: 'pending'
      });

      // Queue for background processing
      await queueJob('generate-site', { jobId });

      return apiSuccess({
        jobId,
        statusUrl: `/api/generation-status/${jobId}`
      }, 202);
    }
    ```

3.  **Background Worker (`lib/jobs/site-generator.ts`):**
    ```typescript
    export async function processSiteGeneration(jobId: string) {
      try {
        // Update status
        await updateJob(jobId, { status: 'processing' });

        // Call LLM with retry logic
        const llmResponse = await callLLMWithRetry(prompt, {
          maxRetries: 3,
          timeout: 30000
        });

        // Validate response
        const validatedData = LLMGeneratedSiteSchema.parse(llmResponse);

        // Content moderation
        if (!validateGeneratedContent(JSON.stringify(validatedData))) {
          throw new Error('Content failed moderation');
        }

        // Create site using existing infrastructure
        const result = await supabase.rpc('create_site_with_template', {
          // ... formatted data
        });

        // Update job with result
        await updateJob(jobId, {
          status: 'completed',
          result: { siteId: result.site_id }
        });
      } catch (error) {
        await updateJob(jobId, {
          status: 'failed',
          error: error.message
        });
      }
    }
    ```

4.  **Frontend Component (`components/SiteGeneratorForm.tsx`):**
    ```typescript
    export function SiteGeneratorForm() {
      const [jobId, setJobId] = useState<string | null>(null);
      const [status, setStatus] = useState<JobStatus | null>(null);

      const handleSubmit = async (data: FormData) => {
        const response = await fetch('/api/generate-site', {
          method: 'POST',
          body: JSON.stringify(data)
        });

        const result = await response.json();
        setJobId(result.jobId);

        // Start polling for status
        pollForStatus(result.jobId);
      };

      const pollForStatus = async (id: string) => {
        const interval = setInterval(async () => {
          const response = await fetch(`/api/generation-status/${id}`);
          const status = await response.json();

          setStatus(status);

          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(interval);
            if (status.status === 'completed') {
              router.push(`/dashboard/${status.result.siteId}`);
            }
          }
        }, 2000); // Poll every 2 seconds
      };

      // ... render form with progress indicator
    }
    ```

## 3. Critical Implementation Notes

### 3.1. Security Requirements (MUST HAVE)
- ✅ **Input Sanitization**: All user prompts must be sanitized before LLM processing
- ✅ **Output Validation**: Use Zod schema to validate all LLM responses
- ✅ **Content Moderation**: Block XSS, script injection, and malicious content
- ✅ **Rate Limiting**: 3 requests/hour per user to prevent abuse
- ✅ **Authorization**: Admin-only initially, expand carefully with proper controls

### 3.2. Performance Requirements (MUST HAVE)
- ✅ **Async Processing**: Use job queue to handle 10-30 second LLM latency
- ✅ **Polling Interface**: Frontend polls for status every 2 seconds
- ✅ **Retry Logic**: 3 retries for LLM API failures with exponential backoff
- ✅ **Timeout Handling**: 30-second timeout for LLM API calls

### 3.3. Cost Management
- ✅ **Daily Budget**: $100/day platform limit
- ✅ **User Tracking**: Track costs per user for billing
- ✅ **Response Caching**: Cache similar prompts for 1 hour
- ✅ **Monitoring**: Alert on unusual usage patterns

### 3.4. Data Structure Corrections
**IMPORTANT**: The content structure uses `sections` not `blocks`:
```json
{
  "content": {
    "version": "1.0",
    "layout": "home",
    "sections": {  // ← Correct: "sections"
      "hero": {
        "type": "hero",
        "data": {...},
        "visible": true,
        "order": 1
      }
    }
  }
}
```

### 3.5. Recommended Implementation Approach
1. **Phase 1 (Alpha)**: Admin-only with strict rate limiting
2. **Phase 2 (Beta)**: Selected users with monitoring
3. **Phase 3 (GA)**: All users with proper cost controls

### 3.6. Risk Mitigation
- **Without async processing**: HIGH risk of timeouts
- **Without input sanitization**: CRITICAL security vulnerability
- **Without rate limiting**: HIGH financial risk ($1000s/day)
- **Without validation**: MEDIUM risk of broken sites

### 3.7. Monitoring & Observability
- Log all generation attempts with user ID and prompt hash
- Track success/failure rates
- Monitor LLM API response times
- Alert on rate limit violations
- Track daily spend against budget
