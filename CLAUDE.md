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

## Current Branch: feat/site-domains
Working on domain-based site routing implementation with site context and domain verification.

## File Structure
- `app/` - Next.js App Router pages
- `src/components/` - React components
- `src/lib/` - Utilities and database logic  
- `src/contexts/` - React contexts
- `supabase/` - Database migrations and config

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