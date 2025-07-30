# Domain-Based Site Routing Implementation Plan

## Overview

This plan outlines the implementation of domain-based site routing for the Brands in Blooms platform. The feature allows site owners to connect custom domains to their sites, enabling visitors to access site-specific content through their own domains (e.g., `mycoffeshop.com` or `bakery.blooms.cc`).

## Current State Analysis

### ✅ Existing Foundation
- **Database Schema**: Well-designed multi-tenant architecture with `sites` table supporting both `subdomain` and `custom_domain` fields
- **Authentication**: Robust Supabase authentication with role-based access control
- **Next.js 15**: Modern App Router architecture with TypeScript
- **Multi-tenancy**: Site isolation via `site_id` with proper RLS policies
- **UI Components**: Domain configuration interface already exists in settings

### ❌ Missing Components
- Domain resolution middleware
- Site context provider
- Dynamic site-based routing
- Updated database types
- Site-specific homepage rendering

## Implementation Milestones

---

## 🎯 Milestone 1: Database Types & Site Context Foundation

**Goal**: Update database types and create site context infrastructure

### Tasks:
1. **Regenerate Database Types**
   - Generate complete TypeScript types from updated database schema
   - Update `src/lib/database/types.ts` to include all tables (sites, site_memberships, content, etc.)
   - Verify type safety across existing queries

2. **Create Site Context Provider**
   - Implement `SiteContext` with current site data and loading states
   - Create `useSite()` hook for accessing site context
   - Handle site loading, error states, and caching
   - Support site switching for multi-site owners

3. **Site Resolution Utilities**
   - Create `resolveSiteFromHost()` function to extract domain/subdomain
   - Implement `getSiteByDomain()` and `getSiteBySubdomain()` database queries
   - Add site validation and error handling utilities

**Files to Create/Modify:**
- `src/lib/database/types.ts` (update)
- `src/contexts/SiteContext.tsx` (new)
- `src/hooks/useSite.ts` (new)
- `src/lib/site/resolution.ts` (new)
- `src/lib/site/queries.ts` (new)

**Acceptance Criteria:**
- All database tables have proper TypeScript types
- Site context provides current site data across the application
- Site resolution utilities work for both subdomains and custom domains
- Error handling for invalid/non-existent domains

---

## 🎯 Milestone 2: Domain Resolution Middleware

**Goal**: Implement middleware to handle incoming requests and resolve sites based on Host header

### Tasks:
1. **Enhanced Middleware Implementation**
   - Extend existing `src/middleware.ts` to handle domain resolution
   - Extract domain/subdomain from `Host` header
   - Query database to find matching site
   - Set site context in request headers/cookies for downstream use

2. **Request Context Management**
   - Store resolved site ID in secure cookies/headers
   - Handle site-not-found scenarios with appropriate error pages
   - Implement caching for site resolution to reduce database queries
   - Add request logging for debugging domain resolution

3. **Development Environment Support**
   - Handle localhost development with query parameters or special subdomains
   - Support testing multiple sites locally
   - Environment-specific domain handling configuration

**Files to Create/Modify:**
- `src/middleware.ts` (update)
- `src/lib/site/middleware-utils.ts` (new)
- `src/lib/cache/site-cache.ts` (new)
- `next.config.js` (update for domain handling)

**Acceptance Criteria:**
- Middleware correctly resolves sites from both custom domains and subdomains
- Invalid domains show appropriate error pages
- Site resolution is cached for performance
- Development environment properly supports multi-site testing
- Secure handling of site context between requests

---

## 🎯 Milestone 3: Dynamic Site-Based Application Structure

**Goal**: Restructure Next.js application to support site-specific content and routing

### Tasks:
1. **Site-Aware App Structure**
   - Create new app directory structure to support site-specific routing
   - Implement site-specific layouts and components
   - Update root layout to include site context provider
   - Handle site-specific metadata and SEO

2. **Site Homepage Implementation**
   - Create dynamic site homepage component
   - Implement "Welcome to $siteName" functionality as specified
   - Support future expansion to customizable homepages
   - Add proper error boundaries for site-specific content

3. **Navigation and Routing Updates**
   - Update navigation components to be site-aware
   - Implement site-specific route generation
   - Handle cross-site navigation and redirects
   - Update all internal links to maintain site context

**Files to Create/Modify:**
- `app/layout.tsx` (update)
- `app/page.tsx` (update for site-specific homepage)
- `src/components/layout/SiteLayout.tsx` (new)
- `src/components/site/SiteHomepage.tsx` (new)
- `src/components/navigation/SiteAwareNavigation.tsx` (update)
- `src/lib/routing/site-routes.ts` (new)

**Acceptance Criteria:**
- Application loads correctly for any valid domain/subdomain
- Site homepage displays "Welcome to $siteName" message
- All navigation remains within the current site context
- Proper error handling for sites without homepages
- SEO metadata reflects site-specific information

---

## 🎯 Milestone 4: Site Management Dashboard Integration

**Goal**: Integrate domain management features with the existing dashboard

### Tasks:
1. **Domain Configuration Interface**
   - Update existing domain settings UI to handle live domain changes
   - Add domain verification workflow for custom domains
   - Implement subdomain availability checking
   - Add DNS configuration guidance for custom domains

2. **Multi-Site Management**
   - Add site switching functionality for users with multiple sites
   - Update dashboard to show current site context
   - Implement site-specific data isolation in dashboard queries
   - Add site creation workflow

3. **Site Preview and Testing**
   - Add "Preview Site" functionality from dashboard
   - Implement site testing tools for domain configuration
   - Add domain health monitoring and status indicators

**Files to Create/Modify:**
- `app/dashboard/settings/domains/page.tsx` (update)
- `src/components/site/DomainConfiguration.tsx` (update)
- `src/components/site/SiteSwitcher.tsx` (new)
- `src/components/site/SitePreview.tsx` (new)
- `src/lib/site/domain-verification.ts` (new)

**Acceptance Criteria:**
- Users can configure both subdomains and custom domains
- Domain changes take effect immediately
- Multi-site owners can switch between sites seamlessly
- Dashboard shows clear site context and domain status
- Preview functionality works correctly

---

## 🎯 Milestone 5: Performance, Security & Production Readiness

**Goal**: Optimize performance, implement security measures, and prepare for production deployment

### Tasks:
1. **Performance Optimization**
   - Implement site resolution caching with appropriate TTL
   - Add CDN configuration for multi-domain support
   - Optimize database queries with proper indexing
   - Implement site-specific static file serving

2. **Security Implementation**
   - Add CSRF protection for multi-domain setup
   - Implement proper CORS handling for custom domains
   - Add rate limiting per domain/site
   - Security headers optimization for custom domains

3. **Monitoring and Logging**
   - Add site-specific analytics and monitoring
   - Implement domain resolution error tracking
   - Add performance monitoring for multi-site queries
   - Create debugging tools for domain issues

4. **Production Deployment**
   - Update deployment configuration for multi-domain support
   - Add domain verification and SSL certificate handling
   - Configure production environment variables
   - Create deployment verification checklist

**Files to Create/Modify:**
- `src/lib/cache/redis-site-cache.ts` (new)
- `src/lib/security/multi-domain-security.ts` (new)
- `src/lib/monitoring/site-analytics.ts` (new)
- `middleware.ts` (update for production optimizations)
- `next.config.js` (update for production domain handling)
- `vercel.json` or equivalent deployment config (update)

**Acceptance Criteria:**
- Site resolution performance is optimized with sub-100ms response times
- All security best practices are implemented
- Comprehensive monitoring and logging is in place
- Production deployment supports unlimited custom domains
- SSL certificates are properly managed for custom domains

---

## Technical Architecture

### Request Flow
```
1. Request arrives → middleware.ts
2. Extract domain from Host header
3. Query sites table for matching domain/subdomain
4. Set site context in request
5. Render site-specific content
6. Return response with site branding/content
```

### Database Queries
```sql
-- Subdomain resolution
SELECT * FROM sites WHERE subdomain = $1 AND deleted_at IS NULL;

-- Custom domain resolution  
SELECT * FROM sites WHERE custom_domain = $1 AND deleted_at IS NULL;
```

### Site Context Structure
```typescript
interface SiteContextType {
  site: Site | null
  loading: boolean
  error: Error | null
  refreshSite: () => Promise<void>
  isOwner: boolean
  canEdit: boolean
}
```

## Environment Variables Required

```bash
# Existing variables remain the same
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# New variables for domain handling
NEXT_PUBLIC_APP_DOMAIN=blooms.cc
NEXT_PUBLIC_SUBDOMAIN_SUFFIX=.blooms.cc
```

## Testing Strategy

1. **Unit Tests**: Site resolution utilities, context providers
2. **Integration Tests**: Middleware domain handling, database queries
3. **E2E Tests**: Full domain-to-homepage flow
4. **Performance Tests**: Site resolution under load
5. **Security Tests**: Multi-domain security validation

## Deployment Considerations

1. **DNS Configuration**: Wildcard DNS for subdomains (*.blooms.cc)
2. **SSL Certificates**: Automatic SSL for custom domains
3. **CDN Setup**: Multi-domain CDN configuration
4. **Database**: Connection pooling for multi-tenant queries
5. **Monitoring**: Domain-specific error tracking and performance monitoring

## Success Metrics

- ✅ Any valid domain/subdomain loads the correct site homepage
- ✅ Site resolution performance < 100ms
- ✅ Zero data leakage between sites
- ✅ Seamless custom domain setup experience
- ✅ 99.9% uptime for domain resolution
- ✅ Support for unlimited sites per platform

---

## Implementation Notes

- **No Placeholders**: All milestones include complete implementation
- **Zero TODOs**: Each milestone delivers production-ready functionality  
- **Incremental**: Each milestone builds on the previous while remaining functional
- **Site-First**: Architecture prioritizes site context throughout the application
- **Performance**: Caching and optimization built into every layer
- **Security**: Multi-tenant security considerations addressed from the start