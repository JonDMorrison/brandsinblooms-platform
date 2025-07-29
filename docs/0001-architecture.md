# Architecture Decision Record: Supabase Starter Stack

## Status
Accepted

## Context
This document defines the architectural decisions and technology stack for our internal Supabase Starter template. The goal is to create a robust, scalable, and maintainable foundation for new projects that allows for rapid development while maintaining production-quality standards.

## Decision

### Core Stack

#### Frontend
- **Framework**: React 19 with TypeScript
- **Framework**: Next.js 15 (for server-side rendering and optimal performance)
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v4 with tailwindcss-animate
- **UI Components**: shadcn/ui (Radix UI primitives with Tailwind styling)
- **State Management**: React Context API (lightweight, built-in solution)

#### Backend & Database
- **Platform**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Database**: PostgreSQL 15+ (via Supabase)
- **API**: Auto-generated REST and GraphQL APIs from Supabase
- **Edge Functions**: Supabase Edge Functions (Deno runtime)
- **Authentication**: Supabase Auth with MFA support

#### Development Environment
- **Package Manager**: pnpm (fast, efficient disk usage)
- **Local Development**: Supabase CLI for local Supabase stack
- **Type Safety**: TypeScript with auto-generated database types
- **Linting**: ESLint with TypeScript plugin
- **Testing**: Jest with React Testing Library

#### Deployment & Infrastructure
- **Frontend Hosting**: Railway (containerized deployment)
- **Backend**: Supabase Cloud (managed PostgreSQL + services)
- **CI/CD**: Custom deployment scripts with health checks and rollback
- **Monitoring**: Built-in health monitoring and deployment status

### Architecture Patterns

#### Frontend Architecture
```
src/
├── main.tsx                 # Application entry point
├── App.tsx                  # Root component with routing
├── pages/                   # Route-based page components
├── components/              
│   ├── ui/                 # shadcn/ui components
│   └── [feature]/          # Feature-specific components
├── contexts/               # React Context providers
├── hooks/                  # Custom React hooks
├── lib/                    
│   ├── supabase/          # Supabase client configuration
│   ├── database/          # Auto-generated types
│   ├── auth/              # Authentication utilities
│   └── utils/             # Shared utilities
└── [feature]/             # Feature modules (optional)
```

#### Database Architecture
- **Row Level Security (RLS)**: Mandatory on all tables
- **Audit Columns**: created_at, updated_at, created_by, updated_by
- **Migrations**: Sequential, versioned SQL files
- **Type Generation**: Automated from database schema
- **Indexes**: Performance-optimized for common queries

#### Authentication Flow
1. Client-side auth with Supabase Auth
2. JWT tokens stored in localStorage
3. Automatic token refresh
4. RLS policies enforce data access
5. Optional MFA support

#### Development Workflow
1. Local development with Supabase CLI
2. Database changes via migrations
3. Type generation from schema
4. Fast refresh with Vite
5. Automated testing before deployment

### Key Principles

1. **Type Safety First**: Everything is TypeScript, with types generated from the source of truth (database schema)
2. **Developer Experience**: Fast feedback loops, hot reloading, clear error messages
3. **Production Ready**: Built-in auth, security, monitoring, and deployment automation
4. **Scalable Architecture**: Clear separation of concerns, modular structure
5. **Modern Tooling**: Latest stable versions of all dependencies

### Trade-offs

#### Pros
- Rapid development with batteries included
- Type safety from database to UI
- Excellent developer experience
- Production-ready from day one
- Managed infrastructure reduces DevOps burden

#### Cons
- Vendor lock-in with Supabase (mitigated by PostgreSQL standard)
- Learning curve for Supabase-specific patterns
- Supabase CLI requirement for local development
- Limited to PostgreSQL (not a con for most use cases)

## Consequences

### Positive
- Consistent architecture across all projects
- Reduced time to production
- Lower maintenance burden
- Built-in best practices (security, performance)
- Easy onboarding for new developers

### Negative
- Requires Supabase CLI for local development
- Supabase-specific knowledge required
- May be overkill for simple static sites

### Neutral
- Opinionated structure (good for consistency, less flexibility)
- Fixed technology choices (stability vs bleeding edge)

## References
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [React Router](https://reactrouter.com)
- [Tailwind CSS](https://tailwindcss.com)