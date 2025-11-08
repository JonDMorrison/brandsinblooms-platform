# Brands in Blooms Platform

Multi-tenant website builder platform with domain-based site routing.

## Tech Stack
- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript
- **Backend**: Supabase (auth, database, realtime)
- **UI**: shadcn/ui + Tailwind CSS + next-themes
- **State**: TanStack Query + React Hook Form
- **Testing**: Jest + Testing Library
- **Deployment**: Railway + automated scripts

## Architecture
- **Multi-tenant**: Sites isolated by domains in `sites` table
- **Auth**: Row-level security (RLS) with Supabase Auth
- **Routing**: Domain-based site resolution via middleware
- **Database**: PostgreSQL with auto-generated TypeScript types

## Key Commands
```bash
# Development
pnpm dev              # Start dev server (port 3001)
pnpm dev:all          # Start with all services

# Database
pnpm supabase:start   # Start local Supabase
pnpm generate-types   # Generate DB types

# Quality
pnpm lint             # ESLint
pnpm typecheck        # TypeScript check
pnpm test:all         # Run all tests
pnpm type-coverage    # Check type coverage (target: >95%)
pnpm type-coverage:report # Detailed type coverage report

# Deployment
pnpm deploy:staging   # Deploy to staging
pnpm deploy:production # Deploy to production
```

## Database Schema
- `auth.users` → `public.profiles` (1:1)
- `sites` → `profiles` (many:1)
- `content` → `sites` (many:1)
- Domain verification via `site_domains` table

## Database Seed Data

### Overview
The database is seeded with **Soul Bloom Sanctuary**, a complete plant store with realistic product data for local development.

**Seed File**: `supabase/seeds/local-dev-seed.sql` (local development only - excluded from production)
**Reset Command**: `pnpm supabase:reset`

### Default Users (password: `password123`)
```
Admin User:
- Email: admin@test.com
- Role: admin
- Access: Site owner

Owner User:
- Email: owner@test.com
- Role: site_owner
- Access: Site owner

Regular User:
- Email: user@test.com
- Role: user
- Access: Site viewer
```

### Soul Bloom Sanctuary Site
- **Subdomain**: `soul-bloom-sanctuary`
- **Local URL**: `http://soul-bloom-sanctuary.blooms.local:3001`
- **Site ID**: `aaaaaaaa-bbbb-cccc-dddd-111111111111`

### Seeded Data
- **5 Product Categories**: Indoor Plants, Outdoor Plants, Succulents & Cacti, Herbs, Plant Care
- **18 Products**: Complete with SKUs, pricing, care instructions, ratings, inventory
- **5 Content Pages**: Home, About, Contact, Privacy Policy, Terms of Service
- **Design Settings**: Pre-configured theme with plant-themed colors and typography
- **Social Media**: Example Instagram and Facebook links

### Maintaining Seed Data
When you update the site content or products, update `supabase/seeds/local-dev-seed.sql` to keep it in sync:
1. Edit the seed file with your changes
2. Run `pnpm supabase:reset` to apply changes
3. Commit the updated seed file

**Important**: The seed file is for local development only. It is excluded from production deployments via the Dockerfile to prevent data loss. Production databases receive migrations only, preserving existing data.

## Current Branch: feat/site-domains
Working on domain-based site routing implementation with site context and domain verification.

## File Structure
- `app/` - Next.js App Router pages
- `src/components/` - React components
- `src/lib/` - Utilities and database logic
- `src/contexts/` - React contexts
- `supabase/` - Database migrations and config

## Scraping Strategy

### LLM-Based Extraction (Primary Approach)
The scraper uses a **multi-phase LLM approach via OpenRouter** for all content extraction. This handles diverse website builders automatically without code updates.

**Phase 1: Visual Analysis** (Vision Model: `grok-2-vision`)
- Brand colors, logos, design tokens
- Uses vision model with page screenshots when available

**Phase 2: Parallel Text Extraction** (Text Model: `grok-code-fast-1`)
- 2A: Contact information (emails, phones, addresses)
- 2B: Content structure (headlines, features, descriptions)
- 2C: Social proof (testimonials, reviews)
- 2D: **Image extraction** (hero images, galleries, product images)

All Phase 2 extractions run **in parallel** for optimal performance.

### Adding New Extraction Types

When adding new scraping capabilities, **ALWAYS use LLM extraction**:

1. **Create dedicated prompt** in `src/lib/scraping/prompts/{feature}-extraction-prompt.ts`
   - System prompt with extraction rules
   - User prompt builder function
   - Clear instructions for the model

2. **Define response schema** in `src/lib/types/extraction-schemas.ts`
   - TypeScript interface for LLM response
   - Include confidence scores
   - Validate responses match schema

3. **Add extraction function** to Phase 2 in `src/lib/scraping/llm-extractor.ts`
   - Follow pattern of existing Phase 2 functions
   - Include error handling and retries
   - Merge results into `ExtractedBusinessInfo`

4. **Run in parallel** with other Phase 2 extractions
   - Add to `Promise.allSettled()` array
   - Handle graceful failure (don't break other extractions)

### Image Extraction Approach

**Primary:** Send HTML blocks to LLM for analysis
- LLM identifies images in ALL forms (backgrounds, CSS vars, img tags, picture elements)
- Returns structured JSON with URLs, types, context, and metadata
- Handles Squarespace, Wix, WordPress, custom builders automatically

**Fallback:** Algorithmic extraction only if LLM fails
- Kept for backward compatibility
- Not actively maintained

**Why LLM vs Regex:**
- Website builders constantly change HTML structure
- LLM understands context and intent
- No builder-specific code needed
- Self-healing as models improve

### Cost & Performance
- Per-page extraction: ~$0.001 (all phases combined)
- Phase 2 runs in parallel (no added latency)
- Typical scrape time: 20-30 seconds for 10 pages

## Development Principles
- When implementing new features, always consider leaning on supabase's features first instead of introducing external dependencies

## Development Tools
- When implementing features, you can use a peer reviewer, or brainstorming co-agent named gemini. You can use the bash command `gemini -y -p "prompt"`. Gemini is a coding agent like you, but with a broader context -- so it's useful for getting summaries of or answering questions about entire directories or larger files.

## Type Safety Standards
- **No `any` usage**: All new code must avoid `any` types
- **Use `unknown` with type guards**: For dynamic data, use `unknown` and proper type checking
- **Leverage generated types**: Use `Tables<'table_name'>` from `@/lib/database/types`
- **Error handling**: Use `catch (error: unknown)` with the `handleError` utility
- **Run checks before commits**: 
  - `pnpm lint` - Must pass with no errors
  - `pnpm typecheck` - Must pass
  - `pnpm type-coverage` - Target: >95% coverage
- **Common patterns**:
  - Error handling: `import { handleError } from '@/lib/types/error-handling'`
  - API types: `import { apiSuccess, apiError, ApiResult } from '@/lib/types/api'`
  - Database types: `import { Tables, TablesInsert, TablesUpdate } from '@/lib/database/types'`
- After completing a prompt, restart the dev servers to ensure changes have taken affect