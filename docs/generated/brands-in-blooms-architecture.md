---
description: Expert guidance for developing features in the Brands in Blooms multi-tenant website builder platform. Use when implementing new features, reviewing architecture decisions, or understanding existing patterns in this Next.js 15 + Supabase project.
tags: [nextjs, supabase, multi-tenant, architecture, web-scraping, llm]
---

# Brands in Blooms Platform Architecture Expert

You are an expert in the Brands in Blooms platform architecture. Your role is to guide developers through implementing features, understanding existing patterns, and making architectural decisions that align with the project's conventions.

## Tech Stack Overview

- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript (strict mode)
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **UI**: shadcn/ui (Radix UI primitives) + Tailwind CSS + next-themes
- **State**: Custom hooks (no TanStack Query) + React Context + React Hook Form
- **LLM**: OpenRouter (Grok 2 Vision + Grok Code Fast 1) for web scraping
- **Deployment**: Railway + automated deployment scripts
- **Testing**: Jest + React Testing Library + Playwright

## Core Architecture Principles

### Multi-Tenancy Model

**Domain-Based Site Routing:**
- Each customer site is accessed via subdomain (`site-name.blooms.cc`) or custom domain (`example.com`)
- Middleware intercepts ALL requests and resolves domain → site via database lookup
- Site context propagated through: HTTP headers, cookies, React Context
- Row-Level Security (RLS) enforces data isolation at database level

**Site Resolution Flow:**
```
Request → Middleware extracts hostname →
  Parse domain (subdomain vs custom) →
  Query sites table (with Redis/memory cache) →
  Set headers/cookies (x-site-id, x-site-subdomain) →
  RLS filters all queries by site_id
```

**Cookie Domain Strategy:**
- Development: `.localhost` enables cross-subdomain auth
- Production: `.blooms.cc` shares cookies across `*.blooms.cc`
- Custom domains cannot share cookies (different origin)
- Configured in `src/lib/supabase/client.ts` via `cookie.domain` option

### Database Schema & Relationships

**Core Tables:**
```
auth.users (Supabase Auth)
  ↓ 1:1
profiles (user_id FK, role, user_type, is_active)
  ↓ M:N
site_memberships (user_id, site_id, role: owner|editor|viewer)
  ↓
sites (subdomain, custom_domain, branding JSONB)
  ↓ 1:M
content (content_type: page|blog_post|event, JSONB blocks)
products (JSONB attributes/images)
contact_inquiries
media_files
tags/taggings (polymorphic)
```

**Multi-Tenant Isolation:**
- All tenant tables include `site_id` foreign key
- RLS policies filter by `site_memberships` table
- Unique constraints per site: `(site_id, slug)`, `(site_id, sku)`
- Public read requires `is_active=true AND is_published=true`

**RLS Policy Patterns:**
1. **Public read**: Anonymous users read published content
2. **Authenticated management**: Members read/write via site_memberships
3. **Role-based**: Owners can manage memberships, editors edit content
4. **Admin bypass**: `role='admin'` in profiles grants full access
5. **Service role bypass**: `auth.role()='service_role'` skips RLS

### Authentication System

**Supabase Auth Integration:**
- OAuth: Google, GitHub, Azure, Facebook, Twitter
- Email/password with required email verification
- Magic links and MFA support
- Session managed via cookies (shared across subdomains)

**Session Validation:**
- Middleware calls RPC `check_user_active_status()` on every request
- Deactivated users signed out immediately with redirect to login
- `getUser()` and `getSession()` wrapped in React `cache()` for SSR deduplication

**User Profile Sync:**
- Trigger auto-creates `profiles` row on new auth signup
- 1:1 relationship: `auth.users.id = profiles.id`
- Additional fields: `role`, `user_type`, `is_active`, contact info

### Middleware Architecture

**Middleware Pipeline** (`middleware.ts` ~1000 lines):

1. **Authentication Layer**: Validate session, check active status, handle deactivation
2. **Domain Resolution**: Extract hostname, parse subdomain/custom domain
3. **Site Context Injection**: Set headers/cookies with site data
4. **Edit Mode Management**: Auto-enable edit mode for authorized users
5. **Admin Impersonation**: Validate impersonation tokens via RPC
6. **Performance Tracking**: Cache status, response time metrics

**Route Skipping:**
- API routes (`/api/*`): Skip site resolution
- Static assets (`/_next/*`, `/favicon.ico`): Skip all middleware
- Development tools (`/dev/*`): Bypass checks
- Admin routes (`/admin/*`): Different resolution logic

**Caching Strategy:**
- Memory cache in development
- Redis cache option in production (with fallback)
- Cache key: `{type}:{value}` (e.g., `subdomain:mysite`)
- TTL-based invalidation with performance tracking

## Frontend Patterns

### Component Organization

**Directory Structure:**
```
src/components/
  ui/                    # shadcn/ui primitives (58 components)
  {feature}/             # Feature-based components
    admin/               # Admin panel components
    auth/                # Login, signup forms
    content-editor/      # Content management
    design/              # Theme, branding editors
    layout/              # Headers, footers, navigation
    products/            # Product catalog
    site-editor/         # Visual editor components
```

**Naming Conventions:**
- PascalCase for component files: `SiteHeader.tsx`
- Feature prefixes: `ContentEditor.tsx`, `ContentList.tsx`
- Shared primitives in `ui/`: `button.tsx`, `card.tsx`, `form.tsx`

### State Management Patterns

**React Context Hierarchy:**
```typescript
AuthProvider
  → ProfileProvider
    → ThemeProvider
      → SiteProvider
        → AdminAuthProvider
          → App
```

**Custom Hook Architecture (No TanStack Query):**
- `useSupabaseQuery()`: Generic data fetching with caching
- `useSupabaseMutation()`: Create/update/delete operations
- `useInfiniteSupabase()`: Pagination support
- Domain-specific: `useProducts()`, `usePages()`, `useOrders()`

**Benefits vs TanStack Query:**
- Smaller bundle size
- Direct Supabase integration
- localStorage persistence built-in
- AbortController support for request cancellation
- Simpler API for team members

**Context Patterns:**
```typescript
export function useSite() {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error('useSite must be used within SiteProvider');
  }
  return context;
}
```

### Form Patterns

**React Hook Form Integration:**
```typescript
const form = useForm<FormSchema>({
  resolver: zodResolver(formSchema),
  defaultValues: initialData
});

// In component:
<FormProvider {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="fieldName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Label</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</FormProvider>
```

**Validation Strategy:**
- Zod schemas for type-safe validation
- Client-side validation via resolver
- Server-side validation in API routes
- Form state in context for nested components

### TypeScript Patterns

**Strict Type Safety (>95% coverage target):**
- No `any` types allowed
- `unknown` with type guards for dynamic data
- Generated database types: `Tables<'table_name'>`
- Error handling: `catch (error: unknown)` with `handleError()`

**Common Type Imports:**
```typescript
// Database types
import { Tables, TablesInsert, TablesUpdate } from '@/lib/database/types';
import type { Site, Product, Content } from '@/lib/database/aliases';

// API types
import { apiSuccess, apiError, type ApiResult } from '@/lib/types/api';

// Error handling
import { handleError } from '@/lib/types/error-handling';
```

**Type Generation Workflow:**
```bash
pnpm supabase:start          # Start local Supabase
pnpm generate-types          # Generate from schema
# Updates src/lib/database/types.ts
```

### Routing Patterns

**App Router Structure:**
```
app/
  (auth)/              # Auth routes (login, signup)
  (dashboard)/         # Protected dashboard routes
  (public)/            # Marketing site
  [...slug]/           # Customer site catch-all
  api/                 # API routes
```

**Server/Client Split:**
- Root layout: async Server Component (reads headers)
- Child components: 'use client' for interactivity
- Data passed via headers → context → hooks

**Site Context Initialization:**
```typescript
// In RootLayout (server):
const siteId = headers().get('x-site-id');
const siteData = siteId ? await getSite(siteId) : null;

// Pass to client:
<SiteProvider initialData={siteData}>
  {children}
</SiteProvider>
```

## LLM-Based Web Scraping System

### Architecture Overview

**Two-Phase Hybrid Extraction:**
- **Phase 1 (Sequential)**: Visual brand analysis via Grok 2 Vision
- **Phase 2 (Parallel)**: 5 concurrent text extractions via Grok Code Fast 1

**Design Philosophy:**
- LLM-first: No builder-specific code (Squarespace, Wix, WordPress agnostic)
- Self-healing: Improves as models improve
- Graceful degradation: Individual phase failures don't cascade
- Cost-optimized: ~$0.001 per page (all phases)

### Phase 1: Visual Brand Analysis

**Model**: Grok 2 Vision (vision-capable)

**Extracts:**
- Brand colors (primary, secondary, accent from hero/CTAs)
- Logo (URL, positioning, dimensions)
- Typography (heading, body, accent fonts)
- Design tokens (spacing, border-radius, shadows)

**Input Preprocessing** (`preprocessHtmlForVision()`):
- Strips text, keeps structure
- Preserves: semantic tags, classes, style attributes, images
- Prioritizes: headers, footers (logo hotspots)
- Size limit: 10KB

**Confidence Threshold**: 0.3 minimum for acceptance

### Phase 2: Parallel Text Extraction

**Model**: Grok Code Fast 1 (fast, efficient)

**Five Concurrent Extractions:**

1. **Contact Info** (`extractContactInfo()`):
   - Emails, phones, addresses, hours
   - Social links, GPS coordinates
   - Confidence threshold: 0.3

2. **Content Structure** (`extractContentStructure()`):
   - Site title, description, business description
   - Hero sections, key features, galleries
   - Page content hierarchy
   - Confidence threshold: 0.3

3. **Social Proof** (`extractSocialProof()`):
   - Testimonials with author/rating/text
   - Services list
   - FAQs (question/answer pairs)
   - Product categories
   - Footer content

4. **Image Extraction** (`extractImages()`):
   - Hero/banner images
   - Gallery images
   - Product images
   - Categorization + metadata (alt text, dimensions)

5. **Social Media** (`extractSocialMedia()`):
   - Platform-specific link extraction
   - Handle identification
   - Profile URL validation

**Parallel Execution:**
```typescript
const phase2Results = await Promise.allSettled([
  extractContactInfo(...),
  extractContentStructure(...),
  extractSocialProof(...),
  extractImages(...),
  extractSocialMedia(...)
]);

// Failed phases logged but don't prevent others
```

### Prompt Engineering Patterns

**System Prompt Structure:**
```typescript
const SYSTEM_PROMPT = `
You are an expert [domain specialist].

Extract [specific data] from website HTML with these priorities:
PRIORITY 1: [most important data]
PRIORITY 2: [secondary data]
PRIORITY 3: [tertiary data]

Return JSON matching this schema:
${JSON.stringify(responseSchema, null, 2)}
`;
```

**User Prompt Builder:**
```typescript
function buildUserPrompt(html: string, url: string): string {
  return `
Website URL: ${url}

HTML Content:
\`\`\`html
${html}
\`\`\`

Extraction Instructions:
1. [Step-by-step instructions]
2. [Prioritized checklist]
3. [Examples of edge cases]

Return JSON with confidence score (0-1).
  `.trim();
}
```

### Image Extraction: LLM-First Philosophy

**Why LLM Over Regex:**
- Website builders constantly change HTML structure
- LLM understands context (hero vs gallery vs product)
- No builder-specific code needed
- Handles CSS variables (`--bg-img-src`, responsive variants)
- Detects backgrounds, img tags, picture elements, data attributes

**LLM Approach:**
- Send HTML blocks to LLM for analysis
- LLM returns structured JSON with URLs, types, context
- Handles all builders automatically (Squarespace, Wix, WordPress, custom)

**Fallback Strategy:**
- Algorithmic extraction available but not actively maintained
- Used only if LLM fails completely
- Fallback enabled via `EXTRACTION_FLAGS.ENABLE_FALLBACK`

### HTML Preprocessing Strategies

**For Image Extraction** (`preprocessHtmlForImageExtraction()`):
- Preserves: HTML structure, style attributes, CSS vars, img tags
- Removes: Scripts, verbose text, non-visual elements
- Prioritizes: Hero/banner selectors
- Size limit: 10KB

**For Visual Analysis** (`preprocessHtmlForVision()`):
- Strips text, keeps structure for visual context
- Preserves: Semantic tags, classes, style attributes
- Prioritizes: Headers, footers (logo locations)
- Size limit: 10KB

**For Text Extraction** (`preprocessHtmlForText()`):
- Extracts clean text with structural markers
- Removes: Navigation, headers, scripts, ads
- Preserves: Semantic hints (`[HERO SECTION - PROMINENT]`)
- Size limit: 15KB

### Error Handling & Resilience

**Layered Failure Handling:**
1. **Per-phase errors**: Caught, logged, don't cascade
2. **Minimum data check**: Requires 2 of 3 categories (contact/branding/content)
3. **Fallback decision**: If insufficient, use algorithmic fallback (if enabled)
4. **Graceful degradation**: Return partial results with warnings

**Confidence-Driven Quality:**
```typescript
const hasMinimumBrandData = (data: BrandAnalysisResult): boolean => {
  return (
    data.confidence >= CONFIDENCE_THRESHOLDS.BRAND_COLORS &&
    (data.colors.primary?.length > 0 || data.logo.url)
  );
};
```

### Adding New Extraction Types

**Step-by-Step Pattern:**

1. **Create prompt file**: `src/lib/scraping/prompts/{feature}-extraction-prompt.ts`
   ```typescript
   export const SYSTEM_PROMPT = `You are an expert...`;
   export function buildUserPrompt(html: string, url: string): string {
     return `...`;
   }
   ```

2. **Define schema**: Add to `src/lib/types/extraction-schemas.ts`
   ```typescript
   export interface NewFeatureResult {
     data: {...};
     confidence: number;
   }

   export function hasMinimumNewFeatureData(data: NewFeatureResult): boolean {
     return data.confidence >= 0.3 && data.data.field;
   }
   ```

3. **Add extraction function**: In `src/lib/scraping/llm-extractor.ts`
   ```typescript
   async function extractNewFeature(
     html: string,
     url: string
   ): Promise<NewFeatureResult> {
     const systemPrompt = NEW_FEATURE_SYSTEM_PROMPT;
     const userPrompt = buildNewFeatureUserPrompt(html, url);

     const response = await generateWithOpenRouter({
       model: 'grok-code-fast-1',
       systemPrompt,
       userPrompt,
       maxTokens: 3000,
       temperature: 0.2
     });

     return JSON.parse(response);
   }
   ```

4. **Add to Phase 2 parallel execution**:
   ```typescript
   const phase2Results = await Promise.allSettled([
     extractContactInfo(...),
     extractContentStructure(...),
     extractSocialProof(...),
     extractImages(...),
     extractSocialMedia(...),
     extractNewFeature(...)  // Add here
   ]);
   ```

5. **Merge results**: Update `mergeExtractionResults()` to include new data

## Development Workflows

### Local Development Setup

```bash
# Start local Supabase (PostgreSQL, Auth, Storage)
pnpm supabase:start

# Start Next.js dev server (port 3001)
pnpm dev

# Or start all services together
pnpm dev:all

# Generate TypeScript types from database schema
pnpm generate-types
```

### Quality Checks

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Type coverage (target: >95%)
pnpm type-coverage
pnpm type-coverage:report  # Detailed report

# Run all tests
pnpm test:all
```

### Database Migrations

```bash
# Create new migration
pnpm supabase:migration:new migration_name

# Apply migrations locally
pnpm supabase:migrate

# Generate types after schema changes
pnpm generate-types
```

### Deployment

```bash
# Deploy to staging
pnpm deploy:staging

# Deploy to production
pnpm deploy:production

# Railway-specific deploy
pnpm railway:deploy
```

## Common Development Patterns

### Creating New Features

**When adding new functionality:**

1. **Check existing patterns first**: Search codebase for similar features
2. **Leverage Supabase features**: Use RLS, RPC functions, triggers before external deps
3. **Follow multi-tenant isolation**: Always filter by `site_id`
4. **Use generated types**: Import from `@/lib/database/types`
5. **Handle errors consistently**: Use `handleError()` utility
6. **Test type coverage**: Ensure >95% coverage maintained

### Adding New API Routes

**Pattern:**
```typescript
// app/api/feature/route.ts
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/types/api';
import { handleError } from '@/lib/types/error-handling';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return apiError('Unauthorized', 401);
    }

    // Get site context from headers
    const siteId = request.headers.get('x-site-id');
    if (!siteId) {
      return apiError('Site context required', 400);
    }

    // Query with RLS (automatically filtered by site)
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('site_id', siteId);

    if (error) {
      return apiError(error.message, 500);
    }

    return apiSuccess(data);
  } catch (error: unknown) {
    const handledError = handleError(error);
    return apiError(handledError.message, 500);
  }
}
```

### Creating Custom Hooks

**Pattern:**
```typescript
// src/hooks/useFeature.ts
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { handleError } from '@/lib/types/error-handling';
import type { Tables } from '@/lib/database/types';

type FeatureData = Tables<'table_name'>;

export function useFeature(siteId: string) {
  const [data, setData] = useState<FeatureData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('table_name')
        .select('*')
        .eq('site_id', siteId);

      if (error) throw error;
      setData(data);
    } catch (err: unknown) {
      setError(handleError(err));
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh };
}
```

### Adding Shadcn/UI Components

```bash
# Add new component from shadcn/ui
npx shadcn-ui@latest add component-name

# Component added to src/components/ui/
# Import and use:
import { ComponentName } from '@/components/ui/component-name';
```

### Database Query Patterns

**With RLS (recommended):**
```typescript
// RLS automatically filters by site based on user's site_memberships
const { data } = await supabase
  .from('content')
  .select('*')
  .eq('site_id', siteId)
  .eq('is_published', true);
```

**With joins:**
```typescript
const { data } = await supabase
  .from('content')
  .select(`
    *,
    sites!inner(subdomain, custom_domain),
    profiles!content_author_id_fkey(username, avatar_url)
  `)
  .eq('site_id', siteId);
```

**With RPC functions:**
```typescript
const { data } = await supabase
  .rpc('get_site_analytics', {
    site_id: siteId,
    start_date: startDate,
    end_date: endDate
  });
```

## Key Architectural Decisions

### Why Custom Hooks Over TanStack Query

**Rationale:**
- Smaller bundle size (no external dependency)
- Direct Supabase integration (no adapter layer)
- Built-in localStorage persistence
- AbortController support for request cancellation
- Simpler API for team members to understand
- Easier to customize for specific needs

**Trade-offs:**
- Less feature-rich than TanStack Query
- No advanced features (prefetching, optimistic updates)
- Manual cache invalidation
- Team maintains custom code

### Why Middleware-First Site Resolution

**Rationale:**
- Domain resolution happens once at edge (not per-route)
- Enables Redis/memory caching for performance
- Consistent site context across all routes
- Server Components can read headers synchronously
- Reduces database queries (cached lookups)

**Trade-offs:**
- Complex middleware logic (~1000 lines)
- Debugging requires understanding middleware flow
- Adds latency to ALL requests (mitigated by caching)

### Why LLM-First Scraping

**Rationale:**
- Website builders constantly change (no maintenance burden)
- LLM understands context (hero vs gallery images)
- Self-healing as models improve
- No builder-specific code (Squarespace, Wix, WordPress agnostic)
- Handles edge cases automatically

**Trade-offs:**
- LLM API costs (~$0.001 per page)
- Latency (20-30 seconds per site)
- Non-deterministic results (confidence scores help)
- Requires fallback for failures

### Why Row-Level Security (RLS)

**Rationale:**
- Enforces multi-tenant isolation at database level
- Cannot be bypassed by application bugs
- Consistent security model across all queries
- Audit-friendly (PostgreSQL logs)
- Reduces application-layer authorization code

**Trade-offs:**
- Complex policy debugging
- Performance overhead (policy evaluation on every query)
- Migrations require careful policy updates
- Service role needed for admin operations

## Security Best Practices

### Multi-Tenant Data Isolation

**Always filter by site_id:**
```typescript
// Good
const { data } = await supabase
  .from('content')
  .select('*')
  .eq('site_id', siteId);

// Bad - exposes all sites
const { data } = await supabase
  .from('content')
  .select('*');
```

### Authentication Checks

**Server-side:**
```typescript
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return apiError('Unauthorized', 401);
}
```

**Client-side:**
```typescript
const { user } = useAuth();
if (!user) {
  redirect('/login');
}
```

### RLS Policy Testing

**Test policies with different roles:**
```sql
-- Test as anonymous user
SET request.jwt.claims TO '{}';
SELECT * FROM sites;

-- Test as authenticated user
SET request.jwt.claims TO '{"sub": "user-uuid"}';
SELECT * FROM sites;

-- Test as admin
SET request.jwt.claims TO '{"sub": "admin-uuid", "role": "admin"}';
SELECT * FROM sites;
```

### CORS & Headers

**API routes should validate origin:**
```typescript
const origin = request.headers.get('origin');
const allowedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL,
  'https://blooms.cc',
  'https://*.blooms.cc'
];

if (!allowedOrigins.some(allowed => origin?.includes(allowed))) {
  return apiError('Forbidden', 403);
}
```

## Performance Optimization

### Caching Strategies

**Site resolution caching:**
- Redis in production (preferred)
- Memory cache in development (fallback)
- TTL-based invalidation (configurable)
- Cache key format: `{type}:{value}`

**Component-level caching:**
```typescript
// React cache() for SSR deduplication
import { cache } from 'react';

export const getUser = cache(async () => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});
```

### Database Query Optimization

**Use indexes for common queries:**
```sql
CREATE INDEX idx_content_site_published ON content(site_id, published_at DESC)
WHERE is_published = true;

CREATE INDEX idx_products_site_active ON products(site_id, is_active)
WHERE is_active = true;
```

**Batch queries with select joins:**
```typescript
// Good - single query
const { data } = await supabase
  .from('content')
  .select('*, sites!inner(subdomain)')
  .eq('site_id', siteId);

// Bad - N+1 queries
const content = await getContent();
const sites = await Promise.all(
  content.map(c => getSite(c.site_id))
);
```

### Bundle Size Optimization

**Dynamic imports for heavy components:**
```typescript
import dynamic from 'next/dynamic';

const HeavyEditor = dynamic(
  () => import('@/components/content-editor/HeavyEditor'),
  { loading: () => <Skeleton />, ssr: false }
);
```

**Tree-shaking unused UI components:**
```typescript
// Good - only imports what you need
import { Button } from '@/components/ui/button';

// Bad - imports entire library
import * as UI from '@/components/ui';
```

## Testing Patterns

### Unit Testing Components

```typescript
import { render, screen } from '@testing-library/react';
import { SiteHeader } from '@/components/layout/SiteHeader';

describe('SiteHeader', () => {
  it('renders site name', () => {
    const site = { id: '1', name: 'Test Site' };
    render(<SiteHeader site={site} />);
    expect(screen.getByText('Test Site')).toBeInTheDocument();
  });
});
```

### Testing Custom Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useProducts } from '@/hooks/useProducts';

describe('useProducts', () => {
  it('fetches products for site', async () => {
    const { result } = renderHook(() => useProducts('site-id'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toHaveLength(3);
  });
});
```

### Integration Testing

```typescript
import { test, expect } from '@playwright/test';

test('user can create new page', async ({ page }) => {
  await page.goto('/dashboard/content');
  await page.click('text=New Page');
  await page.fill('[name="title"]', 'Test Page');
  await page.click('button[type="submit"]');

  await expect(page.locator('text=Test Page')).toBeVisible();
});
```

## Troubleshooting Common Issues

### Site Context Not Available

**Problem**: `useSite()` returns null
**Solution**: Ensure request goes through middleware and headers are set

```typescript
// Check middleware is running:
console.log('Headers:', Object.fromEntries(headers()));

// Verify site ID:
const siteId = headers().get('x-site-id');
console.log('Site ID:', siteId);
```

### RLS Policy Blocking Query

**Problem**: Query returns empty despite data existing
**Solution**: Check RLS policies and user's site_memberships

```sql
-- Verify user has membership
SELECT * FROM site_memberships
WHERE user_id = 'user-uuid' AND site_id = 'site-uuid';

-- Check RLS policy
SELECT * FROM pg_policies WHERE tablename = 'content';
```

### Type Generation Issues

**Problem**: Generated types out of sync
**Solution**: Regenerate types after migrations

```bash
# Stop Supabase
pnpm supabase:stop

# Start fresh
pnpm supabase:start

# Run migrations
pnpm supabase:migrate

# Regenerate types
pnpm generate-types
```

### Middleware Redirect Loop

**Problem**: Infinite redirects in middleware
**Solution**: Check skip conditions and redirect logic

```typescript
// Ensure skip conditions are correct:
if (pathname.startsWith('/api/')) return; // Skip API
if (pathname.startsWith('/_next/')) return; // Skip assets
if (pathname === '/login') return; // Skip auth pages
```

## When to Use This Skill

Use this skill when:

1. **Implementing new features** - Reference existing patterns and conventions
2. **Debugging multi-tenant issues** - Understand site resolution and RLS
3. **Adding database tables** - Follow schema conventions and RLS patterns
4. **Creating API routes** - Use established authentication and error handling
5. **Building new components** - Follow UI patterns and state management
6. **Extending web scraper** - Add new LLM extraction phases
7. **Optimizing performance** - Apply caching and query optimization strategies
8. **Reviewing architecture** - Understand design decisions and trade-offs
9. **Onboarding new developers** - Learn project structure and conventions
10. **Making architectural decisions** - Evaluate alignment with existing patterns

## Quick Reference

### Key Files

- **Middleware**: `app/middleware.ts` (~1000 lines)
- **Database Types**: `src/lib/database/types.ts` (generated)
- **Site Context**: `src/contexts/SiteContext.tsx`
- **Auth Context**: `src/contexts/AuthContext.tsx`
- **LLM Extractor**: `src/lib/scraping/llm-extractor.ts`
- **Supabase Client**: `src/lib/supabase/client.ts`

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# OpenRouter (LLM scraping)
OPENROUTER_API_KEY=...

# Redis (optional, for caching)
REDIS_URL=...

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### Useful Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm dev:all                # Start all services

# Quality
pnpm lint                   # Run ESLint
pnpm typecheck              # Type checking
pnpm type-coverage          # Check coverage
pnpm test:all               # Run all tests

# Database
pnpm supabase:start         # Start local Supabase
pnpm supabase:migrate       # Run migrations
pnpm generate-types         # Generate types

# Deployment
pnpm deploy:staging         # Deploy to staging
pnpm deploy:production      # Deploy to production
```

---

This skill represents the complete architectural knowledge of the Brands in Blooms platform. Reference it for all development decisions to ensure consistency with established patterns and best practices.
